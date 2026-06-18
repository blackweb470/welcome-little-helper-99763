import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Building2, ArrowRight, Star, MessageCircle } from "lucide-react";
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
      { threshold: 0.12 }
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
      price: 9.99,
      productId: "2e7f6e6a-cb2a-4167-bf5c-7eb9e55c6636",
      description: "Perfect for getting started",
      icon: Star,
      features: [
        "2 Weeks Free Trial",
        "1 Business",
        "Pre-Chat Forms",
        "Canned Responses",
        "Basic Analytics",
        "Email Notifications",
        "Chat History",
      ],
      cta: "Start Free Trial",
      popular: false,
      trial: true,
      gradient: "from-[#f9f9f9] to-[#f4f4f4]",
      textColor: "text-[#111]",
      btnClass: "bg-white border border-gray-200 text-gray-900 hover:bg-gray-50",
      cardClass: "bg-white border border-gray-100",
    },
    {
      name: "Pro",
      price: 29.99,
      productId: "65495367-3163-49af-9ae4-0c3e740d332a",
      description: "For professional teams",
      icon: Zap,
      features: [
        "Everything in Basic",
        "2 Businesses",
        "Live Agent Transfer",
        "Advanced Analytics",
        "Sentiment Analysis",
        "Proactive Chat Rules",
        "Priority Support",
      ],
      cta: "Get Started",
      popular: true,
      gradient: "from-[#1a1a1a] to-[#111111]",
      textColor: "text-white",
      btnClass: "bg-white text-[#111] hover:bg-gray-100",
      cardClass: "bg-[#111] border-none text-white shadow-2xl scale-[1.02]",
    },
    {
      name: "Business",
      price: 99.99,
      productId: "495da580-72e9-4fb9-a706-b098921df542",
      description: "For growing organizations",
      icon: Building2,
      features: [
        "Everything in Pro",
        "5 Businesses",
        "AI Learning & Documents",
        "Advanced Visitor Tracking",
        "Website Crawler",
        "Team Management",
        "Dedicated Account Manager",
      ],
      cta: "Get Started",
      popular: false,
      gradient: "from-[#f2efeb] to-[#eae5e0]",
      textColor: "text-[#111]",
      btnClass: "bg-white border border-gray-200 text-gray-900 hover:bg-gray-50",
      cardClass: "bg-[#f2efeb] border border-gray-200/50",
    },
  ];

  const faqs = [
    { q: "Can I change plans later?", a: "Yes — upgrade or downgrade anytime. Changes apply immediately with prorated charges." },
    { q: "What happens at the business limit?", a: "You'll need to upgrade to create more businesses. Existing ones keep working." },
    { q: "Is there a setup fee?", a: "No setup fees, no hidden charges. Just the monthly subscription." },
    { q: "Do you offer annual billing?", a: "Annual billing with 20% discount is coming soon. Contact us for business contracts." },
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
    <div className="min-h-screen font-sans" style={{ background: "#fcfcfc" }}>
      <style dangerouslySetInnerHTML={{__html: `
        .cio-reveal { opacity: 0; transform: translateY(20px); transition: opacity .8s ease, transform .8s ease; }
        .cio-reveal.is-visible { opacity: 1; transform: translateY(0); }
      `}} />
      <SEO 
        title="LYQN Pricing — Simple, Transparent Plans" 
        description="Choose the perfect LYQN plan for your business. Start with a 2-week free trial. Outperform competitors with our affordable AI chatbot and live agent integration."
        url="https://lyqn.app/pricing"
        schema={schema}
      />
      
      {/* Header */}
      <header className="sticky top-0 z-50 transition-all duration-300 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <button onClick={() => navigate("/")} className="text-2xl font-bold tracking-tighter text-[#111]">
              LYQN
            </button>
          </div>
          <div className="flex items-center gap-4">
            {isNewUser ? (
              <span className="text-sm font-semibold px-4 py-2 bg-gray-100 text-gray-700 rounded-full">
                Step 2 of 2: Choose Your Plan
              </span>
            ) : (
              <button 
                onClick={() => navigate(userId ? "/dashboard" : "/")}
                className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
              >
                {userId ? "Dashboard" : "Back home"}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-20 md:py-32">
        {/* Hero */}
        <div className="text-center mb-24 max-w-4xl mx-auto cio-reveal">
          <h1 className="font-bold tracking-tight text-[#111] mb-6" style={{ fontSize: "clamp(48px, 6vw, 72px)", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
            Simple pricing, <br/> powerful results.
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 leading-relaxed max-w-2xl mx-auto" style={{ letterSpacing: "-0.01em" }}>
            {isNewUser
              ? "Your 2-week free trial is ready. Select a plan below to activate your account."
              : "Start with a 2-week free trial on Basic and scale as you grow. No credit card required to start."}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto mb-32 relative z-10">
          {plans.map((plan, idx) => {
            const Icon = plan.icon;
            const isDark = plan.popular;
            
            return (
              <div
                key={plan.name}
                className={`cio-reveal rounded-[32px] p-10 flex flex-col transition-transform duration-500 hover:-translate-y-2 ${plan.cardClass}`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${isDark ? "bg-white/10 text-white" : "bg-white shadow-sm border border-gray-100 text-gray-900"}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    {plan.popular && (
                      <span className="bg-[#4ADE80] text-gray-900 text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                        Most Popular
                      </span>
                    )}
                    {plan.trial && !plan.popular && (
                      <span className="bg-blue-50 text-blue-600 text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                        2 Weeks Free
                      </span>
                    )}
                  </div>
                  <h3 className={`text-2xl font-bold mb-2 ${plan.textColor}`} style={{ letterSpacing: "-0.02em" }}>{plan.name}</h3>
                  <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>{plan.description}</p>
                </div>

                <div className="mb-10">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-5xl font-bold ${plan.textColor}`} style={{ letterSpacing: "-0.03em" }}>${plan.price}</span>
                    <span className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>/mo</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDark ? "text-[#4ADE80]" : "text-gray-900"}`} />
                      <span className={`font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>{feature}</span>
                    </li>
                  ))}
                </ul>

                {userId ? (
                  <PolarCheckout
                    planName={plan.name.toLowerCase()}
                    productId={plan.productId}
                    userId={userId}
                    className={`w-full rounded-full py-4 font-semibold flex items-center justify-center transition-all ${plan.btnClass}`}
                  >
                    {plan.cta}
                  </PolarCheckout>
                ) : (
                  <button
                    className={`w-full rounded-full py-4 font-semibold flex items-center justify-center transition-all ${plan.btnClass}`}
                    onClick={() => navigate("/auth")}
                  >
                    {plan.cta}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* All Plans Include */}
        <div className="max-w-5xl mx-auto mb-32 cio-reveal">
          <div className="bg-[#f2efeb] rounded-[32px] p-10 md:p-16 flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/3">
              <h2 className="text-3xl font-bold text-gray-900 mb-4" style={{ letterSpacing: "-0.02em" }}>Included in every plan</h2>
              <p className="text-gray-600 font-medium">Enterprise-grade features come standard, no matter what tier you choose.</p>
            </div>
            <div className="md:w-2/3 grid grid-cols-2 gap-y-6 gap-x-8">
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
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                    <Check className="w-4 h-4 text-gray-900" />
                  </div>
                  <span className="font-semibold text-gray-800">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-6xl mx-auto mb-32">
          <div className="grid lg:grid-cols-12 gap-12 md:gap-16">
            <div className="lg:col-span-5 cio-reveal">
              <h2 className="font-bold mb-6" style={{ fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1.05, letterSpacing: "-0.04em", color: "#111" }}>
                Frequently asked questions.
              </h2>
              <p style={{ color: "#555", fontSize: 18, lineHeight: 1.5 }}>
                Everything you need to know about LYQN's pricing and plans. Can't find the answer you're looking for? <span className="font-semibold text-black cursor-pointer underline underline-offset-4">Chat with us</span>.
              </p>
            </div>
            
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

        {/* CTA */}
        <div className="max-w-5xl mx-auto cio-reveal">
          <div className="bg-[#111] rounded-[40px] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6" style={{ letterSpacing: "-0.03em" }}>Ready to get started?</h2>
              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                Join thousands of businesses using self-learning AI to transform their customer support.
              </p>
              <button 
                onClick={() => navigate("/auth")}
                className="bg-white text-[#111] font-bold text-lg px-8 py-4 rounded-full hover:scale-105 transition-transform"
              >
                Start your free trial
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-8 bg-white">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-bold tracking-tighter text-xl text-gray-900">LYQN</div>
          <div className="text-sm font-medium text-gray-500">
            © 2026 LYQN AI. Payments processed securely by Polar.
          </div>
        </div>
      </footer>
      <LyqnWidgetEmbed />
    </div>
  );
};

export default Pricing;
