import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Clock, MessageSquare, TrendingUp, Users, Award, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AgentPerformanceProps {
  businessId: string;
}

interface AgentStats {
  agent_id: string;
  agent_name: string;
  total_chats: number;
  avg_response_time: number;
  avg_sentiment: number;
  resolution_rate: number;
  active_chats: number;
}

interface OverviewStats {
  total_chats: number;
  avg_response_time: number;
  avg_sentiment: number;
  active_agents: number;
}

const AgentPerformance = ({ businessId }: AgentPerformanceProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7");
  const [overviewStats, setOverviewStats] = useState<OverviewStats>({
    total_chats: 0,
    avg_response_time: 0,
    avg_sentiment: 0,
    active_agents: 0,
  });
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchPerformanceData();
    const interval = setInterval(fetchPerformanceData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [businessId, timeRange]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Call the edge function to get performance stats
      const { data, error } = await supabase.functions.invoke('agent-performance-stats', {
        body: { businessId, days: parseInt(timeRange) }
      });

      if (error) throw error;

      if (data) {
        setOverviewStats(data.overview);
        setAgentStats(data.agents || []);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Error fetching performance data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch agent performance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  const getSentimentBadge = (score: number) => {
    if (score >= 0.7) return <Badge className="bg-green-500">Positive</Badge>;
    if (score >= 0.4) return <Badge className="bg-yellow-500">Neutral</Badge>;
    return <Badge className="bg-red-500">Negative</Badge>;
  };

  const getPerformanceColor = (value: number, metric: 'response' | 'sentiment' | 'resolution') => {
    if (metric === 'response') {
      if (value < 30) return "text-green-600";
      if (value < 60) return "text-yellow-600";
      return "text-red-600";
    }
    if (metric === 'sentiment' || metric === 'resolution') {
      if (value >= 0.7) return "text-green-600";
      if (value >= 0.4) return "text-yellow-600";
      return "text-red-600";
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ["Agent Name", "Total Chats", "Avg Response Time (s)", "Avg Sentiment", "Resolution Rate", "Active Chats"],
      ...agentStats.map(agent => [
        agent.agent_name,
        agent.total_chats,
        agent.avg_response_time.toFixed(2),
        agent.avg_sentiment.toFixed(2),
        (agent.resolution_rate * 100).toFixed(1) + "%",
        agent.active_chats
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-performance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Agent Performance</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Today</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewStats.total_chats}</div>
            <p className="text-xs text-muted-foreground">Handled by agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(overviewStats.avg_response_time, 'response')}`}>
              {formatTime(overviewStats.avg_response_time)}
            </div>
            <p className="text-xs text-muted-foreground">Time to first response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(overviewStats.avg_sentiment, 'sentiment')}`}>
              {(overviewStats.avg_sentiment * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">Based on sentiment analysis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewStats.active_agents}</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Leaderboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            <CardTitle>Agent Leaderboard</CardTitle>
          </div>
          <CardDescription>Performance metrics by individual agent</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading agent data...</div>
          ) : agentStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No agent data available for this period</div>
          ) : (
            <div className="space-y-4">
              {agentStats.map((agent, index) => (
                <div 
                  key={agent.agent_id} 
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{agent.agent_name}</h4>
                      <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{agent.total_chats} chats</span>
                        {agent.active_chats > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {agent.active_chats} active
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-6 items-center">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Response Time</p>
                      <p className={`font-semibold ${getPerformanceColor(agent.avg_response_time, 'response')}`}>
                        {formatTime(agent.avg_response_time)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Sentiment</p>
                      {getSentimentBadge(agent.avg_sentiment)}
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Resolution</p>
                      <p className={`font-semibold ${getPerformanceColor(agent.resolution_rate, 'resolution')}`}>
                        {(agent.resolution_rate * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentPerformance;