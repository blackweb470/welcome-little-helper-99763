import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  businessId: z.string().uuid('Invalid business ID'),
  visitorId: z.string().min(1, 'Visitor ID required').max(200, 'Visitor ID too long'),
  conversationId: z.string().uuid('Invalid conversation ID').optional().nullable(),
  reason: z.string().max(1000, 'Reason too long').optional(),
  visitorEmail: z.string().email('Invalid email').max(255).optional().nullable(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const validationResult = requestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { businessId, visitorId, conversationId, reason, visitorEmail } = validationResult.data;
    console.log('Live agent request:', { businessId, visitorId });

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

    // Notify WhatsApp admins if configured
    try {
      const { data: waSettings } = await supabase
        .from('whatsapp_settings')
        .select('access_token, phone_number_id, admin_phone_numbers')
        .eq('business_id', businessId)
        .eq('enabled', true)
        .maybeSingle();

      if (waSettings?.admin_phone_numbers?.length > 0 && waSettings.access_token && waSettings.phone_number_id) {
        const adminMsg = `🔔 *New Live Chat Request*\n\n` +
          `Customer: ${visitorEmail || visitorId}\n` +
          `Reason: ${reason || 'Not specified'}\n` +
          `Channel: ${conversationId ? 'Web' : 'Direct'}\n\n` +
          `Reply \`/accept ${session.id.substring(0, 8)}\` to start chatting.`;

        for (const adminPhone of waSettings.admin_phone_numbers) {
          const cleanPhone = adminPhone.replace(/[^\d]/g, '');
          console.log(`Sending WhatsApp interactive notification to admin: ${cleanPhone}`);
          
          await fetch(
            `https://graph.facebook.com/v19.0/${waSettings.phone_number_id}/messages`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${waSettings.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: cleanPhone,
                type: 'interactive',
                interactive: {
                  type: 'button',
                  header: {
                    type: 'text',
                    text: '🔔 New Chat Request'
                  },
                  body: {
                    text: `Customer: ${visitorEmail || visitorId}\nReason: ${reason || 'Not specified'}\nChannel: ${conversationId ? 'Web' : 'Direct'}`
                  },
                  footer: {
                    text: 'Click button to take this chat'
                  },
                  action: {
                    buttons: [
                      {
                        type: 'reply',
                        reply: {
                          id: `accept_${session.id.substring(0, 8)}`,
                          title: 'Accept Chat'
                        }
                      }
                    ]
                  }
                }
              }),
            }
          );
        }
      }
    } catch (waNotifError) {
      console.error('Error sending WhatsApp admin notifications:', waNotifError);
    }

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
    return new Response(
      JSON.stringify({ error: 'Unable to process request. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
