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
  Trash2,
  Lock
} from 'lucide-react';
import WhatsAppQR from '@/components/dashboard/WhatsAppQR';

// Declare FB global for Meta Embedded Signup SDK
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
  
  // SDK States for Meta
  const [sdkStatus, setSdkStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [metaAppId, setMetaAppId] = useState<string>('2143263399800980');
  const [metaConfigId, setMetaConfigId] = useState<string>('991663860045736');
  
  // Connection validation inputs
  const [testLoading, setTestLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  
  const [manualSettings, setManualSettings] = useState({
    phone_number_id: '',
    waba_id: '',
    access_token: '',
    phone_number: ''
  });

  // Fetch Meta App ID & Config ID from platform_settings or env
  useEffect(() => {
    const loadPlatformMetaConfig = async () => {
      try {
        const { data, error } = await (supabase
          .from('platform_settings' as any)
          .select('key, value') as any);
        
        let appId = import.meta.env.VITE_META_APP_ID || '2143263399800980';
        let configId = import.meta.env.VITE_META_CONFIG_ID || '991663860045736';

        if (!error && data) {
          const dbAppId = data.find((s: any) => s.key === 'meta_app_id')?.value;
          const dbConfigId = data.find((s: any) => s.key === 'whatsapp_config_id')?.value;
          if (dbAppId) appId = dbAppId;
          if (dbConfigId) configId = dbConfigId;
        }

        setMetaAppId(appId);
        setMetaConfigId(configId);
        initMetaSDK(appId);
      } catch (err) {
        console.error('Error fetching Meta platform settings:', err);
        const fallbackAppId = import.meta.env.VITE_META_APP_ID || '2143263399800980';
        initMetaSDK(fallbackAppId);
      }
    };

    const initMetaSDK = (appId: string) => {
      try {
        window.fbAsyncInit = function() {
          window.FB.init({
            appId: appId,
            cookie: true,
            xfbml: true,
            version: 'v21.0'
          });
          setSdkStatus('ready');
          console.log('Meta SDK initialized successfully with App ID:', appId);
        };

        const d = document;
        const s = 'script';
        const id = 'facebook-jssdk';
        if (d.getElementById(id)) {
          if (window.FB) {
            window.FB.init({
              appId: appId,
              cookie: true,
              xfbml: true,
              version: 'v21.0'
            });
          }
          setSdkStatus('ready');
          return;
        }
        const js = d.createElement(s) as HTMLScriptElement; 
        js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        const fjs = d.getElementsByTagName(s)[0];
        fjs.parentNode?.insertBefore(js, fjs);
      } catch (err) {
        console.error('Error loading Meta SDK:', err);
        setSdkStatus('error');
      }
    };

    loadPlatformMetaConfig();
  }, []);

  // Fetch active settings for the business
  useEffect(() => {
    fetchSettings();
  }, [businessId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // Select all columns from whatsapp_settings to prevent specific column mismatch errors
      let { data, error } = await supabase
        .from('whatsapp_settings')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching whatsapp_settings with select(*), trying fallback:', error.message);
        const fallback = await supabase
          .from('whatsapp_settings')
          .select('id, business_id, phone_number_id, waba_id, enabled, phone_number, display_name, connection_method, verify_token')
          .eq('business_id', businessId)
          .maybeSingle();
        data = fallback.data as any;
      }
      
      setSettings(data);
      setIsEnabled(data?.enabled || false);
    } catch (error: any) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Launch Meta Embedded Signup popup (Meta OAuth Flow)
  const launchMetaSignup = () => {
    setConnecting(true);
    
    if (!window.FB) {
      toast({
        variant: "destructive",
        title: "SDK Error",
        description: "Facebook SDK is not initialized. Please try disabling ad-blockers and refreshing."
      });
      setConnecting(false);
      return;
    }

    window.FB.login((response: any) => {
      if (response.authResponse) {
        const code = response.authResponse.code;
        if (code) {
          handleMetaSignupResponse(code);
        } else {
          toast({
            variant: "destructive",
            title: "Signup Failed",
            description: "No authorization code returned from Meta."
          });
          setConnecting(false);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Cancelled",
          description: "WhatsApp registration was cancelled."
        });
        setConnecting(false);
      }
    }, {
      config_id: metaConfigId, // Meta WABA Configuration ID (970530725626776)
      response_type: 'code',
      override_default_response_type: true
    });
  };

  const handleMetaSignupResponse = async (code: string) => {
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
        title: "WhatsApp Connected via Meta!",
        description: `Successfully connected ${data.phoneNumber || 'your number'}. Your bot is now ready.`,
      });
      
      fetchSettings();
    } catch (error: any) {
      console.error('Error in Meta signup callback:', error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error.message || "Failed to finalize Meta WhatsApp connection.",
      });
    } finally {
      setConnecting(false);
    }
  };

  // Connection validation via Meta Cloud API
  const handleTestConnection = async () => {
    if (!manualSettings.phone_number_id || !manualSettings.access_token || !testPhone) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in the Meta Phone Number ID, Access Token, and a Test Recipient Phone Number."
      });
      return;
    }

    try {
      setTestLoading(true);
      const cleanTestPhone = testPhone.replace(/[^0-9]/g, '');

      // Send test message directly via Meta API
      const res = await fetch(`https://graph.facebook.com/v21.0/${manualSettings.phone_number_id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${manualSettings.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanTestPhone,
          type: 'text',
          text: {
            body: "🚀 Test Message from LYQN AI (Meta Cloud API). Your Meta credentials are standard & verified!"
          }
        })
      });

      const resData = await res.json();

      if (!res.ok || resData.error) {
        throw new Error(resData.error?.message || "Failed to deliver Meta test message.");
      }

      toast({
        title: "Test Message Sent!",
        description: `Check your WhatsApp on ${testPhone}. Your Meta Cloud API configuration is verified.`,
      });
    } catch (err: any) {
      console.error('Error testing connection:', err);
      toast({
        variant: "destructive",
        title: "Test Failed",
        description: err.message || "Could not verify Meta connection. Check your credentials."
      });
    } finally {
      setTestLoading(false);
    }
  };

  // Manual save for Meta Cloud API Credentials
  const handleManualSave = async () => {
    if (!manualSettings.phone_number_id || !manualSettings.access_token) {
      toast({
        variant: "destructive",
        title: "Missing Credentials",
        description: "Please enter your Meta Phone Number ID and Access Token."
      });
      return;
    }

    try {
      setConnecting(true);

      const payload = {
        business_id: businessId,
        phone_number_id: manualSettings.phone_number_id.trim(),
        waba_id: manualSettings.waba_id.trim() || manualSettings.phone_number_id.trim(),
        access_token: manualSettings.access_token.trim(),
        phone_number: manualSettings.phone_number.trim() || 'Meta WhatsApp Number',
        display_name: 'Meta Official Business',
        connection_method: 'manual',
        provider: 'meta',
        enabled: true
      };

      const { error } = await supabase
        .from('whatsapp_settings')
        .upsert(payload as any, { onConflict: 'business_id' });

      if (error) throw error;

      toast({
        title: "Meta Configuration Saved!",
        description: "Your Meta WhatsApp Cloud API credentials have been saved successfully.",
      });

      fetchSettings();
    } catch (err: any) {
      console.error('Error saving manual settings:', err);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: err.message || "Failed to save Meta settings."
      });
    } finally {
      setConnecting(false);
    }
  };

  const toggleEnabled = async (checked: boolean) => {
    try {
      setIsEnabled(checked);
      const { error } = await supabase
        .from('whatsapp_settings')
        .update({ enabled: checked } as any)
        .eq('business_id', businessId);

      if (error) throw error;

      toast({
        title: checked ? "WhatsApp Bot Active" : "WhatsApp Bot Paused",
        description: checked ? "Your AI is now actively responding on WhatsApp." : "AI responses paused.",
      });
    } catch (error: any) {
      setIsEnabled(!checked);
      toast({
        variant: "destructive",
        title: "Error updating status",
        description: error.message,
      });
    }
  };

  const disconnectWhatsApp = async () => {
    try {
      const { error } = await supabase
        .from('whatsapp_settings')
        .delete()
        .eq('business_id', businessId);

      if (error) throw error;

      setSettings(null);
      setIsEnabled(false);
      setManualSettings({
        phone_number_id: '',
        waba_id: '',
        access_token: '',
        phone_number: ''
      });

      toast({
        title: "Disconnected",
        description: "WhatsApp account has been removed from LYQN AI.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error disconnecting",
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

  // Webhook URL display
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (supabase as any).supabaseUrl || 'https://rgczbabidcqvpyiiqjfv.supabase.co';
  const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;

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
                Meta WhatsApp Integration
                {settings ? (
                  <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Connected (Meta Cloud API)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">Not Connected</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Connect your business WhatsApp number via official Meta WhatsApp Cloud API & Meta Embedded Signup (OAuth) to provide AI customer service 24/7.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {!settings ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center">
              
              <div className="max-w-md space-y-2">
                <h3 className="text-xl font-semibold">
                  Connect via Meta (Facebook) Cloud API
                </h3>
                <p className="text-muted-foreground text-sm">
                  Link your Meta Business Account for direct official WhatsApp Cloud API integration. Use the 1-Click Meta Embedded Signup or manual credentials below.
                </p>
              </div>

              {/* Automatic and Manual side-by-side configurations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl text-left mt-4">
                
                {/* Column A: Meta Embedded Signup (OAuth) */}
                <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-border bg-muted/20 text-center space-y-4">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <Zap className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-semibold">Option A: Meta OAuth Embedded Signup</h4>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      Automatically connect your WABA ID and Phone number via official Meta Facebook SDK login.
                    </p>
                  </div>
                  
                  <div className="space-y-2 w-full max-w-xs">
                    <Button 
                      size="lg" 
                      onClick={launchMetaSignup} 
                      disabled={connecting || sdkStatus === 'loading'}
                      className="w-full shadow-lg shadow-primary/20 gap-2 font-semibold bg-gradient-to-r from-primary to-primary/80 transition-all hover:scale-105"
                    >
                      {connecting || sdkStatus === 'loading' ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Zap className="h-5 w-5 fill-current" />
                      )}
                      {connecting ? "Connecting..." : sdkStatus === 'loading' ? "Initializing SDK..." : "Connect Meta WhatsApp"}
                    </Button>
                    {sdkStatus === 'loading' && (
                      <p className="text-[10px] text-muted-foreground animate-pulse">
                        Loading Meta developer tools...
                      </p>
                    )}
                    {sdkStatus === 'error' && (
                      <p className="text-[10px] text-destructive flex items-center gap-1 justify-center">
                        <AlertCircle className="h-3 w-3" />
                        SDK failed to load. Disable ad-blockers and refresh.
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground pt-2">
                      💡 <em>Testing on a new domain/localhost? Ensure your domain is listed in Meta App Dashboard &gt; WhatsApp &gt; Configuration &gt; Allowed Domains for JS SDK.</em>
                    </p>
                  </div>
                </div>

                {/* Column B: Manual Meta Credentials */}
                <div className="p-6 rounded-2xl border border-border bg-muted/20 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Lock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold">Option B: Manual Meta API Setup</h4>
                      <p className="text-xs text-muted-foreground">For developers with Meta Graph API credentials</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="meta_phone_number_id" className="text-xs">Meta Phone Number ID</Label>
                      <Input 
                        id="meta_phone_number_id" 
                        placeholder="e.g. 123456789012345" 
                        value={manualSettings.phone_number_id}
                        onChange={(e) => setManualSettings({...manualSettings, phone_number_id: e.target.value})}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="meta_waba_id" className="text-xs">Meta WABA ID (Optional)</Label>
                      <Input 
                        id="meta_waba_id" 
                        placeholder="e.g. 987654321098765" 
                        value={manualSettings.waba_id}
                        onChange={(e) => setManualSettings({...manualSettings, waba_id: e.target.value})}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="meta_access_token" className="text-xs">Meta Permanent Access Token</Label>
                      <Input 
                        id="meta_access_token" 
                        type="password"
                        placeholder="EAAB..." 
                        value={manualSettings.access_token}
                        onChange={(e) => setManualSettings({...manualSettings, access_token: e.target.value})}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="meta_phone_number" className="text-xs">Display Phone Number</Label>
                      <Input 
                        id="meta_phone_number" 
                        placeholder="e.g. +1 234 567 890" 
                        value={manualSettings.phone_number}
                        onChange={(e) => setManualSettings({...manualSettings, phone_number: e.target.value})}
                        className="h-9 text-sm"
                      />
                    </div>

                    <div className="pt-2 border-t border-border/50 space-y-2">
                      <div className="space-y-1 text-left">
                        <Label htmlFor="test_phone" className="text-xs text-primary flex items-center gap-1">
                          <Smartphone className="h-3 w-3" />
                          Verify Meta Credentials
                        </Label>
                        <div className="flex gap-2">
                          <Input 
                            id="test_phone" 
                            placeholder="Recipient phone number" 
                            value={testPhone}
                            onChange={(e) => setTestPhone(e.target.value)}
                            className="h-9 text-sm"
                          />
                          <Button 
                            variant="outline" 
                            onClick={handleTestConnection}
                            disabled={testLoading || !manualSettings.access_token || !manualSettings.phone_number_id}
                            className="h-9 text-xs whitespace-nowrap gap-1"
                          >
                            {testLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                            Test
                          </Button>
                        </div>
                      </div>

                      <Button 
                        className="w-full h-10 text-sm font-semibold"
                        onClick={handleManualSave}
                        disabled={connecting}
                      >
                        {connecting ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : "Save Meta Credentials"}
                      </Button>
                    </div>
                  </div>
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-8">
                <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-background/50 border border-border">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Meta Official Cloud API</span>
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
                    <div className="space-y-1 text-left">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Phone Number</Label>
                      <p className="text-lg font-mono font-bold">{settings.phone_number || "Verified Number"}</p>
                    </div>
                    <div className="space-y-1 text-left">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Display Name</Label>
                      <p className="text-lg font-bold">{settings.display_name || "Official Account"}</p>
                    </div>
                    <div className="space-y-1 col-span-2 text-left">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Webhook Endpoint</Label>
                      <div className="flex gap-2 mt-1">
                        <Input readOnly value={webhookUrl} className="font-mono text-xs h-9 bg-muted/40" />
                      </div>
                    </div>
                    {settings.verify_token && (
                      <div className="space-y-1 col-span-2 text-left">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Meta Verify Token</Label>
                        <Input readOnly value={settings.verify_token} className="font-mono text-xs h-9 bg-muted/40" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="space-y-0.5 text-left">
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
              How Meta Cloud API Works
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2 text-left">
            <p>• Your bot connects directly via official Meta WhatsApp Cloud API.</p>
            <p>• Emojis and plain-text spacing are adapted automatically for mobile screens.</p>
            <p>• Upload PDFs or FAQs in the "Knowledge Base" tab to train your AI.</p>
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
          <CardContent className="grid grid-cols-1 gap-2 text-left">
            <Button variant="link" className="justify-start p-0 h-auto" asChild>
              <a href="https://developers.facebook.com/docs/whatsapp" target="_blank" rel="noopener noreferrer">
                Meta WhatsApp Cloud API Docs <ExternalLink className="h-3 w-3 ml-1 inline" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WhatsAppSettings;
