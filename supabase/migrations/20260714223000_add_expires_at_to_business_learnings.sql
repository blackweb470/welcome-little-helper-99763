-- Add optional expiration date for temporary rules and brain dumps
ALTER TABLE public.business_learnings
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_business_learnings_expires_at ON public.business_learnings(expires_at);
