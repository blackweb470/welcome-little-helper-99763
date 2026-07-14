import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, Trash2, BrainCircuit, Sparkles, Clock, Calendar, 
  Tag, AlertTriangle, ShieldCheck, RefreshCw, FileText, 
  CheckCircle2, HelpCircle, BookOpen 
} from "lucide-react";

interface AIMemoryManagerProps {
  businessId: string;
}

interface Learning {
  id: string;
  content: string;
  created_at: string;
  source_conversation_id: string | null;
  learning_type: string;
  expires_at?: string | null;
  metadata?: {
    expires_at?: string | null;
    full_text_routed?: boolean;
    original_length?: number;
    routed_summary?: string;
  } | null;
}

interface GroundTruthTopic {
  topicName: string;
  icon?: string;
  synthesizedTruth: string;
  sourceCount?: number;
  keyRules?: string[];
}

interface GroundTruthContradiction {
  domain: string;
  severity: string;
  description: string;
  conflictingSources?: string[];
  recommendation?: string;
}

interface GroundTruthData {
  topics: GroundTruthTopic[];
  contradictions: GroundTruthContradiction[];
  overallHealthScore: number;
  healthSummary: string;
}

interface GroundTruthResponse {
  success: boolean;
  groundTruth: GroundTruthData;
  stats: {
    learningsCount: number;
    qaCount: number;
    docsCount: number;
  };
}

const CATEGORIES = [
  { id: "manual_brain_dump", label: "General Rule" },
  { id: "policy", label: "Policy & FAQ" },
  { id: "hours", label: "Hours & Schedule" },
  { id: "pricing", label: "Pricing & Stock" },
  { id: "temporary_notice", label: "Temporary Notice" },
];

const EXPIRATION_OPTIONS = [
  { id: "never", label: "Permanent (Never)" },
  { id: "24h", label: "24 Hours" },
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "custom", label: "Custom Date" },
];

