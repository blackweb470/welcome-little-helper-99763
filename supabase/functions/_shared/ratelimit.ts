// Shared Edge Rate Limiter module using Supabase PL/pgSQL token bucket

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
}

export async function enforceRateLimit(
  supabase: any,
  key: string,
  maxTokens: number,
  refillRatePerSec: number,
  cost: number = 1
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_key: key,
      p_max_tokens: maxTokens,
      p_refill_rate_per_sec: refillRatePerSec,
      p_cost: cost,
    });

    if (error) {
      console.error('Rate limit RPC error:', error);
      // Fallback: allow request on database error to avoid blocking legitimate users
      return { allowed: true, remaining: maxTokens - 1, retryAfter: 0 };
    }

    return {
      allowed: Boolean(data?.allowed),
      remaining: typeof data?.remaining === 'number' ? data.remaining : 0,
      retryAfter: typeof data?.retry_after === 'number' ? data.retry_after : 0,
    };
  } catch (err) {
    console.error('Unexpected rate limiting error:', err);
    return { allowed: true, remaining: maxTokens - 1, retryAfter: 0 };
  }
}
