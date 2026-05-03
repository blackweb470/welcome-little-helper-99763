CREATE POLICY "Authenticated visitors can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated visitors can view conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (true);