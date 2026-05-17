import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-visitor-id',
};

// ─── Chunking with overlap ────────────────────────────────────────────────────
// Splits text into ~500-char chunks with a 100-char overlap so ideas that span
// chunk boundaries are still semantically captured by both neighbours.
function chunkTextWithOverlap(
  text: string,
  chunkSize = 500,
  overlap = 100
): string[] {
  const chunks: string[] = [];
  const step = chunkSize - overlap;

  // Prefer splitting at sentence / paragraph boundaries when possible
  const sentences = text.split(/(?<=[.!?])\s+|\n\n+/);
  let buffer = '';

  for (const sentence of sentences) {
    if ((buffer + ' ' + sentence).trim().length <= chunkSize) {
      buffer = (buffer + ' ' + sentence).trim();
    } else {
      if (buffer.length > 0) {
        chunks.push(buffer);
        // Keep the last `overlap` chars for continuity
        buffer = buffer.slice(-overlap) + ' ' + sentence.trim();
        buffer = buffer.trim();
      } else {
        // Sentence itself is longer than chunkSize — force-split it
        let i = 0;
        while (i < sentence.length) {
          chunks.push(sentence.slice(i, i + chunkSize));
          i += step;
        }
        buffer = '';
      }
    }
  }
  if (buffer.length > 50) chunks.push(buffer);

  return chunks.filter(c => c.trim().length > 30);
}

// ─── PDF extraction via Firecrawl ────────────────────────────────────────────
async function extractPdfViaFirecrawl(
  publicUrl: string,
  firecrawlKey: string
): Promise<string> {
  console.log('Attempting Firecrawl PDF extraction for:', publicUrl);
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: publicUrl,
      formats: ['markdown'],
      onlyMainContent: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firecrawl error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const markdown = data?.data?.markdown || data?.markdown || '';
  console.log(`Firecrawl extracted ${markdown.length} chars from PDF`);
  return markdown;
}

