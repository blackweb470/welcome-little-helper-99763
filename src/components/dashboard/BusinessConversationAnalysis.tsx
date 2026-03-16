import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, MessageSquare, HelpCircle, TrendingDown, Calendar, Sparkles } from "lucide-react";
import { useState } from "react";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface BusinessConversationAnalysisProps {
  businessId: string;
}

interface AnalysisItem {
  item: string;
  frequency: number;
  severity: 'high' | 'medium' | 'low';
  impact?: string;
  suggestedAnswer?: string;
  context?: string;
}

interface AnalysisData {
  issues: AnalysisItem[];
  questions: AnalysisItem[];
  complaints: AnalysisItem[];
  summary: string;
  actionItems: string[];
  totalConversations: number;
  averageSentiment: number;
}

export const BusinessConversationAnalysis = ({ businessId }: BusinessConversationAnalysisProps) => {
  const [dateFilter, setDateFilter] = useState("7");

  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch (dateFilter) {
      case "1":
        startDate = startOfDay(subDays(now, 1));
        endDate = endOfDay(now);
        break;
      case "today":
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case "7":
        startDate = startOfDay(subDays(now, 7));
        endDate = endOfDay(now);
        break;
      case "30":
        startDate = startOfDay(subDays(now, 30));
        endDate = endOfDay(now);
        break;
      default:
        startDate = startOfDay(subDays(now, 7));
        endDate = endOfDay(now);
    }

    return { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString() 
    };
  };

  const { data: analysis, isLoading, error: queryError } = useQuery({
    queryKey: ['conversation-analysis', businessId, dateFilter],
    queryFn: async () => {
      const { startDate, endDate } = getDateRange();
      
      const { data, error } = await supabase.functions.invoke('analyze-conversations', {
        body: { businessId, startDate, endDate }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as AnalysisData;
    },
    refetchInterval: 60000,
    retry: (failureCount, error) => {
      // Don't retry on rate limit or payment errors
      const msg = error?.message || '';
      if (msg.includes('Rate limited') || msg.includes('credits')) return false;
      return failureCount < 2;
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.3) return { label: 'Positive', color: 'bg-green-500' };
    if (score < -0.3) return { label: 'Negative', color: 'bg-red-500' };
    return { label: 'Neutral', color: 'bg-yellow-500' };
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>AI Conversation Analysis</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="1">Last 24 Hours</SelectItem>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : queryError ? (
            <div className="text-center py-8 space-y-2">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-sm text-destructive font-medium">{queryError.message}</p>
              <p className="text-xs text-muted-foreground">Try again in a few moments</p>
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{analysis.totalConversations}</div>
                    <div className="text-sm text-muted-foreground">Total Conversations</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${getSentimentLabel(analysis.averageSentiment).color}`} />
                      <div className="text-2xl font-bold">
                        {getSentimentLabel(analysis.averageSentiment).label}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">Average Sentiment</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {analysis.issues.length + analysis.questions.length + analysis.complaints.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Items Identified</div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">AI Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{analysis.summary}</p>
                </CardContent>
              </Card>

              {/* Issues with Priority Badges */}
              {analysis.issues && analysis.issues.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <CardTitle className="text-lg">Issues Reported</CardTitle>
                      <Badge variant="secondary">{analysis.issues.length}</Badge>
                      <Badge variant="destructive" className="ml-auto">
                        {analysis.issues.filter(i => i.severity === 'high').length} Critical
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-3">
                        {analysis.issues
                          .sort((a, b) => {
                            const severityOrder = { high: 0, medium: 1, low: 2 };
                            return severityOrder[a.severity] - severityOrder[b.severity];
                          })
                          .map((issue: any, idx) => (
                          <div key={idx} className={`flex items-start justify-between gap-4 p-3 border-2 rounded-lg hover:bg-accent/50 transition-colors ${
                            issue.severity === 'high' ? 'border-destructive/30 bg-destructive/5' : ''
                          }`}>
                            <div className="flex-1">
                              <div className="flex items-start gap-2 mb-1">
                                <p className="text-sm font-medium flex-1">{issue.item}</p>
                                <Badge variant={getSeverityColor(issue.severity) as any}>
                                  {issue.severity}
                                </Badge>
                              </div>
                              {issue.impact && (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  Impact: {issue.impact}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                Reported {issue.frequency} time{issue.frequency !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Top 3 Most Frequent Questions with Answers */}
              {analysis.questions && analysis.questions.length > 0 && (
                <Card className="border-blue-500/20 bg-blue-500/5">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-blue-500" />
                      <CardTitle className="text-lg">Top 3 Most Frequent Questions</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysis.questions
                        .sort((a: any, b: any) => b.frequency - a.frequency)
                        .slice(0, 3)
                        .map((question: any, idx) => (
                        <div key={idx} className="p-4 border-2 border-blue-500/20 rounded-lg bg-background">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                                {idx + 1}
                              </div>
                              <Badge variant={getSeverityColor(question.severity) as any}>
                                {question.severity} priority
                              </Badge>
                            </div>
                            <Badge variant="outline" className="bg-blue-500/10">
                              {question.frequency}x asked
                            </Badge>
                          </div>
                          <p className="text-sm font-semibold ml-10 mb-2">{question.item}</p>
                          {question.suggestedAnswer && (
                            <div className="ml-10 mt-2 p-2 bg-muted rounded text-xs">
                              <span className="font-medium text-green-600">💡 Suggested Answer: </span>
                              {question.suggestedAnswer}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* All Questions */}
              {analysis.questions && analysis.questions.length > 3 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-blue-500" />
                      <CardTitle className="text-lg">All Questions</CardTitle>
                      <Badge variant="secondary">{analysis.questions.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-3">
                        {analysis.questions.slice(3).map((question: any, idx) => (
                          <div key={idx} className="flex items-start justify-between gap-4 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{question.item}</p>
                              {question.suggestedAnswer && (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  💡 {question.suggestedAnswer}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                Asked {question.frequency} time{question.frequency !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <Badge variant={getSeverityColor(question.severity) as any}>
                              {question.severity}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Complaints with Context */}
              {analysis.complaints && analysis.complaints.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-orange-500" />
                      <CardTitle className="text-lg">Customer Complaints</CardTitle>
                      <Badge variant="secondary">{analysis.complaints.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-3">
                        {analysis.complaints.map((complaint: any, idx) => (
                          <div key={idx} className="flex items-start justify-between gap-4 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{complaint.item}</p>
                              {complaint.context && (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  {complaint.context}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                Mentioned {complaint.frequency} time{complaint.frequency !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <Badge variant={getSeverityColor(complaint.severity) as any}>
                              {complaint.severity}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Action Items */}
              {analysis.actionItems && analysis.actionItems.length > 0 && (
                <Card className="border-blue-500/20 bg-blue-500/5">
                  <CardHeader>
                    <CardTitle className="text-base">Recommended Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.actionItems.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-primary font-bold">{idx + 1}.</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No analysis data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessConversationAnalysis;
