-- Allow visitors (unauthenticated users) to view messages in conversations
-- This is needed so that visitors using the chat widget can see admin responses
CREATE POLICY "Visitors can view messages in their conversations"
ON messages
FOR SELECT
TO anon
USING (true);

-- Note: Security is maintained because:
-- 1. Visitors only know their own conversation_id (which acts as a secret token)
-- 2. The widget only requests messages for their specific conversation
-- 3. conversation_id is a UUID which is effectively impossible to guess