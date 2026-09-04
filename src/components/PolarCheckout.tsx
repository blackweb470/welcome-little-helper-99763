import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface PolarCheckoutProps {
  planName: string;
  productId: string; // Polar product ID
  userId: string;
  className?: string;
  children?: React.ReactNode;
}

// Base checkout URL provided by Polar (Live Production Mode)
const POLAR_CHECKOUT_BASE_URL = import.meta.env.VITE_POLAR_CHECKOUT_BASE_URL || "https://buy.polar.sh";

export const PolarCheckout = ({ 
  planName, 
  productId, 
  userId,
  className,
  children 
}: PolarCheckoutProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCheckout = async () => {
    try {
      setLoading(true);

      // Get user email for pre-filling
      const { data: { user } } = await supabase.auth.getUser();
      
      const targetProductId = productId || import.meta.env.VITE_POLAR_PRODUCT_ID || "8c68395a-7403-4c73-8f53-456737a22fe4";
      const checkoutUrl = new URL(`${POLAR_CHECKOUT_BASE_URL}/checkout/${targetProductId}`);
      
      // Add metadata as query parameters
      if (user?.email) {
        checkoutUrl.searchParams.set('email', user.email);
      }
      checkoutUrl.searchParams.set('product_id', productId);
      checkoutUrl.searchParams.set('user_id', userId);
      checkoutUrl.searchParams.set('plan_name', planName);
      
      // Add success URL to redirect back to dashboard
      const successUrl = `${window.location.origin}/dashboard`;
      checkoutUrl.searchParams.set('success_url', successUrl);
      
      // Redirect to Polar checkout
      window.location.href = checkoutUrl.toString();
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Failed",
        description: "Unable to start checkout process. Please try again.",
        variant: "destructive",
      });
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
