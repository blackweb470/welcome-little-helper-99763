-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can create conversations" ON public.conversations;

-- Allow anyone to insert conversations (for chat widget)
CREATE POLICY "Anyone can create conversations"
ON public.conversations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);