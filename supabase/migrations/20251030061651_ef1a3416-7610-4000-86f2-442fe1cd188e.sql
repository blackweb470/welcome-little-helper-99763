-- Allow anyone to insert conversations (for chat widget)
CREATE POLICY "Anyone can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (true);

-- Allow anyone to insert messages (for chat widget)
CREATE POLICY "Anyone can create messages"
ON public.messages
FOR INSERT
WITH CHECK (true);

-- Allow anyone to select messages for their conversation (for chat widget)
CREATE POLICY "Anyone can view messages"
ON public.messages
FOR SELECT
USING (true);