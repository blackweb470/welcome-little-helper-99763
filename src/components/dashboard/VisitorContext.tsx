import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, MousePointer, Eye, TrendingUp } from "lucide-react";

interface VisitorContextProps {
  conversationId: string;
}

export const VisitorContext = ({ conversationId }: VisitorContextProps) => {
  const { data: session, isLoading } = useQuery({
    queryKey: ['visitor-session', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visitor_sessions')
        .select('*')
        .eq('conversation_id', conversationId)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  const { data: events } = useQuery({
    queryKey: ['visitor-events', session?.id],
    queryFn: async () => {
      if (!session?.id) return [];
      
      const { data, error } = await supabase
        .from('visitor_events')
        .select('*')
        .eq('session_id', session.id)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!session?.id
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="pt-2">
            <Skeleton className="h-4 w-24 mb-2" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return <div className="text-sm text-muted-foreground">No visitor data available</div>;
  }

  const engagementScore = session.page_views * 5 + (session.total_time_seconds / 10);
  const formattedTime = Math.floor(session.total_time_seconds / 60);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Visitor Context
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">{session.page_views} pages</div>
              <div className="text-xs text-muted-foreground">Views</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">{formattedTime}m</div>
              <div className="text-xs text-muted-foreground">Time on site</div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Engagement</span>
            <Badge variant={engagementScore > 50 ? "default" : "secondary"}>
              {engagementScore > 50 ? "High" : "Medium"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Device</span>
            <span className="text-sm font-medium">{session.device_type}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Browser</span>
            <span className="text-sm font-medium">{session.browser}</span>
          </div>
        </div>

        {session.referrer_url && (
          <div>
            <div className="text-sm text-muted-foreground mb-1">Referrer</div>
            <div className="text-xs font-mono bg-muted p-2 rounded truncate">
              {session.referrer_url}
            </div>
          </div>
        )}

        {events && events.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2 flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              Recent Activity
            </div>
            <div className="space-y-1">
              {events.slice(0, 5).map((event) => (
                <div key={event.id} className="text-xs bg-muted p-2 rounded">
                  <div className="font-medium">{event.event_type}</div>
                  <div className="text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
