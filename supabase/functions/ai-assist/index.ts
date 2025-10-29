import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Validate input
    const schema = z.object({
      action: z.enum(['suggest_response', 'generate_insights']),
      context: z.string().max(10000).optional(),
      lastMessage: z.string().max(5000).optional(),
      sentiment: z.string().max(50).optional(),
      conversation: z.string().max(50000).optional()
    });
    
    const { action, context, lastMessage, sentiment, conversation } = schema.parse(requestBody);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    if (action === 'suggest_response') {
      const prompt = `You are an AI assistant helping a customer support agent. Based on the following conversation context and the customer's sentiment, suggest 3 helpful response options.

Conversation context:
${context}

Last customer message: ${lastMessage}
Customer sentiment: ${sentiment}

Provide 3 different response suggestions that:
1. Address the customer's concern directly
2. Match the appropriate tone based on sentiment (empathetic if frustrated, friendly if positive)
3. Are concise and actionable

Format your response as a JSON object with a "responses" array containing the 3 suggestions.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are a helpful AI assistant that provides customer support suggestions. Always respond with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lovable AI error:', response.status, errorText);
        throw new Error(`Lovable AI error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      return new Response(
        content,
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'generate_insights') {
      const prompt = `Analyze this customer support conversation and provide insights:

${conversation}

Provide:
1. Key topics discussed (as an array)
2. A brief summary (2-3 sentences)
3. Recommendations for the support agent (as an array)

Format your response as a JSON object with "topics", "summary", and "recommendations" fields.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are a helpful AI assistant that analyzes customer conversations. Always respond with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lovable AI error:', response.status, errorText);
        throw new Error(`Lovable AI error: ${response.status}`);
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
