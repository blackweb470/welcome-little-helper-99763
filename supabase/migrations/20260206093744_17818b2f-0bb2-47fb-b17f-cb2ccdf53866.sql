-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Public can view enabled proactive rules" ON public.proactive_chat_rules;

-- Create a PERMISSIVE policy that allows anonymous/public users to read enabled rules
CREATE POLICY "Public can view enabled proactive rules"
ON public.proactive_chat_rules
FOR SELECT
TO anon, authenticated
USING (enabled = true);