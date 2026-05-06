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
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LyqnWidgetEmbed } from "@/components/LyqnWidgetEmbed";

/* =========================================================================
   Customer.io-inspired tokens (scoped to this landing page)
   ========================================================================= */
const TOKENS = `
  .cio {
    --ink: #00262b;
    --ocean: #0b363b;
    --slate: #354d51;
    --stone: #4f6466;
    --ash: #a1c2c6;
    --teal: #437278;
    --leaf: #abffae;
    --mint: #eafde8;
    --warm: #feefe8;
    --sky: #e0f4ff;
    --canvas: #ebebeb;
    --white: #ffffff;
    --fog: #fafafa;
    --indigo: #0a3890;
    --amber: #8b3911;
    --electric: #006af2;
    font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
    color: var(--ink);
    background: var(--canvas);
    letter-spacing: 0.013px;
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
    border-radius: 6px;
    padding: 32px;
    border: 1px solid rgba(11,54,59,0.06);
    transition: transform .35s ease, box-shadow .35s ease, border-color .35s ease;
  }
  .cio-card:hover {
    transform: translateY(-3px);
    border-color: var(--leaf);
    box-shadow: 0 12px 36px rgba(0,38,43,0.06);
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

  const logos = ["acme", "northwind", "globex", "umbrella", "initech", "stark", "wayne", "hooli"];

  return (
    <div className="cio min-h-screen">
      <style>{TOKENS}</style>

      {/* ============== Header ============== */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "saturate(180%) blur(14px)",
          borderColor: "rgba(11,54,59,0.08)",
        }}
      >
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg" style={{ color: "var(--ink)" }}>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--ink)" }} />
              <div className="w-2.5 h-2.5 rounded-sm opacity-60" style={{ background: "var(--ink)" }} />
            </div>
            <span style={{ letterSpacing: "-0.02em" }}>LYQN</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link to="/features" className="cio-pill cio-pill-ghost">Features</Link>
            <Link to="/pricing" className="cio-pill cio-pill-ghost">Pricing</Link>
            <Link to="/docs" className="cio-pill cio-pill-ghost">Docs</Link>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <button onClick={() => navigate("/auth")} className="cio-pill cio-pill-ghost">Login</button>
            <button onClick={() => navigate("/auth")} className="cio-pill cio-pill-primary">
              Get started <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <button className="cio-pill cio-pill-ghost" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72" style={{ background: "var(--white)" }}>
              <nav className="flex flex-col gap-2 mt-10">
                <Link to="/features" onClick={() => setMobileMenuOpen(false)} className="cio-pill cio-pill-ghost justify-start">Features</Link>
                <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="cio-pill cio-pill-ghost justify-start">Pricing</Link>
                <Link to="/docs" onClick={() => setMobileMenuOpen(false)} className="cio-pill cio-pill-ghost justify-start">Docs</Link>
                <button onClick={() => { setMobileMenuOpen(false); navigate("/auth"); }} className="cio-pill cio-pill-primary mt-4 justify-center">
                  Get started
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main>
        {/* ============== Hero ============== */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 cio-hero-grid pointer-events-none" />
          <div className="container mx-auto px-6 pt-20 md:pt-28 pb-20 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="cio-chip mb-8" style={{ animation: "cio-fade .6s ease both" }}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full" style={{ background: "var(--ocean)", animation: "cio-pulse-dot 2s ease infinite" }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "var(--ocean)" }} />
                </span>
                Now with WhatsApp Integration
              </div>

              <h1
                className="font-semibold mb-6"
                style={{
                  fontSize: "clamp(40px, 7vw, 88px)",
                  lineHeight: 1.02,
                  letterSpacing: "-0.025em",
                  animation: "cio-fade-up .7s ease .05s both",
                }}
              >
                Customer support,<br />
                <span className="cio-display-accent">reimagined</span> with AI.
              </h1>

              <p
                className="mx-auto mb-10"
                style={{
                  maxWidth: 640,
                  color: "var(--slate)",
                  fontSize: 18,
                  lineHeight: 1.5,
                  animation: "cio-fade-up .7s ease .15s both",
                }}
              >
                Train an AI on your business knowledge that handles customer questions across web and WhatsApp — so your team can focus on what matters.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-14" style={{ animation: "cio-fade-up .7s ease .25s both" }}>
                <button onClick={() => navigate("/auth")} className="cio-pill cio-pill-primary justify-center" style={{ padding: "14px 28px", fontSize: 15 }}>
                  Start free trial <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => navigate("/docs")} className="cio-pill cio-pill-outline justify-center" style={{ padding: "14px 28px", fontSize: 15 }}>
                  <Play className="w-4 h-4" /> Watch demo
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto cio-reveal">
                {stats.map((s, i) => (
                  <div key={i} className="text-left md:text-center" style={{ borderLeft: "1px solid rgba(11,54,59,0.12)", paddingLeft: 16 }}>
                    <div className="font-semibold" style={{ fontSize: 32, color: "var(--ink)", letterSpacing: "-0.02em" }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--stone)", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero chat preview card */}
            <div className="max-w-md mx-auto mt-16 md:mt-20 cio-reveal">
              <div className="cio-card" style={{ padding: 20 }}>
                <div className="flex items-center gap-2.5 mb-4 pb-4" style={{ borderBottom: "1px solid rgba(11,54,59,0.08)" }}>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm" style={{ background: "var(--ink)" }} />
                    <div className="w-2 h-2 rounded-sm opacity-60" style={{ background: "var(--ink)" }} />
                  </div>
                  <span className="font-semibold" style={{ fontSize: 14 }}>LYQN AI Assistant</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: "var(--leaf)", boxShadow: "0 0 0 4px rgba(171,255,174,0.4)" }} />
                    <span style={{ fontSize: 12, color: "var(--stone)" }}>Online</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ background: "var(--mint)" }}>
                      <Bot className="w-4 h-4" style={{ color: "var(--ocean)" }} />
                    </div>
                    <div className="flex-1">
                      <p style={{ fontSize: 14, color: "var(--ink)" }}>Hi there 👋 I'm your AI assistant.</p>
                      <p style={{ fontSize: 12, color: "var(--stone)", marginTop: 2 }}>Ask me anything or continue on WhatsApp.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-md" style={{ background: "var(--mint)", border: "1px solid rgba(171,255,174,0.7)" }}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" style={{ fill: "var(--ocean)" }}>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    <span style={{ fontSize: 12, color: "var(--ocean)", fontWeight: 600 }}>Continue on WhatsApp</span>
                    <Link2 className="w-3 h-3 ml-auto" style={{ color: "var(--ocean)" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* ============== How it works ============== */}
        <section className="cio-section">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16 cio-reveal">
              <p className="cio-eyebrow mb-3">How it works</p>
              <h2 className="font-semibold mb-4" style={{ fontSize: "clamp(32px,5vw,48px)", letterSpacing: "-0.02em" }}>
                Set up in minutes
              </h2>
              <p style={{ color: "var(--slate)", fontSize: 18, maxWidth: 560, margin: "0 auto" }}>
                Three simple steps to deploy your AI-powered customer support.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { step: "01", icon: Globe, title: "Sync your data", desc: "Enter your website URL and watch as AI learns from your content, docs, and FAQs." },
                { step: "02", icon: Sparkles, title: "Customize your bot", desc: "Add your branding, configure responses, and set up WhatsApp integration." },
                { step: "03", icon: FileText, title: "Deploy everywhere", desc: "Install on your website, app, or help center with a simple embed code." },
              ].map((item, idx) => (
                <div key={idx} className="cio-card cio-reveal relative overflow-hidden" style={{ transitionDelay: `${idx * 80}ms` }}>
                  <div className="absolute top-4 right-5 font-semibold" style={{ fontSize: 56, color: "var(--mint)", letterSpacing: "-0.02em" }}>
                    {item.step}
                  </div>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-md flex items-center justify-center mb-6" style={{ background: "var(--mint)" }}>
                      <item.icon className="w-6 h-6" style={{ color: "var(--ocean)" }} />
                    </div>
                    <h3 className="font-semibold mb-3" style={{ fontSize: 22, letterSpacing: "-0.01em" }}>{item.title}</h3>
                    <p style={{ color: "var(--slate)", fontSize: 15, lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============== Features grid ============== */}
        <section className="cio-section" style={{ background: "var(--white)" }}>
          <div className="container mx-auto px-6">
            <div className="text-center mb-16 cio-reveal">
              <p className="cio-eyebrow mb-3">Features</p>
              <h2 className="font-semibold mb-4" style={{ fontSize: "clamp(32px,5vw,48px)", letterSpacing: "-0.02em" }}>
                Everything you need
              </h2>
              <p style={{ color: "var(--slate)", fontSize: 18, maxWidth: 560, margin: "0 auto" }}>
                A complete platform to automate and enhance customer interactions.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
              {features.map((f, idx) => (
                <div
                  key={idx}
                  className="cio-card cio-reveal"
                  style={{
                    background: idx % 3 === 0 ? "var(--fog)" : idx % 3 === 1 ? "var(--white)" : "var(--mint)",
                    transitionDelay: `${idx * 60}ms`,
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-md flex items-center justify-center" style={{ background: "var(--white)", border: "1px solid rgba(11,54,59,0.1)" }}>
                      <f.icon className="w-5 h-5" style={{ color: "var(--ocean)" }} />
                    </div>
                    {f.badge && (
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", padding: "4px 8px", borderRadius: 9999, background: "var(--ink)", color: "var(--white)" }}>
                        {f.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold mb-2" style={{ fontSize: 18, letterSpacing: "-0.01em" }}>{f.title}</h3>
                  <p style={{ color: "var(--slate)", fontSize: 14, lineHeight: 1.5 }}>{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============== Omnichannel split ============== */}
        <section className="cio-section">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div className="cio-reveal">
                <p className="cio-eyebrow mb-3">Omnichannel</p>
                <h2 className="font-semibold mb-6" style={{ fontSize: "clamp(28px,4vw,40px)", letterSpacing: "-0.02em" }}>
                  One inbox for every channel
                </h2>
                <p style={{ color: "var(--slate)", fontSize: 17, lineHeight: 1.55, marginBottom: 28 }}>
                  Manage conversations from your website widget and WhatsApp in a single dashboard. Visitors continue chats across channels with their history preserved.
                </p>
                <ul className="space-y-3">
                  {[
                    "Web widget with rich media support",
                    "WhatsApp Business integration",
                    "Linked conversation history",
                    "Real-time agent queue",
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--leaf)" }}>
                        <Check className="w-3 h-3" style={{ color: "var(--ink)" }} strokeWidth={3} />
                      </div>
                      <span style={{ fontSize: 15, color: "var(--ink)" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="cio-reveal">
                <div className="cio-card" style={{ background: "var(--sky)" }}>
                  <div className="space-y-3">
                    {[
                      { name: "John from Web", msg: "Need help with my order…", tag: "Web", tagColor: "var(--sky)", time: "2m ago" },
                      { name: "Maria via WhatsApp", msg: "Continuing from web chat…", tag: "WhatsApp", tagColor: "var(--mint)", time: "5m ago", whatsapp: true },
                      { name: "Alex from Web", msg: "Waiting for agent…", tag: "Queue", tagColor: "var(--warm)", time: "12m ago" },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-md" style={{ background: "var(--white)", border: "1px solid rgba(11,54,59,0.08)" }}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: row.whatsapp ? "var(--mint)" : "var(--fog)" }}>
                          <MessageCircle className="w-4 h-4" style={{ color: "var(--ocean)" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold truncate" style={{ fontSize: 13 }}>{row.name}</span>
                            <span style={{ fontSize: 11, color: "var(--stone)" }}>{row.time}</span>
                          </div>
                          <p style={{ fontSize: 12, color: "var(--stone)" }}>{row.msg}</p>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 9999, background: row.tagColor, color: "var(--ocean)" }}>
                          {row.tag}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============== Team trio ============== */}
        <section className="cio-section" style={{ background: "var(--white)" }}>
          <div className="container mx-auto px-6">
            <div className="text-center mb-16 cio-reveal">
              <p className="cio-eyebrow mb-3">Collaboration</p>
              <h2 className="font-semibold mb-4" style={{ fontSize: "clamp(32px,5vw,48px)", letterSpacing: "-0.02em" }}>
                Built for teams
              </h2>
              <p style={{ color: "var(--slate)", fontSize: 18, maxWidth: 560, margin: "0 auto" }}>
                Collaborate with your team to deliver exceptional support.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { icon: Users, title: "Team Management", desc: "Add team members with role-based permissions. Control who can access what." },
                { icon: BarChart3, title: "Performance Analytics", desc: "Track agent performance, response times, and resolution rates with detailed reports." },
                { icon: Shield, title: "Enterprise Security", desc: "Enterprise-grade security with data encryption, compliance standards, and audit logs." },
              ].map((c, i) => (
                <div key={i} className="cio-card cio-reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                  <div className="w-12 h-12 rounded-md flex items-center justify-center mb-6" style={{ background: "var(--mint)" }}>
                    <c.icon className="w-6 h-6" style={{ color: "var(--ocean)" }} />
                  </div>
                  <h3 className="font-semibold mb-3" style={{ fontSize: 20, letterSpacing: "-0.01em" }}>{c.title}</h3>
                  <p style={{ color: "var(--slate)", fontSize: 15, lineHeight: 1.55 }}>{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============== CTA ============== */}
        <section className="cio-section relative overflow-hidden" style={{ background: "var(--ink)", color: "var(--white)" }}>
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }} />
          <div className="container mx-auto px-6 relative">
            <div className="max-w-3xl mx-auto text-center cio-reveal">
              <h2 className="font-semibold mb-6" style={{ fontSize: "clamp(32px,5vw,56px)", letterSpacing: "-0.025em", color: "var(--white)" }}>
                Ready to transform your support?
              </h2>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 18, marginBottom: 40, maxWidth: 560, margin: "0 auto 40px" }}>
                Join thousands of businesses using LYQN to deliver exceptional customer experiences.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
                <button
                  onClick={() => navigate("/auth")}
                  className="cio-pill justify-center"
                  style={{ background: "var(--white)", color: "var(--ink)", padding: "14px 28px", fontSize: 15 }}
                >
                  Start free trial <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate("/pricing")}
                  className="cio-pill justify-center"
                  style={{ background: "transparent", color: "var(--white)", border: "1px solid var(--leaf)", padding: "14px 28px", fontSize: 15 }}
                >
                  View pricing
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-6" style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
                {["1 month free trial", "No credit card required", "Cancel anytime"].map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4" style={{ color: "var(--leaf)" }} />
                    {t}
                  </div>
                ))}
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
              { title: "Product", links: [["Features", "/features"], ["Pricing", "/pricing"], ["Documentation", "/docs"]] },
              { title: "Company", links: [["About", "/"], ["Blog", "/"], ["Contact", "/"]] },
              { title: "Legal", links: [["Privacy", "/"], ["Terms", "/"]] },
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
