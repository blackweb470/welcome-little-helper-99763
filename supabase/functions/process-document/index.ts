import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-visitor-id',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { documentId } = await req.json();
    
    if (!documentId) {
      return new Response(
        JSON.stringify({ error: 'Document ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing document:', documentId);

    // Get document metadata
    const { data: document, error: docError } = await supabase
      .from('business_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('Document not found:', docError);
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('business-documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      console.error('Failed to download file:', downloadError);
      await supabase
        .from('business_documents')
        .update({ status: 'error', metadata: { error: 'Failed to download file' } })
        .eq('id', documentId);
      
      return new Response(
        JSON.stringify({ error: 'Failed to download file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let extractedText = '';
    const fileType = document.file_type?.toLowerCase() || '';

    // Handle different file types
    if (fileType.includes('text/plain') || fileType.includes('text/markdown')) {
      // Plain text files
      extractedText = await fileData.text();
    } else if (fileType.includes('json')) {
      // JSON files
      const jsonData = await fileData.text();
      extractedText = `JSON Content:\n${jsonData}`;
    } else if (fileType.includes('pdf') || fileType.includes('word') || fileType.includes('document')) {
      // For PDFs and Word docs, we'd ideally use a parsing library
      // For now, we'll note that it requires processing
      extractedText = `[${document.file_name}] - Binary document requires external processing. File type: ${fileType}`;
    } else {
      extractedText = `[${document.file_name}] - Unsupported file type: ${fileType}`;
    }

    // Generate summary using OpenAI if available
    let summary = '';
    if (openaiKey && extractedText.length > 100) {
      try {
        const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { 
                role: 'system', 
                content: 'You are a document summarizer. Create a concise 2-3 sentence summary of the document content that captures the key information relevant for customer support.' 
              },
              { 
                role: 'user', 
                content: `Summarize this business document:\n\n${extractedText.slice(0, 4000)}` 
              }
            ],
            max_tokens: 150,
          }),
        });

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          summary = summaryData.choices[0].message.content;
          console.log('Generated summary:', summary);
        }
      } catch (error) {
        console.error('Failed to generate summary:', error);
      }
    }

    // Update document with extracted content
    const { error: updateError } = await supabase
      .from('business_documents')
      .update({
        content_text: extractedText,
        summary: summary || `Document: ${document.file_name}`,
        status: 'ready',
        metadata: {
          processed_at: new Date().toISOString(),
          text_length: extractedText.length,
        }
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Failed to update document:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update document' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Clear old knowledge chunks
    await supabase.from('knowledge_chunks').delete()
      .eq('business_id', document.business_id)
      .eq('source_type', 'document')
      .eq('source_id', document.id);

    // Generate embeddings for RAG
    if (openaiKey && extractedText && extractedText.length > 0) {
      console.log('Generating embeddings for document...');
      try {
        const chunkSize = 1000;
        for (let i = 0; i < extractedText.length; i += chunkSize) {
          const chunk = extractedText.slice(i, i + chunkSize);
          
          const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              input: chunk.replace(/\n/g, ' '),
              model: 'text-embedding-3-small'
            })
          });
          
          if (embedRes.ok) {
            const embedData = await embedRes.json();
            const embedding = embedData.data[0].embedding;
            
            await supabase.from('knowledge_chunks').insert({
              business_id: document.business_id,
              source_type: 'document',
              source_id: document.id,
              content: chunk,
              embedding: embedding
            });
          }
        }
        console.log('Successfully generated and stored embeddings.');
      } catch (embedError) {
        console.error('Failed to generate embeddings for document:', embedError);
      }
    }

    console.log('Document processed successfully:', documentId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        documentId,
        summary,
        textLength: extractedText.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-document function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
