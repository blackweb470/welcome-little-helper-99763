import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Wallet, PlusCircle, ArrowUpRight, Zap, RefreshCw, AlertTriangle, CheckCircle2, History, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WalletInfo {
  balance_usd: number;
  auto_topup_enabled: boolean;
  auto_topup_threshold: number;
  auto_topup_amount: number;
  estimated_messages_remaining: number;
}

interface Transaction {
  id: string;
  amount_usd: number;
  type: string;
  description: string;
  created_at: string;
}

export const WalletManager = () => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState<number>(10);
  const [isDepositing, setIsDepositing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchWalletData();

    // Check if returning from a successful deposit checkout
    const params = new URLSearchParams(window.location.search);
    if (params.get("deposit") === "success") {
      setSuccessDialogOpen(true);
      toast({
        title: "Deposit Confirmed! 🎉",
        description: "Your credit wallet balance has been updated successfully.",
      });

      // Clean up deposit=success parameter from URL without page refresh
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.delete("deposit");
      const newQuery = searchParams.toString();
      const newUrl = window.location.pathname + (newQuery ? `?${newQuery}` : "");
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch wallet info via RPC
      const { data: walletData, error: walletError } = await supabase
        .rpc('get_wallet_info', { p_user_id: user.id });

      if (walletError) throw walletError;

      if (walletData && walletData.length > 0) {
        setWallet(walletData[0]);
      }

      // Fetch recent transactions
      const { data: txData } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (txData) {
        setTransactions(txData);
      }
    } catch (err) {
      console.error('Error fetching wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (amount: number) => {
    setIsDepositing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const amountInCents = Math.round(amount * 100);
      const polarBaseUrl = import.meta.env.VITE_POLAR_CHECKOUT_BASE_URL || "https://buy.polar.sh";
      const polarProductId = import.meta.env.VITE_POLAR_PRODUCT_ID || "8c68395a-7403-4c73-8f53-456737a22fe4";

      // 1. Invoke create-checkout edge function to create checkout session
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
        body: { amount, successUrl: `${window.location.origin}/dashboard?tab=billing&deposit=success` }
      });

      if (checkoutError) {
        throw new Error(checkoutError.message || "Failed to initiate checkout session");
      }

      if (checkoutData?.error) {
        throw new Error(checkoutData.error);
      }

      const targetUrl = checkoutData?.checkoutUrl || checkoutData?.url || checkoutData?.data?.url || checkoutData?.data?.checkout_url;
      if (targetUrl) {
        window.location.href = targetUrl;
        return;
      }
    } catch (err: any) {
      toast({
        title: "Deposit Failed",
        description: err.message || "Failed to process deposit",
        variant: "destructive",
      });
    } finally {
      setIsDepositing(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !wallet) {
    return (
      <div className="p-8 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground text-sm">Loading your credit wallet...</p>
      </div>
    );
  }

  const balance = wallet?.balance_usd || 0;
  const isLowBalance = balance < 2.0;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Low Balance Alert */}
      {isLowBalance && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Low Credit Balance</p>
              <p className="text-xs opacity-90">Your credit balance is below $2.00. Top up now to prevent AI assistant pauses.</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white">
            Top Up Now
          </Button>
        </div>
      )}

      {/* Credit Wallet Overview Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Wallet Balance Card */}
        <Card className="md:col-span-2 shadow-elegant border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Credit Wallet</CardTitle>
                  <CardDescription>Pay-As-You-Go AI Assistant Credits</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Active Wallet
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 p-5 rounded-2xl bg-background/80 border border-border/50">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Available Balance</span>
                <span className="text-4xl font-extrabold tracking-tight text-foreground">{formatCurrency(balance)}</span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Est. Responses Left</span>
                <span className="text-2xl font-bold text-primary">~{wallet?.estimated_messages_remaining.toLocaleString()} messages</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Standard Rate: <strong>$0.005</strong> / AI Message Response</span>
              </div>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="font-semibold shadow-md">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Deposit Credits
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Deposit Wallet Credits</DialogTitle>
                    <DialogDescription>
                      Add funds to your Pay-As-You-Go wallet. Funds never expire.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-5 py-4">
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">Select Amount</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {[5, 10, 25, 50].map((amt) => (
                          <Button
                            key={amt}
                            type="button"
                            variant={depositAmount === amt ? "default" : "outline"}
                            onClick={() => setDepositAmount(amt)}
                            className="font-bold"
                          >
                            ${amt}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="custom-amount" className="text-sm font-semibold">Custom Deposit Amount ($)</Label>
                      <Input
                        id="custom-amount"
                        type="number"
                        min="5"
                        max="1000"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(Math.max(5, parseFloat(e.target.value) || 5))}
                      />
                    </div>

                    <div className="p-3 rounded-lg bg-muted/60 text-xs text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Deposit Amount:</span>
                        <span className="font-semibold text-foreground">${depositAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estimated Messages:</span>
                        <span className="font-semibold text-primary">~{(depositAmount / 0.005).toLocaleString()} responses</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleDeposit(depositAmount)}
                      disabled={isDepositing}
                      className="w-full font-bold h-11"
                    >
                      {isDepositing ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Processing Deposit...
                        </>
                      ) : (
                        <>
                          Complete ${depositAmount.toFixed(2)} Deposit
                          <ArrowUpRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Feature Access Highlights Card */}
        <Card className="shadow-elegant border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Included Features
            </CardTitle>
            <CardDescription className="text-xs">All features unlocked for active wallets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Full AI Learning & Documents</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Website Deep Crawler</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Live Agent Handoff</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Proactive Chat Rules</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>WhatsApp Integration</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History Table */}
      <Card className="shadow-elegant border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Transaction History
          </CardTitle>
          <CardDescription>Recent deposits and per-message deductions</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No transactions recorded yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => {
                  const isPositive = tx.amount_usd > 0;
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            tx.type === 'deposit'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : tx.type === 'starter_bonus'
                                ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                : 'bg-muted text-muted-foreground'
                          }
                        >
                          {tx.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{tx.description}</TableCell>
                      <TableCell className={`text-right font-bold text-sm ${isPositive ? 'text-emerald-600' : 'text-foreground'}`}>
                        {isPositive ? `+${formatCurrency(tx.amount_usd)}` : formatCurrency(tx.amount_usd)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Deposit Success Celebration Popup Modal */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md text-center border-emerald-500/20 bg-gradient-to-b from-card via-card to-emerald-500/5 shadow-2xl">
          <DialogHeader className="pt-4 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/10 border border-emerald-500/20 animate-pulse">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <DialogTitle className="text-2xl font-extrabold text-foreground flex items-center justify-center gap-2">
              Deposit Successful! 🎉
            </DialogTitle>
            <DialogDescription className="text-sm pt-1 text-muted-foreground">
              Your credit wallet has been topped up successfully. Funds are active immediately with no expiration date.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 p-4 rounded-xl bg-background/80 border border-emerald-500/20 text-center space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Updated Available Balance</span>
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 block">{formatCurrency(balance)}</span>
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground pt-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>~{wallet?.estimated_messages_remaining.toLocaleString()} AI responses available</span>
            </div>
          </div>

          <Button
            onClick={() => setSuccessDialogOpen(false)}
            className="w-full font-bold h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Awesome, Continue to Dashboard
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};
