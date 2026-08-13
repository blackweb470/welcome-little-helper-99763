import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, ArrowUpRight, HelpCircle, ShieldCheck, Zap, Star, Building2, Sparkles } from "lucide-react";
import { PolarCheckout } from "@/components/PolarCheckout";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { LyqnWidgetEmbed } from "@/components/LyqnWidgetEmbed";
import { SEO } from "@/components/SEO";

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
      description: "FOR ONE BUSINESS",
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
      cta: "START FREE TRIAL",
      popular: false,
      isDark: false,
    },
    {
      name: "Pro",
      monthlyPrice: 10,
      annualPrice: 8,
      productId: "65495367-3163-49af-9ae4-0c3e740d332a",
      description: "FOR GROWING TEAMS",
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
      cta: "CHOOSE PRO PLAN",
      popular: true,
      isDark: true,
    },
    {
      name: "Business",
      monthlyPrice: 20,
      annualPrice: 16,
      productId: "495da580-72e9-4fb9-a706-b098921df542",
      description: "FOR SERIOUS SCALE",
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
      cta: "CHOOSE BUSINESS",
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
    <div className="min-h-screen text-[#111111] antialiased selection:bg-blue-600 selection:text-white" style={{ background: "#faf9f5" }}>
      <style dangerouslySetInnerHTML={{__html: `
        .cio-reveal { opacity: 0; transform: translateY(16px); transition: opacity .7s cubic-bezier(0.16, 1, 0.3, 1), transform .7s cubic-bezier(0.16, 1, 0.3, 1); }
        .cio-reveal.is-visible { opacity: 1; transform: translateY(0); }
      `}} />
      <SEO 
        title="LYQN Pricing: Simple, Transparent Plans" 
        description="Choose the perfect LYQN plan for your business. Start with a 2-week free trial. Outperform competitors with our affordable AI chatbot and live agent integration."
        url="https://lyqn.app/pricing"
        schema={schema}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#faf9f5]/90 backdrop-blur-md border-b border-gray-300/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate("/")} 
              className="group text-2xl font-bold tracking-tight text-[#111111] flex items-center gap-1.5 focus:outline-none"
            >
              <span className="font-extrabold tracking-tighter">LYQN</span>
              <span className="inline-flex gap-1 items-center ml-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 group-hover:scale-125 transition-transform"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 group-hover:scale-125 transition-transform"></span>
              </span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-gray-500">
            <span>CUSTOMER SUPPORT</span>
            <span className="text-gray-300">/</span>
            <span className="text-blue-600 font-semibold">01–24</span>
            <span className="text-gray-300">/</span>
            <span>ALWAYS ON</span>
          </div>

          <div className="flex items-center gap-4">
            {isNewUser ? (
              <span className="text-xs font-mono font-semibold px-3.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-full">
                STEP 2 OF 2: CHOOSE YOUR PLAN
              </span>
            ) : (
              <button 
                onClick={() => navigate(userId ? "/dashboard" : "/")}
                className="text-xs font-mono font-semibold uppercase tracking-wider text-gray-600 hover:text-black transition-colors"
              >
                {userId ? "DASHBOARD →" : "BACK HOME →"}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-12 pb-24">
        {/* Hero Section */}
        <div className="mb-16 cio-reveal">
          <div className="font-mono text-xs font-semibold uppercase tracking-widest text-blue-600 mb-4 flex items-center gap-2">
            <span>SUPPORT FOR THE SMALL SIDE</span>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-[#111111] leading-[0.95] font-display">
                Big support.<br />
                <span className="text-blue-600">Small bill.</span>
              </h1>
            </div>

            <div className="lg:col-span-4 flex flex-col justify-between gap-6">
              <div className="flex items-start justify-end gap-4">
                <div className="border border-gray-900/90 rounded-none px-6 py-4 bg-white shadow-sm flex flex-col items-center min-w-[120px]">
                  <span className="text-4xl font-extrabold text-rose-500 leading-none">24</span>
                  <span className="text-sm font-mono font-bold text-gray-400 mt-1">/7</span>
                </div>
              </div>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed font-normal">
                An affordable, self-learning AI teammate for founders who need every customer answered.
              </p>
            </div>
          </div>
        </div>

        {/* Section 01 Divider */}
        <div className="border-t border-b border-gray-300/80 py-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs text-gray-500 uppercase tracking-widest cio-reveal">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-bold">01</span>
            <span>/</span>
            <span className="text-gray-900 font-semibold">CHOOSE YOUR LEVEL</span>
          </div>

          {/* Billing Switcher */}
          <div className="flex items-center gap-3">
            <span className={!isAnnual ? "text-gray-900 font-bold" : "text-gray-400"}>MONTHLY</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-12 h-6 rounded-full bg-gray-900 transition-colors p-1 focus:outline-none"
              aria-label="Toggle annual billing"
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  isAnnual ? "translate-x-6 bg-blue-400" : "translate-x-0"
                }`}
              />
            </button>
            <span className={isAnnual ? "text-gray-900 font-bold" : "text-gray-400"}>
              ANNUAL <span className="text-blue-600 font-bold">(SAVE 20%)</span>
            </span>
            <span className="hidden lg:inline-block text-gray-300 ml-2">/</span>
            <span className="hidden lg:inline-block text-gray-400">NO ENTERPRISE THEATRE</span>
          </div>
        </div>

        {/* 3-Column Plan Grid */}
        <div className="grid lg:grid-cols-3 border border-gray-300/90 bg-white rounded-xl overflow-hidden shadow-sm mb-16 cio-reveal">
          {plans.map((plan, idx) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.name}
                className={`p-8 sm:p-10 flex flex-col justify-between transition-all duration-300 ${
                  plan.isDark 
                    ? "bg-[#111111] text-white border-y lg:border-y-0 lg:border-x border-gray-800 shadow-2xl relative" 
                    : idx === 0 
                      ? "bg-white text-gray-900" 
                      : "bg-[#faf9f5]/50 text-gray-900 border-t lg:border-t-0 lg:border-l border-gray-300/80"
                }`}
              >
                {plan.isDark && (
                  <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-600 via-rose-500 to-blue-600" />
                )}

                <div>
                  {/* Plan Top Meta */}
                  <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest pb-6 mb-6 border-b border-gray-200/80 dark:border-gray-800">
                    <span className={plan.isDark ? "text-blue-400 font-bold" : "text-blue-600 font-bold"}>
                      0{idx + 1} / PLAN
                    </span>
                    <span className={plan.isDark ? "text-gray-400 font-semibold" : "text-gray-500 font-semibold"}>
                      {plan.popular ? "POPULAR" : isAnnual ? "ANNUAL" : "MONTHLY"}
                    </span>
                  </div>

                  {/* Title & Price */}
                  <div className="flex items-baseline justify-between gap-4 mb-4">
                    <h3 className={`text-4xl font-bold tracking-tight ${plan.isDark ? "text-white" : "text-[#111111]"}`}>
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline">
                      <span className={`text-4xl sm:text-5xl font-extrabold tracking-tight ${plan.isDark ? "text-white" : "text-[#111111]"}`}>
                        ${price}
                      </span>
                      <span className={`text-sm font-mono ml-1 ${plan.isDark ? "text-gray-400" : "text-gray-500"}`}>
                        /mo
                      </span>
                    </div>
                  </div>

                  <p className={`font-mono text-xs uppercase tracking-wider mb-8 font-semibold ${plan.isDark ? "text-blue-400" : "text-gray-500"}`}>
                    {plan.description}
                  </p>

                  {/* Feature List */}
                  <ul className="space-y-3.5 mb-10">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start text-sm leading-tight">
                        <span className={`font-mono text-xs font-semibold mr-3 select-none ${plan.isDark ? "text-blue-400" : "text-blue-600"}`}>
                          {feature.num}
                        </span>
                        <span className={plan.isDark ? "text-gray-200" : "text-gray-800"}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card CTA */}
                <div className="pt-6 border-t border-gray-200/80 dark:border-gray-800">
                  {userId ? (
                    <PolarCheckout
                      planName={plan.name.toLowerCase()}
                      productId={plan.productId}
                      userId={userId}
                      className={`w-full rounded-none py-6 font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-between transition-all group ${
                        plan.isDark
                          ? "bg-white text-black hover:bg-gray-100"
                          : "bg-[#111111] text-white hover:bg-gray-800"
                      }`}
                    >
                      <span>{plan.cta}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </PolarCheckout>
                  ) : (
                    <button
                      className={`w-full rounded-none py-4 px-6 font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-between transition-all group ${
                        plan.isDark
                          ? "bg-white text-black hover:bg-gray-100"
                          : "bg-[#111111] text-white hover:bg-gray-800"
                      }`}
                      onClick={() => navigate("/auth")}
                    >
                      <span>{plan.cta}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Section 02 Header & Reassurance Grid */}
        <div className="mb-20 cio-reveal">
          <div className="border-t border-b border-gray-300/80 py-4 mb-8 flex items-center justify-between font-mono text-xs text-gray-500 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-bold">02</span>
              <span>/</span>
              <span className="text-gray-900 font-semibold">THE REASSURANCE</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start mb-8">
            <div className="lg:col-span-5">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111] leading-tight font-display">
                Start useful.<br />Stay in control.
              </h2>
            </div>

            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-6 border-t lg:border-t-0 lg:border-l border-gray-300/80 pt-6 lg:pt-0 lg:pl-8">
              {[
                { num: "01", label: "2-week free trial" },
                { num: "02", label: "No card to start" },
                { num: "03", label: "No setup fees" },
                { num: "04", label: "No hidden charges" },
              ].map((item, idx) => (
                <div key={idx} className="border-l-2 border-blue-600 pl-3">
                  <span className="font-mono text-xs font-bold text-gray-400 block mb-1">{item.num}</span>
                  <span className="text-sm font-semibold text-gray-900 leading-snug">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 03 Header & Included in Every Plan Grid */}
        <div className="mb-20 cio-reveal">
          <div className="border-t border-b border-gray-300/80 py-4 mb-8 flex items-center justify-between font-mono text-xs text-gray-500 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-bold">03</span>
              <span>/</span>
              <span className="text-gray-900 font-semibold">ENTERPRISE CORE</span>
            </div>
          </div>

          <div className="bg-white border border-gray-300/80 p-8 sm:p-12 shadow-sm">
            <h3 className="text-2xl font-bold text-[#111111] mb-8 font-display">
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
                  <span className="font-mono text-xs font-bold text-blue-600">✓</span>
                  <span className="text-sm font-semibold text-gray-800">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 04 Header & FAQ Section */}
        <div className="mb-20 cio-reveal">
          <div className="border-t border-b border-gray-300/80 py-4 mb-8 flex items-center justify-between font-mono text-xs text-gray-500 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-bold">04</span>
              <span>/</span>
              <span className="text-gray-900 font-semibold">FREQUENTLY ASKED QUESTIONS</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5">
              <h2 className="text-4xl font-bold text-[#111111] mb-4 font-display leading-tight">
                Frequently asked questions.
              </h2>
              <p className="text-gray-600 text-base leading-relaxed">
                Everything you need to know about LYQN pricing and plans. Have more questions?{" "}
                <button 
                  onClick={() => navigate("/docs")}
                  className="font-semibold text-blue-600 underline underline-offset-4 hover:text-black transition-colors"
                >
                  Read our docs
                </button>
              </p>
            </div>

            <div className="lg:col-span-7 border-t border-gray-300/80">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border-b border-gray-300/80">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full py-6 flex items-center justify-between text-left focus:outline-none group"
                  >
                    <span className="text-lg font-medium text-gray-900 pr-6 group-hover:text-blue-600 transition-colors">
                      {faq.q}
                    </span>
                    <span className="font-mono text-lg font-bold text-gray-400 group-hover:text-black shrink-0">
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
          <div className="border-t border-b border-gray-300/80 py-4 mb-8 flex items-center justify-between font-mono text-xs text-gray-500 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-bold">05</span>
              <span>/</span>
              <span className="text-gray-900 font-semibold">PUT YOUR SUPPORT ON AUTOPILOT</span>
            </div>
          </div>

          <div className="bg-[#111111] text-white p-10 sm:p-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 shadow-xl">
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3 font-display">
                Start free trial <span className="text-rose-500">↗</span>
              </h2>
              <p className="text-gray-400 text-base max-w-lg">
                No credit card required. Experience 14 days of full AI automation for your business.
              </p>
            </div>

            <button
              onClick={() => navigate("/auth")}
              className="px-8 py-5 bg-white text-black font-mono text-xs uppercase tracking-widest font-bold hover:bg-gray-100 transition-colors shrink-0 flex items-center gap-2 group"
            >
              <span>GET STARTED NOW</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-300/80 py-10 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-1.5 text-xl font-extrabold tracking-tighter text-[#111111]">
            <span>LYQN</span>
            <span className="inline-flex gap-1 items-center ml-0.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            </span>
          </div>

          <div className="font-mono text-xs text-gray-500 text-center">
            © 2026 LYQN AI. PAYMENTS PROCESSED SECURELY VIA POLAR.
          </div>

          <div className="font-mono text-xs font-bold text-gray-900 tracking-widest">
            LYQN.APP
          </div>
        </div>
      </footer>

      <LyqnWidgetEmbed />
    </div>
  );
};

export default Pricing;
