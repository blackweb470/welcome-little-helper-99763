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
    
    // If this is a chat request (and no specific action is requested)
    if (conversationId && message && businessId && !action) {
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
        .select('learning_type, content, expires_at, metadata')
        .eq('business_id', businessId)
        .gte('confidence_score', 0.6)
        .order('usage_count', { ascending: false })
        .limit(30);

      if (learnings && learnings.length > 0) {
        const nowMs = Date.now();
        const activeLearnings = learnings.filter(l => {
          const expStr = l.expires_at || l.metadata?.expires_at;
          if (!expStr) return true;
          return new Date(expStr).getTime() > nowMs;
        });

        if (activeLearnings.length > 0) {
          systemPrompt += '\n\n=== Learnings from Past Conversations & Brain Dumps ===\n';
          systemPrompt += 'Apply these insights when responding:\n\n';
          
          const grouped: Record<string, string[]> = {};
          for (const learning of activeLearnings) {
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
    
    // Otherwise handle analytics requests and AI assist actions
    const schema = z.object({
      action: z.enum(['suggest_response', 'generate_insights', 'extract_learning_rule', 'save_brain_dump', 'synthesize_ground_truth']),
      context: z.string().max(10000).optional(),
      lastMessage: z.string().max(5000).optional(),
      sentiment: z.string().max(50).optional(),
      conversation: z.string().max(50000).optional(),
      message: z.string().max(5000).optional(),
      businessId: z.string().optional(),
      content: z.string().max(50000).optional(),
      expiresAt: z.string().nullable().optional(),
      category: z.string().optional()
    });
    
    const validated = schema.parse({
      action,
      context,
      lastMessage,
      sentiment,
      conversation,
      message,
      businessId,
      content: requestBody.content,
      expiresAt: requestBody.expiresAt,
      category: requestBody.category
    });
    
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

    if (validated.action === 'extract_learning_rule') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Fetch existing rules for duplicate/conflict detection
      const existingRules: { id: string; content: string; type: string }[] = [];
      if (validated.businessId) {
        const { data: learnings } = await supabase
          .from('business_learnings')
          .select('id, content')
          .eq('business_id', validated.businessId)
          .limit(60);
        const { data: qas } = await supabase
          .from('bot_qa_pairs')
          .select('id, question, answer')
          .eq('business_id', validated.businessId)
          .limit(60);

        if (learnings) {
          learnings.forEach(l => existingRules.push({ id: l.id, content: l.content, type: 'learning' }));
        }
        if (qas) {
          qas.forEach(q => existingRules.push({ id: q.id, content: `Q: ${q.question} -> A: ${q.answer}`, type: 'qa' }));
        }
      }

      const prompt = `You are an AI that helps curate a high-precision business knowledge base from live customer support chat replies.

A human support agent sent this chat reply to a customer:
"${validated.message || validated.lastMessage || ''}"

${validated.context ? `Recent conversation context:\n${validated.context}\n` : ''}
${existingRules.length > 0 ? `Existing knowledge base rules for this business:\n${existingRules.map(r => `- [ID: ${r.id}] (${r.type}) ${r.content}`).slice(0, 50).join('\n')}\n` : ''}

Your task:
1. Extract a clean, definitive, third-person factual statement or business policy rule from the agent's reply that the AI can permanently memorize.
   - Remove specific customer names ("Sarah"), greetings ("Hi there"), apologies ("Sorry about the delay"), and one-off conversational fluff.
   - If the reply has multiple facts, combine them cleanly into 1-2 clear, generalized sentences.
   - If the reply contains NO factual or reusable business knowledge (e.g. "Have a nice day!", "Hold on one moment while I check"), set isFactual to false and extractedRule to the cleaned string or original string.
2. Check if this newly extracted rule duplicates or contradicts any of the existing rules listed above.
   - If there is a duplicate or directly conflicting rule, set duplicateId to the existing rule's ID and duplicateWarning to a concise description of what conflicts or duplicates. Otherwise set duplicateId to null and duplicateWarning to null.

Format your response as a JSON object with:
- "isFactual": boolean
- "extractedRule": string (the clean factual statement)
- "duplicateId": string or null
- "duplicateWarning": string or null
- "suggestedCategory": string ("policy" | "hours" | "pricing" | "faq" | "general")`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: 'system', content: 'You are an AI that extracts clean factual rules and detects duplicates/conflicts. Always respond with valid JSON.' },
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

    if (validated.action === 'save_brain_dump') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      if (!validated.businessId || !validated.content) {
        throw new Error('businessId and content are required');
      }

      const contentTrimmed = validated.content.trim();
      const expiresAt = validated.expiresAt || null;
      const category = validated.category || 'manual_brain_dump';

      // Check if long text (> 300 characters) should be auto-routed to knowledge_chunks + summarized
      if (contentTrimmed.length > 300) {
        console.log(`Large brain dump detected (${contentTrimmed.length} chars). Generating summary and embedding into knowledge_chunks...`);

        // 1. Generate summary using gpt-4o-mini
        let summary = contentTrimmed.slice(0, 150) + '...';
        try {
          const summaryRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: OPENAI_MODEL,
              messages: [
                { role: 'system', content: 'You are an AI that summarizes long business notes or policies into 1-2 concise, high-density factual sentences for quick reference.' },
                { role: 'user', content: `Summarize this note/policy:\n\n${contentTrimmed}` }
              ],
              max_tokens: 150,
              temperature: 0.2
            }),
          });
          if (summaryRes.ok) {
            const summaryData = await summaryRes.json();
            if (summaryData.choices?.[0]?.message?.content) {
              summary = summaryData.choices[0].message.content.trim();
            }
          }
        } catch (sumErr) {
          console.error('Failed to generate summary for brain dump:', sumErr);
        }

        // 2. Insert summary row into business_learnings so main system prompt gets the concise rule
        const metadataPayload = {
          expires_at: expiresAt,
          full_text_routed: true,
          original_length: contentTrimmed.length,
          routed_summary: summary
        };

        const { data: insertedLearning, error: insertErr } = await supabase
          .from('business_learnings')
          .insert({
            business_id: validated.businessId,
            content: `[Note Summary] ${summary}`,
            learning_type: category,
            expires_at: expiresAt,
            metadata: metadataPayload
          })
          .select()
          .single();

        if (insertErr) {
          console.error('Error inserting learning:', insertErr);
          throw insertErr;
        }

        // 3. Chunk & embed the full text into knowledge_chunks
        try {
          const chunks: string[] = [];
          for (let i = 0; i < contentTrimmed.length; i += 450) {
            chunks.push(contentTrimmed.slice(i, i + 550));
          }

          let chunksStored = 0;
          for (let idx = 0; idx < chunks.length; idx++) {
            const chunkText = chunks[idx];
            const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                input: chunkText.replace(/\n/g, ' '),
                model: 'text-embedding-3-small',
              }),
            });

            if (embedRes.ok) {
              const embedData = await embedRes.json();
              const embedding = embedData.data[0].embedding;

              await supabase.from('knowledge_chunks').insert({
                business_id: validated.businessId,
                source_type: 'brain_dump',
                source_id: insertedLearning.id,
                content: chunkText,
                embedding,
                chunk_index: idx,
                metadata: {
                  title: `Brain Dump (${new Date().toLocaleDateString()})`,
                  expires_at: expiresAt,
                  category
                }
              });
              chunksStored++;
            }
          }
          console.log(`Stored ${chunksStored} knowledge chunks for large brain dump`);
        } catch (embedErr) {
          console.error('Error embedding large brain dump:', embedErr);
        }

        return new Response(
          JSON.stringify({
            success: true,
            routedToChunks: true,
            summary,
            expiresAt
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Short note <= 300 characters: insert directly into business_learnings
        const metadataPayload = {
          expires_at: expiresAt,
          full_text_routed: false
        };

        const { data: insertedLearning, error: insertErr } = await supabase
          .from('business_learnings')
          .insert({
            business_id: validated.businessId,
            content: contentTrimmed,
            learning_type: category,
            expires_at: expiresAt,
            metadata: metadataPayload
          })
          .select()
          .single();

        if (insertErr) {
          console.error('Error inserting short learning:', insertErr);
          throw insertErr;
        }

        return new Response(
          JSON.stringify({
            success: true,
            routedToChunks: false,
            expiresAt
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (validated.action === 'synthesize_ground_truth') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      if (!validated.businessId) {
        throw new Error('businessId is required');
      }

      // 1. Fetch widget settings (system prompt)
      const { data: settings } = await supabase
        .from('widget_settings')
        .select('system_prompt')
        .eq('business_id', validated.businessId)
        .single();

      // 2. Fetch active learnings
      const { data: rawLearnings } = await supabase
        .from('business_learnings')
        .select('id, learning_type, content, expires_at, metadata, created_at')
        .eq('business_id', validated.businessId);

      const nowMs = Date.now();
      const learnings = (rawLearnings || []).filter(l => {
        const expStr = l.expires_at || l.metadata?.expires_at;
        if (!expStr) return true;
        return new Date(expStr).getTime() > nowMs;
      });

      // 3. Fetch enabled Q&A pairs
      const { data: qaPairs } = await supabase
        .from('bot_qa_pairs')
        .select('id, question, answer, keywords')
        .eq('business_id', validated.businessId)
        .eq('enabled', true);

      // 4. Fetch ready documents
      const { data: documents } = await supabase
        .from('business_documents')
        .select('id, file_name, summary, file_type')
        .eq('business_id', validated.businessId)
        .eq('status', 'ready');

      let knowledgeDump = `=== WIDGET SYSTEM PROMPT ===\n${settings?.system_prompt || 'Default helpful AI assistant.'}\n\n`;
      
      knowledgeDump += `=== ACTIVE MEMORY & BRAIN DUMP RULES (${learnings.length} total) ===\n`;
      learnings.forEach(l => {
        knowledgeDump += `[Rule ID: ${l.id} | Category: ${l.learning_type} | Added: ${new Date(l.created_at).toLocaleDateString()}]\nContent: ${l.content}\n\n`;
      });

      knowledgeDump += `=== PRE-PROGRAMMED Q&A PAIRS (${qaPairs?.length || 0} total) ===\n`;
      (qaPairs || []).forEach(qa => {
        knowledgeDump += `[QA ID: ${qa.id}]\nQuestion: ${qa.question}\nAnswer: ${qa.answer}\nKeywords: ${(qa.keywords || []).join(', ')}\n\n`;
      });

      knowledgeDump += `=== UPLOADED DOCUMENTS (${documents?.length || 0} total) ===\n`;
      (documents || []).forEach(doc => {
        knowledgeDump += `[Doc ID: ${doc.id} | File: ${doc.file_name}]\nSummary: ${doc.summary}\n\n`;
      });

      console.log(`Synthesizing ground truth across ${learnings.length} learnings, ${qaPairs?.length || 0} Q&As, and ${documents?.length || 0} docs...`);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          response_format: { type: "json_object" },
          messages: [
            {
              role: 'system',
              content: `You are an expert AI Knowledge Auditor and Synthesizer. You will be provided with all active memory rules, pre-programmed Q&As, documents, and system prompts for a business AI agent.
Your goal is to synthesize what the AI believes the CURRENT GROUND TRUTH is, organized neatly by topics, and audit for any conflicts, ambiguities, or contradictions across all layered rules.

You must return a valid JSON object with EXACTLY the following structure:
{
  "topics": [
    {
      "topicName": "Hours & Schedule",
      "icon": "🕒",
      "synthesizedTruth": "Detailed synthesis of all rules related to operating hours...",
      "sourceCount": 3,
      "keyRules": ["Mon-Fri 9-5", "Closed Sundays"]
    }
  ],
  "contradictions": [
    {
      "domain": "Return Policy",
      "severity": "high",
      "description": "Rule A says 30-day returns while Rule B says 14 days for sale items without clarifying exceptions.",
      "conflictingSources": ["Rule ID: ...", "QA ID: ..."],
      "recommendation": "Update Rule A to explicitly state the exception for sale items or delete outdated rules."
    }
  ],
  "overallHealthScore": 92,
  "healthSummary": "Overall assessment of knowledge base clarity and organization."
}

If no contradictions are found, return an empty array [] for "contradictions" and a high health score (95-100). Create 4-8 logical topics covering all domains present in the data.`
            },
            {
              role: 'user',
              content: `Analyze this entire business AI knowledge base and generate the Ground Truth Manifest & Audit:\n\n${knowledgeDump.slice(0, 35000)}`
            }
          ],
          temperature: 0.2
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI error during synthesis:', response.status, errorText);
        throw new Error(`OpenAI error: ${response.status}`);
      }

      const data = await response.json();
      const rawJson = data.choices[0].message.content;
      let synthesized;
      try {
        synthesized = JSON.parse(rawJson);
      } catch (err) {
        console.error('Failed to parse synthesis JSON:', err, rawJson);
        throw new Error('Failed to parse synthesis JSON from OpenAI');
      }

      return new Response(
        JSON.stringify({
          success: true,
          groundTruth: synthesized,
          stats: {
            learningsCount: learnings.length,
            qaCount: qaPairs?.length || 0,
            docsCount: documents?.length || 0
          }
        }),
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
