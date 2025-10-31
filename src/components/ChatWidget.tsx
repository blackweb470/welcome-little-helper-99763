import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageCircle, X, Minimize2 } from "lucide-react";
import VoiceInterface from "./VoiceInterface";
import { PreChatForm } from "./PreChatForm";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatWidgetProps {
  businessId: string;
}

export const ChatWidget = ({ businessId }: ChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [transcript, setTranscript] = useState<Array<{ text: string; role: "user" | "assistant" }>>([]);
  const [proactiveShown, setProactiveShown] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [liveChatSession, setLiveChatSession] = useState<any>(null);
  const [textInput, setTextInput] = useState("");
  const [sendMessageFn, setSendMessageFn] = useState<((text: string) => Promise<void>) | null>(null);
  const [isTextMode, setIsTextMode] = useState(true);
  const [showEscalateButton, setShowEscalateButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [visitorEmail, setVisitorEmail] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [showPreChatForm, setShowPreChatForm] = useState(false);
  const [visitorInfo, setVisitorInfo] = useState<any>({});

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("widget_settings")
        .select("*")
        .eq("business_id", businessId)
        .single();
      
      if (data) {
        setSettings(data);
        // Check if we should show pre-chat form
        if (data.pre_chat_enabled && !conversationId) {
          setShowPreChatForm(true);
        }
      }
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
        
        // Show agent joined message when status becomes active
        if (data.status === 'active' && liveChatSession?.status === 'queued') {
          console.log('Status changed from queued to active - agent joined!');
          handleTranscript('✅ You are now speaking with a live agent!', 'assistant');
        }
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

  // Poll for status updates when in queued state
  useEffect(() => {
    if (!conversationId || liveChatSession?.status !== 'queued') return;

    console.log('Starting polling for queued session');
    const pollInterval = setInterval(() => {
      console.log('Polling for session status update');
      fetchLiveChatSession(conversationId);
    }, 2000); // Poll every 2 seconds

    return () => {
      console.log('Stopping polling');
      clearInterval(pollInterval);
    };
  }, [conversationId, liveChatSession?.status]);

  // Real-time subscription for live chat session updates
  useEffect(() => {
    if (!conversationId) return;

    console.log('Setting up live chat session subscription for:', conversationId);

    const channel = supabase
      .channel(`live-chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_chat_sessions',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Live chat session UPDATE received:', payload);
          if (payload.new) {
            const newSession = payload.new as any;
            console.log('Updating liveChatSession state to:', newSession);
            setLiveChatSession(newSession);
            
            // Notify visitor when agent accepts
            if (newSession.status === 'active') {
              console.log('Agent has joined - status is now active');
              handleTranscript('An agent has joined the chat!', 'assistant');
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_sessions',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Live chat session INSERT received:', payload);
          if (payload.new) {
            const newSession = payload.new as any;
            console.log('New session created:', newSession);
            setLiveChatSession(newSession);
          }
        }
      )
      .subscribe((status) => {
        console.log('Live chat subscription status:', status);
      });

    return () => {
      console.log('Cleaning up live chat session subscription');
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
        async (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new as any;
          
          // Check if this message is already in transcript to avoid duplicates
          const isDuplicate = transcript.some(
            msg => msg.text === newMessage.content && msg.role === newMessage.role
          );
          
          if (!isDuplicate) {
            handleTranscript(newMessage.content, newMessage.role);
            
            // Mark message as read by visitor when received
            if (newMessage.role === 'assistant') {
              await supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('id', newMessage.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, transcript]);

  const initializeTextConversation = async (preChatData?: any) => {
    try {
      const visitorId = localStorage.getItem('visitor_id') || 'anonymous';
      
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .insert({
          business_id: businessId,
          visitor_id: visitorId,
          visitor_email: preChatData?.email || visitorEmail || null,
          visitor_name: preChatData?.name,
          visitor_phone: preChatData?.phone,
          visitor_company: preChatData?.company,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (convError) throw convError;
      if (convData) {
        setConversationId(convData.id);
        
        // If there's an initial message from pre-chat form, send it
        if (preChatData?.message) {
          setTimeout(() => {
            handleSendText(preChatData.message);
          }, 500);
        }
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
      // Show email input if not provided
      if (!visitorEmail) {
        setShowEmailInput(true);
        handleTranscript('Please provide your email so we can notify you when an agent joins.', 'assistant');
        return;
      }

      // Ensure we have a visitor ID
      let visitorId = localStorage.getItem('visitor_id');
      if (!visitorId) {
        visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('visitor_id', visitorId);
      }

      // Create conversation first if it doesn't exist
      let currentConvId = conversationId;
      if (!currentConvId) {
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .insert({
            business_id: businessId,
            visitor_id: visitorId,
            visitor_email: visitorEmail,
            started_at: new Date().toISOString()
          })
          .select()
          .single();

        if (convError) throw convError;
        if (convData) {
          currentConvId = convData.id;
          setConversationId(convData.id);
          console.log('Created conversation for live agent:', convData.id);
        }
      }
      
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
            conversationId: currentConvId,
            reason: reason,
            visitorEmail: visitorEmail
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Live agent request error:', response.status, errorText);
        throw new Error(`Service error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Live agent request response:', data);
      
      if (data.session) {
        setLiveChatSession(data.session);
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

  // Auto-scroll to bottom when transcript changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const handleSendText = async (messageOverride?: string) => {
    const message = messageOverride || textInput.trim();
    if (!message || sendingMessage) return;

    if (!messageOverride) setTextInput("");
    setSendingMessage(true);
    
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

      // Update conversation ID if returned
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      // If human agent is active, don't show AI response
      if (data.humanAgentActive) {
        console.log('Human agent is handling this conversation');
        return;
      }

      if (data.reply) {
        handleTranscript(data.reply, "assistant");
        if (data.shouldEscalate) {
          setShowEscalateButton(true);
        }
      } else if (!data.humanAgentActive) {
        throw new Error('No reply from AI');
      }
    } catch (error) {
      console.error('Error sending text message:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      handleTranscript(`Sorry, there was an error: ${errorMsg}`, 'assistant');
    } finally {
      setSendingMessage(false);
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

  return (
    <div className="w-full h-full flex flex-col">
      {!isMinimized ? (
        <Card className="w-full h-full shadow-2xl flex flex-col">
          <CardHeader className="border-b p-3 sm:p-4 bg-transparent" style={{ borderColor: primaryColor, borderBottomWidth: '2px' }}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div 
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base"
                style={{ backgroundColor: primaryColor }}
              >
                {agentName.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base">{agentName}</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0">
              {/* Pre-chat form */}
              {showPreChatForm ? (
                <div className="p-3 sm:p-4">
                  <PreChatForm
                    welcomeMessage={settings.pre_chat_welcome_message}
                    requiredFields={settings.pre_chat_required_fields || ['name', 'email']}
                    primaryColor={primaryColor}
                    onSubmit={async (data) => {
                      setVisitorInfo(data);
                      setVisitorEmail(data.email);
                      setShowPreChatForm(false);
                      await initializeTextConversation(data);
                    }}
                  />
                </div>
              ) : (
                <>
                  {/* Welcome message */}
                  {transcript.length === 0 && (
                    <div className="p-3 sm:p-4">
                      <div className="bg-muted/50 rounded-lg p-3 shadow-sm">
                        <p className="text-sm">{welcomeMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Transcript */}
                  <ScrollArea className="flex-1 p-3 sm:p-4">
                    <div className="space-y-2 sm:space-y-3">
                      {transcript.map((item, idx) => (
                        <div
                          key={idx}
                          className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-2.5 sm:p-3 ${
                              item.role === "user"
                                ? "text-white shadow-sm"
                                : "bg-muted"
                            }`}
                            style={item.role === "user" ? { backgroundColor: primaryColor } : {}}
                          >
                            <p className="text-sm leading-relaxed break-words">{item.text}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Text and Voice interface */}
                  <div className="border-t bg-background">
                    {liveChatSession?.status === 'queued' && liveChatSession?.status !== 'active' && (
                      <div className="m-3 sm:m-4 p-2.5 sm:p-3 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm">
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">⏳ Waiting for agent...</p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">An agent will join shortly</p>
                      </div>
                    )}
                    {liveChatSession?.status === 'active' && (
                      <div className="m-3 sm:m-4 p-2.5 sm:p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm">
                        <p className="font-medium text-green-800 dark:text-green-200">✅ You are speaking to an agent</p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">An agent has joined</p>
                      </div>
                    )}
                    
                    {/* Email Input */}
                    {showEmailInput && !visitorEmail && (
                      <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
                        <div className="flex flex-col gap-2">
                          <input
                            type="email"
                            value={visitorEmail}
                            onChange={(e) => setVisitorEmail(e.target.value)}
                            placeholder="Enter your email..."
                            className="flex-1 px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                          />
                          <Button
                            onClick={() => {
                              if (visitorEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visitorEmail)) {
                                setShowEmailInput(false);
                                requestLiveAgent('User requested live agent');
                              }
                            }}
                            disabled={!visitorEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visitorEmail)}
                            size="sm"
                            className="h-10 sm:h-9"
                            style={{ backgroundColor: visitorEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visitorEmail) ? primaryColor : undefined }}
                          >
                            Submit Email
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Voice Interface - MOVED BEFORE text input */}
                    {settings?.voice_enabled && (
                      <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2 border-b">
                        <VoiceInterface
                          businessId={businessId}
                          onTranscript={handleTranscript}
                          onConversationCreated={setConversationId}
                          onChatReady={setSendMessageFn}
                        />
                      </div>
                    )}
                    
                    {/* Text Input - MOVED AFTER voice interface */}
                    <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={textInput}
                          onChange={(e) => setTextInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type a message..."
                          maxLength={150}
                          className="flex-1 px-3 py-2.5 sm:py-2 text-base sm:text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                        />
                        <Button
                          onClick={() => handleSendText()}
                          disabled={!textInput.trim() || sendingMessage}
                          size="sm"
                          className="h-10 sm:h-9 px-3 sm:px-4"
                          style={{ backgroundColor: textInput.trim() && !sendingMessage ? primaryColor : undefined }}
                        >
                          {sendingMessage ? 'Sending...' : 'Send'}
                        </Button>
                      </div>
                    </div>

                    {!liveChatSession && !showEscalateButton && (
                      <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                        <Button
                          onClick={() => {
                            const msg = "I would like to speak to a live agent";
                            setTextInput(msg);
                            setTimeout(() => handleSendText(), 0);
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full h-10 sm:h-9"
                        >
                          Talk to Live Agent
                        </Button>
                      </div>
                    )}
                    
                    {showEscalateButton && !liveChatSession && (
                      <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                        <Button
                          onClick={() => {
                            requestLiveAgent('AI determined escalation needed');
                            setShowEscalateButton(false);
                          }}
                          variant="default"
                          size="sm"
                          className="w-full h-10 sm:h-9"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Connect to Live Agent Now
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full w-14 h-14 sm:w-16 sm:h-16 shadow-lg"
          style={{ backgroundColor: primaryColor }}
        >
          <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </Button>
      )}
    </div>
  );
};
