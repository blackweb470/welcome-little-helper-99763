import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-visitor-id',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessId, startDate, endDate } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Fetch conversations within date range
    let query = supabase
      .from('conversations')
      .select(`
        id,
        visitor_name,
        visitor_email,
        started_at,
        ended_at,
        status,
        messages (
          id,
          role,
          content,
          sentiment,
          sentiment_score,
          emotion_tags,
          created_at
        )
      `)
      .eq('business_id', businessId)
      .order('started_at', { ascending: false });

    if (startDate) {
      query = query.gte('started_at', startDate);
    }
    if (endDate) {
      query = query.lte('started_at', endDate);
    }

    const { data: conversations, error } = await query.limit(100);

    if (error) throw error;
    if (!conversations || conversations.length === 0) {
      return new Response(
        JSON.stringify({ 
          issues: [],
          questions: [],
          complaints: [],
          totalConversations: 0,
          averageSentiment: 0,
          summary: 'No conversations found in the selected date range.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build conversation text for AI analysis
    const conversationSummaries = conversations.map((conv: any) => {
      const userMessages = conv.messages?.filter((m: any) => m.role === 'user') || [];
      const messageText = userMessages.map((m: any) => m.content).join(' | ');
      const sentiment = userMessages.length > 0 
        ? userMessages.reduce((sum: number, m: any) => sum + (m.sentiment_score || 0), 0) / userMessages.length 
        : 0;
      
      return `[Sentiment: ${sentiment > 0.3 ? 'Positive' : sentiment < -0.3 ? 'Negative' : 'Neutral'}] ${messageText.substring(0, 500)}`;
    }).join('\n\n');

    const prompt = `Analyze these ${conversations.length} customer support conversations and identify patterns.

Conversations:
${conversationSummaries}

Extract and categorize:
1. **Issues** - Technical problems, bugs, service disruptions mentioned by customers
2. **Questions** - Common questions customers are asking (product features, pricing, how-to)
3. **Complaints** - Customer frustrations, dissatisfaction, pain points

For each category, provide:
- The specific issue/question/complaint (be concise but clear)
- How many times it appears (frequency estimate based on conversation analysis)
- Severity/importance:
  - **high**: Critical issues affecting multiple customers, urgent problems, service outages, data loss, payment issues
  - **medium**: Important but not urgent, feature requests, minor bugs, billing questions
  - **low**: General questions, minor inconveniences, informational requests

**IMPORTANT FOR QUESTIONS:**
- Group similar questions together (e.g., "How do I reset password?" and "Forgot password help" are the same)
- Sort questions by frequency (most asked first)
- For each question, provide a brief answer suggestion if possible

Also provide:
- A brief overall summary of customer concerns
- Top 3 action items for the business (prioritized by impact)

Format as JSON:
{
  "issues": [
    {
      "item": "Clear description of the issue",
      "frequency": 5,
      "severity": "high",
      "impact": "Brief description of customer impact"
    }
  ],
  "questions": [
    {
      "item": "What is the question?",
      "frequency": 8,
      "severity": "medium",
      "suggestedAnswer": "Brief answer that could help customers"
    }
  ],
  "complaints": [
    {
      "item": "What is the complaint about?",
      "frequency": 3,
      "severity": "high",
      "context": "Additional context about why this matters"
    }
  ],
  "summary": "2-3 sentence overall summary highlighting key trends and sentiment",
  "actionItems": [
    "Most critical action to take",
    "Second priority action",
    "Third priority action"
  ],
  "totalConversations": ${conversations.length}
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an AI that analyzes customer conversations to identify patterns, issues, questions, and complaints. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limited. Please wait a moment and try again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits in your Lyqn AI billing settings.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const aiData = await response.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);

    // Calculate sentiment stats
    const allMessages = conversations.flatMap((c: any) => c.messages || []);
    const userMessages = allMessages.filter((m: any) => m.role === 'user' && m.sentiment_score !== null);
    const averageSentiment = userMessages.length > 0
      ? userMessages.reduce((sum: number, m: any) => sum + (m.sentiment_score || 0), 0) / userMessages.length
      : 0;

    return new Response(
      JSON.stringify({ 
        ...analysis,
        averageSentiment,
        totalConversations: conversations.length,
        dateRange: { startDate, endDate }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-conversations:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
