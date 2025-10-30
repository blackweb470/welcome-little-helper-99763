import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessId, visitorId, message } = await req.json();
    console.log('Chat message received:', { businessId, visitorId, message });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create or get conversation
    let conversationId: string;
    
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('business_id', businessId)
      .eq('visitor_id', visitorId)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (existingConv) {
      conversationId = existingConv.id;
      console.log('Using existing conversation:', conversationId);
    } else {
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          business_id: businessId,
          visitor_id: visitorId,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        throw convError;
      }

      conversationId = newConv.id;
      console.log('Created new conversation:', conversationId);
    }

    // Save user message
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message
      });

    // Get AI response
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Fetch widget settings and context
    const { data: settings } = await supabase
      .from('widget_settings')
      .select('*')
      .eq('business_id', businessId)
      .single();

    const { data: documents } = await supabase
      .from('business_documents')
      .select('content_text, file_name')
      .eq('business_id', businessId)
      .eq('status', 'completed');

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

    // Build system prompt
    let systemPrompt = settings?.system_prompt || 'You are a helpful AI assistant.';
    
    if (documents && documents.length > 0) {
      systemPrompt += '\n\nBusiness Knowledge:\n' + documents.map((d: any) => 
        `${d.file_name}:\n${d.content_text}`
      ).join('\n\n');
    }

    if (learnings && learnings.length > 0) {
      systemPrompt += '\n\nLearned Insights:\n' + learnings.map((l: any) => l.content).join('\n');
    }

    // Call AI
    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).map((m: any) => ({ role: m.role, content: m.content }))
    ];

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: aiMessages,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI service error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const reply = aiData.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Save assistant message
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: reply
      });

    console.log('AI response generated successfully');

    return new Response(
      JSON.stringify({ reply, conversationId }),
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
