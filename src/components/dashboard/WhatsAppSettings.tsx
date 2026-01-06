import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageCircle, 
  Copy, 
  CheckCircle, 
  Loader2, 
  ExternalLink,
  Phone,
  Key,
  Shield,
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface WhatsAppSettingsProps {
  businessId: string;
}

export const WhatsAppSettings = ({ businessId }: WhatsAppSettingsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const webhookUrl = `https://rgczbabidcqvpyiiqjfv.supabase.co/functions/v1/whatsapp-webhook`;

  // Fetch existing settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['whatsapp-settings', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_settings')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setPhoneNumberId(data.phone_number_id || "");
        setPhoneNumber(data.phone_number || "");
        setWabaId(data.waba_id || "");
        // Don't expose the actual token, just show it's configured
      }
      
      return data;
    }
  });

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (data: {
      phone_number_id: string;
      access_token: string;
      phone_number: string;
      waba_id: string;
      enabled: boolean;
    }) => {
      if (settings?.id) {
        // Update existing
        const updateData: any = {
          phone_number_id: data.phone_number_id,
          phone_number: data.phone_number,
          waba_id: data.waba_id,
          enabled: data.enabled,
        };
        
        // Only update token if a new one is provided
        if (data.access_token) {
          updateData.access_token = data.access_token;
        }

        const { error } = await supabase
          .from('whatsapp_settings')
          .update(updateData)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('whatsapp_settings')
          .insert({
            business_id: businessId,
            phone_number_id: data.phone_number_id,
            access_token: data.access_token,
            phone_number: data.phone_number,
            waba_id: data.waba_id,
            enabled: data.enabled,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Settings saved", description: "WhatsApp integration configured successfully" });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-settings', businessId] });
      setAccessToken(""); // Clear token field after save
    },
    onError: (error: any) => {
      toast({ 
        title: "Error saving settings", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Toggle enabled mutation
  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase
        .from('whatsapp_settings')
        .update({ enabled })
        .eq('id', settings?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-settings', businessId] });
      toast({ title: "Status updated" });
    }
  });

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: "Copied!", description: `${type} copied to clipboard` });
  };

  const handleSave = () => {
    if (!phoneNumberId) {
      toast({ title: "Error", description: "Phone Number ID is required", variant: "destructive" });
      return;
    }
    if (!settings && !accessToken) {
      toast({ title: "Error", description: "Access Token is required", variant: "destructive" });
      return;
    }

    saveMutation.mutate({
      phone_number_id: phoneNumberId,
      access_token: accessToken,
      phone_number: phoneNumber,
      waba_id: wabaId,
      enabled: true
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>WhatsApp Business Integration</CardTitle>
                <CardDescription>
                  Connect your WhatsApp Business account to receive and respond to messages
                </CardDescription>
              </div>
            </div>
            {settings && (
              <div className="flex items-center gap-2">
                <Badge variant={settings.enabled ? "default" : "secondary"}>
                  {settings.enabled ? "Active" : "Inactive"}
                </Badge>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => toggleMutation.mutate(checked)}
                />
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Before you begin</AlertTitle>
            <AlertDescription>
              You need a Meta Business account and WhatsApp Business API access. 
              <a 
                href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-1 text-primary hover:underline inline-flex items-center gap-1"
              >
                View setup guide <ExternalLink className="w-3 h-3" />
              </a>
            </AlertDescription>
          </Alert>

          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Create a Meta Business App with WhatsApp Business API</li>
            <li>Set up a WhatsApp Business Account (WABA)</li>
            <li>Get your Phone Number ID and Access Token from the Meta Developer Console</li>
            <li>Configure the webhook URL and verify token in Meta</li>
            <li>Start receiving messages!</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Webhook Configuration</CardTitle>
          <CardDescription>
            Configure these values in your Meta Developer Console under WhatsApp → Configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Callback URL</Label>
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(webhookUrl, "Webhook URL")}
              >
                {copied === "Webhook URL" ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Verify Token</Label>
            <div className="flex gap-2">
              <Input 
                value={settings?.verify_token || "Configure settings first"} 
                readOnly 
                className="font-mono text-sm"
              />
              {settings?.verify_token && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(settings.verify_token, "Verify Token")}
                >
                  {copied === "Verify Token" ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          <Alert variant="default">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Subscribe to <strong>messages</strong> webhook field in Meta Developer Console
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">API Credentials</CardTitle>
          <CardDescription>
            Enter your WhatsApp Business API credentials from Meta Developer Console
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone_number_id" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number ID *
              </Label>
              <Input
                id="phone_number_id"
                placeholder="e.g., 123456789012345"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Found in WhatsApp → API Setup in Meta Developer Console
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Display Phone Number</Label>
              <Input
                id="phone_number"
                placeholder="e.g., +1 555-123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Your WhatsApp business phone number for display
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="access_token" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Access Token {settings ? "(leave blank to keep existing)" : "*"}
            </Label>
            <Input
              id="access_token"
              type="password"
              placeholder={settings ? "••••••••••••••••" : "Enter your permanent access token"}
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Generate a permanent token in Meta Business Settings → System Users
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="waba_id">WhatsApp Business Account ID (optional)</Label>
            <Input
              id="waba_id"
              placeholder="e.g., 123456789012345"
              value={wabaId}
              onChange={(e) => setWabaId(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleSave} 
            disabled={saveMutation.isPending}
            className="w-full"
          >
            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {settings ? "Update Settings" : "Save & Enable WhatsApp"}
          </Button>
        </CardContent>
      </Card>

      {settings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${settings.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
              <div>
                <p className="font-medium">
                  {settings.enabled ? "WhatsApp Integration Active" : "WhatsApp Integration Disabled"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {settings.phone_number || `Phone Number ID: ${settings.phone_number_id}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WhatsAppSettings;
