import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
}).refine((data) => Boolean(data.message?.trim()) || Boolean(data.preChatData), {
  message: 'Message or pre-chat data is required',
});

Deno.serve(async (req) => {
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
      .select('*')
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

    if (preChatData) {
      const conversationPayload = {
        visitor_email: preChatData.email || null,
        visitor_name: preChatData.name || null,
        visitor_phone: preChatData.phone || null,
        visitor_company: preChatData.company || null,
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

    if (preChatEnabled && !preChatData && !existingConv?.visitor_email) {
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

    const { data: learnings } = await supabase
      .from('business_learnings')
      .select('content')
      .eq('business_id', businessId)
      .order('confidence_score', { ascending: false })
      .limit(5);

    // Fetch conversation history
    const { data: history } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    // Use OpenAI directly (your own API key)
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Generate embedding for the user's message to perform RAG
    let relevantChunks = '';
    try {
      if (message && message.trim().length > 0) {
        const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            input: message.replace(/\n/g, ' '),
            model: 'text-embedding-3-small'
          })
        });
        
        if (embedRes.ok) {
          const embedData = await embedRes.json();
          const queryEmbedding = embedData.data[0].embedding;
          
          const { data: matchData, error: matchError } = await supabase.rpc('match_knowledge_chunks', {
            query_embedding: queryEmbedding,
            match_count: 5,
            p_business_id: businessId
          });
          
          if (!matchError && matchData && matchData.length > 0) {
            relevantChunks = matchData.map((chunk: any) => `Source: ${chunk.source_type}\nContent: ${chunk.content}`).join('\n\n');
          }
        }
      }
    } catch (e) {
      console.error('RAG Error:', e);
    }

    // Build system prompt
    let systemPrompt = settings?.system_prompt || 'You are a helpful AI assistant.';
    
    systemPrompt += '\n\nIMPORTANT: When a visitor asks to speak to a live agent, first ask them why they need help and what specific issue they are facing. Try your best to resolve their issue using your knowledge. Only if you truly cannot help them should you suggest they wait for a human agent. In your response, if you determine you cannot help after trying, include the exact phrase "ESCALATE_TO_AGENT" on a new line at the end.';
    
    if (relevantChunks) {
      systemPrompt += '\n\nRelevant Business Knowledge:\n' + relevantChunks;
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
    systemPrompt += '\n\nIMPORTANT: If you cannot find the answer to the visitor\'s question in the provided business knowledge, website content, or learned insights, politely let them know and offer to connect them with a human agent who can assist further.';

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
        temperature: 0.4,
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
