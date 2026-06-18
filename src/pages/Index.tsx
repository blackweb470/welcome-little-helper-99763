import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  MessageCircle,
  Brain,
  Users,
  BarChart3,
  Globe,
  Clock,
  FileText,
  Bot,
  Menu,
  Check,
  ArrowRight,
  Sparkles,
  Shield,
  Headphones,
  Image as ImageIcon,
  Link2,
  Play,
  ChevronDown,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LyqnWidgetEmbed } from "@/components/LyqnWidgetEmbed";
import { SEO } from "@/components/SEO";

/* =========================================================================
   Customer.io-inspired tokens (scoped to this landing page)
   ========================================================================= */
const TOKENS = `
  .cio {
    --ink: #111111;
    --ocean: #222222;
    --slate: #444444;
    --stone: #666666;
    --ash: #d1cfc5;
    --teal: #111111;
    --leaf: #abffae;
    --mint: #e2eafc;
    --warm: #feefe8;
    --sky: #e0f4ff;
    --canvas: #f4f3ed;
    --white: #ffffff;
    --fog: #ebeae3;
    --indigo: #0a3890;
    --amber: #8b3911;
    --electric: #006af2;
    font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
    color: var(--ink);
    background: var(--canvas);
    letter-spacing: -0.01em;
  }
  .cio h1, .cio h2, .cio h3, .cio h4 {
    font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
    color: var(--ink);
    letter-spacing: -0.01em;
  }
  .cio-pill {
    border-radius: 9999px;
    padding: 10px 22px;
    font-weight: 600;
    font-size: 14px;
    transition: transform .25s ease, box-shadow .25s ease, background .2s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }
  .cio-pill-primary {
    background: var(--ink);
    color: var(--white);
    border: 1px solid var(--ink);
  }
  .cio-pill-primary:hover {
    background: var(--ocean);
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(0,38,43,0.18);
  }
  .cio-pill-outline {
    background: var(--white);
    color: var(--ocean);
    border: 1px solid var(--leaf);
  }
  .cio-pill-outline:hover {
    box-shadow: 0 0 0 4px rgba(171,255,174,0.5);
    transform: translateY(-1px);
  }
  .cio-pill-ghost {
    background: transparent;
    color: var(--ocean);
    padding: 8px 14px;
  }
  .cio-pill-ghost:hover { color: var(--ink); }
  .cio-card {
    background: var(--white);
    border-radius: 16px;
    padding: 32px;
    border: 1px solid rgba(17,17,17,0.08);
    transition: transform .35s ease, box-shadow .35s ease, border-color .35s ease;
  }
  .cio-card:hover {
    transform: translateY(-4px);
    border-color: rgba(17,17,17,0.15);
    box-shadow: 0 16px 40px rgba(0,0,0,0.05);
  }
  .cio-chip {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 6px 14px; border-radius: 9999px;
    background: var(--mint); color: var(--ocean);
    font-size: 12px; font-weight: 600; letter-spacing: 0.017px;
    border: 1px solid rgba(171,255,174,0.7);
  }
  .cio-eyebrow {
    font-size: 12px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.12em;
    color: var(--teal);
  }
  .cio-link {
    color: var(--ocean); text-decoration: none;
    position: relative; transition: color .2s ease;
  }
  .cio-link:hover { color: var(--ink); }
  .cio-link::after {
    content: ''; position: absolute; left: 0; bottom: -2px;
    width: 100%; height: 1px; background: var(--ink);
    transform: scaleX(0); transform-origin: right;
    transition: transform .3s ease;
  }
  .cio-link:hover::after { transform: scaleX(1); transform-origin: left; }

  @keyframes cio-fade-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes cio-fade {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes cio-pulse-dot {
    0%,100% { transform: scale(1); opacity: 1; }
    50%     { transform: scale(1.3); opacity: 0.6; }
  }
  @keyframes cio-marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  .cio-reveal {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity .8s ease, transform .8s ease;
  }
  .cio-reveal.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
  .cio-hero-grid {
    background-image:
      linear-gradient(to right, rgba(11,54,59,0.06) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(11,54,59,0.06) 1px, transparent 1px);
    background-size: 56px 56px;
    mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
  }
  .cio-display-accent { color: var(--electric); font-style: italic; font-weight: 500; }
  .cio-section { padding: 96px 0; }
  @media (max-width: 768px) {
    .cio-section { padding: 64px 0; }
  }
`;

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
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
};

