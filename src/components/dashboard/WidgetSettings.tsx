import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface WidgetSettingsProps {
  businessId: string;
}

const WidgetSettings = ({ businessId }: WidgetSettingsProps) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    primary_color: '#000000',
    widget_position: 'bottom-right',
    welcome_message: 'Hi! How can I help you today?',
    agent_name: 'AI Assistant',
    voice_enabled: true,
    system_prompt: 'You are a helpful AI assistant for a business. Be professional, friendly, and concise.',
  });
  const [embedCode, setEmbedCode] = useState('');

  useEffect(() => {
    fetchSettings();
  }, [businessId]);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('widget_settings')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch settings",
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setSettings(data);
    } else {
      // Create default settings if none exist
      const { error: insertError } = await supabase
        .from('widget_settings')
        .insert({
          business_id: businessId,
          ...settings
        });

      if (insertError) {
        console.error('Error creating default settings:', insertError);
      }
    }
    
    generateEmbedCode(businessId);
  };

  const generateEmbedCode = (id: string) => {
    const appUrl = window.location.origin;
    const code = `<!-- LYQN Chat Widget -->
<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${appUrl}/widget/${id}';
    iframe.style.cssText = 'position:fixed;bottom:0;right:0;width:100%;height:100%;border:none;z-index:999999;pointer-events:none;';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');
    iframe.setAttribute('allow', 'microphone');
    iframe.id = 'lyqn-chat-widget';
    
    // Allow interactions with the widget
    iframe.onload = function() {
      iframe.contentWindow.postMessage({type: 'LYQN_WIDGET_READY'}, '${appUrl}');
    };
    
    document.body.appendChild(iframe);
    
    // Listen for widget interactions
    window.addEventListener('message', function(e) {
      if (e.origin === '${appUrl}' && e.data.type === 'WIDGET_INTERACTION') {
        iframe.style.pointerEvents = 'auto';
      }
    });
  })();
</script>`;
    setEmbedCode(code);
  };

  const saveSettings = async () => {
    const { error } = await supabase
      .from('widget_settings')
      .update(settings)
      .eq('business_id', businessId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Settings saved successfully",
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Widget Settings</h2>

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="agent_name">Agent Name</Label>
          <Input
            id="agent_name"
            value={settings.agent_name}
            onChange={(e) => setSettings({ ...settings, agent_name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="welcome_message">Welcome Message</Label>
          <Input
            id="welcome_message"
            value={settings.welcome_message}
            onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="primary_color">Primary Color</Label>
          <Input
            id="primary_color"
            type="color"
            value={settings.primary_color}
            onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="system_prompt">System Prompt</Label>
          <Textarea
            id="system_prompt"
            value={settings.system_prompt}
            onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
            rows={4}
            className="font-mono text-sm"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="voice_enabled"
            checked={settings.voice_enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, voice_enabled: checked })}
          />
          <Label htmlFor="voice_enabled">Enable Voice Chat</Label>
        </div>

        <Button onClick={saveSettings}>Save Settings</Button>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Embed Code - LYQN Chat Widget</h3>
        <p className="text-sm text-muted-foreground">
          Copy this code and paste it before the closing &lt;/body&gt; tag in your website's HTML to add the LYQN chat widget with the chatbot icon.
        </p>
        <pre className="bg-secondary p-4 rounded text-sm overflow-x-auto">
          <code>{embedCode}</code>
        </pre>
        <Button
          onClick={() => {
            navigator.clipboard.writeText(embedCode);
            toast({ title: "Copied!", description: "Embed code copied to clipboard" });
          }}
        >
          Copy Code
        </Button>
      </Card>
    </div>
  );
};

export default WidgetSettings;
