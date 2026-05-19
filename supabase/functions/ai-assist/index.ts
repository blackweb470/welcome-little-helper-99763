import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-visitor-id',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('AI-assist request:', requestBody);
    
    // Handle both chat and analytics requests
    const { conversationId, message, businessId, action, context, lastMessage, sentiment, conversation } = requestBody;
    
    // If this is a chat request
    if (conversationId && message && businessId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
      if (!OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY not configured');
        throw new Error('OPENAI_API_KEY is not configured');
      }

      const OPENAI_MODEL = Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini';
      
      console.log('Fetching widget settings and documents...');

      // Fetch widget settings
      const { data: settings } = await supabase
        .from('widget_settings')
        .select('system_prompt')
        .eq('business_id', businessId)
        .single();

      let systemPrompt = settings?.system_prompt || 'You are a helpful AI assistant for a business. Be professional, friendly, and concise.';

      // Fetch business documents (summaries for general context)
      const { data: documents } = await supabase
        .from('business_documents')
        .select('file_name, summary, content_text')
        .eq('business_id', businessId)
        .eq('status', 'ready');

      if (documents && documents.length > 0) {
        systemPrompt += '\n\n=== Business Knowledge Base ===\n';
        systemPrompt += 'The following is important information about this business:\n\n';
        
        for (const doc of documents) {
          systemPrompt += `Document: ${doc.file_name}\n`;
          if (doc.summary) systemPrompt += `Summary: ${doc.summary}\n`;
          if (doc.content_text) {
            const contentPreview = doc.content_text.substring(0, 2000);
            systemPrompt += `Content: ${contentPreview}${doc.content_text.length > 2000 ? '...' : ''}\n`;
          }
          systemPrompt += '\n';
        }
      }

      // ── RAG: Semantic search on knowledge_chunks (website + document embeddings) ──
      // This brings in table data, website content, and document chunks that are
      // semantically relevant to the user's question.
      let ragContext = '';
      try {
        // Build embedding for the user's message
        const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: message.replace(/\n/g, ' '),
            model: 'text-embedding-3-small',
          }),
        });

        if (embedRes.ok) {
          const embedData = await embedRes.json();
          const queryEmbedding = embedData.data[0].embedding;

          // Semantic search across all knowledge chunks (websites + documents + tables)
          const { data: matchData } = await supabase.rpc('match_knowledge_chunks', {
            query_embedding: queryEmbedding,
            match_count: 10,
            p_business_id: businessId,
            similarity_threshold: 0.15,
          });

          if (matchData && matchData.length > 0) {
            console.log(`RAG: ${matchData.length} chunks matched (top similarity: ${matchData[0]?.similarity?.toFixed(3)})`);
            ragContext = matchData.map((chunk: any) => {
              const meta = chunk.metadata || {};
              const hasTableData = meta.has_table_data ? ' [contains table data]' : '';
              const sourceLabel = meta.title
                ? `${chunk.source_type === 'website' ? '🌐' : '📄'} ${meta.title}${meta.url ? ` (${meta.url})` : ''}${hasTableData}`
                : `${chunk.source_type}`;
              return `Source: ${sourceLabel}\nContent: ${chunk.content}`;
            }).join('\n\n---\n\n');
          } else {
            console.log('RAG: no chunks above similarity threshold');
          }
        } else {
          console.error('Embeddings API Error:', await embedRes.text());
        }
      } catch (ragError) {
        console.error('RAG search error:', ragError);
      }

      if (ragContext) {
        systemPrompt += '\n\n=== Relevant Knowledge (from website crawl & documents, including table data) ===\n';
        systemPrompt += ragContext;
        systemPrompt += '\n\nIMPORTANT: Use the knowledge above to answer accurately. If table data is present, use it for precise answers about pricing, specifications, schedules, comparisons, etc. Do NOT make up information not present in the knowledge.';
      }

      // Fetch business learnings
      const { data: learnings } = await supabase
        .from('business_learnings')
        .select('learning_type, content')
        .eq('business_id', businessId)
        .gte('confidence_score', 0.6)
        .order('usage_count', { ascending: false })
        .limit(20);

      if (learnings && learnings.length > 0) {
        systemPrompt += '\n\n=== Learnings from Past Conversations ===\n';
        systemPrompt += 'Apply these insights when responding:\n\n';
        
        const grouped: Record<string, string[]> = {};
        for (const learning of learnings) {
          if (!grouped[learning.learning_type]) {
            grouped[learning.learning_type] = [];
          }
          grouped[learning.learning_type].push(learning.content);
        }
        
        for (const [type, items] of Object.entries(grouped)) {
          systemPrompt += `\n${type.replace(/_/g, ' ').toUpperCase()}:\n`;
          items.forEach(item => systemPrompt += `- ${item}\n`);
        }
      }

      // Fetch conversation history
      const { data: messages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(20);

      const conversationHistory = messages?.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })) || [];

      console.log('Calling AI for chat response');

      // Call OpenAI directly
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: message }
          ],
          temperature: 0.4,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        return new Response(
          JSON.stringify({ error: `AI service error: ${response.status}` }),
          { 
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const aiData = await response.json();
      const reply = aiData.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

      console.log('AI response generated:', reply.substring(0, 50));

      return new Response(
        JSON.stringify({ reply }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Otherwise handle analytics requests
    const schema = z.object({
      action: z.enum(['suggest_response', 'generate_insights']),
      context: z.string().max(10000).optional(),
      lastMessage: z.string().max(5000).optional(),
      sentiment: z.string().max(50).optional(),
      conversation: z.string().max(50000).optional()
    });
    
    const validated = schema.parse({ action, context, lastMessage, sentiment, conversation });
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const OPENAI_MODEL = Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini';

    if (validated.action === 'suggest_response') {
      const prompt = `You are an AI assistant helping a customer support agent. Based on the following conversation context and the customer's sentiment, suggest 3 helpful response options.

Conversation context:
${validated.context}

Last customer message: ${validated.lastMessage}
Customer sentiment: ${validated.sentiment}

Provide 3 different response suggestions that:
1. Address the customer's concern directly
2. Match the appropriate tone based on sentiment (empathetic if frustrated, friendly if positive)
3. Are concise and actionable

Format your response as a JSON object with a "responses" array containing the 3 suggestions.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: 'system', content: 'You are a helpful AI assistant that provides customer support suggestions. Always respond with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI error:', response.status, errorText);
        throw new Error(`OpenAI error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      return new Response(
        content,
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (validated.action === 'generate_insights') {
      const prompt = `Analyze this customer support conversation and provide insights:

${validated.conversation}

Provide:
1. Key topics discussed (as an array)
2. A brief summary (2-3 sentences)
3. Recommendations for the support agent (as an array)

Format your response as a JSON object with "topics", "summary", and "recommendations" fields.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: 'system', content: 'You are a helpful AI assistant that analyzes customer conversations. Always respond with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI error:', response.status, errorText);
        throw new Error(`OpenAI error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      return new Response(
        content,
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in ai-assist function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
