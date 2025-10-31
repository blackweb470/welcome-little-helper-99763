-- Drop existing restrictive INSERT policy
DROP POLICY IF EXISTS "Anyone can create conversations" ON conversations;

-- Create a proper permissive INSERT policy that allows anyone to create conversations
CREATE POLICY "Allow public conversation creation"
ON conversations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Ensure existing SELECT policy allows business owners to view
-- (keeping existing policy as is)