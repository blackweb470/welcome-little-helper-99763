-- Migration: Create AI Response Cache table and invalidation triggers

CREATE TABLE IF NOT EXISTS public.ai_response_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  query_hash TEXT NOT NULL,
  response_text TEXT NOT NULL,
  sources JSONB DEFAULT '[]'::jsonb,
  hit_count INT NOT NULL DEFAULT 1,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_business_query UNIQUE (business_id, query_hash)
);

CREATE INDEX IF NOT EXISTS idx_ai_response_cache_lookup 
  ON public.ai_response_cache (business_id, query_hash, expires_at);

ALTER TABLE public.ai_response_cache ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_response_cache' AND policyname = 'Service role full access on ai_response_cache'
  ) THEN
    CREATE POLICY "Service role full access on ai_response_cache"
      ON public.ai_response_cache FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Function to invalidate business cache when knowledge updates
CREATE OR REPLACE FUNCTION public.invalidate_business_ai_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.ai_response_cache WHERE business_id = OLD.business_id;
  ELSE
    DELETE FROM public.ai_response_cache WHERE business_id = NEW.business_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Triggers for auto invalidation
DROP TRIGGER IF EXISTS trigger_invalidate_cache_on_knowledge_chunks ON public.knowledge_chunks;
CREATE TRIGGER trigger_invalidate_cache_on_knowledge_chunks
  AFTER INSERT OR UPDATE OR DELETE ON public.knowledge_chunks
  FOR EACH ROW
  EXECUTE FUNCTION public.invalidate_business_ai_cache();

DROP TRIGGER IF EXISTS trigger_invalidate_cache_on_faqs ON public.bot_qa_pairs;
CREATE TRIGGER trigger_invalidate_cache_on_faqs
  AFTER INSERT OR UPDATE OR DELETE ON public.bot_qa_pairs
  FOR EACH ROW
  EXECUTE FUNCTION public.invalidate_business_ai_cache();

DROP TRIGGER IF EXISTS trigger_invalidate_cache_on_learnings ON public.business_learnings;
CREATE TRIGGER trigger_invalidate_cache_on_learnings
  AFTER INSERT OR UPDATE OR DELETE ON public.business_learnings
  FOR EACH ROW
  EXECUTE FUNCTION public.invalidate_business_ai_cache();
