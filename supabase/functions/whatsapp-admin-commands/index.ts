// @ts-ignore: Deno module resolution
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-visitor-id',
};

interface AdminCommand {
  command: string;
  args: string[];
}

function parseCommand(text: string): AdminCommand | null {
  const trimmed = text.trim().toLowerCase();
  
  if (!trimmed.startsWith('/') && !trimmed.startsWith('!')) {
    return null;
  }
  
  const parts = trimmed.substring(1).split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);
  
  return { command, args };
}

// Admin commands handler for WhatsApp
// @ts-ignore: Deno namespace
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let { businessId, senderPhone, messageText, conversationId, phoneNumberId, accessToken } = await req.json();

    console.log('Admin command request:', { businessId, senderPhone, messageText: messageText?.substring(0, 50) });

    // @ts-ignore: Deno namespace
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    // @ts-ignore: Deno namespace
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Normalize businessId lookup from senderPhone if not provided
    if (!businessId) {
      const { data: settings } = await supabase
        .from('whatsapp_settings')
        .select('business_id')
        .or(`admin_phone_numbers.cs.{"${senderPhone}"},admin_phone_numbers.cs.{"${'+' + senderPhone}"}`)
        .limit(1);
      
      if (settings && settings.length > 0) {
        businessId = settings[0].business_id;
      }
    }

    const parsed = parseCommand(messageText);
    if (!parsed) {
      return new Response(JSON.stringify({ handled: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { command, args } = parsed;
    let responseText = '';

    console.log('Processing admin command:', command, 'with args:', args);

    switch (command) {
      case 'help':
      case 'h':
        responseText = `🤖 *Admin Commands*\n\n` +
          `📋 *Chat Management*\n` +
          `/queue - View pending requests\n` +
          `/accept [id] - Accept a chat request\n` +
          `/active - View active chats\n` +
          `/end [id] - End a chat (current session if ID omitted)\n\n` +
          `💡 *Tip:* You can click buttons and list items to quickly accept chats without typing IDs!`;
        break;

      case 'queue':
      case 'q':
        {
          const { data: queuedSessions } = await supabase
            .from('live_chat_sessions')
            .select(`
              id,
              created_at,
              transfer_reason,
              conversation_id,
              conversations!inner(visitor_name, visitor_email, visitor_phone, channel, business_id)
            `)
            .eq('status', 'queued')
            .eq('conversations.business_id', businessId)
            .order('created_at', { ascending: true })
            .limit(10);

          if (!queuedSessions || queuedSessions.length === 0) {
            responseText = '✅ No pending chat requests in queue.';
          } else {
            // Send as interactive list message
            const rows = queuedSessions.map((session: any) => {
              const conv = session.conversations;
              const visitorName = conv?.visitor_name || conv?.visitor_email || conv?.visitor_phone || 'Anonymous';
              return {
                id: `accept_${session.id.substring(0, 8)}`,
                title: `Accept ${visitorName.substring(0, 15)}`,
                description: `${getTimeAgo(session.created_at)} - ${session.transfer_reason?.substring(0, 40) || 'No reason'}`
              };
            });

            await fetch(
              `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  messaging_product: 'whatsapp',
                  to: senderPhone,
                  type: 'interactive',
                  interactive: {
                    type: 'list',
                    header: { type: 'text', text: '📬 Pending Requests' },
                    body: { text: `There are ${queuedSessions.length} customers waiting for an agent. Select one below to accept.` },
                    footer: { text: 'Queue Management' },
                    action: {
                      button: 'View Queue',
                      sections: [
                        {
                          title: 'Waitlist',
                          rows: rows
                        }
                      ]
                    }
                  }
                }),
              }
            );
            
            return new Response(JSON.stringify({ handled: true }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }
        break;

      case 'active':
        {
          const { data: activeSessions } = await supabase
            .from('live_chat_sessions')
            .select(`
              id,
              accepted_at,
              conversation_id,
              conversations!inner(visitor_name, visitor_email, visitor_phone, channel, business_id)
            `)
            .eq('status', 'active')
            .eq('conversations.business_id', businessId)
            .order('accepted_at', { ascending: false });

          if (!activeSessions || activeSessions.length === 0) {
            responseText = '✅ No active chat sessions at the moment.';
          } else {
            responseText = `🟢 *Active Chats (${activeSessions.length})*\n\n`;
            activeSessions.forEach((session: any) => {
              const conv = session.conversations;
              const visitorName = conv?.visitor_name || conv?.visitor_email || conv?.visitor_phone || 'Anonymous';
              responseText += `👤 *${visitorName}*\n`;
              responseText += `🆔 ID: \`${session.id.substring(0, 8)}\`\n`;
              responseText += `⏱️ Joined: ${getTimeAgo(session.accepted_at)}\n`;
              responseText += `🔌 Channel: ${conv.channel === 'whatsapp' ? '🟢 WhatsApp' : '🌐 Web'}\n\n`;
            });
            responseText += `💡 *Tip:* Type \`/end [id]\` to end a specific chat.`;
          }
        }
        break;

      case 'end':
      case 'e':
        {
          let sessionToEnd = null;

          if (args.length > 0) {
            const sessionIdPrefix = args[0];
            // Find active session matching the prefix for this business
            const { data: sessions } = await supabase
              .from('live_chat_sessions')
              .select('id, conversation_id, conversations!inner(business_id)')
              .eq('status', 'active')
              .eq('conversations.business_id', businessId);

            sessionToEnd = sessions?.find(s => s.id.startsWith(sessionIdPrefix));

            if (!sessionToEnd) {
              responseText = `❌ No active session found with ID starting with "${sessionIdPrefix}"`;
              break;
            }
          } else {
            // Find active session for this admin
            const { data: activeSessions } = await supabase
              .from('live_chat_sessions')
              .select('id, conversation_id')
              .eq('status', 'active')
              .contains('metadata', { agent_whatsapp_phone: senderPhone })
              .order('accepted_at', { ascending: false })
              .limit(1);

            if (!activeSessions || activeSessions.length === 0) {
              responseText = '❌ You don\'t have an active chat session to end. Type \`/active\` to view all active sessions.';
              break;
            }
            sessionToEnd = activeSessions[0];
          }

          if (sessionToEnd) {
            const now = new Date().toISOString();

            // End session
            await supabase
              .from('live_chat_sessions')
              .update({ status: 'ended', ended_at: now })
              .eq('id', sessionToEnd.id);

            // End conversation
            await supabase
              .from('conversations')
              .update({ ended_at: now })
              .eq('id', sessionToEnd.conversation_id);

            // Check if there are other people waiting in the queue
            const { count: pendingCount } = await supabase
              .from('live_chat_sessions')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'queued')
              .eq('conversations.business_id', businessId);

            if (pendingCount && pendingCount > 0) {
              responseText = `✅ Conversation ended successfully. There are *${pendingCount}* other customers waiting in your queue. Type \`/queue\` to see them.`;
            } else {
              responseText = '✅ Conversation ended successfully. Your queue is now empty.';
            }
            
            // Notify visitor and save to messages
            const endMsg = '👋 This chat session has been ended by the agent. Have a great day!';
            const { data: savedMsg } = await supabase
              .from('messages')
              .insert({
                conversation_id: sessionToEnd.conversation_id,
                role: 'assistant',
                content: endMsg
              })
              .select()
              .single();
              
            // Broadcast to web widget via realtime
            try {
              // Also fetch the conversation to get the correct business_id for the broadcast
              const { data: conv } = await supabase
                .from('conversations')
                .select('business_id')
                .eq('id', sessionToEnd.conversation_id)
                .single();

              const broadcastBusinessId = conv?.business_id || businessId;

              const endChannel = supabase.channel(`visitor-messages-${sessionToEnd.conversation_id}`);
              await new Promise<void>(r => {
                endChannel.subscribe(status => status === 'SUBSCRIBED' ? r() : null);
                setTimeout(r, 1200);
              });
              
              await endChannel.send({
                type: 'broadcast',
                event: 'agent_message',
                payload: {
                  id: savedMsg?.id || ('end-' + Date.now()),
                  content: endMsg,
                  role: 'assistant',
                  created_at: now,
                  businessId: broadcastBusinessId,
                  conversationId: sessionToEnd.conversation_id
                }
              });
              await supabase.removeChannel(endChannel);
            } catch (err) {
              console.error('Failed to broadcast end message:', err);
            }
          }
        }
        break;

      case 'accept':
      case 'a':
        {
          let sessionToAccept = null;
          
          if (args.length === 0) {
            // Find oldest queued session for this specific business
            const { data: queuedSessions } = await supabase
              .from('live_chat_sessions')
              .select('id, conversation_id, conversations!inner(business_id)')
              .eq('status', 'queued')
              .eq('conversations.business_id', businessId)
              .order('created_at', { ascending: true })
              .limit(1);
              
            if (queuedSessions && queuedSessions.length > 0) {
              sessionToAccept = queuedSessions[0];
            } else {
              responseText = '✅ No pending chat requests in your queue.';
              break;
            }
          } else {
            const sessionIdPrefix = args[0];
            // Find session matching the prefix - fetch all queued for this business and match in memory
            const { data: sessions } = await supabase
              .from('live_chat_sessions')
              .select('id, conversation_id, conversations!inner(business_id)')
              .eq('status', 'queued')
              .eq('conversations.business_id', businessId)
              .order('created_at', { ascending: true });

            sessionToAccept = sessions?.find(s => s.id.startsWith(sessionIdPrefix));

            if (!sessionToAccept) {
              responseText = `❌ No queued session found for your business with ID starting with "${sessionIdPrefix}"`;
              break;
            }
          }

          if (sessionToAccept) {
            // Get the business owner as agent
            const { data: business } = await supabase
              .from('businesses')
              .select('owner_id')
              .eq('id', businessId)
              .single();

            // Update session with agent info and WhatsApp phone
            const { error: updateError } = await supabase
              .from('live_chat_sessions')
              .update({
                status: 'active',
                agent_id: business?.owner_id,
                accepted_at: new Date().toISOString(),
                metadata: { agent_whatsapp_phone: senderPhone }
              })
              .eq('id', sessionToAccept.id);

            if (updateError) {
              responseText = `❌ Error accepting chat: ${updateError.message}`;
            } else {
              responseText = `✅ Chat accepted!\n\nSession ID: \`${sessionToAccept.id.substring(0, 8)}\`\n\nCustomer messages will now be forwarded to you here. Reply directly to respond.`;
              
              // Notify customer
              const { data: conv } = await supabase
                .from('conversations')
                .select('channel, channel_metadata, visitor_id')
                .eq('id', sessionToAccept.conversation_id)
                .single();

              if (conv?.channel === 'whatsapp') {
                const customerPhone = (conv.channel_metadata as any)?.phone_number;
                if (customerPhone) {
                  await fetch(
                    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
                    {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        to: customerPhone,
                        type: 'text',
                        text: { body: '👋 A support agent has joined the chat. How can we help you today?' }
                      }),
                    }
                  );
                }
              } else {
                // If it's a web chat, we should still save the message so it shows up in the widget
                await supabase
                  .from('messages')
                  .insert({
                    conversation_id: sessionToAccept.conversation_id,
                    role: 'assistant',
                    content: '👋 A support agent has joined the chat. How can we help you today?'
                  });

                // Broadcast the agent_joined event to immediately notify the web widget
                try {
                  const joinChannel = supabase.channel(`visitor-messages-${sessionToAccept.conversation_id}`);
                  await new Promise<void>((resolve) => {
                    joinChannel.subscribe((status: string) => {
                      if (status === 'SUBSCRIBED') resolve();
                    });
                    setTimeout(() => resolve(), 1500);
                  });
                  await joinChannel.send({
                    type: 'broadcast',
                    event: 'agent_joined',
                    payload: {
                      sessionId: sessionToAccept.id,
                      agentId: business?.owner_id,
                      acceptedAt: new Date().toISOString()
                    }
                  });
                  await supabase.removeChannel(joinChannel);
                } catch (err) {
                  console.error('Failed to broadcast agent_joined:', err);
                }
              }
            }
          }
        }
        break;

      default:
        responseText = `❓ Unknown command: \`/${command}\`\n\nType \`/help\` to see available commands.`;
    }

    // Send response via WhatsApp
    if (responseText && phoneNumberId && accessToken) {
      await fetch(
        `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: senderPhone,
            type: 'text',
            text: { body: responseText }
          }),
        }
      );
    }

    return new Response(JSON.stringify({ 
      handled: true, 
      command: parsed.command,
      response: responseText.substring(0, 100)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error processing admin command:', error);
    return new Response(JSON.stringify({ 
      handled: false, 
      error: error?.message || 'Unknown error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
