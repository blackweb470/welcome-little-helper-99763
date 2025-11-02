import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface PolarCheckoutProps {
  planName: string;
  priceId: string; // Polar price ID
  userId: string;
  className?: string;
  children?: React.ReactNode;
}

export const PolarCheckout = ({ 
  planName, 
  priceId, 
  userId,
  className,
  children 
}: PolarCheckoutProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCheckout = async () => {
    try {
      setLoading(true);

      // Create checkout session via Polar API
      const response = await fetch('https://api.polar.sh/v1/checkouts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_POLAR_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_price_id: priceId,
          success_url: `${window.location.origin}/dashboard?checkout=success`,
          cancel_url: `${window.location.origin}/pricing`,
          metadata: {
            user_id: userId,
            plan_name: planName,
          },
          customer_email: (await supabase.auth.getUser()).data.user?.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      
      // Redirect to Polar checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Failed",
        description: "Unable to start checkout process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        children || 'Subscribe'
      )}
    </Button>
  );
};
