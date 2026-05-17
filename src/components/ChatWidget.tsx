import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageCircle, X, HelpCircle, MessageSquare, Search, ChevronDown, ChevronUp, Image as ImageIcon, Loader2, Bell, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PreChatForm } from "./PreChatForm";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { playNotificationSound } from "@/utils/notificationSound";
import { ContinueOnWhatsApp } from "./ContinueOnWhatsApp";
interface ChatWidgetProps {
  businessId: string;
  parentPageUrl?: string;
  isEmbedded?: boolean; // When true, opens directly without button (for iframe embed)
}

type WidgetTab = "faq" | "chat";

// Storage keys for persistence
const getStorageKey = (businessId: string, key: string) => `lyqn_chat_${businessId}_${key}`;

export const ChatWidget = ({ businessId, parentPageUrl, isEmbedded = false }: ChatWidgetProps) => {
  // When embedded in iframe, always open directly
  const [isOpen, setIsOpen] = useState(isEmbedded);
  const [activeTab, setActiveTab] = useState<WidgetTab>("chat");
  const [settings, setSettings] = useState<any>(null);
  const [businessInfo, setBusinessInfo] = useState<{ name: string; logo_url: string | null } | null>(null);
  const [transcript, setTranscript] = useState<Array<{ text: string; role: "user" | "assistant"; imageUrl?: string }>>([]);
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
  const [showPreChatForm, setShowPreChatForm] = useState<boolean | null>(null); // null = not determined yet
  const [visitorInfo, setVisitorInfo] = useState<any>({});
  const [preChatCompleted, setPreChatCompleted] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [requestingAgent, setRequestingAgent] = useState(false);
  const [cancelingRequest, setCancelingRequest] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [estimatedWaitMinutes, setEstimatedWaitMinutes] = useState<number | null>(null);
  const [qaPairs, setQaPairs] = useState<any[]>([]);
  const [faqSearch, setFaqSearch] = useState("");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const renderedMessageIdsRef = useRef<Set<string>>(new Set());

  // Restore session state from localStorage on mount
  useEffect(() => {
    // Initialize visitor ID early for RLS headers
    const existingVisitorId = localStorage.getItem('visitor_id');
    if (!existingVisitorId) {
      const newVisitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('visitor_id', newVisitorId);
    }

    const storedConversationId = localStorage.getItem(getStorageKey(businessId, 'conversationId'));
    const storedSessionId = localStorage.getItem(getStorageKey(businessId, 'sessionId'));
    const storedTranscript = localStorage.getItem(getStorageKey(businessId, 'transcript'));
    const storedEmail = localStorage.getItem(getStorageKey(businessId, 'visitorEmail'));
    const storedPreChatCompleted = localStorage.getItem(getStorageKey(businessId, 'preChatCompleted'));
    
    if (storedConversationId) {
      setConversationId(storedConversationId);
    }
    
    if (storedTranscript) {
      try {
        setTranscript(JSON.parse(storedTranscript));
      } catch (e) {
        console.error('Error parsing stored transcript:', e);
      }
    }
    
    if (storedEmail) {
      setVisitorEmail(storedEmail);
    }
    
    // Restore visitor info
    const storedVisitorInfo = localStorage.getItem(getStorageKey(businessId, 'visitorInfo'));
    if (storedVisitorInfo) {
      try {
        setVisitorInfo(JSON.parse(storedVisitorInfo));
      } catch (e) {
        console.error('Error parsing stored visitor info:', e);
      }
    }
    
    // Restore pre-chat completion state
    if (storedPreChatCompleted === 'true') {
      setPreChatCompleted(true);
    }
    
    // Restore live chat session from localStorage for instant UI feedback
    const storedSession = localStorage.getItem(getStorageKey(businessId, 'liveChatSession'));
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        console.log('Restored live chat session from localStorage:', parsedSession);
        setLiveChatSession(parsedSession);
      } catch (e) {
        console.error('Error parsing stored live chat session:', e);
      }
    }
    
    // Restore live chat session from database if we have a conversation
    if (storedConversationId) {
      restoreLiveChatSession(storedConversationId);
    }
  }, [businessId]);

  // Persist conversationId
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem(getStorageKey(businessId, 'conversationId'), conversationId);
    }
  }, [conversationId, businessId]);

  // Persist transcript
  useEffect(() => {
    if (transcript.length > 0) {
      localStorage.setItem(getStorageKey(businessId, 'transcript'), JSON.stringify(transcript));
    }
  }, [transcript, businessId]);

  // Persist visitor email
  useEffect(() => {
    if (visitorEmail) {
      localStorage.setItem(getStorageKey(businessId, 'visitorEmail'), visitorEmail);
    }
  }, [visitorEmail, businessId]);

  // Persist pre-chat completed state
  useEffect(() => {
    if (preChatCompleted) {
      localStorage.setItem(getStorageKey(businessId, 'preChatCompleted'), 'true');
    }
  }, [preChatCompleted, businessId]);

  // Persist visitor info
  useEffect(() => {
    if (visitorInfo && Object.keys(visitorInfo).length > 0) {
      localStorage.setItem(getStorageKey(businessId, 'visitorInfo'), JSON.stringify(visitorInfo));
    }
  }, [visitorInfo, businessId]);

  // Persist session ID and object
  useEffect(() => {
    if (liveChatSession?.id) {
      localStorage.setItem(getStorageKey(businessId, 'sessionId'), liveChatSession.id);
      localStorage.setItem(getStorageKey(businessId, 'liveChatSession'), JSON.stringify(liveChatSession));
    } else if (liveChatSession === null) {
      localStorage.removeItem(getStorageKey(businessId, 'sessionId'));
      localStorage.removeItem(getStorageKey(businessId, 'liveChatSession'));
    }
  }, [liveChatSession, businessId]);

  // Restore live chat session from database
  const restoreLiveChatSession = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('live_chat_sessions_public' as any)
        .select('*')
        .eq('conversation_id', convId)
        .in('status', ['queued', 'active'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        console.log('Restored live chat session:', data);
        setLiveChatSession(data);
        
        // Update queue position if queued
        if (data.status === 'queued') {
          await updateQueuePosition(data);
        }
      }
    } catch (error) {
      console.error('Error restoring live chat session:', error);
    }
  };

  // Update queue position
  const updateQueuePosition = async (session: any) => {
    if (!session || session.status !== 'queued') return;
    
    try {
      // Get all business conversations
      const { data: businessConversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('business_id', businessId);
      
      const businessConvIds = businessConversations?.map(c => c.id) || [];
      
      if (businessConvIds.length > 0) {
        const { count } = await supabase
          .from('live_chat_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'queued')
          .lt('queued_at', session.queued_at)
          .in('conversation_id', businessConvIds);
        
        const position = (count || 0) + 1;
        setQueuePosition(position);
        setEstimatedWaitMinutes(position * 3);
      }
    } catch (error) {
      console.error('Error updating queue position:', error);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      // Use public view that excludes system_prompt
      const { data } = await supabase
        .from("widget_settings_public" as any)
        .select("id, business_id, welcome_message, agent_name, primary_color, widget_position, pre_chat_enabled, pre_chat_welcome_message, pre_chat_required_fields, max_input_characters, show_qa_to_visitors")
        .eq("business_id", businessId)
        .single();
      
      if (data) {
        setSettings(data);
        // Determine pre-chat form visibility:
        // Show form if pre_chat_enabled AND user hasn't completed it yet
        const storedPreChatCompleted = localStorage.getItem(getStorageKey(businessId, 'preChatCompleted'));
        const hasCompletedPreChat = storedPreChatCompleted === 'true' || preChatCompleted;
        
        // Pre-chat form is always required — cannot be bypassed
        if (!hasCompletedPreChat) {
          setShowPreChatForm(true);
        } else {
          setShowPreChatForm(false);
        }
      } else {
        // No settings = still require pre-chat form
        setShowPreChatForm(!preChatCompleted);
      }
    };

    const fetchBusinessInfo = async () => {
      const { data } = await supabase
        .from("businesses_public" as any)
        .select("name, logo_url")
        .eq("id", businessId)
        .single();
      
      if (data && !('error' in data)) {
        setBusinessInfo(data as { name: string; logo_url: string | null });
      }
    };

    const fetchQaPairs = async () => {
      const { data } = await supabase
        .from("bot_qa_pairs_public" as any)
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

  // Auto-trigger proactive fallback only when no real rules exist
  useEffect(() => {
    if (!businessId || isEmbedded || isOpen || proactiveShown) return;
    
    let cancelled = false;
    
    const checkAndFallback = async () => {
      try {
        const { data: rules } = await supabase
          .from('proactive_chat_rules_public' as any)
          .select('id')
          .eq('business_id', businessId)
          .eq('enabled', true)
          .limit(1);
        
        // Only show fallback if no real rules exist
        if (!cancelled && (!rules || rules.length === 0)) {
          console.log('[Proactive] No rules found, setting fallback timer (3s)');
          const timer = setTimeout(() => {
            if (!cancelled && !isOpen) {
              console.log('[Proactive] Triggering fallback message');
              setProactiveMessage("👋 Hi there! How can I help you today?");
            }
          }, 3000);
          return () => clearTimeout(timer);
        } else {
          console.log(`[Proactive] Found ${rules?.length} active rules, skipping fallback`);
        }
      } catch (e) {
        // On error, show fallback anyway
        if (!cancelled) {
          const timer = setTimeout(() => {
            if (!cancelled && !isOpen) {
              setProactiveMessage("👋 Hi there! How can I help you today?");
            }
          }, 3000);
          return () => clearTimeout(timer);
        }
      }
    };
    
    checkAndFallback();
    
    return () => { cancelled = true; };
  }, [businessId, isEmbedded, isOpen, proactiveShown]);

  // Check proactive rules when parent URL is available
  useEffect(() => {
    if (!businessId) return;
    
    const timers: ReturnType<typeof setTimeout>[] = [];
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
        console.log('[Proactive] Running checks for business:', businessId, 'URL:', parentPageUrl || window.location.href);
        const { data: rules, error } = await supabase
          .from('proactive_chat_rules_public' as any)
          .select('*')
          .eq('business_id', businessId)
          .eq('enabled', true)
          .order('priority', { ascending: false });

        if (error) {
          console.error('[Proactive] Error fetching rules:', error);
          return;
        }

        if (!rules?.length) {
          console.log('[Proactive] No active proactive rules found');
          return;
        }
        console.log(`[Proactive] Evaluating ${rules.length} rules`);

        // Time on page trigger
        const timeRule = rules.find((r: any) => r.trigger_type === 'time_on_page');
        if (timeRule) {
          const triggerVal = timeRule.trigger_value as Record<string, any>;
          const timeoutSeconds = triggerVal?.seconds || 30;
          console.log(`[Proactive] Setting time trigger for ${timeoutSeconds} seconds: ${timeRule.name}`);
          const timer = setTimeout(() => {
            if (!proactiveShown) {
              console.log(`[Proactive] Triggering time_on_page: ${timeRule.name}`);
              triggerProactive(timeRule.message);
            }
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
          console.log(`[Proactive] Checking page trigger: "${targetUrl}" vs Current: "${currentUrl}"`);
          
          if (targetUrl && currentUrl.toLowerCase().includes(targetUrl.toLowerCase())) {
            console.log(`[Proactive] Triggering page_visit: ${pageRule.name}`);
            setTimeout(() => triggerProactive(pageRule.message), 500);
          }
        }

        // Exit intent trigger
        const exitRule = rules.find((r: any) => r.trigger_type === 'exit_intent');
        if (exitRule) {
          const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0) {
              console.log(`[Proactive] Triggering exit_intent: ${exitRule.name}`);
              triggerProactive(exitRule.message);
            }
          };
          console.log(`[Proactive] Setting exit_intent listener: ${exitRule.name}`);
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
              console.log(`[Proactive] Triggering scroll_depth: ${scrollRule.name} at ${scrollDepth.toFixed(1)}%`);
              triggerProactive(scrollRule.message);
            }
          };
          console.log(`[Proactive] Setting scroll listener (${requiredDepth}%): ${scrollRule.name}`);
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
            if (!visitorId || proactiveShown) return;
            
            console.log(`[Proactive] Checking engagement score (needs ${requiredScore})`);
            const { data: session } = await supabase
              .from('visitor_sessions')
              .select('engagement_score')
              .eq('visitor_id', visitorId)
              .eq('business_id', businessId)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (session?.engagement_score && session.engagement_score >= requiredScore) {
              console.log(`[Proactive] High engagement detected (${session.engagement_score})`);
              triggerProactive(engagementRule.message);
            }
          };
          // Check engagement after 10 seconds
          const timer = setTimeout(checkEngagement, 10000);
          timers.push(timer);
        }

      } catch (error) {
        console.error('[Proactive] Error in checks:', error);
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
          console.log('New message received via realtime:', payload);
          const newMessage = payload.new as any;
          
          // Only show assistant messages (from agent) that weren't already rendered via HTTP
          if (newMessage.role === 'assistant') {
            if (renderedMessageIdsRef.current.has(newMessage.id)) {
              console.log('Skipping duplicate message:', newMessage.id);
              return;
            }
            renderedMessageIdsRef.current.add(newMessage.id);
            setAgentTyping(false);
            const imageUrl = newMessage.audio_url && /\.(jpe?g|png|gif|webp)$/i.test(newMessage.audio_url)
              ? newMessage.audio_url
              : undefined;
            handleTranscript(newMessage.content, 'assistant', imageUrl);
            
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

    // Also listen on a broadcast channel — agents broadcast messages to bypass visitor RLS
    const broadcastChannel = supabase
      .channel(`visitor-messages-${conversationId}`)
      .on('broadcast', { event: 'agent_message' }, (payload) => {
        console.log('Agent message received via broadcast:', payload);
        const msg = payload.payload as any;
        if (!msg?.id || renderedMessageIdsRef.current.has(msg.id)) {
          return;
        }
        renderedMessageIdsRef.current.add(msg.id);
        setAgentTyping(false);
        handleTranscript(msg.content, 'assistant', msg.imageUrl);
      })
      .on('broadcast', { event: 'agent_joined' }, (payload) => {
        console.log('Agent joined event received via broadcast:', payload);
        const data = payload.payload as any;
        const dedupeKey = `agent_joined:${data?.sessionId || conversationId}`;
        if (renderedMessageIdsRef.current.has(dedupeKey)) return;
        renderedMessageIdsRef.current.add(dedupeKey);
        playNotificationSound();
        setQueuePosition(null);
        setEstimatedWaitMinutes(null);
        setLiveChatSession((prev: any) => prev ? { ...prev, status: 'active', agent_id: data?.agentId, accepted_at: data?.acceptedAt } : prev);
        handleTranscript("👋 You are speaking with a human agent now.", 'assistant');
      })
      .subscribe();

    return () => {
      console.log('Cleaning up messages subscription');
      supabase.removeChannel(channel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [conversationId]);

  // Real-time subscription for live chat session updates
  useEffect(() => {
    if (!conversationId) return;

    console.log('Setting up live chat session subscription for:', conversationId);

    const channel = supabase
      .channel(`live-chat-session-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to both UPDATE and INSERT
          schema: 'public',
          table: 'live_chat_sessions',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Live chat session change received:', payload);
          if (payload.new && Object.keys(payload.new).length > 0) {
            const newSession = payload.new as any;
            
            setLiveChatSession((prev: any) => {
              // If status changed from queued to active
              if (newSession.status === 'active' && prev?.status !== 'active') {
                console.log('Agent has joined - status changed to active');
                const dedupeKey = `agent_joined:${newSession.id || conversationId}`;
                if (!renderedMessageIdsRef.current.has(dedupeKey)) {
                  renderedMessageIdsRef.current.add(dedupeKey);
                  playNotificationSound();
                  setTranscript(t => [...t, {
                    text: '👋 You are speaking with a human agent now.',
                    role: 'assistant' as const
                  }]);
                }
                setQueuePosition(null);
                setEstimatedWaitMinutes(null);
              }
              
              // Handle ended status (session cancelled or ended)
              if (newSession.status === 'ended' && prev?.status === 'queued') {
                setQueuePosition(null);
                setEstimatedWaitMinutes(null);
                return null;
              }
              
              return newSession;
            });
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

  // Real-time subscription for queue position updates (listen to all session changes)
  useEffect(() => {
    if (!liveChatSession || liveChatSession.status !== 'queued') return;

    console.log('Setting up queue position subscription');

    const channel = supabase
      .channel('queue-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_chat_sessions'
        },
        () => {
          // Recalculate queue position when any session changes
          updateQueuePosition(liveChatSession);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveChatSession?.id, liveChatSession?.status]);

  // Polling fallback: while queued, re-check session status every 4s in case
  // realtime postgres_changes doesn't reach the anonymous visitor (RLS) and the
  // initial broadcast event was missed (race on subscribe).
  useEffect(() => {
    if (!conversationId) return;
    if (!liveChatSession || liveChatSession.status !== 'queued') return;

    const interval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('live_chat_sessions_public' as any)
          .select('*')
          .eq('conversation_id', conversationId)
          .maybeSingle();

        if (data && data.status !== 'queued') {
          console.log('Polling detected status change:', data.status);
          setLiveChatSession(data);
          // If accepted, add the "You are speaking with a human agent" message
          if (data.status === 'active') {
            const dedupeKey = `agent-joined-${data.id}`;
            if (!renderedMessageIdsRef.current.has(dedupeKey)) {
              renderedMessageIdsRef.current.add(dedupeKey);
              playNotificationSound();
              setTranscript(t => [...t, {
                text: '👋 You are speaking with a human agent now.',
                role: 'assistant' as const
              }]);
            }
            setQueuePosition(null);
            setEstimatedWaitMinutes(null);
          }
        }
      } catch (err) {
        console.error('Polling live_chat_session failed:', err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [conversationId, liveChatSession?.id, liveChatSession?.status]);

  const initializeTextConversation = async (preChatData?: any): Promise<boolean> => {
    try {
      const visitorId = localStorage.getItem('visitor_id') || `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('visitor_id', visitorId);

      const response = await fetch(
        `https://rgczbabidcqvpyiiqjfv.supabase.co/functions/v1/chat-message`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            visitorId,
            preChatData,
            message: preChatData?.message || undefined,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to start chat');

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      if (preChatData?.message) {
        handleTranscript(preChatData.message, 'user');
        if (data.messageId) renderedMessageIdsRef.current.add(data.messageId);
        if (data.reply) handleTranscript(data.reply, 'assistant');
      }
      return true;
    } catch (error) {
      console.error('Error initializing text conversation:', error);
      handleTranscript('⚠️ Message failed to send. Please check your connection and try again.', 'assistant');
      return false;
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

      const data = await response.json();
      console.log('Live agent request response:', data);

      if (!response.ok) {
        // Check if visitor already has an active request
        if (data.existingSession) {
          handleTranscript("You already have a pending request to speak with an agent. Please wait - someone will be with you shortly! 🙏", 'assistant');
          setLiveChatSession(data.existingSession);
          return;
        }
        throw new Error(data.error || `Service error: ${response.status}`);
      }
      
      if (data.session) {
        setLiveChatSession(data.session);
        setQueuePosition(data.queuePosition || 1);
        setEstimatedWaitMinutes(data.estimatedWaitMinutes || 3);
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

  // Cancel live agent request
  const cancelLiveAgentRequest = async () => {
    if (!liveChatSession || cancelingRequest) return;
    
    try {
      setCancelingRequest(true);
      
      const visitorId = localStorage.getItem('visitor_id');
      
      const response = await fetch(
        `https://rgczbabidcqvpyiiqjfv.supabase.co/functions/v1/cancel-live-agent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: liveChatSession.id,
            visitorId: visitorId,
            businessId: businessId
          })
        }
      );

      const data = await response.json();
      console.log('Cancel request response:', data);

      if (response.ok) {
        setLiveChatSession(null);
        setQueuePosition(null);
        setEstimatedWaitMinutes(null);
        localStorage.removeItem(getStorageKey(businessId, 'sessionId'));
        handleTranscript('Your request has been cancelled. Feel free to request an agent again if you need help!', 'assistant');
      } else {
        throw new Error(data.error || 'Failed to cancel request');
      }
    } catch (error) {
      console.error('Error canceling live agent request:', error);
      handleTranscript('Sorry, unable to cancel the request. Please try again.', 'assistant');
    } finally {
      setCancelingRequest(false);
    }
  };

  const handleTranscript = (text: string, role: "user" | "assistant", imageUrl?: string) => {
    setTranscript(prev => [...prev, { text, role, imageUrl }]);
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      handleTranscript('Please upload a valid image (JPEG, PNG, GIF, or WebP).', 'assistant');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      handleTranscript('Image is too large. Maximum size is 5MB.', 'assistant');
      return;
    }

    setUploadingImage(true);

    try {
      let visitorId = localStorage.getItem('visitor_id');
      if (!visitorId) {
        visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('visitor_id', visitorId);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('businessId', businessId);
      formData.append('visitorId', visitorId);
      if (conversationId) {
        formData.append('conversationId', conversationId);
      }

      const response = await fetch(
        `https://rgczbabidcqvpyiiqjfv.supabase.co/functions/v1/visitor-upload-image`,
        {
          method: 'POST',
          body: formData
        }
      );

      const data = await response.json();
      console.log('Image upload response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      // Update conversation ID if returned
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      // Add image to transcript
      handleTranscript(`📷 ${file.name}`, 'user', data.imageUrl);

    } catch (error) {
      console.error('Error uploading image:', error);
      handleTranscript('Failed to upload image. Please try again.', 'assistant');
    } finally {
      setUploadingImage(false);
      // Reset the input
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  // Auto-scroll to bottom when transcript changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const handleSendText = async (messageOverride?: string) => {
    const message = messageOverride || textInput.trim();
    if (!message || sendingMessage) return;

    // If we already have a conversation, we'll rely on the realtime INSERT listener
    // to append the assistant reply (prevents duplicate replies).
    const hasActiveConversation = Boolean(conversationId);

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
            message: message,
            conversationId: conversationId,
            preChatData: visitorInfo && Object.keys(visitorInfo).length > 0 ? visitorInfo : undefined
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

      // Update conversation ID if returned (handles session transitions)
      if (data.conversationId && data.conversationId !== conversationId) {
        console.log('Conversation ID updated from backend:', data.conversationId);
        setConversationId(data.conversationId);
      }

      // If human agent is active, don't show AI response
      if (data.humanAgentActive) {
        console.log('Human agent is handling this conversation');
        return;
      }

      // Always display the reply from the HTTP response.
      // Track the message ID to prevent duplicates from realtime.
      if (data.reply) {
        if (data.messageId) {
          renderedMessageIdsRef.current.add(data.messageId);
        }
        handleTranscript(data.reply, 'assistant');
      }
      
      // Escalation handled via live agent button
    } catch (error) {
      console.error('Error sending text message:', error);
      handleTranscript('⚠️ Message failed to send. Please check your connection and try again.', 'assistant');
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

  const renderInteractiveMessage = (text: string, role: string) => {
    if (!text) return null;
    
    const isQuickReply = text.includes('[Quick Reply Options: ');
    const isListMenu = text.includes('[List Menu: ');
    
    if (isQuickReply || isListMenu) {
      const lines = text.split('\n');
      const interactiveLineIndex = lines.findIndex(l => l.startsWith('[Quick Reply Options: ') || l.startsWith('[List Menu: '));
      
      if (interactiveLineIndex !== -1) {
        const interactiveLine = lines[interactiveLineIndex];
        const optionsStr = interactiveLine.replace(/\[(Quick Reply Options|List Menu):\s*/, '').replace(/\]$/, '');
        const options = optionsStr.split(', ').filter(Boolean);
        const textOnly = lines.filter((_, i) => i !== interactiveLineIndex).join('\n');
        
        return (
          <div className="flex flex-col gap-2">
            <p className="text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap">{textOnly}</p>
            {role === 'assistant' && options.length > 0 && (
              <div className={`flex ${isQuickReply ? 'flex-row flex-wrap' : 'flex-col'} gap-1.5 mt-1`}>
                {options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendText(opt)}
                    className="bg-background text-foreground text-xs sm:text-sm px-3 py-1.5 rounded-md sm:rounded-full border shadow-sm hover:opacity-90 transition-opacity text-left font-medium"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      }
    }
    
    return <p className="text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap">{text}</p>;
  };

  // Render Chat Tab Content
  const renderChatContent = () => {
    // Still determining whether to show form (settings loading)
    if (showPreChatForm === null) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    
    // Show pre-chat form if enabled and not completed
    if (showPreChatForm) {
      return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-2 sm:p-3 md:p-4 overflow-y-auto">
            <PreChatForm
              welcomeMessage={settings?.pre_chat_welcome_message}
              requiredFields={settings?.pre_chat_required_fields || ['name', 'email']}
              primaryColor={primaryColor}
              onSubmit={async (data) => {
                const started = await initializeTextConversation(data);
                if (started) {
                  setVisitorInfo(data);
                  setVisitorEmail(data.email);
                  setPreChatCompleted(true);
                  setShowPreChatForm(false);
                }
              }}
            />
          </div>
        </div>
      );
    }
    
    // Show main chat interface
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
                    {item.imageUrl && (
                      <img 
                        src={item.imageUrl} 
                        alt="Uploaded image" 
                        className="max-w-full rounded-md mb-1 max-h-48 object-contain"
                        onClick={() => window.open(item.imageUrl, '_blank')}
                        style={{ cursor: 'pointer' }}
                      />
                    )}
                    {renderInteractiveMessage(item.text, item.role)}
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
            {/* Email input for live agent when pre-chat is disabled */}
            {showEmailInput && !visitorEmail && (
              <div className="m-2 sm:m-3 p-2 sm:p-3 bg-muted/50 border rounded-lg">
                <p className="text-xs sm:text-sm font-medium mb-2">Enter your email to connect with an agent:</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const emailInput = form.elements.namedItem('agent-email') as HTMLInputElement;
                    const email = emailInput?.value?.trim();
                    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                      setVisitorEmail(email);
                      setShowEmailInput(false);
                      // Auto-trigger live agent request with the email
                      setTimeout(() => {
                        requestLiveAgent('User requested live agent support');
                      }, 100);
                    }
                  }}
                  className="flex gap-2"
                >
                  <Input
                    name="agent-email"
                    type="email"
                    placeholder="your.email@example.com"
                    className="h-8 text-xs sm:text-sm flex-1"
                    required
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 px-3 text-xs shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Submit
                  </Button>
                </form>
              </div>
            )}
            {liveChatSession && liveChatSession.status === 'queued' && (
              <div className="m-2 sm:m-3 p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                    <p className="font-medium text-yellow-800 dark:text-yellow-200 text-xs sm:text-sm">Waiting for agent</p>
                  </div>
                  <Button
                    onClick={cancelLiveAgentRequest}
                    disabled={cancelingRequest}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px] sm:text-xs text-yellow-700 hover:text-yellow-900 dark:text-yellow-300 dark:hover:text-yellow-100 hover:bg-yellow-100 dark:hover:bg-yellow-900/40"
                  >
                    {cancelingRequest ? 'Canceling...' : 'Cancel'}
                  </Button>
                </div>
                <div className="flex items-center gap-3 text-[10px] sm:text-xs text-yellow-700 dark:text-yellow-300">
                  {queuePosition !== null && (
                    <span className="flex items-center gap-1">
                      <span className="font-semibold">#{queuePosition}</span> in queue
                    </span>
                  )}
                  {estimatedWaitMinutes !== null && (
                    <span>~{estimatedWaitMinutes} min wait</span>
                  )}
                </div>
              </div>
            )}
            {liveChatSession?.status === 'active' && (
              <div className="m-2 sm:m-3 p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <p className="font-medium text-green-800 dark:text-green-200 text-xs sm:text-sm">✅ Agent has accepted - Speaking with live agent</p>
                </div>
              </div>
            )}
            
            <div className="px-2 sm:px-3 pt-2 pb-2">
              <div className="flex gap-1.5 sm:gap-2 items-center">
                {/* Image upload button */}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 shrink-0"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                  title="Send image"
                >
                  {uploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImageIcon className="h-4 w-4" />
                  )}
                </Button>
                
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
                  className="flex-1 px-2 sm:px-3 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
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

            {/* WhatsApp continuation and Live Agent buttons */}
            <div className="px-2 sm:px-3 pb-2 space-y-1.5">
              <ContinueOnWhatsApp 
                businessId={businessId}
                conversationId={conversationId}
                primaryColor={primaryColor}
              />
              
              {(!liveChatSession || liveChatSession.status === 'ended' || liveChatSession.status === 'ai') && (
                <Button
                  onClick={() => requestLiveAgent('User requested live agent support')}
                  disabled={requestingAgent}
                  size="sm"
                  className="w-full h-9 text-xs font-medium text-white gap-1.5"
                  style={{ backgroundColor: primaryColor }}
                >
                  <User className="w-3.5 h-3.5" />
                  {requestingAgent ? 'Connecting…' : 'Connect to a Human Agent'}
                </Button>
              )}
            </div>
            
          </div>
        </div>
    );
  };

  const handleProactiveClick = () => {
    setProactiveMessage(null);
    setIsOpen(true);
    setActiveTab('chat');
  };

  // Show proactive popup when message is set
  const showProactivePopup = !isOpen && proactiveMessage;

  // When embedded in iframe, render full-size card directly without button
  if (isEmbedded) {
    return (
      <Card className="w-full h-full shadow-none border-0 flex flex-col overflow-hidden rounded-none">
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
            <ContinueOnWhatsApp 
              businessId={businessId}
              conversationId={conversationId}
              primaryColor={primaryColor}
              variant="header"
            />
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
          
          {/* Branding for Embedded */}
          <div className="py-1.5 flex justify-center border-t bg-muted/20 shrink-0">
            <a 
              href="https://lyqn.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[9px] font-medium text-muted-foreground hover:text-primary transition-colors tracking-tight uppercase"
            >
              Powered by <span className="font-bold text-foreground">Lyqn AI</span>
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Standalone widget with button (for demo page or direct use)
  return (
    <div className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 z-50 flex flex-col items-end">
      {isOpen ? (
        <Card className="w-[calc(100vw-1rem)] sm:w-[400px] h-[calc(100dvh-5rem)] sm:h-[600px] shadow-2xl flex flex-col overflow-hidden">
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
              <ContinueOnWhatsApp 
                businessId={businessId}
                conversationId={conversationId}
                primaryColor={primaryColor}
                variant="header"
              />
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="text-muted-foreground hover:text-foreground p-2 -mr-1 shrink-0 touch-manipulation"
                aria-label="Close chat window"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
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

            {/* Branding */}
            <div className="py-1.5 flex justify-center border-t bg-muted/20 shrink-0">
              <a 
                href="https://lyqn.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[9px] font-medium text-muted-foreground hover:text-primary transition-colors tracking-tight uppercase"
              >
                Powered by <span className="font-bold text-foreground">Lyqn AI</span>
              </a>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Proactive speech bubble - appears above the button */}
          {showProactivePopup && (
            <div className="mb-3">
              <div 
                onClick={handleProactiveClick}
                className="relative bg-card border rounded-2xl shadow-lg py-2.5 px-4 max-w-[220px] cursor-pointer animate-in slide-in-from-bottom-2 fade-in duration-300"
              >
                <p className="text-sm text-foreground leading-snug">
                  {proactiveMessage || "👋 Hi there! How can I help you today?"}
                </p>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setProactiveMessage(null); 
                    setProactiveShown(true);
                  }}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center shadow-md hover:bg-destructive/90"
                >
                  <X className="w-3 h-3" />
                </button>
                {/* Speech bubble pointer/arrow */}
                <div 
                  className="absolute -bottom-2 right-6 w-4 h-4 bg-card border-r border-b rotate-45"
                  style={{ borderColor: 'hsl(var(--border))' }}
                />
              </div>
            </div>
          )}
          
          <Button
            onClick={() => { 
              setIsOpen(true); 
              setProactiveMessage(null);
              setProactiveShown(true);
            }}
            className="rounded-full w-14 h-14 sm:w-16 sm:h-16 shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </Button>
        </>
      )}
    </div>
  );
};
