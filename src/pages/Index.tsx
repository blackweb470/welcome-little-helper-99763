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
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-xl group">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground transition-transform group-hover:scale-110">
              <Bot className="w-5 h-5" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              LYQN AI
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="/docs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Documentation
            </Link>
            <Button onClick={() => navigate("/auth")} className="shadow-lg hover:shadow-xl transition-shadow">
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
        <section className="container mx-auto px-4 py-24 md:py-32 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-muted/50 backdrop-blur-sm mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm font-medium">AI-Powered Conversation Analysis & Team Collaboration</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              AI-Powered Customer Support
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                That Actually Learns
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Intelligent chat platform with AI conversation analysis, team collaboration tools,
              and contextual agent assistance—all in one unified dashboard.
            </p>

            <div className="flex flex-wrap gap-4 justify-center mb-16">
              <Button size="lg" onClick={() => navigate("/auth")} className="shadow-lg hover:shadow-xl transition-all">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/docs")} className="border-2">
                View Documentation
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Always Available</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">10x</div>
              <div className="text-sm text-muted-foreground">Faster Responses</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">85%</div>
              <div className="text-sm text-muted-foreground">Cost Reduction</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1 mo</div>
              <div className="text-sm text-muted-foreground">Free Trial</div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Everything You Need
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                A complete AI platform for modern customer support
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {features.map((feature, i) => (
                <Card key={i} className="p-6 hover:shadow-lg hover:border-primary/20 transition-all group cursor-pointer">
                  <div className="mb-4 inline-block p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl text-primary group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* New Features Highlight */}
        <section className="py-24 border-t">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                Latest Updates
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                New AI-Powered Features
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Recent improvements to help you deliver better customer support
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <Card className="p-8 border-2 hover:shadow-xl transition-all">
                <div className="mb-4 inline-block p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl text-primary">
                  <Brain className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-xl mb-3">AI Conversation Analysis</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Automatically analyze all customer conversations to identify common issues, 
                  frequently asked questions, and customer complaints. Get actionable insights 
                  with severity ratings and suggested responses.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Pattern Detection</Badge>
                  <Badge variant="secondary">Issue Categorization</Badge>
                  <Badge variant="secondary">Time-based Filtering</Badge>
                </div>
              </Card>

              <Card className="p-8 border-2 hover:shadow-xl transition-all">
                <div className="mb-4 inline-block p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl text-primary">
                  <Target className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-xl mb-3">AI Chat Suggestions for Agents</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Live agents get real-time AI-powered response suggestions based on conversation 
                  context, customer sentiment, and chat history. Simply click to insert the 
                  suggested response and personalize as needed.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Context-Aware</Badge>
                  <Badge variant="secondary">One-Click Insert</Badge>
                  <Badge variant="secondary">Sentiment Analysis</Badge>
                </div>
              </Card>

              <Card className="p-8 border-2 hover:shadow-xl transition-all">
                <div className="mb-4 inline-block p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl text-primary">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-xl mb-3">Enhanced Team Management</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Invite team members with customizable role-based permissions. Track pending 
                  invitations and manage active team members from a unified dashboard. Email 
                  notifications keep everyone in the loop.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Role-Based Access</Badge>
                  <Badge variant="secondary">Pending Invites</Badge>
                  <Badge variant="secondary">Email Notifications</Badge>
                </div>
              </Card>

              <Card className="p-8 border-2 hover:shadow-xl transition-all">
                <div className="mb-4 inline-block p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl text-primary">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-xl mb-3">Business Intelligence Reports</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Get detailed reports on top customer issues, most frequent questions, and 
                  complaint trends. Filter by date range (24h, 7d, 30d) to track improvements 
                  and identify areas needing attention.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Frequency Analysis</Badge>
                  <Badge variant="secondary">Priority Ranking</Badge>
                  <Badge variant="secondary">Date Filtering</Badge>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Simple Setup
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get started in minutes, not days
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  1
                </div>
                <h3 className="font-semibold text-lg mb-2">Create Account</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Sign up and create your first business profile in seconds
                </p>
              </div>
              
              <div className="text-center group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  2
                </div>
                <h3 className="font-semibold text-lg mb-2">Customize Widget</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Configure colors, messages, and AI behavior to match your brand
                </p>
              </div>
              
              <div className="text-center group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  3
                </div>
                <h3 className="font-semibold text-lg mb-2">Add to Site</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Copy the embed code and paste it into your website—done!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="container mx-auto px-4 relative">
            <Card className="p-12 md:p-16 text-center max-w-4xl mx-auto border-2 shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Transform Your Support?
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Start your 1-month free trial today. No credit card required.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" onClick={() => navigate("/auth")} className="shadow-lg hover:shadow-xl transition-all">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/pricing")} className="border-2">
                  View Pricing
                </Button>
              </div>
              <div className="flex items-center justify-center gap-8 mt-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  No credit card
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Cancel anytime
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Full features
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