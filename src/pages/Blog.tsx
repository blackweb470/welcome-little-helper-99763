import { useNavigate, Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { ArrowRight, Calendar, User, Tag, Clock, ArrowUpRight, Sparkles, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import { LyqnWidgetEmbed } from "@/components/LyqnWidgetEmbed";

const useReveal = () => {
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
      { threshold: 0.1 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
};

export const blogPosts = [
  {
    id: "cheapest-ai-chatbot-support-comparison",
    title: "Why LYQN is the Best and Cheapest AI Support Chatbot in 2026: Full Competitor Comparison",
    excerpt: "Comparing LYQN ($5/mo) vs ManyChat ($14/mo), Freshchat ($15/mo), Chatbase ($19/mo), ChatBot.com ($19/mo), and Chatfuel ($19.99/mo). See why LYQN delivers 3x more value at a fraction of the cost.",
    date: "2026-08-13",
    author: "LYQN Strategy Team",
    category: "Startup Guides",
    readTime: "6 min read",
    featured: true,
    tags: ["AI Comparison", "Cheap AI Chatbot", "LYQN vs Competitors", "Pricing"]
  },
  {
    id: "cheap-ai-chatbot-startup-founders-smb",
    title: "The Best Cheap AI Chatbot for Startup Founders and Small Businesses (2026)",
    excerpt: "Why bootstrapped founders and SMB owners are switching to LYQN: an affordable, self-learning 24/7 AI chatbot with WhatsApp integration at $5/mo.",
    date: "2026-08-12",
    author: "LYQN Team",
    category: "Startup Guides",
    readTime: "5 min read",
    featured: false,
    tags: ["Startup Founders", "SMBs", "Cheap AI Chatbot", "Productivity"]
  },
  {
    id: "global-smb-ai-agent",
    title: "How Small Businesses Worldwide Are Automating Support with AI",
    excerpt: "From tech startups in Singapore to retail shops in Brazil, discover how SMBs across 5 continents handle 80% of customer questions automatically.",
    date: "2026-06-18",
    author: "LYQN Global",
    category: "AI Agents",
    readTime: "4 min read",
    featured: false,
    tags: ["Global Business", "AI Agents", "SMB Growth"]
  },
  {
    id: "whatsapp-marketing-global",
    title: "Why WhatsApp is the Ultimate Sales Tool Across the Globe",
    excerpt: "Whether capturing leads in South America, expanding in Asia, or ensuring GDPR compliance in Europe, WhatsApp is the highest-converting channel.",
    date: "2026-06-15",
    author: "LYQN Global",
    category: "WhatsApp",
    readTime: "6 min read",
    featured: false,
    tags: ["WhatsApp", "Marketing", "Global"]
  },
  {
    id: "live-agent-handoff-guide",
    title: "Building a Seamless Live Agent Handoff System for High-Volume Support",
    excerpt: "How to combine automated AI customer support with instant human escalations without losing context or customer trust.",
    date: "2026-05-28",
    author: "LYQN Engineering",
    category: "Automation",
    readTime: "7 min read",
    featured: false,
    tags: ["Live Handoff", "Support Ops", "Customer Experience"]
  },
  {
    id: "sentiment-analysis-customer-support",
    title: "How Real-Time Sentiment Analysis Prevents Customer Churn",
    excerpt: "Detecting user frustration early allows support teams to step in before negative experiences impact retention.",
    date: "2026-05-14",
    author: "LYQN Product",
    category: "AI Agents",
    readTime: "4 min read",
    featured: false,
    tags: ["Sentiment Analysis", "Retention", "AI Insights"]
  },
  {
    id: "ai-document-learning-knowledge-base",
    title: "Turning Your Help Center and PDFs into an Autonomous AI Knowledge Base",
    excerpt: "Stop answering repetitive questions manually. Crawl your domain and upload docs to train your custom support AI in under two minutes.",
    date: "2026-04-30",
    author: "LYQN Product",
    category: "Automation",
    readTime: "5 min read",
    featured: false,
    tags: ["Knowledge Base", "AI Training", "Docs"]
  }
];

const Blog = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  useReveal();

  const categories = ["ALL", "Startup Guides", "AI Agents", "WhatsApp", "Automation"];

  const filteredPosts = selectedCategory === "ALL" 
    ? blogPosts 
    : blogPosts.filter(p => p.category === selectedCategory);

  const featuredPost = blogPosts.find(p => p.featured) || blogPosts[0];

  const blogSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "LYQN Blog",
    "description": "Actionable AI support insights, affordable chatbot guides, and growth strategies for startup founders and SMBs.",
    "url": "https://lyqn.app/blog",
    "publisher": {
      "@type": "Organization",
      "name": "LYQN",
      "logo": "https://lyqn.app/lyqn-icon.png"
    },
    "blogPost": blogPosts.map(p => ({
      "@type": "BlogPosting",
      "headline": p.title,
      "description": p.excerpt,
      "url": `https://lyqn.app/blog/${p.id}`,
      "datePublished": p.date,
      "author": {
        "@type": "Organization",
        "name": p.author
      }
    }))
  });

  return (
    <div className="min-h-screen text-[#111111] antialiased selection:bg-[#006af2] selection:text-white" style={{ background: "var(--canvas)" }}>
      <style dangerouslySetInnerHTML={{__html: `
        .cio-reveal { opacity: 0; transform: translateY(16px); transition: opacity .7s cubic-bezier(0.16, 1, 0.3, 1), transform .7s cubic-bezier(0.16, 1, 0.3, 1); }
        .cio-reveal.is-visible { opacity: 1; transform: translateY(0); }
        .swiss-grid-cell { transition: background-color .25s ease, border-color .25s ease; }
        .swiss-grid-cell:hover { background-color: #ffffff; }
      `}} />
      <SEO 
        title="LYQN Journal: Swiss Grid AI Chatbot & Automation Guides" 
        description="Actionable growth strategies, AI customer support guides, and affordable chatbot tutorials for startup founders and SMBs."
        url="https://lyqn.app/blog"
        schema={blogSchema}
      />

      {/* ============== Header ============== */}
      <header className="sticky top-0 z-50 pt-4 pb-4 transition-all" style={{ background: "var(--canvas)" }}>
        <div className="w-[90%] mx-auto h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg text-[#111]">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-[#111]" />
              <div className="w-2.5 h-2.5 rounded-sm opacity-60 bg-[#111]" />
            </div>
            LYQN
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#111]">
            <Link to="/pricing" className="hover:opacity-70">Pricing</Link>
            <Link to="/blog" className="hover:opacity-70 font-semibold">Blog</Link>
            <Link to="/docs" className="hover:opacity-70">Docs</Link>
          </nav>

          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/auth")} className="hidden sm:inline-block font-medium hover:opacity-70 text-sm text-[#111]">
              Log in
            </button>
            <button 
              onClick={() => navigate("/dashboard")}
              className="bg-[#111] text-white rounded-full px-5 py-2 text-sm font-semibold hover:bg-gray-800 transition-all"
            >
              Dashboard →
            </button>
          </div>
        </div>
      </header>

      {/* ============== Main Content ============== */}
      <main className="w-[90%] mx-auto pt-10 pb-24">
        
        {/* Monospace Rule Banner */}
        <div className="border-t border-b border-black/10 py-3.5 mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs text-gray-500 uppercase tracking-widest cio-reveal">
          <div className="flex items-center gap-2">
            <span className="text-[#006af2] font-bold">01</span>
            <span>/</span>
            <span className="text-[#111111] font-semibold">SWISS MODULAR JOURNAL</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span>FOUNDER GUIDES</span>
            <span className="text-gray-300">/</span>
            <span>AI AGENTS</span>
            <span className="text-gray-300">/</span>
            <span className="text-[#006af2] font-bold">EDITION 2026</span>
          </div>
        </div>

        {/* Hero Header */}
        <div className="mb-16 cio-reveal">
          <div className="grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#111111] leading-[1.02] font-display">
                Engineering support.<br />
                <span className="text-[#006af2] italic font-normal font-sans">Scaling founders.</span>
              </h1>
            </div>

            <div className="lg:col-span-4">
              <p className="text-base sm:text-lg text-[#444444] leading-relaxed">
                Actionable AI architecture, customer deflection guides, and growth playbooks for global businesses.
              </p>
            </div>
          </div>
        </div>

        {/* Swiss Category Filters */}
        <div className="mb-12 flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-6 cio-reveal">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full font-mono text-xs uppercase tracking-wider font-semibold transition-all ${
                  selectedCategory === cat
                    ? "bg-[#111111] text-white shadow-sm"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-black/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="font-mono text-xs text-gray-400 font-semibold uppercase tracking-widest hidden md:block">
            SHOWING {filteredPosts.length} ARTICLES
          </div>
        </div>

        {/* Featured Top Article (Swiss Grid Span 2) */}
        {selectedCategory === "ALL" && (
          <div 
            onClick={() => navigate(`/blog/${featuredPost.id}`)}
            className="mb-12 cio-reveal bg-white border border-black/10 rounded-3xl p-8 sm:p-12 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-[#006af2] via-rose-500 to-[#006af2]" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="lg:w-2/3">
                <div className="flex items-center gap-3 mb-6">
                  <span className="font-mono text-xs font-bold text-[#006af2] bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
                    FEATURED / 01
                  </span>
                  <span className="font-mono text-xs text-gray-400 font-semibold">
                    {featuredPost.readTime}
                  </span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#111111] font-display mb-4 leading-tight group-hover:text-[#006af2] transition-colors">
                  {featuredPost.title}
                </h2>

                <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8 max-w-3xl">
                  {featuredPost.excerpt}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  {featuredPost.tags.map(tag => (
                    <span key={tag} className="font-mono text-[11px] font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="lg:w-1/3 flex flex-col lg:items-end justify-between gap-6 border-t lg:border-t-0 lg:border-l border-gray-200 pt-6 lg:pt-0 lg:pl-8">
                <div className="text-right hidden lg:block select-none">
                  <span className="font-mono text-7xl font-extrabold text-gray-200 group-hover:text-[#006af2]/20 transition-colors">
                    01
                  </span>
                </div>

                <div className="space-y-1 text-sm font-medium text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#006af2]" />
                    <span>{new Date(featuredPost.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{featuredPost.author}</span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-[#111111] group-hover:text-[#006af2] transition-colors">
                  <span>READ ARTICLE</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Swiss Modular Grid (Structured 3-Column Cells) */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 cio-reveal">
          {filteredPosts
            .filter(p => selectedCategory !== "ALL" || !p.featured)
            .map((post, idx) => (
              <div
                key={post.id}
                onClick={() => navigate(`/blog/${post.id}`)}
                className="swiss-grid-cell bg-white border border-black/10 rounded-2xl p-7 flex flex-col justify-between shadow-sm hover:shadow-md cursor-pointer group transition-all"
              >
                <div>
                  {/* Top Cell Header */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5 font-mono text-xs">
                    <span className="font-bold text-[#006af2]">
                      0{idx + 2} / {post.category.toUpperCase()}
                    </span>
                    <span className="text-gray-400 font-medium">
                      {post.readTime}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-[#111111] font-display mb-3 group-hover:text-[#006af2] transition-colors leading-snug">
                    {post.title}
                  </h3>

                  <p className="text-sm text-gray-600 leading-relaxed mb-6 line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>

                <div>
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {post.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="font-mono text-[10px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-4 font-mono text-xs text-gray-500">
                    <span>{new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    <span className="font-bold text-[#111111] group-hover:text-[#006af2] flex items-center gap-1 transition-colors">
                      READ <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Bottom Banner */}
        <div className="mt-20 cio-reveal">
          <div className="bg-[#111111] text-white p-10 sm:p-14 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 shadow-2xl">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2 font-display text-white">
                Build your AI support agent <span className="text-[#abffae]">↗</span>
              </h2>
              <p className="text-gray-300 text-base max-w-lg">
                Join founders worldwide deploying self-learning AI support in under 2 minutes.
              </p>
            </div>

            <button
              onClick={() => navigate("/auth")}
              className="bg-white text-[#111111] font-semibold rounded-full px-7 py-3.5 text-sm hover:bg-gray-100 transition-all shrink-0 flex items-center gap-2 group"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </main>

      {/* ============== Footer ============== */}
      <footer className="py-16" style={{ background: "var(--fog)", borderTop: "1px solid rgba(11,54,59,0.08)" }}>
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 font-bold mb-4" style={{ fontSize: 18, color: "var(--ink)" }}>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--ink)" }} />
                  <div className="w-2.5 h-2.5 rounded-sm opacity-60" style={{ background: "var(--ink)" }} />
                </div>
                <span>LYQN</span>
              </div>
              <p style={{ fontSize: 14, color: "var(--slate)", lineHeight: 1.55, maxWidth: 320 }}>
                AI-powered customer support platform that helps businesses deliver exceptional experiences across every channel.
              </p>
            </div>
            {[
              { title: "Product", links: [["Pricing", "/pricing"], ["Documentation", "/docs"]] },
              { title: "Company", links: [["About", "/about"], ["Blog", "/blog"], ["Contact", "/contact"]] },
              { title: "Legal", links: [["Privacy", "/privacy"], ["Terms", "/terms"], ["Data Deletion", "/delete"]] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-semibold mb-4" style={{ fontSize: 14, color: "var(--ink)" }}>{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <Link to={href} className="cio-link" style={{ fontSize: 14 }}>{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8" style={{ borderTop: "1px solid rgba(11,54,59,0.08)", fontSize: 13, color: "var(--stone)" }}>
            <p>© 2026 LYQN AI. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="cio-link">Twitter</a>
              <a href="#" className="cio-link">LinkedIn</a>
              <a href="#" className="cio-link">GitHub</a>
            </div>
          </div>
        </div>
      </footer>

      <LyqnWidgetEmbed />
    </div>
  );
};

export default Blog;
