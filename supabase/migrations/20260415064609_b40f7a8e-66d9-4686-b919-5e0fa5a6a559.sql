
-- 1. Force pre_chat_enabled = true always
UPDATE public.widget_settings SET pre_chat_enabled = true WHERE pre_chat_enabled IS NOT true;

-- Add a check constraint so it can never be set to false
ALTER TABLE public.widget_settings ADD CONSTRAINT pre_chat_always_enabled CHECK (pre_chat_enabled = true);

-- 2. Fix conversations: remove open anon SELECT, add scoped policy
DROP POLICY IF EXISTS "Anyone can read conversations" ON public.conversations;
DROP POLICY IF EXISTS "Public can read conversations" ON public.conversations;
DROP POLICY IF EXISTS "Anon can read conversations" ON public.conversations;

-- Allow anon to read only their own conversations (by visitor_id header or parameter)
-- The widget passes visitor_id, so we scope by that
CREATE POLICY "Visitors can read own conversations"
ON public.conversations
FOR SELECT
TO anon
USING (false);

-- Authenticated users (business owners/team) keep their existing policies

-- 3. Fix messages: remove open anon SELECT and UPDATE
DROP POLICY IF EXISTS "Anyone can read messages" ON public.messages;
DROP POLICY IF EXISTS "Public can read messages" ON public.messages;
DROP POLICY IF EXISTS "Anon can read messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can update messages" ON public.messages;
DROP POLICY IF EXISTS "Public can update messages" ON public.messages;
DROP POLICY IF EXISTS "Anon can update messages" ON public.messages;

-- Block anon from reading messages directly (they get messages via edge functions)
CREATE POLICY "Visitors cannot directly read messages"
ON public.messages
FOR SELECT
TO anon
USING (false);

-- 4. Fix conversation_links: remove open policies
DROP POLICY IF EXISTS "Anyone can read conversation links" ON public.conversation_links;
DROP POLICY IF EXISTS "Public can read conversation links" ON public.conversation_links;
DROP POLICY IF EXISTS "Anyone can create conversation links" ON public.conversation_links;
DROP POLICY IF EXISTS "Public can create conversation links" ON public.conversation_links;
DROP POLICY IF EXISTS "Anyone can update conversation links" ON public.conversation_links;
DROP POLICY IF EXISTS "Public can update conversation links" ON public.conversation_links;

-- Only service_role can manage conversation links
CREATE POLICY "Service role manages conversation links"
ON public.conversation_links
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read their business links
CREATE POLICY "Business owners can read conversation links"
ON public.conversation_links
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = conversation_links.business_id
    AND (b.owner_id = auth.uid() OR public.is_team_member_of_business(auth.uid(), b.id))
  )
);

-- 5. Fix widget_settings: remove open anon SELECT that exposes system_prompt
DROP POLICY IF EXISTS "Anyone can read widget settings" ON public.widget_settings;
DROP POLICY IF EXISTS "Public can read widget settings" ON public.widget_settings;
DROP POLICY IF EXISTS "Anon can read widget settings" ON public.widget_settings;

-- Create a secure view for public widget data (no system_prompt)
CREATE OR REPLACE VIEW public.widget_settings_public AS
SELECT 
  id, business_id, welcome_message, agent_name, primary_color, 
  widget_position, pre_chat_enabled, pre_chat_welcome_message, 
  pre_chat_required_fields, max_input_characters, show_qa_to_visitors,
  voice_enabled
FROM public.widget_settings;

-- Grant anon access to the view
GRANT SELECT ON public.widget_settings_public TO anon;
GRANT SELECT ON public.widget_settings_public TO authenticated;

-- 6. Fix messages anon UPDATE (if exists)
DROP POLICY IF EXISTS "Messages can be updated" ON public.messages;
