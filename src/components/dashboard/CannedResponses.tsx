import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface CannedResponsesProps {
  businessId: string;
}

interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category: string | null;
  shortcut_key: string | null;
  usage_count: number;
}

export const CannedResponses = ({ businessId }: CannedResponsesProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<CannedResponse | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    shortcut_key: "",
  });
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const queryClient = useQueryClient();

  const { data: responses, isLoading } = useQuery({
    queryKey: ['canned-responses', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('canned_responses')
        .select('*')
        .eq('business_id', businessId)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      return data as CannedResponse[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newResponse: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('canned_responses')
        .insert({
          ...newResponse,
          business_id: businessId,
          created_by: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canned-responses', businessId] });
      toast.success("Canned response created successfully");
      resetForm();
      setIsOpen(false);
    },
    onError: () => {
      toast.error("Failed to create canned response");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('canned_responses')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canned-responses', businessId] });
      toast.success("Canned response updated successfully");
      resetForm();
      setIsOpen(false);
    },
    onError: () => {
      toast.error("Failed to update canned response");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('canned_responses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canned-responses', businessId] });
      toast.success("Canned response deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete canned response");
    },
  });

  const resetForm = () => {
    setFormData({ title: "", content: "", category: "", shortcut_key: "" });
    setEditingResponse(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingResponse) {
      updateMutation.mutate({ id: editingResponse.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (response: CannedResponse) => {
    setEditingResponse(response);
    setFormData({
      title: response.title,
      content: response.content,
      category: response.category || "",
      shortcut_key: response.shortcut_key || "",
    });
    setIsOpen(true);
  };

  const handleCopy = async (content: string, id: string, currentCount: number) => {
    await navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
    
    // Increment usage count
    await supabase
      .from('canned_responses')
      .update({ usage_count: currentCount + 1 })
      .eq('id', id);
    
    queryClient.invalidateQueries({ queryKey: ['canned-responses', businessId] });
  };

  const categories = [...new Set(responses?.map(r => r.category).filter(Boolean))] as string[];
  const filteredResponses = categoryFilter === "all" 
    ? responses 
    : responses?.filter(r => r.category === categoryFilter);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Canned Responses</CardTitle>
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New Response
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingResponse ? "Edit" : "Create"} Canned Response
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Greeting, Support"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shortcut">Shortcut Key</Label>
                    <Input
                      id="shortcut"
                      value={formData.shortcut_key}
                      onChange={(e) => setFormData({ ...formData, shortcut_key: e.target.value })}
                      placeholder="e.g., /greet"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingResponse ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {categories.length > 0 && (
          <div className="mb-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <ScrollArea className="h-[500px]">
          {isLoading ? (
            <div className="text-center text-muted-foreground">Loading...</div>
          ) : filteredResponses?.length === 0 ? (
            <div className="text-center text-muted-foreground">No canned responses yet</div>
          ) : (
            <div className="space-y-3">
              {filteredResponses?.map((response) => (
                <div key={response.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{response.title}</h4>
                        {response.category && (
                          <Badge variant="secondary" className="text-xs">
                            {response.category}
                          </Badge>
                        )}
                        {response.shortcut_key && (
                          <Badge variant="outline" className="text-xs">
                            {response.shortcut_key}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {response.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Used {response.usage_count} times
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(response.content, response.id, response.usage_count)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(response)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(response.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
