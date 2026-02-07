import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Check, Copy, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ContinueOnWhatsAppProps {
  businessId: string;
  conversationId?: string | null;
  primaryColor?: string;
}

// Generate a short unique link code
const generateLinkCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const ContinueOnWhatsApp = ({ 
  businessId, 
  conversationId,
  primaryColor = "#6366f1" 
}: ContinueOnWhatsAppProps) => {
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [creatingLink, setCreatingLink] = useState(false);

  useEffect(() => {
    const fetchWhatsAppSettings = async () => {
      try {
        // Use the secure RPC function to get public WhatsApp info
        // This avoids exposing access_token via direct table query
        const { data, error } = await supabase
          .rpc("get_whatsapp_public_info", { p_business_id: businessId });

        if (error) {
          console.error("Error fetching WhatsApp settings:", error);
          return;
        }

        if (data && data.length > 0 && data[0].phone_number && data[0].enabled) {
          setWhatsappNumber(data[0].phone_number);
          setIsEnabled(true);
        }
      } catch (error) {
        console.error("Error fetching WhatsApp settings:", error);
      }
    };

    fetchWhatsAppSettings();
  }, [businessId]);

  // Create a conversation link when dialog opens
  const createConversationLink = async () => {
    if (!conversationId) {
      console.log("No conversation to link");
      return null;
    }

    setCreatingLink(true);
    try {
      const code = generateLinkCode();
      
      const { data, error } = await supabase
        .from("conversation_links")
        .insert({
          link_code: code,
          source_conversation_id: conversationId,
          business_id: businessId,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating conversation link:", error);
        toast.error("Failed to create conversation link");
        return null;
      }

      setLinkCode(code);
      return code;
    } catch (error) {
      console.error("Error creating conversation link:", error);
      return null;
    } finally {
      setCreatingLink(false);
    }
  };

  const handleOpenDialog = async () => {
    setIsOpen(true);
    if (conversationId && !linkCode) {
      await createConversationLink();
    }
  };

  if (!isEnabled || !whatsappNumber) {
    return null;
  }

  // Clean the phone number
  const cleanPhone = whatsappNumber.replace(/[^\d+]/g, "").replace(/^\+/, "");
  
  // Create welcome message with link code if available
  const welcomeMessage = linkCode 
    ? `Hi! I was chatting on your website and wanted to continue here. My chat code is: ${linkCode}`
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
          onClick={handleOpenDialog}
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
            Continue this conversation on WhatsApp. Your chat history will be available to assist you.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {creatingLink ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Preparing your conversation...</span>
            </div>
          ) : (
            <>
              {linkCode && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-xs text-green-800 dark:text-green-200 mb-2">
                    <strong>Your Chat Code:</strong>
                  </p>
                  <code className="block bg-white dark:bg-background px-3 py-2 rounded text-lg font-mono font-bold text-center tracking-widest">
                    {linkCode}
                  </code>
                  <p className="text-[10px] text-green-700 dark:text-green-300 mt-2 text-center">
                    This code links your conversation history
                  </p>
                </div>
              )}

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

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Tip:</strong> Click "Open WhatsApp" to automatically include your chat code. Our assistant will recognize you and continue where you left off!
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
