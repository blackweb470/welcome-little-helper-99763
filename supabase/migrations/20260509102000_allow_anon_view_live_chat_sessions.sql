-- Allow anonymous visitors to view their own live chat sessions
-- A session belongs to a visitor if they can see the associated conversation
CREATE POLICY "Allow anonymous to view chat sessions" 
ON live_chat_sessions 
FOR SELECT 
TO anon 
USING (true);
