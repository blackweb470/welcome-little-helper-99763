import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-visitor-id',
};

const requestSchema = z.object({
  messageId: z.string().uuid({ message: "Invalid messageId format" }),
  content: z.string().min(1).max(5000, { message: "Content must be between 1 and 5000 characters" })
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messageId, content } = requestSchema.parse(body);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Analyze sentiment using OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a sentiment analysis expert. Analyze the emotional tone of messages.
            
Return ONLY a JSON object with this exact structure:
{
  "sentiment": "positive" | "neutral" | "negative" | "frustrated",
  "score": -1 to 1 (number),
  "emotions": ["emotion1", "emotion2"],
  "reasoning": "brief explanation"
}

Guidelines:
- positive: happy, satisfied, grateful (score 0.3 to 1)
- neutral: informational, factual (score -0.2 to 0.3)
- negative: disappointed, unhappy (score -0.7 to -0.2)
- frustrated: angry, urgent, escalating (score -1 to -0.7)
- emotions: max 3 tags like "grateful", "confused", "urgent", "satisfied", "angry"
- Keep reasoning under 100 characters`
          },
          {
            role: 'user',
            content: `Analyze this message: "${content}"`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'analyze_sentiment',
            description: 'Analyze message sentiment and emotions',
            parameters: {
              type: 'object',
              properties: {
                sentiment: {
                  type: 'string',
                  enum: ['positive', 'neutral', 'negative', 'frustrated']
                },
                score: {
                  type: 'number',
                  minimum: -1,
                  maximum: 1
                },
                emotions: {
                  type: 'array',
                  items: { type: 'string' },
                  maxItems: 3
                },
                reasoning: {
                  type: 'string',
                  maxLength: 100
                }
              },
              required: ['sentiment', 'score', 'emotions', 'reasoning'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'analyze_sentiment' } }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI error:', error);
      throw new Error('Failed to analyze sentiment');
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No sentiment analysis result');
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    console.log('Sentiment analysis:', analysis);

    // Update message with sentiment data
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: updateError } = await supabase
      .from('messages')
      .update({
        sentiment: analysis.sentiment,
        sentiment_score: analysis.score,
        emotion_tags: analysis.emotions,
        analyzed_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (updateError) {
      console.error('Error updating message:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
