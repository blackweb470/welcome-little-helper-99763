-- ============================================================
-- Security & Performance Audit Fixes
-- ============================================================

-- 1. Storage bucket security
UPDATE storage.buckets 
SET file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
WHERE id = 'avatars';

DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to message-attachments" ON storage.objects;

-- 2. View Security Hardening (SECURITY DEFINER to SECURITY INVOKER)
DROP VIEW IF EXISTS public.widget_settings_public;
CREATE VIEW public.widget_settings_public 
WITH (security_invoker = true) AS
SELECT id, business_id, welcome_message, agent_name, primary_color,
       widget_position, pre_chat_enabled, pre_chat_welcome_message,
       pre_chat_required_fields, max_input_characters, show_qa_to_visitors,
       voice_enabled
FROM widget_settings;

DROP VIEW IF EXISTS public.businesses_public;
CREATE VIEW public.businesses_public 
WITH (security_invoker = true) AS
SELECT id, name, logo_url, online_status, average_response_time_seconds
FROM businesses;

DROP VIEW IF EXISTS public.bot_qa_pairs_public;
CREATE VIEW public.bot_qa_pairs_public 
WITH (security_invoker = true) AS
SELECT id, business_id, question, answer, priority, enabled
FROM bot_qa_pairs
WHERE enabled = true;

DROP VIEW IF EXISTS public.proactive_chat_rules_public;
CREATE VIEW public.proactive_chat_rules_public 
WITH (security_invoker = true) AS
SELECT id, business_id, name, trigger_type, trigger_value, message, priority, enabled
FROM proactive_chat_rules
WHERE enabled = true;

DROP VIEW IF EXISTS public.live_chat_sessions_public;
CREATE VIEW public.live_chat_sessions_public 
WITH (security_invoker = true) AS
SELECT id, conversation_id, status, queued_at, accepted_at, ended_at, created_at
FROM live_chat_sessions;

GRANT SELECT ON public.widget_settings_public TO anon;
GRANT SELECT ON public.businesses_public TO anon;
GRANT SELECT ON public.bot_qa_pairs_public TO anon;
GRANT SELECT ON public.proactive_chat_rules_public TO anon;
GRANT SELECT ON public.live_chat_sessions_public TO anon;

GRANT SELECT ON public.widget_settings_public TO authenticated;
GRANT SELECT ON public.businesses_public TO authenticated;
GRANT SELECT ON public.bot_qa_pairs_public TO authenticated;
GRANT SELECT ON public.proactive_chat_rules_public TO authenticated;
GRANT SELECT ON public.live_chat_sessions_public TO authenticated;

