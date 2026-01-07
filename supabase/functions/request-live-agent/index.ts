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
    const { businessId, visitorId, conversationId, reason, visitorEmail } = await req.json();
    console.log('Live agent request:', { businessId, visitorId, conversationId, reason, visitorEmail });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if visitor already has an active live chat session (queued or active)
    const { data: existingSession } = await supabase
      .from('live_chat_sessions')
      .select('id, status, conversation_id')
      .eq('status', 'queued')
      .or(`status.eq.active`)
      .order('created_at', { ascending: false })
      .limit(10);

    // Filter by visitor's conversations
    if (existingSession && existingSession.length > 0) {
      // Get visitor's conversations
      const { data: visitorConversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('visitor_id', visitorId)
        .eq('business_id', businessId);

      const visitorConvIds = visitorConversations?.map(c => c.id) || [];
      const activeSession = existingSession.find(s => visitorConvIds.includes(s.conversation_id));

      if (activeSession) {
        console.log('Visitor already has active session:', activeSession.id);
        return new Response(
          JSON.stringify({ 
            error: 'You already have an active request. Please wait for an agent to respond.',
            existingSession: activeSession 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create conversation if not exists
    let finalConversationId = conversationId;
    
    if (!finalConversationId) {
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({ 
          business_id: businessId,
          visitor_id: visitorId,
          visitor_email: visitorEmail,
          started_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (convError) {
        console.error('Error creating conversation:', convError);
        throw convError;
      }
      
      finalConversationId = conv.id;
    } else if (visitorEmail) {
      // Update existing conversation with email
      await supabase
        .from('conversations')
        .update({ visitor_email: visitorEmail })
        .eq('id', finalConversationId);
    }

    // Create live chat session
    const { data: session, error: sessionError } = await supabase
      .from('live_chat_sessions')
      .insert({
        conversation_id: finalConversationId,
        status: 'queued',
        queued_at: new Date().toISOString(),
        transfer_reason: reason
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating live chat session:', sessionError);
      throw sessionError;
    }

    // Get queue position (count of queued sessions before this one for this business)
    // First get all conversation IDs for this business
    const { data: businessConversations } = await supabase
      .from('conversations')
      .select('id')
      .eq('business_id', businessId);
    
    const businessConvIds = businessConversations?.map(c => c.id) || [];
    
    let position = 1;
    let estimatedWaitMinutes = 3;
    
    if (businessConvIds.length > 0) {
      const { count: queuePosition } = await supabase
        .from('live_chat_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'queued')
        .lt('queued_at', session.queued_at)
        .in('conversation_id', businessConvIds);
      
      position = (queuePosition || 0) + 1;
      estimatedWaitMinutes = position * 3;
    }
    const { data: business } = await supabase
      .from('businesses')
      .select('owner_id')
      .eq('id', businessId)
      .single();

    // Create notification history for browser notification
    if (business?.owner_id) {
      const { error: notifError } = await supabase
        .from('notification_history')
        .insert({
          user_id: business.owner_id,
          business_id: businessId,
          notification_type: 'chat_transfer',
          title: 'Live Chat Transfer Request',
          message: reason || 'A visitor wants to speak with a live agent',
          conversation_id: finalConversationId,
          metadata: {
            visitorId: visitorId,
            visitorEmail: visitorEmail,
          },
          sent_browser: true,
          sent_email: false,
          sent_sound: true,
        });
      
      if (notifError) {
        console.error('Error creating notification history:', notifError);
      } else {
        console.log('Notification history created successfully');
      }
    }

    // Send notification to business owner
    await supabase.functions.invoke('send-notification', {
      body: {
        type: 'chat_transfer',
        businessId: businessId,
        data: {
          conversationId: finalConversationId,
          visitorId: visitorId,
          visitorEmail: visitorEmail,
          message: reason,
        },
      },
    });

    console.log('Live agent request created successfully, queue position:', position);

    return new Response(
      JSON.stringify({ 
        session, 
        conversationId: finalConversationId,
        queuePosition: position,
        estimatedWaitMinutes
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in request-live-agent function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
