-- Drop the security definer view and recreate without security definer
DROP VIEW IF EXISTS public.conversation_analytics;

-- Create regular view (non-security definer)
CREATE VIEW public.conversation_analytics AS
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