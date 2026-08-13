import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, ArrowUpRight, HelpCircle, ShieldCheck, Zap, Star, Building2, Sparkles } from "lucide-react";
import { PolarCheckout } from "@/components/PolarCheckout";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { LyqnWidgetEmbed } from "@/components/LyqnWidgetEmbed";
import { SEO } from "@/components/SEO";

/* =========================================================================
   Customer.io-inspired design system tokens aligned with Index.tsx
   ========================================================================= */
const TOKENS = `
  .cio-pricing {
    --ink: #111111;
    --ocean: #222222;
    --slate: #444444;
    --stone: #666666;
    --ash: #d1cfc5;
    --leaf: #abffae;
    --mint: #e2eafc;
    --canvas: #f4f3ed;
    --white: #ffffff;
    --fog: #ebeae3;
    --electric: #006af2;
    font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
    color: var(--ink);
    background: var(--canvas);
    letter-spacing: -0.01em;
  }
  .cio-pricing h1, .cio-pricing h2, .cio-pricing h3, .cio-pricing h4 {
    font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
    color: var(--ink);
    letter-spacing: -0.01em;
  }
  .cio-pill-primary {
    background: var(--ink);
    color: var(--white);
    border: 1px solid var(--ink);
    border-radius: 9999px;
    padding: 12px 24px;
    font-weight: 600;
    font-size: 14px;
    transition: transform .25s ease, box-shadow .25s ease, background .2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
  }
  .cio-pill-primary:hover {
    background: var(--ocean);
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }
  .cio-pill-white {
    background: var(--white);
    color: var(--ink);
    border: 1px solid var(--white);
    border-radius: 9999px;
    padding: 12px 24px;
    font-weight: 600;
    font-size: 14px;
    transition: transform .25s ease, box-shadow .25s ease, background .2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
  }
  .cio-pill-white:hover {
    background: #f0f0f0;
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(255,255,255,0.2);
  }
  .cio-link {
    color: var(--ocean); text-decoration: none;
    position: relative; transition: color .2s ease;
  }
  .cio-link:hover { color: var(--ink); }
  .cio-reveal {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity .7s cubic-bezier(0.16, 1, 0.3, 1), transform .7s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .cio-reveal.is-visible {
    opacity: 1;
    transform: translateY(0);
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
      { threshold: 0.1 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
};

const Pricing = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isAnnual, setIsAnnual] = useState(false);
  useReveal();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
    const params = new URLSearchParams(window.location.search);
    setIsNewUser(params.get('new_user') === 'true');
  }, []);

  const plans = [
    {
      name: "Basic",
      monthlyPrice: 5,
      annualPrice: 4,
      productId: "2e7f6e6a-cb2a-4167-bf5c-7eb9e55c6636",
      description: "For individual founders & solo projects",
      icon: Star,
      features: [
        { num: "01", text: "2 weeks free trial" },
        { num: "02", text: "1 business" },
        { num: "03", text: "Pre-chat forms" },
        { num: "04", text: "Canned responses" },
        { num: "05", text: "Basic analytics" },
        { num: "06", text: "Email notifications" },
        { num: "07", text: "Chat history" },
      ],
      cta: "Start Free Trial",
      popular: false,
      isDark: false,
    },
    {
      name: "Pro",
      monthlyPrice: 10,
      annualPrice: 8,
      productId: "65495367-3163-49af-9ae4-0c3e740d332a",
      description: "For growing teams scaling customer support",
      icon: Zap,
      features: [
        { num: "01", text: "Everything in Basic" },
        { num: "02", text: "2 businesses" },
        { num: "03", text: "Live agent transfer" },
        { num: "04", text: "Advanced analytics" },
        { num: "05", text: "Sentiment analysis" },
        { num: "06", text: "Proactive chat rules" },
        { num: "07", text: "Priority support" },
      ],
      cta: "Get Started with Pro",
      popular: true,
      isDark: true,
    },
    {
      name: "Business",
      monthlyPrice: 20,
      annualPrice: 16,
      productId: "495da580-72e9-4fb9-a706-b098921df542",
      description: "For serious scale & multi-brand operations",
      icon: Building2,
      features: [
        { num: "01", text: "Everything in Pro" },
        { num: "02", text: "5 businesses" },
        { num: "03", text: "AI learning & documents" },
        { num: "04", text: "Advanced visitor tracking" },
        { num: "05", text: "Website crawler" },
        { num: "06", text: "Team management" },
        { num: "07", text: "Dedicated account manager" },
      ],
      cta: "Get Started with Business",
      popular: false,
      isDark: false,
    },
  ];

  const faqs = [
    { q: "Can I change plans later?", a: "Yes, upgrade or downgrade anytime from your billing dashboard. Changes apply immediately with prorated charges." },
    { q: "What happens when I reach my business limit?", a: "You can manage up to your plan's business limit. When you're ready to add more businesses, simply upgrade to the next tier." },
    { q: "Is there a setup fee?", a: "No setup fees, no hidden charges. You only pay the straightforward monthly or discounted annual subscription." },
    { q: "How does the 2-week free trial work?", a: "You get full access to the Basic plan features for 14 days without entering a credit card. Choose your plan whenever you are ready." },
    { q: "Do you offer custom enterprise pricing?", a: "Yes! If you need more than 5 businesses or custom SLA agreements, reach out directly to our support team." },
  ];

  const schema = JSON.stringify({
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
  });

  return (
    <div className="cio-pricing min-h-screen">
      <SEO 
        title="LYQN Pricing: Simple, Transparent Plans" 
        description="Choose the perfect LYQN plan for your business. Start with a 2-week free trial. Outperform competitors with our affordable AI chatbot and live agent integration."
        url="https://lyqn.app/pricing"
        schema={schema}
      />
      <style>{TOKENS}</style>

      {/* ============== Header ============== */}
      <header className="sticky top-0 z-50 pt-4 pb-4 transition-all" style={{ background: "var(--canvas)" }}>
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg text-[#111]">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-[#111]" />
              <div className="w-2.5 h-2.5 rounded-sm opacity-60 bg-[#111]" />
            </div>
            LYQN
          </Link>

          <nav className="hidden lg:flex items-center gap-6" style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>
            <Link to="/pricing" className="hover:opacity-70 font-semibold">Pricing</Link>
            <Link to="/blog" className="hover:opacity-70">Blog</Link>
            <Link to="/docs" className="hover:opacity-70">Docs</Link>
          </nav>

          <div className="flex items-center gap-4">
            {isNewUser ? (
              <span className="text-xs font-semibold px-3.5 py-1.5 bg-[#e2eafc] text-[#006af2] border border-blue-200/80 rounded-full">
                Step 2 of 2: Choose Your Plan
              </span>
            ) : (
              <>
                <button onClick={() => navigate("/auth")} className="hidden sm:inline-block font-medium hover:opacity-70 text-sm text-[#111]">
                  Log in
                </button>
                <button onClick={() => navigate(userId ? "/dashboard" : "/auth")} className="cio-pill-primary text-sm">
                  {userId ? "Dashboard →" : "Start free trial"}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ============== Main Content ============== */}
      <main className="container mx-auto px-6 pt-12 pb-24">
        {/* Hero Section */}
        <div className="mb-16 cio-reveal">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#e2eafc] text-[#006af2] border border-blue-200/60 mb-6">
            <span>SUPPORT FOR THE SMALL SIDE</span>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#111111] leading-[1.02]">
                Big support. <br />
                <span className="text-[#006af2] italic font-normal font-sans">Small bill.</span>
              </h1>
            </div>

            <div className="lg:col-span-4 flex flex-col justify-between gap-6">
              <div className="flex items-start lg:justify-end">
                <div className="bg-white rounded-2xl p-5 border border-black/10 shadow-sm flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <span className="text-4xl font-extrabold text-[#006af2] leading-none">24</span>
                    <span className="text-xs font-bold text-gray-400 mt-0.5">/7</span>
                  </div>
                  <div className="h-10 w-[1px] bg-gray-200" />
                  <div className="text-xs font-medium text-gray-600 max-w-[140px] leading-snug">
                    Always online AI support for your users
                  </div>
                </div>
              </div>
              <p className="text-base sm:text-lg text-[#444444] leading-relaxed">
                An affordable, self-learning AI teammate for founders who need every customer answered.
              </p>
            </div>
          </div>
        </div>

        {/* Section 01 Header & Billing Switcher */}
        <div className="border-t border-b border-black/10 py-4 mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold uppercase tracking-wider text-[#666666] cio-reveal">
          <div className="flex items-center gap-2">
            <span className="text-[#006af2] font-bold">01</span>
            <span>/</span>
            <span className="text-[#111111]">CHOOSE YOUR LEVEL</span>
          </div>

          {/* Billing Switcher */}
          <div className="flex items-center gap-3">
            <span className={!isAnnual ? "text-[#111111] font-bold" : "text-gray-400"}>MONTHLY</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-12 h-6 rounded-full bg-[#111111] transition-colors p-1 focus:outline-none"
              aria-label="Toggle annual billing"
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  isAnnual ? "translate-x-6 bg-[#006af2]" : "translate-x-0"
                }`}
              />
            </button>
            <span className={isAnnual ? "text-[#111111] font-bold" : "text-gray-400"}>
              ANNUAL <span className="text-[#006af2] font-bold">(SAVE 20%)</span>
            </span>
            <span className="hidden lg:inline-block text-gray-300 ml-2">/</span>
            <span className="hidden lg:inline-block text-gray-400">NO ENTERPRISE THEATRE</span>
          </div>
        </div>

        {/* 3-Column Plan Cards */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-stretch mb-20 cio-reveal">
          {plans.map((plan, idx) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.name}
                className={`p-8 sm:p-10 rounded-3xl flex flex-col justify-between transition-all duration-300 ${
                  plan.isDark 
                    ? "bg-[#111111] text-white shadow-2xl scale-[1.02] relative overflow-hidden border border-black" 
                    : "bg-white text-[#111111] border border-black/10 shadow-sm hover:shadow-md"
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-[#abffae] text-[#111111] text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div>
                  {/* Plan Category Tag */}
                  <div className="text-xs font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                    <span className={plan.isDark ? "text-[#abffae]" : "text-[#006af2]"}>
                      0{idx + 1} / PLAN
                    </span>
                  </div>

                  {/* Title & Price */}
                  <div className="flex items-baseline justify-between gap-4 mb-3">
                    <h3 className={`text-3xl sm:text-4xl font-bold ${plan.isDark ? "text-white" : "text-[#111111]"}`}>
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline">
                      <span className={`text-4xl sm:text-5xl font-extrabold ${plan.isDark ? "text-white" : "text-[#111111]"}`}>
                        ${price}
                      </span>
                      <span className={`text-sm font-medium ml-1 ${plan.isDark ? "text-gray-400" : "text-gray-500"}`}>
                        /mo
                      </span>
                    </div>
                  </div>

                  <p className={`text-sm mb-8 leading-relaxed ${plan.isDark ? "text-gray-300" : "text-gray-600"}`}>
                    {plan.description}
                  </p>

                  {/* Feature List */}
                  <ul className="space-y-3.5 mb-10 border-t pt-6 border-black/10 dark:border-white/10">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          plan.isDark ? "bg-white/10 text-[#abffae]" : "bg-blue-50 text-[#006af2]"
                        }`}>
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span className={plan.isDark ? "text-gray-200" : "text-gray-700"}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card CTA */}
                <div>
                  {userId ? (
                    <PolarCheckout
                      planName={plan.name.toLowerCase()}
                      productId={plan.productId}
                      userId={userId}
                      className={plan.isDark ? "cio-pill-white w-full" : "cio-pill-primary w-full"}
                    >
                      <span>{plan.cta}</span>
                      <ArrowRight className="w-4 h-4" />
                    </PolarCheckout>
                  ) : (
                    <button
                      className={plan.isDark ? "cio-pill-white w-full" : "cio-pill-primary w-full"}
                      onClick={() => navigate("/auth")}
                    >
                      <span>{plan.cta}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Section 02 Header & Reassurance Grid */}
        <div className="mb-20 cio-reveal">
          <div className="border-t border-b border-black/10 py-4 mb-8 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#666666]">
            <div className="flex items-center gap-2">
              <span className="text-[#006af2] font-bold">02</span>
              <span>/</span>
              <span className="text-[#111111]">THE REASSURANCE</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-center mb-8">
            <div className="lg:col-span-4">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111] leading-tight">
                Start useful.<br />Stay in control.
              </h2>
            </div>

            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { num: "01", label: "2-week free trial" },
                { num: "02", label: "No card to start" },
                { num: "03", label: "No setup fees" },
                { num: "04", label: "No hidden charges" },
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-black/10 shadow-sm flex flex-col justify-between">
                  <span className="text-xs font-bold text-[#006af2] mb-2">{item.num}</span>
                  <span className="text-sm font-semibold text-[#111111] leading-snug">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 03 Header & Included Features */}
        <div className="mb-20 cio-reveal">
          <div className="border-t border-b border-black/10 py-4 mb-8 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#666666]">
            <div className="flex items-center gap-2">
              <span className="text-[#006af2] font-bold">03</span>
              <span>/</span>
              <span className="text-[#111111]">ENTERPRISE CORE</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-black/10 shadow-sm">
            <h3 className="text-2xl font-bold text-[#111111] mb-8">
              Included standard in every level
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8">
              {[
                "Self-Learning AI",
                "Conversation Memory",
                "24/7 Availability",
                "Multi-Language",
                "Mobile Responsive",
                "Real-Time Notifications",
                "Secure Storage",
                "GDPR Compliant",
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-[#006af2] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 04 Header & FAQ Section */}
        <div className="mb-20 cio-reveal">
          <div className="border-t border-b border-black/10 py-4 mb-8 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#666666]">
            <div className="flex items-center gap-2">
              <span className="text-[#006af2] font-bold">04</span>
              <span>/</span>
              <span className="text-[#111111]">FREQUENTLY ASKED QUESTIONS</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5">
              <h2 className="text-4xl font-bold text-[#111111] mb-4 leading-tight">
                Frequently asked questions.
              </h2>
              <p className="text-gray-600 text-base leading-relaxed">
                Everything you need to know about LYQN pricing and plans. Have more questions?{" "}
                <button 
                  onClick={() => navigate("/docs")}
                  className="font-semibold text-[#006af2] underline underline-offset-4 hover:text-black transition-colors"
                >
                  Read our docs
                </button>
              </p>
            </div>

            <div className="lg:col-span-7 border-t border-black/10">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border-b border-black/10">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full py-6 flex items-center justify-between text-left focus:outline-none group"
                  >
                    <span className="text-lg font-semibold text-gray-900 pr-6 group-hover:text-[#006af2] transition-colors">
                      {faq.q}
                    </span>
                    <span className="text-xl font-bold text-gray-400 group-hover:text-black shrink-0">
                      {openFaq === idx ? "−" : "+"}
                    </span>
                  </button>
                  {openFaq === idx && (
                    <div className="pb-6 pr-8 text-gray-600 leading-relaxed text-sm">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 05 Banner & Autopilot CTA */}
        <div className="cio-reveal">
          <div className="border-t border-b border-black/10 py-4 mb-8 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#666666]">
            <div className="flex items-center gap-2">
              <span className="text-[#006af2] font-bold">05</span>
              <span>/</span>
              <span className="text-[#111111]">PUT YOUR SUPPORT ON AUTOPILOT</span>
            </div>
          </div>

          <div className="bg-[#111111] text-white p-10 sm:p-14 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 shadow-2xl">
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
                Start free trial <span className="text-[#abffae]">↗</span>
              </h2>
              <p className="text-gray-300 text-base max-w-lg">
                No credit card required. Experience 14 days of full AI automation for your business.
              </p>
            </div>

            <button
              onClick={() => navigate("/auth")}
              className="cio-pill-white text-sm shrink-0"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
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

export default Pricing;
