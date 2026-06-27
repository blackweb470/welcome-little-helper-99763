import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-visitor-id',
};

const preChatSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(50).optional(),
  company: z.string().max(100).optional(),
  message: z.string().max(500).optional(),
});

const requestSchema = z.object({
  businessId: z.string().uuid('Invalid business ID format'),
  visitorId: z.string().min(1, 'Visitor ID required').max(200, 'Visitor ID too long'),
  conversationId: z.string().uuid('Invalid conversation ID').optional().nullable(),
  message: z.string().max(1000, 'Message too long (max 1000 characters)').optional(),
  preChatData: preChatSchema.optional(),
}).refine((data: any) => Boolean(data.message?.trim()) || Boolean(data.preChatData), {
  message: 'Message or pre-chat data is required',
});

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
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
    
    const { businessId, visitorId, conversationId: requestedConversationId, preChatData } = validationResult.data;
    const message = validationResult.data.message?.trim() || '';
    console.log('Chat message received:', { businessId, visitorId, hasMessage: Boolean(message), hasPreChatData: Boolean(preChatData) });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: settings } = await supabase
      .from('widget_settings')
      .select('system_prompt, pre_chat_enabled, pre_chat_required_fields, pre_chat_welcome_message, max_input_characters, show_qa_to_visitors, welcome_message, agent_name, primary_color, voice_enabled')
      .eq('business_id', businessId)
      .single();

    const preChatEnabled = settings?.pre_chat_enabled !== false;

    let existingConvQuery = supabase
      .from('conversations')
      .select('id, visitor_email, visitor_name')
      .eq('business_id', businessId)
      .eq('visitor_id', visitorId)
      .is('ended_at', null);

    if (requestedConversationId) {
      existingConvQuery = existingConvQuery.eq('id', requestedConversationId);
    } else {
      existingConvQuery = existingConvQuery.order('started_at', { ascending: false }).limit(1);
    }

    const { data: existingConv } = await existingConvQuery.maybeSingle();
    let conversationId: string | null = existingConv?.id || null;

    // Persistent identity recovery: If no active conversation but preChatEnabled,
    // try to find visitor info from previous conversations to avoid 403
    let recoveredPreChatData = null;
    if (!existingConv && preChatEnabled && !preChatData) {
      const { data: pastConv } = await supabase
        .from('conversations')
        .select('visitor_email, visitor_name, visitor_phone, visitor_company')
        .eq('business_id', businessId)
        .eq('visitor_id', visitorId)
        .not('visitor_email', 'is', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (pastConv) {
        console.log('Recovered persistent identity from past conversation');
        recoveredPreChatData = {
          email: pastConv.visitor_email,
          name: pastConv.visitor_name,
          phone: pastConv.visitor_phone,
          company: pastConv.visitor_company
        };
      }
    }

    const finalPreChatData = preChatData || recoveredPreChatData;

    if (finalPreChatData) {
      const conversationPayload = {
        visitor_email: finalPreChatData.email || null,
        visitor_name: finalPreChatData.name || null,
        visitor_phone: finalPreChatData.phone || null,
        visitor_company: finalPreChatData.company || null,
      };

      if (conversationId) {
        const { error: updateError } = await supabase
          .from('conversations')
          .update(conversationPayload)
          .eq('id', conversationId)
          .eq('business_id', businessId)
          .eq('visitor_id', visitorId);

        if (updateError) throw updateError;
      } else {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            business_id: businessId,
            visitor_id: visitorId,
            ...conversationPayload,
            started_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (convError) throw convError;
        conversationId = newConv.id;
        console.log('Created new conversation for persistent user:', conversationId);
      }

      if (!message) {
        return new Response(
          JSON.stringify({ conversationId, preChatCompleted: true, reply: null }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!conversationId) {
      if (preChatEnabled) {
        return new Response(
          JSON.stringify({ error: 'Pre-chat form required', details: 'Please complete the pre-chat form before starting a conversation' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({ business_id: businessId, visitor_id: visitorId, started_at: new Date().toISOString() })
        .select('id')
        .single();

      if (convError) throw convError;
      conversationId = newConv.id;
    }

    if (preChatEnabled && !finalPreChatData && !existingConv?.visitor_email) {
      return new Response(
        JSON.stringify({ error: 'Pre-chat form required', details: 'Please complete the pre-chat form before starting a conversation' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save user message
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message
      });

    // Check if there's an active live chat session (human agent is handling this)
    const { data: liveSession } = await supabase
      .from('live_chat_sessions')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('status', 'active')
      .maybeSingle();

    // If human agent is active, don't generate AI response
    if (liveSession) {
      console.log('Human agent active, skipping AI response');

      // Forward message to admin on WhatsApp if they are managing via WhatsApp
      if (liveSession.metadata?.agent_whatsapp_phone && message) {
        try {
          // Find whatsapp settings. Try the business first, then try to find 
          // settings where the active agent's phone is an admin (for multi-business support)
          let waSettings = null;
          const { data: directSettings } = await supabase
            .from('whatsapp_settings')
            .select('access_token, phone_number_id')
            .eq('business_id', businessId)
            .eq('enabled', true)
            .maybeSingle();
            
          if (directSettings) {
            waSettings = directSettings;
          } else {
            const agentPhone = liveSession.metadata.agent_whatsapp_phone;
            // Fallback: Search for settings where this phone is an admin.
            // We check both the exact number and the number with a '+' prefix.
            const { data: fallbackSettings } = await supabase
              .from('whatsapp_settings')
              .select('access_token, phone_number_id')
              .or(`admin_phone_numbers.cs.{"${agentPhone}"},admin_phone_numbers.cs.{"${'+' + agentPhone}"}`)
              .eq('enabled', true)
              .limit(1);
            
            if (fallbackSettings && fallbackSettings.length > 0) {
              waSettings = fallbackSettings[0];
            } else {
              console.warn('No WhatsApp settings found for agent forwarding', { businessId, agentPhone });
            }
          }
          
          if (waSettings?.access_token && waSettings?.phone_number_id) {
            const { data: conv } = await supabase
              .from('conversations')
              .select('visitor_name, visitor_email')
              .eq('id', conversationId)
              .single();
              
            const visitorIdentifier = conv?.visitor_name || conv?.visitor_email || 'Visitor';
            
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
                  to: liveSession.metadata.agent_whatsapp_phone,
                  type: 'text',
                  text: { body: `👤 *${visitorIdentifier}*:\n${message}` }
                }),
              }
            );
          }
        } catch (err) {
          console.error('Error forwarding message to WhatsApp admin:', err);
        }
      }

      return new Response(
        JSON.stringify({ 
          reply: null, 
          conversationId, 
          humanAgentActive: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for programmed Q&A responses first
    const { data: qaPairs } = await supabase
      .from('bot_qa_pairs')
      .select('*')
      .eq('business_id', businessId)
      .eq('enabled', true)
      .order('priority', { ascending: false });

    if (qaPairs && qaPairs.length > 0) {
      const messageLower = message.toLowerCase();
      
      // Try to find exact or keyword match
      for (const pair of qaPairs) {
        const questionLower = pair.question.toLowerCase();
        const keywords = pair.keywords || [];
        
        // Check for exact question match or keyword match
        if (messageLower.includes(questionLower) || 
            keywords.some((kw: string) => messageLower.includes(kw.toLowerCase()))) {
          
          // Save the programmed response
          await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              role: 'assistant',
              content: pair.answer
            });
          
          console.log('Found matching Q&A pair, returning programmed response');
          return new Response(
            JSON.stringify({ reply: pair.answer, conversationId, programmedResponse: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Get AI response

    // Validate message length against configured max_input_characters
    const maxChars = settings?.max_input_characters || 500;
    if (message.length > maxChars) {
      return new Response(
        JSON.stringify({ 
          error: 'Message too long', 
          details: `Message exceeds the maximum allowed length of ${maxChars} characters` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // 2. Fetch learnings and RAG knowledge in parallel
    const [learningsResult, relevantChunks] = await Promise.all([
      // A. Business learnings
      supabase
        .from('business_learnings')
        .select('content')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(20),

      // B. RAG knowledge search — context-augmented query for better short/follow-up question handling
      message.trim().length >= 1
        ? (async (): Promise<string> => {
            try {
              // Build a richer query: combine the current message with recent conversation context
              // This helps short messages like "how much?" find the right content
              const recentHistory = (historyResult.data || []).slice(-4); // last 2 exchanges
              const userContext = recentHistory
                .filter((m: any) => m.role === 'user')
                .map((m: any) => m.content)
                .join(' ');
              const augmentedQuery = userContext
                ? `${userContext} ${message}`.trim().slice(0, 800)
                : message;

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
                match_count: 35, // Drastically increased to ensure no small details are missed
                p_business_id: businessId,
                similarity_threshold: 0.05 // Drastically lowered to catch even loosely related small details
              });
              if (matchData && matchData.length > 0) {
                console.log(`RAG: ${matchData.length} chunks matched (top similarity: ${matchData[0]?.similarity?.toFixed(3)})`);
                return matchData.map((chunk: any) => {
                  const meta = chunk.metadata || {};
                  const sourceLabel = meta.title
                    ? `${chunk.source_type === 'website' ? '🌐' : '📄'} ${meta.title}${meta.url ? ` (${meta.url})` : ''}`
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

    const learnings = learningsResult.data;
    // Fetched DESC for limit efficiency — reverse to restore chronological order
    const history = (historyResult.data || []).reverse();

    // Build system prompt
    let systemPrompt = settings?.system_prompt || 'You are a helpful AI assistant.';
    
    systemPrompt += '\n\nIMPORTANT: When a visitor asks to speak to a live agent, first ask them why they need help and what specific issue they are facing. Try your best to resolve their issue using your knowledge. Only if you truly cannot help them should you suggest they wait for a human agent. In your response, if you determine you cannot help after trying, include the exact phrase "ESCALATE_TO_AGENT" on a new line at the end.';
    
    if (relevantChunks) {
      systemPrompt += '\n\nRelevant Business Knowledge (use this information to answer accurately — each block shows its source):\n\n' + relevantChunks;
      systemPrompt += '\n\nCRITICAL INSTRUCTION: You are strictly limited to the information provided in the "Relevant Business Knowledge", "Learned Insights", and "Frequently Asked Questions" sections. You MUST NOT hallucinate, guess, or make up ANY information that is not explicitly stated in the knowledge base. If the visitor asks a question and the exact answer is NOT in the provided knowledge base, you must politely state that you do not have that information and offer to connect them to a human agent. Do not attempt to guess or provide general outside knowledge.';
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
      systemPrompt += '\n\nLearned Insights:\n';
      for (const learning of learnings) {
        if (contextAdded > MAX_CONTEXT_CHARS) break;
        systemPrompt += `- ${learning.content}\n`;
        contextAdded += learning.content?.length || 0;
      }
    }

    // Add fallback instruction for when AI can't find answers
    systemPrompt += '\n\nIMPORTANT: If you cannot find the exact answer to the visitor\'s question in the provided business knowledge, website content, or learned insights, YOU MUST NOT GUESS. Politely let them know you do not have that specific information and offer to connect them with a human agent who can assist further.';

    // Call AI
    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).map((m: any) => ({ role: m.role, content: m.content }))
    ];

    // Use OpenAI directly (your own API key)


    const OPENAI_MODEL = Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini';

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: aiMessages,
        temperature: 0.1, // Lower temperature drastically reduces hallucination
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('OpenAI API error:', aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI is rate limited right now. Please try again shortly.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI service error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let reply = aiData.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    
    // Check if AI wants to escalate
    const shouldEscalate = reply.includes('ESCALATE_TO_AGENT');
    let cleanReply = reply.replace('ESCALATE_TO_AGENT', '').trim();

    // Save assistant message
    const { data: savedMessage } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: cleanReply
      })
      .select('id')
      .single();

    const messageId = savedMessage?.id || null;
    console.log('AI response generated successfully, messageId:', messageId);

    return new Response(
      JSON.stringify({ reply: cleanReply, conversationId, shouldEscalate, messageId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat-message function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
