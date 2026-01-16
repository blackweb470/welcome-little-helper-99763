import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// WhatsApp Cloud API webhook verification and message handling
Deno.serve(async (req) => {
  const url = new URL(req.url);
  
  // Handle webhook verification (GET request from Meta)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    console.log('WhatsApp webhook verification request:', { mode, token, challenge });

    if (mode === 'subscribe' && token && challenge) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Look up the business by verify_token
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
          messageText = message.interactive.button_reply.title;
        }
        // Handle list selection
        else if (message.interactive?.type === 'list_reply') {
          interactiveReply = {
            type: 'list_reply',
            id: message.interactive.list_reply.id,
            title: message.interactive.list_reply.title
          };
          messageText = message.interactive.list_reply.title;
          if (message.interactive.list_reply.description) {
            messageText += ` - ${message.interactive.list_reply.description}`;
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
                  accessToken: waSettings.access_token
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
      } else if (messageType !== 'text' || !messageText) {
        console.log('Unsupported message type, skipping');
        return new Response(JSON.stringify({ status: 'ok' }), {
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
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('status', 'active')
        .maybeSingle();

      if (liveSession) {
        console.log('Human agent active, skipping AI response');
        return new Response(JSON.stringify({ status: 'ok' }), {
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

      // Get AI response using the same logic as chat-message
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        throw new Error('LOVABLE_API_KEY not configured');
      }

      // Fetch widget settings and context
      const { data: widgetSettings } = await supabase
        .from('widget_settings')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();

      const { data: documents } = await supabase
        .from('business_documents')
        .select('content_text, file_name')
        .eq('business_id', businessId)
        .eq('status', 'ready');

      const { data: websiteContent } = await supabase
        .from('business_website_content')
        .select('title, content, url')
        .eq('business_id', businessId)
        .limit(10);

      const { data: learnings } = await supabase
        .from('business_learnings')
        .select('content')
        .eq('business_id', businessId)
        .order('confidence_score', { ascending: false })
        .limit(5);

      const { data: history } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      // Build system prompt
      let systemPrompt = widgetSettings?.system_prompt || 'You are a helpful AI assistant.';
      systemPrompt += '\n\nYou are responding via WhatsApp. Keep responses concise and mobile-friendly.';
      systemPrompt += '\n\nIMPORTANT: When a visitor asks to speak to a live agent, first ask them why they need help and what specific issue they are facing. Try your best to resolve their issue using your knowledge. Only if you truly cannot help them should you suggest they wait for a human agent. In your response, if you determine you cannot help after trying, include the exact phrase "ESCALATE_TO_AGENT" on a new line at the end.';
      
      if (documents && documents.length > 0) {
        systemPrompt += '\n\nBusiness Knowledge (from documents):\n' + documents.map((d: any) => 
          `${d.file_name}:\n${d.content_text}`
        ).join('\n\n');
      }

      if (websiteContent && websiteContent.length > 0) {
        systemPrompt += '\n\nBusiness Website Content:\n' + websiteContent.map((w: any) => 
          `Page: ${w.title} (${w.url})\n${w.content?.substring(0, 2000)}`
        ).join('\n\n---\n\n');
      }

      if (learnings && learnings.length > 0) {
        systemPrompt += '\n\nLearned Insights:\n' + learnings.map((l: any) => l.content).join('\n');
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

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: aiMessages,
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI API error:', aiResponse.status, errorText);
        throw new Error(`AI service error: ${aiResponse.status}`);
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
      } else {
        console.log('WhatsApp message sent successfully');
      }

      // Handle escalation if needed
      if (shouldEscalate) {
        const { error: escalationError } = await supabase
          .from('live_chat_sessions')
          .insert({
            conversation_id: conversationId,
            status: 'queued',
            queued_at: new Date().toISOString(),
            transfer_reason: 'Customer requested live agent via WhatsApp'
          });

        if (escalationError) {
          console.error('Error creating escalation:', escalationError);
        } else {
          console.log('Created live chat session for escalation');
        }
      }

      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error processing WhatsApp webhook:', error);
      // Always return 200 to prevent Meta from retrying
      return new Response(JSON.stringify({ status: 'error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
});
