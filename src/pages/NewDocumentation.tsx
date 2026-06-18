import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LyqnWidgetEmbed } from "@/components/LyqnWidgetEmbed";
import { SEO } from "@/components/SEO";
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
    ]
  },
  {
    title: "Advanced Features",
    icon: Settings,
    items: [
      { label: "Business Documents", id: "business-documents" },
    ]
  }
];

export default function NewDocumentation() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("introduction");

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

  return (
    <div className="min-h-screen font-sans" style={{ background: "#fcfcfc" }}>
      <style dangerouslySetInnerHTML={{__html: `
        .cio-reveal { opacity: 0; transform: translateY(20px); transition: opacity .8s ease, transform .8s ease; }
        .cio-reveal.is-visible { opacity: 1; transform: translateY(0); }
        .prose-custom p { font-size: 1.125rem; line-height: 1.7; color: #6b7280; margin-bottom: 1.5rem; }
        .prose-custom h1 { font-size: 2.5rem; font-weight: 700; color: #111; letter-spacing: -0.03em; margin-bottom: 1rem; line-height: 1.1; }
        .prose-custom h2 { font-size: 1.875rem; font-weight: 700; color: #111; letter-spacing: -0.02em; margin-top: 3rem; margin-bottom: 1rem; }
        .prose-custom h3 { font-size: 1.25rem; font-weight: 600; color: #111; margin-top: 2rem; margin-bottom: 0.75rem; }
        .prose-custom ul { padding-left: 1.5rem; list-style-type: disc; margin-bottom: 1.5rem; color: #6b7280; }
        .prose-custom li { margin-bottom: 0.5rem; font-size: 1.125rem; }
        .prose-custom strong { font-weight: 600; color: #111; }
      `}} />
      <SEO 
        title="LYQN Documentation — Guides, API & Setup" 
        description="Learn how to install, configure, and maximize the LYQN AI chatbot. Comprehensive developer guides, API references, and quick start tutorials."
        url="https://lyqn.app/docs"
      />
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 transition-all duration-300 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link to="/" className="text-2xl font-bold tracking-tighter text-[#111] hover:opacity-80 transition-opacity">
              LYQN
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/dashboard"
              className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors hidden sm:block mr-4"
            >
              Dashboard
            </Link>
            <Link 
              to="/dashboard"
              className="bg-[#111] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-black/80 transition-colors shadow-sm"
            >
              <span className="flex items-center gap-2">
                <Home className="w-4 h-4" /> Go to App
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr_250px] gap-8 xl:gap-16">
          {/* Left Sidebar - Navigation */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-gray-200 rounded-2xl h-12 focus-visible:ring-1 focus-visible:ring-gray-300"
                />
              </div>
              
              <ScrollArea className="h-[calc(100vh-220px)] pr-4">
                <nav className="space-y-8 pb-10">
                  {docSections.map((section) => (
                    <div key={section.title} className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#111] uppercase tracking-wider">
                        <section.icon className="h-4 w-4" />
                        {section.title}
                      </div>
                      <ul className="space-y-1.5 ml-6 border-l border-gray-100 pl-4">
                        {section.items.map((item) => (
                          <li key={item.id}>
                            <button
                              onClick={() => setActiveSection(item.id)}
                              className={`text-[15px] w-full text-left py-1.5 transition-colors ${
                                activeSection === item.id
                                  ? "text-blue-600 font-semibold"
                                  : "text-gray-500 hover:text-[#111]"
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
          <main className="min-w-0 pb-20 pt-4">
            <div className="prose-custom max-w-none cio-reveal">
              {/* Introduction */}
              {activeSection === "introduction" && (
                <section id="introduction">
                  <div className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-widest">
                    <span>Getting Started</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-[#111]">Introduction</span>
                  </div>
                  <h1>Introduction to LYQN</h1>
                  <p className="text-xl">
                    LYQN is a comprehensive AI-powered customer engagement platform designed to help businesses provide exceptional support through intelligent chatbots and seamless human handoff.
                  </p>
                  
                  <div className="grid sm:grid-cols-2 gap-6 mt-12 mb-12">
                    <div className="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                        <Bot className="h-6 w-6" />
                      </div>
                      <h3 className="font-bold text-xl mb-3 text-[#111] tracking-tight">AI-Powered</h3>
                      <p className="text-gray-500 text-[15px] leading-relaxed">
                        Intelligent chatbot that learns from your business documents and past conversations.
                      </p>
                    </div>
                    <div className="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all">
                      <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mb-6">
                        <Users className="h-6 w-6" />
                      </div>
                      <h3 className="font-bold text-xl mb-3 text-[#111] tracking-tight">Live Agent Ready</h3>
                      <p className="text-gray-500 text-[15px] leading-relaxed">
                        Seamless handoff to human agents when AI can't handle complex queries.
                      </p>
                    </div>
                    <div className="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all">
                      <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6">
                        <BarChart3 className="h-6 w-6" />
                      </div>
                      <h3 className="font-bold text-xl mb-3 text-[#111] tracking-tight">Real-Time Analytics</h3>
                      <p className="text-gray-500 text-[15px] leading-relaxed">
                        Track conversations, sentiment, and behavioral patterns in real-time.
                      </p>
                    </div>
                    <div className="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-6">
                        <Bell className="h-6 w-6" />
                      </div>
                      <h3 className="font-bold text-xl mb-3 text-[#111] tracking-tight">Proactive Engagement</h3>
                      <p className="text-gray-500 text-[15px] leading-relaxed">
                        Trigger automated messages based on visitor behavior and engagement.
                      </p>
                    </div>
                  </div>

                  <div className="mt-12 p-8 bg-white border border-gray-100 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h3 className="font-bold text-xl mb-2 text-[#111] tracking-tight">🚀 Quick Start</h3>
                      <p className="text-gray-500 mb-0 text-[15px]">
                        Get started with LYQN in less than 5 minutes by following our quick start guide.
                      </p>
                    </div>
                    <button 
                      onClick={() => setActiveSection("quickstart")} 
                      className="bg-[#111] text-white px-6 py-3 rounded-full font-semibold hover:bg-black/80 transition-colors whitespace-nowrap flex items-center gap-2"
                    >
                      Start Tutorial <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </section>
              )}

              {/* Quick Start */}
              {activeSection === "quickstart" && (
                <section id="quickstart">
                  <div className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-widest">
                    <span>Getting Started</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-[#111]">Quick Start</span>
                  </div>
                  <h1>Quick Start Guide</h1>
                  <p>
                    Follow these steps to get LYQN up and running on your website.
                  </p>

                  <div className="w-full h-px bg-gray-200 my-10"></div>

                  <h2>Step 1: Create Your Business</h2>
                  <p>Navigate to the Dashboard and create your first business profile. This will be your main workspace.</p>
                  <div className="p-5 bg-white border border-gray-200 rounded-2xl mt-4 font-mono text-[14px] text-gray-800 shadow-sm">
                    Dashboard → Businesses → Create New Business
                  </div>

                  <h2>Step 2: Configure Widget Settings</h2>
                  <p>Customize your chat widget's appearance and behavior:</p>
                  <ul>
                    <li><strong>Primary Color:</strong> Match your brand colors</li>
                    <li><strong>Welcome Message:</strong> First message visitors see</li>
                    <li><strong>System Prompt:</strong> Define your AI's personality</li>
                    <li><strong>Voice Features:</strong> Enable voice input/output</li>
                  </ul>

                  <h2>Step 3: Upload Business Documents</h2>
                  <p>Upload your business documents so the AI can learn about your products and services. The AI will automatically extract knowledge from:</p>
                  <ul>
                    <li>Product catalogs and specifications</li>
                    <li>FAQs and knowledge base articles</li>
                    <li>Company policies and procedures</li>
                    <li>Training materials and guides</li>
                  </ul>
                  <div className="p-6 border border-blue-100 bg-blue-50/50 rounded-2xl mt-6">
                    <p className="text-[15px] text-blue-800 mb-0 font-medium"><strong>💡 Pro Tip:</strong> Your uploaded documents are automatically learned by the AI and used to provide accurate, contextual responses to customer queries.</p>
                  </div>

                  <h2>Step 4: Install Widget</h2>
                  <p>Add the widget to your website by copying the embed code from Settings:</p>
                  <pre className="p-6 bg-[#111] text-gray-200 rounded-2xl mt-6 overflow-x-auto text-[14px] font-mono leading-relaxed shadow-lg">
{`<script>
  (function() {
    // LYQN Chat Widget
    var script = document.createElement('script');
    script.src = 'https://lyqn.app/widget.js';
    document.body.appendChild(script);
  })();
</script>`}
                  </pre>

                  <h2>Step 5: Test & Launch</h2>
                  <p>Visit your website to test the widget. Make sure to:</p>
                  <ul>
                    <li>Test AI responses with common questions</li>
                    <li>Verify the widget appearance matches your brand</li>
                    <li>Try the live agent handoff feature</li>
                    <li>Check mobile responsiveness</li>
                  </ul>

                  <div className="mt-12 flex flex-wrap gap-4 pt-8 border-t border-gray-100">
                    <button 
                      onClick={() => setActiveSection("business-documents")}
                      className="bg-[#111] text-white px-6 py-3 rounded-full font-semibold hover:bg-black/80 transition-colors"
                    >
                      Next: Business Documents
                    </button>
                    <Link 
                      to="/dashboard"
                      className="bg-white text-[#111] border border-gray-200 px-6 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Go to Dashboard
                    </Link>
                  </div>
                </section>
              )}

              {/* Business Documents */}
              {activeSection === "business-documents" && (
                <section id="business-documents">
                  <div className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-widest">
                    <span>Advanced Features</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-[#111]">Business Documents</span>
                  </div>
                  <h1>Business Documents</h1>
                  <p>
                    Upload and manage business documents that power your AI assistant's knowledge base.
                  </p>

                  <div className="w-full h-px bg-gray-200 my-10"></div>

                  <h2>How It Works</h2>
                  <p>When you upload documents to LYQN, our system:</p>
                  <ol className="list-decimal pl-6 space-y-3 mt-4 mb-8 text-lg text-gray-600 marker:text-gray-400 font-medium">
                    <li><strong>Extracts content</strong> from your documents (PDFs, Word, Text files)</li>
                    <li><strong>Generates summaries</strong> using AI to understand key information</li>
                    <li><strong>Indexes the content</strong> for quick retrieval during conversations</li>
                    <li><strong>Injects knowledge</strong> into the AI's context when responding to customers</li>
                  </ol>

                  <div className="p-6 border border-green-100 bg-green-50 rounded-2xl mt-8">
                    <h3 className="font-bold text-green-800 mt-0 mb-2">✅ Documents Are Learned Automatically</h3>
                    <p className="text-[15px] text-green-700 mb-0">Your uploaded documents are automatically processed and learned by the AI. The AI will use this knowledge to provide accurate responses about your business, products, and services.</p>
                  </div>

                  <h2>Supported Formats</h2>
                  <div className="grid sm:grid-cols-2 gap-4 mt-6">
                    <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                      <FileText className="h-8 w-8 text-blue-500 mb-4" />
                      <h3 className="font-bold mt-0 mb-1">Documents</h3>
                      <p className="text-sm text-gray-500 mb-0">PDF, DOCX, TXT, MD</p>
                    </div>
                    <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                      <Code className="h-8 w-8 text-purple-500 mb-4" />
                      <h3 className="font-bold mt-0 mb-1">Data Files</h3>
                      <p className="text-sm text-gray-500 mb-0">JSON, CSV, YAML</p>
                    </div>
                  </div>

                  <h2>Best Practices</h2>
                  <ul>
                    <li><strong>Organize by topic:</strong> Upload separate documents for different product lines or services</li>
                    <li><strong>Keep it updated:</strong> Re-upload documents when information changes</li>
                    <li><strong>Use clear naming:</strong> Name files descriptively (e.g., "Product-Catalog-2024.pdf")</li>
                    <li><strong>Size limits:</strong> Maximum 20MB per file</li>
                  </ul>

                  <div className="mt-12 pt-8 border-t border-gray-100">
                    <Link 
                      to="/dashboard?tab=documents"
                      className="inline-flex items-center gap-2 bg-[#111] text-white px-6 py-3 rounded-full font-semibold hover:bg-black/80 transition-colors"
                    >
                      Manage Documents <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </section>
              )}

              {/* No default fallback needed since there are no placeholder sections */}
            </div>
          </main>

          {/* Right Sidebar - On This Page (desktop only) */}
          <aside className="hidden xl:block">
            <div className="sticky top-28 space-y-8">
              <div>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">On This Page</h3>
                <nav className="space-y-3 text-[15px] font-medium text-gray-500">
                  <a href="#top" className="block hover:text-[#111] transition-colors">Overview</a>
                  <a href="#installation" className="block hover:text-[#111] transition-colors">Installation</a>
                  <a href="#configuration" className="block hover:text-[#111] transition-colors">Configuration</a>
                  <a href="#examples" className="block hover:text-[#111] transition-colors">Examples</a>
                </nav>
              </div>

              <div className="w-12 h-px bg-gray-200"></div>

              <div>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Resources</h3>
                <div className="space-y-3">
                  <a href="#" className="flex items-center gap-2 text-[14px] font-medium text-gray-500 hover:text-[#111] transition-colors">
                    <ExternalLink className="h-4 w-4" /> GitHub
                  </a>
                  <a href="#" className="flex items-center gap-2 text-[14px] font-medium text-gray-500 hover:text-[#111] transition-colors">
                    <ExternalLink className="h-4 w-4" /> API Reference
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
