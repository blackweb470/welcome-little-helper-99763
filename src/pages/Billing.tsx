import { ArrowLeft, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { WalletManager } from "@/components/billing/WalletManager";

const Billing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
                className="rounded-full"
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Credit Wallet & Billing</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="space-y-2 mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Pay-As-You-Go Credit Wallet</h1>
          <p className="text-muted-foreground">
            Manage your credit balance, top up funds, and view AI message usage logs.
          </p>
        </div>

        <WalletManager />
      </main>
    </div>
  );
};

export default Billing;
