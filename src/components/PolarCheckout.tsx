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

// Base checkout URL provided by Polar
const POLAR_CHECKOUT_URL = "https://buy.polar.sh/polar_cl_BeNKQxpBOCSJ0SbFU6bZAAAEhurIudMmcRwCx4QSlRF";

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
      
      // Build checkout URL with metadata
      const checkoutUrl = new URL(POLAR_CHECKOUT_URL);
      
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
