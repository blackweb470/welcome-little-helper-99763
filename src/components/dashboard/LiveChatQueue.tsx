import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, User, Clock, CheckCircle, Send, ArrowLeft, Check, CheckCheck, Sparkles, MessageCircle, Phone, Reply, ImagePlus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { requestNotificationPermission, notifyNewMessage } from "@/utils/notifications";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { WhatsAppInteractiveButtons, type InteractiveMessage } from "./WhatsAppInteractiveButtons";

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
  read_at: string | null;
  read_by: string | null;
  audio_url?: string | null;
}

interface ChatSession {
  id: string;
  conversation_id: string;
  agent_id: string | null;
  status: string;
  queued_at: string | null;
  accepted_at: string | null;
  transfer_reason: string | null;
  created_at: string;
}

interface Conversation {
  id: string;
  channel: string;
  channel_metadata: any;
  visitor_id: string | null;
  visitor_name: string | null;
}

interface LiveChatQueueProps {
  businessId: string;
}

export const LiveChatQueue = ({ businessId }: LiveChatQueueProps) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionConversations, setSessionConversations] = useState<Record<string, Conversation>>({});
  const [agentStatus, setAgentStatus] = useState<string>('offline');
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [acceptingChat, setAcceptingChat] = useState<string | null>(null);
  const [endingChat, setEndingChat] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [cannedResponsesOpen, setCannedResponsesOpen] = useState(false);
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(false);
  const [interactiveOpen, setInteractiveOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const agentImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAgentImage, setUploadingAgentImage] = useState(false);

  // Fetch canned responses
  const { data: cannedResponses } = useQuery({
    queryKey: ['canned-responses', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('canned_responses')
        .select('*')
        .eq('business_id', businessId)
        .order('usage_count', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    fetchSessions();
    fetchAgentStatus();
    
    // Request notification permission
    requestNotificationPermission();

    const channel = supabase
      .channel('live-chat-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_sessions'
        },
        (payload) => {
          fetchSessions();
          const session = payload.new as any;
          // Trigger notification when a new chat request comes in
          if (session.status === 'queued' && session.conversation_id) {
            notifyNewMessage(
              businessId, 
              session.conversation_id, 
              session.transfer_reason || 'A visitor wants to speak with a live agent'
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_chat_sessions'
        },
        () => fetchSessions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId]);

  const fetchSessions = async () => {
    try {
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, channel, channel_metadata, visitor_id, visitor_name')
        .eq('business_id', businessId);

      if (!conversations) return;

      const conversationIds = conversations.map(c => c.id);
      
      // Store conversation data for reference
      const convMap: Record<string, Conversation> = {};
      conversations.forEach(c => { convMap[c.id] = c; });
      setSessionConversations(convMap);

      const { data, error } = await supabase
        .from('live_chat_sessions')
        .select('*')
        .in('conversation_id', conversationIds)
        .in('status', ['queued', 'active'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('agent_availability')
        .select('status')
        .eq('user_id', user.id)
        .eq('business_id', businessId)
        .maybeSingle();

      if (data) setAgentStatus(data.status);
    } catch (error) {
      console.error('Error fetching agent status:', error);
    }
  };

  const updateAgentStatus = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('agent_availability')
        .upsert({
          user_id: user.id,
          business_id: businessId,
          status: newStatus,
          last_activity_at: new Date().toISOString()
        }, { onConflict: 'user_id,business_id' });

      if (error) throw error;
      setAgentStatus(newStatus);

      toast({
        title: "Status updated",
        description: `You are now ${newStatus}`
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const acceptChat = async (sessionId: string) => {
    try {
      setAcceptingChat(sessionId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to accept chats",
          variant: "destructive"
        });
        return;
      }

      console.log('Accepting chat session:', sessionId, 'User:', user.id);
      
      const { data, error } = await supabase
        .from('live_chat_sessions')
        .update({
          agent_id: user.id,
          status: 'active',
          accepted_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('Error accepting chat:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to accept chat",
          variant: "destructive"
        });
        return;
      }

      console.log('Chat session updated successfully:', data);

      // Broadcast agent_joined event so the visitor sees it instantly
      // (postgres_changes on live_chat_sessions may not reach anonymous visitors due to RLS)
      try {
        const sessionForBroadcast = sessions.find(s => s.id === sessionId);
        const conversationIdForBroadcast = sessionForBroadcast?.conversation_id || data?.conversation_id;
        if (conversationIdForBroadcast) {
          const joinChannel = supabase.channel(`visitor-messages-${conversationIdForBroadcast}`);
          await new Promise<void>((resolve) => {
            joinChannel.subscribe((status) => {
              if (status === 'SUBSCRIBED') resolve();
            });
            setTimeout(() => resolve(), 1500);
          });
          await joinChannel.send({
            type: 'broadcast',
            event: 'agent_joined',
            payload: {
              sessionId,
              conversationId: conversationIdForBroadcast,
              agentId: user.id,
              acceptedAt: new Date().toISOString(),
            },
          });
        }
      } catch (broadcastErr) {
        console.error('Failed to broadcast agent_joined:', broadcastErr);
      }

      // Find the session and open it automatically
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        // Update local state
        const updatedSession = { ...session, ...data };
        setMessages([]);
        setSelectedSession(updatedSession);
        setSelectedConversation(sessionConversations[session.conversation_id] || null);
        fetchMessages(session.conversation_id);
      }

      toast({
        title: "Chat accepted",
        description: "You can now respond to the customer"
      });
      
      // Refresh sessions list
      await fetchSessions();
    } catch (error: any) {
      console.error('Error accepting chat:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept chat",
        variant: "destructive"
      });
    } finally {
      setAcceptingChat(null);
    }
  };

  const endChat = async (sessionId: string) => {
    try {
      setEndingChat(sessionId);
      const { error } = await supabase
        .from('live_chat_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Clear state when ending chat
      setSelectedSession(null);
      setSelectedConversation(null);
      setMessages([]);
      setMessageInput("");
      fetchSessions();

      toast({
        title: "Chat ended",
        description: "Conversation returned to AI"
      });
    } catch (error) {
      console.error('Error ending chat:', error);
      toast({
        title: "Error",
        description: "Failed to end chat",
        variant: "destructive"
      });
    } finally {
      setEndingChat(null);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      // Mark all user messages as read by agent
      if (user && data) {
        const unreadUserMessages = data.filter(m => m.role === 'user' && !m.read_at);
        if (unreadUserMessages.length > 0) {
          await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString(), read_by: user.id })
            .in('id', unreadUserMessages.map(m => m.id));
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedSession) return;

    try {
      setSendingMessage(true);
      const { data: { user } } = await supabase.auth.getUser();
      const conversation = selectedConversation || sessionConversations[selectedSession.conversation_id];
      
      // Check if this is a WhatsApp conversation
      if (conversation?.channel === 'whatsapp') {
        // Send via WhatsApp API
        const { data, error } = await supabase.functions.invoke('whatsapp-send-message', {
          body: {
            businessId: businessId,
            conversationId: selectedSession.conversation_id,
            message: messageInput.trim()
          }
        });

        if (error) {
          console.error('Error sending WhatsApp message:', error);
          throw error;
        }

        toast({
          title: "Message sent",
          description: "Your message has been delivered via WhatsApp"
        });
      } else {
        // Send via regular database insert
        const messageContent = messageInput.trim();
        const { data: insertedMessage, error } = await supabase
          .from('messages')
          .insert({
            conversation_id: selectedSession.conversation_id,
            role: 'assistant',
            content: messageContent
          })
          .select('id, content, role, created_at')
          .single();

        if (error) {
          console.error('Error inserting message:', error);
          throw error;
        }

        // Broadcast to visitor (bypasses RLS — visitor can't SELECT messages directly)
        try {
          const broadcastChannel = supabase.channel(`visitor-messages-${selectedSession.conversation_id}`);
          await broadcastChannel.subscribe();
          await broadcastChannel.send({
            type: 'broadcast',
            event: 'agent_message',
            payload: {
              id: insertedMessage?.id,
              content: messageContent,
              role: 'assistant',
              created_at: insertedMessage?.created_at,
            },
          });
          await supabase.removeChannel(broadcastChannel);
        } catch (broadcastErr) {
          console.error('Broadcast to visitor failed:', broadcastErr);
        }

        toast({
          title: "Message sent",
          description: "Your message has been delivered"
        });
      }

      setMessageInput("");
      await fetchMessages(selectedSession.conversation_id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Send interactive WhatsApp message
  const sendInteractiveMessage = async (interactive: InteractiveMessage) => {
    if (!selectedSession) return;

    try {
      setSendingMessage(true);
      const conversation = selectedConversation || sessionConversations[selectedSession.conversation_id];
      
      if (conversation?.channel !== 'whatsapp') {
        toast({
          title: "Not supported",
          description: "Interactive messages are only available for WhatsApp conversations",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('whatsapp-send-message', {
        body: {
          businessId: businessId,
          conversationId: selectedSession.conversation_id,
          interactive
        }
      });

      if (error) {
        console.error('Error sending interactive message:', error);
        throw error;
      }

      setInteractiveOpen(false);
      toast({
        title: "Message sent",
        description: `Interactive ${interactive.type === 'quick_reply' ? 'quick reply' : 'list'} message delivered`
      });

      await fetchMessages(selectedSession.conversation_id);
    } catch (error) {
      console.error('Error sending interactive message:', error);
      toast({
        title: "Error",
        description: "Failed to send interactive message",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleViewChat = (session: ChatSession) => {
    // Clear previous messages before loading new conversation
    setMessages([]);
    setSelectedSession(session);
    setSelectedConversation(sessionConversations[session.conversation_id] || null);
    fetchMessages(session.conversation_id);
  };

  // Real-time subscription for messages in selected session
  useEffect(() => {
    if (!selectedSession) return;

    const channel = supabase
      .channel(`messages-${selectedSession.conversation_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedSession.conversation_id}`
        },
        async (payload) => {
          await fetchMessages(selectedSession.conversation_id);
          const newMessage = payload.new as Message;
          
          // Trigger notification for new user messages
          if (newMessage.role === 'user') {
            notifyNewMessage(businessId, selectedSession.conversation_id, newMessage.content);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedSession]);

  const queuedSessions = sessions.filter(s => s.status === 'queued');
  const activeSessions = sessions.filter(s => s.status === 'active');

  // Get AI suggestions based on conversation context
  const getAISuggestions = async () => {
    if (!selectedSession) return;
    
    try {
      setLoadingSuggestions(true);
      
      // Get last few messages for context
      const recentMessages = messages.slice(-5);
      const context = recentMessages.map(m => `${m.role}: ${m.content}`).join('\n');
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      
      // Calculate sentiment
      const userMessages = messages.filter(m => m.role === 'user');
      const sentiment = userMessages.length > 0 
        ? userMessages[userMessages.length - 1]?.content.toLowerCase().includes('frustrated') || 
          userMessages[userMessages.length - 1]?.content.toLowerCase().includes('angry')
          ? 'frustrated' 
          : 'neutral'
        : 'neutral';
      
      const { data, error } = await supabase.functions.invoke('ai-assist', {
        body: {
          action: 'suggest_response',
          context,
          lastMessage: lastUserMessage?.content || '',
          sentiment
        }
      });
      
      if (error) throw error;
      
      if (data?.responses && Array.isArray(data.responses)) {
        // Normalize: AI may return strings or objects like { response: "..." }
        const normalized: string[] = data.responses
          .map((r: any) => {
            if (typeof r === 'string') return r;
            if (r && typeof r === 'object') {
              return r.response || r.text || r.content || r.message || JSON.stringify(r);
            }
            return String(r ?? '');
          })
          .filter((s: string) => s && s.trim().length > 0);
        setAiSuggestions(normalized);
        setAiSuggestionsOpen(true);
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to get AI suggestions",
        variant: "destructive"
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // If viewing a chat, show the chat interface
  if (selectedSession) {
    return (
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="border-b flex-shrink-0">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedSession(null);
                  setSelectedConversation(null);
                }}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              {selectedConversation?.channel === 'whatsapp' ? (
                <MessageCircle className="w-5 h-5 text-green-500" />
              ) : (
                <MessageSquare className="w-5 h-5" />
              )}
              <span>
                {selectedConversation?.channel === 'whatsapp' ? 'WhatsApp Chat' : 'Active Chat'}
              </span>
              {selectedConversation?.channel === 'whatsapp' && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                  <Phone className="w-3 h-3 mr-1" />
                  {selectedConversation.channel_metadata?.phone_number || 
                   selectedConversation.visitor_id?.replace('whatsapp_', '')}
                </Badge>
              )}
            </div>
            <Button
              onClick={() => {
                endChat(selectedSession.id);
                setSelectedSession(null);
                setSelectedConversation(null);
              }}
              size="sm"
              variant="outline"
              disabled={endingChat === selectedSession.id}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {endingChat === selectedSession.id ? "Ending..." : "End Chat"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-muted'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    {msg.audio_url && /\.(jpe?g|png|gif|webp)$/i.test(msg.audio_url) && (
                      <img
                        src={msg.audio_url}
                        alt="Shared image"
                        className="max-w-full max-h-64 rounded-md mb-1 object-contain cursor-pointer"
                        onClick={() => window.open(msg.audio_url!, '_blank')}
                      />
                    )}
                    {msg.content && <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>}
                    <div className="flex items-center gap-2 text-xs opacity-70 mt-1">
                      <span>{new Date(msg.created_at).toLocaleTimeString()}</span>
                      {msg.role === 'assistant' && (
                        <span className="flex items-center gap-1">
                          {msg.read_at ? (
                            <CheckCheck className="w-3 h-3" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          <div className="border-t p-4 flex-shrink-0 bg-background">
            {sendingMessage && (
              <div className="mb-2 flex justify-end">
                <div className="bg-muted rounded-lg px-3 py-1">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Popover open={cannedResponsesOpen} onOpenChange={setCannedResponsesOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    type="button"
                    disabled={sendingMessage}
                    title="Canned Responses"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 z-50" align="start" side="top" sideOffset={8}>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Canned Responses</h4>
                    <ScrollArea className="h-[200px]">
                      {cannedResponses?.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No canned responses yet</p>
                      ) : (
                        <div className="space-y-2">
                          {cannedResponses?.map((response: any) => (
                            <button
                              key={response.id}
                              onClick={async () => {
                                setMessageInput(response.content);
                                setCannedResponsesOpen(false);
                                
                                // Increment usage count
                                await supabase
                                  .from('canned_responses')
                                  .update({ usage_count: response.usage_count + 1 })
                                  .eq('id', response.id);
                              }}
                              className="w-full text-left p-2 rounded hover:bg-accent transition-colors"
                            >
                              <div className="font-medium text-sm">{response.title}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {response.content}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Popover open={aiSuggestionsOpen} onOpenChange={(open) => {
                setAiSuggestionsOpen(open);
                if (open && aiSuggestions.length === 0 && !loadingSuggestions) {
                  getAISuggestions();
                }
              }}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    type="button"
                    disabled={sendingMessage}
                    title="AI Suggestions"
                  >
                    <Sparkles className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-96 z-50 bg-popover text-popover-foreground border shadow-lg p-3"
                  align="start"
                  side="top"
                  sideOffset={8}
                  collisionPadding={16}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h4 className="font-medium text-sm">AI Suggested Responses</h4>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          getAISuggestions();
                        }}
                        disabled={loadingSuggestions}
                      >
                        {loadingSuggestions ? 'Generating…' : 'Refresh'}
                      </Button>
                    </div>
                    {loadingSuggestions && aiSuggestions.length === 0 ? (
                      <div className="py-6 text-center">
                        <Sparkles className="w-5 h-5 text-primary mx-auto mb-2 animate-pulse" />
                        <p className="text-sm text-muted-foreground">Generating suggestions…</p>
                      </div>
                    ) : aiSuggestions.length === 0 ? (
                      <div className="py-6 text-center">
                        <p className="text-sm text-muted-foreground">No suggestions yet. Click Refresh to generate.</p>
                      </div>
                    ) : (
                      <ScrollArea className="max-h-[280px] pr-2">
                        <div className="space-y-2">
                          {aiSuggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setMessageInput(suggestion);
                                setAiSuggestionsOpen(false);
                              }}
                              className="w-full text-left p-3 rounded-md border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              <div className="flex items-start gap-2">
                                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                                  {idx + 1}
                                </div>
                                <div className="text-sm flex-1 text-popover-foreground whitespace-pre-wrap break-words">
                                  {suggestion}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Interactive Messages Button - Only for WhatsApp */}
              {selectedConversation?.channel === 'whatsapp' && (
                <Popover open={interactiveOpen} onOpenChange={setInteractiveOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      type="button"
                      disabled={sendingMessage}
                      title="Interactive Messages"
                    >
                      <Reply className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96" align="start" side="top">
                    <WhatsAppInteractiveButtons
                      onSend={sendInteractiveMessage}
                      disabled={sendingMessage}
                    />
                  </PopoverContent>
                </Popover>
              )}
              
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !sendingMessage && sendMessage()}
                placeholder="Type your message..."
                className="flex-1"
                disabled={sendingMessage}
              />
              <Button onClick={sendMessage} disabled={!messageInput.trim() || sendingMessage}>
                {sendingMessage ? 'Sending...' : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Live Chat Queue
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={agentStatus === 'online' ? 'default' : 'outline'}
              onClick={() => updateAgentStatus(agentStatus === 'online' ? 'offline' : 'online')}
              disabled={updatingStatus}
            >
              {updatingStatus ? 'Updating...' : (agentStatus === 'online' ? 'Go Offline' : 'Go Online')}
            </Button>
            <Badge variant={agentStatus === 'online' ? 'default' : 'secondary'}>
              {agentStatus}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Queued Chats */}
          <div>
            <h3 className="font-semibold mb-3">Waiting ({queuedSessions.length})</h3>
            <div className="space-y-3">
              {queuedSessions.length === 0 ? (
                <p className="text-muted-foreground text-sm">No chats waiting</p>
              ) : (
                queuedSessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {sessionConversations[session.conversation_id]?.channel === 'whatsapp' ? (
                          <MessageCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <MessageSquare className="w-4 h-4 text-primary" />
                        )}
                        <div>
                          <p className="font-medium">
                            {sessionConversations[session.conversation_id]?.channel === 'whatsapp' 
                              ? 'WhatsApp Request' 
                              : 'Chat Request'}
                          </p>
                          {session.transfer_reason && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Reason: {session.transfer_reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {sessionConversations[session.conversation_id]?.channel === 'whatsapp' && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                            WhatsApp
                          </Badge>
                        )}
                        <Badge variant="outline">Queued</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Clock className="w-4 h-4" />
                      {session.queued_at && new Date(session.queued_at).toLocaleTimeString()}
                    </div>
                    <Button 
                      onClick={() => acceptChat(session.id)}
                      disabled={agentStatus !== 'online' || acceptingChat === session.id}
                      size="sm"
                      className="w-full"
                    >
                      {acceptingChat === session.id ? 'Accepting...' : 'Accept Chat'}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Chats */}
          <div>
            <h3 className="font-semibold mb-3">Active ({activeSessions.length})</h3>
            <div className="space-y-3">
              {activeSessions.length === 0 ? (
                <p className="text-muted-foreground text-sm">No active chats</p>
              ) : (
                activeSessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4 bg-primary/5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {sessionConversations[session.conversation_id]?.channel === 'whatsapp' ? (
                          <MessageCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <MessageSquare className="w-4 h-4 text-primary" />
                        )}
                        <div>
                          <p className="font-medium">
                            {sessionConversations[session.conversation_id]?.channel === 'whatsapp' 
                              ? 'WhatsApp Chat' 
                              : 'Active Chat'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Started: {session.accepted_at && new Date(session.accepted_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {sessionConversations[session.conversation_id]?.channel === 'whatsapp' && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                            WhatsApp
                          </Badge>
                        )}
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleViewChat(session)}
                        size="sm"
                        className="flex-1"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        View Chat
                      </Button>
                      <Button 
                        onClick={() => endChat(session.id)}
                        size="sm"
                        variant="outline"
                        disabled={endingChat === session.id}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {endingChat === session.id ? 'Ending...' : 'End'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
