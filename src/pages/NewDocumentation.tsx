import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { LyqnWidgetEmbed } from "@/components/LyqnWidgetEmbed";
import { 
  Search, 
  Home, 
  Book, 
  MessageSquare, 
  BarChart3, 
  Bot, 
  Users, 
  Bell, 
  Package,
  FileText,
  Zap,
  Shield,
  Settings,
  Code,
  ChevronRight,
  ExternalLink
} from "lucide-react";

const docSections = [
  {
    title: "Getting Started",
    icon: Home,
    items: [
      { label: "Introduction", id: "introduction" },
      { label: "Quick Start", id: "quickstart" },
      { label: "Installation", id: "installation" },
      { label: "Authentication", id: "authentication" },
    ]
  },
  {
    title: "Core Features",
    icon: Zap,
    items: [
      { label: "AI Chat Assistant", id: "ai-chat" },
      { label: "Live Agent Handoff", id: "live-agent" },
      { label: "Conversation Memory", id: "conversation-memory" },
      { label: "Voice Interface", id: "voice-interface" },
    ]
  },
  {
    title: "Analytics & Insights",
    icon: BarChart3,
    items: [
      { label: "Analytics Dashboard", id: "analytics" },
      { label: "Behavioral Scoring", id: "behavioral-scoring" },
      { label: "Sentiment Analysis", id: "sentiment-analysis" },
      { label: "Agent Performance", id: "agent-performance" },
    ]
  },
  {
    title: "Advanced Features",
    icon: Settings,
    items: [
      { label: "Proactive Chat Rules", id: "proactive-chat" },
      { label: "Product Catalog", id: "product-catalog" },
      { label: "Canned Responses", id: "canned-responses" },
      { label: "Business Documents", id: "business-documents" },
      { label: "Notification System", id: "notifications" },
    ]
  },
  {
    title: "Developer Guide",
    icon: Code,
    items: [
      { label: "Widget Embedding", id: "widget-embedding" },
      { label: "Edge Functions", id: "edge-functions" },
      { label: "Database Schema", id: "database-schema" },
      { label: "API Reference", id: "api-reference" },
    ]
  }
];

