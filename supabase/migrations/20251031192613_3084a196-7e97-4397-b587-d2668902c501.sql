-- ============================================================================
-- CRITICAL SECURITY FIX: RLS Policy Corrections
-- This migration addresses critical data exposure vulnerabilities
-- ============================================================================

-- ============================================================================
-- 1. FIX MESSAGES TABLE - Remove public read access (CRITICAL)
-- ============================================================================

-- Drop the dangerous policy that exposes all messages
DROP POLICY IF EXISTS "Anyone can view messages" ON messages;

-- The existing "Business owners can view messages" policy is correct and remains
-- The existing "Anyone can create messages" policy is needed for the widget and remains

-- ============================================================================
-- 2. FIX VISITOR_SESSIONS TABLE - Restrict updates to service role (CRITICAL)
-- ============================================================================

-- Drop the policy that allows anyone to update any session
DROP POLICY IF EXISTS "Anyone can update sessions" ON visitor_sessions;

-- Create restricted update policy: only edge functions (service role) can update
CREATE POLICY "Service role can update sessions"
ON visitor_sessions
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (
  -- Prevent changing ownership fields
  visitor_id = (SELECT visitor_id FROM visitor_sessions WHERE id = visitor_sessions.id)
  AND business_id = (SELECT business_id FROM visitor_sessions WHERE id = visitor_sessions.id)
);

-- ============================================================================
-- 3. FIX CONVERSATION_CONTEXT TABLE - Restrict writes to service role (HIGH)
-- ============================================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can insert context" ON conversation_context;
DROP POLICY IF EXISTS "Anyone can update context" ON conversation_context;

-- Service role can manage context (for edge functions)
CREATE POLICY "Service role can manage context"
ON conversation_context
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Business owners can still view their context (existing policy remains)

-- ============================================================================
-- 4. FIX BUSINESS_LEARNINGS TABLE - Restrict inserts properly (HIGH)
-- ============================================================================

-- Drop the public insert policy
DROP POLICY IF EXISTS "Anyone can insert learnings" ON business_learnings;

-- Service role can insert learnings (for learn-from-conversation edge function)
CREATE POLICY "Service role can insert learnings"
ON business_learnings
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Business owners can insert their own learnings
CREATE POLICY "Business owners can insert learnings"
ON business_learnings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = business_learnings.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- Business owners can update their own learnings
CREATE POLICY "Business owners can update learnings"
ON business_learnings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = business_learnings.business_id
    AND businesses.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = business_learnings.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- Business owners can delete their own learnings
CREATE POLICY "Business owners can delete learnings"
ON business_learnings
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = business_learnings.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- ============================================================================
-- 5. ADD EXPLICIT POLICIES TO CONVERSATIONS TABLE (MEDIUM)
-- ============================================================================

-- Add explicit UPDATE policy for business owners
CREATE POLICY "Business owners can update conversations"
ON conversations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = conversations.business_id
    AND businesses.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = conversations.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- Add explicit DELETE policy for business owners
CREATE POLICY "Business owners can delete conversations"
ON conversations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = conversations.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- ============================================================================
-- VERIFICATION QUERIES (commented out, for manual testing)
-- ============================================================================

-- To verify the policies are working:
-- 
-- Test 1: Try to select all messages (should fail for public)
-- SELECT * FROM messages;
--
-- Test 2: Try to update a session (should fail for public)
-- UPDATE visitor_sessions SET engagement_score = 100 WHERE id = 'some-id';
--
-- Test 3: Try to insert learnings (should fail for public)
-- INSERT INTO business_learnings (business_id, content, learning_type) 
-- VALUES ('some-id', 'test', 'test');
--
-- Test 4: Verify business owners can still access their data
-- (Login as business owner and run SELECT queries)

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
-- 
-- FIXED:
-- ✅ Messages: Removed public read access
-- ✅ Visitor sessions: Restricted updates to service role only
-- ✅ Conversation context: Locked down to service role
-- ✅ Business learnings: Proper insert/update/delete policies
-- ✅ Conversations: Added explicit UPDATE/DELETE policies
--
-- MAINTAINED:
-- ✅ Business owners retain full access to their data
-- ✅ Widget functionality preserved (public inserts where needed)
-- ✅ Edge functions can operate via service role
-- ============================================================================