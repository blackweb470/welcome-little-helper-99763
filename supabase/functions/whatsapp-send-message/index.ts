import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  businessId: z.string().uuid('Invalid business ID'),
  conversationId: z.string().uuid('Invalid conversation ID'),
  message: z.string().min(1, 'Message required').max(4096, 'Message too long'),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const validationResult = requestSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: validationResult.error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { businessId, conversationId, message } = validationResult.data;
    console.log('Sending WhatsApp message:', { businessId, conversationId, messageLength: message.length });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get WhatsApp settings for this business
    const { data: waSettings, error: settingsError } = await supabase
      .from('whatsapp_settings')
      .select('*')
      .eq('business_id', businessId)
      .eq('enabled', true)
      .maybeSingle();

    if (settingsError || !waSettings) {
      console.error('WhatsApp not configured for business:', businessId);
      return new Response(
        JSON.stringify({ error: 'WhatsApp not configured for this business' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get conversation to find the recipient phone number
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('channel', 'whatsapp')
      .maybeSingle();

    if (convError || !conversation) {
      console.error('Conversation not found or not WhatsApp:', conversationId);
      return new Response(
        JSON.stringify({ error: 'WhatsApp conversation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recipientPhone = conversation.channel_metadata?.phone_number;
    if (!recipientPhone) {
      console.error('No phone number in conversation metadata:', conversationId);
      return new Response(
        JSON.stringify({ error: 'Recipient phone number not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save the message to the database first
    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: message
      });

    if (msgError) {
      console.error('Error saving message:', msgError);
      throw msgError;
    }

    // Send via WhatsApp Cloud API
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v19.0/${waSettings.phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${waSettings.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipientPhone,
          type: 'text',
          text: { body: message }
        }),
      }
    );

    if (!whatsappResponse.ok) {
      const errorText = await whatsappResponse.text();
      console.error('WhatsApp API error:', whatsappResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send WhatsApp message', 
          details: errorText 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await whatsappResponse.json();
    console.log('WhatsApp message sent successfully:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.messages?.[0]?.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
