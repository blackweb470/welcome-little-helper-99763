import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-visitor-id',
};

// ─── Sentence-aware chunking with overlap ────────────────────────────────────
// 500-char chunks, 100-char overlap, splits at sentence/paragraph boundaries
function chunkTextWithOverlap(
  text: string,
  chunkSize = 500,
  overlap = 100
): string[] {
  const chunks: string[] = [];
  const step = chunkSize - overlap;

  const sentences = text.split(/(?<=[.!?])\s+|\n\n+/);
  let buffer = '';

  for (const sentence of sentences) {
    if ((buffer + ' ' + sentence).trim().length <= chunkSize) {
      buffer = (buffer + ' ' + sentence).trim();
    } else {
      if (buffer.length > 0) {
        chunks.push(buffer);
        buffer = buffer.slice(-overlap) + ' ' + sentence.trim();
        buffer = buffer.trim();
      } else {
        // Force-split long sentences
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessId, websiteUrl, maxPages = 20 } = await req.json();

    if (!businessId || !websiteUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'businessId and websiteUrl are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured. Please connect Firecrawl in settings.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Format URL
    let formattedUrl = websiteUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log(`Starting website crawl for business ${businessId}: ${formattedUrl}`);

    // Step 1: Map the website to discover all URLs
    console.log('Step 1: Mapping website URLs...');
    const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        limit: maxPages,
        includeSubdomains: false,
      }),
    });

    const mapData = await mapResponse.json();

    if (!mapResponse.ok || !mapData.success) {
      console.error('Map failed:', mapData);
      return new Response(
        JSON.stringify({ success: false, error: mapData.error || 'Failed to map website' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const urls = mapData.links || [];
    console.log(`Found ${urls.length} URLs to scrape`);

    if (urls.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No pages found on the website' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Delete existing content for this business
    console.log('Step 2: Clearing existing website content...');
    await supabase
      .from('business_website_content')
      .delete()
      .eq('business_id', businessId);

    await supabase
      .from('knowledge_chunks')
      .delete()
      .eq('business_id', businessId)
      .eq('source_type', 'website');

    // Step 3: Scrape each URL and store content
    console.log('Step 3: Scraping pages...');
    const results = [];
    const errors = [];

    const urlsToScrape = urls.slice(0, maxPages);

    for (const url of urlsToScrape) {
      try {
        console.log(`Scraping: ${url}`);

        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            formats: ['markdown'],
            onlyMainContent: true,
          }),
        });

        const scrapeData = await scrapeResponse.json();

        if (scrapeResponse.ok && scrapeData.success) {
          const content = scrapeData.data?.markdown || scrapeData.markdown || '';
          const title = scrapeData.data?.metadata?.title || scrapeData.metadata?.title || url;
          const description = scrapeData.data?.metadata?.description || scrapeData.metadata?.description || '';

          if (content && content.trim().length > 50) {
            // Store raw page content
            const { error: insertError } = await supabase
              .from('business_website_content')
              .insert({
                business_id: businessId,
                url,
                title,
                content,
                content_type: 'page',
              });

            if (insertError) {
              console.error(`Failed to store content for ${url}:`, insertError);
              errors.push({ url, error: insertError.message });
            } else {
              // Generate embeddings with sentence-aware chunking + overlap
              if (openAiKey) {
                try {
                  const chunks = chunkTextWithOverlap(content, 500, 100);
                  console.log(`Page "${title}": ${chunks.length} chunks from ${content.length} chars`);

                  let pageChunks = 0;
                  for (let idx = 0; idx < chunks.length; idx++) {
                    const chunk = chunks[idx];

                    const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${openAiKey}`,
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
                        business_id: businessId,
                        source_type: 'website',
                        source_id: url,
                        content: chunk,
                        embedding,
                        chunk_index: idx,
                        metadata: {
                          title,
                          url,
                          description: description.slice(0, 200),
                          total_chunks: chunks.length,
                        },
                      });
                      pageChunks++;
                    }
                  }
                  console.log(`Stored ${pageChunks} chunks for: ${title}`);
                } catch (embedError) {
                  console.error(`Failed to generate embeddings for ${url}:`, embedError);
                }
              }

              results.push({ url, title, contentLength: content.length });
              console.log(`Stored content for: ${title} (${content.length} chars)`);
            }
          } else {
            console.log(`Skipping ${url} - content too short`);
          }
        } else {
          console.error(`Failed to scrape ${url}:`, scrapeData.error);
          errors.push({ url, error: scrapeData.error || 'Scrape failed' });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        errors.push({ url, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    // Step 4: Update business with website URL
    console.log('Step 4: Updating business record...');
    await supabase
      .from('businesses')
      .update({ website_url: formattedUrl })
      .eq('id', businessId);

    console.log(`Crawl complete. Stored ${results.length} pages, ${errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        pagesFound: urls.length,
        pagesStored: results.length,
        errors: errors.length,
        results,
        errorDetails: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in crawl-website:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to crawl website';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
