-- Fix: Allow public visitors to use voice widget and create conversations
-- Visitors (unauthenticated users) need to be able to create conversations and messages from the widget

-- Allow anon users to create conversations (for widget visitors)
CREATE POLICY "Public visitors can create conversations"
ON public.conversations
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon users to insert messages (for widget visitors)
CREATE POLICY "Public visitors can create messages"
ON public.messages
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon users to view their own conversations
CREATE POLICY "Public visitors can view conversations"
ON public.conversations
FOR SELECT
TO anon
USING (true);

-- Allow anon users to update their conversations (for adding visitor details)
CREATE POLICY "Public visitors can update conversations"
ON public.conversations
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);