export default function NewDocumentation() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("introduction");

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-6">
              <Link to="/dashboard" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">LQ</span>
                </div>
                <span className="hidden sm:inline font-semibold text-lg">LYQN</span>
              </Link>
              <nav className="hidden md:flex items-center gap-6 text-sm">
                <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
                <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </Link>
                <Link to="/documentation" className="text-foreground font-medium">
                  Documentation
                </Link>
              </nav>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr_250px] gap-6 lg:gap-8">
          {/* Left Sidebar - Navigation */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search docs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <ScrollArea className="h-[calc(100vh-200px)]">
                <nav className="space-y-6">
                  {docSections.map((section) => (
                    <div key={section.title} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <section.icon className="h-4 w-4" />
                        {section.title}
                      </div>
                      <ul className="space-y-1 ml-6 border-l pl-4">
                        {section.items.map((item) => (
                          <li key={item.id}>
                            <button
                              onClick={() => setActiveSection(item.id)}
                              className={`text-sm w-full text-left py-1.5 hover:text-foreground transition-colors ${
                                activeSection === item.id
                                  ? "text-primary font-medium"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {item.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </nav>
              </ScrollArea>
            </div>
          </aside>

          {/* Main Content */}
          <main className="min-w-0">
            <ScrollArea className="h-[calc(100vh-120px)]">
              <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
                {/* Introduction */}
                {activeSection === "introduction" && (
                  <section id="introduction">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Introduction to LYQN</h1>
                    <p className="text-lg text-muted-foreground mt-4">
                      LYQN is a comprehensive AI-powered customer engagement platform designed to help businesses provide exceptional support through intelligent chatbots and seamless human handoff.
                    </p>
                    
                    <div className="not-prose grid sm:grid-cols-2 gap-4 mt-8">
                      <div className="p-6 border rounded-lg space-y-2">
                        <Bot className="h-8 w-8 text-primary" />
                        <h3 className="font-semibold">AI-Powered</h3>
                        <p className="text-sm text-muted-foreground">
                          Intelligent chatbot that learns from your business documents and past conversations
                        </p>
                      </div>
                      <div className="p-6 border rounded-lg space-y-2">
                        <Users className="h-8 w-8 text-primary" />
                        <h3 className="font-semibold">Live Agent Ready</h3>
                        <p className="text-sm text-muted-foreground">
                          Seamless handoff to human agents when AI can't handle complex queries
                        </p>
                      </div>
                      <div className="p-6 border rounded-lg space-y-2">
                        <BarChart3 className="h-8 w-8 text-primary" />
                        <h3 className="font-semibold">Real-Time Analytics</h3>
                        <p className="text-sm text-muted-foreground">
                          Track conversations, sentiment, and behavioral patterns in real-time
                        </p>
                      </div>
                      <div className="p-6 border rounded-lg space-y-2">
                        <Bell className="h-8 w-8 text-primary" />
                        <h3 className="font-semibold">Proactive Engagement</h3>
                        <p className="text-sm text-muted-foreground">
                          Trigger automated messages based on visitor behavior and engagement
                        </p>
                      </div>
                    </div>

                    <div className="not-prose mt-8 p-6 border border-primary/20 rounded-lg bg-primary/5">
                      <h3 className="font-semibold mb-2">🚀 Quick Start</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Get started with LYQN in less than 5 minutes by following our quick start guide.
                      </p>
                      <Button onClick={() => setActiveSection("quickstart")} className="gap-2">
                        Start Tutorial <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </section>
                )}

                {/* Quick Start */}
                {activeSection === "quickstart" && (
                  <section id="quickstart">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Quick Start Guide</h1>
                    <p className="text-lg text-muted-foreground mt-4">
                      Follow these steps to get LYQN up and running on your website.
                    </p>

                    <Separator className="my-8" />

                    <h2 className="text-2xl font-bold mt-8">Step 1: Create Your Business</h2>
                    <p>Navigate to the Dashboard and create your first business profile. This will be your main workspace.</p>
                    <div className="not-prose p-4 bg-muted rounded-lg mt-4">
                      <code className="text-sm">Dashboard → Businesses → Create New Business</code>
                    </div>

                    <h2 className="text-2xl font-bold mt-8">Step 2: Configure Widget Settings</h2>
                    <p>Customize your chat widget's appearance and behavior:</p>
                    <ul className="list-disc pl-6 space-y-2 mt-4">
                      <li><strong>Primary Color:</strong> Match your brand colors</li>
                      <li><strong>Welcome Message:</strong> First message visitors see</li>
                      <li><strong>System Prompt:</strong> Define your AI's personality</li>
                      <li><strong>Voice Features:</strong> Enable voice input/output</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8">Step 3: Upload Business Documents</h2>
                    <p>Upload your business documents so the AI can learn about your products and services. The AI will automatically extract knowledge from:</p>
                    <ul className="list-disc pl-6 space-y-2 mt-4">
                      <li>Product catalogs and specifications</li>
                      <li>FAQs and knowledge base articles</li>
                      <li>Company policies and procedures</li>
                      <li>Training materials and guides</li>
                    </ul>
                    <div className="not-prose p-4 border-l-4 border-primary bg-primary/5 mt-4">
                      <p className="text-sm"><strong>💡 Pro Tip:</strong> Your uploaded documents are automatically learned by the AI and used to provide accurate, contextual responses to customer queries.</p>
                    </div>

                    <h2 className="text-2xl font-bold mt-8">Step 4: Install Widget</h2>
                    <p>Add the widget to your website by copying the embed code from Settings:</p>
                    <pre className="p-4 bg-muted rounded-lg mt-4 overflow-x-auto">
{`<script>
  (function() {
    // LYQN Chat Widget
    var script = document.createElement('script');
    script.src = 'YOUR_WIDGET_URL';
    document.body.appendChild(script);
  })();
</script>`}
                    </pre>

                    <h2 className="text-2xl font-bold mt-8">Step 5: Test & Launch</h2>
                    <p>Visit your website to test the widget. Make sure to:</p>
                    <ul className="list-disc pl-6 space-y-2 mt-4">
                      <li>Test AI responses with common questions</li>
                      <li>Verify the widget appearance matches your brand</li>
                      <li>Try the live agent handoff feature</li>
                      <li>Check mobile responsiveness</li>
                    </ul>

                    <div className="not-prose mt-8 flex gap-4">
                      <Button onClick={() => setActiveSection("installation")}>
                        Next: Installation Details
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to="/dashboard">Go to Dashboard</Link>
                      </Button>
                    </div>
                  </section>
                )}

                {/* Business Documents */}
                {activeSection === "business-documents" && (
                  <section id="business-documents">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Business Documents</h1>
                    <p className="text-lg text-muted-foreground mt-4">
                      Upload and manage business documents that power your AI assistant's knowledge base.
                    </p>

                    <Separator className="my-8" />

                    <h2 className="text-2xl font-bold">How It Works</h2>
                    <p>When you upload documents to LYQN, our system:</p>
                    <ol className="list-decimal pl-6 space-y-3 mt-4">
                      <li><strong>Extracts content</strong> from your documents (PDFs, Word, Text files)</li>
                      <li><strong>Generates summaries</strong> using AI to understand key information</li>
                      <li><strong>Indexes the content</strong> for quick retrieval during conversations</li>
                      <li><strong>Injects knowledge</strong> into the AI's context when responding to customers</li>
                    </ol>

                    <div className="not-prose p-6 border-l-4 border-green-500 bg-green-500/5 mt-6">
                      <h3 className="font-semibold text-green-700 dark:text-green-400 mb-2">✅ Documents Are Learned Automatically</h3>
                      <p className="text-sm">Your uploaded documents are automatically processed and learned by the AI. The AI will use this knowledge to provide accurate responses about your business, products, and services.</p>
                    </div>

                    <h2 className="text-2xl font-bold mt-8">Supported Formats</h2>
                    <div className="not-prose grid sm:grid-cols-2 gap-4 mt-4">
                      <div className="p-4 border rounded-lg">
                        <FileText className="h-6 w-6 text-primary mb-2" />
                        <h3 className="font-semibold">Documents</h3>
                        <p className="text-sm text-muted-foreground">PDF, DOCX, TXT, MD</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <Code className="h-6 w-6 text-primary mb-2" />
                        <h3 className="font-semibold">Data Files</h3>
                        <p className="text-sm text-muted-foreground">JSON, CSV, YAML</p>
                      </div>
                    </div>

                    <h2 className="text-2xl font-bold mt-8">Best Practices</h2>
                    <ul className="list-disc pl-6 space-y-2 mt-4">
                      <li><strong>Organize by topic:</strong> Upload separate documents for different product lines or services</li>
                      <li><strong>Keep it updated:</strong> Re-upload documents when information changes</li>
                      <li><strong>Use clear naming:</strong> Name files descriptively (e.g., "Product-Catalog-2024.pdf")</li>
                      <li><strong>Size limits:</strong> Maximum 20MB per file</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8">Document Status</h2>
                    <div className="not-prose space-y-3 mt-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                        <div>
                          <p className="font-medium">Processing</p>
                          <p className="text-sm text-muted-foreground">Document is being analyzed and indexed</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <div>
                          <p className="font-medium">Ready</p>
                          <p className="text-sm text-muted-foreground">Document is available to the AI assistant</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-red-500"></div>
                        <div>
                          <p className="font-medium">Error</p>
                          <p className="text-sm text-muted-foreground">Processing failed - try re-uploading</p>
                        </div>
                      </div>
                    </div>

                    <div className="not-prose mt-8">
                      <Button asChild>
                        <Link to="/dashboard?tab=documents">
                          Manage Documents <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </section>
                )}

                {/* Default fallback for other sections */}
                {!["introduction", "quickstart", "business-documents"].includes(activeSection) && (
                  <section>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight capitalize">
                      {activeSection.replace(/-/g, " ")}
                    </h1>
                    <p className="text-lg text-muted-foreground mt-4">
                      Documentation for this section is being prepared. Check back soon!
                    </p>
                    <div className="not-prose mt-8">
                      <Button onClick={() => setActiveSection("introduction")}>
                        Back to Introduction
                      </Button>
                    </div>
                  </section>
                )}
              </div>
            </ScrollArea>
          </main>

          {/* Right Sidebar - On This Page (desktop only) */}
          <aside className="hidden xl:block">
            <div className="sticky top-24 space-y-4">
              <h3 className="text-sm font-semibold">On This Page</h3>
              <nav className="space-y-2 text-sm text-muted-foreground">
                <a href="#top" className="block hover:text-foreground transition-colors">
                  Overview
                </a>
                <a href="#installation" className="block hover:text-foreground transition-colors">
                  Installation
                </a>
                <a href="#configuration" className="block hover:text-foreground transition-colors">
                  Configuration
                </a>
                <a href="#examples" className="block hover:text-foreground transition-colors">
                  Examples
                </a>
              </nav>

              <Separator className="my-4" />

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Resources</h3>
                <a href="https://github.com" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ExternalLink className="h-3 w-3" />
                  GitHub
                </a>
                <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ExternalLink className="h-3 w-3" />
                  API Reference
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
