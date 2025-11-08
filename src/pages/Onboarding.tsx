import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const Onboarding = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user is admin - admins bypass payment
      const { data: isAdmin } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (isAdmin) {
        // Admins get free access, go straight to dashboard
        navigate("/dashboard");
        return;
      }

      // Check if user has a subscription
      const { data, error } = await supabase
        .rpc('get_subscription_status', { p_user_id: user.id })
        .single();

      if (error || !data) {
        // No subscription, redirect to pricing to select plan and add card
        navigate("/pricing?new_user=true");
      } else {
        // Has subscription, go to dashboard
        navigate("/dashboard");
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      // Redirect to pricing to complete signup
      navigate("/pricing?new_user=true");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="p-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Setting up your account...</p>
        </div>
      </Card>
    </div>
  );
};

export default Onboarding;
