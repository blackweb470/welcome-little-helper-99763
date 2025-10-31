import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bot className="w-8 h-8 text-primary" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                LYQN AI
              </span>
            </div>
            <nav className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link to="/features">Features</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/docs">Docs</Link>
              </Button>
              <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/auth">Start Free Trial</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="relative py-32 text-center overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-700" />
          </div>
          
          <div className="space-y-8">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Self-Learning AI • Powered by OpenAI
            </Badge>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight max-w-5xl mx-auto">
              AI That Learns
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Your Business
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Revolutionary AI customer support that gets smarter with every conversation.
              Learns your products, customers, and business—automatically.
            </p>

            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate("/auth")}>
                Start Free Trial
                <Sparkles className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={() => {
                document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Watch Demo
              </Button>
            </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto pt-12">
            {benefits.map((benefit, i) => (
              <Card key={i} className="p-8 text-center border-2 hover:border-primary/50 transition-all hover:shadow-lg bg-card/50 backdrop-blur">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent mb-3">
                  {benefit.stat}
                </div>
                <div className="font-semibold text-lg mb-2">{benefit.label}</div>
                <div className="text-sm text-muted-foreground">{benefit.description}</div>
              </Card>
            ))}
          </div>
          </div>
        </section>

        {/* Self-Learning Feature Highlight */}
        <section className="py-20 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="text-sm">
                <Brain className="w-4 h-4 mr-2" />
                Revolutionary Technology
              </Badge>
              <h3 className="text-4xl md:text-5xl font-bold">
                Gets Smarter With Every Conversation
              </h3>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Our AI doesn't just respond—it learns. Every customer interaction teaches it about your products, 
                policies, and customer preferences. The more conversations, the more intelligent it becomes.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 p-1 bg-primary/10 rounded">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Automatic Learning</div>
                    <div className="text-muted-foreground">Extracts insights from AI and human conversations</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 p-1 bg-primary/10 rounded">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Business-Specific Knowledge</div>
                    <div className="text-muted-foreground">Learns your unique products, policies, and FAQs</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 p-1 bg-primary/10 rounded">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Continuous Improvement</div>
                    <div className="text-muted-foreground">Response quality improves automatically over time</div>
                  </div>
                </li>
              </ul>
            </div>
            <Card className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-2">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-background rounded-lg">
                  <MessageSquare className="w-6 h-6 text-primary" />
                  <div className="text-sm flex-1">
                    <div className="font-medium mb-1">Customer asks about shipping</div>
                    <div className="text-muted-foreground text-xs">AI learns: "Standard shipping is 3-5 days"</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-background rounded-lg">
                  <Brain className="w-6 h-6 text-primary" />
                  <div className="text-sm flex-1">
                    <div className="font-medium mb-1">AI stores the knowledge</div>
                    <div className="text-muted-foreground text-xs">Added to business-specific learning database</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-background rounded-lg">
                  <Zap className="w-6 h-6 text-primary" />
                  <div className="text-sm flex-1">
                    <div className="font-medium mb-1">Next customer gets instant answer</div>
                    <div className="text-muted-foreground text-xs">AI applies learned knowledge automatically</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Demo Section */}
        <section id="demo" className="py-20 max-w-5xl mx-auto">
          <Card className="p-12 md:p-16 bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-2 border-primary/20">
            <div className="text-center space-y-6">
              <Badge variant="secondary" className="text-sm">
                <Mic className="w-4 h-4 mr-2" />
                Live Demo Available
              </Badge>
              <h3 className="text-4xl md:text-5xl font-bold">See the Future of Customer Support</h3>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Experience our self-learning AI in action. Watch it get smarter with every interaction.
              </p>
              <div className="flex flex-wrap gap-4 justify-center pt-4">
                <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate("/auth")}>
                  Start Free Trial
                  <Sparkles className="w-5 h-5 ml-2" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-6 pt-8 max-w-3xl mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">✓</div>
                  <div className="text-sm font-medium mt-2">No Credit Card</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">✓</div>
                  <div className="text-sm font-medium mt-2">5 Min Setup</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">✓</div>
                  <div className="text-sm font-medium mt-2">Full Features</div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Why Superior Section */}
        <section className="py-20 text-center">
          <Badge variant="secondary" className="mb-6 text-sm">
            <ShieldCheck className="w-4 h-4 mr-2" />
            Enterprise-Grade Features
          </Badge>
          <h3 className="text-4xl md:text-5xl font-bold mb-6">
            Beyond Basic Chatbots
          </h3>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-16">
            While competitors offer simple chat, we deliver a complete AI platform with advanced learning,
            voice capabilities, and deep business intelligence.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {features.map((feature, i) => (
              <Card key={i} className="p-8 text-left hover:shadow-xl hover:border-primary/30 transition-all group bg-card/50 backdrop-blur">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl text-primary w-fit group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="font-bold text-xl">{feature.title}</h4>
                      <Badge variant="secondary" className="text-xs">{feature.badge}</Badge>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
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
        <section className="py-24 text-center">
          <Card className="p-16 max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_70%)]" />
            <div className="relative z-10 space-y-8">
              <h3 className="text-5xl md:text-6xl font-bold">
                Ready to Deploy AI That Actually Learns?
              </h3>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                Join innovative businesses using self-learning AI to transform customer support.
                Start free, no credit card required.
              </p>
              <div className="flex flex-wrap gap-6 justify-center pt-6">
                <Button size="lg" className="text-lg px-10 py-7" onClick={() => navigate("/auth")}>
                  Start Free Trial
                  <Sparkles className="w-5 h-5 ml-2" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-10 py-7" onClick={() => navigate("/docs")}>
                  View Documentation
                  <FileText className="w-5 h-5 ml-2" />
                </Button>
              </div>
              <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span>No Credit Card</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span>5 Min Setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span>AI Learns Instantly</span>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-primary" />
              <span className="font-bold text-xl">LYQN AI</span>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <Link to="/features" className="hover:text-foreground transition-colors">Features</Link>
              <Link to="/features-testing" className="hover:text-foreground transition-colors">Testing Center</Link>
              <Link to="/docs" className="hover:text-foreground transition-colors">Documentation</Link>
              <Link to="/auth" className="hover:text-foreground transition-colors">Login</Link>
            </div>
            <p className="text-sm text-muted-foreground">© 2025 LYQN AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
