import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, visitorId, businessId } = await req.json();
    console.log('Cancel live agent request:', { sessionId, visitorId, businessId });

    if (!sessionId && !visitorId) {
      return new Response(
        JSON.stringify({ error: 'sessionId or visitorId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let sessionToCancel;

    if (sessionId) {
      // Cancel by session ID
      const { data, error } = await supabase
        .from('live_chat_sessions')
        .update({ status: 'cancelled', ended_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('status', 'queued')
        .select()
        .single();

      if (error) {
        console.error('Error canceling session:', error);
        throw error;
      }
      sessionToCancel = data;
    } else if (visitorId && businessId) {
      // Find and cancel visitor's queued session
      const { data: visitorConversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('visitor_id', visitorId)
        .eq('business_id', businessId);

      const convIds = visitorConversations?.map(c => c.id) || [];

      if (convIds.length > 0) {
        const { data, error } = await supabase
          .from('live_chat_sessions')
          .update({ status: 'cancelled', ended_at: new Date().toISOString() })
          .eq('status', 'queued')
          .in('conversation_id', convIds)
          .select()
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error canceling session:', error);
          throw error;
        }
        sessionToCancel = data;
      }
    }

    if (!sessionToCancel) {
      return new Response(
        JSON.stringify({ error: 'No queued session found to cancel' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Session cancelled successfully:', sessionToCancel.id);

    return new Response(
      JSON.stringify({ success: true, session: sessionToCancel }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cancel-live-agent function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
