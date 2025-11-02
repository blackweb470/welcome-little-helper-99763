-- Insert free plan if it doesn't exist
INSERT INTO public.subscription_plans (name, business_limit, price_monthly, features)
VALUES (
  'free',
  0,
  0,
  '["basic_chat", "widget_customization"]'::jsonb
)
ON CONFLICT (name) DO NOTHING;