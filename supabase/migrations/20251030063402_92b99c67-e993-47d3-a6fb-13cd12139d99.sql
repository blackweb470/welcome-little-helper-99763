-- Drop and recreate the policy to apply to all roles including public
DROP POLICY IF EXISTS "Anyone can create conversations" ON public.conversations;

CREATE POLICY "Anyone can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (true);

-- Same for messages
DROP POLICY IF EXISTS "Anyone can create messages" ON public.messages;

CREATE POLICY "Anyone can create messages"
ON public.messages
FOR INSERT
WITH CHECK (true);

-- And for viewing messages
DROP POLICY IF EXISTS "Anyone can view messages" ON public.messages;

CREATE POLICY "Anyone can view messages"
ON public.messages
FOR SELECT
USING (true);