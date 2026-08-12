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
  Lock,
  Globe
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
  
  // Provider Selection: 'meta' or 'twilio'
  const [activeProvider, setActiveProvider] = useState<'meta' | 'twilio'>('meta');
  
  // SDK States for Meta
  const [sdkStatus, setSdkStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  
  // Twilio OAuth configurations loaded from platform settings
  const [twilioConfig, setTwilioConfig] = useState<{clientId: string} | null>(null);

  // Connection validation inputs
  const [testLoading, setTestLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  
  const [manualSettings, setManualSettings] = useState({
    phone_number_id: '',
    waba_id: '',
    access_token: '',
    phone_number: ''
  });

  // Load Meta Facebook SDK on mount
  useEffect(() => {
    const initMetaSDK = () => {
      try {
        const appId = import.meta.env.VITE_META_APP_ID || '242161592913036';
        
        window.fbAsyncInit = function() {
          window.FB.init({
            appId: appId,
            cookie: true,
            xfbml: true,
            version: 'v21.0'
          });
          setSdkStatus('ready');
          console.log('Meta SDK initialized successfully');
        };

        const d = document;
        const s = 'script';
        const id = 'facebook-jssdk';
        if (d.getElementById(id)) {
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

    initMetaSDK();
  }, []);

  // Fetch Twilio platform client credentials
  useEffect(() => {
    const fetchPlatformSettings = async () => {
      try {
        const { data, error } = await (supabase
          .from('platform_settings' as any)
          .select('key, value') as any);
        
        if (!error && data) {
          const config = {
            clientId: data.find((s: any) => s.key === 'twilio_client_id')?.value || import.meta.env.VITE_TWILIO_CLIENT_ID || "OQcd310049d7ab871c7a76621fb68ac48c"
          };
          setTwilioConfig(config);
        } else {
          setTwilioConfig({
            clientId: import.meta.env.VITE_TWILIO_CLIENT_ID || "OQcd310049d7ab871c7a76621fb68ac48c"
          });
        }
      } catch (err) {
        console.error('Error fetching platform settings:', err);
        setTwilioConfig({
          clientId: import.meta.env.VITE_TWILIO_CLIENT_ID || "OQcd310049d7ab871c7a76621fb68ac48c"
        });
      }
    };

    fetchPlatformSettings();
  }, []);

  // Fetch active settings for the business
  useEffect(() => {
    fetchSettings();
  }, [businessId]);

  // Handle OAuth callbacks from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const phone = params.get('phone');
    const errorMsg = params.get('error');

    if (connected === 'whatsapp') {
      toast({
        title: "WhatsApp Connected!",
        description: `Successfully connected ${phone || 'your number'} via Twilio. Your bot is now ready.`,
      });
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchSettings();
    } else if (errorMsg) {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: errorMsg || "Failed to finalize WhatsApp connection.",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('whatsapp_settings')
        .select('id, business_id, phone_number_id, waba_id, enabled, phone_number, display_name, connection_method, verify_token, provider')
        .eq('business_id', businessId)
        .maybeSingle();

      if (error) throw error;
      
      setSettings(data);
      setIsEnabled(data?.enabled || false);
      if (data?.provider) {
        setActiveProvider(data.provider);
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Launch Meta Embedded Signup popup
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
      config_id: '1592913036', // LYQN Config ID
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
        description: error.message || "Failed to finalize WhatsApp connection.",
      });
    } finally {
      setConnecting(false);
    }
  };

  // Launch Twilio OAuth redirect
  const launchTwilioSignup = () => {
    setConnecting(true);
    const clientId = twilioConfig?.clientId;
    if (!clientId) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Twilio Client ID is missing. Please check your settings."
      });
      setConnecting(false);
      return;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (supabase as any).supabaseUrl || 'https://rgczbabidcqvpyiiqjfv.supabase.co';
    const redirectUri = `${supabaseUrl}/functions/v1/twilio-oauth-callback`;
    const state = `${businessId}:${window.location.origin}${window.location.pathname}`;

    const scopes = [
      'messaging.read',
      'messaging.write',
      'services',
      'services.channelsenders',
      'messages',
      'messages.media',
      'messages.feedback',
      'content-templates'
    ].join(' ');

    const authUrl = `https://oauth.twilio.com/v2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scopes)}`;
    
    window.location.href = authUrl;
  };

  // Connection validation
  const handleTestConnection = async () => {
    if (!manualSettings.phone_number_id || !manualSettings.access_token || !testPhone) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in the Phone/Sender ID, Token/Auth Token, and a Test Recipient Phone Number."
      });
      return;
    }

    setTestLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-test-connection', {
        body: {
          phoneNumberId: manualSettings.phone_number_id,
          accessToken: manualSettings.access_token,
          wabaId: manualSettings.waba_id || undefined,
          phoneNumber: manualSettings.phone_number || undefined,
          recipientPhone: testPhone.replace(/\D/g, ''),
          provider: activeProvider
        }
      });

      if (error) {
        let errorMessage = error.message;
        try {
          if (error.context && typeof error.context.json === 'function') {
            const errorData = await error.context.json();
            errorMessage = errorData.error || errorMessage;
          }
        } catch (e) {}
        throw new Error(errorMessage);
      }

      if (!data?.success) {
        throw new Error(data?.error || "Test failed");
      }

      toast({
        title: "Test Message Sent!",
        description: `Check your WhatsApp. If you received the message, your ${activeProvider === 'meta' ? 'Meta' : 'Twilio'} configuration is correct.`,
      });
    } catch (error: any) {
      console.error('Test connection error:', error);
      toast({
        variant: "destructive",
        title: "Test Failed",
        description: error.message || "Failed to send test message. Check your credentials and try again."
      });
    } finally {
      setTestLoading(false);
    }
  };

  // Manual save settings
  const handleManualSave = async () => {
    if (!manualSettings.phone_number_id || !manualSettings.access_token || !manualSettings.phone_number) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields."
      });
      return;
    }

    setConnecting(true);
    try {
      const verifyToken = Math.random().toString(36).substring(2, 15);
      
      const { error } = await supabase
        .from('whatsapp_settings')
        .upsert({
          business_id: businessId,
          phone_number_id: manualSettings.phone_number_id,
          waba_id: manualSettings.waba_id || null,
          access_token: manualSettings.access_token,
          phone_number: manualSettings.phone_number,
          enabled: true,
          display_name: activeProvider === 'meta' ? 'Meta Manual Connection' : 'Twilio Manual Connection',
          connection_method: 'manual',
          provider: activeProvider, // Save selected provider
          verify_token: verifyToken,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "WhatsApp Connected Manually!",
        description: `Your ${activeProvider === 'meta' ? 'Meta' : 'Twilio'} configurations have been saved successfully.`,
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

  // Toggle Bot replies
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

  // Disconnect settings
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
                WhatsApp Integration
                {settings ? (
                  <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Connected ({settings.provider === 'twilio' ? 'Twilio' : 'Meta'})
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">Not Connected</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Connect your business WhatsApp number via Meta Cloud API or Twilio to provide AI-powered customer service 24/7.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {!settings ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center">
              
              {/* Provider Selection Tabs */}
              <div className="flex p-1 bg-muted rounded-xl w-fit">
                <Button 
                  variant={activeProvider === 'meta' ? 'default' : 'ghost'} 
                  onClick={() => setActiveProvider('meta')}
                  className="rounded-lg px-6 font-semibold"
                >
                  Meta Cloud API
                </Button>
                <Button 
                  variant={activeProvider === 'twilio' ? 'default' : 'ghost'} 
                  onClick={() => setActiveProvider('twilio')}
                  className="rounded-lg px-6 font-semibold"
                >
                  Twilio WhatsApp
                </Button>
              </div>

              <div className="max-w-md space-y-2">
                <h3 className="text-xl font-semibold">
                  Connect via {activeProvider === 'meta' ? 'Meta (Facebook) Cloud API' : 'Twilio WhatsApp API'}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {activeProvider === 'meta' 
                    ? "Link your Meta Business Account for direct WhatsApp integration. The official popup signup is fastest." 
                    : "Connect via Twilio WhatsApp Gateway using standard Twilio API and OAuth flow."}
                </p>
              </div>

              {/* Automatic and Manual side-by-side configurations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl text-left mt-4">
                
                {/* Column A: Automatic setup */}
                <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-border bg-muted/20 text-center space-y-4">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <Zap className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-semibold">Option A: Quick Setup (Recommended)</h4>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      {activeProvider === 'meta' 
                        ? "Automatically connect your WABA ID and Phone number via secure Meta SDK Login." 
                        : "Grant API scope permissions directly via official Twilio OAuth login page."}
                    </p>
                  </div>
                  
                  {activeProvider === 'meta' ? (
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
                        {connecting ? "Connecting..." : sdkStatus === 'loading' ? "Initializing SDK..." : "Connect WhatsApp Now"}
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
                    </div>
                  ) : (
                    <Button 
                      size="lg" 
                      onClick={launchTwilioSignup} 
                      disabled={connecting}
                      className="w-full max-w-xs shadow-lg shadow-primary/20 gap-2 font-semibold bg-gradient-to-r from-primary to-primary/80 transition-all hover:scale-105"
                    >
                      {connecting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Zap className="h-5 w-5 fill-current" />
                      )}
                      {connecting ? "Connecting..." : "Connect WhatsApp via Twilio"}
                    </Button>
                  )}
                </div>

                {/* Column B: Manual Developer setup */}
                <div className="p-6 rounded-2xl border border-border bg-muted/20 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Lock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold">Option B: Manual Setup</h4>
                      <p className="text-xs text-muted-foreground">For developers with manual API credentials</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {activeProvider === 'meta' ? (
                      <>
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
                      </>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <Label htmlFor="twilio_phone_number_id" className="text-xs">WhatsApp Phone Number / Sender SID</Label>
                          <Input 
                            id="twilio_phone_number_id" 
                            placeholder="e.g. +14155238886 or MGxxxx" 
                            value={manualSettings.phone_number_id}
                            onChange={(e) => setManualSettings({...manualSettings, phone_number_id: e.target.value})}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="twilio_waba_id" className="text-xs">Twilio Account SID</Label>
                          <Input 
                            id="twilio_waba_id" 
                            placeholder="e.g. ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
                            value={manualSettings.waba_id}
                            onChange={(e) => setManualSettings({...manualSettings, waba_id: e.target.value})}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="twilio_access_token" className="text-xs">Twilio Auth Token</Label>
                          <Input 
                            id="twilio_access_token" 
                            type="password"
                            placeholder="Twilio Auth Token" 
                            value={manualSettings.access_token}
                            onChange={(e) => setManualSettings({...manualSettings, access_token: e.target.value})}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="twilio_phone_number" className="text-xs">Display Phone Number</Label>
                          <Input 
                            id="twilio_phone_number" 
                            placeholder="e.g. +1 415 523 8886" 
                            value={manualSettings.phone_number}
                            onChange={(e) => setManualSettings({...manualSettings, phone_number: e.target.value})}
                            className="h-9 text-sm"
                          />
                        </div>
                      </>
                    )}

                    <div className="pt-2 border-t border-border/50 space-y-2">
                      <div className="space-y-1 text-left">
                        <Label htmlFor="test_phone" className="text-xs text-primary flex items-center gap-1">
                          <Smartphone className="h-3 w-3" />
                          Verify Configuration
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
                        {connecting ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : "Save Configuration"}
                      </Button>
                    </div>
                  </div>
                </div>

              </div>

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
                    {settings.provider === 'meta' && settings.verify_token && (
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
                  Connected via {settings.provider === 'twilio' ? 'Twilio OAuth' : 'Meta Tech Provider'} (LYQN)
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
          <CardContent className="text-sm text-muted-foreground space-y-2 text-left">
            <p>• Your bot supports both Meta Cloud API and Twilio WhatsApp gateway.</p>
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
            <Button variant="link" className="justify-start p-0 h-auto" asChild>
              <a href="https://www.twilio.com/docs/whatsapp" target="_blank" rel="noopener noreferrer">
                Twilio WhatsApp API Docs <ExternalLink className="h-3 w-3 ml-1 inline" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WhatsAppSettings;
