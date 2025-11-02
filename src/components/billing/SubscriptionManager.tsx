import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Crown, Calendar, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SubscriptionStatus {
  plan_name: string;
  status: string;
  is_trial: boolean;
  trial_ends_at: string | null;
  expires_at: string | null;
  cancel_at_period_end: boolean;
}

export const SubscriptionManager = () => {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .rpc('get_subscription_status', { p_user_id: user.id })
        .single();

      if (error) throw error;

      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!subscription) return null;

    if (subscription.is_trial) {
      return <Badge className="bg-green-600">Free Trial</Badge>;
    }

    if (subscription.status === 'active') {
      return <Badge className="bg-primary">Active</Badge>;
    }

    if (subscription.cancel_at_period_end) {
      return <Badge variant="destructive">Canceling</Badge>;
    }

    return <Badge variant="secondary">{subscription.status}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-4">
          <Crown className="w-12 h-12 mx-auto text-muted-foreground" />
          <h3 className="text-xl font-semibold">No Active Subscription</h3>
          <p className="text-muted-foreground">
            Start your journey with a 1-month free trial on our Basic plan
          </p>
          <Button onClick={() => navigate('/pricing')}>
            View Plans
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold capitalize">{subscription.plan_name} Plan</h3>
            <p className="text-muted-foreground">Manage your subscription</p>
          </div>
          {getStatusBadge()}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Status</span>
            </div>
            <p className="font-medium capitalize">{subscription.status}</p>
          </div>

          {subscription.is_trial && subscription.trial_ends_at && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Trial Ends</span>
              </div>
              <p className="font-medium">{formatDate(subscription.trial_ends_at)}</p>
            </div>
          )}

          {!subscription.is_trial && subscription.expires_at && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="w-4 h-4" />
                <span>Next Billing Date</span>
              </div>
              <p className="font-medium">{formatDate(subscription.expires_at)}</p>
            </div>
          )}
        </div>

        {subscription.cancel_at_period_end && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              Your subscription will be cancelled on {formatDate(subscription.expires_at)}
            </p>
          </div>
        )}

        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate('/pricing')}>
            Change Plan
          </Button>
          {subscription.is_trial && (
            <Button onClick={() => navigate('/pricing')}>
              Upgrade Now
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
