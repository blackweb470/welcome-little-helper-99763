import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Check } from "lucide-react";

interface UpgradePromptProps {
  open: boolean;
  onClose: () => void;
  featureName: string;
  requiredPlan: string;
  currentPlan: string;
}

const planPrices: { [key: string]: string } = {
  basic: '$9.99/month',
  pro: '$29.99/month',
  business: '$99.99/month',
};

const planFeatures: { [key: string]: string[] } = {
  basic: [
    '3 Businesses',
    'Pre-Chat Forms',
    'Canned Responses',
    'Basic Analytics',
    'Email Notifications',
  ],
  pro: [
    '10 Businesses',
    'Live Agent Transfer',
    'Advanced Analytics',
    'Sentiment Analysis',
    'Voice Chat',
    'Product Catalog',
  ],
  business: [
    'Unlimited Businesses',
    'AI Learning',
    'Business Documents',
    'Advanced Tracking',
    'Custom Integrations',
    'API Access',
  ],
};

export const UpgradePrompt = ({ open, onClose, featureName, requiredPlan, currentPlan }: UpgradePromptProps) => {
  const planName = requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1);
  const price = planPrices[requiredPlan] || '';
  const features = planFeatures[requiredPlan] || [];

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-6 h-6 text-primary" />
            <AlertDialogTitle>Upgrade to {planName}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-4">
            <p>
              <strong>{featureName}</strong> is available in the <strong>{planName} Plan</strong>.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{planName} Plan</span>
                <Badge variant="default">{price}</Badge>
              </div>
              
              <div className="space-y-2">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              You're currently on the <strong>{currentPlan}</strong> plan.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>
            Maybe Later
          </Button>
          <Button onClick={() => {
            // TODO: Implement upgrade flow
            alert('Upgrade functionality will be implemented with payment integration');
            onClose();
          }}>
            Upgrade Now
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
