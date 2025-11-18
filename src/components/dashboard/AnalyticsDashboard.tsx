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
      <div className="space-y-4 p-6 bg-muted/20">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-1" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[280px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics || analytics.length === 0) {
    return (
      <div className="p-6 bg-muted/20 min-h-[600px] flex items-center justify-center">
        <Card className="border-0 shadow-sm max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Activity className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
            <p className="text-sm text-muted-foreground">
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

  // Peak conversation hours (0-23)
  const hourlyDist = analytics.reduce((acc, a) => {
    const hour = new Date(a.started_at).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    conversations: hourlyDist[i] || 0
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

        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg. Messages</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgMessages.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">Per conversation</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg. Duration</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.floor(avgDuration / 60)}:{String(Math.floor(avgDuration % 60)).padStart(2, '0')}</div>
            <p className="text-xs text-muted-foreground mt-1">Minutes per chat</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sentiment Score</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              {avgSentiment > 0.3 ? (
                <Smile className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              ) : avgSentiment > -0.3 ? (
                <Meh className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <Frown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(avgSentiment * 100).toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {avgSentiment > 0.3 ? 'Positive feedback' : avgSentiment > -0.3 ? 'Neutral' : 'Needs attention'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

        <Card className="border-border/40 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" style={{ color: 'hsl(var(--chart-5))' }} />
              Peak Conversation Hours
            </CardTitle>
            <CardDescription>Distribution of conversations by hour of day</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorHourly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="hour" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  interval={2}
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
                  dataKey="conversations" 
                  fill="url(#colorHourly)" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
