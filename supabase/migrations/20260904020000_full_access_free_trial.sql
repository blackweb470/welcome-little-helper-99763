-- Migration: Grant full access to all features during the 14-day Free Trial period

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
  v_is_active_trial BOOLEAN := false;
BEGIN
  -- Check if user has admin role - admins get access to everything
  v_is_admin := public.has_role(p_user_id, 'admin'::app_role);
  IF v_is_admin THEN
    RETURN true;
  END IF;
  
  -- Get user's current subscription
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
  
  -- Check if user is in an active 14-day Free Trial
  IF v_subscription.trial_ends_at IS NOT NULL AND v_subscription.trial_ends_at > NOW() THEN
    v_is_active_trial := true;
  END IF;

  -- Active Free Trial users get FULL access to EVERYTHING just like Business plan users!
  IF v_is_active_trial THEN
    RETURN true;
  END IF;

  -- If no subscription or expired, set to free
  IF v_subscription IS NULL THEN
    v_plan_name := 'free';
  ELSIF v_subscription.expires_at IS NOT NULL AND v_subscription.expires_at < NOW() AND NOT v_is_active_trial THEN
    v_plan_name := 'free';
  ELSE
    v_plan_name := v_subscription.plan_name;
  END IF;
  
  -- Check feature access based on plan hierarchy for paid subscriptions
  CASE p_feature
    WHEN 'basic_chat' THEN v_has_access := true;
    WHEN 'widget_customization' THEN v_has_access := true;
    
    WHEN 'pre_chat_forms' THEN v_has_access := v_plan_name IN ('basic', 'pro', 'business');
    WHEN 'canned_responses' THEN v_has_access := v_plan_name IN ('basic', 'pro', 'business');
    WHEN 'basic_analytics' THEN v_has_access := v_plan_name IN ('basic', 'pro', 'business');
    WHEN 'email_notifications' THEN v_has_access := v_plan_name IN ('basic', 'pro', 'business');
    
    WHEN 'live_agent' THEN v_has_access := v_plan_name IN ('pro', 'business');
    WHEN 'advanced_analytics' THEN v_has_access := v_plan_name IN ('pro', 'business');
    WHEN 'sentiment_analysis' THEN v_has_access := v_plan_name IN ('pro', 'business');
    WHEN 'proactive_chat' THEN v_has_access := v_plan_name IN ('pro', 'business');
    WHEN 'voice_chat' THEN v_has_access := v_plan_name IN ('pro', 'business');
    WHEN 'product_catalog' THEN v_has_access := v_plan_name IN ('pro', 'business');
    
    WHEN 'business_documents' THEN v_has_access := v_plan_name = 'business';
    WHEN 'ai_learning' THEN v_has_access := v_plan_name = 'business';
    WHEN 'visitor_tracking' THEN v_has_access := v_plan_name = 'business';
    WHEN 'custom_integrations' THEN v_has_access := v_plan_name = 'business';
    WHEN 'api_access' THEN v_has_access := v_plan_name = 'business';
    WHEN 'white_label' THEN v_has_access := v_plan_name = 'business';
    WHEN 'sla_guarantees' THEN v_has_access := v_plan_name = 'business';
    
    ELSE v_has_access := false;
  END CASE;
  
  RETURN v_has_access;
END;
$$;

-- Update get_user_plan_info to grant full Business tier limits during Free Trial
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
  v_limit INTEGER;
  v_current_count INTEGER;
  v_is_active_trial BOOLEAN := false;
BEGIN
  v_is_admin := public.has_role(p_user_id, 'admin'::app_role);
  
  IF v_is_admin THEN
    SELECT sp.business_limit INTO v_limit
    FROM subscription_plans sp
    WHERE sp.name = 'business';

    SELECT COUNT(*)::integer INTO v_current_count
    FROM businesses
    WHERE owner_id = p_user_id;

    RETURN QUERY SELECT 
      'business'::text as plan_name,
      COALESCE(v_limit, 5) as business_limit,
      v_current_count as current_businesses,
      true as can_create_more;
    RETURN;
  END IF;

  SELECT 
    sp.name as plan_name,
    us.trial_ends_at,
    us.expires_at,
    us.cancel_at_period_end
  INTO v_subscription
  FROM user_subscriptions us
  JOIN subscription_plans sp ON sp.name = us.plan_name
  WHERE us.user_id = p_user_id
  ORDER BY us.created_at DESC
  LIMIT 1;

  IF v_subscription.trial_ends_at IS NOT NULL AND v_subscription.trial_ends_at > NOW() THEN
    v_is_active_trial := true;
  END IF;

  IF v_is_active_trial THEN
    v_plan_name := 'business';
  ELSIF v_subscription IS NULL OR (v_subscription.expires_at IS NOT NULL AND v_subscription.expires_at < NOW()) THEN
    v_plan_name := 'free';
  ELSE
    v_plan_name := COALESCE(v_subscription.plan_name, 'free');
  END IF;

  SELECT sp.business_limit INTO v_limit
  FROM subscription_plans sp
  WHERE sp.name = v_plan_name;

  IF v_limit IS NULL THEN
    v_limit := 1;
  END IF;

  SELECT COUNT(*)::integer INTO v_current_count
  FROM businesses
  WHERE owner_id = p_user_id;

  RETURN QUERY SELECT 
    v_plan_name as plan_name,
    v_limit as business_limit,
    v_current_count as current_businesses,
    (v_limit = -1 OR v_current_count < v_limit) as can_create_more;
END;
$$;
