-- Remove direct anonymous access to sensitive widget and chat tables.
DROP POLICY IF EXISTS "Anon can read widget settings for widget" ON public.widget_settings;
DROP POLICY IF EXISTS "Anon can read businesses for widget" ON public.businesses;
DROP POLICY IF EXISTS "Anon can only read their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Visitors can create conversations for valid businesses" ON public.conversations;
DROP POLICY IF EXISTS "Visitors can create messages for valid conversations" ON public.messages;

-- Keep safe public views for the embeddable widget only.
CREATE OR REPLACE VIEW public.widget_settings_public AS
SELECT
  id,
  business_id,
  welcome_message,
  agent_name,
  primary_color,
  widget_position,
  pre_chat_enabled,
  pre_chat_welcome_message,
  pre_chat_required_fields,
  max_input_characters,
  show_qa_to_visitors,
  voice_enabled
FROM public.widget_settings;

CREATE OR REPLACE VIEW public.businesses_public AS
SELECT
  id,
  name,
  logo_url,
  online_status,
  average_response_time_seconds
FROM public.businesses;

GRANT SELECT ON public.widget_settings_public TO anon, authenticated;
GRANT SELECT ON public.businesses_public TO anon, authenticated;

-- Revoke direct table privileges as defense-in-depth; RLS policies above remain the primary control.
REVOKE SELECT ON public.widget_settings FROM anon;
REVOKE SELECT ON public.businesses FROM anon;
REVOKE SELECT ON public.conversations FROM anon;
REVOKE INSERT ON public.conversations FROM anon;
REVOKE INSERT ON public.messages FROM anon;