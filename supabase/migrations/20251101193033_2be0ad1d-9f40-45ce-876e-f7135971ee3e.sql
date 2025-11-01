-- Allow agents to send messages in their business's conversations
CREATE POLICY "Agents can send messages"
ON messages
FOR INSERT
WITH CHECK (
  role = 'assistant' 
  AND EXISTS (
    SELECT 1 
    FROM conversations c
    JOIN businesses b ON c.business_id = b.id
    WHERE c.id = messages.conversation_id 
    AND b.owner_id = auth.uid()
  )
);