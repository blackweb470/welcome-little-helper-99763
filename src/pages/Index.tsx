import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Brain, 
  Users, 
  BarChart3, 
  ShieldCheck,
  Target,
  Mic,
  Bot,
  Menu,
  Check,
  ArrowRight
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Index = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: <Mic className="w-6 h-6" />,
      title: "Voice AI Chat",
      description: "Natural conversations with voice support using OpenAI's Realtime API"
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI Conversation Analysis",
      description: "Automatic analysis of customer conversations to identify issues, questions, and complaints"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Team Management",
      description: "Invite team members with role-based permissions and pending invitation tracking"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Advanced Analytics",
      description: "Track conversations, sentiment, and customer insights with AI-powered insights"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "AI Chat Suggestions",
      description: "Contextual response suggestions for live agents powered by conversation history"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Live Agent Handoff",
      description: "Seamlessly transfer complex queries to human agents with full context"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-display font-bold text-xl group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-glow transition-all group-hover:scale-110 group-hover:shadow-glow-lg">
              <Bot className="w-5 h-5" />
            </div>
            <span className="text-gradient">
              LYQN AI
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group">
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
            </Link>
            <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group">
              Pricing
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
            </Link>
            <Link to="/docs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group">
              Documentation
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
            </Link>
            <Button onClick={() => navigate("/auth")} size="lg">
              Get Started
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </nav>

          {/* Mobile Navigation */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                <Link 
                  to="/features" 
                  className="text-lg hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link 
                  to="/pricing" 
                  className="text-lg hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link 
                  to="/docs" 
                  className="text-lg hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Documentation
                </Link>
                <Button 
                  className="mt-4"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/auth");
                  }}
                >
                  Get Started
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-32 md:py-40 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent pointer-events-none" />
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-primary-glow/10 rounded-full blur-3xl" />
          
          <div className="relative animate-fade-in">
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border-2 border-primary/20 bg-primary/5 backdrop-blur-sm mb-8 shadow-glow">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary shadow-glow"></span>
              </span>
              <span className="text-sm font-semibold text-primary">AI-Powered Conversation Analysis & Team Collaboration</span>
            </div>
            
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.1]">
              AI-Powered Customer Support
              <br />
              <span className="text-gradient">
                That Actually Learns
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
              Intelligent chat platform with AI conversation analysis, team collaboration tools,
              and contextual agent assistance—all in one unified dashboard.
            </p>

            <div className="flex flex-wrap gap-4 justify-center mb-20 animate-slide-up">
              <Button size="lg" onClick={() => navigate("/auth")}>
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/docs")}>
                View Documentation
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto relative">
            <div className="group cursor-default">
              <div className="text-5xl font-display font-bold mb-3 text-gradient">24/7</div>
              <div className="text-sm text-muted-foreground font-medium">Always Available</div>
            </div>
            <div className="group cursor-default">
              <div className="text-5xl font-display font-bold mb-3 text-gradient">10x</div>
              <div className="text-sm text-muted-foreground font-medium">Faster Responses</div>
            </div>
            <div className="group cursor-default">
              <div className="text-5xl font-display font-bold mb-3 text-gradient">85%</div>
              <div className="text-sm text-muted-foreground font-medium">Cost Reduction</div>
            </div>
            <div className="group cursor-default">
              <div className="text-5xl font-display font-bold mb-3 text-gradient">1 mo</div>
              <div className="text-sm text-muted-foreground font-medium">Free Trial</div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t bg-gradient-to-b from-muted/30 to-background py-32">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
                Everything You Need
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                A complete AI platform for modern customer support
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {features.map((feature, i) => (
                <Card key={i} className="p-8 hover:shadow-glow hover:border-primary/30 transition-all duration-300 group cursor-pointer relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="mb-6 inline-flex p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl text-primary group-hover:scale-110 group-hover:shadow-glow transition-all">
                      {feature.icon}
                    </div>
                    <h3 className="font-display font-semibold text-xl mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* New Features Highlight */}
        <section className="py-32 border-t">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <div className="inline-block px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6 shadow-glow">
                Latest Updates
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
                New AI-Powered Features
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Recent improvements to help you deliver better customer support
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <Card className="p-10 border-2 border-primary/20 hover:border-primary/40 hover:shadow-glow-lg transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="mb-6 inline-flex p-5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl text-primary shadow-glow">
                    <Brain className="w-8 h-8" />
                  </div>
                  <h3 className="font-display font-bold text-2xl mb-4">AI Conversation Analysis</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Automatically analyze all customer conversations to identify common issues, 
                    frequently asked questions, and customer complaints. Get actionable insights 
                    with severity ratings and suggested responses.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="font-medium">Pattern Detection</Badge>
                    <Badge variant="secondary" className="font-medium">Issue Categorization</Badge>
                    <Badge variant="secondary" className="font-medium">Time-based Filtering</Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-10 border-2 border-primary/20 hover:border-primary/40 hover:shadow-glow-lg transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="mb-6 inline-flex p-5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl text-primary shadow-glow">
                    <Target className="w-8 h-8" />
                  </div>
                  <h3 className="font-display font-bold text-2xl mb-4">AI Chat Suggestions for Agents</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Live agents get real-time AI-powered response suggestions based on conversation 
                    context, customer sentiment, and chat history. Simply click to insert the 
                    suggested response and personalize as needed.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="font-medium">Context-Aware</Badge>
                    <Badge variant="secondary" className="font-medium">One-Click Insert</Badge>
                    <Badge variant="secondary" className="font-medium">Sentiment Analysis</Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-10 border-2 border-primary/20 hover:border-primary/40 hover:shadow-glow-lg transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="mb-6 inline-flex p-5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl text-primary shadow-glow">
                    <Users className="w-8 h-8" />
                  </div>
                  <h3 className="font-display font-bold text-2xl mb-4">Enhanced Team Management</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Invite team members with customizable role-based permissions. Track pending 
                    invitations and manage active team members from a unified dashboard. Email 
                    notifications keep everyone in the loop.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="font-medium">Role-Based Access</Badge>
                    <Badge variant="secondary" className="font-medium">Pending Invites</Badge>
                    <Badge variant="secondary" className="font-medium">Email Notifications</Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-10 border-2 border-primary/20 hover:border-primary/40 hover:shadow-glow-lg transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="mb-6 inline-flex p-5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl text-primary shadow-glow">
                    <BarChart3 className="w-8 h-8" />
                  </div>
                  <h3 className="font-display font-bold text-2xl mb-4">Business Intelligence Reports</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Get detailed reports on top customer issues, most frequent questions, and 
                    complaint trends. Filter by date range (24h, 7d, 30d) to track improvements 
                    and identify areas needing attention.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="font-medium">Frequency Analysis</Badge>
                    <Badge variant="secondary" className="font-medium">Priority Ranking</Badge>
                    <Badge variant="secondary" className="font-medium">Date Filtering</Badge>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-32 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
                Simple Setup
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get started in minutes, not days
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
              <div className="text-center group">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground flex items-center justify-center text-3xl font-display font-bold mx-auto mb-6 shadow-glow group-hover:shadow-glow-lg group-hover:scale-110 transition-all">
                  1
                </div>
                <h3 className="font-display font-semibold text-xl mb-3">Create Account</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Sign up and create your first business profile in seconds
                </p>
              </div>
              
              <div className="text-center group">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground flex items-center justify-center text-3xl font-display font-bold mx-auto mb-6 shadow-glow group-hover:shadow-glow-lg group-hover:scale-110 transition-all">
                  2
                </div>
                <h3 className="font-display font-semibold text-xl mb-3">Customize Widget</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Configure colors, messages, and AI behavior to match your brand
                </p>
              </div>
              
              <div className="text-center group">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground flex items-center justify-center text-3xl font-display font-bold mx-auto mb-6 shadow-glow group-hover:shadow-glow-lg group-hover:scale-110 transition-all">
                  3
                </div>
                <h3 className="font-display font-semibold text-xl mb-3">Add to Site</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Copy the embed code and paste it into your website—done!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 relative">
            <Card className="p-16 md:p-20 text-center max-w-4xl mx-auto border-2 border-primary/20 shadow-glow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="relative">
                <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
                  Ready to Transform Your Support?
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground mb-10">
                  Start your 1-month free trial today. No credit card required.
                </p>
                <div className="flex flex-wrap gap-4 justify-center mb-8">
                  <Button size="lg" onClick={() => navigate("/auth")}>
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate("/pricing")}>
                    View Pricing
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground font-medium">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-primary" />
                    No credit card
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-primary" />
                    Cancel anytime
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-primary" />
                    Full features
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 font-semibold mb-4">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                  <Bot className="w-4 h-4" />
                </div>
                <span>LYQN AI</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Intelligent customer support platform powered by AI
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link to="/docs" className="hover:text-foreground transition-colors">Documentation</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            © 2025 LYQN AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;