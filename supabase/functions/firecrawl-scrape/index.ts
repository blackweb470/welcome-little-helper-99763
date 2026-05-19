const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-visitor-id',
};

// ─── HTML Table Extraction ───────────────────────────────────────────────────
// Parses raw HTML to find <table> elements and converts each into structured
// plain-text so downstream consumers (AI training, knowledge base) can use it.
function extractTablesFromHtml(html: string): { tables: string[]; tableCount: number } {
  const tables: string[] = [];

  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch: RegExpExecArray | null;

  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tableHtml = tableMatch[0];
    const rows: string[][] = [];
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch: RegExpExecArray | null;

    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
      const rowHtml = rowMatch[1];
      const cells: string[] = [];
      const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
      let cellMatch: RegExpExecArray | null;

      while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
        let cellText = cellMatch[1]
          .replace(/<[^>]*>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        cells.push(cellText);
      }

      if (cells.some(c => c.length > 0)) rows.push(cells);
    }

    if (rows.length === 0) continue;

    const headers = rows[0];
    const dataRows = rows.slice(1);

    let tableText = '\n=== TABLE DATA ===\n';

    const captionMatch = tableHtml.match(/<caption[\s>]([\s\S]*?)<\/caption>/i);
    if (captionMatch) {
      const caption = captionMatch[1].replace(/<[^>]*>/g, '').trim();
      if (caption) tableText += `Table: ${caption}\n`;
    }

    if (dataRows.length > 0 && headers.length > 0) {
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
      for (const row of rows) {
        tableText += row.join(' | ') + '\n';
      }
    }

    tableText += '=== END TABLE ===\n';
    tables.push(tableText);
  }

  return { tables, tableCount: tables.length };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, options } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping URL:', formattedUrl);

    // Always request html alongside markdown so we can extract tables
    const requestedFormats = options?.formats || ['markdown'];
    const formats = requestedFormats.includes('html')
      ? requestedFormats
      : [...requestedFormats, 'html'];

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats,
        onlyMainContent: options?.onlyMainContent ?? true,
        waitFor: options?.waitFor,
        location: options?.location,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract tables from the HTML content
    const htmlContent = data?.data?.html || data?.html || '';
    const { tables, tableCount } = htmlContent
      ? extractTablesFromHtml(htmlContent)
      : { tables: [], tableCount: 0 };

    if (tableCount > 0) {
      console.log(`Extracted ${tableCount} table(s) from ${formattedUrl}`);

      // Append structured table data to the markdown output
      const existingMarkdown = data?.data?.markdown || data?.markdown || '';
      const enrichedMarkdown = existingMarkdown +
        '\n\n--- STRUCTURED TABLE DATA EXTRACTED FROM PAGE ---\n' +
        tables.join('\n');

      // Enrich the response with table data
      if (data?.data) {
        data.data.markdown = enrichedMarkdown;
        data.data.extractedTables = tables;
        data.data.tableCount = tableCount;
      } else {
        data.markdown = enrichedMarkdown;
        data.extractedTables = tables;
        data.tableCount = tableCount;
      }
    }

    console.log(`Scrape successful (${tableCount} tables found)`);
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, stack: error instanceof Error ? error.stack : undefined }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
