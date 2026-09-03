// Shared Caching module for Supabase Edge Functions

// In-Memory Edge Cache for Widget Settings and Metadata (TTL: 5 mins)
interface MemoryCacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, MemoryCacheEntry<any>>();

export function getMemoryCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setMemoryCache<T>(key: string, data: T, ttlMs: number = 300000): void {
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

// SHA-256 normalized hash generator for visitor query string
export async function generateQueryHash(query: string): Promise<string> {
  const normalized = query
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ');

  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface CachedResponse {
  responseText: string;
  sources: any[];
}

export async function getCachedAiResponse(
  supabase: any,
  businessId: string,
  queryText: string
): Promise<CachedResponse | null> {
  try {
    if (!queryText || queryText.length < 3) return null;
    const queryHash = await generateQueryHash(queryText);

    const { data, error } = await supabase
      .from('ai_response_cache')
      .select('id, response_text, sources, hit_count, expires_at')
      .eq('business_id', businessId)
      .eq('query_hash', queryHash)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error || !data) return null;

    // Async update hit count in background
    supabase
      .from('ai_response_cache')
      .update({ hit_count: (data.hit_count || 1) + 1 })
      .eq('id', data.id)
      .then();

    return {
      responseText: data.response_text,
      sources: data.sources || [],
    };
  } catch (err) {
    console.error('Error fetching cached AI response:', err);
    return null;
  }
}

export async function setCachedAiResponse(
  supabase: any,
  businessId: string,
  queryText: string,
  responseText: string,
  sources: any[] = [],
  ttlHours: number = 12
): Promise<void> {
  try {
    if (!queryText || !responseText) return;
    const queryHash = await generateQueryHash(queryText);
    const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();

    await supabase.from('ai_response_cache').upsert(
      {
        business_id: businessId,
        query_hash: queryHash,
        response_text: responseText,
        sources: sources,
        expires_at: expiresAt,
      },
      { onConflict: 'business_id,query_hash' }
    );
  } catch (err) {
    console.error('Error storing cached AI response:', err);
  }
}
