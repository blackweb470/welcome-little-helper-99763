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
      // Create conversation if not exists
      let convId = conversationId;
      if (!convId) {
        const { data: conv } = await supabase
          .from('conversations')
          .insert({ business_id: businessId })
          .select()
          .single();
        
        if (conv) {
          convId = conv.id;
          setConversationId(convId);
        }
      }

      if (!convId) return;

      const { data: session, error } = await supabase
        .from('live_chat_sessions')
        .insert({
          conversation_id: convId,
          status: 'queued',
          queued_at: new Date().toISOString(),
          transfer_reason: reason
        })
        .select()
        .single();

      if (error) throw error;

      setLiveChatSession(session);
      handleTranscript('Your request has been sent to our team. An agent will join shortly.', 'assistant');
    } catch (error) {
      console.error('Error requesting live agent:', error);
      handleTranscript('Sorry, unable to connect to a live agent right now. Please try again.', 'assistant');
    }
  };

  const handleTranscript = (text: string, role: "user" | "assistant") => {
    setTranscript(prev => [...prev, { text, role }]);
  };

  const handleSendText = async () => {
    if (!textInput.trim() || !sendMessageFn) return;

    const message = textInput.trim();
    setTextInput("");
    
    // Add to transcript immediately
    handleTranscript(message, "user");
    
    try {
      await sendMessageFn(message);
    } catch (error) {
      console.error('Error sending text message:', error);
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
        <Card className="w-96 shadow-2xl animate-in slide-in-from-bottom-5">
          <CardHeader className="border-b p-4" style={{ backgroundColor: `${primaryColor}10` }}>
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
                <div className="p-4 bg-muted/50">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
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

              {/* Voice and Text interface */}
              <div className="border-t bg-muted/30">
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
                
                {/* Voice Interface */}
                <div className="p-4">
                  <VoiceInterface
                    businessId={businessId}
                    onTranscript={handleTranscript}
                    onConversationCreated={setConversationId}
                    onChatReady={setSendMessageFn}
                  />
                </div>

                {/* Text Input */}
                <div className="px-4 pb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      disabled={!sendMessageFn}
                      className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <Button
                      onClick={handleSendText}
                      disabled={!textInput.trim() || !sendMessageFn}
                      size="sm"
                      style={{ backgroundColor: sendMessageFn ? primaryColor : undefined }}
                    >
                      Send
                    </Button>
                  </div>
                </div>

                {!liveChatSession && (
                  <div className="px-4 pb-4">
                    <Button
                      onClick={() => requestLiveAgent('Customer requested live support')}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Talk to Live Agent
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