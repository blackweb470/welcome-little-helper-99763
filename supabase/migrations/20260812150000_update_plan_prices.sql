-- Update subscription_plans table prices to $5, $10, and $20 per month
UPDATE public.subscription_plans SET price_monthly = 5.00, updated_at = now() WHERE name = 'basic';
UPDATE public.subscription_plans SET price_monthly = 10.00, updated_at = now() WHERE name = 'pro';
UPDATE public.subscription_plans SET price_monthly = 20.00, updated_at = now() WHERE name = 'business';
