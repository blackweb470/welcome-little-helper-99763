-- Fix search path for calculate_engagement_score function
CREATE OR REPLACE FUNCTION calculate_engagement_score(
  p_page_views integer,
  p_total_time_seconds integer,
  p_has_conversation boolean
)
RETURNS numeric 
LANGUAGE plpgsql 
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  score numeric := 0;
BEGIN
  -- Base score from page views (0-30 points)
  score := score + LEAST(p_page_views * 5, 30);
  
  -- Time spent score (0-40 points)
  score := score + LEAST(p_total_time_seconds / 10, 40);
  
  -- Conversation bonus (30 points)
  IF p_has_conversation THEN
    score := score + 30;
  END IF;
  
  -- Normalize to 0-100
  RETURN LEAST(score, 100);
END;
$$;