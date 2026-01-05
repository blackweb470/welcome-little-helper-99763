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
  Headphones
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Index = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Subtle grid background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border) / 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border) / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }} />
        {/* Decorative corner brackets */}
        <div className="absolute top-32 left-[10%] w-20 h-20 border-l-2 border-t-2 border-border/40 rounded-tl-lg" />
        <div className="absolute top-32 right-[10%] w-20 h-20 border-r-2 border-t-2 border-border/40 rounded-tr-lg" />
        <div className="absolute top-[60%] left-[5%] w-16 h-16 border-l-2 border-b-2 border-border/30 rounded-bl-lg" />
        <div className="absolute top-[40%] right-[8%] w-12 h-12 border-r-2 border-b-2 border-border/30 rounded-br-lg" />
      </div>

      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-display font-bold text-xl">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-foreground rounded-sm" />
              <div className="w-2 h-2 bg-foreground rounded-sm opacity-60" />
            </div>
            <span>LYQN</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Login
            </Button>
            <Button onClick={() => navigate("/auth")}>
              Book a Demo
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
                  Docs
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

      <main className="relative">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-24 pb-16 text-center relative">
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight mb-6 leading-[1.1]">
            Automate your
            <br />
            <span className="text-foreground">Customer Support & Sales</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Train a secure AI on your technical resources that answers customer
            questions so your team doesn't have to.
          </p>

          <Button size="lg" onClick={() => navigate("/auth")} className="px-8 py-6 text-base">
            Build my Bot
          </Button>

          {/* Floating stat badge */}
          <div className="mt-12 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/60 border text-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">resolves <strong className="text-foreground">90%</strong> of your customer support</span>
          </div>

          {/* Chat Widget Demo */}
          <div className="max-w-md mx-auto mt-16">
            <Card className="p-6 text-left shadow-lg border-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-foreground rounded-sm" />
                  <div className="w-2 h-2 bg-foreground rounded-sm opacity-60" />
                </div>
                <span className="font-semibold text-sm">LYQN AI Assistant</span>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm">Hi there! 👋</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      I'm an AI assistant trained to help you with any Support related issues.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Ask me anything about LYQN.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* 3 Steps Section */}
        <section className="py-24 border-t">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-medium mb-4">
                Just 3 simple steps
              </h2>
              <p className="text-muted-foreground text-lg">
                to create your personalised AI powered chatbot
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Step 1 */}
              <Card className="p-8 text-center border-2 hover:border-primary/30 transition-colors group">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/10 transition-colors">
                  <Globe className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-3">Sync your website's data</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Enter your Company URL for the bot to scan & see it brew magic as it syncs with your data.
                </p>
              </Card>

              {/* Step 2 */}
              <Card className="p-8 text-center border-2 hover:border-primary/30 transition-colors group">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/10 transition-colors">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-3">Customise your chat widget</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Personalise your chat widget by adding your company logo and brand colour.
                </p>
              </Card>

              {/* Step 3 */}
              <Card className="p-8 text-center border-2 hover:border-primary/30 transition-colors group">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/10 transition-colors">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-3">Install on your website</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Embed the chatbot on as many sites as you want — your marketing site, in-app, help center.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section - Collaborate with AI */}
        <section className="py-24 bg-muted/30 border-t">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-medium mb-4">
                Collaborate with an AI bot
              </h2>
              <p className="text-muted-foreground text-lg">
                trained to talk and behave like you, for your users.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {/* Feature Cards */}
              <Card className="p-6 border-2 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">24X7 Non-Stop Support</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Provide 24/7 automated support drastically reducing response times to enhance customer satisfaction.
                </p>
              </Card>

              <Card className="p-6 border-2 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">Multilingual Support</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  The bot is capable of understanding over 150+ languages - surpassing lingual boundaries.
                </p>
              </Card>

              <Card className="p-6 border-2 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">Unlimited Training Data</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  There is no limit to how much your bot can learn. Provide links, files or manually write content.
                </p>
              </Card>

              <Card className="p-6 border-2 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Headphones className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">Intelligent Agent Handoff</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Understand that customers often require a human touch. Assign relevant tickets to your support agents.
                </p>
              </Card>

              <Card className="p-6 border-2 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">AI Conversation Analysis</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Automatically analyze customer conversations to identify issues, questions, and complaints.
                </p>
              </Card>

              <Card className="p-6 border-2 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">Real-Time Analytics</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Dive deeper into your customers to gather statistical insights on their behaviour.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Team & Analytics Section */}
        <section className="py-24 border-t">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-medium mb-4">
                Collaborate with your team
              </h2>
              <p className="text-muted-foreground text-lg">
                to ensure no customer is ever unheard
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <Card className="p-8 border-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-3">Add Team Members</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Provide designated access to your team members to enable human intervention - when required. 
                  Manage roles and permissions from a unified dashboard.
                </p>
              </Card>

              <Card className="p-8 border-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-3">Measure your Output</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Keep track of how you and your team members are doing in requests where human assistance was required. 
                  Get detailed performance reports.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Enterprise Features */}
        <section className="py-24 bg-muted/30 border-t">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-medium mb-4">
                Enterprise tools to power your workflow
              </h2>
              <p className="text-muted-foreground text-lg">
                Streamline workflows with integrations & authentication services
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="p-6 border-2 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold mb-2">Providing Instructions</h3>
                <p className="text-muted-foreground text-sm">
                  Create guidelines that dictate how your bot will respond to customer queries.
                </p>
              </Card>

              <Card className="p-6 border-2 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold mb-2">Creating Custom Actions</h3>
                <p className="text-muted-foreground text-sm">
                  Integrate with any platform. Stay connected with your customers - ALWAYS.
                </p>
              </Card>

              <Card className="p-6 border-2 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold mb-2">Secure & Compliant</h3>
                <p className="text-muted-foreground text-sm">
                  Enterprise-grade security with data encryption and compliance standards.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 border-t">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-3xl md:text-4xl font-medium mb-4">
                Simple pricing that scales with your business
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                A code-free chatbot builder to seamlessly build and train a customer service chatbot for your business
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center mb-8">
                <Button size="lg" onClick={() => navigate("/auth")} className="px-8">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/pricing")}>
                  View Pricing
                </Button>
              </div>

              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  1 month free trial
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Cancel anytime
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 font-semibold mb-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-foreground rounded-sm" />
                  <div className="w-2 h-2 bg-foreground rounded-sm opacity-60" />
                </div>
                <span>LYQN</span>
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
