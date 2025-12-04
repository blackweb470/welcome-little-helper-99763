import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, GripVertical, Pencil, BookOpen, Save, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Guide {
  id: string;
  title: string;
  content: string;
  icon: string;
  display_order: number;
  enabled: boolean;
}

interface BusinessGuidesProps {
  businessId: string;
}

export const BusinessGuides = ({ businessId }: BusinessGuidesProps) => {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: "", content: "", icon: "📋" });

  const commonIcons = ["📋", "📌", "📍", "🎯", "✅", "📞", "💡", "⚡", "🔔", "📧", "🛒", "💳", "🚚", "↩️", "❓"];

  useEffect(() => {
    fetchGuides();
  }, [businessId]);

  const fetchGuides = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("business_guides")
      .select("*")
      .eq("business_id", businessId)
      .order("display_order", { ascending: true });

    if (error) {
      toast({ title: "Error", description: "Failed to load guides", variant: "destructive" });
    } else {
      setGuides(data || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({ title: "Error", description: "Title and content are required", variant: "destructive" });
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from("business_guides")
        .update({
          title: formData.title,
          content: formData.content,
          icon: formData.icon,
        })
        .eq("id", editingId);

      if (error) {
        toast({ title: "Error", description: "Failed to update guide", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Guide updated" });
        setEditingId(null);
        setFormData({ title: "", content: "", icon: "📋" });
        fetchGuides();
      }
    } else {
      const { error } = await supabase
        .from("business_guides")
        .insert({
          business_id: businessId,
          title: formData.title,
          content: formData.content,
          icon: formData.icon,
          display_order: guides.length,
        });

      if (error) {
        toast({ title: "Error", description: "Failed to create guide", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Guide created" });
        setFormData({ title: "", content: "", icon: "📋" });
        fetchGuides();
      }
    }
  };

  const handleEdit = (guide: Guide) => {
    setEditingId(guide.id);
    setFormData({ title: guide.title, content: guide.content, icon: guide.icon });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("business_guides").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete guide", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Guide deleted" });
      fetchGuides();
    }
  };

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    const { error } = await supabase
      .from("business_guides")
      .update({ enabled })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to update guide", variant: "destructive" });
    } else {
      setGuides(guides.map((g) => (g.id === id ? { ...g, enabled } : g)));
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ title: "", content: "", icon: "📋" });
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {editingId ? "Edit Guide" : "Add New Guide"}
          </CardTitle>
          <CardDescription>
            Create guides to help customers understand your services, policies, and procedures.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {commonIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`w-10 h-10 text-xl rounded-lg border-2 transition-colors ${
                    formData.icon === icon
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., How to Place an Order"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Enter the guide content with step-by-step instructions..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {editingId ? "Update Guide" : "Add Guide"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={cancelEdit}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>Your Guides ({guides.length})</CardTitle>
          <CardDescription>
            These guides will be shown to customers in the Guide tab of your chat widget.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : guides.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No guides yet. Add your first guide above.</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {guides.map((guide) => (
                  <div
                    key={guide.id}
                    className={`p-4 border rounded-lg ${
                      guide.enabled ? "bg-card" : "bg-muted/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{guide.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{guide.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {guide.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={guide.enabled}
                          onCheckedChange={(checked) => handleToggleEnabled(guide.id, checked)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(guide)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(guide.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
