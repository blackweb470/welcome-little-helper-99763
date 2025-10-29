-- Create products table for the product catalog
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  category TEXT,
  image_url TEXT,
  stock_status TEXT DEFAULT 'in_stock',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS policies for products
CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Business owners can manage their products"
  ON public.products FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = products.business_id
    AND businesses.owner_id = auth.uid()
  ));

-- Add behavioral scoring columns to visitor_sessions
ALTER TABLE public.visitor_sessions
ADD COLUMN IF NOT EXISTS engagement_score DECIMAL(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS conversion_likelihood TEXT DEFAULT 'low';

-- Add availability and SLA fields to businesses
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS online_status BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_offline_minutes INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS average_response_time_seconds INTEGER,
ADD COLUMN IF NOT EXISTS target_sla_seconds INTEGER DEFAULT 300;

-- Create function to update engagement scores
CREATE OR REPLACE FUNCTION public.update_engagement_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.engagement_score := calculate_engagement_score(
    NEW.page_views,
    NEW.total_time_seconds,
    NEW.conversation_id IS NOT NULL
  );
  
  -- Calculate conversion likelihood based on engagement score
  NEW.conversion_likelihood := CASE
    WHEN NEW.engagement_score >= 70 THEN 'high'
    WHEN NEW.engagement_score >= 40 THEN 'medium'
    ELSE 'low'
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for engagement score updates
CREATE TRIGGER update_visitor_engagement_score
  BEFORE UPDATE ON public.visitor_sessions
  FOR EACH ROW
  WHEN (OLD.page_views IS DISTINCT FROM NEW.page_views 
    OR OLD.total_time_seconds IS DISTINCT FROM NEW.total_time_seconds
    OR OLD.conversation_id IS DISTINCT FROM NEW.conversation_id)
  EXECUTE FUNCTION public.update_engagement_score();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_engagement ON public.visitor_sessions(engagement_score DESC, conversion_likelihood);
CREATE INDEX IF NOT EXISTS idx_products_business_id ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);