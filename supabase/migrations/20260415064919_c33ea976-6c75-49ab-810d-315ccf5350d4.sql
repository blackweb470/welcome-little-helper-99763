
-- 1. Remove open anon UPDATE on conversations
DROP POLICY IF EXISTS "Public visitors can update conversations" ON public.conversations;

-- 2. Remove legacy open messages SELECT policy
DROP POLICY IF EXISTS "Visitors can view messages in their conversations" ON public.messages;

-- 3. Remove legacy open conversation_links policies
DROP POLICY IF EXISTS "Allow public insert for links" ON public.conversation_links;
DROP POLICY IF EXISTS "Allow public read for linking" ON public.conversation_links;
DROP POLICY IF EXISTS "Allow public update for links" ON public.conversation_links;

-- 4. Fix the widget_settings_public view to use SECURITY INVOKER
DROP VIEW IF EXISTS public.widget_settings_public;
CREATE VIEW public.widget_settings_public 
WITH (security_invoker = true)
AS
SELECT 
  id, business_id, welcome_message, agent_name, primary_color, 
  widget_position, pre_chat_enabled, pre_chat_welcome_message, 
  pre_chat_required_fields, max_input_characters, show_qa_to_visitors,
  voice_enabled
FROM public.widget_settings;

-- Grant access to the view
GRANT SELECT ON public.widget_settings_public TO anon;
GRANT SELECT ON public.widget_settings_public TO authenticated;

-- Add a SELECT policy on widget_settings for anon (non-sensitive fields only accessed via view)
-- The view already filters columns, but we need a policy to allow anon SELECT on the underlying table
CREATE POLICY "Anon can read widget settings via view"
ON public.widget_settings
FOR SELECT
TO anon
USING (true);
