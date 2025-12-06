import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, MessageSquare, Users, Clock, Smile, Meh, Frown, Activity, BarChart3, PieChartIcon, Zap } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalyticsDashboardProps {
  businessId: string;
}

// Premium monochrome palette
const CHART_COLORS = {
  primary: "#000000",
  secondary: "#404040",
  tertiary: "#808080",
  quaternary: "#b0b0b0",
  light: "#e0e0e0",
};

const SENTIMENT_COLORS = {
  positive: "#000000",
  neutral: "#808080",
  negative: "#404040",
  frustrated: "#606060",
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
      <div className="space-y-6 p-6 bg-background">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border border-border/50 bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24 bg-muted" />
                <Skeleton className="h-10 w-10 rounded-xl bg-muted" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-20 mb-2 bg-muted" />
                <Skeleton className="h-3 w-32 bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border border-border/50 bg-card">
              <CardHeader>
                <Skeleton className="h-5 w-40 bg-muted" />
                <Skeleton className="h-4 w-56 bg-muted" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[280px] w-full bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics || analytics.length === 0) {
    return (
      <div className="p-6 bg-background min-h-[600px] flex items-center justify-center">
        <Card className="border border-border/50 bg-card max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-20 w-20 rounded-2xl bg-foreground/5 flex items-center justify-center mb-6">
              <Activity className="h-10 w-10 text-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">No Data Available</h3>
            <p className="text-muted-foreground max-w-xs">
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
    name: name.charAt(0).toUpperCase() + name.slice(1),
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
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  // Peak conversation hours (0-23)
  const hourlyDist = analytics.reduce((acc, a) => {
    const hour = new Date(a.started_at).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    conversations: hourlyDist[i] || 0
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg px-4 py-3 shadow-xl">
          <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-muted-foreground">
              {entry.name}: <span className="font-medium text-foreground">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 p-6 bg-background">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Monitor your conversation performance and customer sentiment</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border/50 bg-card hover:border-foreground/20 transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Conversations</CardTitle>
            <div className="h-11 w-11 rounded-xl bg-foreground flex items-center justify-center group-hover:scale-105 transition-transform">
              <MessageSquare className="h-5 w-5 text-background" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight text-foreground">{totalConversations}</div>
            <div className="flex items-center gap-1.5 mt-2">
              <TrendingUp className="h-3.5 w-3.5 text-foreground" />
              <span className="text-xs text-muted-foreground">All time total</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card hover:border-foreground/20 transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg. Messages</CardTitle>
            <div className="h-11 w-11 rounded-xl bg-foreground/10 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5 text-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight text-foreground">{avgMessages.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-2">Per conversation</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card hover:border-foreground/20 transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg. Duration</CardTitle>
            <div className="h-11 w-11 rounded-xl bg-foreground/10 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="h-5 w-5 text-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight text-foreground">
              {Math.floor(avgDuration / 60)}:{String(Math.floor(avgDuration % 60)).padStart(2, '0')}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Minutes per chat</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card hover:border-foreground/20 transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sentiment Score</CardTitle>
            <div className="h-11 w-11 rounded-xl bg-foreground/10 flex items-center justify-center group-hover:scale-105 transition-transform">
              {avgSentiment > 0.3 ? (
                <Smile className="h-5 w-5 text-foreground" />
              ) : avgSentiment > -0.3 ? (
                <Meh className="h-5 w-5 text-foreground" />
              ) : (
                <Frown className="h-5 w-5 text-foreground" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight text-foreground">{(avgSentiment * 100).toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              {avgSentiment > 0.3 ? 'Positive feedback' : avgSentiment > -0.3 ? 'Neutral sentiment' : 'Needs attention'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Conversations Over Time - Area Chart */}
        <Card className="border border-border/50 bg-card hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-foreground flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-background" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">Conversation Volume</CardTitle>
                <CardDescription className="text-muted-foreground">Last 7 days activity</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#999"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#999"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="conversations"
                  name="Conversations"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2.5}
                  fill="url(#colorConv)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sentiment Distribution - Donut Chart */}
        <Card className="border border-border/50 bg-card hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-foreground/10 flex items-center justify-center">
                <PieChartIcon className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">Sentiment Distribution</CardTitle>
                <CardDescription className="text-muted-foreground">Customer mood breakdown</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Peak Hours */}
        <Card className="border border-border/50 bg-card hover:shadow-lg transition-shadow lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-foreground/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">Peak Hours</CardTitle>
                <CardDescription className="text-muted-foreground">Conversation distribution by hour</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={hourlyData} barCategoryGap="15%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis 
                  dataKey="hour" 
                  stroke="#999"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval={2}
                />
                <YAxis 
                  stroke="#999"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="conversations"
                  name="Conversations"
                  fill={CHART_COLORS.primary}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Distribution */}
        <Card className="border border-border/50 bg-card hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-foreground/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">Devices</CardTitle>
                <CardDescription className="text-muted-foreground">Visitor platforms</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={deviceData} layout="vertical" barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" horizontal={false} />
                <XAxis 
                  type="number"
                  stroke="#999"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  type="category"
                  dataKey="name" 
                  stroke="#999"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value"
                  name="Visitors"
                  fill={CHART_COLORS.secondary}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Trend */}
      <Card className="border border-border/50 bg-card hover:shadow-lg transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-foreground/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">Sentiment Trend</CardTitle>
              <CardDescription className="text-muted-foreground">Average customer sentiment over the last 7 days</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#999"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={[-1, 1]} 
                stroke="#999"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                ticks={[-1, -0.5, 0, 0.5, 1]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="avgSentiment"
                name="Sentiment"
                stroke={CHART_COLORS.primary}
                strokeWidth={2.5}
                dot={{ fill: CHART_COLORS.primary, strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: CHART_COLORS.primary }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
