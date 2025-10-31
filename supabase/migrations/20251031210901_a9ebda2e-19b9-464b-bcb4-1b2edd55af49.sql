-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Allow public conversation creation" ON conversations;

-- Create INSERT policy that allows anyone (all roles) to create conversations
CREATE POLICY "Allow public conversation creation"
ON conversations
FOR INSERT
WITH CHECK (true);