-- Fix the update_engagement_score function to set search_path properly
CREATE OR REPLACE FUNCTION public.update_engagement_score()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;