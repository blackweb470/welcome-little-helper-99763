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

// ─── HTML Table Extraction ───────────────────────────────────────────────────
// Parses raw HTML to find <table> elements and converts each into structured
// plain-text so the AI can learn from tabular data (pricing, specs, etc.).
function extractTablesFromHtml(html: string): string[] {
  const tables: string[] = [];

  // Match all <table>...</table> blocks (case-insensitive, allows nested tags)
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch: RegExpExecArray | null;

  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tableHtml = tableMatch[0];

    // Extract all rows
    const rows: string[][] = [];
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch: RegExpExecArray | null;

    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
      const rowHtml = rowMatch[1];
      const cells: string[] = [];

      // Match both <th> and <td> cells
      const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
      let cellMatch: RegExpExecArray | null;

      while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
        // Strip inner HTML tags and decode basic entities
        let cellText = cellMatch[1]
          .replace(/<[^>]*>/g, '')       // strip HTML tags
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')          // normalize whitespace
          .trim();
        
        cells.push(cellText);
      }

      if (cells.some(c => c.length > 0)) {
        rows.push(cells);
      }
    }

    if (rows.length === 0) continue;

    // Build structured text from the table
    const headers = rows[0];
    const dataRows = rows.slice(1);

    let tableText = '\n=== TABLE DATA ===\n';

    // Try to find a caption
    const captionMatch = tableHtml.match(/<caption[\s>]([\s\S]*?)<\/caption>/i);
    if (captionMatch) {
      const caption = captionMatch[1].replace(/<[^>]*>/g, '').trim();
      if (caption) tableText += `Table: ${caption}\n`;
    }

    if (dataRows.length > 0 && headers.length > 0) {
      // Format as header: value pairs for each data row — more semantic for AI
      tableText += `Columns: ${headers.map((h, i) => h.trim() || `Column ${i + 1}`).join(' | ')}\n`;

      for (const row of dataRows) {
        const pairs: string[] = [];
        for (let i = 0; i < headers.length; i++) {
          const headerName = headers[i]?.trim() || `Column ${i + 1}`;
          const val = row[i]?.trim() || '';
          if (val) {
            pairs.push(`${headerName}: ${val}`);
          }
        }
        if (pairs.length > 0) {
          tableText += `- ${pairs.join(', ')}\n`;
        }
      }
    } else {
      // No clear header row — output as plain rows
      for (const row of rows) {
        tableText += row.join(' | ') + '\n';
      }
    }

    tableText += '=== END TABLE ===\n';
    tables.push(tableText);
  }

  return tables;
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

    // Extract target domain for filtering subdomains
    let targetDomain = '';
    try {
      const targetUrlObj = new URL(formattedUrl);
      const targetHostname = targetUrlObj.hostname.toLowerCase();
      targetDomain = targetHostname.startsWith('www.') ? targetHostname.slice(4) : targetHostname;
    } catch (e) {
      console.error('Failed to parse target domain from:', formattedUrl, e);
    }

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
        limit: Math.max(500, maxPages * 10), // Scan up to 500 or more pages for discovery
        includeSubdomains: true,
        ignoreSitemap: true,
        ignoreCache: true,
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

    const rawUrls: string[] = mapData.links || [];
    console.log(`Discovered ${rawUrls.length} total URLs from site map`);

    // Map data is the absolute source of truth for URLs that exist on the website.
    // If we need the base url specifically, we can just ensure it's in the rawUrls array.
    if (!rawUrls.includes(formattedUrl)) {
      rawUrls.push(formattedUrl);
    }
    
    // Remove duplicates and filter
    const uniqueRawUrls = Array.from(new Set(rawUrls));

    // Filter out junk/archive URLs and sort to prioritize important pages (fees, admission, colleges)
    const junkPatterns = [
      /\/category\//i,
      /\/personnel_category\//i,
      /\/author\//i,
      /\/tag\//i,
      /\/page\//i,
      /\/feed\//i,
      /\/comments\//i,
      /\/wp-json\//i,
      /\/wp-content\//i,
      /\?feed=/i,
    ];

    const highPriorityKeywords = ['fee', 'tuition', 'cost', 'price', 'charge', 'payment', 'bill', 'admission', 'structure', 'bursar', 'bursary', 'principal', 'officer', 'officers', 'management'];
    const mediumPriorityKeywords = ['academic', 'course', 'program', 'school', 'college', 'medicine', 'health', 'nursing', 'law', 'engineering', 'pharmacy', 'basic', 'registrar', 'chancellor', 'staff', 'personnel', 'about'];

    const filteredAndSortedUrls = uniqueRawUrls
      .filter((url: string) => {
        // Skip junk pages
        if (junkPatterns.some(pattern => pattern.test(url))) {
          return false;
        }

        // Ensure the URL belongs to the target domain or its subdomains
        if (targetDomain) {
          try {
            const u = new URL(url);
            const h = u.hostname.toLowerCase();
            const d = h.startsWith('www.') ? h.slice(4) : h;
            if (d !== targetDomain && !h.endsWith('.' + targetDomain)) {
              return false;
            }
          } catch {
            return false;
          }
        }
        return true;
      })
      .map((url: string) => {
        let score = 0;
        const lowercaseUrl = url.toLowerCase();

        // Assign score based on keywords in URL
        for (const kw of highPriorityKeywords) {
          if (lowercaseUrl.includes(kw)) score += 100;
        }
        for (const kw of mediumPriorityKeywords) {
          if (lowercaseUrl.includes(kw)) score += 50;
        }

        // Shorter paths get slightly higher priority
        const pathLength = url.replace('://', '').split('/').length;
        score -= pathLength * 2;

        return { url, score };
      })
      .sort((a, b) => b.score - a.score)
      .map(item => item.url);

    const urls = filteredAndSortedUrls.slice(0, maxPages);
    console.log(`Selected top ${urls.length} prioritized URLs to scrape:`, urls);

    if (urls.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No relevant pages found on the website' }),
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

    // Step 3: Scrape each URL and store content (now with table extraction)
    console.log('Step 3: Scraping pages in parallel (with table extraction)...');
    const results: Array<{ url: string; title: string; contentLength: number; tablesFound: number }> = [];
    const errors: Array<{ url: string; error: string }> = [];
    let totalTablesExtracted = 0;

    const urlsToScrape = urls.slice(0, maxPages);
    const batchSize = 6;

    for (let i = 0; i < urlsToScrape.length; i += batchSize) {
      const batch = urlsToScrape.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (url) => {
        try {
          console.log(`Scraping: ${url}`);

          // Request both markdown AND html so we can extract tables from raw HTML
          const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url,
              formats: ['markdown', 'html'],
              onlyMainContent: true,
            }),
          });

          const scrapeData = await scrapeResponse.json();

          if (scrapeResponse.ok && scrapeData.success) {
            const markdownContent = scrapeData.data?.markdown || scrapeData.markdown || '';
            const htmlContent = scrapeData.data?.html || scrapeData.html || '';
            const title = scrapeData.data?.metadata?.title || scrapeData.metadata?.title || url;
            const description = scrapeData.data?.metadata?.description || scrapeData.metadata?.description || '';

            // Extract tables from the raw HTML
            const extractedTables = htmlContent ? extractTablesFromHtml(htmlContent) : [];
            const tablesFound = extractedTables.length;
            totalTablesExtracted += tablesFound;

            if (tablesFound > 0) {
              console.log(`  Found ${tablesFound} table(s) on: ${url}`);
            }

            // Combine markdown content with extracted table data
            let enrichedContent = markdownContent;
            if (extractedTables.length > 0) {
              enrichedContent += '\n\n--- STRUCTURED TABLE DATA EXTRACTED FROM PAGE ---\n';
              enrichedContent += extractedTables.join('\n');
            }

            if (enrichedContent && enrichedContent.trim().length > 50) {
              // Store raw page content (enriched with table data)
              const { error: insertError } = await supabase
                .from('business_website_content')
                .insert({
                  business_id: businessId,
                  url,
                  title,
                  content: enrichedContent,
                  content_type: tablesFound > 0 ? 'page_with_tables' : 'page',
                });

              if (insertError) {
                console.error(`Failed to store content for ${url}:`, insertError);
                errors.push({ url, error: insertError.message });
              } else {
                // Generate embeddings with sentence-aware chunking + overlap
                if (openAiKey) {
                  try {
                    // Chunk only the markdown content to prevent tables from being broken up
                    const chunks = chunkTextWithOverlap(markdownContent, 500, 100);
                    
                    // Add each extracted table as a standalone chunk to guarantee structural integrity
                    for (const table of extractedTables) {
                      chunks.push(`Table from page "${title}":\n${table}`);
                    }
                    
                    if (chunks.length > 0) {
                      console.log(`Page "${title}": Requesting ${chunks.length} embeddings concurrently...`);

                      const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${openAiKey}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          input: chunks.map(chunk => chunk.replace(/\n/g, ' ')),
                          model: 'text-embedding-3-small',
                        }),
                      });

                      if (embedRes.ok) {
                        const embedData = await embedRes.json();
                        
                        // Map each chunk to its insert record
                        const insertRows = chunks.map((chunk, idx) => {
                          const embedding = embedData.data?.[idx]?.embedding;
                          return {
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
                              has_table_data: tablesFound > 0,
                              tables_found: tablesFound,
                            },
                          };
                        }).filter(row => row.embedding);

                        if (insertRows.length > 0) {
                          const { error: batchInsertError } = await supabase
                            .from('knowledge_chunks')
                            .insert(insertRows);

                          if (batchInsertError) {
                            console.error(`Failed to bulk insert knowledge chunks for ${url}:`, batchInsertError);
                            errors.push({ url, error: `Embedding DB Insert Failed: ${batchInsertError.message}` });
                          } else {
                            console.log(`Stored ${insertRows.length} chunks for: ${title}`);
                          }
                        }
                      } else {
                        const embedErrText = await embedRes.text();
                        console.error(`Embeddings API error for ${url}:`, embedErrText);
                        errors.push({ url, error: `Embeddings API Error: ${embedErrText}` });
                      }
                    }
                  } catch (embedError) {
                    console.error(`Failed to generate embeddings for ${url}:`, embedError);
                    errors.push({ url, error: `Embedding generation crashed: ${embedError instanceof Error ? embedError.message : 'Unknown'}` });
                  }
                }

                results.push({
                  url,
                  title,
                  contentLength: enrichedContent.length,
                  tablesFound,
                });
                console.log(`Stored content for: ${title} (${enrichedContent.length} chars, ${tablesFound} tables)`);
              }
            } else {
              console.log(`Skipping ${url} - content too short`);
            }
          } else {
            console.error(`Failed to scrape ${url}:`, scrapeData.error);
            errors.push({ url, error: scrapeData.error || 'Scrape failed' });
          }
        } catch (error) {
          console.error(`Error scraping ${url}:`, error);
          errors.push({ url, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }));

      // Small delay between batches to avoid aggressive rate limiting
      if (i + batchSize < urlsToScrape.length) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }

    // Step 4: Update business with website URL
    console.log('Step 4: Updating business record...');
    await supabase
      .from('businesses')
      .update({ website_url: formattedUrl })
      .eq('id', businessId);

    console.log(`Crawl complete. Stored ${results.length} pages, ${totalTablesExtracted} tables extracted, ${errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        pagesFound: urls.length,
        pagesStored: results.length,
        tablesExtracted: totalTablesExtracted,
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
      JSON.stringify({ success: false, error: errorMessage, stack: error instanceof Error ? error.stack : undefined }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
