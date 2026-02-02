-- Create table for storing crawled website content
CREATE TABLE public.business_website_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'page',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups by business
CREATE INDEX idx_business_website_content_business_id ON public.business_website_content(business_id);

-- Enable RLS
ALTER TABLE public.business_website_content ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view website content for their businesses"
  ON public.business_website_content
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
      UNION
      SELECT business_id FROM public.team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can insert website content for their businesses"
  ON public.business_website_content
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
      UNION
      SELECT business_id FROM public.team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can delete website content for their businesses"
  ON public.business_website_content
  FOR DELETE
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
      UNION
      SELECT business_id FROM public.team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Add website_url column to businesses table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'businesses' 
    AND column_name = 'website_url'
  ) THEN
    ALTER TABLE public.businesses ADD COLUMN website_url TEXT;
  END IF;
END $$;

-- Create trigger for updated_at
CREATE TRIGGER update_business_website_content_updated_at
  BEFORE UPDATE ON public.business_website_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Allow service role to bypass RLS for edge function operations
CREATE POLICY "Service role can manage all website content"
  ON public.business_website_content
  FOR ALL
  USING (true)
  WITH CHECK (true);