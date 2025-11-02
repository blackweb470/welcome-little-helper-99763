-- Create payment history table to track all payment attempts
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  polar_payment_id TEXT,
  polar_subscription_id TEXT,
  plan_name TEXT NOT NULL,
  amount NUMERIC(10, 2),
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded')),
  payment_method TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment history
CREATE POLICY "Users can view own payment history"
ON public.payment_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Service role can insert payment records
CREATE POLICY "Service role can insert payments"
ON public.payment_history
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX idx_payment_history_created_at ON public.payment_history(created_at DESC);

-- Update has_feature_access to check subscription expiration and cancellation
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
BEGIN
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

-- Update can_create_business to properly check subscription status
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
BEGIN
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

-- Update get_user_plan_info to include expiration status
CREATE OR REPLACE FUNCTION public.get_user_plan_info(p_user_id uuid)
RETURNS TABLE(plan_name text, business_limit integer, current_businesses integer, can_create_more boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_plan_name TEXT;
  v_subscription RECORD;
BEGIN
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