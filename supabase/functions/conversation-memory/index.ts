import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-visitor-id',
};

const requestSchema = z.object({
  action: z.enum(["retrieve_context", "update_context"], { 
    invalid_type_error: "Invalid action",
    required_error: "Action is required"
  }),
  visitorId: z.string().min(1).max(200),
  businessId: z.string().uuid({ message: "Invalid businessId format" }),
  conversationId: z.string().uuid({ message: "Invalid conversationId format" }).optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, visitorId, businessId, conversationId } = requestSchema.parse(body);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    if (action === 'retrieve_context') {
      // Get existing context for this visitor
      const { data: existingContext } = await supabase
        .from('conversation_context')
        .select('*')
        .eq('visitor_id', visitorId)
        .eq('business_id', businessId)
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      return new Response(
        JSON.stringify({ context: existingContext || null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update_context') {
      // Get all messages from the conversation
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (!messages || messages.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'No messages found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate summary and extract key facts using AI
      const conversationText = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      
      const prompt = `Analyze this customer conversation and extract:
1. A brief summary (2-3 sentences)
2. Key facts about the customer (as an array)
3. Any preferences mentioned (as a JSON object)

Conversation:
${conversationText}

Format your response as JSON with "summary", "key_facts", and "preferences" fields.`;

      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a helpful AI that extracts structured information from conversations. Always respond with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: "json_object" }
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('OpenAI error:', aiResponse.status, errorText);
        throw new Error(`OpenAI error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const analysis = JSON.parse(aiData.choices[0].message.content);

      // Check if context exists
      const { data: existingContext } = await supabase
        .from('conversation_context')
        .select('id')
        .eq('visitor_id', visitorId)
        .eq('business_id', businessId)
        .single();

      if (existingContext) {
        // Update existing context
        const { error: updateError } = await supabase
          .from('conversation_context')
          .update({
            summary: analysis.summary,
            key_facts: analysis.key_facts,
            user_preferences: analysis.preferences,
            context_data: { last_conversation_id: conversationId },
            last_updated: new Date().toISOString()
          })
          .eq('id', existingContext.id);

        if (updateError) throw updateError;
      } else {
        // Create new context
        const { error: insertError } = await supabase
          .from('conversation_context')
          .insert({
            visitor_id: visitorId,
            business_id: businessId,
            summary: analysis.summary,
            key_facts: analysis.key_facts,
            user_preferences: analysis.preferences,
            context_data: { last_conversation_id: conversationId }
          });

        if (insertError) throw insertError;
      }

      return new Response(
        JSON.stringify({ success: true, context: analysis }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in conversation-memory function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
