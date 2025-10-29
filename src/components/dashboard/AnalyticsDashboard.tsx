import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, MessageSquare, Users, Clock, Smile, Meh, Frown, AlertTriangle } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface AnalyticsDashboardProps {
  businessId: string;
}

const SENTIMENT_COLORS = {
  positive: "hsl(var(--chart-1))",
  neutral: "hsl(var(--chart-2))",
  negative: "hsl(var(--chart-3))",
  frustrated: "hsl(var(--chart-4))",
};

export const AnalyticsDashboard = ({ businessId }: AnalyticsDashboardProps) => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversation_analytics')
        .select('*')
        .eq('business_id', businessId)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <div className="text-muted-foreground">Loading analytics...</div>;
  }

  if (!analytics || analytics.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No conversation data available yet
        </CardContent>
      </Card>
    );
  }

  // Calculate metrics
  const totalConversations = analytics.length;
  const avgMessages = analytics.reduce((sum, a) => sum + (a.message_count || 0), 0) / totalConversations;
  const avgDuration = analytics.reduce((sum, a) => sum + (a.duration_seconds || 0), 0) / totalConversations;
  const avgSentiment = analytics.reduce((sum, a) => sum + (a.avg_sentiment_score || 0), 0) / totalConversations;

  // Sentiment distribution
  const sentimentDist = analytics.reduce((acc, a) => {
    const sentiment = a.primary_sentiment || 'neutral';
    acc[sentiment] = (acc[sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sentimentData = Object.entries(sentimentDist).map(([name, value]) => ({
    name,
    value,
    color: SENTIMENT_COLORS[name as keyof typeof SENTIMENT_COLORS] || SENTIMENT_COLORS.neutral
  }));

  // Time series data (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    const dayConversations = analytics.filter(a => {
      const convDate = new Date(a.started_at);
      return convDate >= dayStart && convDate <= dayEnd;
    });

    return {
      date: format(date, 'MMM dd'),
      conversations: dayConversations.length,
      avgSentiment: dayConversations.length > 0 
        ? dayConversations.reduce((sum, a) => sum + (a.avg_sentiment_score || 0), 0) / dayConversations.length 
        : 0
    };
  });

  // Device type distribution
  const deviceDist = analytics.reduce((acc, a) => {
    const device = a.device_type || 'unknown';
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const deviceData = Object.entries(deviceDist).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversations}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Messages</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgMessages.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Per conversation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(avgDuration / 60)}m</div>
            <p className="text-xs text-muted-foreground">{Math.floor(avgDuration % 60)}s average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Sentiment</CardTitle>
            {avgSentiment > 0.5 ? (
              <Smile className="h-4 w-4 text-muted-foreground" />
            ) : avgSentiment < -0.2 ? (
              <Frown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Meh className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(avgSentiment * 100).toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              {avgSentiment > 0.5 ? 'Positive' : avgSentiment < -0.2 ? 'Negative' : 'Neutral'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Conversations Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="conversations" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sentiment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Device Types</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deviceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sentiment Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[-1, 1]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avgSentiment" stroke="hsl(var(--chart-2))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
