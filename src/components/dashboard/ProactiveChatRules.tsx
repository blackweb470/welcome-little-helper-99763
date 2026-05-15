import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Zap, Plus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProactiveRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger_type: string;
  trigger_value: any;
  message: string;
  priority: number;
}

interface ProactiveChatRulesProps {
  businessId: string;
}

export const ProactiveChatRules = ({ businessId }: ProactiveChatRulesProps) => {
  const [rules, setRules] = useState<ProactiveRule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    trigger_type: string;
    trigger_value: Record<string, any>;
    message: string;
  }>({
    name: '',
    trigger_type: 'time_on_page',
    trigger_value: { seconds: 3 },
    message: 'Hi! I noticed you\'ve been browsing for a while. Can I help you find something?'
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRules();
  }, [businessId]);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('proactive_chat_rules')
        .select('*')
        .eq('business_id', businessId)
        .order('priority', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
    }
  };

  const createRule = async () => {
    if (isSaving) return;

    // Check for duplicate names locally first
    const isDuplicate = rules.some(r => r.name.toLowerCase() === formData.name.toLowerCase());
    if (isDuplicate) {
      toast({
        title: "Rule already exists",
        description: "A rule with this name already exists. Please use a unique name.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('proactive_chat_rules')
        .insert({
          business_id: businessId,
          name: formData.name,
          trigger_type: formData.trigger_type,
          trigger_value: formData.trigger_value,
          message: formData.message,
          enabled: true
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Proactive chat rule created"
      });

      setShowForm(false);
      setFormData({
        name: '',
        trigger_type: 'time_on_page',
        trigger_value: { seconds: 3 },
        message: 'Hi! I noticed you\'ve been browsing for a while. Can I help you find something?'
      });
      fetchRules();
    } catch (error) {
      console.error('Error creating rule:', error);
      toast({
        title: "Error",
        description: "Failed to create rule",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('proactive_chat_rules')
        .update({ enabled })
        .eq('id', ruleId);

      if (error) throw error;
      fetchRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteRule = async (ruleId: string) => {
    if (deletingId) return;
    setDeletingId(ruleId);
    try {
      const { error } = await supabase
        .from('proactive_chat_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Rule deleted"
      });
      fetchRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete rule",
        variant: "destructive"
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Proactive Chat Rules
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Rule
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="border rounded-lg p-4 space-y-4">
            <div>
              <Label>Rule Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Welcome new visitors"
              />
            </div>

            <div>
              <Label>Trigger Type</Label>
              <Select
                value={formData.trigger_type}
                onValueChange={(value) => {
                  const defaultValues: any = {
                    time_on_page: { seconds: 3 },
                    exit_intent: {},
                    high_engagement: { score: 70 },
                    page_visit: { url: '/' },
                    scroll_depth: { percentage: 50 }
                  };
                  setFormData({ 
                    ...formData, 
                    trigger_type: value,
                    trigger_value: defaultValues[value]
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time_on_page">Time on Page</SelectItem>
                  <SelectItem value="exit_intent">Exit Intent</SelectItem>
                  <SelectItem value="high_engagement">High Engagement</SelectItem>
                  <SelectItem value="page_visit">Page Visit</SelectItem>
                  <SelectItem value="scroll_depth">Scroll Depth</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.trigger_type === 'time_on_page' && (
              <div>
                <Label>Seconds on Page</Label>
                <Input
                  type="number"
                  min="1"
                  max="300"
                  value={formData.trigger_value.seconds}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    trigger_value: { seconds: parseInt(e.target.value) || 3 }
                  })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Message appears after visitor spends this many seconds on page
                </p>
              </div>
            )}

            {formData.trigger_type === 'page_visit' && (
              <div>
                <Label>URL Contains</Label>
                <Input
                  value={formData.trigger_value.url || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    trigger_value: { url: e.target.value }
                  })}
                  placeholder="/pricing, /checkout, /contact"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Triggers when page URL contains this text
                </p>
              </div>
            )}

            {formData.trigger_type === 'scroll_depth' && (
              <div>
                <Label>Scroll Percentage (%)</Label>
                <Input
                  type="number"
                  min="10"
                  max="100"
                  value={formData.trigger_value.percentage || 50}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    trigger_value: { percentage: parseInt(e.target.value) || 50 }
                  })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Triggers when visitor scrolls past this percentage of the page
                </p>
              </div>
            )}

            {formData.trigger_type === 'high_engagement' && (
              <div>
                <Label>Engagement Score Threshold</Label>
                <Input
                  type="number"
                  min="30"
                  max="100"
                  value={formData.trigger_value.score || 70}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    trigger_value: { score: parseInt(e.target.value) || 70 }
                  })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Triggers when visitor's engagement score exceeds this value
                </p>
              </div>
            )}

            {formData.trigger_type === 'exit_intent' && (
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                This rule triggers when a visitor moves their mouse towards the browser's close button or address bar, indicating they might leave.
              </p>
            )}

            <div>
              <Label>Message</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Enter the message to show to visitors"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={createRule} 
                disabled={!formData.name || !formData.message || isSaving}
                className="min-w-[120px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Rule'
                )}
              </Button>
              <Button onClick={() => setShowForm(false)} variant="outline" disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {rules.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No proactive chat rules yet. Create one to automatically engage visitors!
            </p>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold">{rule.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Trigger: {rule.trigger_type.replace('_', ' ')}
                    </p>
                    <p className="text-sm mt-2">{rule.message}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteRule(rule.id)}
                      disabled={deletingId === rule.id}
                    >
                      {deletingId === rule.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
