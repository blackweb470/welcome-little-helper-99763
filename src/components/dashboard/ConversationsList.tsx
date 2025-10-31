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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ConversationsListProps {
  businessId: string;
}

export const ConversationsList = ({ businessId }: ConversationsListProps) => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations', businessId, searchQuery, statusFilter, sentimentFilter],
    queryFn: async () => {
      // Use the search function if filters are applied
      if (searchQuery || statusFilter !== 'all' || sentimentFilter !== 'all') {
        const { data, error } = await supabase.rpc('search_conversations', {
          p_business_id: businessId,
          p_search_query: searchQuery || null,
          p_status: statusFilter !== 'all' ? statusFilter : null,
          p_sentiment: sentimentFilter !== 'all' ? sentimentFilter : null,
          p_start_date: null,
          p_end_date: null
        });

        if (error) throw error;

        // Fetch messages for each conversation
        const conversationsWithMessages = await Promise.all(
          data.map(async (conv: any) => {
            const { data: messages, error: msgError } = await supabase
              .from('messages')
              .select('id, content, role, created_at, sentiment, sentiment_score, emotion_tags')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: true });

            if (msgError) throw msgError;
            return { ...conv, messages };
          })
        );

        return conversationsWithMessages;
      }

      // Default query without filters
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

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSentimentFilter("all");
  };

  const activeFiltersCount = [
    searchQuery,
    statusFilter !== 'all',
    sentimentFilter !== 'all'
  ].filter(Boolean).length;

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
          <div className="flex items-center justify-between">
            <CardTitle>Recent Conversations</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showFilters && (
            <div className="mb-4 space-y-3 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone, company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sentiment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sentiments</SelectItem>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                    <SelectItem value="frustrated">Frustrated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          )}

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
                            {conversation.visitor_name || conversation.visitor_email || conversation.visitor_id || 'Anonymous'}
                          </span>
                          {sentiment && (
                            <SentimentIndicator 
                              sentiment={sentiment.sentiment} 
                              score={sentiment.score}
                              size="sm"
                            />
                          )}
                          {conversation.status && (
                            <Badge variant="outline" className="text-xs">
                              {conversation.status}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conversation.started_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center justify-between">
                        <span>{conversation.messages?.length || 0} messages</span>
                        {conversation.visitor_company && (
                          <span className="text-xs">{conversation.visitor_company}</span>
                        )}
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
