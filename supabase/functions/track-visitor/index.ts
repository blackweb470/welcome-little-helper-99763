import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Validate input
    const baseSchema = z.object({
      action: z.enum(['start_session', 'track_event', 'end_session', 'link_conversation']),
      data: z.record(z.any())
    });
    
    const { action, data } = baseSchema.parse(requestBody);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (action === 'start_session') {
      // Validate session data
      const sessionSchema = z.object({
        businessId: z.string().uuid(),
        visitorId: z.string().min(1).max(200),
        deviceType: z.string().max(50).optional(),
        browser: z.string().max(100).optional(),
        referrerUrl: z.string().max(2000).optional(),
        entryPage: z.string().max(2000).optional()
      });
      
      const validatedData = sessionSchema.parse(data);

      const { data: session, error } = await supabase
        .from('visitor_sessions')
        .insert({
          business_id: validatedData.businessId,
          visitor_id: validatedData.visitorId,
          device_type: validatedData.deviceType,
          browser: validatedData.browser,
          referrer_url: validatedData.referrerUrl,
          entry_page: validatedData.entryPage,
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
      // Validate event data
      const eventSchema = z.object({
        sessionId: z.string().uuid(),
        businessId: z.string().uuid(),
        eventType: z.string().min(1).max(100),
        pageUrl: z.string().max(2000).optional(),
        eventData: z.record(z.any()).optional()
      });
      
      const validatedData = eventSchema.parse(data);

      const { error: eventError } = await supabase
        .from('visitor_events')
        .insert({
          session_id: validatedData.sessionId,
          business_id: validatedData.businessId,
          event_type: validatedData.eventType,
          event_data: validatedData.eventData || {},
          page_url: validatedData.pageUrl
        });

      if (eventError) throw eventError;

      // Update session page views if it's a page_view event
      if (validatedData.eventType === 'page_view') {
        const { error: updateError } = await supabase
          .from('visitor_sessions')
          .select('page_views')
          .eq('id', validatedData.sessionId)
          .single()
          .then(({ data }) => 
            supabase
              .from('visitor_sessions')
              .update({ page_views: (data?.page_views || 0) + 1 })
              .eq('id', validatedData.sessionId)
          );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'end_session') {
      // Validate end session data
      const endSessionSchema = z.object({
        sessionId: z.string().uuid(),
        totalTimeSeconds: z.number().int().min(0).max(86400).optional(),
        exitPage: z.string().max(2000).optional()
      });
      
      const validatedData = endSessionSchema.parse(data);

      const { error } = await supabase
        .from('visitor_sessions')
        .update({
          ended_at: new Date().toISOString(),
          total_time_seconds: validatedData.totalTimeSeconds,
          exit_page: validatedData.exitPage
        })
        .eq('id', validatedData.sessionId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'link_conversation') {
      // Validate link conversation data
      const linkSchema = z.object({
        sessionId: z.string().uuid(),
        conversationId: z.string().uuid()
      });
      
      const validatedData = linkSchema.parse(data);

      const { error } = await supabase
        .from('visitor_sessions')
        .update({ conversation_id: validatedData.conversationId })
        .eq('id', validatedData.sessionId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in track-visitor:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
