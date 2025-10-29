import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { SentimentIndicator } from "./SentimentIndicator";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisitorContext } from "./VisitorContext";
import { AIAssist } from "./AIAssist";

interface ConversationsListProps {
  businessId: string;
}

export const ConversationsList = ({ businessId }: ConversationsListProps) => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (
            id,
            content,
            role,
            created_at,
            sentiment,
            sentiment_score,
            emotion_tags
          )
        `)
        .eq('business_id', businessId)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Calculate conversation sentiment
  const getConversationSentiment = (messages: any[]) => {
    const userMessages = messages?.filter(m => m.role === 'user' && m.sentiment) || [];
    if (userMessages.length === 0) return null;
    
    const avgScore = userMessages.reduce((sum, m) => sum + (m.sentiment_score || 0), 0) / userMessages.length;
    
    if (avgScore > 0.3) return { sentiment: 'positive', score: avgScore };
    if (avgScore < -0.7) return { sentiment: 'frustrated', score: avgScore };
    if (avgScore < -0.2) return { sentiment: 'negative', score: avgScore };
    return { sentiment: 'neutral', score: avgScore };
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="text-center text-muted-foreground">Loading...</div>
            ) : conversations?.length === 0 ? (
              <div className="text-center text-muted-foreground">No conversations yet</div>
            ) : (
              <div className="space-y-4">
                {conversations?.map((conversation) => {
                  const sentiment = getConversationSentiment(conversation.messages);
                  return (
                    <div 
                      key={conversation.id} 
                      className="border-b pb-4 last:border-0 cursor-pointer hover:bg-accent/50 p-2 rounded transition-colors"
                      onClick={() => setSelectedConversation(conversation.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            Visitor: {conversation.visitor_id || 'Anonymous'}
                          </span>
                          {sentiment && (
                            <SentimentIndicator 
                              sentiment={sentiment.sentiment} 
                              score={sentiment.score}
                              size="sm"
                            />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conversation.started_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {conversation.messages?.length || 0} messages
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conversation Details & AI Assist</DialogTitle>
          </DialogHeader>
          {selectedConversation && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <VisitorContext conversationId={selectedConversation} />
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {conversations?.find(c => c.id === selectedConversation)?.messages?.map((msg: any) => (
                          <div key={msg.id} className={`p-3 rounded ${msg.role === 'user' ? 'bg-primary/10' : 'bg-muted'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium capitalize">{msg.role}</span>
                              {msg.sentiment && (
                                <SentimentIndicator 
                                  sentiment={msg.sentiment}
                                  score={msg.sentiment_score}
                                  emotions={msg.emotion_tags}
                                  size="sm"
                                />
                              )}
                            </div>
                            <div className="text-sm">{msg.content}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(msg.created_at).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              <AIAssist conversationId={selectedConversation} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConversationsList;
