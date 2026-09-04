import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Building,
  MessageSquare,
  CreditCard,
  Activity,
  Search,
  PlusCircle,
  RefreshCw,
  Wallet,
  ShieldCheck,
  History,
  TrendingUp,
  DollarSign,
  Filter,
  CheckCircle2,
  Sparkles,
  Mail,
  Send,
  SendHorizontal,
} from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "./NotFound";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  plan: string;
  balance: number;
}

interface BusinessItem {
  id: string;
  name: string;
  user_id: string;
  owner_email?: string;
  created_at: string;
}

interface TransactionItem {
  id: string;
  user_id: string;
  user_email?: string;
  amount_usd: number;
  type: string;
  description: string;
  created_at: string;
}

const ADMIN_CACHE_KEY = "lyqn_admin_dashboard_cache_v2";

export default function Admin() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string | null>(null);
  const [isUsingCache, setIsUsingCache] = useState(false);

  // Analytics Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBusinesses: 0,
    totalConversations: 0,
    totalMessages: 0,
    totalSystemBalance: 0,
    totalDepositsAmount: 0,
    planCounts: {} as Record<string, number>,
  });

  // Data lists
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [businessesList, setBusinessesList] = useState<BusinessItem[]>([]);
  const [transactionsList, setTransactionsList] = useState<TransactionItem[]>([]);

  // Search & Filters
  const [userSearch, setUserSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [businessSearch, setBusinessSearch] = useState("");

  // Admin Topup Dialog State
  const [topupDialogOpen, setTopupDialogOpen] = useState(false);
  const [selectedUserForTopup, setSelectedUserForTopup] = useState<UserProfile | null>(null);
  const [topupAmount, setTopupAmount] = useState<number>(10);
  const [topupType, setTopupType] = useState<string>("deposit");
  const [topupDescription, setTopupDescription] = useState<string>("Admin Manual Credit Allocation");
  const [isSubmittingTopup, setIsSubmittingTopup] = useState(false);

  // Custom Email Broadcast Dialog State
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState<"all" | "single">("all");
  const [broadcastRecipientEmail, setBroadcastRecipientEmail] = useState("");
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastActionText, setBroadcastActionText] = useState("");
  const [broadcastActionUrl, setBroadcastActionUrl] = useState("");
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [sendingProgress, setSendingProgress] = useState("");

  useEffect(() => {
    // 1. Instantly load cached dashboard data if available
    let hasLoadedCache = false;
    try {
      const cachedRaw = localStorage.getItem(ADMIN_CACHE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (cached && cached.usersList && Array.isArray(cached.usersList) && cached.usersList.length > 0) {
          setUsersList(cached.usersList);
          setBusinessesList(cached.businessesList || []);
          setTransactionsList(cached.transactionsList || []);
          setStats(cached.stats || stats);
          setLastUpdatedTime(cached.updatedAt || null);
          setIsUsingCache(true);
          setIsAuthorized(true);
          setLoading(false);
          hasLoadedCache = true;
        }
      }
    } catch (e) {
      console.warn("Failed to load admin cache from localStorage:", e);
    }

    // 2. Perform live fetch / background revalidation
    fetchAdminData(!hasLoadedCache);
  }, []);

  const fetchAdminData = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) {
      setLoading(true);
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.email !== "akhatasebhudojoseph1@gmail.com") {
        setIsUnauthorized(true);
        setLoading(false);
        return;
      }

      setIsAuthorized(true);

      // 1. Fetch Total Users count
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // 2. Fetch Total Businesses
      const { data: businesses } = await supabase
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false });

      // 3. Fetch Total Conversations count
      const { count: totalConversations } = await supabase
        .from("conversations")
        .select("*", { count: "exact", head: true });

      // 4. Fetch Total Messages count
      const { count: totalMessages } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true });

      // 5. Fetch User Subscriptions for plan mapping
      const { data: subscriptions } = await supabase
        .from("user_subscriptions")
        .select("*");

      const planCounts: Record<string, number> = {};

      // 6. Fetch Users & Wallets with accurate balance (RPC or Fallback via SECURITY DEFINER get_wallet_info)
      let formattedUsers: UserProfile[] = [];
      let systemBalanceSum = 0;

      // Try RPC get_admin_users_wallets first
      const { data: adminRpcUsers, error: rpcErr } = await (supabase.rpc as any)("get_admin_users_wallets");

      if (!rpcErr && adminRpcUsers && Array.isArray(adminRpcUsers) && adminRpcUsers.length > 0) {
        formattedUsers = adminRpcUsers.map((u: any) => {
          const bal = parseFloat(u.balance) || 1.0;
          systemBalanceSum += bal;
          const planName = u.plan || "free";
          planCounts[planName] = (planCounts[planName] || 0) + 1;

          return {
            id: u.id,
            email: u.email,
            full_name: u.full_name,
            created_at: u.created_at,
            plan: planName,
            balance: bal,
          };
        });
      } else {
        // Fallback: Query profiles and invoke get_wallet_info RPC per user to bypass RLS safely
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (profiles) {
          formattedUsers = await Promise.all(
            profiles.map(async (profile) => {
              const userSub = subscriptions?.find((s: any) => s.user_id === profile.id);
              const planName = userSub?.plan_name || "free";
              planCounts[planName] = (planCounts[planName] || 0) + 1;

              let userBal = 1.0;
              try {
                const { data: wData } = await (supabase.rpc as any)("get_wallet_info", { p_user_id: profile.id });
                if (wData && wData.length > 0) {
                  userBal = parseFloat(wData[0].balance_usd) || 1.0;
                }
              } catch (_) {}

              systemBalanceSum += userBal;

              return {
                id: profile.id,
                email: profile.email,
                full_name: profile.full_name,
                created_at: profile.created_at,
                plan: planName,
                balance: userBal,
              };
            })
          );
        }
      }

      setUsersList(formattedUsers);

      // Create quick user email lookup map
      const userLookup = new Map<string, string>();
      formattedUsers.forEach((u) => userLookup.set(u.id, u.email));

      // Formatted Businesses
      const formattedBusinesses: BusinessItem[] = (businesses || []).map((b: any) => ({
        id: b.id,
        name: b.name,
        user_id: b.owner_id || b.user_id,
        owner_email: userLookup.get(b.owner_id || b.user_id) || "Unknown Owner",
        created_at: b.created_at,
      }));
      setBusinessesList(formattedBusinesses);

      // 7. Fetch Recent Transactions
      let formattedTransactions: TransactionItem[] = [];
      let depositsTotal = 0;

      const { data: adminRpcTx, error: txRpcErr } = await (supabase.rpc as any)("get_admin_transactions", { p_limit: 100 });

      if (!txRpcErr && adminRpcTx && Array.isArray(adminRpcTx)) {
        formattedTransactions = adminRpcTx.map((tx: any) => {
          const amt = parseFloat(tx.amount_usd) || 0;
          if (amt > 0) depositsTotal += amt;
          return {
            id: tx.id,
            user_id: tx.user_id,
            user_email: tx.user_email || userLookup.get(tx.user_id) || "System / Unknown",
            amount_usd: amt,
            type: tx.type,
            description: tx.description,
            created_at: tx.created_at,
          };
        });
      } else {
        const { data: transactions } = await (supabase
          .from("wallet_transactions" as any) as any)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        formattedTransactions = (transactions || []).map((tx: any) => {
          const amt = parseFloat(tx.amount_usd) || 0;
          if (amt > 0) depositsTotal += amt;
          return {
            id: tx.id,
            user_id: tx.user_id,
            user_email: userLookup.get(tx.user_id) || "System / Unknown",
            amount_usd: amt,
            type: tx.type,
            description: tx.description,
            created_at: tx.created_at,
          };
        });
      }

      setTransactionsList(formattedTransactions);

      const newStats = {
        totalUsers: totalUsers || formattedUsers.length,
        totalBusinesses: formattedBusinesses.length,
        totalConversations: totalConversations || 0,
        totalMessages: totalMessages || 0,
        totalSystemBalance: systemBalanceSum,
        totalDepositsAmount: depositsTotal,
        planCounts,
      };

      setStats(newStats);

      // Save fresh data into client-side cache
      const nowISO = new Date().toISOString();
      try {
        const cachePayload = {
          usersList: formattedUsers,
          businessesList: formattedBusinesses,
          transactionsList: formattedTransactions,
          stats: newStats,
          updatedAt: nowISO,
        };
        localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(cachePayload));
        setLastUpdatedTime(nowISO);
        setIsUsingCache(false);
      } catch (cacheErr) {
        console.warn("Failed to write admin cache:", cacheErr);
      }
    } catch (err) {
      console.error("Error fetching admin stats:", err);
      toast({
        title: "Error",
        description: "Failed to load admin dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGrantCredit = async () => {
    if (!selectedUserForTopup) return;
    setIsSubmittingTopup(true);

    try {
      const { data: newBalance, error } = await (supabase.rpc as any)("topup_wallet_balance", {
        p_user_id: selectedUserForTopup.id,
        p_amount_usd: topupAmount,
        p_description: topupDescription || "Admin Manual Credit Allocation",
        p_metadata: {
          admin_granted: true,
          granted_by: "super_admin",
          granted_at: new Date().toISOString(),
          type: topupType,
        },
      });

      if (error) throw error;

      const numericBalance = parseFloat(String(newBalance || 0));

      // Notify the user via email notification
      try {
        await supabase.functions.invoke("send-notification", {
          body: {
            type: "credit_bonus",
            data: {
              userEmail: selectedUserForTopup.email,
              amount: topupAmount,
              newBalance: numericBalance,
              description: topupDescription || "Admin Credit Bonus",
            },
          },
        });
      } catch (emailErr) {
        console.warn("Could not send credit notification email:", emailErr);
      }

      toast({
        title: "Credits Granted & User Notified! 🎉",
        description: `Granted $${topupAmount.toFixed(2)} to ${selectedUserForTopup.email}. Email notification sent. New Balance: $${numericBalance.toFixed(2)}`,
      });

      setTopupDialogOpen(false);
      setSelectedUserForTopup(null);
      fetchAdminData();
    } catch (err: any) {
      toast({
        title: "Topup Failed",
        description: err.message || "Failed to grant credits to user",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingTopup(false);
    }
  };

  const handleSendCustomEmailBroadcast = async () => {
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      toast({
        title: "Validation Error",
        description: "Subject line and email message body are required.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingBroadcast(true);

    try {
      let recipients: string[] = [];

      if (broadcastTarget === "single") {
        if (!broadcastRecipientEmail.trim()) {
          throw new Error("Recipient email address is required for single email");
        }
        recipients = [broadcastRecipientEmail.trim()];
      } else {
        // Broadcast to all registered users
        recipients = usersList.map((u) => u.email).filter((email) => email && email.includes("@"));
      }

      if (recipients.length === 0) {
        throw new Error("No valid recipient email addresses found");
      }

      let successCount = 0;
      let failCount = 0;
      let lastErrorDetail = "";

      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        setSendingProgress(`Sending ${i + 1} of ${recipients.length} (${recipient})...`);

        try {
          const res = await supabase.functions.invoke("send-notification", {
            body: {
              type: "custom_email",
              data: {
                userEmail: recipient.trim(),
                subject: broadcastSubject.trim(),
                customTitle: (broadcastTitle || broadcastSubject).trim(),
                message: broadcastMessage,
                actionText: broadcastActionText.trim() || undefined,
                actionUrl: broadcastActionUrl.trim() || undefined,
              },
            },
          });

          const resData = res.data;
          let errorText = "";

          if (res.error) {
            try {
              const errContext = await res.error.context?.json();
              errorText = errContext?.error || errContext?.message || res.error.message;
            } catch (_) {
              errorText = res.error.message;
            }
          } else if (resData && !resData.success) {
            errorText = resData.error || "Delivery failed";
          }

          if (errorText) {
            failCount++;
            console.error(`Email error for ${recipient}:`, errorText);
            lastErrorDetail = errorText;
          } else {
            successCount++;
          }
        } catch (e: any) {
          failCount++;
          lastErrorDetail = e.message || "Network Error";
        }
      }

      if (successCount > 0) {
        toast({
          title: "Custom Email Sent! 📧",
          description: `Successfully sent email to ${successCount} user${successCount !== 1 ? "s" : ""}.${failCount > 0 ? ` (${failCount} failed: ${lastErrorDetail})` : ""}`,
        });
      } else {
        toast({
          title: "Email Sending Failed",
          description: `Could not send email to recipients. ${lastErrorDetail}`,
          variant: "destructive",
        });
      }

      setBroadcastDialogOpen(false);
      setBroadcastSubject("");
      setBroadcastTitle("");
      setBroadcastMessage("");
      setBroadcastActionText("");
      setBroadcastActionUrl("");
      setSendingProgress("");
    } catch (err: any) {
      toast({
        title: "Broadcast Failed",
        description: err.message || "Failed to send broadcast email",
        variant: "destructive",
      });
    } finally {
      setIsSendingBroadcast(false);
      setSendingProgress("");
    }
  };

  const openSingleUserEmailModal = (email: string) => {
    setBroadcastTarget("single");
    setBroadcastRecipientEmail(email);
    setBroadcastSubject("");
    setBroadcastTitle("");
    setBroadcastMessage("");
    setBroadcastDialogOpen(true);
  };

  const openBroadcastAllEmailModal = () => {
    setBroadcastTarget("all");
    setBroadcastRecipientEmail("");
    setBroadcastSubject("🎉 Upgrade Announcement: Pay-As-You-Go & Full Access Unlocked!");
    setBroadcastTitle("Welcome to the Upgraded LYQN AI Experience");
    setBroadcastMessage(
      "We have upgraded LYQN AI to a transparent Pay-As-You-Go credit model to serve you better and deliver a professional experience.\n\n" +
      "Here is what this upgrade means for your account:\n" +
      "• Free Starter Bonus Credits: Added to your credit wallet balance automatically so you can continue generating AI responses seamlessly.\n" +
      "• Full Application Access: All features (Deep Website Crawler, WhatsApp Integration, Proactive Chat Rules, Document Knowledge Learning, and Live Agent Handoff) are now fully unlocked with zero feature gating.\n" +
      "• Transparent Pay-As-You-Go Rate: Only $0.005 per AI message response. Your wallet funds NEVER expire!\n\n" +
      "Thank you for choosing LYQN AI to power your business customer support."
    );
    setBroadcastActionText("Explore Your Dashboard & Wallet");
    setBroadcastActionUrl("https://lyqn.app/dashboard");
    setBroadcastDialogOpen(true);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filtered Users
  const filteredUsers = usersList.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(userSearch.toLowerCase())) ||
      user.id.toLowerCase().includes(userSearch.toLowerCase());

    const matchesPlan = planFilter === "all" || user.plan.toLowerCase() === planFilter.toLowerCase();

    return matchesSearch && matchesPlan;
  });

  // Filtered Businesses
  const filteredBusinesses = businessesList.filter((b) => {
    return (
      b.name.toLowerCase().includes(businessSearch.toLowerCase()) ||
      (b.owner_email && b.owner_email.toLowerCase().includes(businessSearch.toLowerCase())) ||
      b.id.toLowerCase().includes(businessSearch.toLowerCase())
    );
  });

  if (isUnauthorized) return <NotFound />;
  if (!isAuthorized && loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium">Authorizing Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Admin Header */}
      <header className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                Super Admin Console
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-bold">
                  Live System
                </Badge>
                {isUsingCache && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] uppercase font-semibold">
                    ⚡ Fast Cache Active
                  </Badge>
                )}
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span>Platform metrics, user wallets, and custom email broadcasts</span>
                {lastUpdatedTime && (
                  <span className="text-[11px] text-muted-foreground/80 border-l border-border/60 pl-2">
                    Last updated: {formatDate(lastUpdatedTime)}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button size="sm" onClick={openBroadcastAllEmailModal} className="gap-2 font-semibold shadow-md">
              <Mail className="w-4 h-4" />
              Send Broadcast Email
            </Button>
            <Button size="sm" variant="outline" onClick={() => fetchAdminData(true)} disabled={loading} className="gap-2 font-medium">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Syncing..." : "Sync Live Data"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Key Platform Metric Highlights */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-elegant border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Users</p>
                <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{stats.totalUsers.toLocaleString()}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Registered accounts</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant border-border/60">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Wallet Balances</p>
                <h3 className="text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(stats.totalSystemBalance)}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Active credit funds in wallets</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant border-border/60">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Businesses</p>
                <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{stats.totalBusinesses.toLocaleString()}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Custom bot instances</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant border-border/60">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Messages Processed</p>
                <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{stats.totalMessages.toLocaleString()}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Across {stats.totalConversations} conversations</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Navigation Sections */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-muted/60 p-1 rounded-xl gap-1">
            <TabsTrigger value="users" className="font-semibold rounded-lg text-xs md:text-sm px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              Users & Credit Wallets ({usersList.length})
            </TabsTrigger>
            <TabsTrigger value="businesses" className="font-semibold rounded-lg text-xs md:text-sm px-4 py-2">
              <Building className="w-4 h-4 mr-2" />
              Businesses ({businessesList.length})
            </TabsTrigger>
            <TabsTrigger value="transactions" className="font-semibold rounded-lg text-xs md:text-sm px-4 py-2">
              <History className="w-4 h-4 mr-2" />
              Transaction Logs
            </TabsTrigger>
            <TabsTrigger value="overview" className="font-semibold rounded-lg text-xs md:text-sm px-4 py-2">
              <TrendingUp className="w-4 h-4 mr-2" />
              Plan Distribution
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: USERS & CREDIT WALLETS */}
          <TabsContent value="users" className="space-y-6">
            <Card className="shadow-elegant border-border/60">
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Registered Users & Credit Balances
                    </CardTitle>
                    <CardDescription>Inspect user accounts, wallet balances, grant credits, and email users</CardDescription>
                  </div>

                  {/* Search & Filters */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative w-64">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search name, email, ID..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="pl-9 h-9 text-xs"
                      />
                    </div>

                    <Select value={planFilter} onValueChange={setPlanFilter}>
                      <SelectTrigger className="w-36 h-9 text-xs">
                        <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                        <SelectValue placeholder="All Plans" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Plans</SelectItem>
                        <SelectItem value="free">Free Plan</SelectItem>
                        <SelectItem value="basic">Basic Plan</SelectItem>
                        <SelectItem value="pro">Pro Plan</SelectItem>
                        <SelectItem value="business">Business Plan</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button size="sm" variant="secondary" onClick={openBroadcastAllEmailModal} className="h-9 text-xs font-semibold gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      Email All Users
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="font-bold">User Details</TableHead>
                        <TableHead className="font-bold">Plan Tier</TableHead>
                        <TableHead className="font-bold">Credit Wallet Balance</TableHead>
                        <TableHead className="font-bold">Est. Messages Left</TableHead>
                        <TableHead className="font-bold">Joined Date</TableHead>
                        <TableHead className="font-bold text-right">Admin Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell>
                            <div>
                              <p className="font-bold text-sm text-foreground">{user.full_name || "Account User"}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                              <span className="text-[10px] text-muted-foreground font-mono">ID: {user.id.slice(0, 8)}...</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                user.plan === "pro"
                                  ? "bg-purple-500/10 text-purple-600 border-purple-500/20 font-semibold"
                                  : user.plan === "business"
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20 font-semibold"
                                  : "bg-muted text-muted-foreground font-medium"
                              }
                            >
                              {user.plan.toUpperCase()}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(user.balance)}
                            </span>
                          </TableCell>

                          <TableCell className="text-xs font-semibold text-primary">
                            ~{Math.max(0, Math.floor(user.balance / 0.005)).toLocaleString()} msgs
                          </TableCell>

                          <TableCell className="text-xs text-muted-foreground">{formatDate(user.created_at)}</TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openSingleUserEmailModal(user.email)}
                                className="h-8 text-xs font-semibold gap-1"
                              >
                                <Mail className="w-3.5 h-3.5 text-primary" />
                                Email
                              </Button>

                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  setSelectedUserForTopup(user);
                                  setTopupDialogOpen(true);
                                }}
                                className="h-8 text-xs font-semibold gap-1"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                Grant Credit
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}

                      {filteredUsers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                            No matching users found for "{userSearch}".
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: BUSINESSES */}
          <TabsContent value="businesses" className="space-y-6">
            <Card className="shadow-elegant border-border/60">
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Building className="w-5 h-5 text-primary" />
                      Registered Business Profiles
                    </CardTitle>
                    <CardDescription>Custom AI bot instances configured by users</CardDescription>
                  </div>

                  <div className="relative w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search business name or owner..."
                      value={businessSearch}
                      onChange={(e) => setBusinessSearch(e.target.value)}
                      className="pl-9 h-9 text-xs"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="font-bold">Business Name</TableHead>
                        <TableHead className="font-bold">Owner Account</TableHead>
                        <TableHead className="font-bold">Business ID</TableHead>
                        <TableHead className="font-bold">Created Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBusinesses.map((b) => (
                        <TableRow key={b.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-bold text-foreground text-sm">{b.name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground font-medium">{b.owner_email}</TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">{b.id}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDate(b.created_at)}</TableCell>
                        </TableRow>
                      ))}

                      {filteredBusinesses.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-sm">
                            No businesses registered yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: TRANSACTION LOGS */}
          <TabsContent value="transactions" className="space-y-6">
            <Card className="shadow-elegant border-border/60">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  System-Wide Transaction Log
                </CardTitle>
                <CardDescription>Real-time record of all deposits, bonuses, and usage deductions</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="font-bold">Timestamp</TableHead>
                        <TableHead className="font-bold">User Account</TableHead>
                        <TableHead className="font-bold">Transaction Type</TableHead>
                        <TableHead className="font-bold">Description</TableHead>
                        <TableHead className="font-bold text-right">Amount ($)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactionsList.map((tx) => {
                        const isPositive = tx.amount_usd > 0;
                        return (
                          <TableRow key={tx.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</TableCell>
                            <TableCell className="text-xs font-medium text-foreground">{tx.user_email}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  tx.type === "deposit"
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold"
                                    : tx.type === "starter_bonus"
                                    ? "bg-blue-500/10 text-blue-600 border-blue-500/20 font-semibold"
                                    : "bg-muted text-muted-foreground font-medium"
                                }
                              >
                                {tx.type.replace("_", " ").toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs font-medium">{tx.description}</TableCell>
                            <TableCell className={`text-right font-extrabold text-sm ${isPositive ? "text-emerald-600" : "text-foreground"}`}>
                              {isPositive ? `+${formatCurrency(tx.amount_usd)}` : formatCurrency(tx.amount_usd)}
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      {transactionsList.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                            No system transactions recorded yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: OVERVIEW & PLAN DISTRIBUTION */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-elegant border-border/60">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Subscription Tier Distribution
                  </CardTitle>
                  <CardDescription>Breakdown of active plan subscriptions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(stats.planCounts).map(([plan, count]) => (
                    <div key={plan} className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border/40">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span className="font-bold capitalize text-sm">{plan} Plan</span>
                      </div>
                      <Badge variant="secondary" className="font-extrabold text-sm px-3 py-1">
                        {count} user{count > 1 ? "s" : ""}
                      </Badge>
                    </div>
                  ))}
                  {Object.keys(stats.planCounts).length === 0 && (
                    <p className="text-muted-foreground text-center py-6 text-sm">No plan distributions recorded yet.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-elegant border-border/60">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    Deposit & Credit Summary
                  </CardTitle>
                  <CardDescription>Financial credit wallet overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Total Deposits Recorded</span>
                      <span className="text-2xl font-extrabold text-emerald-600">{formatCurrency(stats.totalDepositsAmount)}</span>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 opacity-80" />
                  </div>

                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Current User Balances</span>
                      <span className="text-2xl font-extrabold text-primary">{formatCurrency(stats.totalSystemBalance)}</span>
                    </div>
                    <Wallet className="w-8 h-8 text-primary opacity-80" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Admin Manual Wallet Topup Dialog Modal */}
      <Dialog open={topupDialogOpen} onOpenChange={setTopupDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-primary" />
              Grant Manual Wallet Credits
            </DialogTitle>
            <DialogDescription>
              Grant credits or issue a refund directly to <strong className="text-foreground">{selectedUserForTopup?.email}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div>
              <label className="font-bold text-foreground block mb-1">Select / Enter Amount ($)</label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[5, 10, 25, 50].map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    variant={topupAmount === amt ? "default" : "outline"}
                    onClick={() => setTopupAmount(amt)}
                    className="font-bold text-xs h-9"
                  >
                    ${amt}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                min="1"
                max="10000"
                value={topupAmount}
                onChange={(e) => setTopupAmount(parseFloat(e.target.value) || 0)}
                className="h-9"
              />
            </div>

            <div>
              <label className="font-bold text-foreground block mb-1">Credit Type</label>
              <Select value={topupType} onValueChange={setTopupType}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit / Topup</SelectItem>
                  <SelectItem value="starter_bonus">Starter Bonus</SelectItem>
                  <SelectItem value="refund">Refund / Credit Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="font-bold text-foreground block mb-1">Description / Reason</label>
              <Input
                value={topupDescription}
                onChange={(e) => setTopupDescription(e.target.value)}
                placeholder="e.g. Admin Promotional Credit"
                className="h-9"
              />
            </div>

            <div className="p-3 rounded-lg bg-muted/60 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Balance:</span>
                <span className="font-bold">{formatCurrency(selectedUserForTopup?.balance || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">New Balance After Grant:</span>
                <span className="font-extrabold text-emerald-600">
                  {formatCurrency((selectedUserForTopup?.balance || 0) + topupAmount)}
                </span>
              </div>
            </div>
          </div>

          <Button onClick={handleGrantCredit} disabled={isSubmittingTopup || topupAmount <= 0} className="w-full font-bold h-10">
            {isSubmittingTopup ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Granting Credits & Sending Email...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Confirm & Grant ${topupAmount.toFixed(2)} Credits
              </>
            )}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Broadcast Custom Email Modal */}
      <Dialog open={broadcastDialogOpen} onOpenChange={setBroadcastDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              {broadcastTarget === "all" ? "Send Broadcast Email to All Users" : "Send Custom Email"}
            </DialogTitle>
            <DialogDescription>
              {broadcastTarget === "all"
                ? `Compose and send an email update to all ${usersList.length} registered users.`
                : `Send a custom email directly to ${broadcastRecipientEmail}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div>
              <label className="font-bold text-foreground block mb-1">Recipient Target</label>
              <Select
                value={broadcastTarget}
                onValueChange={(val: "all" | "single") => {
                  setBroadcastTarget(val);
                  if (val === "single" && !broadcastRecipientEmail && usersList.length > 0) {
                    setBroadcastRecipientEmail(usersList[0].email);
                  }
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📢 All Users Broadcast ({usersList.length} recipients)</SelectItem>
                  <SelectItem value="single">👤 Single User Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {broadcastTarget === "single" && (
              <div>
                <label className="font-bold text-foreground block mb-1">Recipient Email Address</label>
                <Input
                  type="email"
                  value={broadcastRecipientEmail}
                  onChange={(e) => setBroadcastRecipientEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="h-9"
                />
              </div>
            )}

            <div>
              <label className="font-bold text-foreground block mb-1">Email Subject Line</label>
              <Input
                value={broadcastSubject}
                onChange={(e) => setBroadcastSubject(e.target.value)}
                placeholder="e.g. Upgrade Announcement: Pay-As-You-Go & Full Access"
                className="h-9 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-foreground block mb-1">Email Message Body</label>
              <Textarea
                rows={7}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Write your email announcement message here..."
                className="text-xs leading-relaxed font-sans"
              />
            </div>

            {sendingProgress && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center font-semibold text-primary">
                <RefreshCw className="w-4 h-4 inline-block mr-2 animate-spin" />
                {sendingProgress}
              </div>
            )}
          </div>

          <Button
            onClick={handleSendCustomEmailBroadcast}
            disabled={isSendingBroadcast || !broadcastSubject.trim() || !broadcastMessage.trim()}
            className="w-full font-bold h-10 gap-2"
          >
            {isSendingBroadcast ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sending Broadcast Email...
              </>
            ) : (
              <>
                <SendHorizontal className="w-4 h-4" />
                {broadcastTarget === "all" ? `Send Broadcast to ${usersList.length} Users` : `Send Email to ${broadcastRecipientEmail}`}
              </>
            )}
          </Button>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}
