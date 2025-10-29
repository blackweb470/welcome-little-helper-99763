import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import VoiceInterface from "@/components/VoiceInterface";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [businessId] = useState("demo"); // Demo mode for landing page
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);

  const handleTranscript = (text: string, role: 'user' | 'assistant') => {
    setMessages(prev => [...prev, { role, content: text }]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">AI Chat Widget</h1>
        <Button onClick={() => navigate("/auth")}>Get Started</Button>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-5xl font-bold">
            24/7 AI Customer Support
            <br />
            <span className="text-primary">For Your Business</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Add intelligent voice and text chat to your website in minutes. 
            Powered by OpenAI's latest Realtime API.
          </p>

          <Card className="p-12 bg-card/50 backdrop-blur">
            <h3 className="text-2xl font-semibold mb-6">Try it Now</h3>
            <VoiceInterface 
              businessId={businessId}
              onTranscript={handleTranscript}
            />
            
            {messages.length > 0 && (
              <div className="mt-8 space-y-2 max-h-60 overflow-y-auto">
                {messages.slice(-5).map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg text-left ${
                      msg.role === 'user'
                        ? 'bg-primary/10 ml-auto max-w-[80%]'
                        : 'bg-secondary max-w-[80%]'
                    }`}
                  >
                    <p className="text-sm font-medium">{msg.role === 'user' ? 'You' : 'AI'}</p>
                    <p>{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="grid md:grid-cols-3 gap-6 pt-12">
            <Card className="p-6">
              <h4 className="font-semibold mb-2">Voice & Text</h4>
              <p className="text-sm text-muted-foreground">
                Natural voice conversations with instant text transcription
              </p>
            </Card>
            <Card className="p-6">
              <h4 className="font-semibold mb-2">Easy Setup</h4>
              <p className="text-sm text-muted-foreground">
                Copy-paste embed code. No complex integration needed
              </p>
            </Card>
            <Card className="p-6">
              <h4 className="font-semibold mb-2">Full Analytics</h4>
              <p className="text-sm text-muted-foreground">
                Track all conversations and customer insights
              </p>
            </Card>
          </div>

          <Button size="lg" onClick={() => navigate("/auth")}>
            Start Free Trial
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Index;
