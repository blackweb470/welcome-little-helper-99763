-- Allow anyone to mark messages as read
CREATE POLICY "Anyone can mark messages as read"
ON messages
FOR UPDATE
USING (true)
WITH CHECK (true);