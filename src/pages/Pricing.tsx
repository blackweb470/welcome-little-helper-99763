import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, ArrowLeft, Sparkles } from "lucide-react";
import { PolarCheckout } from "@/components/PolarCheckout";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

const Pricing = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const plans = [
    {
      name: "Basic",
      price: "$9.99",
      priceId: "2e7f6e6a-cb2a-4167-bf5c-7eb9e55c6636",
      description: "For growing businesses",
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
    },
    {
      name: "Pro",
      price: "$29.99",
      priceId: "65495367-3163-49af-9ae4-0c3e740d332a",
      description: "For professional teams",
      features: [
        "10 Businesses",
        "Live Agent Transfer",
        "Advanced Analytics",
        "Sentiment Analysis",
        "Proactive Chat Rules",
        "Voice Chat",
        "Product Catalog",
        "Priority Support",
      ],
      cta: "Get Started",
      popular: true,
    },
    {
      name: "Business",
      price: "$99.99",
      priceId: "495da580-72e9-4fb9-a706-b098921df542",
      description: "For large organizations",
      features: [
        "Unlimited Businesses",
        "AI Learning & Documents",
        "Advanced Visitor Tracking",
        "Custom Integrations",
        "API Access",
        "24/7 Priority Support",
        "Dedicated Account Manager",
        "Custom Training",
      ],
      cta: "Get Started",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                LYQN AI
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-6">
          <Badge variant="secondary" className="text-sm px-4 py-2">
            <Crown className="w-4 h-4 mr-2" />
            Simple, Transparent Pricing
          </Badge>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            Choose Your Plan
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Start with 1 month free on Basic and scale as you grow. Powered by Polar payment processing.
          </p>

          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-5 h-5 text-primary" />
              <span>1 Month Free Trial</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-5 h-5 text-primary" />
              <span>Cancel Anytime</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-5 h-5 text-primary" />
              <span>Secure Payments via Polar</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`p-8 hover:shadow-xl transition-all relative ${
                plan.popular ? "border-2 border-primary" : ""
              }`}
            >
              {plan.trial && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600">
                  1 Month Free Trial
                </Badge>
              )}
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  Most Popular
                </Badge>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {userId ? (
                  <PolarCheckout
                    planName={plan.name.toLowerCase()}
                    priceId={plan.priceId}
                    userId={userId}
                    className="w-full"
                  >
                    {plan.cta}
                  </PolarCheckout>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => navigate("/auth")}
                  >
                    {plan.cta}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="max-w-5xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">All Plans Include</h2>
          <Card className="p-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                "Self-Learning AI",
                "Conversation Memory",
                "24/7 Availability",
                "Multi-Language Support",
                "Mobile Responsive Widget",
                "Real-Time Notifications",
                "Secure Data Storage",
                "GDPR Compliant",
                "Regular Updates",
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="p-1 bg-primary/10 rounded">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-2">Can I change plans later?</h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately,
                and we'll prorate the charges.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-2">What happens when I reach my business limit?</h3>
              <p className="text-muted-foreground">
                You'll need to upgrade to create more businesses. Your existing businesses will continue
                to work normally.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-2">Is there a setup fee?</h3>
              <p className="text-muted-foreground">
                No setup fees, no hidden charges. You only pay the monthly subscription for your chosen plan.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-2">Do you offer annual billing?</h3>
              <p className="text-muted-foreground">
                Annual billing with a 20% discount is coming soon! Contact us for enterprise annual contracts.
              </p>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="p-12 max-w-4xl mx-auto text-center bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground">
              Join innovative businesses using self-learning AI to transform customer support.
            </p>
            <Button size="lg" className="text-lg px-10 py-6" onClick={() => navigate("/auth")}>
              Start Free Trial
              <Sparkles className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 LYQN AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
