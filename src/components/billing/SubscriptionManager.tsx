import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Crown, Calendar, CreditCard, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SubscriptionStatus {
  plan_name: string;
  status: string;
  is_trial: boolean;
  trial_ends_at: string | null;
  expires_at: string | null;
  cancel_at_period_end: boolean;
}

interface PaymentRecord {
  id: string;
  plan_name: string;
  amount: number | null;
  currency: string;
  status: string;
  created_at: string;
  error_message: string | null;
}

export const SubscriptionManager = () => {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
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
        .rpc('get_subscription_status', { p_user_id: user.id });

      if (error) throw error;

      if (data && data.length > 0) {
        setSubscription(data[0]);
      }

      // Fetch payment history
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
      } else {
        setPayments(paymentsData || []);
      }
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
      return <Badge className="bg-blue-600 text-white">Free Trial - Basic Features</Badge>;
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
            Start your journey with a 2-week free trial on our Basic plan
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

        <div className="flex gap-4 flex-wrap">
          <Button variant="outline" onClick={() => navigate('/pricing')}>
            Change Plan
          </Button>
          {subscription.is_trial && (
            <Button onClick={() => navigate('/pricing')}>
              Upgrade Now
            </Button>
          )}
          {!subscription.cancel_at_period_end && !subscription.is_trial && (
            <Button 
              variant="destructive" 
              onClick={() => setShowCancelDialog(true)}
            >
              Cancel Subscription
            </Button>
          )}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Payment Information
          </h4>
          <p className="text-sm text-muted-foreground">
            Your payment method is securely managed through Polar. To update your card or billing details, 
            please visit your{" "}
            <a 
              href="https://polar.sh" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Polar account
            </a>.
          </p>
        </div>

        {/* Payment History */}
        <div className="mt-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Payment History
          </h4>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payment history available yet.</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium capitalize">{payment.plan_name} Plan</p>
                      <Badge variant={
                        payment.status === 'succeeded' ? 'default' :
                        payment.status === 'failed' ? 'destructive' :
                        payment.status === 'refunded' ? 'secondary' :
                        'outline'
                      }>
                        {payment.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(payment.created_at)}
                    </p>
                    {payment.error_message && (
                      <p className="text-sm text-destructive mt-1">
                        {payment.error_message}
                      </p>
                    )}
                  </div>
                  {payment.amount && (
                    <div className="text-right">
                      <p className="font-semibold">
                        {payment.currency.toUpperCase()} {payment.amount.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
              <AlertDialogDescription>
                Your subscription will remain active until {formatDate(subscription.expires_at)}.
                After that, you'll lose access to {subscription.plan_name} plan features.
                You can resubscribe at any time.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) throw new Error("Not authenticated");

                    const response = await supabase.functions.invoke('cancel-subscription');
                    if (response.error) throw new Error(response.error.message || 'Cancellation failed');

                    toast({
                      title: "Subscription Cancelled",
                      description: `Your subscription will end on ${formatDate(subscription.expires_at)}`,
                    });
                    
                    setShowCancelDialog(false);
                    fetchSubscription();
                  } catch (error) {
                    console.error('Cancellation error:', error);
                    toast({
                      title: "Error",
                      description: "Failed to cancel subscription. Please try again or contact support.",
                      variant: "destructive",
                    });
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Confirm Cancellation
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
};
