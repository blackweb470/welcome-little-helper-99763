import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-visitor-id',
};

// WhatsApp Cloud API webhook verification and message handling
Deno.serve(async (req) => {
  const url = new URL(req.url);
  
  // Handle webhook verification (GET request from Meta)
  if (req.method === 'GET') {
    const params = Object.fromEntries(url.searchParams.entries());
    console.log('Full WhatsApp GET params:', params);

    const mode = url.searchParams.get('hub.mode') || url.searchParams.get('hub_mode');
    const token = url.searchParams.get('hub.verify_token') || url.searchParams.get('hub_verify_token');
    const challenge = url.searchParams.get('hub.challenge') || url.searchParams.get('hub_challenge');

    console.log('Extracted verification data:', { mode, hasToken: !!token, hasChallenge: !!challenge });

    if (mode === 'subscribe' && token && challenge) {
      const masterToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN');
      console.log('Master Token check:', { 
        hasMasterToken: !!masterToken, 
        matches: masterToken === token
      });
      
      // Check if it's the master app-level token
      if (masterToken && token === masterToken) {
        console.log('App-level webhook verified');
        return new Response(challenge, { 
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Look up the business by verify_token (for overrides)
      const { data: settings } = await supabase
        .from('whatsapp_settings')
        .select('*')
        .eq('verify_token', token)
        .maybeSingle();

      if (settings) {
        console.log('Webhook verified for business:', settings.business_id);
        return new Response(challenge, { 
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    }

    console.log('Webhook verification failed');
    return new Response('Forbidden', { status: 403 });
  }

  // Handle OPTIONS for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle incoming messages (POST request)
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      console.log('WhatsApp webhook payload:', JSON.stringify(body, null, 2));

      // Extract message data from WhatsApp payload
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      
      if (!value?.messages?.[0]) {
        // This might be a status update, not a message
        console.log('No message in payload, might be status update');
        return new Response(JSON.stringify({ status: 'ok' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const message = value.messages[0];
      const phoneNumberId = value.metadata?.phone_number_id;
      const senderPhone = message.from;
      const messageType = message.type;
      
      // Handle different message types including interactive replies
      let messageText = '';
      let interactiveReply: { type: string; id: string; title: string } | null = null;
      
      if (messageType === 'text') {
        messageText = message.text?.body || '';
      } else if (messageType === 'interactive') {
        // Handle quick reply button clicks
        if (message.interactive?.type === 'button_reply') {
          interactiveReply = {
            type: 'button_reply',
            id: message.interactive.button_reply.id,
            title: message.interactive.button_reply.title
          };
          // If it's a command button, use the ID as the message text
          if (message.interactive.button_reply.id.startsWith('cmd_') || (message.interactive.button_reply.id.includes('_') && message.interactive.button_reply.id !== 'request_agent')) {
            messageText = message.interactive.button_reply.id.replace('cmd_', '/');
            // If it doesn't start with /, and contains _, it might be an internal ID like accept_abc
            if (!messageText.startsWith('/')) {
              messageText = '/' + messageText.replace('_', ' ');
            }
          } else {
            messageText = message.interactive.button_reply.title;
          }
        }
        // Handle list selection
        else if (message.interactive?.type === 'list_reply') {
          const listId = message.interactive.list_reply.id;
          interactiveReply = {
            type: 'list_reply',
            id: listId,
            title: message.interactive.list_reply.title
          };
          
          // If it's a command list item, use the ID as the message text
          if (listId.startsWith('cmd_') || (listId.includes('_') && listId !== 'request_agent')) {
            messageText = listId.replace('cmd_', '/');
            if (!messageText.startsWith('/')) {
              messageText = '/' + messageText.replace('_', ' ');
            }
          } else {
            messageText = message.interactive.list_reply.title;
            if (message.interactive.list_reply.description) {
              messageText += ` - ${message.interactive.list_reply.description}`;
            }
          }
        }
      }

      console.log('Processing WhatsApp message:', { 
        phoneNumberId, 
        senderPhone, 
        messageText: messageText.substring(0, 100),
        messageType,
        interactiveReply
      });

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Find business by phone_number_id first (need for image downloads)
      const { data: waSettings, error: settingsError } = await supabase
        .from('whatsapp_settings')
        .select('*, admin_phone_numbers')
        .eq('phone_number_id', phoneNumberId)
        .eq('enabled', true)
        .maybeSingle();

      if (settingsError || !waSettings) {
        console.error('No WhatsApp settings found for phone_number_id:', phoneNumberId);
        return new Response(JSON.stringify({ status: 'ok' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const businessId = waSettings.business_id;
      const visitorId = `whatsapp_${senderPhone}`;

      // Check if sender is an admin and message is a command
      const adminPhones: string[] = waSettings.admin_phone_numbers || [];
      const isAdmin = adminPhones.some(phone => senderPhone.includes(phone.replace(/[^\d]/g, '')) || phone.replace(/[^\d]/g, '').includes(senderPhone));
      const isCommand = messageText.trim().startsWith('/') || messageText.trim().startsWith('!');

      if (isCommand) {
        if (isAdmin) {
          console.log('Processing admin command from:', senderPhone);
          
          // Call admin commands handler
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
                  accessToken: waSettings.access_token,
                  buttonId: interactiveReply?.id
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
          // Non-admin tried to use a command - inform them it's not available
          console.log('Non-admin attempted command:', senderPhone, messageText);
          
          const notAdminReply = "Hi! Commands are only available for business administrators. How can I help you with your questions today?";
          
          await fetch(
            `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${waSettings.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: senderPhone,
                type: 'text',
                text: { body: notAdminReply }
              }),
            }
          );

          return new Response(JSON.stringify({ status: 'ok', command_blocked: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } else if (isAdmin) {
        // Check if this admin has an active live chat session
        const { data: activeSession } = await supabase
          .from('live_chat_sessions')
          .select('id, conversation_id')
          .eq('status', 'active')
          .contains('metadata', { agent_whatsapp_phone: senderPhone })
          .maybeSingle();

        if (activeSession) {
          console.log('Admin is in an active session, routing message to customer');
          
          // Fetch conversation to get the correct business_id and channel
          const { data: conv } = await supabase
            .from('conversations')
            .select('channel, channel_metadata, business_id')
            .eq('id', activeSession.conversation_id)
            .single();

          const correctBusinessId = conv?.business_id || businessId;

          // Save the message to the database
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
              await fetch(
                `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${waSettings.access_token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: customerPhone,
                    type: 'text',
                    text: { body: messageText }
                  }),
                }
              );
            }
          } else {
            // This is a web-based chat, broadcast to the visitor via realtime
            if (savedMessage) {
              try {
                const channel = supabase.channel(`visitor-messages-${activeSession.conversation_id}`);
                await new Promise<void>((resolve) => {
                  channel.subscribe((status: string) => {
                    if (status === 'SUBSCRIBED') resolve();
                  });
                  setTimeout(() => resolve(), 1500); // Fallback to avoid hanging
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
                console.log('Broadcasted admin message to web visitor');
              } catch (broadcastError) {
                console.error('Error broadcasting admin message:', broadcastError);
              }
            }
          }
          
          // Acknowledge to agent
          return new Response(JSON.stringify({ status: 'ok', routed: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Handle image messages
      let imageUrl: string | null = null;
      let messageContent = messageText;

      if (messageType === 'image') {
        const imageId = message.image?.id;
        const imageCaption = message.image?.caption || '';
        
        if (imageId) {
          try {
            // Get image URL from WhatsApp
            const mediaResponse = await fetch(
              `https://graph.facebook.com/v19.0/${imageId}`,
              {
                headers: {
                  'Authorization': `Bearer ${waSettings.access_token}`,
                }
              }
            );
            
            if (mediaResponse.ok) {
              const mediaData = await mediaResponse.json();
              const mediaUrl = mediaData.url;
              
              // Download the image
              const imageDownloadResponse = await fetch(mediaUrl, {
                headers: {
                  'Authorization': `Bearer ${waSettings.access_token}`,
                }
              });
              
              if (imageDownloadResponse.ok) {
                const imageBlob = await imageDownloadResponse.blob();
                const arrayBuffer = await imageBlob.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);
                
                // Upload to Supabase storage
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
                  messageContent = imageCaption || '[Image]';
                  console.log('WhatsApp image saved:', imageUrl);
                }
              }
            }
          } catch (imgError) {
            console.error('Error processing WhatsApp image:', imgError);
            messageContent = '[Image - failed to process]';
          }
        }
      } else if ((messageType !== 'text' && messageType !== 'interactive') || !messageText) {
        console.log('Unsupported message type, skipping');
        return new Response(JSON.stringify({ status: 'ok' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }


      // Handle "Talk to Agent" button click
      if (interactiveReply?.id === 'request_agent') {
        console.log('Visitor clicked "Talk to Agent" button on WhatsApp');
        
        // 1. Create or get conversation
        const visitorId = `whatsapp_${senderPhone}`;
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

        // 2. Trigger live agent request (call the same logic as request-live-agent)
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
                businessId: businessId,
                visitorId: visitorId,
                conversationId: convId,
                reason: 'Requested via WhatsApp button'
              }),
            }
          );
        } catch (err) {
          console.error('Error triggering request-live-agent:', err);
        }

        // 3. Confirm to visitor on WhatsApp
        await fetch(
          `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${waSettings.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: senderPhone,
              type: 'text',
              text: { body: "✅ I've notified our team. A human agent will be with you shortly! Feel free to leave more details about your request here." }
            }),
          }
        );

        return new Response(JSON.stringify({ status: 'ok', agent_requested: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Detect if user is asking for an agent/human via text
      const agentKeywords = ['agent', 'human', 'help', 'person', 'speak to someone', 'talk to someone', 'support'];
      const isAskingForAgent = !isAdmin && !interactiveReply && agentKeywords.some(kw => messageText.toLowerCase().includes(kw));

      if (isAskingForAgent) {
        console.log('Sending "Talk to Agent" interactive button to visitor:', senderPhone);
        
        await fetch(
          `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${waSettings.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: senderPhone,
              type: 'interactive',
              interactive: {
                type: 'button',
                body: {
                  text: "I can help with most questions, but would you like to speak with a human agent instead?"
                },
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
            }),
          }
        );

        // Still save the user's message so it appears in the transcript
        // But we stop here so the AI doesn't double-reply
        const visitorId = `whatsapp_${senderPhone}`;
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

      // Check for conversation link code in the message
      const linkCodeMatch = messageContent.match(/\b([A-Z0-9]{6})\b/);
      let linkedConversationId: string | null = null;
      let linkedHistory: any[] = [];

      if (linkCodeMatch) {
        const potentialCode = linkCodeMatch[1];
        console.log('Checking for link code:', potentialCode);
        
        // Look up the link code
        const { data: linkData } = await supabase
          .from('conversation_links')
          .select('*, source_conversation_id')
          .eq('link_code', potentialCode)
          .eq('business_id', businessId)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (linkData) {
          linkedConversationId = linkData.source_conversation_id;
          console.log('Found linked conversation:', linkedConversationId);

          // Fetch history from the linked web conversation
          const { data: prevHistory } = await supabase
            .from('messages')
            .select('role, content, created_at')
            .eq('conversation_id', linkedConversationId)
            .order('created_at', { ascending: true })
            .limit(20);

          if (prevHistory && prevHistory.length > 0) {
            linkedHistory = prevHistory;
            console.log('Fetched', linkedHistory.length, 'messages from linked conversation');
          }
        }
      }

      // Create or get conversation
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
        console.log('Using existing WhatsApp conversation:', conversationId);
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

        if (convError) {
          console.error('Error creating conversation:', convError);
          throw convError;
        }

        conversationId = newConv.id;
        console.log('Created new WhatsApp conversation:', conversationId);

        // Update the link record with the target conversation
        if (linkedConversationId && linkCodeMatch) {
          await supabase
            .from('conversation_links')
            .update({
              target_conversation_id: conversationId,
              linked_at: new Date().toISOString()
            })
            .eq('link_code', linkCodeMatch[1]);
          
          console.log('Updated conversation link with target:', conversationId);
        }
      }

      // Save user message with image URL if present
      const { data: savedMessage } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: messageContent,
          audio_url: imageUrl // Reusing audio_url field for image URL
        })
        .select()
        .single();

      // If image was uploaded, create attachment record
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

      // Check if there's an active live chat session
      const { data: liveSession } = await supabase
        .from('live_chat_sessions')
        .select('*, conversations(visitor_name, visitor_email, visitor_phone)')
        .eq('conversation_id', conversationId)
        .eq('status', 'active')
        .maybeSingle();

      if (liveSession) {
        console.log('Human agent active, forwarding visitor message to WhatsApp admin:', liveSession.metadata?.agent_whatsapp_phone);
        
        const agentPhone = liveSession.metadata?.agent_whatsapp_phone;
        if (agentPhone && messageContent) {
          try {
            const conv = liveSession.conversations;
            const visitorName = conv?.visitor_name || conv?.visitor_email || conv?.visitor_phone || `+${senderPhone}`;
            
            let forwardBody = `👤 *${visitorName}*:\n${messageContent}`;
            if (imageUrl) {
              forwardBody += `\n\n🖼️ [Image URL]: ${imageUrl}`;
            }

            // Forward message to admin on WhatsApp
            await fetch(
              `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${waSettings.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  messaging_product: 'whatsapp',
                  to: agentPhone,
                  type: 'text',
                  text: { body: forwardBody }
                }),
              }
            );
          } catch (forwardErr) {
            console.error('Error forwarding visitor message to WhatsApp admin:', forwardErr);
          }
        }

        return new Response(JSON.stringify({ status: 'ok', forwarded: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // If it's an image without text, acknowledge receipt but don't process with AI
      if (messageType === 'image' && !messageText) {
        const imageAckReply = "I've received your image. How can I help you with this?";
        
        await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: imageAckReply
          });

        await fetch(
          `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${waSettings.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: senderPhone,
              type: 'text',
              text: { body: imageAckReply }
            }),
          }
        );

        return new Response(JSON.stringify({ status: 'ok' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get AI response using OpenAI
      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
      if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not configured');
      }

      // 1. Fetch conversation history first so it's fully populated and accessible for the RAG query context augmentation
      const historyResult = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(20);

      // 2. Fetch all other AI context in parallel for speed
      const [widgetSettingsResult, learningsResult, qaPairsResult, relevantChunks] = await Promise.all([
        // A. Widget settings
        supabase.from('widget_settings').select('*').eq('business_id', businessId).maybeSingle(),

        // B. Business learnings
        supabase
          .from('business_learnings')
          .select('content')
          .eq('business_id', businessId)
          .order('confidence_score', { ascending: false })
          .limit(5),

        // C. Q&A Pairs
        supabase
          .from('bot_qa_pairs')
          .select('*')
          .eq('business_id', businessId)
          .eq('enabled', true)
          .order('priority', { ascending: false }),

        // D. RAG knowledge search — context-augmented query for better short/follow-up question handling
        messageText.trim().length >= 1
          ? (async (): Promise<string> => {
              try {
                // Build richer query by combining recent user messages with current message
                // This ensures short messages like "price?" or "how much?" still find relevant content
                const recentHistory = (historyResult.data || []).slice(-4);
                const userContext = recentHistory
                  .filter((m: any) => m.role === 'user')
                  .map((m: any) => m.content)
                  .join(' ');
                const augmentedQuery = userContext
                  ? `${userContext} ${messageText}`.trim().slice(0, 800)
                  : messageText;

                const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ input: augmentedQuery.replace(/\n/g, ' '), model: 'text-embedding-3-small' })
                });
                if (!embedRes.ok) {
                  console.error('Embeddings API Error:', await embedRes.text());
                  return '';
                }
                const embedData = await embedRes.json();
                const queryEmbedding = embedData.data[0].embedding;
                const { data: matchData } = await supabase.rpc('match_knowledge_chunks', {
                  query_embedding: queryEmbedding,
                  match_count: 10,
                  p_business_id: businessId,
                  similarity_threshold: 0.15
                });
                if (matchData && matchData.length > 0) {
                  console.log(`RAG: ${matchData.length} chunks matched (top similarity: ${matchData[0]?.similarity?.toFixed(3)})`);
                  return matchData.map((chunk: any) => {
                    const meta = chunk.metadata || {};
                    const sourceLabel = meta.title
                      ? `${chunk.source_type === 'website' ? '🌐' : '📄'} ${meta.title}`
                      : `${chunk.source_type}`;
                    return `Source: ${sourceLabel}\nContent: ${chunk.content}`;
                  }).join('\n\n---\n\n');
                }
                console.log('RAG: no chunks above similarity threshold');
                return '';
              } catch (e) {
                console.error('RAG Error:', e);
                return '';
              }
            })()
          : Promise.resolve('')
      ]);

      const widgetSettings = widgetSettingsResult.data;
      const learnings = learningsResult.data;
      const qaPairs = qaPairsResult.data;
      // Fetched DESC for limit efficiency — reverse to restore chronological order
      const history = (historyResult.data || []).reverse();

      // Build system prompt
      let systemPrompt = widgetSettings?.system_prompt || 'You are a helpful AI assistant.';
      systemPrompt += '\n\n**IMPORTANT: YOU ARE RESPONDING ON WHATSAPP.**\n';
      systemPrompt += 'Please format your responses specifically for WhatsApp:\n';
      systemPrompt += '- DO NOT use any markdown symbols at all. Absolutely NO asterisks (*), underscores (_), or hash symbols (#).\n';
      systemPrompt += '- Output strictly PLAIN TEXT only.\n';
      systemPrompt += '- Use standard emojis strategically to make the text friendly and easy to read, but do not overdo it.\n';
      systemPrompt += '- Keep responses concise, scannable, and mobile-friendly. Use short paragraphs and spacing to separate ideas.\n';
      systemPrompt += '\nIMPORTANT: When a visitor asks to speak to a live agent, first ask them why they need help and what specific issue they are facing. Try your best to resolve their issue using your knowledge. Only if you truly cannot help them should you suggest they wait for a human agent. In your response, if you determine you cannot help after trying, include the exact phrase "ESCALATE_TO_AGENT" on a new line at the end.';
      
      if (relevantChunks) {
        systemPrompt += '\n\nRelevant Business Knowledge (use this to answer accurately — each block shows its source):\n\n' + relevantChunks;
        systemPrompt += '\n\nIMPORTANT: Use the knowledge above to answer questions. Do NOT make up information not found in the knowledge above.';
      }

      if (qaPairs && qaPairs.length > 0) {
        systemPrompt += '\n\nFrequently Asked Questions (Use these to answer user queries accurately):\n';
        qaPairs.forEach((pair: any) => {
          systemPrompt += `Q: ${pair.question}\nA: ${pair.answer}\n\n`;
        });
      }

      let contextAdded = 0;
      const MAX_CONTEXT_CHARS = 30000; // rough limit to prevent token explosion

      if (learnings && learnings.length > 0) {
        systemPrompt += '\n\nLearned Information:\n';
        for (const learning of learnings) {
          if (contextAdded > MAX_CONTEXT_CHARS) break;
          systemPrompt += `- ${learning.content}\n`;
          contextAdded += learning.content?.length || 0;
        }
      }

      // Add context about linked conversation if available
      if (linkedHistory.length > 0) {
        systemPrompt += '\n\n📱 IMPORTANT: This visitor continued from a web chat. Here is their previous conversation for context - acknowledge that you remember their earlier discussion:\n';
        systemPrompt += linkedHistory.map((m: any) => `${m.role === 'user' ? 'Visitor' : 'Assistant'}: ${m.content}`).join('\n');
      }

      systemPrompt += '\n\nIMPORTANT: If you cannot find the answer to the visitor\'s question in the provided business knowledge, website content, or learned insights, politely let them know and offer to connect them with a human agent who can assist further.';

      // Build AI messages - include linked history first, then current WhatsApp history
      const allHistory = [
        ...linkedHistory.map((m: any) => ({ role: m.role, content: m.content })),
        ...(history || []).map((m: any) => ({ role: m.role, content: m.content }))
      ];

      const aiMessages = [
        { role: 'system', content: systemPrompt },
        ...allHistory
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

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI API error:', aiResponse.status, errorText);
        // Do not try to insert into messages, role 'system' might be invalid
        throw new Error(`AI service error: ${aiResponse.status} - ${errorText}`);
      }

      const aiData = await aiResponse.json();
      let reply = aiData.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
      
      const shouldEscalate = reply.includes('ESCALATE_TO_AGENT');
      let cleanReply = reply.replace('ESCALATE_TO_AGENT', '').trim();

      // Save assistant message
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: cleanReply
        });

      // Send WhatsApp response
      const whatsappResponse = await fetch(
        `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${waSettings.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: senderPhone,
            type: 'text',
            text: { body: cleanReply }
          }),
        }
      );

      if (!whatsappResponse.ok) {
        const errorText = await whatsappResponse.text();
        console.error('WhatsApp API error:', whatsappResponse.status, errorText);
        
        // Log the error to the database for debugging
        await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role: 'system',
            content: `ERROR_SENDING_WHATSAPP: Status ${whatsappResponse.status}, Error: ${errorText}, URL: https://graph.facebook.com/v19.0/${phoneNumberId}/messages, Token length: ${waSettings.access_token?.length}`
          });
      } else {
        console.log('WhatsApp message sent successfully');
        const responseJson = await whatsappResponse.json();
        await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role: 'system',
            content: `DEBUG_SUCCESS: sent to ${senderPhone}, wamid: ${responseJson.messages?.[0]?.id}`
          });
      }

      // Handle escalation if needed
      if (shouldEscalate) {
        console.log('AI determined escalation is needed for WhatsApp visitor');
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
                businessId: businessId,
                visitorId: visitorId,
                conversationId: conversationId,
                reason: 'AI Escalated: ' + cleanReply.substring(0, 200)
              }),
            }
          );
          
          // Send an extra confirmation if the AI reply didn't already sound like a transfer
          const escalationAck = "🔄 I've put you in the queue for a human agent. They will get back to you shortly!";
          await fetch(
            `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${waSettings.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: senderPhone,
                type: 'text',
                text: { body: escalationAck }
              }),
            }
          );
        } catch (escalationError) {
          console.error('Error creating escalation:', escalationError);
        }
      }

      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error processing WhatsApp webhook:', error);
      
      // Try to log the exact crash to the database
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase.from('messages').insert({
          conversation_id: '61c1c692-cb2d-4553-8c9d-a9e5f1ad0094', // fallback if undefined
          role: 'system',
          content: `CRASH_ERROR: ${error instanceof Error ? error.message : String(error)} \nStack: ${error instanceof Error ? error.stack : ''}`
        });
      } catch (e) {
        // ignore
      }

      return new Response(JSON.stringify({ 
        status: 'error', 
        error_message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : ''
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
});
