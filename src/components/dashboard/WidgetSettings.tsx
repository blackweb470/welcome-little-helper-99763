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
    pre_chat_enabled: true,
    pre_chat_required_fields: ['name', 'email'],
    pre_chat_welcome_message: 'Please tell us a bit about yourself before we start the conversation.',
    max_input_characters: 500,
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
        setSettings({
          ...data,
          pre_chat_required_fields: Array.isArray(data.pre_chat_required_fields) 
            ? (data.pre_chat_required_fields as string[])
            : ['name', 'email']
        });
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
    const code = `<!-- LYQN Chat Widget (Improved) -->
<style>
  /* Floating Chat Button */
  #chat-toggle {
    position: fixed;
    bottom: 25px;
    right: 25px;
    z-index: 1000000;
    background-color: #333;
    color: #fff;
    width: 60px;
    height: 60px;
    border: none;
    border-radius: 50%;
    font-size: 26px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
  }

  #chat-toggle:hover {
    background-color: #5C6BC0;
    transform: scale(1.05);
  }

  /* Slide animation */
  @keyframes slideUp {
    from { transform: translateY(40px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  /* Chat Iframe (Hidden by default) */
  #lyqn-chat-widget {
    position: fixed;
    bottom: 90px;
    right: 25px;
    width: 400px;
    height: 550px;
    border: none;
    border-radius: 12px;
    box-shadow: 0 6px 25px rgba(0,0,0,0.4);
    z-index: 999999;
    display: none;
    animation: slideUp 0.4s ease;
  }

  /* Responsive (Mobile view) */
  @media (max-width: 768px) {
    #lyqn-chat-widget {
      width: 100%;
      height: 60%;
      right: 0;
      bottom: 0;
      border-radius: 0;
    }

    #chat-toggle {
      bottom: 15px;
      right: 15px;
      width: 55px;
      height: 55px;
      font-size: 24px;
    }
  }
</style>

<button id="chat-toggle" title="Chat with us">💬</button>

<script>
  (function() {
    function initWidget() {
      if (document.getElementById('lyqn-chat-widget')) return;

      var iframe = document.createElement('iframe');
      iframe.src = '${appUrl}/embed/${id}';
      iframe.id = 'lyqn-chat-widget';
      iframe.title = 'LYQN Chat Widget';
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
      iframe.setAttribute('allow', 'microphone');
      document.body.appendChild(iframe);

      // Send parent URL to widget for proactive rules
      iframe.onload = function() {
        iframe.contentWindow.postMessage({
          type: 'PARENT_URL',
          url: window.location.href
        }, '*');
      };

      // Listen for URL requests from widget
      window.addEventListener('message', function(event) {
        if (event.data.type === 'REQUEST_PARENT_URL') {
          iframe.contentWindow.postMessage({
            type: 'PARENT_URL',
            url: window.location.href
          }, '*');
        }
      });

      // Toggle open/close
      var btn = document.getElementById('chat-toggle');
      btn.addEventListener('click', function() {
        iframe.style.display = (iframe.style.display === 'none' || iframe.style.display === '') ? 'block' : 'none';
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initWidget);
    } else {
      initWidget();
    }
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

        <div className="space-y-2">
          <Label htmlFor="max_input_characters">Maximum Input Characters (150-1000)</Label>
          <Input
            id="max_input_characters"
            type="number"
            min={150}
            max={1000}
            value={settings.max_input_characters}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (value >= 150 && value <= 1000) {
                setSettings({ ...settings, max_input_characters: value });
              }
            }}
          />
          <p className="text-xs text-muted-foreground">
            Set the maximum number of characters visitors can type in the chat input box.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="voice_enabled"
            checked={settings.voice_enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, voice_enabled: checked })}
          />
          <Label htmlFor="voice_enabled">Enable Voice Chat</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="pre_chat_enabled"
            checked={settings.pre_chat_enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, pre_chat_enabled: checked })}
          />
          <Label htmlFor="pre_chat_enabled">Enable Pre-Chat Form</Label>
        </div>

        {settings.pre_chat_enabled && (
          <div className="space-y-2 pl-8 border-l-2">
            <div className="space-y-2">
              <Label htmlFor="pre_chat_welcome_message">Pre-Chat Welcome Message</Label>
              <Textarea
                id="pre_chat_welcome_message"
                value={settings.pre_chat_welcome_message}
                onChange={(e) => setSettings({ ...settings, pre_chat_welcome_message: e.target.value })}
                rows={2}
                className="text-sm"
              />
            </div>
          </div>
        )}

        <Button onClick={saveSettings}>Save Settings</Button>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Embed Code - LYQN Chat Widget</h3>
        <p className="text-sm text-muted-foreground">
          Universal embed code compatible with React, Next.js, Vue, Angular, and plain HTML.
        </p>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Installation Instructions:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li><strong>Plain HTML:</strong> Paste before closing &lt;/body&gt; tag</li>
            <li><strong>React:</strong> Add to index.html or use dangerouslySetInnerHTML in layout</li>
            <li><strong>Next.js:</strong> Add to pages/_document.js or app/layout.tsx</li>
            <li><strong>Vue:</strong> Add to index.html or use v-html in App.vue</li>
            <li><strong>Angular:</strong> Add to index.html</li>
          </ul>
        </div>

        <pre className="bg-secondary p-4 rounded text-sm overflow-x-auto max-h-96">
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
