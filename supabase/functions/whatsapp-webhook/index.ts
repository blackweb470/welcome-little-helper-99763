import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';
import postgres from 'https://deno.land/x/postgres@v0.17.0/mod.ts';
import { enforceRateLimit } from '../_shared/ratelimit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-visitor-id',
};

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  
  // Handle GET request: supports Meta verification and Twilio status check
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token) {
      console.log('GET /whatsapp-webhook: Meta verification request received');
      
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Verify token
      const { data, error } = await supabase
        .from('whatsapp_settings')
        .select('id')
        .eq('verify_token', token)
        .limit(1);

      if (!error && data && data.length > 0) {
        console.log('GET /whatsapp-webhook: Token verified successfully');
        return new Response(challenge, { status: 200 });
      } else {
        console.error('GET /whatsapp-webhook: Token verification failed for:', token);
        return new Response('Forbidden', { status: 403 });
      }
    }

    return new Response('Webhook Active', { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  // Handle OPTIONS for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle incoming messages (POST request)
  if (req.method === 'POST') {
    try {
      // Run self-healing database migration
      try {
        const databaseUrl = Deno.env.get('DATABASE_URL');
        if (databaseUrl) {
          const sql = postgres(databaseUrl);
          await sql`
            ALTER TABLE public.whatsapp_settings 
            ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'meta',
            ADD COLUMN IF NOT EXISTS refresh_token TEXT DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
          `;
          await sql.end();
        }
      } catch (dbErr) {
        console.error('Database self-healing failed:', dbErr);
      }

      // Parse payload based on Content-Type and structure
      const contentType = req.headers.get('content-type') || '';
      let isMeta = false;
      let senderPhone = '';
      let recipientPhone = '';
      let messageText = '';
      let messageType = 'text';
      let incomingMediaIdOrUrl: string | null = null;
      let buttonPayload = '';

      if (contentType.includes('application/json')) {
        const body = await req.json();
        console.log('Incoming JSON webhook payload:', JSON.stringify(body, null, 2));

        if (body.object === 'whatsapp_business_account') {
          // Meta Cloud API Webhook
          isMeta = true;
          const entry = body.entry?.[0];
          const changes = entry?.changes?.[0];
          const value = changes?.value;
          
          if (value?.statuses) {
            console.log('Meta status update event, ignoring');
            return new Response(JSON.stringify({ status: 'ignored' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const message = value?.messages?.[0];
          if (!message) {
            console.log('No Meta message found in payload, ignoring');
            return new Response(JSON.stringify({ status: 'ignored' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          senderPhone = message.from;
          recipientPhone = value.metadata?.phone_number_id; // For Meta: this is the Phone ID (number string)
          messageType = message.type;

          if (messageType === 'text') {
            messageText = message.text?.body || '';
          } else if (messageType === 'interactive') {
            const interactive = message.interactive;
            if (interactive.type === 'button_reply') {
              buttonPayload = interactive.button_reply?.id || '';
              messageText = interactive.button_reply?.title || '';
            } else if (interactive.type === 'list_reply') {
              buttonPayload = interactive.list_reply?.id || '';
              messageText = interactive.list_reply?.title || '';
            }
          } else if (messageType === 'image') {
            incomingMediaIdOrUrl = message.image?.id || null; // For Meta: this is a media ID
            messageText = message.image?.caption || '';
          }
        } else {
          // Twilio JSON webhook fallback
          senderPhone = (body.From || '').replace('whatsapp:', '').trim();
          recipientPhone = (body.To || '').replace('whatsapp:', '').trim();
          messageText = body.Body || '';
          buttonPayload = body.ButtonPayload || '';

          if (buttonPayload) {
            messageText = buttonPayload;
          }

          if (body.MediaUrl0) {
            messageType = 'image';
            incomingMediaIdOrUrl = body.MediaUrl0; // For Twilio: this is a direct URL
          }
        }
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        // Twilio Form webhook
        const formData = await req.formData();
        console.log('Incoming Twilio form payload:', Object.fromEntries(formData.entries()));

        senderPhone = (formData.get('From') as string || '').replace('whatsapp:', '').trim();
        recipientPhone = (formData.get('To') as string || '').replace('whatsapp:', '').trim();
        messageText = formData.get('Body') as string || '';
        buttonPayload = formData.get('ButtonPayload') as string || '';

        if (buttonPayload) {
          messageText = buttonPayload;
        }

        const numMedia = parseInt(formData.get('NumMedia') as string || '0');
        if (numMedia > 0) {
          messageType = 'image';
          incomingMediaIdOrUrl = formData.get('MediaUrl0') as string || null;
        }
      }

      if (!senderPhone || !recipientPhone) {
        console.log('Ignored status update or non-message event');
        return new Response(JSON.stringify({ status: 'ignored' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const phoneNumberId = recipientPhone;

      console.log('Processing WhatsApp message:', { 
        isMeta,
        phoneNumberId, 
        senderPhone, 
        messageText: messageText.substring(0, 100),
        messageType,
        mediaIdentifier: incomingMediaIdOrUrl
      });

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Enforce rate limit per WhatsApp sender phone number (max 10 tokens, refill 1/sec)
      const waRateCheck = await enforceRateLimit(supabase, `wa_sender:${senderPhone}`, 10, 1.0);
      if (!waRateCheck.allowed) {
        console.warn(`WhatsApp rate limit exceeded for sender ${senderPhone}`);
        return new Response(JSON.stringify({ status: 'rate_limited' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Find settings by phone_number_id
      const { data: waSettings, error: settingsError } = await supabase
        .from('whatsapp_settings')
        .select('*, admin_phone_numbers')
        .eq('phone_number_id', phoneNumberId)
        .eq('enabled', true)
        .maybeSingle();

      if (settingsError || !waSettings) {
        console.error('No enabled WhatsApp settings found for phone_number_id:', phoneNumberId);
        return new Response(JSON.stringify({ status: 'ignored', reason: 'settings_not_found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const businessId = waSettings.business_id;
      const visitorId = `whatsapp_${senderPhone}`;
      const provider = waSettings.provider || 'meta'; // Default to Meta provider

      // Refresh Twilio OAuth access token if expired or close to expiration
      let currentAccessToken = waSettings.access_token;
      if (provider === 'twilio' && waSettings.expires_at && new Date(waSettings.expires_at) <= new Date(Date.now() + 60000)) {
        console.log('Twilio access token expired, refreshing...');
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

              console.log('Token refreshed successfully.');
            } else {
              console.error('Failed to refresh Twilio token:', await refreshResponse.text());
            }
          }
        } catch (refreshErr) {
          console.error('Error refreshing token:', refreshErr);
        }
      }

      // Unified send message helper supporting both Twilio and Meta
      const sendMessage = async (to: string, bodyText: string, mediaUrlOrId?: string, isEscalationButton: boolean = false) => {
        if (provider === 'twilio') {
          const twilioParams = new URLSearchParams();
          twilioParams.append('To', `whatsapp:${to}`);
          twilioParams.append('From', `whatsapp:${recipientPhone}`);
          twilioParams.append('Body', bodyText);
          if (mediaUrlOrId && mediaUrlOrId.startsWith('http')) {
            twilioParams.append('MediaUrl', mediaUrlOrId);
          }

          const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${waSettings.waba_id}/Messages.json`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${currentAccessToken}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: twilioParams.toString(),
          });

          if (!res.ok) {
            console.error(`Twilio send error: ${await res.text()}`);
            return { success: false };
          }
          return { success: true };
        } else {
          // Meta Cloud API
          let payload: any = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to,
          };

          if (isEscalationButton) {
            payload = {
              ...payload,
              type: 'interactive',
              interactive: {
                type: 'button',
                body: { text: bodyText },
                action: {
                  buttons: [
                    {
                      type: 'reply',
                      reply: {
                        id: 'request_agent',
                        title: 'Talk to an Agent'
                      }
                    }
                  ]
                }
              }
            };
          } else if (mediaUrlOrId && !mediaUrlOrId.startsWith('http')) {
            payload = {
              ...payload,
              type: 'image',
              image: { id: mediaUrlOrId }
            };
          } else {
            payload = {
              ...payload,
              type: 'text',
              text: { body: bodyText }
            };
          }

          const res = await fetch(`https://graph.facebook.com/v21.0/${recipientPhone}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${waSettings.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            console.error(`Meta send error: ${await res.text()}`);
            return { success: false };
          }
          return { success: true };
        }
      };

      // Check admin command status
      const adminPhones: string[] = waSettings.admin_phone_numbers || [];
      const isAdmin = adminPhones.some(phone => senderPhone.includes(phone.replace(/[^\d]/g, '')) || phone.replace(/[^\d]/g, '').includes(senderPhone));
      const isCommand = messageText.trim().startsWith('/') || messageText.trim().startsWith('!');

      if (isCommand) {
        if (isAdmin) {
          console.log('Processing admin command from:', senderPhone);
          
          try {
            const adminResponse = await fetch(
              `${supabaseUrl}/functions/v1/whatsapp-admin-commands`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                  businessId,
                  senderPhone,
                  messageText,
                  phoneNumberId,
                  accessToken: currentAccessToken,
                  buttonId: buttonPayload
                }),
              }
            );

            const adminResult = await adminResponse.json();
            console.log('Admin command result:', adminResult);

            if (adminResult.handled) {
              return new Response(JSON.stringify({ status: 'ok', admin: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }
          } catch (adminError) {
            console.error('Error calling admin commands:', adminError);
          }
        } else {
          console.log('Non-admin attempted command:', senderPhone, messageText);
          const notAdminReply = "Hi! Commands are only available for business administrators. How can I help you today?";
          await sendMessage(senderPhone, notAdminReply);
          return new Response(JSON.stringify({ status: 'ok', command_blocked: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } else if (isAdmin) {
        // If admin is in active session, route to customer
        const { data: activeSession } = await supabase
          .from('live_chat_sessions')
          .select('id, conversation_id')
          .eq('status', 'active')
          .contains('metadata', { agent_whatsapp_phone: senderPhone })
          .maybeSingle();

        if (activeSession) {
          console.log('Admin is in active session, routing message to customer');
          
          const { data: conv } = await supabase
             .from('conversations')
             .select('channel, channel_metadata, business_id')
             .eq('id', activeSession.conversation_id)
             .single();

          const correctBusinessId = conv?.business_id || businessId;

          const { data: savedMessage } = await supabase
            .from('messages')
            .insert({
              conversation_id: activeSession.conversation_id,
              role: 'assistant',
              content: messageText
            })
            .select()
            .single();

          if (conv?.channel === 'whatsapp') {
            const customerPhone = (conv.channel_metadata as any)?.phone_number;
            if (customerPhone) {
              await sendMessage(customerPhone, messageText);
            }
          } else {
            // Web chat: broadcast
            if (savedMessage) {
              try {
                const channel = supabase.channel(`visitor-messages-${activeSession.conversation_id}`);
                await new Promise<void>((resolve) => {
                  channel.subscribe((status: string) => {
                    if (status === 'SUBSCRIBED') resolve();
                  });
                  setTimeout(() => resolve(), 1500);
                });

                await channel.send({
                  type: 'broadcast',
                  event: 'agent_message',
                  payload: {
                    id: savedMessage.id,
                    content: messageText,
                    role: 'assistant',
                    created_at: savedMessage.created_at || new Date().toISOString(),
                    businessId: correctBusinessId,
                    conversationId: activeSession.conversation_id
                  }
                });
                await supabase.removeChannel(channel);
              } catch (broadcastError) {
                console.error('Error broadcasting admin message:', broadcastError);
              }
            }
          }
          
          return new Response(JSON.stringify({ status: 'ok', routed: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Process media uploads
      let imageUrl: string | null = null;
      let messageContent = messageText;

      if (messageType === 'image' && incomingMediaIdOrUrl) {
        try {
          if (provider === 'meta') {
            // Meta media download: fetch media details first
            console.log('Downloading Meta WhatsApp image. Media ID:', incomingMediaIdOrUrl);
            const mediaResponse = await fetch(
              `https://graph.facebook.com/v21.0/${incomingMediaIdOrUrl}`,
              {
                headers: {
                  'Authorization': `Bearer ${waSettings.access_token}`,
                }
              }
            );
            
            if (mediaResponse.ok) {
              const mediaData = await mediaResponse.json();
              const mediaUrl = mediaData.url;
              
              const imageDownloadResponse = await fetch(mediaUrl, {
                headers: {
                  'Authorization': `Bearer ${waSettings.access_token}`,
                }
              });
              
              if (imageDownloadResponse.ok) {
                const imageBlob = await imageDownloadResponse.blob();
                const arrayBuffer = await imageBlob.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);
                
                const fileName = `whatsapp/${businessId}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
                const { error: uploadError } = await supabase.storage
                  .from('message-attachments')
                  .upload(fileName, uint8Array, {
                    contentType: 'image/jpeg',
                    upsert: false
                  });
                
                if (!uploadError) {
                  const { data: urlData } = supabase.storage
                    .from('message-attachments')
                    .getPublicUrl(fileName);
                  
                  imageUrl = urlData.publicUrl;
                  messageContent = messageText || '[Image]';
                  console.log('Meta WhatsApp image saved:', imageUrl);
                }
              }
            }
          } else {
            // Twilio media download
            console.log('Downloading Twilio WhatsApp image. Media URL:', incomingMediaIdOrUrl);
            const imageDownloadResponse = await fetch(incomingMediaIdOrUrl);
            
            if (imageDownloadResponse.ok) {
              const imageBlob = await imageDownloadResponse.blob();
              const arrayBuffer = await imageBlob.arrayBuffer();
              const uint8Array = new Uint8Array(arrayBuffer);
              
              const fileName = `whatsapp/${businessId}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
              const { error: uploadError } = await supabase.storage
                .from('message-attachments')
                .upload(fileName, uint8Array, {
                  contentType: 'image/jpeg',
                  upsert: false
                });
              
              if (!uploadError) {
                const { data: urlData } = supabase.storage
                  .from('message-attachments')
                  .getPublicUrl(fileName);
                
                imageUrl = urlData.publicUrl;
                messageContent = messageText || '[Image]';
                console.log('Twilio WhatsApp image saved:', imageUrl);
              }
            }
          }
        } catch (imgError) {
          console.error('Error downloading/uploading image:', imgError);
          messageContent = '[Image - failed to process]';
        }
      }

      // Talk to Agent button/phrase check
      const talkToAgentPhrases = ['talk to an agent', 'request_agent', 'talk to agent', 'speak to a human', 'human agent'];
      const isTalkToAgent = talkToAgentPhrases.some(phrase => messageText.toLowerCase().includes(phrase));

      if (isTalkToAgent) {
        console.log('Visitor requesting human agent:', senderPhone);
        
        let convId: string;
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id')
          .eq('business_id', businessId)
          .eq('visitor_id', visitorId)
          .eq('channel', 'whatsapp')
          .is('ended_at', null)
          .maybeSingle();
          
        if (existingConv) {
          convId = existingConv.id;
        } else {
          const { data: newConv } = await supabase.from('conversations').insert({
            business_id: businessId,
            visitor_id: visitorId,
            channel: 'whatsapp',
            channel_metadata: { phone_number: senderPhone, phone_number_id: phoneNumberId },
            started_at: new Date().toISOString()
          }).select().single();
          convId = newConv.id;
        }

        try {
          await fetch(
            `${supabaseUrl}/functions/v1/request-live-agent`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                businessId,
                visitorId,
                conversationId: convId,
                reason: 'Requested via WhatsApp phrase'
              }),
            }
          );
        } catch (err) {
          console.error('Error creating live agent request:', err);
        }

        await sendMessage(senderPhone, "✅ I've notified our team. A human agent will be with you shortly! Feel free to leave more details about your request here.");

        return new Response(JSON.stringify({ status: 'ok', agent_requested: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check for human agent keywords to offer escalation
      const agentKeywords = ['agent', 'human', 'help', 'person', 'speak to someone', 'talk to someone', 'support'];
      const isAskingForAgent = !isAdmin && agentKeywords.some(kw => messageText.toLowerCase().includes(kw));

      if (isAskingForAgent) {
        console.log('Offering agent connection to visitor:', senderPhone);
        
        if (provider === 'meta') {
          // Send Meta quick-reply button
          await sendMessage(senderPhone, "I can help with most questions, but would you like to speak with a human agent instead?", undefined, true);
        } else {
          // Send Twilio plain text offer
          const agentOfferText = "I can help with most questions, but would you like to speak with a human agent instead?\n\nReply with 'Talk to an Agent' to queue.";
          await sendMessage(senderPhone, agentOfferText);
        }

        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id')
          .eq('business_id', businessId)
          .eq('visitor_id', visitorId)
          .eq('channel', 'whatsapp')
          .is('ended_at', null)
          .maybeSingle();

        if (existingConv) {
          await supabase.from('messages').insert({
            conversation_id: existingConv.id,
            role: 'user',
            content: messageText
          });
        }

        return new Response(JSON.stringify({ status: 'ok', offered_agent: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check for conversation link code
      const linkCodeMatch = messageContent.match(/\b([A-Z0-9]{6})\b/);
      let linkedConversationId: string | null = null;
      let linkedHistory: any[] = [];

      if (linkCodeMatch) {
        const potentialCode = linkCodeMatch[1];
        const { data: linkData } = await supabase
          .from('conversation_links')
          .select('*, source_conversation_id')
          .eq('link_code', potentialCode)
          .eq('business_id', businessId)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (linkData) {
          linkedConversationId = linkData.source_conversation_id;
          const { data: prevHistory } = await supabase
            .from('messages')
            .select('role, content, created_at')
            .eq('conversation_id', linkedConversationId)
            .order('created_at', { ascending: true })
            .limit(20);

          if (prevHistory && prevHistory.length > 0) {
            linkedHistory = prevHistory;
          }
        }
      }

      // Get or create conversation
      let conversationId: string;
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('business_id', businessId)
        .eq('visitor_id', visitorId)
        .eq('channel', 'whatsapp')
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingConv) {
        conversationId = existingConv.id;
      } else {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            business_id: businessId,
            visitor_id: visitorId,
            channel: 'whatsapp',
            channel_metadata: { 
              phone_number: senderPhone,
              phone_number_id: phoneNumberId,
              linked_from: linkedConversationId || undefined
            },
            started_at: new Date().toISOString()
          })
          .select()
          .single();

        if (convError) throw convError;
        conversationId = newConv.id;

        if (linkedConversationId && linkCodeMatch) {
          await supabase
            .from('conversation_links')
            .update({
              target_conversation_id: conversationId,
              linked_at: new Date().toISOString()
            })
            .eq('link_code', linkCodeMatch[1]);
        }
      }

      // Save user message
      const { data: savedMessage } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: messageContent,
          audio_url: imageUrl
        })
        .select()
        .single();

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

      // Check active human session
      const { data: liveSession } = await supabase
        .from('live_chat_sessions')
        .select('*, conversations(visitor_name, visitor_email, visitor_phone)')
        .eq('conversation_id', conversationId)
        .eq('status', 'active')
        .maybeSingle();

      if (liveSession) {
        const agentPhone = liveSession.metadata?.agent_whatsapp_phone;
        if (agentPhone && messageContent) {
          const conv = liveSession.conversations;
          const visitorName = conv?.visitor_name || conv?.visitor_email || conv?.visitor_phone || `+${senderPhone}`;
          
          let forwardBody = `👤 *${visitorName}*:\n${messageContent}`;
          if (imageUrl) forwardBody += `\n\n🖼️ [Image URL]: ${imageUrl}`;

          await sendMessage(agentPhone, forwardBody);
        }

        return new Response(JSON.stringify({ status: 'ok', forwarded: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // If image without text, acknowledge but don't ask AI
      if (messageType === 'image' && !messageText) {
        const imageAckReply = "I've received your image. How can I help you with this?";
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: imageAckReply
        });

        await sendMessage(senderPhone, imageAckReply);
        return new Response(JSON.stringify({ status: 'ok' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get AI completion context
      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
      if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

      const historyResult = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(20);

      const [widgetSettingsResult, learningsResult, qaPairsResult, relevantChunks] = await Promise.all([
        supabase.from('widget_settings').select('*').eq('business_id', businessId).maybeSingle(),
        supabase.from('business_learnings').select('content').eq('business_id', businessId).order('confidence_score', { ascending: false }).limit(5),
        supabase.from('bot_qa_pairs').select('*').eq('business_id', businessId).eq('enabled', true).order('priority', { ascending: false }),
        messageText.trim().length >= 1 ? (async (): Promise<string> => {
          try {
            const recentHistory = (historyResult.data || []).slice(-4);
            const userContext = recentHistory.filter((m: any) => m.role === 'user').map((m: any) => m.content).join(' ');
            const augmentedQuery = userContext ? `${userContext} ${messageText}`.trim().slice(0, 800) : messageText;

            const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ input: augmentedQuery.replace(/\n/g, ' '), model: 'text-embedding-3-small' })
            });
            if (!embedRes.ok) return '';
            const embedData = await embedRes.json();
            const queryEmbedding = embedData.data[0].embedding;
            const { data: matchData } = await supabase.rpc('match_knowledge_chunks', {
              query_embedding: queryEmbedding,
              match_count: 10,
              p_business_id: businessId,
              similarity_threshold: 0.15
            });
            if (matchData && matchData.length > 0) {
              return matchData.map((chunk: any) => {
                const meta = chunk.metadata || {};
                const sourceLabel = meta.title ? `${chunk.source_type === 'website' ? '🌐' : '📄'} ${meta.title}` : `${chunk.source_type}`;
                return `Source: ${sourceLabel}\nContent: ${chunk.content}`;
              }).join('\n\n---\n\n');
            }
            return '';
          } catch (e) {
            console.error('RAG Error:', e);
            return '';
          }
        })() : Promise.resolve('')
      ]);

      const widgetSettings = widgetSettingsResult.data;
      const learnings = learningsResult.data;
      const qaPairs = qaPairsResult.data;
      const history = (historyResult.data || []).reverse();

      // System prompt configuration
      let systemPrompt = widgetSettings?.system_prompt || 'You are a helpful AI assistant.';
      systemPrompt += '\n\n**IMPORTANT: YOU ARE RESPONDING ON WHATSAPP.**\n';
      systemPrompt += 'Please format your responses specifically for WhatsApp:\n';
      systemPrompt += '- DO NOT use any markdown symbols at all. Absolutely NO asterisks (*), underscores (_), or hash symbols (#).\n';
      systemPrompt += '- Output strictly PLAIN TEXT only.\n';
      systemPrompt += '- Use standard emojis strategically, but keep spacing clean.\n';
      systemPrompt += '- Keep responses concise and mobile-friendly.\n';
      systemPrompt += '\n\nSTRICT BUSINESS SCOPE & GUARDRAILS: You are an AI assistant representing THIS specific business ONLY. You MUST NOT answer off-topic, general knowledge, trivia, existential, or non-business questions (such as "when will the world end?", "who won the game?", "write a poem", "solve my math problem"). If the visitor asks any question that is not directly related to this business, its products, services, pricing, or support, YOU MUST POLITELY DECLINE by stating plain text without markdown: "I am an AI assistant for this business and can only answer questions related to our business, products, services, and support. How can I help you today?"';
      systemPrompt += '\n\nIf you cannot answer the user question or they ask for human help, suggest that they speak to an agent. In your response, if you determine you cannot help, include the exact phrase "ESCALATE_TO_AGENT" on a new line at the end.';

      if (relevantChunks) {
        systemPrompt += '\n\nRelevant Business Knowledge:\n\n' + relevantChunks;
      }
      if (qaPairs && qaPairs.length > 0) {
        systemPrompt += '\n\nFrequently Asked Questions:\n';
        qaPairs.forEach((pair: any) => {
          systemPrompt += `Q: ${pair.question}\nA: ${pair.answer}\n\n`;
        });
      }
      if (learnings && learnings.length > 0) {
        systemPrompt += '\n\nLearned Information:\n';
        learnings.forEach((learning: any) => {
          systemPrompt += `- ${learning.content}\n`;
        });
      }
      if (linkedHistory.length > 0) {
        systemPrompt += '\n\n📱 Previous Web Chat History:\n';
        systemPrompt += linkedHistory.map((m: any) => `${m.role === 'user' ? 'Visitor' : 'Assistant'}: ${m.content}`).join('\n');
      }

      const aiMessages = [
        { role: 'system', content: systemPrompt },
        ...history.map((m: any) => ({ role: m.role, content: m.content }))
      ];

      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: aiMessages,
        }),
      });

      if (!aiResponse.ok) throw new Error(`AI error: ${await aiResponse.text()}`);

      const aiData = await aiResponse.json();
      let reply = aiData.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
      
      const shouldEscalate = reply.includes('ESCALATE_TO_AGENT');
      let cleanReply = reply.replace('ESCALATE_TO_AGENT', '').trim();

      // Save assistant reply
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: cleanReply
      });

      // Send reply
      const sendRes = await sendMessage(senderPhone, cleanReply);

      if (!sendRes.success) {
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'system',
          content: `ERROR_SENDING_WHATSAPP: API failure using provider: ${provider}`
        });
      }

      if (shouldEscalate) {
        console.log('Escalating to human agent...');
        try {
          await fetch(
            `${supabaseUrl}/functions/v1/request-live-agent`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                businessId,
                visitorId,
                conversationId,
                reason: 'AI Escalated: ' + cleanReply.substring(0, 200)
              }),
            }
          );
          
          const escalationAck = "🔄 I've put you in the queue for a human agent. They will get back to you shortly!";
          await sendMessage(senderPhone, escalationAck);
        } catch (escalationError) {
          console.error('Error creating escalation:', escalationError);
        }
      }

      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error processing WhatsApp webhook:', error);
      return new Response(JSON.stringify({ 
        status: 'error', 
        error_message: error instanceof Error ? error.message : String(error)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
});
