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

    // Get business owner owner_id
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

    console.log('Live agent request created successfully');

    return new Response(
      JSON.stringify({ session, conversationId: finalConversationId }),
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