const Index = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  useReveal();

  const features = [
    { icon: Globe, title: "Omnichannel Support", description: "Connect with customers on your website and WhatsApp from a single unified dashboard.", badge: "NEW" },
    { icon: MessageCircle, title: "WhatsApp Integration", description: "Continue conversations seamlessly from web chat to WhatsApp with linked history.", badge: "NEW" },
    { icon: Clock, title: "24/7 AI Support", description: "Provide round-the-clock automated support, drastically reducing response times." },
    { icon: Headphones, title: "Live Agent Handoff", description: "Intelligent queue system with real-time position updates and agent availability." },
    { icon: ImageIcon, title: "Rich Media Sharing", description: "Visitors share images directly in chat for screenshots, products, or visual context." },
    { icon: Brain, title: "AI Conversation Analysis", description: "Automatically analyze sentiment, identify issues, and extract key insights." },
  ];

  const stats = [
    { value: "90%", label: "Resolved by AI" },
    { value: "24/7", label: "Always available" },
    { value: "50%", label: "Faster responses" },
    { value: "10x", label: "Agent productivity" },
  ];

  const faqs = [
    {
      q: "What is an AI customer support chatbot?",
      a: "An AI customer support chatbot like LYQN uses advanced machine learning (GPT-4) to understand customer queries, read your business documentation, and provide instant, accurate answers 24/7 without human intervention."
    },
    {
      q: "How does the WhatsApp integration work?",
      a: "LYQN acts as a bridge between your website chat and WhatsApp Business. A customer can start a chat on your site and seamlessly transition the conversation to WhatsApp. Your agents manage both channels from a single, unified inbox."
    },
    {
      q: "Can the AI hand off conversations to a human agent?",
      a: "Yes. Our intelligent routing system monitors chat sentiment and complexity. If a user requests a human, or if the AI cannot resolve the issue, it instantly routes the chat to an available live agent with full conversation history."
    },
    {
      q: "How do I train the LYQN AI?",
      a: "Training is automatic. You simply provide your website URL, help center links, or upload PDFs. The AI reads your existing documentation and instantly learns your business processes, products, and policies."
    }
  ];

  const schema = JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "LYQN",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "description": "Self-learning AI chat with one-click handoff to humans and a WhatsApp bridge. Deploy on your site in one line. Outperform your competitors with advanced AI customer service.",
      "url": "https://lyqn.app/",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.a
        }
      }))
    }
  ]);

  return (
    <div className="cio min-h-screen">
      <SEO schema={schema} />
      <style>{TOKENS}</style>

      {/* ============== Header ============== */}
      <header
        className="sticky top-0 z-50 pt-4 pb-4 transition-all"
        style={{ background: "var(--canvas)" }}
      >
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg" style={{ color: "#111", letterSpacing: "-0.02em" }}>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#111" }} />
              <div className="w-2.5 h-2.5 rounded-sm opacity-60" style={{ background: "#111" }} />
            </div>
            LYQN
          </Link>

          <nav className="hidden lg:flex items-center gap-6" style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>
            <Link to="/pricing" className="hover:opacity-70">Pricing</Link>
            <Link to="/blog" className="hover:opacity-70">Blog</Link>
            <Link to="/docs" className="hover:opacity-70">Docs</Link>
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <button onClick={() => navigate("/auth")} className="font-medium hover:opacity-70" style={{ fontSize: 14, color: "#111" }}>Log in</button>
            <button onClick={() => navigate("/auth")} className="flex items-center justify-center rounded-full font-semibold transition-all" style={{ background: "#111", color: "#fff", padding: "10px 20px", fontSize: 14 }}>
              Start free trial
            </button>
          </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <button className="cio-pill cio-pill-ghost lg:!hidden" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0 border-l border-gray-100 flex flex-col bg-white">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center pr-12 shrink-0">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-[#111] flex items-center justify-center shadow-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
                      <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="font-bold tracking-tight text-lg" style={{ color: "#111" }}>Lyqn</span>
                </Link>
              </div>
              
              <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-1.5">
                <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="flex items-center px-4 py-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium text-[15px] text-gray-700 hover:text-gray-900">Pricing</Link>
                <Link to="/blog" onClick={() => setMobileMenuOpen(false)} className="flex items-center px-4 py-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium text-[15px] text-gray-700 hover:text-gray-900">Blog</Link>
                <Link to="/docs" onClick={() => setMobileMenuOpen(false)} className="flex items-center px-4 py-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium text-[15px] text-gray-700 hover:text-gray-900">Documentation</Link>
              </nav>

              <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex flex-col gap-3 mt-auto shrink-0">
                <button onClick={() => { setMobileMenuOpen(false); navigate("/auth"); }} className="w-full flex items-center justify-center font-semibold transition-all rounded-xl bg-white hover:bg-gray-50" style={{ border: "1px solid rgba(17,17,17,0.15)", color: "#111", padding: "14px", fontSize: 15 }} onMouseOver={e => {e.currentTarget.style.borderColor = "#111"; e.currentTarget.style.background = "rgba(0,0,0,0.02)"}} onMouseOut={e => {e.currentTarget.style.borderColor = "rgba(17,17,17,0.15)"; e.currentTarget.style.background = "#fff"}}>
                  Log in
                </button>
                <button onClick={() => { setMobileMenuOpen(false); navigate("/auth"); }} className="w-full flex items-center justify-center rounded-xl font-semibold transition-all hover:opacity-90" style={{ background: "#111", color: "#fff", padding: "14px", fontSize: 15 }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-1px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
                  Start free trial
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main>
        {/* ============== Hero ============== */}
        <section className="relative overflow-hidden pt-12 md:pt-20 pb-24" style={{ background: "var(--canvas)" }}>
          {/* Botpress-style Colorful Grainy Gradient Shape */}
          <div className="absolute top-1/2 left-[50%] w-[600px] h-[600px] md:w-[800px] md:h-[800px] pointer-events-none" style={{
            background: 'linear-gradient(135deg, #f6e05e 0%, #ed64a6 40%, #805ad5 70%, #68d391 100%)',
            transform: 'translate(-20%, -40%) rotate(-15deg)',
            zIndex: 0,
            opacity: 0.85,
            maskImage: 'linear-gradient(to bottom right, black, transparent)'
          }}>
             {/* Adding CSS noise overlay */}
             <div className="absolute inset-0 mix-blend-overlay opacity-50" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>
          </div>

          <div className="container mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 max-w-4xl text-left">
              {/* LYQN Badge */}
              <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: "#dbeafe", color: "#1e40af", animation: "cio-fade .6s ease both" }}>
                <span className="font-bold text-[10px] tracking-wider uppercase bg-white px-2 py-0.5 rounded-full text-[#2563eb] shadow-sm">New</span>
                <span className="text-sm font-medium">Now with WhatsApp integration &rarr;</span>
              </div>

              <h1
                className="font-bold mb-6"
                style={{
                  fontSize: "clamp(48px, 8vw, 92px)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.04em",
                  color: "#111",
                  animation: "cio-fade-up .7s ease .05s both",
                }}
              >
                The global AI agent platform for small businesses.
              </h1>

              <p
                className="mb-10"
                style={{
                  maxWidth: 700,
                  color: "#444",
                  fontSize: 22,
                  lineHeight: 1.4,
                  fontWeight: 400,
                  animation: "cio-fade-up .7s ease .15s both",
                }}
              >
                Join thousands of forward-thinking companies. Automate your customer support, answer business questions instantly 24/7, and seamlessly escalate to a human when needed.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-16" style={{ animation: "cio-fade-up .7s ease .25s both" }}>
                <button onClick={() => navigate("/auth")} className="flex items-center justify-center gap-2 rounded-full font-semibold transition-all" style={{ background: "#111", color: "#fff", padding: "16px 32px", fontSize: 16 }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
                  Start free trial &rarr;
                </button>
                <button onClick={() => navigate("/docs")} className="flex items-center justify-center gap-2 rounded-full font-semibold transition-all" style={{ background: "transparent", color: "#111", border: "1px solid rgba(17,17,17,0.15)", padding: "16px 32px", fontSize: 16 }} onMouseOver={e => {e.currentTarget.style.borderColor = "#111"; e.currentTarget.style.background = "rgba(0,0,0,0.02)"}} onMouseOut={e => {e.currentTarget.style.borderColor = "rgba(17,17,17,0.15)"; e.currentTarget.style.background = "transparent"}}>
                  Watch demo
                </button>
              </div>

            </div>

          </div>
        </section>




        {/* ============== Features grid ============== */}
        <section className="cio-section" style={{ background: "var(--white)" }}>
          <div className="container mx-auto px-6">
            <div className="text-center mb-20 cio-reveal max-w-4xl mx-auto">
              <h2 className="font-bold mb-6 text-gray-900" style={{ fontSize: "clamp(36px,5vw,52px)", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                Everything you need
              </h2>
              <p style={{ color: "#555", fontSize: 20, lineHeight: 1.5, maxWidth: "700px", margin: "0 auto" }}>
                A complete platform to automate and enhance customer interactions across every channel.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1400px] mx-auto">
              {features.map((f, idx) => {
                const gradients = [
                  "from-blue-200 via-purple-100/30",
                  "from-pink-200 via-yellow-100/30",
                  "from-green-200 via-yellow-100/30",
                  "from-indigo-200 via-cyan-100/30",
                  "from-orange-200 via-red-100/30",
                  "from-teal-200 via-emerald-100/30",
                ];
                const bgGradient = gradients[idx % gradients.length];
                
                return (
                  <div key={idx} className="cio-reveal relative rounded-[32px] overflow-hidden flex flex-col justify-between p-10 min-h-[380px] transition-transform duration-500 hover:-translate-y-1" style={{ animationDelay: `${(idx % 3) * 100}ms` }}>
                    <div className="absolute inset-0 z-0 bg-[#faf9f6]"></div>
                    <div className={`absolute inset-0 z-0 opacity-80 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] ${bgGradient} to-transparent`}></div>
                    
                    <div className="relative z-10 flex justify-between items-start">
                      <h3 className="text-2xl font-bold text-gray-900 pr-4 leading-tight" style={{ letterSpacing: "-0.02em" }}>{f.title}</h3>
                      {f.badge && (
                        <span className="font-bold tracking-wider uppercase bg-black/5 px-3 py-1.5 rounded-full text-gray-800 flex-shrink-0" style={{ fontSize: 10 }}>
                          {f.badge}
                        </span>
                      )}
                    </div>
                    
                    <div className="relative z-10 flex items-end justify-between gap-4 mt-12">
                      <p className="text-gray-700 text-[16px] leading-snug font-medium max-w-[80%]">
                        {f.description}
                      </p>
                      <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.1)] flex items-center justify-center flex-shrink-0">
                        <f.icon className="w-5 h-5 text-gray-900" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============== AI Learning Showcase ============== */}
        <section className="py-32 bg-[#faf9f6] overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-4xl mx-auto mb-20 cio-reveal">
              <h2 className="font-bold text-gray-900 mb-6" style={{ fontSize: "clamp(40px, 5vw, 56px)", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                Every time your team resolves a ticket, your AI agents get smarter.
              </h2>
              <p className="text-gray-500 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                When your team resolves a ticket, your AI agent learns from it. Your team's judgment compounds into the AI's capability — so the more your team works, the less they have to.
              </p>
            </div>
            
            {/* Visual Collage */}
            <div className="relative w-full max-w-6xl mx-auto h-[500px] md:h-[600px] flex justify-center items-center mt-12 cio-reveal">
              
              {/* Left Element (Dashboard Snippet) */}
              <div className="hidden md:block absolute left-0 z-10 w-[35%] h-[320px] bg-[#f4f2ee] rounded-[24px] shadow-xl p-8 border border-white/50 -translate-x-12 translate-y-16 rotate-[-2deg] transition-transform duration-700 hover:rotate-0 hover:translate-x-[-10px] hover:z-30">
                <div className="bg-white w-full h-full rounded-xl shadow-sm p-5 border border-black/5 flex flex-col">
                  <h4 className="font-bold text-gray-900 mb-2">AI Resolution Rate</h4>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded-md">94.2% Automated</span>
                    <span className="text-xs text-gray-500 font-medium">4,820 Conversations</span>
                  </div>
                  <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Deflection Trend</h5>
                  <div className="flex-1 w-full flex items-end gap-2 pb-2">
                    {[40, 60, 50, 80, 70, 95, 92].map((h, i) => (
                      <div key={i} className="flex-1 bg-gray-100 rounded-t-sm relative group">
                        <div className="absolute bottom-0 w-full bg-[#111] rounded-t-sm transition-all duration-500 group-hover:bg-gray-700" style={{ height: `${h}%` }}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Element (Abstract Gradient Shape) */}
              <div className="hidden md:block absolute right-0 z-10 w-[35%] h-[350px] bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-green-300 via-yellow-100 to-[#f4f2ee] rounded-[24px] shadow-xl p-8 border border-white/50 translate-x-12 -translate-y-8 rotate-[3deg] transition-transform duration-700 hover:rotate-0 hover:translate-x-10 hover:z-30 overflow-hidden flex items-center justify-center">
                {/* 3D Geometric Shape Simulation using SVG */}
                <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Top face */}
                  <path d="M100 20 L160 50 L100 80 L40 50 Z" fill="url(#paint0_linear)" />
                  {/* Left face */}
                  <path d="M40 50 L100 80 L100 150 L40 120 Z" fill="url(#paint1_linear)" />
                  {/* Right face */}
                  <path d="M160 50 L100 80 L100 150 L160 120 Z" fill="url(#paint2_linear)" />
                  <defs>
                    <linearGradient id="paint0_linear" x1="40" y1="20" x2="160" y2="80" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#fef08a" />
                      <stop offset="1" stopColor="#fbcfe8" />
                    </linearGradient>
                    <linearGradient id="paint1_linear" x1="40" y1="50" x2="100" y2="150" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#e879f9" />
                      <stop offset="1" stopColor="#c084fc" />
                    </linearGradient>
                    <linearGradient id="paint2_linear" x1="100" y1="50" x2="160" y2="150" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#f9a8d4" />
                      <stop offset="1" stopColor="#fcd34d" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              
              {/* Center Main Element (Blurred background + chat) */}
              <div className="absolute z-20 w-[90%] md:w-[60%] h-[400px] md:h-[500px] rounded-[32px] overflow-hidden shadow-2xl transition-transform duration-700 hover:scale-[1.02] border border-white/20">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-600/80 to-purple-900/80 backdrop-blur-3xl mix-blend-multiply"></div>
                <div className="absolute inset-0 bg-black/20"></div>
                
                {/* Simulated background texture/image */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-600/40 via-orange-900/60 to-black/80 blur-md scale-110"></div>
                
                <div className="relative z-10 w-full h-full p-6 md:p-10 flex flex-col justify-end">
                  {/* User Bubble */}
                  <div className="flex gap-4 mb-6 items-end">
                    <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">J</div>
                    <div className="bg-white text-gray-900 px-5 py-3.5 rounded-2xl rounded-bl-sm shadow-md font-medium text-[15px] max-w-[85%]">
                      Do you offer custom pricing for over 10,000 WhatsApp messages?
                    </div>
                  </div>
                  
                  {/* Agent Thinking Card */}
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-xl w-full">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="font-bold text-gray-900 text-sm">Running</span>
                      <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 border border-blue-100">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg> 
                        Lead Qualifier Agent
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                        <div className="text-sm text-gray-600">Analyzed intent: <strong className="text-gray-900">High-value enterprise lead</strong></div>
                      </div>
                      <div className="flex items-start gap-3">
                        <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        <div>
                          <div className="text-sm text-gray-700 font-medium mb-1">Checking knowledge base for SLA terms</div>
                          <div className="text-xs text-gray-500">Result <strong className="text-gray-900">Custom volume discounts available</strong></div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 mt-1 pt-3 border-t border-gray-100">
                        <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        <div>
                          <div className="text-sm text-gray-700 font-medium">Routing to Enterprise Sales</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ============== Setup Steps ============== */}
        <section className="py-24" style={{ background: "#fcfcfc" }}>
          <div className="container mx-auto px-6">
            <div className="text-center mb-16 cio-reveal">
              <h2 className="font-bold mb-4" style={{ fontSize: "clamp(32px,5vw,48px)", letterSpacing: "-0.02em", color: "#111" }}>
                Deploy in minutes
              </h2>
              <p style={{ color: "#555", fontSize: 18, maxWidth: 560, margin: "0 auto" }}>
                Three simple steps to automate your customer support.
              </p>
            </div>

            <div className="max-w-5xl mx-auto flex flex-col gap-8">
              {/* Step 1 */}
              <div className="cio-reveal bg-white rounded-[32px] overflow-hidden flex flex-col md:flex-row border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative z-10">
                <div className="flex-1 p-10 md:p-16 flex flex-col justify-center">
                  <div className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-4">Step 1</div>
                  <h3 className="text-3xl md:text-[32px] font-bold text-gray-900 mb-4 leading-tight tracking-tight">Set up your account</h3>
                  <p className="text-gray-500 text-[16px] leading-relaxed max-w-md">
                    Create your LYQN account in seconds. Import your FAQs, help center docs, and website URL to instantly train your AI agent.
                  </p>
                </div>
                <div className="w-full md:w-[45%] relative min-h-[300px] md:min-h-full bg-[#f2efeb] p-8 md:p-12 flex flex-col justify-center">
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-900 text-lg">Knowledge Sync</h4>
                    <p className="text-sm text-gray-500 mt-1">Connect your data sources in one click</p>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {/* Data Source 1 */}
                    <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-black/5 hover:-translate-y-0.5 transition-transform">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                          <Globe className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-900">acme.com/help</div>
                          <div className="text-xs text-gray-500">Website crawl • 142 pages</div>
                        </div>
                      </div>
                      <div className="text-[11px] font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">Synced</div>
                    </div>

                    {/* Data Source 2 */}
                    <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-black/5 hover:-translate-y-0.5 transition-transform">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-900">Return_Policy_2024.pdf</div>
                          <div className="text-xs text-gray-500">File upload • 2.4 MB</div>
                        </div>
                      </div>
                      <div className="text-[11px] font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">Synced</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connector Arrow 1 */}
              <div className="hidden md:flex justify-center items-center -my-6 relative z-0 h-16 opacity-60">
                <svg width="24" height="60" viewBox="0 0 24 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-pulse">
                  <path d="M12 0L12 50" stroke="#111" strokeWidth="2" strokeDasharray="4 4" />
                  <path d="M6 44L12 52L18 44" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Step 2 (Reversed) */}
              <div className="cio-reveal bg-white rounded-[32px] overflow-hidden flex flex-col md:flex-row-reverse border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative z-10">
                <div className="flex-1 p-10 md:p-16 flex flex-col justify-center">
                  <div className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-4">Step 2</div>
                  <h3 className="text-3xl md:text-[32px] font-bold text-gray-900 mb-4 leading-tight tracking-tight">Configure your AI agents</h3>
                  <p className="text-gray-500 text-[16px] leading-relaxed max-w-md">
                    Set up your knowledge base, workflows, integrations, channels, and escalation logic. Connects to webchat, WhatsApp, voice, and your existing stack.
                  </p>
                </div>
                <div className="w-full md:w-[45%] relative min-h-[300px] md:min-h-full bg-[#f2efeb] p-8 md:p-12 flex flex-col justify-center">
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-900 text-lg">Frontline Agents</h4>
                    <p className="text-sm text-gray-500 mt-1">AI agents handle your customer conversations</p>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {/* Agent 1 */}
                    <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-black/5 hover:-translate-y-0.5 transition-transform">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-white">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-[14px]">LYQN Support</div>
                          <div className="text-[12px] text-gray-500">Handles Tier-1 support & FAQs</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <MessageCircle className="w-4 h-4" />
                        <MessageCircle className="w-4 h-4 text-green-500" />
                      </div>
                    </div>

                    {/* Agent 2 */}
                    <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-black/5 hover:-translate-y-0.5 transition-transform">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-[14px]">Lead Qualifier</div>
                          <div className="text-[12px] text-gray-500">Qualifies leads & routes to sales</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6M22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6M22 6L12 13L2 6" stroke="#DB4437" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    </div>

                    {/* Agent 3 */}
                    <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-black/5 hover:-translate-y-0.5 transition-transform">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5v14M22 10v4M7 9v6M2 11v2"/></svg>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-[14px]">WhatsApp Agent</div>
                          <div className="text-[12px] text-gray-500">24/7 automated instant responses</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connector Arrow 2 */}
              <div className="hidden md:flex justify-center items-center -my-6 relative z-0 h-16 opacity-60">
                <svg width="24" height="60" viewBox="0 0 24 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-pulse" style={{ animationDelay: "500ms" }}>
                  <path d="M12 0L12 50" stroke="#111" strokeWidth="2" strokeDasharray="4 4" />
                  <path d="M6 44L12 52L18 44" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Step 3 */}
              <div className="cio-reveal bg-white rounded-[32px] overflow-hidden flex flex-col md:flex-row border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative z-10">
                <div className="flex-1 p-10 md:p-16 flex flex-col justify-center">
                  <div className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-4">Step 3</div>
                  <h3 className="text-3xl md:text-[32px] font-bold text-gray-900 mb-4 leading-tight tracking-tight">WhatsApp Integration</h3>
                  <p className="text-gray-500 text-[16px] leading-relaxed max-w-md">
                    Connect your WhatsApp Business API. Allow users to seamlessly transition from web chat to WhatsApp without losing context.
                  </p>
                </div>
                <div className="w-full md:w-[45%] relative min-h-[300px] md:min-h-full bg-[#f2efeb] p-8 md:p-12 flex flex-col justify-center">
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-900 text-lg">Active Channels</h4>
                    <p className="text-sm text-gray-500 mt-1">Deploy your agent where your customers are</p>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {/* Channel 1 */}
                    <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-black/5 hover:-translate-y-0.5 transition-transform">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-white shadow-sm">
                          <MessageCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-900">WhatsApp Business</div>
                          <div className="text-[12px] text-gray-500">+1 800 555 0199</div>
                        </div>
                      </div>
                      <div className="w-9 h-5 bg-green-500 rounded-full flex items-center justify-end px-1 border border-green-600 shadow-inner">
                        <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm"></div>
                      </div>
                    </div>

                    {/* Channel 2 */}
                    <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-black/5 hover:-translate-y-0.5 transition-transform">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-900">Webchat Widget</div>
                          <div className="text-[12px] text-gray-500">Deployed on acme.com</div>
                        </div>
                      </div>
                      <div className="w-9 h-5 bg-green-500 rounded-full flex items-center justify-end px-1 border border-green-600 shadow-inner">
                        <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm"></div>
                      </div>
                    </div>

                    {/* Channel 3 */}
                    <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-black/5 opacity-50 cursor-not-allowed">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-900">Instagram Direct</div>
                          <div className="text-[12px] text-gray-500">Not configured</div>
                        </div>
                      </div>
                      <div className="w-9 h-5 bg-gray-200 rounded-full flex items-center justify-start px-1 border border-gray-300 shadow-inner">
                        <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ============== Team trio ============== */}
        <section className="py-32" style={{ background: "#eeebe5" }}>
          <div className="container mx-auto px-6">
            <div className="text-center mb-20 cio-reveal">
              <h2 className="font-bold" style={{ fontSize: "clamp(32px, 5vw, 48px)", letterSpacing: "-0.03em", color: "#111", lineHeight: 1.1 }}>
                Enterprise-grade reliability,<br />built for your team.
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {/* Card 1 - Enterprise-grade security */}
              <div className="bg-white rounded-[24px] p-8 md:p-10 flex flex-col cio-reveal shadow-sm hover:shadow-xl transition-shadow duration-500">
                <div className="flex-1 min-h-[220px] flex items-center justify-center mb-8 relative">
                  <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="50" y="40" width="80" height="60" stroke="#6e8e58" strokeWidth="1" fill="#6e8e58" fillOpacity="0.03" />
                    <text x="60" y="60" fill="#6e8e58" fontSize="10" fontFamily="sans-serif" fontWeight="600">SOC II</text>
                    
                    <rect x="110" y="70" width="70" height="80" stroke="#6e8e58" strokeWidth="1" fill="#6e8e58" fillOpacity="0.03" />
                    <text x="120" y="90" fill="#6e8e58" fontSize="10" fontFamily="sans-serif" fontWeight="600">GDPR</text>
                    
                    <rect x="30" y="110" width="90" height="50" stroke="#6e8e58" strokeWidth="1" fill="#6e8e58" fillOpacity="0.03" />
                    <text x="40" y="130" fill="#6e8e58" fontSize="10" fontFamily="sans-serif" fontWeight="600">KPMG</text>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold mb-3 text-gray-900" style={{ fontSize: 18, letterSpacing: "-0.01em" }}>Enterprise-grade security</h3>
                  <p className="text-gray-500 leading-relaxed" style={{ fontSize: 14 }}>
                    SOC II certified, GDPR compliant, and penetration tested. Your data and your customers' data are protected to the highest industry standard.
                  </p>
                </div>
              </div>

              {/* Card 2 - Reliable infrastructure */}
              <div className="bg-white rounded-[24px] p-8 md:p-10 flex flex-col cio-reveal shadow-sm hover:shadow-xl transition-shadow duration-500" style={{ transitionDelay: "100ms" }}>
                <div className="flex-1 min-h-[220px] flex items-center justify-center mb-8 relative">
                  <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Abstract 3D block wireframe */}
                    <path d="M50 120 L100 150 L150 120 L150 70 L100 40 L50 70 Z" stroke="#6e8e58" strokeWidth="1" fill="#6e8e58" fillOpacity="0.03" />
                    <path d="M50 70 L100 100 L150 70" stroke="#6e8e58" strokeWidth="1" />
                    <path d="M100 100 L100 150" stroke="#6e8e58" strokeWidth="1" />
                    {/* Inner blocks */}
                    <path d="M75 105 L100 120 L125 105 L125 75 L100 60 L75 75 Z" stroke="#6e8e58" strokeWidth="0.5" />
                    <path d="M75 75 L100 90 L125 75" stroke="#6e8e58" strokeWidth="0.5" />
                    <path d="M100 90 L100 120" stroke="#6e8e58" strokeWidth="0.5" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold mb-3 text-gray-900" style={{ fontSize: 18, letterSpacing: "-0.01em" }}>Reliable infrastructure</h3>
                  <p className="text-gray-500 leading-relaxed" style={{ fontSize: 14 }}>
                    Built on AWS with automatic scaling and zero maintenance required. LYQN handles peak traffic without interruption — your team never has to think about it.
                  </p>
                </div>
              </div>

              {/* Card 3 - AI that knows its limits */}
              <div className="bg-white rounded-[24px] p-8 md:p-10 flex flex-col cio-reveal shadow-sm hover:shadow-xl transition-shadow duration-500" style={{ transitionDelay: "200ms" }}>
                <div className="flex-1 min-h-[220px] flex items-center justify-center mb-8 relative">
                  <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Nested squares diagram */}
                    <rect x="40" y="40" width="120" height="120" stroke="#6e8e58" strokeWidth="0.5" />
                    <rect x="60" y="60" width="80" height="80" stroke="#6e8e58" strokeWidth="1" fill="#6e8e58" fillOpacity="0.03" />
                    <rect x="80" y="80" width="40" height="40" stroke="#6e8e58" strokeWidth="1" />
                    <line x1="40" y1="40" x2="160" y2="160" stroke="#6e8e58" strokeWidth="0.5" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold mb-3 text-gray-900" style={{ fontSize: 18, letterSpacing: "-0.01em" }}>AI that knows its limits</h3>
                  <p className="text-gray-500 leading-relaxed" style={{ fontSize: 14 }}>
                    LYQN agents are built with escalation rules and fallback logic that determine exactly when AI acts and when it escalates. Full context passed to your team every time — no cold handoffs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============== FAQ Section ============== */}
        <section className="cio-section bg-[#fcfcfc] py-24">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-12 gap-16 max-w-7xl mx-auto">
              {/* Left Column - Header */}
              <div className="lg:col-span-5 cio-reveal">
                <h2 className="font-bold mb-6" style={{ fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1.05, letterSpacing: "-0.04em", color: "#111" }}>
                  Frequently asked questions.
                </h2>
                <p style={{ color: "#555", fontSize: 18, lineHeight: 1.5 }}>
                  Everything you need to know about LYQN's platform, integration, and pricing. Can't find the answer you're looking for? <span className="font-semibold text-black cursor-pointer underline underline-offset-4">Chat with us</span>.
                </p>
              </div>

              {/* Right Column - Accordion */}
              <div className="lg:col-span-7 cio-reveal" style={{ transitionDelay: "150ms" }}>
                <div className="border-t border-gray-200">
                  {faqs.map((faq, idx) => (
                    <div key={idx} className="border-b border-gray-200 group">
                      <button
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        className="w-full py-6 flex items-center justify-between text-left focus:outline-none transition-colors hover:bg-black/[0.02]"
                      >
                        <span className="text-[20px] sm:text-[22px] font-medium text-gray-900 pr-8" style={{ fontFamily: "Georgia, serif" }}>
                          {faq.q}
                        </span>
                        <div className="shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-transform duration-300" style={{ transform: openFaq === idx ? "rotate(180deg)" : "rotate(0deg)" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </div>
                      </button>
                      
                      <div 
                        className="overflow-hidden transition-all duration-300 ease-in-out"
                        style={{ 
                          maxHeight: openFaq === idx ? "400px" : "0",
                          opacity: openFaq === idx ? 1 : 0
                        }}
                      >
                        <div className="pb-6 pr-12">
                          <p className="text-gray-600 leading-relaxed text-[16px]">
                            {faq.a}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============== CTA ============== */}
        <section className="py-24" style={{ background: "#0b0d0e" }}>
          <div className="container mx-auto px-6">
            <div className="cio-reveal max-w-7xl mx-auto rounded-[32px] overflow-hidden flex flex-col md:flex-row relative" style={{ background: "#f4f3ed", minHeight: "480px" }}>
              
              {/* Left Content */}
              <div className="flex-1 p-10 md:p-16 flex flex-col justify-end z-10">
                <h2 className="font-bold mb-10" style={{ fontSize: "clamp(40px, 6vw, 64px)", lineHeight: 1.05, letterSpacing: "-0.04em", color: "#111", maxWidth: "600px" }}>
                  Every AI support tool has a ceiling. <br className="hidden md:block" />
                  LYQN isn't one of them.
                </h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={() => navigate("/auth")} className="flex items-center justify-center gap-2 rounded-full font-semibold transition-all" style={{ background: "#111", color: "#fff", padding: "14px 28px", fontSize: 15 }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
                    Register &rarr;
                  </button>
                  <button onClick={() => navigate("/auth")} className="flex items-center justify-center gap-2 rounded-full font-semibold transition-all" style={{ background: "transparent", color: "#111", border: "1px solid rgba(17,17,17,0.15)", padding: "14px 28px", fontSize: 15 }} onMouseOver={e => {e.currentTarget.style.borderColor = "#111"; e.currentTarget.style.background = "rgba(0,0,0,0.02)"}} onMouseOut={e => {e.currentTarget.style.borderColor = "rgba(17,17,17,0.15)"; e.currentTarget.style.background = "transparent"}}>
                    Try for free
                  </button>
                </div>
              </div>

              {/* Right Geometric Gradient Graphic */}
              <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden md:block overflow-hidden">
                <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <filter id="grain">
                      <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch" />
                      <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.1 0" />
                    </filter>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f6e05e" />
                      <stop offset="50%" stopColor="#ed64a6" />
                      <stop offset="100%" stopColor="#805ad5" />
                    </linearGradient>
                    <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#68d391" />
                      <stop offset="50%" stopColor="#805ad5" />
                      <stop offset="100%" stopColor="#f6e05e" />
                    </linearGradient>
                  </defs>
                  
                  {/* Geometric Shapes */}
                  <g transform="translate(100, -100)">
                    {/* Top rectangle */}
                    <rect x="0" y="0" width="400" height="300" fill="url(#grad2)" opacity="0.6" />
                    
                    {/* Middle large square */}
                    <rect x="250" y="200" width="350" height="350" fill="url(#grad1)" opacity="0.8" />
                    
                    {/* Bottom triangle overlay */}
                    <polygon points="250,550 600,550 600,800" fill="url(#grad2)" opacity="0.9" />
                    
                    {/* Additional triangle for depth */}
                    <polygon points="600,200 600,550 800,200" fill="url(#grad1)" opacity="0.7" />
                  </g>
                  
                  {/* Grain overlay for the entire SVG */}
                  <rect width="100%" height="100%" filter="url(#grain)" opacity="0.8" style={{ mixBlendMode: 'multiply' }} />
                </svg>
              </div>

            </div>
          </div>
        </section>
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

export default Index;
