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
    system_prompt: 'You are a helpful AI assistant for a business. Be professional, friendly, and concise.',
    pre_chat_enabled: true,
    pre_chat_required_fields: ['name', 'email'],
    pre_chat_welcome_message: 'Please tell us a bit about yourself before we start the conversation.',
    max_input_characters: 500,
    show_qa_to_visitors: false,
  });
  const [embedCode, setEmbedCode] = useState('');

  useEffect(() => {
    fetchSettings();
  }, [businessId]);

  useEffect(() => {
    if (!businessId) return;
    generateEmbedCode(businessId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, settings.primary_color]);

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
    const supabaseUrl = 'https://rgczbabidcqvpyiiqjfv.supabase.co';
    const code = `<!-- LYQN Chat Widget -->
<script src="${supabaseUrl}/functions/v1/widget-loader?id=${id}" async></script>`;
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
            id="pre_chat_enabled"
            checked={true}
            disabled={true}
          />
          <Label htmlFor="pre_chat_enabled" className="text-muted-foreground">
            Pre-Chat Form (Always Enabled for Security)
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="show_qa_to_visitors"
            checked={settings.show_qa_to_visitors}
            onCheckedChange={(checked) => setSettings({ ...settings, show_qa_to_visitors: checked })}
          />
          <Label htmlFor="show_qa_to_visitors">Show Q&A Pairs to Visitors</Label>
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
