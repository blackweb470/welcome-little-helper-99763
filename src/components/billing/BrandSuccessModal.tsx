import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Zap, ArrowRight, ShieldCheck } from "lucide-react";

interface BrandSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  amount?: number;
  balance: number;
  estimatedMessages?: number;
  brandColor?: string;
  onClose?: () => void;
}

export const BrandSuccessModal = ({
  open,
  onOpenChange,
  title = "Deposit Successful!",
  description = "Your credit wallet has been topped up successfully. Funds are active immediately with no expiration date.",
  amount,
  balance,
  estimatedMessages,
  brandColor,
  onClose,
}: BrandSuccessModalProps) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(val);
  };

  const handleClose = () => {
    onOpenChange(false);
    if (onClose) onClose();
  };

  // Dynamic custom brand color style overrides if provided
  const customColorStyle = brandColor ? { color: brandColor } : {};
  const customBgStyle = brandColor ? { backgroundColor: `${brandColor}15`, borderColor: `${brandColor}30` } : {};
  const customButtonStyle = brandColor ? { backgroundColor: brandColor } : {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden border-primary/20 bg-card/95 backdrop-blur-xl shadow-2xl transition-all duration-300">
        {/* Background ambient glow effect */}
        <div
          className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none"
          style={brandColor ? { backgroundColor: `${brandColor}20` } : {}}
        />
        <div
          className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none"
          style={brandColor ? { backgroundColor: `${brandColor}20` } : {}}
        />

        <DialogHeader className="pt-2 flex flex-col items-center text-center relative z-10">
          {/* Animated Brand Halo Icon Badge */}
          <div className="relative mb-4 flex items-center justify-center">
            <div
              className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg animate-pulse"
              style={customBgStyle}
            >
              <div
                className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-inner"
                style={brandColor ? { backgroundColor: `${brandColor}30`, color: brandColor } : {}}
              >
                <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
              </div>
            </div>
          </div>

          {/* Brand Eyebrow Tag */}
          <Badge
            variant="outline"
            className="mb-2 bg-primary/5 text-primary border-primary/20 px-3 py-0.5 text-[11px] uppercase tracking-wider font-semibold"
            style={customBgStyle}
          >
            <ShieldCheck className="w-3 h-3 mr-1 inline-block" />
            Transaction Confirmed
          </Badge>

          {/* Modal Title */}
          <DialogTitle className="text-2xl font-extrabold tracking-tight text-foreground flex items-center justify-center gap-2">
            <span
              className="bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent"
              style={customColorStyle}
            >
              {title} 🎉
            </span>
          </DialogTitle>

          {/* Description */}
          <DialogDescription className="text-sm pt-1.5 text-muted-foreground leading-relaxed max-w-sm">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Structured Balance Card */}
        <div className="my-5 p-5 rounded-2xl bg-muted/40 border border-border/60 backdrop-blur-sm relative z-10 space-y-3">
          {amount && amount > 0 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border/40">
              <span className="font-medium">Added to Wallet:</span>
              <span className="font-bold text-foreground text-sm">+{formatCurrency(amount)}</span>
            </div>
          )}

          <div className="text-center space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block">
              Updated Available Balance
            </span>
            <span
              className="text-4xl font-extrabold tracking-tight text-primary block py-1"
              style={customColorStyle}
            >
              {formatCurrency(balance)}
            </span>
          </div>

          {estimatedMessages !== undefined && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-border/40">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                <strong className="text-foreground">~{estimatedMessages.toLocaleString()}</strong> AI message responses available
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="relative z-10 space-y-2">
          <Button
            onClick={handleClose}
            className="w-full font-bold h-11 text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all group"
            style={customButtonStyle}
          >
            Continue to Dashboard
            <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
