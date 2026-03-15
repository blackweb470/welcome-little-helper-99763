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
  Phone,
  Key,
  Zap,
  XCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { QRCodeSVG } from "qrcode.react";

interface WhatsAppSettingsProps {
  businessId: string;
}

export const WhatsAppSettings = ({ businessId }: WhatsAppSettingsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const webhookUrl = `https://rgczbabidcqvpyiiqjfv.supabase.co/functions/v1/whatsapp-webhook`;

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
      }
      
      return data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: {
      phone_number_id: string;
      access_token: string;
      phone_number: string;
      enabled: boolean;
    }) => {
      if (settings?.id) {
        const updateData: any = {
          phone_number_id: data.phone_number_id,
          phone_number: data.phone_number,
          enabled: data.enabled,
        };
        if (data.access_token) {
          updateData.access_token = data.access_token;
        }
        const { error } = await supabase
          .from('whatsapp_settings')
          .update(updateData)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('whatsapp_settings')
          .insert({
            business_id: businessId,
            phone_number_id: data.phone_number_id,
            access_token: data.access_token,
            phone_number: data.phone_number,
            enabled: data.enabled,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Settings saved", description: "WhatsApp integration configured successfully" });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-settings', businessId] });
      setAccessToken("");
    },
    onError: (error: any) => {
      toast({ title: "Error saving settings", description: error.message, variant: "destructive" });
    }
  });

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

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      if (!settings) throw new Error("Please save your settings first");
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${settings.phone_number_id}`,
        { headers: { 'Authorization': `Bearer ${settings.access_token}` } }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to connect to WhatsApp API");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      setTestResult({ success: true, message: `Connected! Phone: ${data.display_phone_number || data.verified_name || "Verified"}` });
      toast({ title: "Connection successful!", description: "Your WhatsApp integration is working correctly" });
    },
    onError: (error: any) => {
      setTestResult({ success: false, message: error.message });
      toast({ title: "Connection failed", description: error.message, variant: "destructive" });
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
    if (!phoneNumber) {
      toast({ title: "Error", description: "Phone number is required", variant: "destructive" });
      return;
    }
    if (!settings && !accessToken) {
      toast({ title: "Error", description: "Access Token is required", variant: "destructive" });
      return;
    }
    setTestResult(null);
    saveMutation.mutate({
      phone_number_id: phoneNumberId,
      access_token: accessToken,
      phone_number: phoneNumber,
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

  const cleanPhone = phoneNumber?.replace(/[^\d+]/g, "").replace(/^\+/, "");
  const whatsappLink = cleanPhone ? `https://wa.me/${cleanPhone}` : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>WhatsApp Integration</CardTitle>
                <CardDescription>
                  Let your customers reach you on WhatsApp
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

      {/* Simple Setup - 2 fields only */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {settings ? "Update Credentials" : "Connect WhatsApp"}
          </CardTitle>
          <CardDescription>
            Enter your WhatsApp Business phone number and API credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone_number" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              WhatsApp Business Phone Number *
            </Label>
            <Input
              id="phone_number"
              placeholder="e.g., +1 555-123-4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Your WhatsApp business number that customers will message
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number_id" className="flex items-center gap-2">
              Phone Number ID *
            </Label>
            <Input
              id="phone_number_id"
              placeholder="e.g., 123456789012345"
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Found in your Meta Business Suite → WhatsApp → API Setup
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="access_token" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Access Token {settings ? "(leave blank to keep existing)" : "*"}
            </Label>
            <div className="flex gap-2">
              <Input
                id="access_token"
                type={showToken ? "text" : "password"}
                placeholder={settings ? "••••••••••••••••" : "Enter your access token"}
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={() => setShowToken(!showToken)}>
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              From Meta Business Suite → System Users → Generate Token
            </p>
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

      {/* Webhook Config - shown after saving */}
      {settings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Webhook Setup</CardTitle>
            <CardDescription>
              Copy these values into your Meta Business Suite → WhatsApp → Configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Callback URL</Label>
              <div className="flex gap-2">
                <Input value={webhookUrl} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={() => handleCopy(webhookUrl, "Webhook URL")}>
                  {copied === "Webhook URL" ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Verify Token</Label>
              <div className="flex gap-2">
                <Input value={settings.verify_token} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={() => handleCopy(settings.verify_token, "Verify Token")}>
                  {copied === "Verify Token" ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Make sure to subscribe to the <strong>messages</strong> webhook field
            </p>
          </CardContent>
        </Card>
      )}

      {/* QR Code & Connection Status */}
      {settings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Connection & QR Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${settings.enabled ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
              <div>
                <p className="font-medium">
                  {settings.enabled ? "WhatsApp Active" : "WhatsApp Disabled"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {settings.phone_number || `ID: ${settings.phone_number_id}`}
                </p>
              </div>
            </div>

            {testResult && (
              <Alert variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <AlertTitle>{testResult.success ? "Connection Verified" : "Connection Failed"}</AlertTitle>
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}

            <Button
              variant="outline"
              onClick={() => testConnectionMutation.mutate()}
              disabled={testConnectionMutation.isPending}
              className="w-full"
            >
              {testConnectionMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Test Connection
            </Button>

            {/* QR Code for customers */}
            {whatsappLink && settings.enabled && (
              <div className="border border-border rounded-lg p-6 text-center space-y-3">
                <p className="text-sm font-medium">Customer QR Code</p>
                <p className="text-xs text-muted-foreground">
                  Visitors can scan this to start a WhatsApp conversation with you
                </p>
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-lg inline-block">
                    <QRCodeSVG
                      value={whatsappLink}
                      size={160}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{settings.phone_number}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WhatsAppSettings;
