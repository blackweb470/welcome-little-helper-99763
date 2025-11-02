-- Add Polar tracking fields to user_subscriptions
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS polar_customer_id TEXT,
ADD COLUMN IF NOT EXISTS polar_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;

-- Create index for faster Polar lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_polar_subscription 
ON user_subscriptions(polar_subscription_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_polar_customer 
ON user_subscriptions(polar_customer_id);

-- Update subscription plans to match pricing page
UPDATE subscription_plans SET price_monthly = 9.99, business_limit = 3 WHERE name = 'basic';
UPDATE subscription_plans SET price_monthly = 29.99, business_limit = 10 WHERE name = 'pro';
UPDATE subscription_plans SET price_monthly = 99.99, business_limit = -1 WHERE name = 'business';

-- Add Enterprise plan if it doesn't exist
INSERT INTO subscription_plans (name, price_monthly, business_limit, features)
VALUES ('enterprise', 299.99, -1, '[
  "everything_in_business",
  "white_label",
  "sla_guarantees",
  "custom_contracts",
  "dedicated_support_team",
  "multi_region_deployment",
  "advanced_security",
  "on_premise_option"
]'::jsonb)
ON CONFLICT (name) DO UPDATE SET
  price_monthly = 299.99,
  business_limit = -1,
  features = '[
    "everything_in_business",
    "white_label",
    "sla_guarantees",
    "custom_contracts",
    "dedicated_support_team",
    "multi_region_deployment",
    "advanced_security",
    "on_premise_option"
  ]'::jsonb;

-- Remove free plan since we're using trial instead
DELETE FROM subscription_plans WHERE name = 'free';

-- Function to check if user is on trial
CREATE OR REPLACE FUNCTION is_on_trial(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_trial_ends_at TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT trial_ends_at INTO v_trial_ends_at
  FROM user_subscriptions
  WHERE user_id = p_user_id
    AND plan_name = 'basic'
    AND trial_ends_at IS NOT NULL
    AND trial_ends_at > NOW();
  
  RETURN v_trial_ends_at IS NOT NULL;
END;
$$;

-- Function to get subscription status
CREATE OR REPLACE FUNCTION get_subscription_status(p_user_id UUID)
RETURNS TABLE(
  plan_name TEXT,
  status TEXT,
  is_trial BOOLEAN,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.plan_name,
    CASE
      WHEN us.trial_ends_at IS NOT NULL AND us.trial_ends_at > NOW() THEN 'trialing'
      WHEN us.expires_at IS NULL OR us.expires_at > NOW() THEN 'active'
      ELSE 'expired'
    END as status,
    (us.trial_ends_at IS NOT NULL AND us.trial_ends_at > NOW()) as is_trial,
    us.trial_ends_at,
    us.expires_at,
    us.cancel_at_period_end
  FROM user_subscriptions us
  WHERE us.user_id = p_user_id
  ORDER BY us.created_at DESC
  LIMIT 1;
END;
$$;