import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    if (action === 'start_session') {
      const { businessId, visitorId, deviceType, browser, referrerUrl, entryPage } = data;

      const { data: session, error } = await supabase
        .from('visitor_sessions')
        .insert({
          business_id: businessId,
          visitor_id: visitorId,
          device_type: deviceType,
          browser: browser,
          referrer_url: referrerUrl,
          entry_page: entryPage,
          page_views: 1
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ sessionId: session.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'track_event') {
      const { sessionId, businessId, eventType, eventData, pageUrl } = data;

      // Insert event
      const { error: eventError } = await supabase
        .from('visitor_events')
        .insert({
          session_id: sessionId,
          business_id: businessId,
          event_type: eventType,
          event_data: eventData || {},
          page_url: pageUrl
        });

      if (eventError) throw eventError;

      // Update session page views if it's a page_view event
      if (eventType === 'page_view') {
        const { error: updateError } = await supabase
          .rpc('increment', { 
            row_id: sessionId,
            x: 1 
          });

        if (updateError) console.error('Error updating page views:', updateError);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'end_session') {
      const { sessionId, totalTimeSeconds, exitPage } = data;

      const { error } = await supabase
        .from('visitor_sessions')
        .update({
          ended_at: new Date().toISOString(),
          total_time_seconds: totalTimeSeconds,
          exit_page: exitPage
        })
        .eq('id', sessionId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'link_conversation') {
      const { sessionId, conversationId } = data;

      const { error } = await supabase
        .from('visitor_sessions')
        .update({ conversation_id: conversationId })
        .eq('id', sessionId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
