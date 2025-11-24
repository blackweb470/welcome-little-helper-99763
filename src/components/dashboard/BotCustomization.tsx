import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Edit2, Bot } from "lucide-react";

interface BotCustomizationProps {
  businessId: string;
}

interface QAPair {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  enabled: boolean;
  priority: number;
}

export const BotCustomization = ({ businessId }: BotCustomizationProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [keywords, setKeywords] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch Q&A pairs
  const { data: qaPairs, isLoading } = useQuery({
    queryKey: ["bot-qa-pairs", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bot_qa_pairs")
        .select("*")
        .eq("business_id", businessId)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as QAPair[];
    },
  });

  // Save or update Q&A pair
  const saveMutation = useMutation({
    mutationFn: async () => {
      const keywordsArray = keywords.split(',').map(k => k.trim()).filter(k => k);
      
      if (editingId) {
        const { error } = await supabase
          .from("bot_qa_pairs")
          .update({
            question,
            answer,
            keywords: keywordsArray,
          })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("bot_qa_pairs")
          .insert({
            business_id: businessId,
            question,
            answer,
            keywords: keywordsArray,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bot-qa-pairs", businessId] });
      setQuestion("");
      setAnswer("");
      setKeywords("");
      setEditingId(null);
      toast({
        title: "Success",
        description: editingId ? "Q&A pair updated" : "Q&A pair added",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Delete Q&A pair
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bot_qa_pairs")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bot-qa-pairs", businessId] });
      toast({
        title: "Success",
        description: "Q&A pair deleted",
      });
    },
  });

  // Toggle enabled status
  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("bot_qa_pairs")
        .update({ enabled })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bot-qa-pairs", businessId] });
    },
  });

  const handleEdit = (pair: QAPair) => {
    setQuestion(pair.question);
    setAnswer(pair.answer);
    setKeywords(pair.keywords.join(", "));
    setEditingId(pair.id);
  };

  const handleCancelEdit = () => {
    setQuestion("");
    setAnswer("");
    setKeywords("");
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      toast({
        title: "Error",
        description: "Question and answer are required",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="w-6 h-6" />
          Bot Q&A Customization
        </h2>
        <p className="text-muted-foreground mt-1">
          Add programmed question-answer pairs. When users ask these questions, the bot will respond with your predefined answers.
        </p>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          {editingId ? "Edit Q&A Pair" : "Add New Q&A Pair"}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What are your business hours?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer">Answer</Label>
            <Textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="We are open Monday to Friday, 9 AM to 5 PM."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords (comma-separated)</Label>
            <Input
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="hours, time, schedule, open"
            />
            <p className="text-sm text-muted-foreground">
              Optional: Add keywords to help match similar questions
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Update Q&A Pair" : <><Plus className="mr-2 h-4 w-4" />Add Q&A Pair</>}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Programmed Q&A Pairs</h3>
        
        {!qaPairs || qaPairs.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No Q&A pairs added yet. Add your first one above.
          </p>
        ) : (
          <div className="space-y-4">
            {qaPairs.map((pair) => (
              <Card key={pair.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div>
                      <Label className="text-sm text-muted-foreground">Question</Label>
                      <p className="font-medium">{pair.question}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Answer</Label>
                      <p className="text-sm">{pair.answer}</p>
                    </div>
                    {pair.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {pair.keywords.map((keyword, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-muted px-2 py-1 rounded"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={pair.enabled}
                      onCheckedChange={(enabled) =>
                        toggleMutation.mutate({ id: pair.id, enabled })
                      }
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(pair)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(pair.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
