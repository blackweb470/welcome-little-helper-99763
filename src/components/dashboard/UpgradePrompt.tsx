import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Check, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpgradePromptProps {
  open: boolean;
  onClose: () => void;
  featureName: string;
  requiredPlan: string;
  currentPlan: string;
}

const paygFeatures = [
  'All AI Learning & Document Training',
  'Live Agent Transfer & Proactive Chat Rules',
  'Website Crawler & Deep Knowledge Search',
  'Advanced Visitor Tracking & Analytics',
  'WhatsApp & Custom Integrations',
];

export const UpgradePrompt = ({ open, onClose, featureName }: UpgradePromptProps) => {
  const navigate = useNavigate();

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <AlertDialogTitle>Top Up Wallet Credits</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-4">
            <p>
              To access <strong>{featureName}</strong>, please top up your Pay-As-You-Go credit wallet.
            </p>
            
            <div className="bg-muted/50 rounded-xl p-4 space-y-3 border border-border/50">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Pay-As-You-Go Credit Wallet</span>
                <Badge variant="default" className="bg-primary">$0.005 / AI msg</Badge>
              </div>
              
              <div className="space-y-2 pt-1">
                {paygFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs">
                    <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Funds never expire. Deposit $5.00 to receive ~1,000 AI responses.</span>
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>
            Maybe Later
          </Button>
          <Button onClick={() => {
            onClose();
            navigate('/dashboard?tab=billing');
          }}>
            Deposit Credits Now
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
