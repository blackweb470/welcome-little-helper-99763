import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, MessageSquare, Users, Clock, Smile, Meh, Frown, AlertTriangle, Activity } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

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
    return (
      <div className="space-y-6 p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border/40">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics || analytics.length === 0) {
    return (
      <div className="p-6">
        <Card className="border-border/40 bg-gradient-to-br from-card to-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Start having conversations with your visitors to see analytics and insights here.
            </p>
          </CardContent>
        </Card>
      </div>
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
    <div className="space-y-6 p-6">
      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/40 bg-gradient-to-br from-card to-primary/5 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Conversations</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{totalConversations}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              All time
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-gradient-to-br from-card to-chart-1/5 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Messages</CardTitle>
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--chart-1) / 0.1)' }}>
              <Users className="h-4 w-4" style={{ color: 'hsl(var(--chart-1))' }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{avgMessages.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">Per conversation</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-gradient-to-br from-card to-chart-2/5 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Duration</CardTitle>
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--chart-2) / 0.1)' }}>
              <Clock className="h-4 w-4" style={{ color: 'hsl(var(--chart-2))' }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{Math.floor(avgDuration / 60)}m</div>
            <p className="text-xs text-muted-foreground mt-1">{Math.floor(avgDuration % 60)}s average</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-gradient-to-br from-card to-chart-3/5 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Sentiment</CardTitle>
            <div className="p-2 rounded-lg" style={{ backgroundColor: avgSentiment > 0.5 ? 'hsl(var(--chart-2) / 0.1)' : avgSentiment < -0.2 ? 'hsl(var(--chart-3) / 0.1)' : 'hsl(var(--chart-4) / 0.1)' }}>
              {avgSentiment > 0.5 ? (
                <Smile className="h-4 w-4" style={{ color: 'hsl(var(--chart-2))' }} />
              ) : avgSentiment < -0.2 ? (
                <Frown className="h-4 w-4" style={{ color: 'hsl(var(--chart-3))' }} />
              ) : (
                <Meh className="h-4 w-4" style={{ color: 'hsl(var(--chart-4))' }} />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{(avgSentiment * 100).toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {avgSentiment > 0.5 ? 'Positive' : avgSentiment < -0.2 ? 'Negative' : 'Neutral'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/40 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Conversations Over Time
            </CardTitle>
            <CardDescription>Daily conversation volume for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={last7Days}>
                <defs>
                  <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="conversations" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--chart-1))', r: 4 }}
                  activeDot={{ r: 6 }}
                  fillOpacity={1}
                  fill="url(#colorConversations)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/40 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smile className="h-5 w-5" style={{ color: 'hsl(var(--chart-2))' }} />
              Sentiment Distribution
            </CardTitle>
            <CardDescription>Breakdown of customer sentiment</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/40 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" style={{ color: 'hsl(var(--chart-3))' }} />
              Device Types
            </CardTitle>
            <CardDescription>Visitor device distribution</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deviceData}>
                <defs>
                  <linearGradient id="colorDevice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill="url(#colorDevice)" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/40 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Meh className="h-5 w-5" style={{ color: 'hsl(var(--chart-4))' }} />
              Sentiment Trend
            </CardTitle>
            <CardDescription>Average sentiment over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={last7Days}>
                <defs>
                  <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  domain={[-1, 1]} 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgSentiment" 
                  stroke="hsl(var(--chart-4))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--chart-4))', r: 4 }}
                  activeDot={{ r: 6 }}
                  fillOpacity={1}
                  fill="url(#colorSentiment)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
