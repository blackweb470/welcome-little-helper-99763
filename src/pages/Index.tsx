import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  MessageSquare, 
  Brain, 
  Users, 
  BarChart3, 
  Globe,
  Zap,
  Clock,
  FileText,
  Bot,
  Menu,
  Check,
  ArrowRight,
  Sparkles,
  Shield,
  Headphones,
  MessageCircle,
  Image as ImageIcon,
  Link2,
  Play
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChatWidget } from "@/components/ChatWidget";

// Demo business ID for landing page widget
const DEMO_BUSINESS_ID = "00000000-0000-0000-0000-000000000000";

const Index = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: Globe,
      title: "Omnichannel Support",
      description: "Connect with customers on your website and WhatsApp from a single unified dashboard.",
      badge: "NEW"
    },
    {
      icon: MessageCircle,
      title: "WhatsApp Integration",
      description: "Continue conversations seamlessly from web chat to WhatsApp with linked history.",
      badge: "NEW"
    },
    {
      icon: Clock,
      title: "24/7 AI Support",
      description: "Provide round-the-clock automated support, drastically reducing response times."
    },
    {
      icon: Headphones,
      title: "Live Agent Handoff",
      description: "Intelligent queue system with real-time position updates and agent availability."
    },
    {
      icon: ImageIcon,
      title: "Rich Media Sharing",
      description: "Visitors share images directly in chat for screenshots, products, or visual context."
    },
    {
      icon: Brain,
      title: "AI Conversation Analysis",
      description: "Automatically analyze sentiment, identify issues, and extract key insights."
    }
  ];

  const stats = [
    { value: "90%", label: "Support Resolved by AI" },
    { value: "24/7", label: "Always Available" },
    { value: "50%", label: "Faster Response Time" },
    { value: "10x", label: "Agent Productivity" }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Premium gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Subtle radial gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted/50 via-background to-background" />
        
        {/* Animated grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border) / 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border) / 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} />
        
        {/* Decorative elements */}
        <div className="absolute top-40 left-[15%] w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-[60%] right-[10%] w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-display font-bold text-xl group">
            <div className="flex items-center gap-1 transition-transform group-hover:scale-110">
              <div className="w-2.5 h-2.5 bg-foreground rounded-sm" />
              <div className="w-2.5 h-2.5 bg-foreground rounded-sm opacity-60" />
            </div>
            <span className="tracking-tight">LYQN</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="/docs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>
            <Button variant="ghost" onClick={() => navigate("/auth")} className="font-medium">
              Login
            </Button>
            <Button onClick={() => navigate("/auth")} className="font-medium shadow-elegant hover:shadow-glow transition-shadow">
              Get Started Free
            </Button>
          </nav>

          {/* Mobile Navigation */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="flex flex-col gap-4 mt-8">
                <Link 
                  to="/features" 
                  className="text-lg font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link 
                  to="/pricing" 
                  className="text-lg font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link 
                  to="/docs" 
                  className="text-lg font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Docs
                </Link>
                <Button 
                  className="mt-4"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/auth");
                  }}
                >
                  Get Started Free
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="relative">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-20 md:pt-28 pb-20 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-sm mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-muted-foreground">Now with <strong className="text-foreground">WhatsApp Integration</strong></span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight mb-6 leading-[1.1]">
              Customer Support
              <br />
              <span className="bg-gradient-to-r from-foreground via-foreground/80 to-foreground bg-clip-text">Powered by AI</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Train an AI on your business knowledge that handles customer questions across web and WhatsApp — so your team can focus on what matters.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" onClick={() => navigate("/auth")} className="px-8 py-6 text-base font-medium shadow-glow hover:shadow-glow-lg transition-all">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/docs")} className="px-8 py-6 text-base font-medium">
                <Play className="w-4 h-4 mr-2" />
                Watch Demo
              </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-3xl mx-auto">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-3xl md:text-4xl font-display font-bold mb-1">{stat.value}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Widget Preview */}
          <div className="max-w-sm mx-auto mt-16 md:mt-20">
            <Card className="p-5 shadow-elegant-lg border-2 bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 mb-4 pb-4 border-b">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-foreground rounded-sm" />
                  <div className="w-2 h-2 bg-foreground rounded-sm opacity-60" />
                </div>
                <span className="font-semibold text-sm">LYQN AI Assistant</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">Hi there! 👋 I'm your AI assistant.</p>
                    <p className="text-xs text-muted-foreground mt-1">Ask me anything or continue on WhatsApp!</p>
                  </div>
                </div>
                
                {/* WhatsApp continuation preview */}
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-green-600 shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span className="text-xs text-green-700 dark:text-green-300 font-medium">Continue on WhatsApp</span>
                  <Link2 className="w-3 h-3 text-green-600 ml-auto" />
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    className="flex-1 text-sm px-3 py-2 rounded-lg bg-muted border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled
                  />
                  <Button size="sm" className="px-4">Send</Button>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="py-24 border-t bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wider">How it works</p>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-4">
                Set up in minutes
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Three simple steps to deploy your AI-powered customer support
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
              {[
                { step: "01", icon: Globe, title: "Sync your data", desc: "Enter your website URL and watch as AI learns from your content, docs, and FAQs." },
                { step: "02", icon: Sparkles, title: "Customize your bot", desc: "Add your branding, configure responses, and set up WhatsApp integration." },
                { step: "03", icon: FileText, title: "Deploy everywhere", desc: "Install on your website, app, or help center with a simple embed code." }
              ].map((item, idx) => (
                <Card key={idx} className="p-8 border-2 hover:border-primary/20 transition-all group relative overflow-hidden">
                  <div className="absolute top-4 right-4 text-6xl font-display font-bold text-muted/30 group-hover:text-primary/10 transition-colors">
                    {item.step}
                  </div>
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <item.icon className="w-7 h-7" />
                    </div>
                    <h3 className="font-display font-semibold text-xl mb-3">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 border-t">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wider">Features</p>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-4">
                Everything you need
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                A complete platform to automate and enhance customer interactions
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
              {features.map((feature, idx) => (
                <Card key={idx} className="p-6 border-2 hover:shadow-elegant transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <feature.icon className="w-6 h-6" />
                    </div>
                    {feature.badge && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                        {feature.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Omnichannel Section */}
        <section className="py-24 bg-muted/30 border-t">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wider">Omnichannel</p>
                  <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6">
                    One inbox for all channels
                  </h2>
                  <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                    Manage conversations from your website widget and WhatsApp in a single dashboard. Visitors can seamlessly continue chats across channels with their history preserved.
                  </p>
                  
                  <ul className="space-y-4">
                    {[
                      "Web widget with rich media support",
                      "WhatsApp Business integration",
                      "Linked conversation history",
                      "Real-time agent queue"
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="relative">
                  <Card className="p-6 shadow-elegant-lg border-2">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <MessageCircle className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">John from Web</span>
                            <span className="text-xs text-muted-foreground">2m ago</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Need help with my order...</p>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">Web</span>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-green-600">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">Maria via WhatsApp</span>
                            <span className="text-xs text-muted-foreground">5m ago</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Continuing from web chat...</p>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">WhatsApp</span>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <MessageCircle className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">Alex from Web</span>
                            <span className="text-xs text-muted-foreground">12m ago</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Waiting for agent...</p>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded">Queue</span>
                      </div>
                    </div>
                  </Card>
                  
                  {/* Decorative */}
                  <div className="absolute -z-10 -top-4 -right-4 w-full h-full rounded-2xl border-2 border-dashed border-primary/10" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-24 border-t">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wider">Collaboration</p>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-4">
                Built for teams
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Collaborate with your team to deliver exceptional support
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="p-8 border-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-3">Team Management</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Add team members with role-based permissions. Control who can access what across your organization.
                </p>
              </Card>

              <Card className="p-8 border-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-3">Performance Analytics</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Track agent performance, response times, and resolution rates with detailed reports.
                </p>
              </Card>

              <Card className="p-8 border-2 md:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-3">Enterprise Security</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Enterprise-grade security with data encryption, compliance standards, and audit logs.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-foreground text-background relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(to right, currentColor 1px, transparent 1px),
                linear-gradient(to bottom, currentColor 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }} />
          </div>
          
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-6">
                Ready to transform your support?
              </h2>
              <p className="text-background/70 text-lg mb-10 max-w-xl mx-auto">
                Join thousands of businesses using LYQN to deliver exceptional customer experiences.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/auth")} 
                  className="px-8 py-6 text-base font-medium bg-background text-foreground hover:bg-background/90"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate("/pricing")}
                  className="px-8 py-6 text-base font-medium border-background/30 text-background hover:bg-background/10"
                >
                  View Pricing
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-background/60">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  1 month free trial
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Cancel anytime
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-16 bg-background relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 font-display font-bold text-xl mb-4 text-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 bg-foreground rounded-sm" />
                  <div className="w-2.5 h-2.5 bg-foreground rounded-sm opacity-60" />
                </div>
                <span>LYQN</span>
              </div>
              <p className="text-sm text-foreground/70 leading-relaxed max-w-xs">
                AI-powered customer support platform that helps businesses deliver exceptional experiences across every channel.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Product</h4>
              <ul className="space-y-3 text-sm text-foreground/70">
                <li><Link to="/features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link to="/docs" className="hover:text-foreground transition-colors">Documentation</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Company</h4>
              <ul className="space-y-3 text-sm text-foreground/70">
                <li><Link to="/" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
              <ul className="space-y-3 text-sm text-foreground/70">
                <li><Link to="/" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-foreground/70">
            <p>© 2025 LYQN AI. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
              <a href="#" className="hover:text-foreground transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Chat Widget with proactive popup */}
      <ChatWidget businessId={DEMO_BUSINESS_ID} />
    </div>
  );
};

export default Index;
