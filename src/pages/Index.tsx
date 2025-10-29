import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import VoiceInterface from "@/components/VoiceInterface";
import { supabase } from "@/integrations/supabase/client";
import { 
  MessageSquare, 
  Brain, 
  TrendingUp, 
  Zap, 
  Users, 
  BarChart3, 
  ShieldCheck,
  Sparkles,
  Clock,
  Target,
  Mic,
  Bot,
  FileText,
  Home
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [businessId] = useState("demo"); // Demo mode for landing page
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);

  const handleTranscript = (text: string, role: 'user' | 'assistant') => {
    setMessages(prev => [...prev, { role, content: text }]);
  };

  const features = [
    {
      icon: <Mic className="w-8 h-8" />,
      title: "Real-Time Voice AI",
      description: "Natural voice conversations powered by OpenAI's latest Realtime API. Instant responses with human-like interactions.",
      badge: "Advanced"
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Sentiment Analysis",
      description: "Real-time emotion detection analyzes customer mood and adjusts responses for better engagement and satisfaction.",
      badge: "Smart"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Behavioral Scoring",
      description: "AI-powered visitor scoring tracks engagement, predicts conversion likelihood, and identifies high-value prospects.",
      badge: "Intelligent"
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Conversation Memory",
      description: "Contextual understanding remembers past interactions, preferences, and key facts for personalized experiences.",
      badge: "Contextual"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Product Recommendations",
      description: "Smart AI suggests relevant products based on conversation context, increasing sales and customer satisfaction.",
      badge: "Revenue+"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "AI-to-Human Handoff",
      description: "Seamless escalation to live agents when needed. Queue management ensures no customer is left waiting.",
      badge: "Hybrid"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Proactive Engagement",
      description: "Trigger personalized messages based on visitor behavior, time on page, or custom rules to boost conversions.",
      badge: "Proactive"
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Ticket Management",
      description: "Automatically create and track support tickets with priority levels, assignments, and SLA monitoring.",
      badge: "Organized"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Advanced Analytics",
      description: "Comprehensive dashboards track conversations, sentiment trends, response times, and customer insights.",
      badge: "Data-Driven"
    },
    {
      icon: <ShieldCheck className="w-8 h-8" />,
      title: "Multi-Business Support",
      description: "Manage multiple businesses with separate widgets, settings, and analytics from one unified dashboard.",
      badge: "Scalable"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "24/7 Availability",
      description: "Never miss a customer. AI handles inquiries round-the-clock with instant responses and zero wait times.",
      badge: "Always On"
    },
    {
      icon: <Bot className="w-8 h-8" />,
      title: "Full Customization",
      description: "Customize AI personality, appearance, welcome messages, and behavior to match your brand perfectly.",
      badge: "Branded"
    }
  ];

  const benefits = [
    {
      stat: "10x",
      label: "Faster Response Times",
      description: "Instant AI responses vs. traditional support"
    },
    {
      stat: "85%",
      label: "Cost Reduction",
      description: "Automate routine queries and scale effortlessly"
    },
    {
      stat: "24/7",
      label: "Always Available",
      description: "Never miss a customer, any time zone"
    },
    {
      stat: "45%",
      label: "Higher Conversions",
      description: "Proactive engagement at the right moment"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">LYQN Documentation</h1>
              <p className="text-muted-foreground mt-2">
                Complete guide to using your AI-powered customer engagement platform
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/docs">
                  <FileText className="mr-2 h-4 w-4" />
                  Documentation
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="py-20 text-center">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by OpenAI Realtime API
          </Badge>
          
          <h2 className="text-5xl md:text-6xl font-bold mb-6 max-w-4xl mx-auto">
            The Most Advanced AI Customer Support Agent
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Not just a chatbot. A complete AI-powered customer engagement platform with voice, 
            sentiment analysis, behavioral scoring, and intelligent automation.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" onClick={() => {
              document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Try Live Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {benefits.map((benefit, i) => (
              <Card key={i} className="p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{benefit.stat}</div>
                <div className="font-semibold mb-1">{benefit.label}</div>
                <div className="text-xs text-muted-foreground">{benefit.description}</div>
              </Card>
            ))}
          </div>
        </section>

        {/* Demo Section */}
        <section id="demo" className="py-16 max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 bg-card/50 backdrop-blur border-2">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-2">Experience It Live</h3>
              <p className="text-muted-foreground">Click the microphone to start a voice conversation with our AI agent</p>
            </div>
            
            <VoiceInterface 
              businessId={businessId}
              onTranscript={handleTranscript}
            />
            
            {messages.length > 0 && (
              <div className="mt-8 space-y-3 max-h-80 overflow-y-auto">
                {messages.slice(-5).map((msg, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-primary/10 ml-auto max-w-[85%]'
                        : 'bg-secondary max-w-[85%]'
                    }`}
                  >
                    <p className="text-sm font-semibold mb-1 flex items-center gap-2">
                      {msg.role === 'user' ? (
                        <>
                          <Users className="w-4 h-4" />
                          You
                        </>
                      ) : (
                        <>
                          <Bot className="w-4 h-4" />
                          AI Agent
                        </>
                      )}
                    </p>
                    <p>{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

        {/* Why Superior Section */}
        <section className="py-16 text-center">
          <Badge variant="secondary" className="mb-4">Why We're Different</Badge>
          <h3 className="text-4xl font-bold mb-4">Not Your Average Chatbot</h3>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
            While others offer basic chat, we deliver an enterprise-grade AI customer engagement platform 
            with features that actually drive results.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <Card key={i} className="p-6 text-left hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg text-primary">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-lg">{feature.title}</h4>
                      <Badge variant="secondary" className="text-xs">{feature.badge}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-16 max-w-5xl mx-auto">
          <h3 className="text-4xl font-bold text-center mb-12">The Clear Choice</h3>
          <Card className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-2xl font-bold mb-4 text-destructive">❌ Basic Chatbots</h4>
                <ul className="space-y-3 text-muted-foreground">
                  <li>• Text-only responses</li>
                  <li>• No emotion detection</li>
                  <li>• Generic, scripted answers</li>
                  <li>• No visitor intelligence</li>
                  <li>• Basic analytics only</li>
                  <li>• Can't escalate to humans</li>
                  <li>• Reactive only</li>
                  <li>• Limited customization</li>
                </ul>
              </div>
              <div>
                <h4 className="text-2xl font-bold mb-4 text-primary">✅ AI Support Pro</h4>
                <ul className="space-y-3">
                  <li>• Voice + Text conversations</li>
                  <li>• Real-time sentiment analysis</li>
                  <li>• Contextual memory & personalization</li>
                  <li>• Behavioral scoring & predictions</li>
                  <li>• Advanced analytics dashboard</li>
                  <li>• Seamless AI-to-human handoff</li>
                  <li>• Proactive engagement rules</li>
                  <li>• Full brand customization</li>
                </ul>
              </div>
            </div>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="py-20 text-center">
          <Card className="p-12 max-w-3xl mx-auto bg-gradient-to-br from-primary/10 to-secondary/10">
            <h3 className="text-4xl font-bold mb-4">Ready to Transform Your Customer Support?</h3>
            <p className="text-xl text-muted-foreground mb-8">
              Join businesses already using the most advanced AI agent. Start your free trial today.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/auth")}>
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
                View Pricing
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">No credit card required • Setup in 5 minutes</p>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-muted-foreground">
        <div className="container mx-auto px-4">
          <p>© 2025 AI Support Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
