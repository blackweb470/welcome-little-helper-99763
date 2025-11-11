import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  businessId: z.string().uuid({ message: "Invalid businessId format" }),
  visitorId: z.string().min(1).max(200).nullable().optional(),
  memory: z.object({
    summary: z.string().optional(),
    key_facts: z.array(z.string()).optional(),
    user_preferences: z.record(z.any()).optional()
  }).nullable().optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const validatedData = requestSchema.parse(body);
    const { businessId, memory, visitorId } = validatedData;
    
    if (!businessId) {
      throw new Error('businessId is required');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    // Fetch widget settings for the business
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const settingsResponse = await fetch(
      `${supabaseUrl}/rest/v1/widget_settings?business_id=eq.${businessId}&select=system_prompt,agent_name,voice_enabled`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      }
    );

    const settings = await settingsResponse.json();
    let systemPrompt = settings[0]?.system_prompt || 'You are a helpful AI assistant for a business. Be professional, friendly, and concise.';
    
    // Fetch business documents to enhance AI knowledge
    const documentsResponse = await fetch(
      `${supabaseUrl}/rest/v1/business_documents?business_id=eq.${businessId}&status=eq.ready&select=file_name,summary,content_text`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      }
    );
    
    const documents = await documentsResponse.json();
    
    // Fetch business learnings
    const learningsResponse = await fetch(
      `${supabaseUrl}/rest/v1/business_learnings?business_id=eq.${businessId}&confidence_score=gte.0.6&order=usage_count.desc&limit=20&select=learning_type,content,confidence_score`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      }
    );
    
    const learnings = await learningsResponse.json();
    
    // Add business knowledge from documents
    if (documents && Array.isArray(documents) && documents.length > 0) {
      systemPrompt += '\n\n=== Business Knowledge Base ===';
      systemPrompt += '\nThe following is important information about this business. Use this to provide accurate and contextual responses:\n\n';
      
      for (const doc of documents) {
        systemPrompt += `Document: ${doc.file_name}\n`;
        if (doc.summary) {
          systemPrompt += `Summary: ${doc.summary}\n`;
        }
        // Include a portion of content_text if available (limit to prevent token overflow)
        if (doc.content_text) {
          const contentPreview = doc.content_text.substring(0, 2000);
          systemPrompt += `Content: ${contentPreview}${doc.content_text.length > 2000 ? '...' : ''}\n`;
        }
        systemPrompt += '\n';
      }
      
      systemPrompt += 'Use this information to answer customer questions accurately. If you don\'t know something that\'s not in these documents, be honest about it.';
    }
    
    // Add learnings from past conversations
    if (learnings && Array.isArray(learnings) && learnings.length > 0) {
      systemPrompt += '\n\n=== Learnings from Past Conversations ===';
      systemPrompt += '\nThe AI has learned the following from previous customer interactions with this specific business:\n\n';
      
      const groupedLearnings: Record<string, string[]> = {};
      
      for (const learning of learnings) {
        if (!groupedLearnings[learning.learning_type]) {
          groupedLearnings[learning.learning_type] = [];
        }
        groupedLearnings[learning.learning_type].push(learning.content);
      }
      
      for (const [type, items] of Object.entries(groupedLearnings)) {
        systemPrompt += `\n${type.replace(/_/g, ' ').toUpperCase()}:\n`;
        for (const item of items) {
          systemPrompt += `- ${item}\n`;
        }
      }
      
      systemPrompt += '\nApply these learnings when responding to customers. This knowledge is specific to this business and improves with each conversation.';
    }
    
    // Add memory context if available
    if (memory && memory.summary) {
      systemPrompt += `\n\nPrevious conversation context for this visitor:\nSummary: ${memory.summary}`;
      
      if (memory.key_facts && memory.key_facts.length > 0) {
        systemPrompt += `\nKey facts: ${memory.key_facts.join(', ')}`;
      }
      
      if (memory.user_preferences) {
        systemPrompt += `\nUser preferences: ${JSON.stringify(memory.user_preferences)}`;
      }
      
      systemPrompt += '\n\nUse this context to provide personalized assistance and avoid asking for information you already know.';
    }
    
    console.log('Creating session with system prompt:', systemPrompt);

    // Request an ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions: systemPrompt,
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 1000
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    console.log("Session created successfully");

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