export const AIMemoryManager = ({ businessId }: AIMemoryManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"rules" | "audit">("rules");
  const [newLearning, setNewLearning] = useState("");
  const [expiresOption, setExpiresOption] = useState<string>("never");
  const [customExpireDate, setCustomExpireDate] = useState<string>("");
  const [category, setCategory] = useState<string>("manual_brain_dump");
  const [filterExpired, setFilterExpired] = useState<boolean>(false);
  const [groundTruthResult, setGroundTruthResult] = useState<GroundTruthResponse | null>(null);

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

  const getExpiresAtISO = () => {
    if (expiresOption === "never") return null;
    if (expiresOption === "24h") {
      return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }
    if (expiresOption === "7d") {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }
    if (expiresOption === "30d") {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    if (expiresOption === "custom" && customExpireDate) {
      return new Date(customExpireDate).toISOString();
    }
    return null;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const expiresAt = getExpiresAtISO();
      const { data, error } = await supabase.functions.invoke("ai-assist", {
        body: {
          action: "save_brain_dump",
          businessId,
          content: newLearning.trim(),
          expiresAt,
          category,
        },
      });

      if (error) throw error;
      if (data && data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["business-learnings", businessId] });
      setNewLearning("");
      setExpiresOption("never");
      setCustomExpireDate("");
      toast({
        title: "Added to Memory",
        description: data?.routedToChunks
          ? "Large note summarized for quick access & embedded into knowledge search."
          : "The AI has successfully memorized this information.",
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

  const synthesizeMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-assist", {
        body: {
          action: "synthesize_ground_truth",
          businessId,
        },
      });

      if (error) throw error;
      if (data && data.error) throw new Error(data.error);
      return data as GroundTruthResponse;
    },
    onSuccess: (data) => {
      setGroundTruthResult(data);
      toast({
        title: "Audit Complete",
        description: `Synthesized ground truth across ${data.stats.learningsCount} rules, ${data.stats.qaCount} Q&As, and ${data.stats.docsCount} documents.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Synthesis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const nowMs = Date.now();
  const displayedLearnings = (learnings || []).filter((l) => {
    const expStr = l.expires_at || l.metadata?.expires_at;
    const isExpired = expStr ? new Date(expStr).getTime() < nowMs : false;
    if (filterExpired && !isExpired) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-primary" />
            AI Knowledge & Ground Truth
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage raw memory rules or audit what the AI believes the unified ground truth is across all sources.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-muted p-1 rounded-xl">
          <Button
            variant={activeTab === "rules" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("rules")}
            className="rounded-lg text-xs font-medium gap-1.5 px-3.5 h-8 shadow-none"
          >
            <Tag className="w-3.5 h-3.5" />
            Rules & Brain Dump
            {learnings && learnings.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-primary-foreground/20 rounded-full text-[10px]">
                {learnings.length}
              </span>
            )}
          </Button>
          <Button
            variant={activeTab === "audit" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("audit")}
            className="rounded-lg text-xs font-medium gap-1.5 px-3.5 h-8 shadow-none"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            AI Ground Truth Audit
          </Button>
        </div>
      </div>

      {/* TAB 1: RULES & BRAIN DUMP */}
      {activeTab === "rules" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Brain Dump Form */}
          <Card className="border-t-4 border-t-primary shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <BrainCircuit className="w-5 h-5 text-primary" />
                AI Brain Dump
              </CardTitle>
              <CardDescription>
                Instantly teach the AI raw facts, rules, or temporary memos. Large notes (&gt;300 characters) are auto-summarized and embedded for deep semantic retrieval.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="e.g. 'We are out of stock on all blue widgets until next Tuesday.' or paste a full multi-paragraph store policy."
                  value={newLearning}
                  onChange={(e) => setNewLearning(e.target.value)}
                  className="min-h-[130px] resize-y bg-muted/20 text-sm leading-relaxed"
                />

                {newLearning.trim().length > 300 && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-start gap-3 text-xs text-muted-foreground animate-in fade-in duration-300">
                    <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-semibold text-foreground">Large Note Auto-Routing Active:</span> Because your note exceeds 300 characters ({newLearning.trim().length} chars), our AI will automatically generate a concise summary for the core system prompt while embedding the full text into vector search (<code className="bg-muted px-1 rounded">knowledge_chunks</code>) so no detail is ever lost.
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Category Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-primary" />
                      Category
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORIES.map((cat) => (
                        <Button
                          key={cat.id}
                          type="button"
                          variant={category === cat.id ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-xs px-2.5"
                          onClick={() => setCategory(cat.id)}
                        >
                          {cat.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Expiration Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      Expiration (Optional for temporary rules)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {EXPIRATION_OPTIONS.map((opt) => (
                        <Button
                          key={opt.id}
                          type="button"
                          variant={expiresOption === opt.id ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-xs px-2.5"
                          onClick={() => setExpiresOption(opt.id)}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                    {expiresOption === "custom" && (
                      <div className="pt-1.5 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <Input
                          type="datetime-local"
                          value={customExpireDate}
                          onChange={(e) => setCustomExpireDate(e.target.value)}
                          className="h-8 text-xs max-w-[220px]"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || !newLearning.trim()}
                  className="w-full sm:w-auto mt-2"
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing & Saving...
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
            <CardHeader className="pb-3 border-b bg-muted/10 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">What the AI Knows</CardTitle>
                <CardDescription>
                  These are the exact rules and insights the AI has learned from you and your team.
                </CardDescription>
              </div>
              {learnings && learnings.length > 0 && (
                <Button
                  variant={filterExpired ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFilterExpired(!filterExpired)}
                  className="text-xs gap-1.5 h-8"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {filterExpired ? "Showing Expired Only" : "Show All Statuses"}
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : !displayedLearnings?.length ? (
                <div className="p-12 text-center text-muted-foreground">
                  <BrainCircuit className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>{filterExpired ? "No expired rules found." : "The AI's memory is currently empty."}</p>
                  {!filterExpired && <p className="text-sm mt-1">Teach it something using the Brain Dump box above!</p>}
                </div>
              ) : (
                <div className="divide-y">
                  {displayedLearnings.map((learning) => {
                    const expiresAtStr = learning.expires_at || learning.metadata?.expires_at;
                    const isExpired = expiresAtStr ? new Date(expiresAtStr).getTime() < nowMs : false;
                    const isRouted = learning.metadata?.full_text_routed;

                    return (
                      <div
                        key={learning.id}
                        className={`p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:bg-muted/30 transition-colors group ${isExpired ? "opacity-60 bg-muted/20" : ""}`}
                      >
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <p className={`text-sm whitespace-pre-wrap leading-relaxed ${isExpired ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {learning.content}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                              {learning.learning_type.replace(/_/g, " ")}
                            </Badge>

                            <span className="text-[10px] sm:text-xs text-muted-foreground">
                              Learned {new Date(learning.created_at).toLocaleDateString()}
                            </span>

                            {learning.source_conversation_id && (
                              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none text-[10px]">
                                From Chat
                              </Badge>
                            )}

                            {isRouted && (
                              <Badge variant="secondary" className="text-[10px] gap-1 border border-primary/20">
                                <Sparkles className="w-2.5 h-2.5 text-primary" />
                                Summarized & Vector Routed
                              </Badge>
                            )}

                            {expiresAtStr && (
                              <Badge
                                variant={isExpired ? "destructive" : "outline"}
                                className={`text-[10px] gap-1 ${!isExpired ? "border-amber-500/40 text-amber-600 dark:text-amber-400" : ""}`}
                              >
                                <Clock className="w-2.5 h-2.5" />
                                {isExpired
                                  ? `Expired on ${new Date(expiresAtStr).toLocaleDateString()}`
                                  : `Expires ${new Date(expiresAtStr).toLocaleDateString()}`}
                              </Badge>
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
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: AI GROUND TRUTH & AUDIT */}
      {activeTab === "audit" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header Action Card */}
          <Card className="bg-gradient-to-r from-primary/10 via-muted/40 to-muted/10 border-primary/20">
            <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-semibold text-lg text-foreground">
                    Unified Ground Truth Synthesizer & Contradiction Audit
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  When you have dozens of rules layered over time across chats, brain dumps, Q&A pairs, and documents, it can be tough to predict exact behavior. This engine analyzes 100% of your knowledge base to generate a unified topic-by-topic ground truth sheet and flags any subtle contradictions.
                </p>
              </div>
              <Button
                onClick={() => synthesizeMutation.mutate()}
                disabled={synthesizeMutation.isPending}
                size="lg"
                className="shrink-0 gap-2 shadow-sm font-semibold"
              >
                {synthesizeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Auditing Knowledge Base...
                  </>
                ) : groundTruthResult ? (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Re-Synthesize Audit
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Synthesize Ground Truth Now
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Loading State */}
          {synthesizeMutation.isPending && (
            <Card className="border-dashed py-16">
              <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <BrainCircuit className="w-6 h-6 text-primary animate-spin" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium text-foreground">Cross-referencing memory layers...</h4>
                  <p className="text-xs text-muted-foreground max-w-md">
                    Our AI is reading every rule, pre-programmed Q&A, and document summary to construct a unified policy manifest and check for conflicts.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results View */}
          {!synthesizeMutation.isPending && groundTruthResult && (
            <div className="space-y-6">
              {/* Health Score & Stats Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-1 border-l-4 border-l-emerald-500 shadow-sm">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 font-bold text-2xl text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {groundTruthResult.groundTruth.overallHealthScore}%
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Audit Health Score
                      </div>
                      <div className="text-sm font-semibold text-foreground mt-0.5">
                        {groundTruthResult.groundTruth.overallHealthScore >= 90
                          ? "Clean & Consistent"
                          : groundTruthResult.groundTruth.overallHealthScore >= 75
                          ? "Minor Overlaps Detected"
                          : "Action Required"}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        Based on consistency & clarity across sources
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2 shadow-sm flex flex-col justify-center">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-semibold text-sm text-foreground">Knowledge Base Summary</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {groundTruthResult.groundTruth.healthSummary}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Badge variant="outline" className="text-[10px] bg-muted/40">
                        {groundTruthResult.stats.learningsCount} Active Rules
                      </Badge>
                      <Badge variant="outline" className="text-[10px] bg-muted/40">
                        {groundTruthResult.stats.qaCount} Pre-Programmed Q&As
                      </Badge>
                      <Badge variant="outline" className="text-[10px] bg-muted/40">
                        {groundTruthResult.stats.docsCount} Document Summaries
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Contradictions & Conflicts Alert Box */}
              {groundTruthResult.groundTruth.contradictions && groundTruthResult.groundTruth.contradictions.length > 0 && (
                <Card className="border-amber-500/40 bg-amber-500/5 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-base font-semibold">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      Potential Contradictions & Ambiguities Detected ({groundTruthResult.groundTruth.contradictions.length})
                    </CardTitle>
                    <CardDescription className="text-xs text-amber-700/80 dark:text-amber-300/80">
                      The AI found overlapping or conflicting instructions. Review and clarify or delete older rules below to ensure 100% predictable responses.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    {groundTruthResult.groundTruth.contradictions.map((conflict, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-background border border-amber-500/20 space-y-2 text-sm shadow-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                            {conflict.domain}
                          </span>
                          <Badge variant={conflict.severity === "high" ? "destructive" : "outline"} className="text-[10px] uppercase font-bold">
                            {conflict.severity} Severity
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {conflict.description}
                        </p>
                        {conflict.recommendation && (
                          <div className="p-2.5 rounded-lg bg-muted/50 border text-xs text-foreground flex items-start gap-2 mt-2">
                            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold">AI Recommendation:</span> {conflict.recommendation}
                            </div>
                          </div>
                        )}
                        {conflict.conflictingSources && conflict.conflictingSources.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="text-[10px] text-muted-foreground mr-1">Flagged in:</span>
                            {conflict.conflictingSources.map((src, sIdx) => (
                              <code key={sIdx} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground">
                                {src}
                              </code>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Synthesized Ground Truth Topics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Synthesized Topic Manifest
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Unified ground truth currently guiding customer chats
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groundTruthResult.groundTruth.topics.map((topic, idx) => (
                    <Card key={idx} className="shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <span className="text-lg">{topic.icon || "📌"}</span>
                            {topic.topicName}
                          </CardTitle>
                          {topic.sourceCount && (
                            <Badge variant="secondary" className="text-[10px] shrink-0">
                              {topic.sourceCount} {topic.sourceCount === 1 ? "source" : "sources"}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0 flex-1 flex flex-col justify-between">
                        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed bg-muted/20 p-3 rounded-lg border border-border/50">
                          {topic.synthesizedTruth}
                        </p>
                        {topic.keyRules && topic.keyRules.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                              Key Takeaways & Constraints:
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {topic.keyRules.map((kr, kIdx) => (
                                <Badge key={kIdx} variant="outline" className="text-[11px] font-normal bg-background/80">
                                  ✓ {kr}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Empty State when Audit not run yet */}
          {!synthesizeMutation.isPending && !groundTruthResult && (
            <Card className="border-dashed py-14">
              <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div className="space-y-1 max-w-md">
                  <h4 className="font-semibold text-foreground text-base">Ready to audit your AI ground truth?</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Click the button at the top right to cross-reference all your rules, Q&As, and document summaries into a clear, topic-by-topic policy manifest.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
