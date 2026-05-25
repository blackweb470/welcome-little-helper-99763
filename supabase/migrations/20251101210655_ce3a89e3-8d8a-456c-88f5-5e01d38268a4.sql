-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  business_limit INTEGER NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (everyone can view plans)
CREATE POLICY "Anyone can view subscription plans"
  ON public.subscription_plans
  FOR SELECT
  USING (true);

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view own subscription"
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON public.user_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON public.user_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, business_limit, price_monthly, features) VALUES
  ('free', 1, 0, '["1 Business", "Basic AI Chat", "Email Support"]'::jsonb),
  ('basic', 3, 9.99, '["3 Businesses", "Advanced AI Chat", "Priority Email Support", "Analytics Dashboard"]'::jsonb),
  ('pro', 10, 29.99, '["10 Businesses", "Premium AI Chat", "Live Agent Support", "Advanced Analytics", "Custom Branding"]'::jsonb),
  ('business', -1, 99.99, '["Unlimited Businesses", "Business AI Chat", "24/7 Priority Support", "Custom Integrations", "Dedicated Account Manager"]'::jsonb);

-- Function to check if user can create more businesses
CREATE OR REPLACE FUNCTION public.can_create_business(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_name TEXT;
  v_business_limit INTEGER;
  v_current_count INTEGER;
BEGIN
  -- Get user's current plan (default to free if no subscription)
  SELECT COALESCE(plan_name, 'free') INTO v_plan_name
  FROM user_subscriptions
  WHERE user_id = p_user_id;
  
  -- If no subscription found, use free plan
  IF v_plan_name IS NULL THEN
    v_plan_name := 'free';
  END IF;
  
  -- Get business limit for the plan
  SELECT business_limit INTO v_business_limit
  FROM subscription_plans
  WHERE name = v_plan_name;
  
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

-- Function to get user's plan info
CREATE OR REPLACE FUNCTION public.get_user_plan_info(p_user_id UUID)
RETURNS TABLE(
  plan_name TEXT,
  business_limit INTEGER,
  current_businesses INTEGER,
  can_create_more BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_name TEXT;
BEGIN
  -- Get user's current plan (default to free)
  SELECT COALESCE(us.plan_name, 'free') INTO v_plan_name
  FROM user_subscriptions us
  WHERE us.user_id = p_user_id;
  
  IF v_plan_name IS NULL THEN
    v_plan_name := 'free';
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

-- Trigger to update updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();