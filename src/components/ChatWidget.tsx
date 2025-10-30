import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageCircle, X, Minimize2 } from "lucide-react";
import VoiceInterface from "./VoiceInterface";
import { supabase } from "@/integrations/supabase/client";

interface ChatWidgetProps {
  businessId: string;
}

export const ChatWidget = ({ businessId }: ChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [transcript, setTranscript] = useState<Array<{ text: string; role: "user" | "assistant" }>>([]);
  const [proactiveShown, setProactiveShown] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [liveChatSession, setLiveChatSession] = useState<any>(null);
  const [textInput, setTextInput] = useState("");
  const [sendMessageFn, setSendMessageFn] = useState<((text: string) => Promise<void>) | null>(null);
  const [isTextMode, setIsTextMode] = useState(true); // Default to text mode
  const [showEscalateButton, setShowEscalateButton] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("widget_settings")
        .select("*")
        .eq("business_id", businessId)
        .single();
      
      if (data) setSettings(data);
    };

    fetchSettings();
    checkProactiveRules();
  }, [businessId]);

  // Fetch current live chat session status
  const fetchLiveChatSession = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('live_chat_sessions')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        console.log('Fetched live chat session:', data);
        setLiveChatSession(data);
      }
    } catch (error) {
      console.error('Error fetching live chat session:', error);
    }
  };

  // Fetch live chat session when conversationId is set
  useEffect(() => {
    if (conversationId) {
      fetchLiveChatSession(conversationId);
    }
  }, [conversationId]);

  // Real-time subscription for live chat session updates
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`live-chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_chat_sessions',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Live chat session updated:', payload);
          if (payload.new) {
            setLiveChatSession(payload.new);
            
            // Notify visitor when agent accepts
            const newStatus = (payload.new as any).status;
            const oldStatus = (payload.old as any)?.status;
            if (newStatus === 'active' && oldStatus === 'queued') {
              handleTranscript('An agent has joined the chat!', 'assistant');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('New message received:', payload);
          // Only show messages from assistant that we haven't sent ourselves
          const newMessage = payload.new as any;
          if (newMessage.role === 'assistant') {
            // Check if this message is already in transcript to avoid duplicates
            const isDuplicate = transcript.some(
              msg => msg.text === newMessage.content && msg.role === 'assistant'
            );
            if (!isDuplicate) {
              handleTranscript(newMessage.content, 'assistant');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, transcript]);

  const initializeTextConversation = async () => {
    try {
      const visitorId = localStorage.getItem('visitor_id') || 'anonymous';
      
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .insert({
          business_id: businessId,
          visitor_id: visitorId,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (convError) throw convError;
      if (convData) {
        setConversationId(convData.id);
      }
    } catch (error) {
      console.error('Error initializing text conversation:', error);
    }
  };

  const checkProactiveRules = async () => {
    if (proactiveShown) return;

    try {
      const { data: rules } = await supabase
        .from('proactive_chat_rules')
        .select('*')
        .eq('business_id', businessId)
        .eq('enabled', true)
        .order('priority', { ascending: false });

      if (!rules || rules.length === 0) return;

      // Check time on page trigger
      const timeRule = rules.find(r => r.trigger_type === 'time_on_page');
      if (timeRule) {
        const triggerValue = timeRule.trigger_value as { seconds?: number };
        setTimeout(() => {
          if (!isOpen && !proactiveShown) {
            setIsOpen(true);
            setProactiveShown(true);
            handleTranscript(timeRule.message, 'assistant');
          }
        }, (triggerValue?.seconds || 30) * 1000);
      }
    } catch (error) {
      console.error('Error checking proactive rules:', error);
    }
  };

  const requestLiveAgent = async (reason: string) => {
    try {
      const visitorId = localStorage.getItem('visitor_id') || 'anonymous';
      
      const response = await fetch(
        `https://rgczbabidcqvpyiiqjfv.supabase.co/functions/v1/request-live-agent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            businessId: businessId,
            visitorId: visitorId,
            conversationId: conversationId,
            reason: reason
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Live agent request error:', response.status, errorText);
        throw new Error(`Service error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.session) {
        setLiveChatSession(data.session);
        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
        }
        handleTranscript('Your request has been sent to our team. An agent will join shortly.', 'assistant');
      } else {
        throw new Error('Failed to create live chat session');
      }
    } catch (error) {
      console.error('Error requesting live agent:', error);
      handleTranscript('Sorry, unable to connect to a live agent right now. Please try again.', 'assistant');
    }
  };

  const handleTranscript = (text: string, role: "user" | "assistant") => {
    setTranscript(prev => [...prev, { text, role }]);
  };

  const handleSendText = async () => {
    if (!textInput.trim()) return;

    const message = textInput.trim();
    setTextInput("");
    
    // Add to transcript immediately
    handleTranscript(message, "user");
    
    try {
      const visitorId = localStorage.getItem('visitor_id') || `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('visitor_id', visitorId);

      console.log('Sending message to chat-message function');
      
      const response = await fetch(
        `https://rgczbabidcqvpyiiqjfv.supabase.co/functions/v1/chat-message`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            businessId: businessId,
            visitorId: visitorId,
            message: message
          })
        }
      );

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Chat message error:', response.status, errorText);
        throw new Error(`Service error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response received:', data);

      if (data.reply) {
        handleTranscript(data.reply, "assistant");
        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
        }
        if (data.shouldEscalate) {
          setShowEscalateButton(true);
        }
      } else {
        throw new Error('No reply from AI');
      }
    } catch (error) {
      console.error('Error sending text message:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      handleTranscript(`Sorry, there was an error: ${errorMsg}`, 'assistant');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const primaryColor = settings?.primary_color || "#000000";
  const agentName = settings?.agent_name || "AI Assistant";
  const welcomeMessage = settings?.welcome_message || "Hi! How can I help you today?";

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-16 h-16 shadow-lg hover:scale-110 transition-transform"
          style={{ backgroundColor: primaryColor }}
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {!isMinimized ? (
        <Card className="w-96 shadow-2xl animate-in slide-in-from-bottom-5 bg-background">
          <CardHeader className="border-b p-4 bg-background" style={{ borderColor: primaryColor, borderBottomWidth: '2px' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {agentName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold">{agentName}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-muted-foreground">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(true)}
                  className="h-8 w-8"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="h-96 flex flex-col">
              {/* Welcome message */}
              {transcript.length === 0 && (
                <div className="p-4">
                  <div className="bg-muted/50 rounded-lg p-3 shadow-sm">
                    <p className="text-sm">{welcomeMessage}</p>
                  </div>
                </div>
              )}

              {/* Transcript */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {transcript.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        item.role === "user"
                          ? "text-white shadow-sm"
                          : "bg-muted"
                      }`}
                      style={item.role === "user" ? { backgroundColor: primaryColor } : {}}
                    >
                      <p className="text-sm">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Text and Voice interface */}
              <div className="border-t bg-background">
                {liveChatSession?.status === 'queued' && (
                  <div className="m-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                    <p className="font-medium text-yellow-800">Waiting for agent...</p>
                  </div>
                )}
                {liveChatSession?.status === 'active' && (
                  <div className="m-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                    <p className="font-medium text-green-800">Connected to agent</p>
                  </div>
                )}
                
                {/* Text Input - Primary */}
                <div className="px-4 pt-4 pb-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                    <Button
                      onClick={handleSendText}
                      disabled={!textInput.trim()}
                      size="sm"
                      style={{ backgroundColor: textInput.trim() ? primaryColor : undefined }}
                    >
                      Send
                    </Button>
                  </div>
                </div>

                {/* Voice Interface - Optional */}
                {settings?.voice_enabled && (
                  <div className="px-4 pb-4">
                    <VoiceInterface
                      businessId={businessId}
                      onTranscript={handleTranscript}
                      onConversationCreated={setConversationId}
                      onChatReady={setSendMessageFn}
                    />
                  </div>
                )}

                {!liveChatSession && !showEscalateButton && (
                  <div className="px-4 pb-4">
                    <Button
                      onClick={() => {
                        const msg = "I would like to speak to a live agent";
                        setTextInput(msg);
                        setTimeout(() => handleSendText(), 0);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Talk to Live Agent
                    </Button>
                  </div>
                )}
                
                {showEscalateButton && !liveChatSession && (
                  <div className="px-4 pb-4">
                    <Button
                      onClick={() => {
                        requestLiveAgent('AI determined escalation needed');
                        setShowEscalateButton(false);
                      }}
                      variant="default"
                      size="sm"
                      className="w-full"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Connect to Live Agent Now
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full w-16 h-16 shadow-lg"
          style={{ backgroundColor: primaryColor }}
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </Button>
      )}
    </div>
  );
};