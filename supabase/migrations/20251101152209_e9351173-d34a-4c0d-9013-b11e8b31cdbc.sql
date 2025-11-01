-- Fix Security Definer View issue
-- The conversation_analytics view was created with SECURITY DEFINER which is flagged

-- Drop existing view if it exists
DROP VIEW IF EXISTS conversation_analytics CASCADE;

-- Recreate without SECURITY DEFINER (use SECURITY INVOKER instead)
CREATE OR REPLACE VIEW conversation_analytics 
WITH (security_invoker=true) AS
SELECT 
  c.id as conversation_id,
  c.business_id,
  c.started_at,
  c.ended_at,
  COUNT(m.id) as message_count,
  EXTRACT(EPOCH FROM (COALESCE(c.ended_at, NOW()) - c.started_at)) as duration_seconds,
  vs.page_views,
  vs.total_time_seconds,
  vs.device_type,
  vs.browser,
  (
    SELECT sentiment 
    FROM messages 
    WHERE conversation_id = c.id 
    AND sentiment IS NOT NULL 
    GROUP BY sentiment 
    ORDER BY COUNT(*) DESC 
    LIMIT 1
  ) as primary_sentiment,
  AVG(m.sentiment_score) as avg_sentiment_score
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
LEFT JOIN visitor_sessions vs ON vs.conversation_id = c.id
GROUP BY c.id, c.business_id, c.started_at, c.ended_at, vs.page_views, vs.total_time_seconds, vs.device_type, vs.browser;

-- Grant appropriate access
GRANT SELECT ON conversation_analytics TO authenticated;

-- Drop the public_widget_settings view I just created and recreate properly
DROP VIEW IF EXISTS public_widget_settings CASCADE;

-- Note: For widget embedding, we'll handle this in the code by selecting specific columns
-- instead of using a view, which is cleaner and avoids security definer issues