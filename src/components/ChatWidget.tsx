import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageCircle, X, HelpCircle, MessageSquare, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PreChatForm } from "./PreChatForm";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
interface ChatWidgetProps {
  businessId: string;
  parentPageUrl?: string;
}

type WidgetTab = "faq" | "chat";
export const ChatWidget = ({ businessId, parentPageUrl }: ChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<WidgetTab>("chat");
  const [settings, setSettings] = useState<any>(null);
  const [businessInfo, setBusinessInfo] = useState<{ name: string; logo_url: string | null } | null>(null);
  const [transcript, setTranscript] = useState<Array<{ text: string; role: "user" | "assistant" }>>([]);
  const [proactiveShown, setProactiveShown] = useState(false);
  const [proactiveMessage, setProactiveMessage] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [liveChatSession, setLiveChatSession] = useState<any>(null);
  const [textInput, setTextInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const notificationMessagesRef = useRef<Map<string, string[]>>(new Map());
  const [sendingMessage, setSendingMessage] = useState(false);
  const [visitorEmail, setVisitorEmail] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [showPreChatForm, setShowPreChatForm] = useState(false);
  const [visitorInfo, setVisitorInfo] = useState<any>({});
  const [agentTyping, setAgentTyping] = useState(false);
  const [requestingAgent, setRequestingAgent] = useState(false);
  const [qaPairs, setQaPairs] = useState<any[]>([]);
  const [faqSearch, setFaqSearch] = useState("");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      // Only fetch public-safe fields (exclude system_prompt)
      const { data } = await supabase
        .from("widget_settings")
        .select("id, business_id, welcome_message, agent_name, primary_color, widget_position, voice_enabled, pre_chat_enabled, pre_chat_welcome_message, pre_chat_required_fields, max_input_characters, show_qa_to_visitors")
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

    const fetchBusinessInfo = async () => {
      const { data } = await supabase
        .from("businesses")
        .select("name, logo_url")
        .eq("id", businessId)
        .single();
      
      if (data) {
        setBusinessInfo(data);
      }
    };

    const fetchQaPairs = async () => {
      const { data } = await supabase
        .from("bot_qa_pairs")
        .select("*")
        .eq("business_id", businessId)
        .eq("enabled", true)
        .order("priority", { ascending: false });
      
      if (data) {
        setQaPairs(data);
      }
    };


    fetchSettings();
    fetchBusinessInfo();
    fetchQaPairs();
    

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

  // Auto-trigger proactive on page load if no rules exist (fallback)
  useEffect(() => {
    if (!businessId || proactiveShown) return;
    
    // Wait 3 seconds then show a default proactive message if no rules triggered
    const timer = setTimeout(async () => {
      if (proactiveShown) return;
      
      // Check if there are any enabled rules first
      const { data: rules } = await supabase
        .from('proactive_chat_rules')
        .select('id')
        .eq('business_id', businessId)
        .eq('enabled', true)
        .limit(1);
      
      // If no rules exist, show a default welcome message
      if (!rules?.length) {
        setProactiveShown(true);
        setProactiveMessage("👋 Hi there! How can I help you today?");
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [businessId, proactiveShown]);

  // Check proactive rules when parent URL is available
  useEffect(() => {
    if (!businessId) return;
    
    const timers: NodeJS.Timeout[] = [];
    const listeners: { type: string; handler: EventListener }[] = [];
    let hasTriggered = false;

    const triggerProactive = (message: string) => {
      if (hasTriggered || proactiveShown) return;
      hasTriggered = true;
      setProactiveShown(true);
      setProactiveMessage(message);
    };

    const runProactiveChecks = async () => {
      try {
        console.log('Checking proactive rules for business:', businessId);
        const { data: rules, error } = await supabase
          .from('proactive_chat_rules')
          .select('*')
          .eq('business_id', businessId)
          .eq('enabled', true)
          .order('priority', { ascending: false });

        if (error || !rules?.length) {
          console.log('No active proactive rules found');
          return;
        }
        console.log('Proactive rules found:', rules);

        // Time on page trigger
        const timeRule = rules.find((r: any) => r.trigger_type === 'time_on_page');
        if (timeRule) {
          const triggerVal = timeRule.trigger_value as Record<string, any>;
          const timeoutSeconds = triggerVal?.seconds || 30;
          console.log(`Setting time trigger for ${timeoutSeconds} seconds`);
          const timer = setTimeout(() => {
            triggerProactive(timeRule.message);
          }, timeoutSeconds * 1000);
          timers.push(timer);
        }

        // Page visit trigger - check both page_visit and specific_page
        const pageRule = rules.find((r: any) => 
          r.trigger_type === 'page_visit' || r.trigger_type === 'specific_page'
        );
        if (pageRule) {
          const triggerVal = pageRule.trigger_value as Record<string, any>;
          const targetUrl = triggerVal?.url || '';
          const currentUrl = parentPageUrl || window.location.href;
          console.log('Checking page trigger:', targetUrl, 'Current:', currentUrl);
          
          if (targetUrl && currentUrl.toLowerCase().includes(targetUrl.toLowerCase())) {
            setTimeout(() => triggerProactive(pageRule.message), 500);
          }
        }

        // Exit intent trigger
        const exitRule = rules.find((r: any) => r.trigger_type === 'exit_intent');
        if (exitRule) {
          const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0) {
              triggerProactive(exitRule.message);
            }
          };
          document.addEventListener('mouseleave', handleMouseLeave);
          listeners.push({ type: 'mouseleave', handler: handleMouseLeave as EventListener });
        }

        // Scroll depth trigger
        const scrollRule = rules.find((r: any) => r.trigger_type === 'scroll_depth');
        if (scrollRule) {
          const triggerVal = scrollRule.trigger_value as Record<string, any>;
          const requiredDepth = triggerVal?.percentage || 50;
          const handleScroll = () => {
            const scrollDepth = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100;
            if (scrollDepth >= requiredDepth) {
              triggerProactive(scrollRule.message);
            }
          };
          window.addEventListener('scroll', handleScroll);
          listeners.push({ type: 'scroll', handler: handleScroll });
        }

        // High engagement trigger - checks engagement score from visitor session
        const engagementRule = rules.find((r: any) => r.trigger_type === 'high_engagement');
        if (engagementRule) {
          const triggerVal = engagementRule.trigger_value as Record<string, any>;
          const requiredScore = triggerVal?.score || 70;
          const checkEngagement = async () => {
            const visitorId = localStorage.getItem('visitor_id');
            if (!visitorId) return;
            
            const { data: session } = await supabase
              .from('visitor_sessions')
              .select('engagement_score')
              .eq('visitor_id', visitorId)
              .eq('business_id', businessId)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (session?.engagement_score && session.engagement_score >= requiredScore) {
              triggerProactive(engagementRule.message);
            }
          };
          // Check engagement after 10 seconds
          const timer = setTimeout(checkEngagement, 10000);
          timers.push(timer);
        }

      } catch (error) {
        console.error('Error checking proactive rules:', error);
      }
    };

    runProactiveChecks();

    return () => {
      timers.forEach(t => clearTimeout(t));
      listeners.forEach(({ type, handler }) => {
        if (type === 'mouseleave') document.removeEventListener(type, handler);
        else window.removeEventListener(type, handler);
      });
    };
  }, [businessId, parentPageUrl, proactiveShown]);

  // Listen for all incoming messages in realtime
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel('incoming-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const message = payload.new as any;
          
          // Only notify for agent/assistant messages (not user's own messages)
          if (message.role === 'assistant' || message.role === 'agent') {
            // Request notification permission if not already granted
            if ('Notification' in window && Notification.permission === 'default') {
              Notification.requestPermission();
            }
            
            // Show browser notification if supported and permitted
            if ('Notification' in window && Notification.permission === 'granted') {
              // Get or initialize message list for this conversation
              const conversationMessages = notificationMessagesRef.current.get(conversationId) || [];
              conversationMessages.push(message.content);
              notificationMessagesRef.current.set(conversationId, conversationMessages);

              const messageCount = conversationMessages.length;
              const notificationIcon = getNotificationIcon();
              
              // Create notification body based on message count
              let notificationBody = '';
              if (messageCount === 1) {
                notificationBody = message.content.substring(0, 100);
              } else {
                notificationBody = `${messageCount} new messages\n${message.content.substring(0, 80)}`;
              }

              new Notification(settings?.agent_name || 'Support Agent', {
                body: notificationBody,
                icon: notificationIcon,
                tag: conversationId,
                requireInteraction: false,
                data: {
                  conversationId,
                  messageCount,
                  messages: conversationMessages.slice(-3),
                }
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, liveChatSession]);

  // Clear notification messages when widget is opened
  useEffect(() => {
    if (isOpen && conversationId) {
      notificationMessagesRef.current.delete(conversationId);
    }
  }, [isOpen, conversationId]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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

  const getNotificationIcon = (): string => {
    // If business has a logo, use it
    if (businessInfo?.logo_url) {
      return businessInfo.logo_url;
    }
    
    // Otherwise, generate an icon with business name abbreviation
    if (businessInfo?.name) {
      const abbreviation = businessInfo.name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      
      // Create a data URL with the abbreviation
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Use primary color or default
        const bgColor = settings?.primary_color || '#000000';
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 128, 128);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 64px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(abbreviation, 64, 64);
      }
      
      return canvas.toDataURL();
    }
    
    // Fallback to default icon
    return '/favicon.ico';
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
      
      // Escalation handled via live agent button
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

  // Filter FAQ pairs based on search
  const filteredFaqPairs = qaPairs.filter(pair => 
    faqSearch === "" || 
    pair.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
    pair.answer.toLowerCase().includes(faqSearch.toLowerCase()) ||
    pair.keywords?.some((kw: string) => kw.toLowerCase().includes(faqSearch.toLowerCase()))
  );

  // Render FAQ Tab Content
  const renderFaqContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-b from-muted/30 to-transparent">
        <div className="flex items-center gap-3 mb-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <HelpCircle className="w-5 h-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h3 className="font-semibold text-base">Help Center</h3>
            <p className="text-xs text-muted-foreground">Find answers to common questions</p>
          </div>
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for answers..."
            value={faqSearch}
            onChange={(e) => setFaqSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-background border-muted-foreground/20 focus-visible:ring-1"
            style={{ 
              '--tw-ring-color': primaryColor 
            } as React.CSSProperties}
          />
        </div>
      </div>

      {/* FAQ List */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {filteredFaqPairs.length > 0 ? (
            filteredFaqPairs.map((pair) => {
              const isExpanded = expandedFaqId === pair.id;
              return (
                <div
                  key={pair.id}
                  className="rounded-lg border bg-card overflow-hidden transition-all duration-200 hover:shadow-sm"
                  style={{ 
                    borderColor: isExpanded ? primaryColor : undefined,
                    boxShadow: isExpanded ? `0 0 0 1px ${primaryColor}20` : undefined
                  }}
                >
                  {/* Question Header */}
                  <button
                    className="w-full p-3 flex items-start justify-between gap-2 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedFaqId(isExpanded ? null : pair.id)}
                  >
                    <span className="font-medium text-sm leading-tight flex-1">{pair.question}</span>
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors"
                      style={{ backgroundColor: isExpanded ? `${primaryColor}15` : 'transparent' }}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" style={{ color: primaryColor }} />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                  
                  {/* Answer Content */}
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t bg-muted/20">
                      <p className="text-sm text-muted-foreground leading-relaxed pt-3 whitespace-pre-wrap">
                        {pair.answer}
                      </p>
                      
                      {/* Action Button */}
                      <button
                        className="mt-3 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                        style={{ 
                          backgroundColor: `${primaryColor}10`,
                          color: primaryColor
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab("chat");
                          handleTranscript(pair.question, 'user');
                          handleTranscript(pair.answer, 'assistant');
                          setExpandedFaqId(null);
                        }}
                      >
                        Continue in chat →
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}10` }}
              >
                <HelpCircle className="w-8 h-8" style={{ color: primaryColor }} />
              </div>
              {faqSearch ? (
                <>
                  <p className="text-sm font-medium mb-1">No results found</p>
                  <p className="text-xs text-muted-foreground">Try searching with different keywords</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium mb-1">No FAQs available</p>
                  <p className="text-xs text-muted-foreground">Check back later for helpful answers</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Results count */}
        {filteredFaqPairs.length > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-4 pb-2">
            {filteredFaqPairs.length} {filteredFaqPairs.length === 1 ? 'article' : 'articles'} found
          </p>
        )}
      </ScrollArea>
    </div>
  );

  // Render Chat Tab Content
  const renderChatContent = () => (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {showPreChatForm ? (
        <div className="p-2 sm:p-3 md:p-4 overflow-y-auto">
          <PreChatForm
            welcomeMessage={settings?.pre_chat_welcome_message}
            requiredFields={settings?.pre_chat_required_fields || ['name', 'email']}
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

          {/* Chat Input */}
          <div className="border-t bg-background shrink-0">
            {liveChatSession && liveChatSession.status === 'queued' && (
              <div className="m-2 sm:m-3 p-2 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="font-medium text-yellow-800 dark:text-yellow-200 text-xs sm:text-sm">⏳ Waiting for agent...</p>
              </div>
            )}
            {liveChatSession?.status === 'active' && (
              <div className="m-2 sm:m-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="font-medium text-green-800 dark:text-green-200 text-xs sm:text-sm">✅ Speaking with agent</p>
              </div>
            )}
            
            <div className="px-2 sm:px-3 pt-2 pb-2">
              <div className="flex gap-1.5 sm:gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => {
                    if (e.target.value.length <= maxInputChars) {
                      setTextInput(e.target.value);
                    }
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  maxLength={maxInputChars}
                  className="flex-1 px-2 sm:px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                />
                <Button
                  onClick={() => handleSendText()}
                  disabled={!textInput.trim() || sendingMessage}
                  size="sm"
                  className="h-9 px-3 text-xs shrink-0"
                  style={{ backgroundColor: textInput.trim() && !sendingMessage ? primaryColor : undefined }}
                >
                  Send
                </Button>
              </div>
            </div>

            {!liveChatSession && (
              <div className="px-2 sm:px-3 pb-2">
                <Button
                  onClick={() => requestLiveAgent('User requested live agent support')}
                  disabled={requestingAgent}
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-[10px] sm:text-xs"
                >
                  {requestingAgent ? 'Requesting...' : 'Talk to Live Agent'}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const handleProactiveClick = () => {
    setProactiveMessage(null);
    setIsOpen(true);
    setActiveTab('chat');
  };

  return (
    <div className="w-full h-full flex flex-col items-end justify-end">
      {isOpen ? (
        <Card className="w-full h-full shadow-2xl flex flex-col overflow-hidden flex-1">
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
              <button 
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </CardHeader>

          <div className="border-b shrink-0">
            <div className="flex">
              {[
                { id: "faq" as WidgetTab, icon: HelpCircle, label: "FAQ" },
                { id: "chat" as WidgetTab, icon: MessageSquare, label: "Chat" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center justify-center py-2 px-1 transition-colors text-[10px] sm:text-xs ${
                    activeTab === tab.id
                      ? "border-b-2 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                  style={activeTab === tab.id ? { borderColor: primaryColor } : {}}
                >
                  <tab.icon className="w-4 h-4 mb-0.5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <CardContent className="p-0 flex-1 flex flex-col overflow-hidden min-h-0">
            {activeTab === "faq" && renderFaqContent()}
            {activeTab === "chat" && renderChatContent()}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col items-end gap-3">
          {/* Proactive message popup - appears above minimized widget icon */}
          {proactiveMessage && (
            <div 
              className="p-3 bg-background rounded-lg shadow-lg border cursor-pointer animate-bounce-in max-w-[280px]"
              onClick={handleProactiveClick}
              style={{ borderColor: primaryColor }}
            >
              <div className="flex items-start gap-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  {agentName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{agentName}</p>
                  <p className="text-sm text-muted-foreground mt-1">{proactiveMessage}</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setProactiveMessage(null); }}
                  className="text-muted-foreground hover:text-foreground p-1 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">Click to chat</p>
            </div>
          )}
          
          <Button
            onClick={() => { setIsOpen(true); setProactiveMessage(null); }}
            className="rounded-full w-14 h-14 sm:w-16 sm:h-16 shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </Button>
        </div>
      )}
    </div>
  );
};
