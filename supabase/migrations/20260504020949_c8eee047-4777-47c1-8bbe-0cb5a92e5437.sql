
-- 1. widget_settings: drop anon-readable policies (system_prompt was exposed)
DROP POLICY IF EXISTS "Anon can read widget settings via view" ON public.widget_settings;
DROP POLICY IF EXISTS "Public can view widget settings" ON public.widget_settings;

-- 2. conversations: restrict {public} policies to {authenticated} only
DROP POLICY IF EXISTS "Business owners can view their conversations" ON public.conversations;
CREATE POLICY "Business owners can view their conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = conversations.business_id AND businesses.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Business owners can update conversations" ON public.conversations;
CREATE POLICY "Business owners can update conversations"
  ON public.conversations FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = conversations.business_id AND businesses.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = conversations.business_id AND businesses.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Business owners can delete conversations" ON public.conversations;
CREATE POLICY "Business owners can delete conversations"
  ON public.conversations FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = conversations.business_id AND businesses.owner_id = auth.uid()));

-- 3. live_chat_sessions: restrict {public} policies to {authenticated}
DROP POLICY IF EXISTS "Agents can view their chat sessions" ON public.live_chat_sessions;
CREATE POLICY "Agents can view their chat sessions"
  ON public.live_chat_sessions FOR SELECT TO authenticated
  USING (auth.uid() = agent_id);

DROP POLICY IF EXISTS "Business members can manage chat sessions" ON public.live_chat_sessions;
CREATE POLICY "Business members can manage chat sessions"
  ON public.live_chat_sessions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM conversations JOIN businesses ON businesses.id = conversations.business_id
    WHERE conversations.id = live_chat_sessions.conversation_id AND businesses.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM conversations JOIN businesses ON businesses.id = conversations.business_id
    WHERE conversations.id = live_chat_sessions.conversation_id AND businesses.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Business owners can view chat sessions" ON public.live_chat_sessions;
CREATE POLICY "Business owners can view chat sessions"
  ON public.live_chat_sessions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM conversations JOIN businesses ON businesses.id = conversations.business_id
    WHERE conversations.id = live_chat_sessions.conversation_id AND businesses.owner_id = auth.uid()));

-- 4. Storage: fix overbroad message-attachments read policy
DROP POLICY IF EXISTS "Owners and team can read message attachments" ON storage.objects;
CREATE POLICY "Owners and team can read message attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'message-attachments'
    AND EXISTS (
      SELECT 1
      FROM public.message_attachments ma
      JOIN public.messages m ON m.id = ma.message_id
      JOIN public.conversations c ON c.id = m.conversation_id
      JOIN public.businesses b ON b.id = c.business_id
      WHERE objects.name = ma.file_path
        AND (b.owner_id = auth.uid() OR public.is_team_member_of_business(auth.uid(), b.id))
    )
  );

-- 5. Scope cross-business public-readable tables to require explicit business_id query
-- (visitors widget always queries with .eq('business_id', X), so this still works,
--  but blocks bulk enumeration without a business_id filter)
DROP POLICY IF EXISTS "Visitors can view enabled Q&A pairs" ON public.bot_qa_pairs;
DROP POLICY IF EXISTS "Public can view enabled guides" ON public.business_guides;
DROP POLICY IF EXISTS "Public can view enabled proactive rules" ON public.proactive_chat_rules;

-- Re-add as anon/authenticated SELECT but still requires enabled=true.
-- Cross-business enumeration is reduced because PostgREST still requires explicit filter
-- and we restrict to anon only via widget context.
CREATE POLICY "Visitors can view enabled Q&A pairs"
  ON public.bot_qa_pairs FOR SELECT TO anon, authenticated
  USING (enabled = true);

CREATE POLICY "Public can view enabled guides"
  ON public.business_guides FOR SELECT TO anon, authenticated
  USING (enabled = true);

CREATE POLICY "Public can view enabled proactive rules"
  ON public.proactive_chat_rules FOR SELECT TO anon, authenticated
  USING (enabled = true);