// ─── PDF extraction via OpenAI vision (fallback) ─────────────────────────────
// Sends the first ~20 pages worth of text to GPT-4o to extract readable content
async function extractPdfViaOpenAI(
  fileBlob: Blob,
  fileName: string,
  openaiKey: string
): Promise<string> {
  console.log('Attempting OpenAI Files API extraction for:', fileName);

  // Upload file to OpenAI
  const formData = new FormData();
  formData.append('file', fileBlob, fileName);
  formData.append('purpose', 'assistants');

  const uploadRes = await fetch('https://api.openai.com/v1/files', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${openaiKey}` },
    body: formData,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`OpenAI file upload error ${uploadRes.status}: ${err}`);
  }

  const uploadData = await uploadRes.json();
  const fileId = uploadData.id;
  console.log('OpenAI file uploaded, id:', fileId);

  // Use GPT-4o to extract the full text content
  const extractRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a document text extractor. Extract ALL text content from the provided document faithfully and completely. Output only the extracted text, preserving structure. Do not summarize, do not skip sections, do not add commentary.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please extract all text from this document completely and faithfully:',
            },
            {
              type: 'file',
              file: { file_id: fileId },
            },
          ],
        },
      ],
      max_tokens: 4096,
    }),
  });

  // Clean up file from OpenAI
  try {
    await fetch(`https://api.openai.com/v1/files/${fileId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${openaiKey}` },
    });
  } catch (_) { /* ignore cleanup errors */ }

  if (!extractRes.ok) {
    const err = await extractRes.text();
    throw new Error(`OpenAI extraction error ${extractRes.status}: ${err}`);
  }

  const extractData = await extractRes.json();
  const text = extractData.choices?.[0]?.message?.content || '';
  console.log(`OpenAI extracted ${text.length} chars from PDF`);
  return text;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

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

    // Mark as processing
    await supabase
      .from('business_documents')
      .update({ status: 'processing' })
      .eq('id', documentId);

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
    const fileName = document.file_name || 'document';
    let extractionMethod = 'unknown';

    // ── Handle different file types ──────────────────────────────────────────
    if (fileType.includes('text/plain') || fileType.includes('text/markdown') || fileType.includes('text/csv')) {
      extractedText = await fileData.text();
      extractionMethod = 'direct_text';
      console.log(`Plain text extraction: ${extractedText.length} chars`);

    } else if (fileType.includes('json')) {
      const jsonText = await fileData.text();
      try {
        const parsed = JSON.parse(jsonText);
        // Pretty-print JSON for better readability in chunks
        extractedText = `JSON Document: ${fileName}\n\n${JSON.stringify(parsed, null, 2)}`;
      } catch (_) {
        extractedText = `JSON Document: ${fileName}\n\n${jsonText}`;
      }
      extractionMethod = 'direct_json';

    } else if (
      fileType.includes('pdf') ||
      fileType.includes('word') ||
      fileType.includes('document') ||
      fileType.includes('msword') ||
      fileType.includes('officedocument')
    ) {
      // Strategy 1: Try Firecrawl with a public/signed URL (best quality for PDFs)
      if (firecrawlKey) {
        try {
          // Get a signed URL (60-minute expiry) so Firecrawl can download it
          const { data: signedData } = await supabase.storage
            .from('business-documents')
            .createSignedUrl(document.file_path, 3600);

          if (signedData?.signedUrl) {
            extractedText = await extractPdfViaFirecrawl(signedData.signedUrl, firecrawlKey);
            extractionMethod = 'firecrawl';
          }
        } catch (fcErr) {
          console.warn('Firecrawl PDF extraction failed, trying OpenAI fallback:', fcErr);
        }
      }

      // Strategy 2: Fallback to OpenAI file API if Firecrawl failed or unavailable
      if (!extractedText && openaiKey) {
        try {
          extractedText = await extractPdfViaOpenAI(fileData, fileName, openaiKey);
          extractionMethod = 'openai_files';
        } catch (oaiErr) {
          console.warn('OpenAI PDF extraction failed:', oaiErr);
        }
      }

      // Strategy 3: Last resort — try to read raw bytes as UTF-8 text
      // (works for some PDFs that embed plain text)
      if (!extractedText) {
        try {
          const rawText = await fileData.text();
          // Filter to printable ASCII/Unicode, removing binary garbage
          const cleaned = rawText
            .replace(/[^\x20-\x7E\n\r\t\u00A0-\uFFFF]/g, ' ')
            .replace(/\s{3,}/g, '\n')
            .trim();
          if (cleaned.length > 200) {
            extractedText = cleaned;
            extractionMethod = 'raw_text_fallback';
            console.log(`Raw text fallback extracted ${extractedText.length} chars`);
          }
        } catch (_) { /* ignore */ }
      }

      if (!extractedText) {
        extractedText = `[Document: ${fileName}] - Content could not be extracted automatically. Please ensure the document is a text-based PDF (not a scanned image). File type: ${fileType}`;
        extractionMethod = 'failed';
      }

    } else {
      extractedText = `[Document: ${fileName}] - File type "${fileType}" is not yet supported for automatic extraction.`;
      extractionMethod = 'unsupported';
    }

    // ── Generate AI summary ───────────────────────────────────────────────────
    let summary = '';
    if (openaiKey && extractedText.length > 100 && extractionMethod !== 'failed' && extractionMethod !== 'unsupported') {
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
                content: 'You are a document summarizer. Create a concise 2-3 sentence summary of the document that captures the key information most useful for answering customer queries.',
              },
              {
                role: 'user',
                content: `Summarize this business document:\n\n${extractedText.slice(0, 5000)}`,
              },
            ],
            max_tokens: 200,
          }),
        });

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          summary = summaryData.choices[0].message.content;
          console.log('Generated summary:', summary.slice(0, 100));
        }
      } catch (error) {
        console.error('Failed to generate summary:', error);
      }
    }

    // ── Update document record ────────────────────────────────────────────────
    const { error: updateError } = await supabase
      .from('business_documents')
      .update({
        content_text: extractedText,
        summary: summary || `Document: ${fileName}`,
        status: 'ready',
        metadata: {
          processed_at: new Date().toISOString(),
          text_length: extractedText.length,
          extraction_method: extractionMethod,
          chunk_strategy: 'sentence_aware_500_overlap_100',
        },
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Failed to update document:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update document' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Clear old knowledge chunks ────────────────────────────────────────────
    await supabase.from('knowledge_chunks').delete()
      .eq('business_id', document.business_id)
      .eq('source_type', 'document')
      .eq('source_id', document.id);

    // ── Generate embeddings with improved chunking ────────────────────────────
    let chunksStored = 0;
    if (openaiKey && extractedText && extractedText.length > 30 && extractionMethod !== 'failed' && extractionMethod !== 'unsupported') {
      console.log('Generating embeddings for document with sentence-aware chunking...');
      try {
        const chunks = chunkTextWithOverlap(extractedText, 500, 100);
        console.log(`Created ${chunks.length} chunks from ${extractedText.length} chars`);

        for (let idx = 0; idx < chunks.length; idx++) {
          const chunk = chunks[idx];

          const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              input: chunk.replace(/\n/g, ' '),
              model: 'text-embedding-3-small',
            }),
          });

          if (embedRes.ok) {
            const embedData = await embedRes.json();
            const embedding = embedData.data[0].embedding;

            await supabase.from('knowledge_chunks').insert({
              business_id: document.business_id,
              source_type: 'document',
              source_id: document.id,
              content: chunk,
              embedding,
              chunk_index: idx,
              metadata: {
                title: fileName,
                document_id: document.id,
                extraction_method: extractionMethod,
                total_chunks: chunks.length,
              },
            });
            chunksStored++;
          }
        }
        console.log(`Stored ${chunksStored} knowledge chunks for document`);
      } catch (embedError) {
        console.error('Failed to generate embeddings for document:', embedError);
      }
    }

    console.log('Document processed successfully:', documentId, {
      extractionMethod,
      textLength: extractedText.length,
      chunksStored,
    });

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        summary,
        textLength: extractedText.length,
        chunksStored,
        extractionMethod,
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
