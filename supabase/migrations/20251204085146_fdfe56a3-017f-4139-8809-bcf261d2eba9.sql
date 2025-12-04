-- Create business_guides table for storing guide content
CREATE TABLE public.business_guides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  icon TEXT DEFAULT '📋',
  display_order INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_guides ENABLE ROW LEVEL SECURITY;

-- Business owners can manage their guides
CREATE POLICY "Business owners can manage their guides"
ON public.business_guides
FOR ALL
USING (EXISTS (
  SELECT 1 FROM businesses
  WHERE businesses.id = business_guides.business_id
  AND businesses.owner_id = auth.uid()
));

-- Public can view enabled guides
CREATE POLICY "Public can view enabled guides"
ON public.business_guides
FOR SELECT
USING (enabled = true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_business_guides_updated_at
BEFORE UPDATE ON public.business_guides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();