-- Create business_learnings table to store AI insights per business
CREATE TABLE IF NOT EXISTS public.business_learnings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  learning_type text NOT NULL DEFAULT 'conversation_insight', -- conversation_insight, customer_preference, product_info, faq, etc
  content text NOT NULL,
  source_conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  confidence_score numeric DEFAULT 0.8,
  usage_count integer DEFAULT 0,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Add index for faster business lookups
CREATE INDEX IF NOT EXISTS idx_business_learnings_business_id ON public.business_learnings(business_id);
CREATE INDEX IF NOT EXISTS idx_business_learnings_type ON public.business_learnings(learning_type);

-- Enable RLS
ALTER TABLE public.business_learnings ENABLE ROW LEVEL SECURITY;

-- Business owners can view their learnings
CREATE POLICY "Business owners can view their learnings"
ON public.business_learnings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = business_learnings.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- Business owners can manage their learnings
CREATE POLICY "Business owners can manage their learnings"
ON public.business_learnings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = business_learnings.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- Anyone can insert learnings (for AI to learn from conversations)
CREATE POLICY "Anyone can insert learnings"
ON public.business_learnings
FOR INSERT
WITH CHECK (true);

-- Trigger to update updated_at
CREATE TRIGGER update_business_learnings_updated_at
BEFORE UPDATE ON public.business_learnings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();