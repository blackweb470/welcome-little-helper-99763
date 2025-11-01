-- Update subscription plans with detailed features
UPDATE public.subscription_plans 
SET features = '["1 Business", "Basic AI Chat", "Widget Customization", "Email Support"]'::jsonb
WHERE name = 'free';

UPDATE public.subscription_plans 
SET features = '["3 Businesses", "Pre-Chat Forms", "Canned Responses", "Basic Analytics", "Email Notifications", "Chat History"]'::jsonb
WHERE name = 'basic';

UPDATE public.subscription_plans 
SET features = '["10 Businesses", "Live Agent Transfer", "Advanced Analytics", "Sentiment Analysis", "Proactive Chat Rules", "Voice Chat", "Product Catalog", "Priority Support"]'::jsonb
WHERE name = 'pro';

UPDATE public.subscription_plans 
SET features = '["Unlimited Businesses", "Business Documents/Knowledge Base", "AI Learning", "Advanced Visitor Tracking", "Custom Integrations", "24/7 Priority Support", "Dedicated Account Manager", "API Access"]'::jsonb
WHERE name = 'business';

-- Function to check if user has access to a specific feature
CREATE OR REPLACE FUNCTION public.has_feature_access(p_user_id UUID, p_feature TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_name TEXT;
  v_has_access BOOLEAN := false;
BEGIN
  -- Get user's current plan (default to free)
  SELECT COALESCE(plan_name, 'free') INTO v_plan_name
  FROM user_subscriptions
  WHERE user_id = p_user_id;
  
  IF v_plan_name IS NULL THEN
    v_plan_name := 'free';
  END IF;
  
  -- Check feature access based on plan hierarchy
  CASE p_feature
    -- Free tier features
    WHEN 'basic_chat' THEN v_has_access := true;
    WHEN 'widget_customization' THEN v_has_access := true;
    
    -- Basic tier features
    WHEN 'pre_chat_forms' THEN v_has_access := v_plan_name IN ('basic', 'pro', 'business');
    WHEN 'canned_responses' THEN v_has_access := v_plan_name IN ('basic', 'pro', 'business');
    WHEN 'basic_analytics' THEN v_has_access := v_plan_name IN ('basic', 'pro', 'business');
    WHEN 'email_notifications' THEN v_has_access := v_plan_name IN ('basic', 'pro', 'business');
    
    -- Pro tier features
    WHEN 'live_agent' THEN v_has_access := v_plan_name IN ('pro', 'business');
    WHEN 'advanced_analytics' THEN v_has_access := v_plan_name IN ('pro', 'business');
    WHEN 'sentiment_analysis' THEN v_has_access := v_plan_name IN ('pro', 'business');
    WHEN 'proactive_chat' THEN v_has_access := v_plan_name IN ('pro', 'business');
    WHEN 'voice_chat' THEN v_has_access := v_plan_name IN ('pro', 'business');
    WHEN 'product_catalog' THEN v_has_access := v_plan_name IN ('pro', 'business');
    
    -- Business tier features
    WHEN 'business_documents' THEN v_has_access := v_plan_name = 'business';
    WHEN 'ai_learning' THEN v_has_access := v_plan_name = 'business';
    WHEN 'visitor_tracking' THEN v_has_access := v_plan_name = 'business';
    WHEN 'custom_integrations' THEN v_has_access := v_plan_name = 'business';
    WHEN 'api_access' THEN v_has_access := v_plan_name = 'business';
    
    ELSE v_has_access := false;
  END CASE;
  
  RETURN v_has_access;
END;
$$;