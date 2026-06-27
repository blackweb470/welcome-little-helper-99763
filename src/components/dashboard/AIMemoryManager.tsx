import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, BrainCircuit } from "lucide-react";

interface AIMemoryManagerProps {
  businessId: string;
}

interface Learning {
  id: string;
  content: string;
  created_at: string;
  source_conversation_id: string | null;
}

export const AIMemoryManager = ({ businessId }: AIMemoryManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newLearning, setNewLearning] = useState("");

  const { data: learnings, isLoading } = useQuery({
    queryKey: ["business-learnings", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_learnings")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Learning[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("business_learnings")
        .insert({
          business_id: businessId,
          content: newLearning.trim(),
          learning_type: "manual_brain_dump",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-learnings", businessId] });
      setNewLearning("");
      toast({
        title: "Added to Memory",
        description: "The AI has successfully memorized this information.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save to AI memory: " + error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("business_learnings")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-learnings", businessId] });
      toast({
        title: "Memory Deleted",
        description: "The AI has forgotten this information.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete: " + error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-8">
      {/* Brain Dump Form */}
      <Card className="border-t-4 border-t-primary shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <BrainCircuit className="w-5 h-5 text-primary" />
            AI Brain Dump
          </CardTitle>
          <CardDescription>
            Instantly teach the AI raw facts, rules, or temporary memos. Just type it below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="e.g. 'We are out of stock on all blue widgets until next Tuesday.' or 'If someone asks for Dave, tell them he is on leave.'"
              value={newLearning}
              onChange={(e) => setNewLearning(e.target.value)}
              className="min-h-[120px] resize-y bg-muted/20"
            />
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !newLearning.trim()}
              className="w-full sm:w-auto"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save to AI Memory"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Memory List */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/10">
          <CardTitle className="text-lg">What the AI Knows</CardTitle>
          <CardDescription>
            These are the exact rules and insights the AI has learned from you and your team.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !learnings?.length ? (
            <div className="p-12 text-center text-muted-foreground">
              <BrainCircuit className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>The AI's memory is currently empty.</p>
              <p className="text-sm mt-1">Teach it something using the Brain Dump box above!</p>
            </div>
          ) : (
            <div className="divide-y">
              {learnings.map((learning) => (
                <div
                  key={learning.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {learning.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Learned {new Date(learning.created_at).toLocaleDateString()}
                      </span>
                      {learning.source_conversation_id && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                          From Chat
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("Are you sure you want the AI to forget this?")) {
                        deleteMutation.mutate(learning.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
