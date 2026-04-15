import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Crown, Calendar, CreditCard, AlertCircle,
  ArrowUpRight, CheckCircle2, Clock, Star, Zap, Building2,
  Receipt, ExternalLink, XCircle
} from "lucide-react";
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

const planDetails: Record<string, { icon: React.ReactNode; price: string; color: string; features: string[] }> = {
  basic: {
    icon: <Star className="w-5 h-5" />,
    price: "$9.99/mo",
    color: "text-blue-500",
    features: ["1 Business", "Pre-Chat Forms", "Canned Responses", "Basic Analytics", "Email Notifications"],
  },
  pro: {
    icon: <Zap className="w-5 h-5" />,
    price: "$29.99/mo",
    color: "text-violet-500",
    features: ["2 Businesses", "Live Agent Transfer", "Advanced Analytics", "Sentiment Analysis", "Voice Chat"],
  },
  business: {
    icon: <Building2 className="w-5 h-5" />,
    price: "$99.99/mo",
    color: "text-amber-500",
    features: ["5 Businesses", "AI Learning & Documents", "Visitor Tracking", "API Access", "Custom Training"],
  },
};

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

      const { data, error } = await supabase.rpc('get_subscription_status', { p_user_id: user.id });
      if (error) throw error;
      if (data && data.length > 0) setSubscription(data[0]);

      const { data: paymentsData } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setPayments(paymentsData || []);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast({ title: "Error", description: "Failed to load subscription details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getDaysRemaining = (dateString: string | null) => {
    if (!dateString) return null;
    const diff = new Date(dateString).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
            <Crown className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Active Subscription</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Get started with a 2-week free trial. No credit card required.
          </p>
          <Button onClick={() => navigate('/pricing')} size="lg">
            View Plans
            <ArrowUpRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const plan = planDetails[subscription.plan_name] || planDetails.basic;
  const trialDays = getDaysRemaining(subscription.trial_ends_at);

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Plan Card */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center ${plan.color}`}>
                  {plan.icon}
                </div>
                <div>
                  <CardTitle className="text-xl capitalize">{subscription.plan_name} Plan</CardTitle>
                  <CardDescription>
                    {subscription.is_trial ? "Free Trial" : plan.price}
                  </CardDescription>
                </div>
              </div>
              {subscription.is_trial ? (
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                  <Clock className="w-3 h-3 mr-1" />
                  Trial
                </Badge>
              ) : subscription.cancel_at_period_end ? (
                <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                  Canceling
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Trial Progress */}
            {subscription.is_trial && trialDays !== null && (
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-600">Trial Period</span>
                  <span className="text-sm font-semibold text-blue-600">{trialDays} days left</span>
                </div>
                <div className="w-full h-2 rounded-full bg-blue-500/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${Math.max(5, ((14 - trialDays) / 14) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Ends on {formatDate(subscription.trial_ends_at)}
                </p>
              </div>
            )}

            {/* Cancellation Notice */}
            {subscription.cancel_at_period_end && (
              <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Subscription ending</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your access will end on {formatDate(subscription.expires_at)}. You can resubscribe anytime.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Date */}
            {!subscription.is_trial && subscription.expires_at && !subscription.cancel_at_period_end && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Next billing date</p>
                  <p className="text-xs text-muted-foreground">{formatDate(subscription.expires_at)}</p>
                </div>
              </div>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {subscription.is_trial && (
                <Button onClick={() => navigate('/pricing')}>
                  Upgrade Now
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate('/pricing')}>
                {subscription.is_trial ? "Compare Plans" : "Change Plan"}
              </Button>
              {!subscription.cancel_at_period_end && !subscription.is_trial && (
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setShowCancelDialog(true)}
                >
                  Cancel Plan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Plan Features */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Included Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payment Method
            </CardTitle>
            <a
              href="https://polar.sh"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Manage on Polar
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your payment method is securely managed through Polar. Update your card or billing details in your Polar account.
          </p>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Table Header */}
              <div className="grid grid-cols-4 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span>Date</span>
                <span>Plan</span>
                <span>Status</span>
                <span className="text-right">Amount</span>
              </div>
              <Separator />
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="grid grid-cols-4 gap-4 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors items-center"
                >
                  <span className="text-sm">{formatDate(payment.created_at)}</span>
                  <span className="text-sm capitalize">{payment.plan_name}</span>
                  <div>
                    {payment.status === 'succeeded' ? (
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Paid
                      </Badge>
                    ) : payment.status === 'failed' ? (
                      <Badge variant="destructive" className="text-xs">
                        <XCircle className="w-3 h-3 mr-1" />
                        Failed
                      </Badge>
                    ) : payment.status === 'refunded' ? (
                      <Badge variant="secondary" className="text-xs">Refunded</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">{payment.status}</Badge>
                    )}
                  </div>
                  <div className="text-right">
                    {payment.amount ? (
                      <span className="text-sm font-medium">
                        ${payment.amount.toFixed(2)} <span className="text-xs text-muted-foreground">{payment.currency?.toUpperCase()}</span>
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Your <span className="font-medium capitalize">{subscription.plan_name}</span> plan will remain active until {formatDate(subscription.expires_at)}.
              </p>
              <p>After that, you'll lose access to premium features. You can resubscribe at any time.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep My Plan</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session) throw new Error("Not authenticated");

                  const response = await supabase.functions.invoke('cancel-subscription');
                  if (response.error) throw new Error(response.error.message || 'Cancellation failed');

                  toast({
                    title: "Subscription cancelled",
                    description: `Your plan will end on ${formatDate(subscription.expires_at)}`,
                  });

                  setShowCancelDialog(false);
                  fetchSubscription();
                } catch (error) {
                  console.error('Cancellation error:', error);
                  toast({
                    title: "Error",
                    description: "Failed to cancel subscription. Please try again.",
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
  );
};
