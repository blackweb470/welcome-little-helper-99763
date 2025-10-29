import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface StatusIndicatorProps {
  businessId: string;
}

export const StatusIndicator = ({ businessId }: StatusIndicatorProps) => {
  const { data: business } = useQuery({
    queryKey: ["business-status", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("online_status, average_response_time_seconds, target_sla_seconds")
        .eq("id", businessId)
        .single();

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const formatTime = (seconds?: number) => {
    if (!seconds) return "N/A";
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m`;
  };

  const isOnline = business?.online_status ?? true;
  const avgResponseTime = business?.average_response_time_seconds;
  const targetSLA = business?.target_sla_seconds;

  return (
    <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
      <Badge variant={isOnline ? "default" : "secondary"}>
        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${isOnline ? "bg-green-500" : "bg-gray-400"}`} />
        {isOnline ? "Online" : "Offline"}
      </Badge>
      
      {avgResponseTime && (
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Avg Response:</span>
          <span className="font-medium">{formatTime(avgResponseTime)}</span>
        </div>
      )}

      {targetSLA && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Target SLA:</span>
          <span className="font-medium">{formatTime(targetSLA)}</span>
        </div>
      )}
    </div>
  );
};