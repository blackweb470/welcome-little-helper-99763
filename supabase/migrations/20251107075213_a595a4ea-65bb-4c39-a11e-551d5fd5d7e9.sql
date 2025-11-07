-- Update has_feature_access to give admins full access
CREATE OR REPLACE FUNCTION public.has_feature_access(p_user_id uuid, p_feature text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_plan_name TEXT;
  v_has_access BOOLEAN := false;
  v_subscription RECORD;
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user has admin role - admins get access to everything
  v_is_admin := public.has_role(p_user_id, 'admin'::app_role);
  
  IF v_is_admin THEN
    RETURN true;  -- Admins have access to all features
  END IF;
  
  -- Get user's current subscription with status
  SELECT 
    plan_name,
    trial_ends_at,
    expires_at,
    cancel_at_period_end
  INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no subscription or expired, set to free
  IF v_subscription IS NULL THEN
    v_plan_name := 'free';
  ELSIF v_subscription.expires_at IS NOT NULL AND v_subscription.expires_at < NOW() THEN
    v_plan_name := 'free';
  ELSIF v_subscription.cancel_at_period_end AND v_subscription.expires_at < NOW() THEN
    v_plan_name := 'free';
  ELSE
    v_plan_name := v_subscription.plan_name;
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

-- Update get_user_plan_info to show enterprise for admins
CREATE OR REPLACE FUNCTION public.get_user_plan_info(p_user_id uuid)
RETURNS TABLE(plan_name text, business_limit integer, current_businesses integer, can_create_more boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_plan_name TEXT;
  v_subscription RECORD;
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is admin
  v_is_admin := public.has_role(p_user_id, 'admin'::app_role);
  
  IF v_is_admin THEN
    -- Return unlimited access for admins
    RETURN QUERY SELECT 
      'enterprise'::text as plan_name,
      999999 as business_limit,
      (SELECT COUNT(*)::integer FROM businesses WHERE owner_id = p_user_id) as current_businesses,
      true as can_create_more;
    RETURN;
  END IF;
  
  -- Get user's current subscription with expiration check
  SELECT 
    us.plan_name,
    us.expires_at,
    us.cancel_at_period_end
  INTO v_subscription
  FROM user_subscriptions us
  WHERE us.user_id = p_user_id
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  -- Check if subscription is expired or cancelled
  IF v_subscription IS NULL THEN
    v_plan_name := 'free';
  ELSIF v_subscription.expires_at IS NOT NULL AND v_subscription.expires_at < NOW() THEN
    v_plan_name := 'free';
  ELSIF v_subscription.cancel_at_period_end AND v_subscription.expires_at < NOW() THEN
    v_plan_name := 'free';
  ELSE
    v_plan_name := v_subscription.plan_name;
  END IF;
  
  RETURN QUERY
  SELECT 
    sp.name,
    sp.business_limit,
    (SELECT COUNT(*)::INTEGER FROM businesses WHERE owner_id = p_user_id),
    can_create_business(p_user_id)
  FROM subscription_plans sp
  WHERE sp.name = v_plan_name;
END;
$$;

-- Update can_create_business to allow unlimited for admins
CREATE OR REPLACE FUNCTION public.can_create_business(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_plan_name TEXT;
  v_business_limit INTEGER;
  v_current_count INTEGER;
  v_subscription RECORD;
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is admin - admins have unlimited businesses
  v_is_admin := public.has_role(p_user_id, 'admin'::app_role);
  
  IF v_is_admin THEN
    RETURN true;
  END IF;
  
  -- Get user's current subscription with expiration check
  SELECT 
    plan_name,
    expires_at,
    cancel_at_period_end
  INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Check if subscription is expired or cancelled
  IF v_subscription IS NULL THEN
    v_plan_name := 'free';
  ELSIF v_subscription.expires_at IS NOT NULL AND v_subscription.expires_at < NOW() THEN
    v_plan_name := 'free';
  ELSIF v_subscription.cancel_at_period_end AND v_subscription.expires_at < NOW() THEN
    v_plan_name := 'free';
  ELSE
    v_plan_name := v_subscription.plan_name;
  END IF;
  
  -- Get business limit for the plan
  SELECT business_limit INTO v_business_limit
  FROM subscription_plans
  WHERE name = v_plan_name;
  
  -- If no plan found, use free limit (0)
  IF v_business_limit IS NULL THEN
    v_business_limit := 0;
  END IF;
  
  -- -1 means unlimited
  IF v_business_limit = -1 THEN
    RETURN true;
  END IF;
  
  -- Count current businesses
  SELECT COUNT(*) INTO v_current_count
  FROM businesses
  WHERE owner_id = p_user_id;
  
  -- Check if under limit
  RETURN v_current_count < v_business_limit;
END;
$$;