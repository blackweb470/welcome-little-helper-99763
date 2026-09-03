-- Migration: Create Rate Limiting Schema using Token Bucket Algorithm
-- Enables high performance, atomic rate limiting inside Postgres for Edge Functions

CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  key TEXT PRIMARY KEY,
  tokens DOUBLE PRECISION NOT NULL,
  last_refill TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for automatic cleanup of stale rate limit entries
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_last_refill ON public.rate_limit_buckets(last_refill);

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

-- Service role full access policy
CREATE POLICY "Service role can manage rate limit buckets"
  ON public.rate_limit_buckets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- PL/pgSQL Token Bucket Function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_max_tokens INT,
  p_refill_rate_per_sec DOUBLE PRECISION,
  p_cost INT DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_tokens DOUBLE PRECISION;
  v_last_refill TIMESTAMPTZ;
  v_elapsed_sec DOUBLE PRECISION;
  v_new_tokens DOUBLE PRECISION;
  v_allowed BOOLEAN;
  v_retry_after_sec INT := 0;
BEGIN
  -- Select existing bucket with lock
  SELECT tokens, last_refill INTO v_tokens, v_last_refill
  FROM public.rate_limit_buckets
  WHERE key = p_key
  FOR UPDATE;

  IF NOT FOUND THEN
    -- First request for this key
    v_tokens := p_max_tokens;
    v_last_refill := v_now;
    
    INSERT INTO public.rate_limit_buckets (key, tokens, last_refill)
    VALUES (p_key, v_tokens, v_last_refill);
  ELSE
    -- Calculate elapsed seconds and refill tokens
    v_elapsed_sec := GREATEST(0, EXTRACT(EPOCH FROM (v_now - v_last_refill)));
    v_new_tokens := LEAST(p_max_tokens::DOUBLE PRECISION, v_tokens + (v_elapsed_sec * p_refill_rate_per_sec));
    v_tokens := v_new_tokens;
    v_last_refill := v_now;
  END IF;

  -- Check if cost can be covered
  IF v_tokens >= p_cost THEN
    v_tokens := v_tokens - p_cost;
    v_allowed := TRUE;
    v_retry_after_sec := 0;
  ELSE
    v_allowed := FALSE;
    IF p_refill_rate_per_sec > 0 THEN
      v_retry_after_sec := CEIL((p_cost - v_tokens) / p_refill_rate_per_sec)::INT;
    ELSE
      v_retry_after_sec := 60;
    END IF;
  END IF;

  -- Update bucket state
  UPDATE public.rate_limit_buckets
  SET tokens = v_tokens, last_refill = v_last_refill
  WHERE key = p_key;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'remaining', FLOOR(v_tokens)::INT,
    'retry_after', v_retry_after_sec
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INT, DOUBLE PRECISION, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INT, DOUBLE PRECISION, INT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INT, DOUBLE PRECISION, INT) TO authenticated;
