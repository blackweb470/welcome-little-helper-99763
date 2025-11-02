-- Remove Enterprise plan from subscription_plans
DELETE FROM subscription_plans WHERE name = 'enterprise';

-- Update existing plans with correct limits
UPDATE subscription_plans 
SET business_limit = 3 
WHERE name = 'basic';

UPDATE subscription_plans 
SET business_limit = 10 
WHERE name = 'pro';

UPDATE subscription_plans 
SET business_limit = -1 
WHERE name = 'business';