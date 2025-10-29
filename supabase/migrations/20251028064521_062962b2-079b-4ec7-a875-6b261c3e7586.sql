-- Create conversation context table for memory continuity
CREATE TABLE IF NOT EXISTS public.conversation_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  context_data JSONB DEFAULT '{}'::jsonb,
  summary TEXT,
  key_facts TEXT[],
  user_preferences JSONB DEFAULT '{}'::jsonb,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_conversation_context_visitor ON public.conversation_context(visitor_id, business_id);

-- Enable RLS
ALTER TABLE public.conversation_context ENABLE ROW LEVEL SECURITY;

-- Business owners can view their context
CREATE POLICY "Business owners can view context"
  ON public.conversation_context
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = conversation_context.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

-- Anyone can insert/update context (for widget)
CREATE POLICY "Anyone can insert context"
  ON public.conversation_context
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update context"
  ON public.conversation_context
  FOR UPDATE
  USING (true);

-- Create analytics helper view
CREATE OR REPLACE VIEW public.conversation_analytics AS
SELECT 
  c.business_id,
  c.id as conversation_id,
  c.started_at,
  c.ended_at,
  vs.page_views,
  vs.total_time_seconds,
  vs.device_type,
  vs.browser,
  COALESCE(
    (SELECT AVG(sentiment_score) 
     FROM public.messages 
     WHERE conversation_id = c.id 
     AND role = 'user' 
     AND sentiment_score IS NOT NULL), 
    0
  ) as avg_sentiment_score,
  COALESCE(
    (SELECT mode() WITHIN GROUP (ORDER BY sentiment) 
     FROM public.messages 
     WHERE conversation_id = c.id 
     AND role = 'user' 
     AND sentiment IS NOT NULL),
    'neutral'
  ) as primary_sentiment,
  (SELECT COUNT(*) 
   FROM public.messages 
   WHERE conversation_id = c.id
  ) as message_count,
  EXTRACT(EPOCH FROM (c.ended_at - c.started_at)) as duration_seconds
FROM public.conversations c
LEFT JOIN public.visitor_sessions vs ON vs.conversation_id = c.id;

-- Grant access to view
GRANT SELECT ON public.conversation_analytics TO authenticated, anon;