-- 3. Function Access Control
ALTER FUNCTION public.match_knowledge_chunks SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.calculate_engagement_score(integer, integer, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_whatsapp_public_info(uuid) FROM anon;

-- 4. RLS Policy Cleanup & Optimization
-- Profiles
DROP POLICY IF EXISTS "Deny all public access to profiles" ON public.profiles;
CREATE POLICY "Block anon access" ON public.profiles 
AS RESTRICTIVE FOR ALL TO anon
USING (false);

-- Notifications
DROP POLICY IF EXISTS "Anon cannot see notifications" ON public.notification_history;
CREATE POLICY "Block anon from notifications" ON public.notification_history 
AS RESTRICTIVE FOR ALL TO anon
USING (false);

-- Redundant policies
DROP POLICY IF EXISTS "Business owners can delete learnings" ON public.business_learnings;
DROP POLICY IF EXISTS "Business owners can insert learnings" ON public.business_learnings;
DROP POLICY IF EXISTS "Business owners can view their learnings" ON public.business_learnings;
DROP POLICY IF EXISTS "Business owners can update learnings" ON public.business_learnings;
DROP POLICY IF EXISTS "Business owners can view chat sessions" ON public.live_chat_sessions;

-- 5. Missing Foreign Key Indexes
CREATE INDEX IF NOT EXISTS idx_agent_availability_business_id ON public.agent_availability(business_id);
CREATE INDEX IF NOT EXISTS idx_business_learnings_business_id ON public.business_learnings(business_id);
CREATE INDEX IF NOT EXISTS idx_canned_responses_business_id ON public.canned_responses(business_id);
CREATE INDEX IF NOT EXISTS idx_conversation_context_business_id ON public.conversation_context(business_id);
CREATE INDEX IF NOT EXISTS idx_conversation_links_business_id ON public.conversation_links(business_id);
CREATE INDEX IF NOT EXISTS idx_conversations_business_id ON public.conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_business_id ON public.knowledge_chunks(business_id);
CREATE INDEX IF NOT EXISTS idx_live_chat_sessions_conversation_id ON public.live_chat_sessions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON public.notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_proactive_chat_rules_business_id ON public.proactive_chat_rules(business_id);
CREATE INDEX IF NOT EXISTS idx_team_members_business_id ON public.team_members(business_id);
CREATE INDEX IF NOT EXISTS idx_tickets_business_id ON public.tickets(business_id);
CREATE INDEX IF NOT EXISTS idx_bot_qa_pairs_business_id ON public.bot_qa_pairs(business_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_settings_business_id ON public.whatsapp_settings(business_id);
CREATE INDEX IF NOT EXISTS idx_widget_settings_business_id ON public.widget_settings(business_id);
CREATE INDEX IF NOT EXISTS idx_business_website_content_business_id ON public.business_website_content(business_id);

-- 6. Performance Optimization (SELECT auth.uid())
-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO public USING (((SELECT auth.uid()) = id));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO public USING (((SELECT auth.uid()) = id));

-- businesses
DROP POLICY IF EXISTS "Business owners can delete their businesses" ON public.businesses;
CREATE POLICY "Business owners can delete their businesses" ON public.businesses FOR DELETE TO public USING (((SELECT auth.uid()) = owner_id));

DROP POLICY IF EXISTS "Business owners can create businesses" ON public.businesses;
CREATE POLICY "Business owners can create businesses" ON public.businesses FOR INSERT TO public WITH CHECK (((SELECT auth.uid()) = owner_id));

DROP POLICY IF EXISTS "Business owners can view their businesses" ON public.businesses;
CREATE POLICY "Business owners can view their businesses" ON public.businesses FOR SELECT TO public USING (((SELECT auth.uid()) = owner_id));

DROP POLICY IF EXISTS "Business owners can update their businesses" ON public.businesses;
CREATE POLICY "Business owners can update their businesses" ON public.businesses FOR UPDATE TO public USING (((SELECT auth.uid()) = owner_id));

-- user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO public USING (((SELECT auth.uid()) = user_id));

-- user_subscriptions
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions FOR SELECT TO public USING (((SELECT auth.uid()) = user_id));

-- notification_preferences
DROP POLICY IF EXISTS "Users can delete own preferences" ON public.notification_preferences;
CREATE POLICY "Users can delete own preferences" ON public.notification_preferences FOR DELETE TO public USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.notification_preferences;
CREATE POLICY "Users can insert own preferences" ON public.notification_preferences FOR INSERT TO public WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can view own preferences" ON public.notification_preferences;
CREATE POLICY "Users can view own preferences" ON public.notification_preferences FOR SELECT TO public USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can update own preferences" ON public.notification_preferences;
CREATE POLICY "Users can update own preferences" ON public.notification_preferences FOR UPDATE TO public USING (((SELECT auth.uid()) = user_id));

-- notification_history
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notification_history;
CREATE POLICY "Users can delete own notifications" ON public.notification_history FOR DELETE TO authenticated USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notification_history;
CREATE POLICY "Users can view own notifications" ON public.notification_history FOR SELECT TO public USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notification_history;
CREATE POLICY "Users can update own notifications" ON public.notification_history FOR UPDATE TO public USING (((SELECT auth.uid()) = user_id));

-- agent_availability
DROP POLICY IF EXISTS "Users can manage own availability" ON public.agent_availability;
CREATE POLICY "Users can manage own availability" ON public.agent_availability FOR ALL TO public USING (((SELECT auth.uid()) = user_id));

-- 7. Extension Security
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;
ALTER EXTENSION vector SET SCHEMA extensions;
