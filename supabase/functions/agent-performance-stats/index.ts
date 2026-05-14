import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-visitor-id',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { businessId, days = 7 } = await req.json();

    if (!businessId) {
      throw new Error('Business ID is required');
    }

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    console.log(`Fetching agent performance for business ${businessId}, last ${days} days`);

    // Get all conversations for this business within the time range
    const { data: conversations, error: convError } = await supabaseClient
      .from('conversations')
      .select('id, started_at, business_id')
      .eq('business_id', businessId)
      .gte('started_at', dateFrom.toISOString());

    if (convError) throw convError;

    const conversationIds = conversations?.map(c => c.id) || [];

    if (conversationIds.length === 0) {
      return new Response(
        JSON.stringify({
          overview: {
            total_chats: 0,
            avg_response_time: 0,
            avg_sentiment: 0,
            active_agents: 0,
          },
          agents: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get live chat sessions
    const { data: sessions, error: sessionsError } = await supabaseClient
      .from('live_chat_sessions')
      .select('id, conversation_id, agent_id, status, queued_at, accepted_at, ended_at')
      .in('conversation_id', conversationIds)
      .not('agent_id', 'is', null);

    if (sessionsError) throw sessionsError;

    // Get agent profiles separately
    const agentIds = [...new Set(sessions?.map(s => s.agent_id).filter(Boolean) || [])];
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, full_name, email')
      .in('id', agentIds);

    if (profilesError) throw profilesError;

    // Create a map of agent profiles
    const profileMap = new Map();
    profiles?.forEach((profile: any) => {
      profileMap.set(profile.id, profile);
    });

    // Get all messages for sentiment analysis
    const { data: messages, error: messagesError } = await supabaseClient
      .from('messages')
      .select('conversation_id, role, sentiment_score, created_at')
      .in('conversation_id', conversationIds);

    if (messagesError) throw messagesError;

    // Get currently active agents
    const { data: activeAgents, error: activeError } = await supabaseClient
      .from('agent_availability')
      .select('user_id')
      .eq('business_id', businessId)
      .eq('status', 'online');

    if (activeError) throw activeError;

    // Calculate metrics per agent
    const agentMetrics = new Map();

    sessions?.forEach((session: any) => {
      if (!session.agent_id) return;

      const agentId = session.agent_id;
      const profile = profileMap.get(agentId);
      const agentName = profile?.full_name || profile?.email || 'Unknown Agent';

      if (!agentMetrics.has(agentId)) {
        agentMetrics.set(agentId, {
          agent_id: agentId,
          agent_name: agentName,
          total_chats: 0,
          response_times: [],
          sentiments: [],
          resolved: 0,
          active_chats: 0,
        });
      }

      const metrics = agentMetrics.get(agentId);
      metrics.total_chats += 1;

      // Calculate response time (time from queued to accepted)
      if (session.queued_at && session.accepted_at) {
        const queuedTime = new Date(session.queued_at).getTime();
        const acceptedTime = new Date(session.accepted_at).getTime();
        const responseTime = (acceptedTime - queuedTime) / 1000; // in seconds
        metrics.response_times.push(responseTime);
      }

      // Check if resolved
      if (session.status === 'ended' && session.ended_at) {
        metrics.resolved += 1;
      }

      // Count active chats
      if (session.status === 'active') {
        metrics.active_chats += 1;
      }

      // Get sentiment scores for this conversation
      const convMessages = messages?.filter((m: any) => 
        m.conversation_id === session.conversation_id && 
        m.sentiment_score !== null
      );
      
      convMessages?.forEach((msg: any) => {
        metrics.sentiments.push(msg.sentiment_score);
      });
    });

    // Calculate aggregated stats
    const agentStats = Array.from(agentMetrics.values()).map((metrics: any) => ({
      agent_id: metrics.agent_id,
      agent_name: metrics.agent_name,
      total_chats: metrics.total_chats,
      avg_response_time: metrics.response_times.length > 0
        ? metrics.response_times.reduce((a: number, b: number) => a + b, 0) / metrics.response_times.length
        : 0,
      avg_sentiment: metrics.sentiments.length > 0
        ? metrics.sentiments.reduce((a: number, b: number) => a + b, 0) / metrics.sentiments.length
        : 0.5,
      resolution_rate: metrics.total_chats > 0 ? metrics.resolved / metrics.total_chats : 0,
      active_chats: metrics.active_chats,
    }));

    // Sort by total chats (leaderboard)
    agentStats.sort((a, b) => b.total_chats - a.total_chats);

    // Calculate overview statistics
    const totalChats = agentStats.reduce((sum, agent) => sum + agent.total_chats, 0);
    const avgResponseTime = agentStats.length > 0
      ? agentStats.reduce((sum, agent) => sum + agent.avg_response_time, 0) / agentStats.length
      : 0;
    const avgSentiment = agentStats.length > 0
      ? agentStats.reduce((sum, agent) => sum + agent.avg_sentiment, 0) / agentStats.length
      : 0.5;

    const overview = {
      total_chats: totalChats,
      avg_response_time: avgResponseTime,
      avg_sentiment: avgSentiment,
      active_agents: activeAgents?.length || 0,
    };

    console.log(`Performance stats calculated: ${agentStats.length} agents, ${totalChats} total chats`);

    return new Response(
      JSON.stringify({ overview, agents: agentStats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in agent-performance-stats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});