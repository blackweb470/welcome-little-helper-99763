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
  const [agentTyping, setAgentTyping] = useState(false);
  const [requestingAgent, setRequestingAgent] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      // Only fetch public-safe fields (exclude system_prompt)
      const { data } = await supabase
        .from("widget_settings")
        .select("id, business_id, welcome_message, agent_name, primary_color, widget_position, voice_enabled, pre_chat_enabled, pre_chat_welcome_message, pre_chat_required_fields, max_input_characters")
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

    // Subscribe to widget_settings changes
    const channel = supabase
      .channel('widget-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'widget_settings',
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  // Subscribe to new messages in realtime
  useEffect(() => {
    if (!conversationId) return;

    console.log('Setting up realtime subscription for new messages');
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
          
          // Only show assistant messages (from agent) in the transcript
          if (newMessage.role === 'assistant') {
            setAgentTyping(false); // Clear typing indicator
            handleTranscript(newMessage.content, 'assistant');
            
            // Mark message as read by visitor
            await supabase
              .from('messages')
              .update({ 
                read_at: new Date().toISOString(),
                read_by: 'visitor'
              })
              .eq('id', newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up messages subscription');
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Subscribe to live chat session updates in realtime
  useEffect(() => {
    if (!conversationId) return;

    console.log('Setting up realtime subscription for session updates');
    const channel = supabase
      .channel(`live-chat-session-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_chat_sessions',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Live chat session updated:', payload);
          const updatedSession = payload.new as any;
          
          // Check if agent just joined (status changed to active)
          if (updatedSession.status === 'active' && liveChatSession?.status !== 'active') {
            console.log('Agent joined the chat!');
            handleTranscript('🎉 A human agent has joined the chat!', 'assistant');
          }
          
          setLiveChatSession(updatedSession);
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
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
      console.log('Checking proactive rules for business:', businessId);
      // @ts-ignore - Supabase type inference issue
      const result = await supabase
        .from('proactive_chat_rules')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true);

      if (result.error) {
        console.error('Error fetching proactive rules:', result.error);
        throw result.error;
      }

      const rules = result.data as any[];
      console.log('Proactive rules found:', rules);
      if (!rules || rules.length === 0) {
        console.log('No active proactive rules found');
        return;
      }

      // Check time on page trigger
      const timeRule = rules.find((r: any) => r.trigger_type === 'time_on_page');
      if (timeRule) {
        const triggerValue = timeRule.trigger_value as { seconds?: number };
        const timeoutSeconds = triggerValue?.seconds || 5;
        
        console.log(`Setting time trigger for ${timeoutSeconds} seconds`);
        setTimeout(() => {
          if (!proactiveShown) {
            console.log('Time trigger activated, opening chat');
            setIsOpen(true);
            setProactiveShown(true);
            handleTranscript(timeRule.message, 'assistant');
          }
        }, timeoutSeconds * 1000);
      }

      // Check specific page trigger immediately
      const pageRule = rules.find((r: any) => r.trigger_type === 'specific_page');
      if (pageRule) {
        const triggerValue = pageRule.trigger_value as { url?: string };
        const targetUrl = triggerValue?.url || '';
        
        console.log('Checking specific page trigger:', targetUrl, 'Current URL:', window.location.href);
        if (targetUrl && window.location.href.includes(targetUrl)) {
          console.log('Page trigger activated, opening chat');
          setIsOpen(true);
          setProactiveShown(true);
          handleTranscript(pageRule.message, 'assistant');
        }
      }

      // Check exit intent trigger
      const exitIntentRule = rules.find((r: any) => r.trigger_type === 'exit_intent');
      if (exitIntentRule) {
        const handleMouseLeave = (e: MouseEvent) => {
          if (e.clientY <= 0 && !proactiveShown) {
            console.log('Exit intent detected, opening chat');
            setIsOpen(true);
            setProactiveShown(true);
            handleTranscript(exitIntentRule.message, 'assistant');
            document.removeEventListener('mouseleave', handleMouseLeave);
          }
        };
        
        document.addEventListener('mouseleave', handleMouseLeave);
      }

      // Check scroll depth trigger
      const scrollRule = rules.find((r: any) => r.trigger_type === 'scroll_depth');
      if (scrollRule) {
        const triggerValue = scrollRule.trigger_value as { percentage?: number };
        const requiredDepth = triggerValue?.percentage || 50;
        
        const handleScroll = () => {
          const scrollDepth = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100;
          
          if (scrollDepth >= requiredDepth && !proactiveShown) {
            console.log('Scroll depth trigger activated, opening chat');
            setIsOpen(true);
            setProactiveShown(true);
            handleTranscript(scrollRule.message, 'assistant');
            window.removeEventListener('scroll', handleScroll);
          }
        };
        
        window.addEventListener('scroll', handleScroll);
      }

    } catch (error) {
      console.error('Error checking proactive rules:', error);
    }
  };

  const requestLiveAgent = async (reason: string) => {
    // Prevent multiple simultaneous requests
    if (requestingAgent) return;
    
    try {
      // Show email input if not provided
      if (!visitorEmail) {
        setShowEmailInput(true);
        handleTranscript('Please provide your email so we can notify you when an agent joins.', 'assistant');
        return;
      }

      setRequestingAgent(true);

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
    } finally {
      setRequestingAgent(false);
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

      // Show AI response immediately (realtime subscription will filter duplicates)
      if (data.reply) {
        handleTranscript(data.reply, 'assistant');
      }
      
      if (data.shouldEscalate) {
        setShowEscalateButton(true);
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
  const maxInputChars = settings?.max_input_characters || 500;

  return (
    <div className="w-full h-full flex flex-col">
      {!isMinimized ? (
        <Card className="w-full h-full shadow-2xl flex flex-col overflow-hidden">
          <CardHeader className="border-b p-3 sm:p-4 bg-transparent shrink-0" style={{ borderColor: primaryColor, borderBottomWidth: '2px' }}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-base shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {agentName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-xs sm:text-base truncate">{agentName}</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] sm:text-xs text-muted-foreground">Online</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Pre-chat form */}
              {showPreChatForm ? (
                <div className="p-2 sm:p-3 md:p-4 overflow-y-auto">
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
                    <div className="p-2 sm:p-3 md:p-4 shrink-0">
                      <div className="bg-muted/50 rounded-lg p-2 sm:p-3 shadow-sm">
                        <p className="text-xs sm:text-sm">{welcomeMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Transcript */}
                  <ScrollArea className="flex-1 p-2 sm:p-3 md:p-4 overflow-y-auto scroll-smooth">
                    <div className="space-y-2 sm:space-y-3">
                      {transcript.map((item, idx) => (
                        <div
                          key={idx}
                          className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[90%] sm:max-w-[85%] md:max-w-[80%] rounded-lg p-2 sm:p-2.5 md:p-3 ${
                              item.role === "user"
                                ? "text-white shadow-sm"
                                : "bg-muted"
                            }`}
                            style={item.role === "user" ? { backgroundColor: primaryColor } : {}}
                          >
                            <p className="text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap">{item.text}</p>
                          </div>
                        </div>
                      ))}
                      
                      {/* Typing indicator - for both sending message and agent typing */}
                      {(sendingMessage || agentTyping) && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-lg p-2 sm:p-2.5 md:p-3">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Text and Voice interface */}
                  <div className="border-t bg-background shrink-0">
                    {liveChatSession?.status === 'queued' && liveChatSession?.status !== 'active' && (
                      <div className="m-2 sm:m-3 md:m-4 p-2 sm:p-2.5 md:p-3 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="font-medium text-yellow-800 dark:text-yellow-200 text-xs sm:text-sm">⏳ Waiting for agent...</p>
                        <p className="text-[10px] sm:text-xs text-yellow-700 dark:text-yellow-300 mt-1">An agent will join shortly</p>
                      </div>
                    )}
                    {liveChatSession?.status === 'active' && (
                      <div className="m-2 sm:m-3 md:m-4 p-2 sm:p-2.5 md:p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="font-medium text-green-800 dark:text-green-200 text-xs sm:text-sm">✅ You are speaking to an agent</p>
                        <p className="text-[10px] sm:text-xs text-green-700 dark:text-green-300 mt-1">An agent has joined</p>
                      </div>
                    )}
                    
                    {/* Email Input */}
                    {showEmailInput && !visitorEmail && (
                      <div className="px-2 sm:px-3 md:px-4 pt-2 sm:pt-3 md:pt-4 pb-2">
                        <div className="flex flex-col gap-2">
                          <input
                            type="email"
                            value={visitorEmail}
                            onChange={(e) => setVisitorEmail(e.target.value)}
                            placeholder="Enter your email..."
                            className="flex-1 px-2 sm:px-3 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
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
                            className="h-9 sm:h-10 text-xs sm:text-sm"
                            style={{ backgroundColor: visitorEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visitorEmail) ? primaryColor : undefined }}
                          >
                            Submit Email
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Voice Interface - MOVED BEFORE text input */}
                    {settings?.voice_enabled && (
                      <div className="px-2 sm:px-3 md:px-4 pt-2 sm:pt-3 md:pt-4 pb-2 border-b">
                        <VoiceInterface
                          businessId={businessId}
                          onTranscript={handleTranscript}
                          onConversationCreated={setConversationId}
                          onChatReady={setSendMessageFn}
                        />
                      </div>
                    )}
                    
                    {/* Text Input - MOVED AFTER voice interface */}
                    <div className="px-2 sm:px-3 md:px-4 pt-2 sm:pt-3 md:pt-4 pb-2">
                      <div className="flex gap-1.5 sm:gap-2">
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={textInput}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value.length <= maxInputChars) {
                                setTextInput(value);
                              }
                            }}
                            onKeyPress={handleKeyPress}
                            placeholder="Type a message..."
                            maxLength={maxInputChars}
                            className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                          />
                          <div className="flex justify-between items-center mt-1 px-1">
                            <span className="text-[10px] text-muted-foreground">
                              {textInput.length}/{maxInputChars} characters
                            </span>
                            {textInput.length >= maxInputChars && (
                              <span className="text-[10px] text-destructive">
                                Character limit reached
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleSendText()}
                          disabled={!textInput.trim() || sendingMessage}
                          size="sm"
                          className="h-9 sm:h-10 px-2 sm:px-3 md:px-4 text-xs sm:text-sm shrink-0"
                          style={{ backgroundColor: textInput.trim() && !sendingMessage ? primaryColor : undefined }}
                        >
                          {sendingMessage ? 'Sending...' : 'Send'}
                        </Button>
                      </div>
                    </div>

                    {!liveChatSession && !showEscalateButton && (
                      <div className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 md:pb-4">
                        <Button
                          onClick={() => {
                            requestLiveAgent('User requested live agent support');
                          }}
                          disabled={requestingAgent}
                          variant="outline"
                          size="sm"
                          className="w-full h-8 sm:h-9 text-[10px] sm:text-xs"
                        >
                          {requestingAgent ? 'Requesting...' : 'Talk to Live Agent'}
                        </Button>
                      </div>
                    )}
                    
                    {showEscalateButton && !liveChatSession && (
                      <div className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 md:pb-4">
                        <Button
                          onClick={() => {
                            requestLiveAgent('AI determined escalation needed');
                            setShowEscalateButton(false);
                          }}
                          disabled={requestingAgent}
                          variant="default"
                          size="sm"
                          className="w-full h-8 sm:h-9 text-[10px] sm:text-xs"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {requestingAgent ? 'Connecting...' : 'Connect to Live Agent Now'}
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
