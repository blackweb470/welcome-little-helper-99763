import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LyqnWidgetEmbed } from "@/components/LyqnWidgetEmbed";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
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
  ExternalLink,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Globe,
  Layers,
  Terminal,
  ArrowRight,
  ArrowLeft
} from "lucide-react";

interface DocItem {
  label: string;
  id: string;
  badge?: string;
}

interface DocSection {
  title: string;
  icon: any;
  items: DocItem[];
}

const docSections: DocSection[] = [
  {
    title: "Getting Started",
    icon: Home,
    items: [
      { label: "Introduction", id: "introduction" },
      { label: "Quick Start (2 Mins)", id: "quickstart", badge: "Fast" },
    ]
  },
  {
    title: "Widget & Integration",
    icon: Code,
    items: [
      { label: "1-Line Embed Script", id: "embed-script" },
      { label: "Widget Customisation", id: "widget-customisation" },
      { label: "Pre-Chat Forms & Leads", id: "pre-chat-forms" },
    ]
  },
  {
    title: "AI Knowledge Base (RAG)",
    icon: Bot,
    items: [
      { label: "Website Scraping", id: "website-scraping" },
      { label: "Business Documents (PDF/Docs)", id: "business-documents" },
      { label: "System Prompts & Memory", id: "ai-memory" },
    ]
  },
  {
    title: "Omnichannel & WhatsApp",
    icon: MessageSquare,
    items: [
      { label: "WhatsApp Business Bridge", id: "whatsapp-bridge", badge: "Popular" },
      { label: "Unified Inbox Setup", id: "unified-inbox" },
    ]
  },
  {
    title: "Live Agent Handoff",
    icon: Users,
    items: [
      { label: "Routing & Escalation Rules", id: "escalation-rules" },
      { label: "Sentiment Triggers", id: "sentiment-triggers" },
    ]
  },
  {
    title: "Developer API & Webhooks",
    icon: Terminal,
    items: [
      { label: "REST API Reference", id: "api-reference" },
      { label: "Webhook Events", id: "webhooks" },
    ]
  }
];

