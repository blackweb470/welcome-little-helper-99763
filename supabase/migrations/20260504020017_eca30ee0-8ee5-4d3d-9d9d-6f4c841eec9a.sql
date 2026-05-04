-- 1. Conversations: remove anon SELECT-all, keep INSERT for visitor flow
DROP POLICY IF EXISTS "Public visitors can view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Authenticated visitors can view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Visitors can read own conversations" ON public.conversations;

-- 2. Live chat sessions: remove anon SELECT-all
DROP POLICY IF EXISTS "Visitors can view live chat sessions" ON public.live_chat_sessions;

-- 3. Message attachments storage bucket: make private + remove public read
UPDATE storage.buckets SET public = false WHERE id = 'message-attachments';
DROP POLICY IF EXISTS "Public can view message attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public read message attachments" ON storage.objects;

-- Allow business owners (and team members with chat permission) to read attachments
CREATE POLICY "Owners and team can read message attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.owner_id = auth.uid()
       OR public.is_team_member_of_business(auth.uid(), b.id)
  )
);

-- 4. business_website_content: restrict the over-permissive policy to service_role
DROP POLICY IF EXISTS "Service role can manage all website content" ON public.business_website_content;
CREATE POLICY "Service role can manage all website content"
ON public.business_website_content
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);