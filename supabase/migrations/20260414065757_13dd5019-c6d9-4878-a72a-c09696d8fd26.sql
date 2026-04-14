
-- Drop the dangerous INSERT and UPDATE policies on user_subscriptions
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.user_subscriptions;

-- Only service_role can insert subscriptions (from edge functions/webhooks)
CREATE POLICY "Service role can insert subscriptions"
ON public.user_subscriptions
FOR INSERT
TO service_role
WITH CHECK (true);

-- Only service_role can update subscriptions (from edge functions/webhooks)  
CREATE POLICY "Service role can update subscriptions"
ON public.user_subscriptions
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);
