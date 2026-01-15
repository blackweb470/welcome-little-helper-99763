import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessId, senderPhone, messageText, conversationId, phoneNumberId, accessToken } = await req.json();

    console.log('Admin command request:', { businessId, senderPhone, messageText: messageText?.substring(0, 50) });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
          `/queue - View pending chat requests\n` +
          `/accept [id] - Accept a chat request\n` +
          `/reject [id] - Reject a chat request\n` +
          `/active - View active chats\n` +
          `/end [id] - End an active chat\n\n` +
          `📄 *Documents*\n` +
          `/docs - List all documents\n` +
          `/doc [name] - View document summary\n\n` +
          `💬 *Proactive Messages*\n` +
          `/proactive - List proactive rules\n` +
          `/proactive add [name] | [message] - Add new rule\n` +
          `/proactive toggle [id] - Enable/disable rule\n\n` +
          `📊 *Stats*\n` +
          `/stats - View quick statistics\n\n` +
          `Type any command to get started!`;
        break;

      case 'queue':
      case 'q':
        const { data: queuedSessions } = await supabase
          .from('live_chat_sessions')
          .select(`
            id,
            created_at,
            transfer_reason,
            conversation_id,
            conversations!inner(visitor_name, visitor_email, visitor_phone, channel)
          `)
          .eq('status', 'queued')
          .order('created_at', { ascending: true })
          .limit(10);

        if (!queuedSessions || queuedSessions.length === 0) {
          responseText = '✅ No pending chat requests in queue.';
        } else {
          responseText = `📬 *Pending Chat Requests (${queuedSessions.length})*\n\n`;
          queuedSessions.forEach((session: any, idx: number) => {
            const conv = session.conversations;
            const visitorName = conv?.visitor_name || conv?.visitor_phone || 'Anonymous';
            const channel = conv?.channel || 'web';
            const channelEmoji = channel === 'whatsapp' ? '📱' : '🌐';
            const timeAgo = getTimeAgo(session.created_at);
            
            responseText += `${idx + 1}. ${channelEmoji} *${visitorName}*\n`;
            responseText += `   ID: \`${session.id.substring(0, 8)}\`\n`;
            responseText += `   ⏰ ${timeAgo}\n`;
            if (session.transfer_reason) {
              responseText += `   💬 ${session.transfer_reason.substring(0, 50)}\n`;
            }
            responseText += '\n';
          });
          responseText += `\nReply \`/accept [id]\` to accept a chat.`;
        }
        break;

      case 'accept':
      case 'a':
        if (args.length === 0) {
          responseText = '⚠️ Please provide a session ID.\nUsage: `/accept abc12345`';
        } else {
          const sessionIdPrefix = args[0];
          
          // Find session matching the prefix
          const { data: sessions } = await supabase
            .from('live_chat_sessions')
            .select('id, conversation_id')
            .eq('status', 'queued')
            .ilike('id', `${sessionIdPrefix}%`)
            .limit(1);

          if (!sessions || sessions.length === 0) {
            responseText = `❌ No queued session found with ID starting with "${sessionIdPrefix}"`;
          } else {
            const session = sessions[0];
            
            // Get the business owner as agent
            const { data: business } = await supabase
              .from('businesses')
              .select('owner_id')
              .eq('id', businessId)
              .single();

            const { error: updateError } = await supabase
              .from('live_chat_sessions')
              .update({
                status: 'active',
                agent_id: business?.owner_id,
                accepted_at: new Date().toISOString()
              })
              .eq('id', session.id);

            if (updateError) {
              responseText = `❌ Error accepting chat: ${updateError.message}`;
            } else {
              responseText = `✅ Chat accepted!\n\nSession ID: \`${session.id.substring(0, 8)}\`\n\nCustomer messages will now be forwarded to you here. Reply directly to respond.`;
              
              // Notify customer
              const { data: conv } = await supabase
                .from('conversations')
                .select('channel, channel_metadata, visitor_id')
                .eq('id', session.conversation_id)
                .single();

              if (conv?.channel === 'whatsapp') {
                const customerPhone = (conv.channel_metadata as any)?.phone_number;
                if (customerPhone) {
                  await fetch(
                    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
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
              }
            }
          }
        }
        break;

      case 'reject':
        if (args.length === 0) {
          responseText = '⚠️ Please provide a session ID.\nUsage: `/reject abc12345`';
        } else {
          const sessionIdPrefix = args[0];
          
          const { data: sessions } = await supabase
            .from('live_chat_sessions')
            .select('id')
            .eq('status', 'queued')
            .ilike('id', `${sessionIdPrefix}%`)
            .limit(1);

          if (!sessions || sessions.length === 0) {
            responseText = `❌ No queued session found with ID starting with "${sessionIdPrefix}"`;
          } else {
            const { error } = await supabase
              .from('live_chat_sessions')
              .update({ status: 'ended', ended_at: new Date().toISOString() })
              .eq('id', sessions[0].id);

            if (error) {
              responseText = `❌ Error: ${error.message}`;
            } else {
              responseText = `✅ Chat request rejected.`;
            }
          }
        }
        break;

      case 'active':
        const { data: activeSessions } = await supabase
          .from('live_chat_sessions')
          .select(`
            id,
            accepted_at,
            conversation_id,
            conversations!inner(visitor_name, visitor_phone, channel)
          `)
          .eq('status', 'active')
          .order('accepted_at', { ascending: false })
          .limit(10);

        if (!activeSessions || activeSessions.length === 0) {
          responseText = '📭 No active chat sessions.';
        } else {
          responseText = `🟢 *Active Chats (${activeSessions.length})*\n\n`;
          activeSessions.forEach((session: any, idx: number) => {
            const conv = session.conversations;
            const visitorName = conv?.visitor_name || conv?.visitor_phone || 'Anonymous';
            const channel = conv?.channel === 'whatsapp' ? '📱' : '🌐';
            const duration = getTimeAgo(session.accepted_at);
            
            responseText += `${idx + 1}. ${channel} *${visitorName}*\n`;
            responseText += `   ID: \`${session.id.substring(0, 8)}\`\n`;
            responseText += `   🕐 Active for ${duration}\n\n`;
          });
          responseText += `Reply \`/end [id]\` to end a chat.`;
        }
        break;

      case 'end':
        if (args.length === 0) {
          responseText = '⚠️ Please provide a session ID.\nUsage: `/end abc12345`';
        } else {
          const sessionIdPrefix = args[0];
          
          const { data: sessions } = await supabase
            .from('live_chat_sessions')
            .select('id, conversation_id')
            .eq('status', 'active')
            .ilike('id', `${sessionIdPrefix}%`)
            .limit(1);

          if (!sessions || sessions.length === 0) {
            responseText = `❌ No active session found with ID starting with "${sessionIdPrefix}"`;
          } else {
            const { error } = await supabase
              .from('live_chat_sessions')
              .update({ status: 'ended', ended_at: new Date().toISOString() })
              .eq('id', sessions[0].id);

            if (error) {
              responseText = `❌ Error: ${error.message}`;
            } else {
              responseText = `✅ Chat session ended.`;
            }
          }
        }
        break;

      case 'docs':
        const { data: docs } = await supabase
          .from('business_documents')
          .select('id, file_name, status, created_at')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!docs || docs.length === 0) {
          responseText = '📂 No documents uploaded yet.';
        } else {
          responseText = `📄 *Business Documents (${docs.length})*\n\n`;
          docs.forEach((doc: any, idx: number) => {
            const status = doc.status === 'ready' ? '✅' : '⏳';
            responseText += `${idx + 1}. ${status} *${doc.file_name}*\n`;
            responseText += `   ID: \`${doc.id.substring(0, 8)}\`\n\n`;
          });
        }
        break;

      case 'doc':
        if (args.length === 0) {
          responseText = '⚠️ Please provide a document name or ID.\nUsage: `/doc product` or `/doc abc12345`';
        } else {
          const searchTerm = args.join(' ');
          
          const { data: doc } = await supabase
            .from('business_documents')
            .select('file_name, summary, content_text, status')
            .eq('business_id', businessId)
            .or(`file_name.ilike.%${searchTerm}%,id.ilike.${searchTerm}%`)
            .limit(1)
            .maybeSingle();

          if (!doc) {
            responseText = `❌ No document found matching "${searchTerm}"`;
          } else {
            responseText = `📄 *${doc.file_name}*\n\n`;
            if (doc.summary) {
              responseText += `*Summary:*\n${doc.summary}\n\n`;
            } else if (doc.content_text) {
              responseText += `*Content Preview:*\n${doc.content_text.substring(0, 500)}...`;
            } else {
              responseText += `Status: ${doc.status}`;
            }
          }
        }
        break;

      case 'proactive':
        if (args.length === 0) {
          // List all proactive rules
          const { data: rules } = await supabase
            .from('proactive_chat_rules')
            .select('id, name, enabled, trigger_type, message')
            .eq('business_id', businessId)
            .order('priority', { ascending: true })
            .limit(10);

          if (!rules || rules.length === 0) {
            responseText = '💬 No proactive chat rules configured.\n\nUse `/proactive add [name] | [message]` to create one.';
          } else {
            responseText = `💬 *Proactive Rules (${rules.length})*\n\n`;
            rules.forEach((rule: any, idx: number) => {
              const status = rule.enabled ? '🟢' : '🔴';
              responseText += `${idx + 1}. ${status} *${rule.name}*\n`;
              responseText += `   Type: ${rule.trigger_type}\n`;
              responseText += `   ID: \`${rule.id.substring(0, 8)}\`\n`;
              responseText += `   "${rule.message.substring(0, 40)}..."\n\n`;
            });
            responseText += `\nUse \`/proactive toggle [id]\` to enable/disable.`;
          }
        } else if (args[0] === 'add') {
          // Add new proactive rule: /proactive add Name | Message
          const restText = args.slice(1).join(' ');
          const parts = restText.split('|').map(p => p.trim());
          
          if (parts.length < 2) {
            responseText = '⚠️ Usage: `/proactive add [name] | [message]`\n\nExample:\n`/proactive add Welcome | Hi! Need help finding something?`';
          } else {
            const [name, message] = parts;
            
            const { error } = await supabase
              .from('proactive_chat_rules')
              .insert({
                business_id: businessId,
                name: name,
                message: message,
                trigger_type: 'page_load',
                trigger_value: { delay_seconds: 5 },
                enabled: true,
                priority: 10
              });

            if (error) {
              responseText = `❌ Error creating rule: ${error.message}`;
            } else {
              responseText = `✅ Proactive rule created!\n\n*${name}*\n"${message}"`;
            }
          }
        } else if (args[0] === 'toggle') {
          if (args.length < 2) {
            responseText = '⚠️ Usage: `/proactive toggle [id]`';
          } else {
            const ruleIdPrefix = args[1];
            
            const { data: rule } = await supabase
              .from('proactive_chat_rules')
              .select('id, name, enabled')
              .eq('business_id', businessId)
              .ilike('id', `${ruleIdPrefix}%`)
              .limit(1)
              .maybeSingle();

            if (!rule) {
              responseText = `❌ No rule found with ID starting with "${ruleIdPrefix}"`;
            } else {
              const { error } = await supabase
                .from('proactive_chat_rules')
                .update({ enabled: !rule.enabled })
                .eq('id', rule.id);

              if (error) {
                responseText = `❌ Error: ${error.message}`;
              } else {
                const newStatus = !rule.enabled ? '🟢 Enabled' : '🔴 Disabled';
                responseText = `✅ *${rule.name}* is now ${newStatus}`;
              }
            }
          }
        } else {
          responseText = '⚠️ Unknown subcommand. Use `/proactive`, `/proactive add`, or `/proactive toggle`.';
        }
        break;

      case 'stats':
        // Get quick stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { count: todayConvs } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .gte('started_at', today.toISOString());

        const { count: pendingChats } = await supabase
          .from('live_chat_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'queued');

        const { count: activeChats } = await supabase
          .from('live_chat_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        const { count: totalDocs } = await supabase
          .from('business_documents')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessId);

        responseText = `📊 *Quick Stats*\n\n` +
          `📅 Today's conversations: *${todayConvs || 0}*\n` +
          `⏳ Pending chats: *${pendingChats || 0}*\n` +
          `🟢 Active chats: *${activeChats || 0}*\n` +
          `📄 Documents: *${totalDocs || 0}*`;
        break;

      default:
        responseText = `❓ Unknown command: \`/${command}\`\n\nType \`/help\` to see available commands.`;
    }

    // Send response via WhatsApp
    if (responseText && phoneNumberId && accessToken) {
      await fetch(
        `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
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
