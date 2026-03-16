import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, businessId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Fetch conversation messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('role, content, sentiment, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;
    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No messages to learn from' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build conversation text
    const conversationText = messages.map(m => 
      `${m.role}: ${m.content}`
    ).join('\n');

    // Ask AI to extract learnings
    const prompt = `Analyze this customer support conversation and extract valuable learnings that will help improve future responses for THIS SPECIFIC BUSINESS.

Conversation:
${conversationText}

Extract:
1. Customer preferences or patterns (e.g., "customers prefer email over phone", "users often ask about X feature")
2. Product/service information revealed (e.g., "product Y costs $50", "shipping takes 3-5 days")
3. Common questions/FAQs that could help answer similar queries
4. Business-specific knowledge (hours, policies, procedures mentioned)
5. Effective response strategies that worked well

Format as JSON array with objects containing:
- type: "customer_preference" | "product_info" | "faq" | "business_policy" | "response_strategy"
- content: brief, actionable learning (1-2 sentences max)
- confidence: 0-1 score of how useful/accurate this learning is

Only include high-value, actionable learnings. Skip generic conversation fillers.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an AI that extracts valuable business learnings from conversations. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI error:', aiResponse.status, errorText);
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const learningsData = JSON.parse(aiData.choices[0].message.content);
    const learnings = learningsData.learnings || [];

    console.log('Extracted learnings:', learnings);

    // Store learnings in database
    const storedLearnings = [];
    for (const learning of learnings) {
      const { error: insertError } = await supabase
        .from('business_learnings')
        .insert({
          business_id: businessId,
          learning_type: learning.type,
          content: learning.content,
          source_conversation_id: conversationId,
          confidence_score: learning.confidence || 0.8,
          metadata: {
            extracted_at: new Date().toISOString(),
            message_count: messages.length
          }
        });

      if (!insertError) {
        storedLearnings.push(learning);
      } else {
        console.error('Error storing learning:', insertError);
      }
    }

    console.log(`Stored ${storedLearnings.length} learnings for business ${businessId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        learnings: storedLearnings,
        count: storedLearnings.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in learn-from-conversation:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
