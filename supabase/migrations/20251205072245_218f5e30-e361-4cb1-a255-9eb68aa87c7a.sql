-- Allow public/anonymous access to read enabled proactive chat rules
CREATE POLICY "Public can view enabled proactive rules" 
ON public.proactive_chat_rules 
FOR SELECT 
USING (enabled = true);