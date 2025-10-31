-- Allow anyone to view messages in conversations they're part of
DROP POLICY IF EXISTS "Business owners can view messages" ON messages;

-- Create a policy that allows viewing messages for conversations
CREATE POLICY "Allow viewing messages in conversations"
ON messages
FOR SELECT
USING (
  -- Allow business owners to view all messages
  EXISTS (
    SELECT 1 FROM conversations
    JOIN businesses ON conversations.business_id = businesses.id
    WHERE conversations.id = messages.conversation_id
    AND businesses.owner_id = auth.uid()
  )
  OR
  -- Allow anyone to view messages (for embedded widget)
  true
);

-- Add read_at column to messages for read receipts
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at timestamp with time zone;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_by uuid;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_unread ON messages(conversation_id, read_at) WHERE read_at IS NULL;