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
  }, [businessId]);

  const handleTranscript = (text: string, role: "user" | "assistant") => {
    setTranscript(prev => [...prev, { text, role }]);
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

              {/* Voice interface */}
              <div className="border-t p-4 bg-muted/30">
                <VoiceInterface
                  businessId={businessId}
                  onTranscript={handleTranscript}
                />
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