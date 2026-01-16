import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, ExternalLink, Check, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ContinueOnWhatsAppProps {
  businessId: string;
  conversationContext?: string;
  primaryColor?: string;
}

export const ContinueOnWhatsApp = ({ 
  businessId, 
  conversationContext,
  primaryColor = "#6366f1" 
}: ContinueOnWhatsAppProps) => {
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchWhatsAppSettings = async () => {
      try {
        // Fetch WhatsApp settings for this business (only public fields needed)
        const { data, error } = await supabase
          .from("whatsapp_settings")
          .select("phone_number, enabled")
          .eq("business_id", businessId)
          .eq("enabled", true)
          .maybeSingle();

        if (error) {
          console.error("Error fetching WhatsApp settings:", error);
          return;
        }

        if (data?.phone_number && data.enabled) {
          setWhatsappNumber(data.phone_number);
          setIsEnabled(true);
        }
      } catch (error) {
        console.error("Error fetching WhatsApp settings:", error);
      }
    };

    fetchWhatsAppSettings();
  }, [businessId]);

  if (!isEnabled || !whatsappNumber) {
    return null;
  }

  // Clean the phone number (remove spaces, dashes, etc.)
  const cleanPhone = whatsappNumber.replace(/[^\d+]/g, "").replace(/^\+/, "");
  
  // Create a welcome message for WhatsApp
  const welcomeMessage = conversationContext 
    ? `Hi! I was chatting on your website and wanted to continue our conversation here.`
    : `Hi! I'd like to chat with you.`;
  
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(welcomeMessage)}`;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(whatsappNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    window.open(whatsappUrl, "_blank");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-[10px] sm:text-xs gap-1.5 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-3.5 h-3.5 fill-current"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          Continue on WhatsApp
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 fill-green-600"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Continue on WhatsApp
          </DialogTitle>
          <DialogDescription>
            You can continue this conversation on WhatsApp for a more convenient mobile experience.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-3 border">
            <p className="text-sm text-muted-foreground mb-2">WhatsApp Number:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-background px-3 py-2 rounded text-sm font-mono">
                {whatsappNumber}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyNumber}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> When you message us on WhatsApp, our AI assistant will help answer your questions. This is for customer support only.
            </p>
          </div>

          <Button
            onClick={handleOpenWhatsApp}
            className="w-full gap-2"
            style={{ backgroundColor: "#25D366" }}
          >
            <ExternalLink className="h-4 w-4" />
            Open WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
