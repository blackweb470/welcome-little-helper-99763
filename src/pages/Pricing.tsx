import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, ArrowUpRight, HelpCircle, ShieldCheck, Zap, Star, Building2, Sparkles, Mail, Wallet, PlusCircle, Calculator, CheckCircle2, Clock, Shield } from "lucide-react";
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
    color: inherit;
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
  .cio-pill-electric {
    background: var(--electric);
    color: var(--white);
    border: 1px solid var(--electric);
    border-radius: 9999px;
    padding: 14px 28px;
    font-weight: 700;
    font-size: 15px;
    transition: transform .25s ease, box-shadow .25s ease, background .2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
  }
  .cio-pill-electric:hover {
    background: #0056cc;
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(0,106,242,0.3);
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
  .calc-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 8px;
    border-radius: 9999px;
    background: #e2e8f0;
    outline: none;
  }
  .calc-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #006af2;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,106,242,0.4);
    transition: transform 0.15s ease;
  }
  .calc-slider::-webkit-slider-thumb:hover {
    transform: scale(1.15);
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
  const [calcAmount, setCalcAmount] = useState<number>(25);
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

  const defaultProductId = import.meta.env.VITE_POLAR_PRODUCT_ID || "8c68395a-7403-4c73-8f53-456737a22fe4";

  const depositOptions = [
    {
      name: "Starter Deposit",
      price: 5,
      productId: defaultProductId,
      description: "Ideal for solo founders testing AI customer responses",
      icon: Star,
      features: [
        { num: "01", text: "$2.00 FREE starter bonus on signup (~400 msgs)" },
        { num: "02", text: "Pay-As-You-Go ($0.005 / AI message response)" },
        { num: "03", text: "~1,000 AI message responses included" },
        { num: "04", text: "Full AI Learning & Document Training" },
        { num: "05", text: "Website Deep Crawler & Knowledge Base" },
        { num: "06", text: "Live Agent Handoff & Proactive Chat Rules" },
        { num: "07", text: "Funds NEVER expire" },
      ],
      cta: "Deposit $5 Credits",
      popular: false,
      isDark: false,
    },
    {
      name: "Growth Deposit",
      price: 10,
      productId: defaultProductId,
      description: "Most popular for growing e-commerce & SaaS products",
      icon: Zap,
      features: [
        { num: "01", text: "Everything in Starter" },
        { num: "02", text: "Pay-As-You-Go ($0.005 / AI message response)" },
        { num: "03", text: "~2,000 AI message responses included" },
        { num: "04", text: "Auto-Topup Low Balance Option" },
        { num: "05", text: "Sentiment Analysis & Visitor Tracking" },
        { num: "06", text: "WhatsApp & Custom Channel Integrations" },
        { num: "07", text: "Funds NEVER expire" },
      ],
      cta: "Deposit $10 Credits",
      popular: true,
      isDark: true,
    },
    {
      name: "Scale Deposit",
      price: 25,
      productId: defaultProductId,
      description: "For high-volume customer support & multi-brand businesses",
      icon: Building2,
      features: [
        { num: "01", text: "Everything in Growth" },
        { num: "02", text: "Pay-As-You-Go ($0.005 / AI message response)" },
        { num: "03", text: "~5,000 AI message responses included" },
        { num: "04", text: "Unlimited Document & Website Crawler" },
        { num: "05", text: "Custom API & Webhook Access" },
        { num: "06", text: "Team Member Collaboration" },
        { num: "07", text: "Funds NEVER expire" },
      ],
      cta: "Deposit $25 Credits",
      popular: false,
      isDark: false,
    },
  ];

  const faqs = [
    { q: "How does the Pay-As-You-Go Credit Wallet work?", a: "Unlike rigid monthly subscriptions that charge you regardless of usage, LYQN uses a transparent credit wallet. You deposit funds (e.g., $5, $10, $25, or custom amounts) and only pay $0.005 for each AI assistant message response. Your deposited credits NEVER expire!" },
    { q: "Do I get free starter credits when I sign up?", a: "Yes! Every new user automatically receives $2.00 in free starter credit upon registration (~400 AI message responses). No credit card is required to sign up and start testing." },
    { q: "What happens when my credit balance runs low?", a: "When your wallet balance falls below $2.00, your dashboard notifies you. You can deposit additional credits anytime or enable auto-topup to ensure uninterrupted AI support." },
    { q: "Are all AI features unlocked on Pay-As-You-Go?", a: "100% YES! All users get full access to AI Learning, Document Training, Website Deep Crawler, Live Agent Handoff, Proactive Chat Rules, and Analytics. We do not gate features behind expensive monthly tiers." },
    { q: "Do my wallet credits ever expire?", a: "Never! Your deposited credits remain in your wallet indefinitely until used for AI customer responses." },
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

  const calculatedResponses = Math.round(calcAmount / 0.005);

  return (
    <div className="cio-pricing min-h-screen">
      <SEO
        title="LYQN Pay-As-You-Go Pricing: $0.005/Msg • No Monthly Subscriptions"
        description="Transparent Pay-As-You-Go credit wallet. Only pay $0.005 per AI message response. Get $2.00 free starter credit on signup. Funds never expire."
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
            <Link to="/pricing" className="hover:opacity-70 font-semibold text-[#006af2]">Pricing</Link>
            <Link to="/blog" className="hover:opacity-70">Blog</Link>
            <Link to="/docs" className="hover:opacity-70">Docs</Link>
          </nav>

          <div className="flex items-center gap-4">
            {isNewUser ? (
              <span className="text-xs font-semibold px-3.5 py-1.5 bg-[#e2eafc] text-[#006af2] border border-blue-200/80 rounded-full">
                Step 2 of 2: Claim Your $2.00 Free Bonus
              </span>
            ) : (
              <>
                <button onClick={() => navigate("/auth")} className="hidden sm:inline-block font-medium hover:opacity-70 text-sm text-[#111]">
                  Log in
                </button>
                <button onClick={() => navigate(userId ? "/dashboard?tab=billing" : "/auth")} className="cio-pill-primary text-sm">
                  {userId ? "Go to Wallet →" : "Get $2.00 Free Credit"}
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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-[#e2eafc] text-[#006af2] border border-blue-200/80 mb-6 uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" />
            <span>100% PAY-AS-YOU-GO • NO SUBSCRIPTION LOCK-IN</span>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#111111] leading-[1.02]">
                Pay only for what <br />
                you use. <span className="text-[#006af2] italic font-normal font-sans">$0.005 / msg.</span>
              </h1>
            </div>

            <div className="lg:col-span-4 flex flex-col justify-between gap-6">
              <div className="flex items-start lg:justify-end">
                <div className="bg-white rounded-2xl p-5 border border-black/10 shadow-sm flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-extrabold text-[#006af2] leading-none">$2.00</span>
                    <span className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-wider">FREE BONUS</span>
                  </div>
                  <div className="h-10 w-[1px] bg-gray-200" />
                  <div className="text-xs font-medium text-gray-600 max-w-[150px] leading-snug">
                    Get ~400 free AI message responses instantly on sign up.
                  </div>
                </div>
              </div>
              <p className="text-base sm:text-lg text-[#444444] leading-relaxed">
                Deposit funds starting at $5 into your credit wallet. No monthly subscription commitments, no feature gating, and funds <strong>never expire</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Section 01 Header */}
        <div className="border-t border-b border-black/10 py-4 mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold uppercase tracking-wider text-[#666666] cio-reveal">
          <div className="flex items-center gap-2">
            <span className="text-[#006af2] font-bold">01</span>
            <span>/</span>
            <span className="text-[#111111]">SELECT DEPOSIT AMOUNT</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-gray-500 uppercase tracking-widest">
            <span className="text-[#006af2] font-bold">$0.005 / RESPONSE</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-600 font-bold">NO EXPIRATION</span>
          </div>
        </div>

        {/* 3-Column Deposit Cards */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-stretch mb-16 cio-reveal">
          {depositOptions.map((plan, idx) => {
            return (
              <div
                key={plan.name}
                className={`p-8 sm:p-10 rounded-3xl flex flex-col justify-between transition-all duration-300 ${plan.isDark
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
                  {/* Option Category Tag */}
                  <div className="text-xs font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                    <span className={plan.isDark ? "text-[#abffae]" : "text-[#006af2]"}>
                      0{idx + 1} / DEPOSIT OPTION
                    </span>
                  </div>

                  {/* Title & Price */}
                  <div className="flex items-baseline justify-between gap-4 mb-3">
                    <h3 className={`text-3xl sm:text-4xl font-bold ${plan.isDark ? "text-white" : "text-[#111111]"}`}>
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline">
                      <span className={`text-4xl sm:text-5xl font-extrabold ${plan.isDark ? "text-white" : "text-[#111111]"}`}>
                        ${plan.price}
                      </span>
                      <span className={`text-xs font-semibold ml-1 ${plan.isDark ? "text-gray-400" : "text-gray-500"}`}>
                        one-time
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
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.isDark ? "bg-white/10 text-[#abffae]" : "bg-blue-50 text-[#006af2]"
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
                  <button
                    className={plan.isDark ? "cio-pill-white w-full" : "cio-pill-primary w-full"}
                    onClick={() => navigate(userId ? "/dashboard?tab=billing" : "/auth")}
                  >
                    <span>{plan.cta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Section 02 Interactive Calculator Widget */}
        <div className="mb-20 cio-reveal">
          <div className="border-t border-b border-black/10 py-4 mb-8 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#666666]">
            <div className="flex items-center gap-2">
              <span className="text-[#006af2] font-bold">02</span>
              <span>/</span>
              <span className="text-[#111111]">RESPONSE ESTIMATOR CALCULATOR</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-black/10 shadow-lg">
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#006af2] flex items-center justify-center font-bold">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#111111]">Estimate Your AI Capacity</h3>
                    <p className="text-xs text-gray-500">Drag the slider to see how many AI customer responses your deposit buys</p>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-sm text-gray-600">Selected Deposit Amount:</span>
                    <span className="text-3xl text-[#006af2] font-extrabold">${calcAmount} USD</span>
                  </div>

                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Number(e.target.value))}
                    className="calc-slider"
                  />

                  <div className="flex justify-between text-xs font-semibold text-gray-400">
                    <span>$5 (Min)</span>
                    <span>$50</span>
                    <span>$100</span>
                    <span>$200 (Max)</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-[#111111] text-white p-8 rounded-2xl flex flex-col justify-between space-y-6 shadow-xl">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#abffae] block mb-1">Estimated Capacity</span>
                  <div className="text-4xl sm:text-5xl font-extrabold text-white">
                    ~{calculatedResponses.toLocaleString()}
                  </div>
                  <span className="text-xs text-gray-400 font-medium block mt-1">AI Customer Message Responses</span>
                </div>

                <div className="border-t border-white/10 pt-4 space-y-2 text-xs text-gray-300">
                  <div className="flex justify-between">
                    <span>Rate Per Response:</span>
                    <span className="font-bold text-white">$0.005</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expiration Date:</span>
                    <span className="font-bold text-[#abffae]">Never Expire</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(userId ? "/dashboard?tab=billing" : "/auth")}
                  className="cio-pill-white text-sm w-full font-bold"
                >
                  <span>Deposit ${calcAmount} Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 03 Reassurance Grid */}
        <div className="mb-20 cio-reveal">
          <div className="border-t border-b border-black/10 py-4 mb-8 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#666666]">
            <div className="flex items-center gap-2">
              <span className="text-[#006af2] font-bold">03</span>
              <span>/</span>
              <span className="text-[#111111]">THE REASSURANCE</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-center mb-8">
            <div className="lg:col-span-4">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111] leading-tight">
                No surprises.<br />Complete control.
              </h2>
            </div>

            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { num: "01", label: "$2.00 Free Credit on Signup" },
                { num: "02", label: "No Monthly Subscription Lock" },
                { num: "03", label: "Funds Never Expire" },
                { num: "04", label: "All AI Features Included" },
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-black/10 shadow-sm flex flex-col justify-between">
                  <span className="text-xs font-bold text-[#006af2] mb-2">{item.num}</span>
                  <span className="text-sm font-semibold text-[#111111] leading-snug">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 04 Included Core Features */}
        <div className="mb-20 cio-reveal">
          <div className="border-t border-b border-black/10 py-4 mb-8 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#666666]">
            <div className="flex items-center gap-2">
              <span className="text-[#006af2] font-bold">04</span>
              <span>/</span>
              <span className="text-[#111111]">UNLOCKED FOR ALL USERS</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-black/10 shadow-sm">
            <h3 className="text-2xl font-bold text-[#111111] mb-8">
              All enterprise features included in every wallet deposit
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8">
              {[
                "Self-Learning AI",
                "Website Deep Crawler",
                "PDF & Document Uploads",
                "Live Agent Handoff",
                "Proactive Chat Rules",
                "Multi-Language Support",
                "Real-Time Email Alerts",
                "WhatsApp Integration",
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

        {/* Section 05 FAQ Section */}
        <div className="mb-20 cio-reveal">
          <div className="border-t border-b border-black/10 py-4 mb-8 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#666666]">
            <div className="flex items-center gap-2">
              <span className="text-[#006af2] font-bold">05</span>
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
                Everything you need to know about LYQN Pay-As-You-Go credit wallet pricing. Have more questions?{" "}
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

        {/* Section 06 Banner & Starter Bonus CTA */}
        <div className="cio-reveal">
          <div className="border-t border-b border-black/10 py-4 mb-8 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#666666]">
            <div className="flex items-center gap-2">
              <span className="text-[#006af2] font-bold">06</span>
              <span>/</span>
              <span className="text-[#111111]">CLAIM YOUR $2.00 FREE STARTER BONUS</span>
            </div>
          </div>

          <div className="bg-[#111111] text-white p-10 sm:p-14 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 shadow-2xl">
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3 text-white">
                Claim $2.00 Free Credit <span className="text-[#abffae]">↗</span>
              </h2>
              <p className="text-gray-300 text-base max-w-lg">
                No credit card required. Get ~400 free AI message responses instantly upon signup to train your AI assistant.
              </p>
            </div>

            <button
              onClick={() => navigate("/auth")}
              className="cio-pill-white text-sm shrink-0 font-bold"
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
              <p style={{ fontSize: 14, color: "var(--slate)", lineHeight: 1.55, maxWidth: 320 }} className="mb-3">
                Pay-As-You-Go AI customer support platform. Outperform traditional live chat with self-learning AI and instant handoffs.
              </p>
              <a href="mailto:hello@lyqn.app" className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80" style={{ color: "var(--ink)" }}>
                <Mail className="w-4 h-4" />
                hello@lyqn.app
              </a>
            </div>
            {[
              { title: "Product", links: [["Pricing", "/pricing"], ["Documentation", "/docs"]] },
              { title: "Company", links: [["About", "/about"], ["Blog", "/blog"], ["Contact Us", "mailto:hello@lyqn.app"]] },
              { title: "Legal", links: [["Privacy", "/privacy"], ["Terms", "/terms"], ["Data Deletion", "/delete"]] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-semibold mb-4" style={{ fontSize: 14, color: "var(--ink)" }}>{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      {href.startsWith("mailto:") ? (
                        <a href={href} className="cio-link" style={{ fontSize: 14 }}>{label}</a>
                      ) : (
                        <Link to={href} className="cio-link" style={{ fontSize: 14 }}>{label}</Link>
                      )}
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
