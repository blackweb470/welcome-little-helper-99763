import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Bot, Sparkles, MessageSquare, Settings } from "lucide-react";

interface BotCustomizationProps {
  businessId: string;
}

interface BotSettings {
  agent_name: string;
  system_prompt: string;
  welcome_message: string;
  personality: string;
  response_style: string;
  tone: string;
  expertise_areas: string;
  conversation_examples: string;
}

export const BotCustomization = ({ businessId }: BotCustomizationProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [botSettings, setBotSettings] = useState<BotSettings>({
    agent_name: 'AI Assistant',
    system_prompt: 'You are a helpful AI assistant for a business. Be professional, friendly, and concise.',
    welcome_message: 'Hi! How can I help you today?',
    personality: 'professional',
    response_style: 'concise',
    tone: 'friendly',
    expertise_areas: '',
    conversation_examples: '',
  });

  useEffect(() => {
    fetchBotSettings();
  }, [businessId]);

  const fetchBotSettings = async () => {
    const { data, error } = await supabase
      .from('widget_settings')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching bot settings:', error);
    } else if (data) {
      // Parse metadata if it exists
      const meta = data as any;
      setBotSettings({
        agent_name: data.agent_name || 'AI Assistant',
        system_prompt: data.system_prompt || 'You are a helpful AI assistant for a business. Be professional, friendly, and concise.',
        welcome_message: data.welcome_message || 'Hi! How can I help you today?',
        personality: meta.personality || 'professional',
        response_style: meta.response_style || 'concise',
        tone: meta.tone || 'friendly',
        expertise_areas: meta.expertise_areas || '',
        conversation_examples: meta.conversation_examples || '',
      });
    }
    setLoading(false);
  };

  const saveBotSettings = async () => {
    // Store bot customization in system_prompt field with structured format
    const enhancedPrompt = botSettings.system_prompt;

    // Check if settings exist
    const { data: existing } = await supabase
      .from('widget_settings')
      .select('id')
      .eq('business_id', businessId)
      .maybeSingle();

    // Store settings (personality, tone, etc. can be parsed from system_prompt or stored elsewhere)
    const updateData = {
      agent_name: botSettings.agent_name,
      system_prompt: enhancedPrompt,
      welcome_message: botSettings.welcome_message,
    } as any;

    // Workaround: Store additional settings in the system_prompt itself or create separate storage
    updateData.personality = botSettings.personality;
    updateData.response_style = botSettings.response_style;
    updateData.tone = botSettings.tone;
    updateData.expertise_areas = botSettings.expertise_areas;
    updateData.conversation_examples = botSettings.conversation_examples;

    let result;
    if (existing) {
      result = await supabase
        .from('widget_settings')
        .update(updateData)
        .eq('business_id', businessId);
    } else {
      result = await supabase
        .from('widget_settings')
        .insert({
          business_id: businessId,
          ...updateData,
        });
    }

    if (result.error) {
      toast({
        title: "Error",
        description: "Failed to save bot settings",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Bot settings saved successfully",
    });
  };

  const generateSystemPrompt = () => {
    const parts = [];
    
    parts.push(`You are ${botSettings.agent_name}, an AI assistant.`);
    
    // Personality
    switch (botSettings.personality) {
      case 'professional':
        parts.push('Maintain a professional and business-like demeanor.');
        break;
      case 'friendly':
        parts.push('Be warm, approachable, and friendly in your interactions.');
        break;
      case 'casual':
        parts.push('Use a casual, conversational tone. Feel free to use everyday language.');
        break;
      case 'technical':
        parts.push('Be technical and precise. Use industry terminology appropriately.');
        break;
    }

    // Tone
    switch (botSettings.tone) {
      case 'friendly':
        parts.push('Keep a friendly and welcoming tone.');
        break;
      case 'formal':
        parts.push('Use formal language and maintain professional boundaries.');
        break;
      case 'enthusiastic':
        parts.push('Show enthusiasm and positive energy in your responses.');
        break;
      case 'empathetic':
        parts.push('Be empathetic and understanding of user concerns.');
        break;
    }

    // Response Style
    switch (botSettings.response_style) {
      case 'concise':
        parts.push('Keep responses brief and to the point.');
        break;
      case 'detailed':
        parts.push('Provide comprehensive, detailed explanations.');
        break;
      case 'balanced':
        parts.push('Balance conciseness with necessary detail.');
        break;
    }

    if (botSettings.expertise_areas) {
      parts.push(`Your areas of expertise include: ${botSettings.expertise_areas}.`);
    }

    if (botSettings.conversation_examples) {
      parts.push('\nExample conversations:');
      parts.push(botSettings.conversation_examples);
    }

    const generated = parts.join(' ');
    setBotSettings({ ...botSettings, system_prompt: generated });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="w-6 h-6" />
          Customize Your AI Bot
        </h2>
        <p className="text-muted-foreground mt-1">
          Configure your AI assistant's personality, behavior, and conversation style
        </p>
      </div>

      <Tabs defaultValue="personality" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personality" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Personality
          </TabsTrigger>
          <TabsTrigger value="conversation" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Conversation
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2">
            <Settings className="w-4 h-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personality">
          <Card>
            <CardHeader>
              <CardTitle>Bot Personality & Style</CardTitle>
              <CardDescription>
                Define how your AI bot interacts with customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="agent_name">Bot Name</Label>
                <Input
                  id="agent_name"
                  value={botSettings.agent_name}
                  onChange={(e) => setBotSettings({ ...botSettings, agent_name: e.target.value })}
                  placeholder="AI Assistant"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="personality">Personality</Label>
                  <Select
                    value={botSettings.personality}
                    onValueChange={(value) => setBotSettings({ ...botSettings, personality: value })}
                  >
                    <SelectTrigger id="personality">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select
                    value={botSettings.tone}
                    onValueChange={(value) => setBotSettings({ ...botSettings, tone: value })}
                  >
                    <SelectTrigger id="tone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      <SelectItem value="empathetic">Empathetic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="response_style">Response Style</Label>
                  <Select
                    value={botSettings.response_style}
                    onValueChange={(value) => setBotSettings({ ...botSettings, response_style: value })}
                  >
                    <SelectTrigger id="response_style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concise">Concise</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expertise_areas">Areas of Expertise</Label>
                <Textarea
                  id="expertise_areas"
                  value={botSettings.expertise_areas}
                  onChange={(e) => setBotSettings({ ...botSettings, expertise_areas: e.target.value })}
                  placeholder="e.g., Customer support, product information, technical troubleshooting"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  List the main topics or areas your bot should be knowledgeable about
                </p>
              </div>

              <Button onClick={generateSystemPrompt} variant="outline" className="w-full">
                Generate System Prompt from Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversation">
          <Card>
            <CardHeader>
              <CardTitle>Conversation Settings</CardTitle>
              <CardDescription>
                Customize greeting messages and conversation flow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="welcome_message">Welcome Message</Label>
                <Input
                  id="welcome_message"
                  value={botSettings.welcome_message}
                  onChange={(e) => setBotSettings({ ...botSettings, welcome_message: e.target.value })}
                  placeholder="Hi! How can I help you today?"
                />
                <p className="text-xs text-muted-foreground">
                  First message users see when starting a conversation
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="conversation_examples">Example Conversations</Label>
                <Textarea
                  id="conversation_examples"
                  value={botSettings.conversation_examples}
                  onChange={(e) => setBotSettings({ ...botSettings, conversation_examples: e.target.value })}
                  placeholder={`User: How do I track my order?\nBot: I'd be happy to help you track your order! Could you please provide your order number?\n\nUser: What are your business hours?\nBot: We're open Monday through Friday, 9 AM to 6 PM EST.`}
                  rows={8}
                />
                <p className="text-xs text-muted-foreground">
                  Provide example conversations to guide the bot's responses
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Configuration</CardTitle>
              <CardDescription>
                Direct system prompt customization for fine-tuned control
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="system_prompt">System Prompt</Label>
                <Textarea
                  id="system_prompt"
                  value={botSettings.system_prompt}
                  onChange={(e) => setBotSettings({ ...botSettings, system_prompt: e.target.value })}
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  This is the core instruction that defines your bot's behavior. Edit with care.
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">Tips for Writing System Prompts:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Be specific about the bot's role and purpose</li>
                  <li>Include guidelines for handling different types of questions</li>
                  <li>Specify tone, style, and personality traits</li>
                  <li>Add constraints (e.g., "Don't make up information")</li>
                  <li>Include examples of good responses</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={saveBotSettings} size="lg">
          Save Bot Configuration
        </Button>
      </div>
    </div>
  );
};
