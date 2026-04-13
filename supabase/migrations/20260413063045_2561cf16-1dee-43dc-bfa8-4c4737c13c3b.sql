UPDATE subscription_plans SET business_limit = 1, features = '["2 Weeks Free Trial", "1 Business", "Pre-Chat Forms", "Canned Responses", "Basic Analytics", "Email Notifications", "Chat History"]'::jsonb, updated_at = now() WHERE name = 'basic';

UPDATE subscription_plans SET business_limit = 2, features = '["2 Businesses", "Live Agent Transfer", "Advanced Analytics", "Sentiment Analysis", "Proactive Chat Rules", "Voice Chat", "Product Catalog", "Priority Support"]'::jsonb, updated_at = now() WHERE name = 'pro';

UPDATE subscription_plans SET business_limit = 5, features = '["5 Businesses", "AI Learning & Documents", "Advanced Visitor Tracking", "Custom Integrations", "API Access", "Dedicated Account Manager", "Custom Training"]'::jsonb, updated_at = now() WHERE name = 'business';