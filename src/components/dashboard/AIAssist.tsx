import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Lightbulb, AlertCircle, TrendingUp, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIAssistProps {
  conversationId: string;
  readOnly?: boolean;
}

export const AIAssist = ({ conversationId, readOnly = false }: AIAssistProps) => {
  const { toast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: messages } = useQuery({
    queryKey: ['conversation-messages', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    }
  });

  const { data: suggestions, refetch: generateSuggestions } = useQuery({
    queryKey: ['ai-suggestions', conversationId],
    queryFn: async () => {
      if (!messages || messages.length === 0) return null;

      const lastUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0];
      const conversationContext = messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n');

      const { data, error } = await supabase.functions.invoke('ai-assist', {
        body: {
          action: 'suggest_response',
          context: conversationContext,
          lastMessage: lastUserMessage?.content || '',
          sentiment: lastUserMessage?.sentiment || 'neutral'
        }
      });

      if (error) throw error;
      return data;
    },
    enabled: false
  });

  const { data: insights, isLoading: isInsightsLoading, refetch: generateInsights } = useQuery({
    queryKey: ['ai-insights', conversationId],
    queryFn: async () => {
      if (!messages || messages.length === 0) return null;

      const conversationText = messages.map(m => `${m.role}: ${m.content}`).join('\n');

      const { data, error } = await supabase.functions.invoke('ai-assist', {
        body: {
          action: 'generate_insights',
          conversation: conversationText
        }
      });

      if (error) throw error;
      return data;
    },
    enabled: false // Don't auto-fetch, wait for user click
  });

  const handleGenerateSuggestions = async () => {
    setIsGenerating(true);
    try {
      await generateSuggestions();
      toast({
        title: "Suggestions generated",
        description: "AI has generated response suggestions"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate suggestions",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({
      title: "Copied!",
      description: "Response copied to clipboard"
    });
  };

  const lastUserMessage = messages?.filter(m => m.role === 'user').slice(-1)[0];
  const needsEscalation = lastUserMessage?.sentiment === 'frustrated';

  return (
    <div className="space-y-4">
      {/* Escalation Alert */}
      {!readOnly && needsEscalation && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Escalation Recommended
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The customer appears frustrated. Consider escalating to a human agent or offering additional support options.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Suggested Responses */}
      {!readOnly && (
        <Card>
          <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI-Suggested Responses
            </CardTitle>
            <Button 
              size="sm" 
              onClick={handleGenerateSuggestions}
              disabled={isGenerating || !messages || messages.length === 0}
            >
              {isGenerating ? "Generating..." : "Generate"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!suggestions && !isGenerating && (
            <p className="text-sm text-muted-foreground">
              Click generate to get AI-powered response suggestions
            </p>
          )}
          {Array.isArray(suggestions?.responses) && suggestions.responses.map((r: any, index: number) => {
            const responseText = typeof r === 'string' ? r : r?.response || JSON.stringify(r);
            const tone = typeof r === 'object' && r?.tone ? r.tone : null;

            return (
              <div key={index} className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    {tone && <Badge variant="outline" className="text-xs">{tone}</Badge>}
                    <p className="text-sm">{responseText}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(responseText, index)}
                  >
                    {copiedIndex === index ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      )}

      {/* Conversation Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Conversation Insights
            </CardTitle>
            <Button 
              size="sm" 
              onClick={() => generateInsights()}
              disabled={isInsightsLoading || !messages || messages.length === 0}
            >
              {isInsightsLoading ? "Analyzing..." : "Analyze Chat"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights ? (
            <>
              <div>
                <h4 className="text-sm font-medium mb-2">Key Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(insights.topics) && insights.topics.map((topic: string, index: number) => (
                    <Badge key={index} variant="secondary">{topic}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Summary</h4>
                <p className="text-sm text-muted-foreground">{insights.summary}</p>
              </div>
              {insights.recommendations && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Recommendations
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {Array.isArray(insights.recommendations) && insights.recommendations.map((rec: string, index: number) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isInsightsLoading ? "Analyzing conversation..." : "Click Analyze Chat to extract key topics and a summary from this conversation."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
