import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  ShieldCheck,
  Zap,
  RefreshCw,
  Trash2
} from 'lucide-react';
import WhatsAppQR from '@/components/dashboard/WhatsAppQR'; // QR Code generator component

// Declare FB global for TypeScript
declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

export const WhatsAppSettings = ({ businessId }: { businessId: string }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [isEnabled, setIsEnabled] = useState(false);

  // Meta App Config from environment
  const META_APP_ID = import.meta.env.VITE_META_APP_ID;
  const CONFIG_ID = import.meta.env.VITE_WHATSAPP_CONFIG_ID || "991663860045736";

  useEffect(() => {
    fetchSettings();
    loadFacebookSDK();
  }, [businessId]);

  const loadFacebookSDK = () => {
    if (window.FB) return;
    if (!META_APP_ID) {
      console.error('Meta App ID is missing. Check your environment variables.');
      return;
    }

    window.fbAsyncInit = function() {
      window.FB.init({
        appId: META_APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v21.0'
      });
    };

    // Load script
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s) as HTMLScriptElement; js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      if (fjs && fjs.parentNode) {
        fjs.parentNode.insertBefore(js, fjs);
      }
    }(document, 'script', 'facebook-jssdk'));
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('whatsapp_settings')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();

      if (error) throw error;
      
      setSettings(data);
      setIsEnabled(data?.enabled || false);
    } catch (error: any) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const launchWhatsAppSignup = () => {
    if (!window.FB) {
      toast({
        variant: "destructive",
        title: "SDK Not Loaded",
        description: "Facebook SDK is still loading. Please wait a moment and try again."
      });
      return;
    }

    setConnecting(true);

    window.FB.login((response: any) => {
      if (response.authResponse) {
        const code = response.authResponse.code;
        handleSignupResponse(code);
      } else {
        setConnecting(false);
        toast({
          variant: "destructive",
          title: "Connection Cancelled",
          description: "The WhatsApp connection process was cancelled."
        });
      }
    }, {
      config_id: CONFIG_ID,
      response_type: 'code',
      override_default_response_type: true,
      scope: 'whatsapp_business_management,whatsapp_business_messaging',
      extras: {
        setup: {},
        featureType: '',
        sessionInfoVersion: '3',
      }
    });
  };

  const [isManualMode, setIsManualMode] = useState(false);
  const [manualSettings, setManualSettings] = useState({
    phone_number_id: '',
    waba_id: '',
    access_token: '',
    phone_number: ''
  });

  const handleSignupResponse = async (code: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-embedded-signup', {
        body: { 
          businessId, 
          code 
        },
      });

      if (error) {
        let serverErrorMsg = error.message;
        try {
          if (error.context && typeof error.context.json === 'function') {
            const errBody = await error.context.json();
            serverErrorMsg = errBody.error || serverErrorMsg;
          }
        } catch (e) {}
        throw new Error(serverErrorMsg);
      }

      toast({
        title: "WhatsApp Connected!",
        description: `Successfully connected ${data.phoneNumber || 'your number'}. Your bot is now ready.`,
      });
      
      fetchSettings();
    } catch (error: any) {
      console.error('Error in signup callback:', error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error.message || "Failed to finalize WhatsApp connection.",
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleManualSave = async () => {
    if (!manualSettings.phone_number_id || !manualSettings.access_token || !manualSettings.phone_number) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in the Phone Number ID, Access Token, and Phone Number."
      });
      return;
    }

    setConnecting(true);
    try {
      const { error } = await supabase
        .from('whatsapp_settings')
        .upsert({
          business_id: businessId,
          phone_number_id: manualSettings.phone_number_id,
          waba_id: manualSettings.waba_id,
          access_token: manualSettings.access_token,
          phone_number: manualSettings.phone_number,
          enabled: true,
          display_name: 'Manual Connection'
        });

      if (error) throw error;

      toast({
        title: "WhatsApp Connected Manually!",
        description: "Your settings have been saved successfully.",
      });
      
      fetchSettings();
    } catch (error: any) {
      console.error('Error saving manual settings:', error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error.message
      });
    } finally {
      setConnecting(false);
    }
  };

  const toggleEnabled = async (checked: boolean) => {
    try {
      const { error } = await supabase
        .from('whatsapp_settings')
        .update({ enabled: checked })
        .eq('business_id', businessId);

      if (error) throw error;
      setIsEnabled(checked);
      toast({
        title: checked ? "WhatsApp Enabled" : "WhatsApp Disabled",
        description: checked ? "Your bot is now listening for messages." : "Your bot is now offline.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    }
  };

  const disconnectWhatsApp = async () => {
    if (!confirm("Are you sure you want to disconnect WhatsApp? Your bot will stop responding to customers.")) return;

    try {
      const { error } = await supabase
        .from('whatsapp_settings')
        .delete()
        .eq('business_id', businessId);

      if (error) throw error;
      setSettings(null);
      setIsEnabled(false);
      toast({
        title: "WhatsApp Disconnected",
        description: "The connection has been removed.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Disconnect Failed",
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5 overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <MessageSquare className="h-32 w-32 rotate-12" />
        </div>
        
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                WhatsApp Integration
                {settings ? (
                  <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">Not Connected</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Connect your business WhatsApp number to provide AI-powered customer service 24/7.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {!settings ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center">
              <div className="bg-primary/10 p-4 rounded-full">
                <Smartphone className="h-12 w-12 text-primary" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-xl font-semibold">Connect in Seconds</h3>
                <p className="text-muted-foreground text-sm">
                  Choose your preferred connection method. The official popup is fastest, but manual setup is available for developers.
                </p>
              </div>

              {!isManualMode ? (
                <Button 
                  size="lg" 
                  onClick={launchWhatsAppSignup} 
                  disabled={connecting}
                  className="px-8 shadow-lg shadow-primary/20 gap-2 font-semibold text-lg h-14 bg-gradient-to-r from-primary to-primary/80 hover:scale-105 transition-transform"
                >
                  {connecting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Zap className="h-5 w-5 fill-current" />
                  )}
                  {connecting ? "Connecting..." : "Connect WhatsApp Now"}
                </Button>
              ) : (
                <div className="w-full max-w-lg space-y-4 bg-muted/30 p-6 rounded-2xl border border-border animate-in fade-in slide-in-from-bottom-4">
                  <div className="grid grid-cols-1 gap-4 text-left">
                    <div className="space-y-2">
                      <Label htmlFor="phone_number_id">Phone Number ID</Label>
                      <Input 
                        id="phone_number_id" 
                        placeholder="e.g. 123456789012345" 
                        value={manualSettings.phone_number_id}
                        onChange={(e) => setManualSettings({...manualSettings, phone_number_id: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="waba_id">WhatsApp Business Account ID</Label>
                      <Input 
                        id="waba_id" 
                        placeholder="e.g. 987654321098765" 
                        value={manualSettings.waba_id}
                        onChange={(e) => setManualSettings({...manualSettings, waba_id: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="access_token">Permanent Access Token</Label>
                      <Input 
                        id="access_token" 
                        type="password"
                        placeholder="EAAB..." 
                        value={manualSettings.access_token}
                        onChange={(e) => setManualSettings({...manualSettings, access_token: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone_number">Display Phone Number</Label>
                      <Input 
                        id="phone_number" 
                        placeholder="e.g. +1 234 567 890" 
                        value={manualSettings.phone_number}
                        onChange={(e) => setManualSettings({...manualSettings, phone_number: e.target.value})}
                      />
                    </div>
                  </div>
                  <Button 
                    className="w-full h-12 text-lg font-semibold"
                    onClick={handleManualSave}
                    disabled={connecting}
                  >
                    {connecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Configuration"}
                  </Button>
                </div>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsManualMode(!isManualMode)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {isManualMode ? "← Back to Automatic Setup" : "Developer? Use Manual Configuration"}
              </Button>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-8">
                <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-background/50 border border-border">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Official API</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-background/50 border border-border">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-medium">Instant Setup</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-background/50 border border-border">
                  <RefreshCw className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">Auto-Sync</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-background/50 border border-border">
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Phone Number</Label>
                      <p className="text-lg font-mono font-bold">{settings.phone_number || "Verified Number"}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Display Name</Label>
                      <p className="text-lg font-bold">{settings.display_name || "Official Account"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="space-y-0.5">
                      <Label className="text-base font-semibold">Enable Bot Responses</Label>
                      <p className="text-sm text-muted-foreground">Turn this off to pause the AI from replying to messages.</p>
                    </div>
                    <Switch 
                      checked={isEnabled} 
                      onCheckedChange={toggleEnabled} 
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                </div>

                <div className="w-full md:w-auto flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 border border-white/10">
                  <WhatsAppQR phoneNumber={settings.phone_number} size={140} />
                  <p className="mt-2 text-xs text-center text-muted-foreground">Scan to test your bot</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-destructive hover:bg-destructive/10 border-destructive/20"
                  onClick={disconnectWhatsApp}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Disconnect Account
                </Button>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3 w-3 text-green-500" />
                  Connected via Meta Tech Provider (LYQN)
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              How it works
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Your bot uses the official WhatsApp Cloud API.</p>
            <p>• Conversations are free if you reply within 24 hours.</p>
            <p>• You can upload PDFs or FAQs in the "Knowledge Base" tab to train your AI.</p>
            <p>• Complex questions are automatically routed to your live agent dashboard.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-purple-500" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2">
            <Button variant="link" className="justify-start p-0 h-auto" asChild>
              <a href="#" target="_blank">View WhatsApp Business Policy</a>
            </Button>
            <Button variant="link" className="justify-start p-0 h-auto" asChild>
              <a href="#" target="_blank">How to verify your business</a>
            </Button>
            <Button variant="link" className="justify-start p-0 h-auto" asChild>
              <a href="#" target="_blank">Setting up Greeting Messages</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WhatsAppSettings;
