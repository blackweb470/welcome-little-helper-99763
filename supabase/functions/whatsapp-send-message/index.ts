import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-visitor-id',
};

// Schema for quick reply buttons
const quickReplyButtonSchema = z.object({
  id: z.string(),
  title: z.string().max(20),
});

// Schema for list rows
const listRowSchema = z.object({
  id: z.string(),
  title: z.string().max(24),
  description: z.string().max(72).optional(),
});

// Schema for list sections
const listSectionSchema = z.object({
  title: z.string().max(24),
  rows: z.array(listRowSchema).min(1).max(10),
});

// Schema for interactive messages
const interactiveMessageSchema = z.object({
  type: z.enum(['quick_reply', 'list']),
  header: z.string().max(60).optional(),
  body: z.string().min(1).max(1024),
  footer: z.string().max(60).optional(),
  buttons: z.array(quickReplyButtonSchema).max(3).optional(),
  listButtonText: z.string().max(20).optional(),
  sections: z.array(listSectionSchema).optional(),
});

const requestSchema = z.object({
  businessId: z.string().uuid('Invalid business ID'),
  conversationId: z.string().uuid('Invalid conversation ID'),
  message: z.string().max(4096, 'Message too long').optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  interactive: interactiveMessageSchema.optional(),
}).refine(data => data.message || data.interactive || data.imageUrl, {
  message: 'Either message, interactive content, or imageUrl is required',
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

    const { businessId, conversationId, message, interactive, imageUrl } = validationResult.data;
    console.log('Sending WhatsApp message:', { 
      businessId, 
      conversationId, 
      messageLength: message?.length,
      interactiveType: interactive?.type 
    });

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

    const provider = waSettings.provider || 'meta';

    // Prepare message content for database
    let messageContent: string;
    if (interactive) {
      if (interactive.type === 'quick_reply') {
        const buttonLabels = interactive.buttons?.map(b => b.title).join(', ') || '';
        messageContent = `${interactive.body}\n[Quick Reply Options: ${buttonLabels}]`;
      } else if (interactive.type === 'list') {
        const options = interactive.sections?.flatMap(s => s.rows.map(r => r.title)).join(', ') || '';
        messageContent = `${interactive.body}\n[List Menu: ${options}]`;
      } else {
        messageContent = interactive.body;
      }
    } else if (imageUrl) {
      messageContent = message ? message : '';
    } else {
      messageContent = message!;
    }

    // Save the message to the database first
    const { data: savedMessage, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: messageContent || '[Media Message]',
        audio_url: imageUrl || null
      })
      .select()
      .single();

    if (msgError) {
      console.error('Error saving message:', msgError);
      throw msgError;
    }

    // If image, create attachment record
    if (imageUrl && savedMessage) {
      await supabase
        .from('message_attachments')
        .insert({
          message_id: savedMessage.id,
          file_name: 'whatsapp-image.jpg',
          file_path: imageUrl,
          file_size: 0,
          mime_type: 'image/jpeg'
        });
    }

    if (provider === 'twilio') {
      // Refresh Twilio OAuth access token if expired
      let currentAccessToken = waSettings.access_token;
      if (waSettings.expires_at && new Date(waSettings.expires_at) <= new Date(Date.now() + 60000)) {
        console.log('Twilio access token expired in sender, refreshing...');
        try {
          const clientId = Deno.env.get('TWILIO_CLIENT_ID');
          const clientSecret = Deno.env.get('TWILIO_CLIENT_SECRET');

          if (clientId && clientSecret && waSettings.refresh_token) {
            const refreshParams = new URLSearchParams();
            refreshParams.append('grant_type', 'refresh_token');
            refreshParams.append('refresh_token', waSettings.refresh_token);
            refreshParams.append('client_id', clientId);
            refreshParams.append('client_secret', clientSecret);

            const refreshResponse = await fetch('https://oauth.twilio.com/v2/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: refreshParams.toString(),
            });

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              currentAccessToken = refreshData.access_token;
              const newExpiresAt = new Date(Date.now() + (refreshData.expires_in || 14400) * 1000).toISOString();
              
              await supabase
                .from('whatsapp_settings')
                .update({
                  access_token: currentAccessToken,
                  refresh_token: refreshData.refresh_token || waSettings.refresh_token,
                  expires_at: newExpiresAt,
                  updated_at: new Date().toISOString()
                })
                .eq('id', waSettings.id);

              console.log('Token refreshed successfully in sender.');
            }
          }
        } catch (refreshErr) {
          console.error('Error refreshing token in sender:', refreshErr);
        }
      }

      // Send via Twilio Messages API
      console.log('Sending message via Twilio to:', recipientPhone);

      const twilioParams = new URLSearchParams();
      twilioParams.append('To', `whatsapp:${recipientPhone}`);
      twilioParams.append('From', `whatsapp:${waSettings.phone_number}`);
      twilioParams.append('Body', messageContent);
      if (imageUrl) {
        twilioParams.append('MediaUrl', imageUrl);
      }

      const twilioResponse = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${waSettings.waba_id}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentAccessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: twilioParams.toString(),
        }
      );

      if (!twilioResponse.ok) {
        const errorText = await twilioResponse.text();
        console.error('Twilio API error:', twilioResponse.status, errorText);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to send WhatsApp message via Twilio', 
            details: errorText 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await twilioResponse.json();
      console.log('Twilio WhatsApp message sent successfully:', result.sid);

      return new Response(
        JSON.stringify({ 
          success: true, 
          messageId: result.sid,
          type: interactive ? interactive.type : 'text'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Send via Meta Cloud API
      let whatsappPayload: any;

      if (interactive) {
        // Interactive message payload
        if (interactive.type === 'quick_reply') {
          whatsappPayload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: recipientPhone,
            type: 'interactive',
            interactive: {
              type: 'button',
              body: { text: interactive.body },
              action: {
                buttons: interactive.buttons?.map(btn => ({
                  type: 'reply',
                  reply: {
                    id: btn.id,
                    title: btn.title
                  }
                }))
              }
            }
          };

          // Add optional header
          if (interactive.header) {
            whatsappPayload.interactive.header = {
              type: 'text',
              text: interactive.header
            };
          }

          // Add optional footer
          if (interactive.footer) {
            whatsappPayload.interactive.footer = { text: interactive.footer };
          }
        } else if (interactive.type === 'list') {
          whatsappPayload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: recipientPhone,
            type: 'interactive',
            interactive: {
              type: 'list',
              body: { text: interactive.body },
              action: {
                button: interactive.listButtonText || 'View Options',
                sections: interactive.sections?.map(section => ({
                  title: section.title,
                  rows: section.rows.map(row => ({
                    id: row.id,
                    title: row.title,
                    description: row.description || undefined
                  }))
                }))
              }
            }
          };

          // Add optional header
          if (interactive.header) {
            whatsappPayload.interactive.header = {
              type: 'text',
              text: interactive.header
            };
          }

          // Add optional footer
          if (interactive.footer) {
            whatsappPayload.interactive.footer = { text: interactive.footer };
          }
        }
      } else if (imageUrl) {
        // Image message payload
        whatsappPayload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipientPhone,
          type: 'image',
          image: {
            link: imageUrl,
            caption: message || undefined
          }
        };
      } else {
        // Regular text message payload
        whatsappPayload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipientPhone,
          type: 'text',
          text: { body: message }
        };
      }

      console.log('Sending Meta WhatsApp payload:', JSON.stringify(whatsappPayload, null, 2));

      const whatsappResponse = await fetch(
        `https://graph.facebook.com/v21.0/${waSettings.phone_number_id}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${waSettings.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(whatsappPayload),
        }
      );

      if (!whatsappResponse.ok) {
        const errorText = await whatsappResponse.text();
        console.error('Meta WhatsApp API error:', whatsappResponse.status, errorText);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to send WhatsApp message via Meta', 
            details: errorText 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await whatsappResponse.json();
      console.log('Meta WhatsApp message sent successfully:', result);

      return new Response(
        JSON.stringify({ 
          success: true, 
          messageId: result.messages?.[0]?.id,
          type: interactive ? interactive.type : 'text'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
