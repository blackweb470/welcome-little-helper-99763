-- Create bot Q&A pairs table for programmed responses
CREATE TABLE IF NOT EXISTS public.bot_qa_pairs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bot_qa_pairs ENABLE ROW LEVEL SECURITY;

-- Business owners can manage their Q&A pairs
CREATE POLICY "Business owners can view their Q&A pairs"
  ON public.bot_qa_pairs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = bot_qa_pairs.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can insert Q&A pairs"
  ON public.bot_qa_pairs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = bot_qa_pairs.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can update their Q&A pairs"
  ON public.bot_qa_pairs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = bot_qa_pairs.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can delete their Q&A pairs"
  ON public.bot_qa_pairs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = bot_qa_pairs.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_bot_qa_pairs_updated_at
  BEFORE UPDATE ON public.bot_qa_pairs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster keyword searches
CREATE INDEX idx_bot_qa_pairs_keywords ON public.bot_qa_pairs USING GIN(keywords);
CREATE INDEX idx_bot_qa_pairs_business_enabled ON public.bot_qa_pairs(business_id, enabled);