export default function NewDocumentation() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("introduction");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"html" | "react" | "next">("html");
  const [feedbackGiven, setFeedbackGiven] = useState<"yes" | "no" | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const els = document.querySelectorAll(".cio-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast({
      title: "Code Copied!",
      description: "Snippet copied to clipboard.",
    });
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleFeedback = (type: "yes" | "no") => {
    setFeedbackGiven(type);
    toast({
      title: "Thank you!",
      description: type === "yes" ? "Glad this documentation helped." : "We'll work on improving this guide.",
    });
  };

  // Flattened items for Next/Prev pagination
  const allDocItems = docSections.flatMap(s => s.items);
  const currentIndex = allDocItems.findIndex(item => item.id === activeSection);
  const prevItem = currentIndex > 0 ? allDocItems[currentIndex - 1] : null;
  const nextItem = currentIndex < allDocItems.length - 1 ? allDocItems[currentIndex + 1] : null;

  const filteredSections = docSections.map(section => ({
    ...section,
    items: section.items.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  return (
    <div className="min-h-screen font-sans text-[#111]" style={{ background: "var(--canvas)" }}>
      <style dangerouslySetInnerHTML={{__html: `
        .cio-reveal { opacity: 0; transform: translateY(16px); transition: opacity .6s ease, transform .6s ease; }
        .cio-reveal.is-visible { opacity: 1; transform: translateY(0); }
      `}} />
      <SEO 
        title="LYQN Documentation: Developer Guides, Setup & API Reference" 
        description="Official documentation for LYQN AI chatbot platform. Learn 1-line script embedding, RAG document indexing, WhatsApp setup, and REST API."
        url="https://lyqn.app/docs"
      />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 transition-all duration-300 bg-white/90 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xl font-bold tracking-tight text-[#111] flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="bg-[#111] text-white w-7 h-7 rounded-lg font-mono text-sm font-bold flex items-center justify-center">L</span>
              LYQN <span className="text-xs font-mono font-medium bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full text-gray-600">Docs v2.4</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search docs... (⌘K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-gray-100/80 border border-gray-200/80 rounded-full focus:outline-none focus:ring-2 focus:ring-[#111]/20 transition-all text-gray-800"
              />
            </div>

            <Link 
              to="/dashboard"
              className="text-xs font-semibold text-gray-700 hover:text-black transition-colors hidden sm:block"
            >
              Dashboard
            </Link>
            <Link 
              to="/auth"
              className="bg-[#111] text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-black/80 transition-colors shadow-sm flex items-center gap-1.5"
            >
              Start Free Trial <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Docs Body Container */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_220px] gap-8 lg:gap-12">
          
          {/* Left Sidebar - Navigation */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <div className="relative md:hidden mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search docs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-full"
                />
              </div>

              <ScrollArea className="h-[calc(100vh-140px)] pr-3">
                <nav className="space-y-6 pb-12">
                  {filteredSections.map((section) => (
                    <div key={section.title} className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-wider px-2">
                        <section.icon className="h-3.5 w-3.5 text-gray-500" />
                        {section.title}
                      </div>
                      <ul className="space-y-1 border-l-2 border-gray-100 ml-3.5 pl-3">
                        {section.items.map((item) => (
                          <li key={item.id}>
                            <button
                              onClick={() => {
                                setActiveSection(item.id);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className={`text-xs w-full text-left py-1.5 px-2 rounded-lg transition-all flex items-center justify-between ${
                                activeSection === item.id
                                  ? "text-[#111] font-bold bg-gray-200/60 border-l-2 border-[#111] -ml-[15px] pl-[13px]"
                                  : "text-gray-600 hover:text-[#111] hover:bg-gray-100/50"
                              }`}
                            >
                              <span>{item.label}</span>
                              {item.badge && (
                                <span className="text-[10px] font-mono uppercase bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
                                  {item.badge}
                                </span>
                              )}
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

          {/* Main Content Area */}
          <main className="min-w-0 pb-20 pt-2">
            <div className="cio-reveal max-w-3xl">
              
              {/* SECTION 1: INTRODUCTION */}
              {activeSection === "introduction" && (
                <section>
                  <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <span>Getting Started</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="text-[#111] font-bold">Introduction</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111] mb-4">
                    LYQN AI Platform Overview
                  </h1>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8">
                    LYQN is an autonomous AI customer support platform built for startup founders and SMBs. It operates 24/7, ingests your business documentation with Retrieval-Augmented Generation (RAG), and bridges directly into WhatsApp.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4 mb-10">
                    <div className="p-6 bg-white border border-gray-200/80 rounded-2xl shadow-xs hover:border-gray-300 transition-all">
                      <Bot className="h-6 w-6 text-blue-600 mb-3" />
                      <h3 className="font-bold text-base text-[#111] mb-1">0-Hallucination RAG</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Learns strictly from your uploaded PDFs, FAQs, and URLs to give factual replies.
                      </p>
                    </div>
                    <div className="p-6 bg-white border border-gray-200/80 rounded-2xl shadow-xs hover:border-gray-300 transition-all">
                      <MessageSquare className="h-6 w-6 text-green-600 mb-3" />
                      <h3 className="font-bold text-base text-[#111] mb-1">WhatsApp Bridge</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Transition visitors from website chat to WhatsApp Business seamlessly.
                      </p>
                    </div>
                    <div className="p-6 bg-white border border-gray-200/80 rounded-2xl shadow-xs hover:border-gray-300 transition-all">
                      <Users className="h-6 w-6 text-purple-600 mb-3" />
                      <h3 className="font-bold text-base text-[#111] mb-1">Live Queue Handoff</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Smart human escalation passes full transcript summaries to live agents.
                      </p>
                    </div>
                    <div className="p-6 bg-white border border-gray-200/80 rounded-2xl shadow-xs hover:border-gray-300 transition-all">
                      <Code className="h-6 w-6 text-orange-600 mb-3" />
                      <h3 className="font-bold text-base text-[#111] mb-1">2-Min 1-Line Embed</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Paste a single JavaScript snippet on React, Next.js, WordPress, or HTML.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* SECTION 2: QUICK START */}
              {activeSection === "quickstart" && (
                <section>
                  <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <span>Getting Started</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="text-[#111] font-bold">Quick Start</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111] mb-4">
                    Quick Start Guide
                  </h1>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8">
                    Get your AI chatbot live on your site in under 2 minutes. Follow these 3 simple steps:
                  </p>

                  <div className="space-y-8 mb-10">
                    <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="w-7 h-7 rounded-full bg-[#111] text-white font-bold text-xs flex items-center justify-center">1</span>
                        <h3 className="font-bold text-lg text-[#111]">Create Your Workspace</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Sign up at <Link to="/auth" className="text-blue-600 font-semibold underline">lyqn.app/auth</Link> and enter your business name and primary domain.
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="w-7 h-7 rounded-full bg-[#111] text-white font-bold text-xs flex items-center justify-center">2</span>
                        <h3 className="font-bold text-lg text-[#111]">Train Your AI Agent</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Paste your website URL or upload your product FAQ PDF. LYQN's vector crawler will index your knowledge in seconds.
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="w-7 h-7 rounded-full bg-[#111] text-white font-bold text-xs flex items-center justify-center">3</span>
                        <h3 className="font-bold text-lg text-[#111]">Paste the Script Tag</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Copy your script tag from Dashboard → Embed and paste it before the closing <code className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">&lt;/body&gt;</code> tag.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* SECTION 3: 1-LINE EMBED SCRIPT */}
              {activeSection === "embed-script" && (
                <section>
                  <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <span>Widget & Integration</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="text-[#111] font-bold">1-Line Embed Script</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111] mb-4">
                    Script Integration Code
                  </h1>
                  <p className="text-base text-gray-600 mb-6">
                    Embed the LYQN chat widget into any website framework. Select your framework snippet below:
                  </p>

                  {/* Code Snippet Tabs */}
                  <div className="bg-[#111] rounded-2xl overflow-hidden shadow-lg border border-gray-800 mb-8">
                    <div className="flex items-center justify-between bg-black/50 px-4 py-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveTab("html")}
                          className={`text-xs font-mono px-3 py-1 rounded-md transition-all ${
                            activeTab === "html" ? "bg-white/20 text-white font-bold" : "text-gray-400 hover:text-white"
                          }`}
                        >
                          HTML / Script
                        </button>
                        <button
                          onClick={() => setActiveTab("react")}
                          className={`text-xs font-mono px-3 py-1 rounded-md transition-all ${
                            activeTab === "react" ? "bg-white/20 text-white font-bold" : "text-gray-400 hover:text-white"
                          }`}
                        >
                          React / Vite
                        </button>
                        <button
                          onClick={() => setActiveTab("next")}
                          className={`text-xs font-mono px-3 py-1 rounded-md transition-all ${
                            activeTab === "next" ? "bg-white/20 text-white font-bold" : "text-gray-400 hover:text-white"
                          }`}
                        >
                          Next.js App Router
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          const codeToCopy =
                            activeTab === "html"
                              ? `<script src="https://lyqn.app/widget.js" data-business-id="YOUR_BUSINESS_ID" async></script>`
                              : activeTab === "react"
                              ? `useEffect(() => {\n  const s = document.createElement('script');\n  s.src = 'https://lyqn.app/widget.js';\n  s.setAttribute('data-business-id', 'YOUR_BUSINESS_ID');\n  document.body.appendChild(s);\n}, []);`
                              : `import Script from 'next/script';\n\n<Script src="https://lyqn.app/widget.js" data-business-id="YOUR_BUSINESS_ID" strategy="lazyOnload" />`;
                          handleCopy(codeToCopy, activeTab);
                        }}
                        className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white bg-white/10 px-3 py-1 rounded-full transition-all"
                      >
                        {copiedCode === activeTab ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedCode === activeTab ? "Copied" : "Copy Code"}
                      </button>
                    </div>

                    <pre className="p-6 text-gray-200 font-mono text-xs sm:text-sm overflow-x-auto leading-relaxed">
                      {activeTab === "html" && (
                        <code>{`<!-- LYQN AI Chatbot Embed -->
<script 
  src="https://lyqn.app/widget.js" 
  data-business-id="YOUR_BUSINESS_ID" 
  async
></script>`}</code>
                      )}
                      {activeTab === "react" && (
                        <code>{`import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://lyqn.app/widget.js';
    script.setAttribute('data-business-id', 'YOUR_BUSINESS_ID');
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return <div>Your App Content</div>;
}`}</code>
                      )}
                      {activeTab === "next" && (
                        <code>{`import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script 
          src="https://lyqn.app/widget.js" 
          data-business-id="YOUR_BUSINESS_ID" 
          strategy="lazyOnload" 
        />
      </body>
    </html>
  );
}`}</code>
                      )}
                    </pre>
                  </div>
                </section>
              )}

              {/* SECTION 4: BUSINESS DOCUMENTS */}
              {activeSection === "business-documents" && (
                <section>
                  <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <span>AI Knowledge Base (RAG)</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="text-[#111] font-bold">Business Documents</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111] mb-4">
                    Document RAG Knowledge Base
                  </h1>
                  <p className="text-base text-gray-600 mb-6">
                    Upload your company PDFs, product catalogs, and help guides. LYQN extracts text, generates vector embeddings, and uses RAG for hallucination-free replies.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    <div className="p-5 bg-white border border-gray-200/80 rounded-2xl">
                      <FileText className="w-6 h-6 text-blue-600 mb-2" />
                      <h4 className="font-bold text-sm text-[#111]">Document Formats</h4>
                      <p className="text-xs text-gray-500 mt-1">PDF, DOCX, TXT, MD (Max 20MB per file)</p>
                    </div>
                    <div className="p-5 bg-white border border-gray-200/80 rounded-2xl">
                      <Globe className="w-6 h-6 text-green-600 mb-2" />
                      <h4 className="font-bold text-sm text-[#111]">URL Web Scraper</h4>
                      <p className="text-xs text-gray-500 mt-1">Crawls website pages and documentation links</p>
                    </div>
                  </div>
                </section>
              )}

              {/* SECTION 5: WHATSAPP BRIDGE */}
              {activeSection === "whatsapp-bridge" && (
                <section>
                  <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <span>Omnichannel & WhatsApp</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="text-[#111] font-bold">WhatsApp Business Bridge</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111] mb-4">
                    WhatsApp Business Bridge
                  </h1>
                  <p className="text-base text-gray-600 mb-6">
                    Connect your Meta WhatsApp Business API account to automatically receive web leads directly in WhatsApp and reply from a single dashboard.
                  </p>

                  <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs mb-6">
                    <h3 className="font-bold text-base text-[#111] mb-2">Setup Steps:</h3>
                    <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700">
                      <li>Go to Dashboard → Settings → Integrations.</li>
                      <li>Enter your Meta Business Phone Number ID and System User Access Token.</li>
                      <li>Copy the Webhook URL into Meta Developer Console.</li>
                    </ol>
                  </div>
                </section>
              )}

              {/* FALLBACK FOR OTHER SECTIONS */}
              {!["introduction", "quickstart", "embed-script", "business-documents", "whatsapp-bridge"].includes(activeSection) && (
                <section>
                  <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <span>Documentation</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="text-[#111] font-bold">{activeSection}</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111] mb-4">
                    {allDocItems.find(i => i.id === activeSection)?.label || "Guide"}
                  </h1>
                  <p className="text-base text-gray-600 mb-8">
                    Detailed technical reference guide for configuring {activeSection} on the LYQN platform.
                  </p>
                  <div className="p-6 bg-white border border-gray-200/80 rounded-2xl text-sm text-gray-600">
                    Visit your <Link to="/dashboard" className="text-blue-600 font-semibold underline">LYQN Dashboard</Link> to adjust your business settings and live test your widget configurations.
                  </div>
                </section>
              )}

              {/* Navigation Pagination Buttons */}
              <div className="mt-12 pt-8 border-t border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                {prevItem ? (
                  <button
                    onClick={() => {
                      setActiveSection(prevItem.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="w-full sm:w-auto flex items-center gap-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 px-4 py-2.5 rounded-full hover:bg-gray-50 transition-all shadow-xs"
                  >
                    <ArrowLeft className="w-4 h-4 text-gray-500" /> Previous: {prevItem.label}
                  </button>
                ) : <div />}

                {nextItem && (
                  <button
                    onClick={() => {
                      setActiveSection(nextItem.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="w-full sm:w-auto flex items-center gap-2 text-xs font-semibold text-white bg-[#111] px-5 py-2.5 rounded-full hover:bg-black/80 transition-all shadow-sm"
                  >
                    Next: {nextItem.label} <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Documentation Feedback Widget */}
              <div className="mt-10 p-6 bg-white border border-gray-200/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                <div className="text-xs font-semibold text-gray-700">Was this documentation page helpful?</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFeedback("yes")}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full transition-all border ${
                      feedbackGiven === "yes" ? "bg-green-100 text-green-800 border-green-300" : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200/60"
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" /> Yes
                  </button>
                  <button
                    onClick={() => handleFeedback("no")}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full transition-all border ${
                      feedbackGiven === "no" ? "bg-red-100 text-red-800 border-red-300" : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200/60"
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" /> No
                  </button>
                </div>
              </div>

            </div>
          </main>

          {/* Right Sidebar - On This Page */}
          <aside className="hidden xl:block">
            <div className="sticky top-24 space-y-6 text-xs">
              <div>
                <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-3">On This Page</h4>
                <ul className="space-y-2 text-gray-500 font-medium">
                  <li><a href="#" className="hover:text-[#111] transition-colors">Overview</a></li>
                  <li><a href="#" className="hover:text-[#111] transition-colors">Setup & Config</a></li>
                  <li><a href="#" className="hover:text-[#111] transition-colors">Code Examples</a></li>
                  <li><a href="#" className="hover:text-[#111] transition-colors">Troubleshooting</a></li>
                </ul>
              </div>

              <div className="w-full h-px bg-gray-200/80"></div>

              <div>
                <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-3">Community & API</h4>
                <div className="space-y-2.5">
                  <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-[#111] transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" /> GitHub SDK
                  </a>
                  <a href="#" className="flex items-center gap-2 text-gray-600 hover:text-[#111] transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" /> REST Spec
                  </a>
                </div>
              </div>
            </div>
          </aside>

        </div>
      </div>
      <LyqnWidgetEmbed />
    </div>
  );
}
