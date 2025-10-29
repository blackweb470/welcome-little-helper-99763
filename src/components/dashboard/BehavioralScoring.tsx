import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface VisitorScore {
  id: string;
  visitor_id: string;
  engagement_score: number;
  conversion_likelihood: string;
  page_views: number;
  total_time_seconds: number;
  created_at: string;
}

export const BehavioralScoring = ({ businessId }: { businessId: string }) => {
  const { data: highScorers, isLoading } = useQuery({
    queryKey: ["behavioral-scores", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visitor_sessions")
        .select("*")
        .eq("business_id", businessId)
        .gte("engagement_score", 40)
        .order("engagement_score", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as VisitorScore[];
    }
  });

  const getLikelihoodColor = (likelihood: string) => {
    switch (likelihood) {
      case "high":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getLikelihoodIcon = (likelihood: string) => {
    switch (likelihood) {
      case "high":
        return <TrendingUp className="h-4 w-4" />;
      case "medium":
        return <Minus className="h-4 w-4" />;
      default:
        return <TrendingDown className="h-4 w-4" />;
    }
  };

  if (isLoading) return <div>Loading behavioral scores...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>High-Value Visitors</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {highScorers?.map((visitor) => (
            <div
              key={visitor.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-medium">
                    Visitor {visitor.visitor_id.substring(0, 8)}...
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {visitor.page_views} views • {Math.floor(visitor.total_time_seconds / 60)}m on site
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold">{visitor.engagement_score}</div>
                  <div className="text-xs text-muted-foreground">Engagement Score</div>
                </div>
                <Badge className={getLikelihoodColor(visitor.conversion_likelihood)}>
                  {getLikelihoodIcon(visitor.conversion_likelihood)}
                  <span className="ml-2">{visitor.conversion_likelihood}</span>
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};