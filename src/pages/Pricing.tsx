import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, Zap, Building2, ArrowRight } from "lucide-react";
import { PolarCheckout } from "@/components/PolarCheckout";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

const Pricing = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

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
      icon: Sparkles,
      features: [
        "1 Month Free Trial",
        "3 Businesses",
        "Pre-Chat Forms",
        "Canned Responses",
        "Basic Analytics",
        "Email Notifications",
        "Chat History",
      ],
      cta: "Start Free Trial",
      popular: false,
      trial: true,
      gradient: "from-muted/50 to-muted/30",
      borderColor: "border-border",
    },
    {
      name: "Pro",
      price: 29.99,
      productId: "65495367-3163-49af-9ae4-0c3e740d332a",
      description: "For professional teams",
      icon: Zap,
      features: [
        "Everything in Basic",
        "10 Businesses",
        "Live Agent Transfer",
        "Advanced Analytics",
        "Sentiment Analysis",
        "Proactive Chat Rules",
        "Voice Chat",
        "Priority Support",
      ],
      cta: "Get Started",
      popular: true,
      gradient: "from-primary/10 to-primary/5",
      borderColor: "border-primary",
    },
    {
      name: "Business",
      price: 99.99,
      productId: "495da580-72e9-4fb9-a706-b098921df542",
      description: "For large organizations",
      icon: Building2,
      features: [
        "Everything in Pro",
        "Unlimited Businesses",
        "AI Learning & Documents",
        "Advanced Visitor Tracking",
        "Custom Integrations",
        "API Access",
        "Dedicated Account Manager",
        "Custom Training",
      ],
      cta: "Get Started",
      popular: false,
      gradient: "from-muted/50 to-muted/30",
      borderColor: "border-border",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Sparkles className="w-6 h-6 text-foreground" />
              <span className="text-xl font-bold">LYQN</span>
            </button>
            {isNewUser ? (
              <Badge variant="secondary" className="text-sm px-4 py-2">
                Step 2 of 2: Choose Your Plan
              </Badge>
            ) : (
              <Button variant="ghost" onClick={() => navigate(userId ? "/dashboard" : "/")}>
                {userId ? "Dashboard" : "Back"}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-20">
        {/* Hero */}
        <div className="text-center mb-16 space-y-5 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            Simple pricing,{" "}
            <span className="bg-gradient-to-r from-foreground/80 to-foreground bg-clip-text">
              powerful results
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            {isNewUser
              ? "Add your payment card to start your free trial. No charges until the trial ends."
              : "Start free on Basic and scale as you grow. Cancel anytime."}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border-2 ${plan.borderColor} bg-gradient-to-b ${plan.gradient} p-7 flex flex-col transition-all duration-300 hover:shadow-lg ${
                  plan.popular ? "md:-translate-y-2 shadow-md" : ""
                }`}
              >
                {plan.trial && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                      1 Month Free
                    </span>
                  </div>
                )}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-foreground text-background text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-2 rounded-lg ${plan.popular ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground text-sm">/mo</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.popular ? "text-foreground" : "text-muted-foreground"}`} />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {userId ? (
                  <PolarCheckout
                    planName={plan.name.toLowerCase()}
                    productId={plan.productId}
                    userId={userId}
                    className={`w-full ${plan.popular ? "" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </PolarCheckout>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "secondary"}
                    onClick={() => navigate("/auth")}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* All Plans Include */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-2xl font-bold text-center mb-8">Included in every plan</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              "Self-Learning AI",
              "Conversation Memory",
              "24/7 Availability",
              "Multi-Language",
              "Mobile Responsive",
              "Real-Time Notifications",
              "Secure Storage",
              "GDPR Compliant",
              "Regular Updates",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 py-2">
                <div className="w-1.5 h-1.5 rounded-full bg-foreground flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-20">
          <h2 className="text-2xl font-bold text-center mb-8">Questions?</h2>
          <div className="space-y-4">
            {[
              { q: "Can I change plans later?", a: "Yes — upgrade or downgrade anytime. Changes apply immediately with prorated charges." },
              { q: "What happens at the business limit?", a: "You'll need to upgrade to create more businesses. Existing ones keep working." },
              { q: "Is there a setup fee?", a: "No setup fees, no hidden charges. Just the monthly subscription." },
              { q: "Do you offer annual billing?", a: "Annual billing with 20% discount is coming soon. Contact us for enterprise contracts." },
            ].map((faq, i) => (
              <div key={i} className="border border-border rounded-xl p-5">
                <h3 className="font-medium mb-1.5">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-3xl mx-auto text-center py-12 px-6 rounded-2xl border border-border bg-gradient-to-b from-muted/50 to-background">
          <h2 className="text-3xl font-bold mb-3">Ready to get started?</h2>
          <p className="text-muted-foreground mb-6">
            Join businesses using self-learning AI to transform customer support.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")}>
            Start Free Trial
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </main>

      <footer className="border-t py-6 mt-16">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          © 2025 LYQN AI. All rights reserved. Payments processed securely by Polar.
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
