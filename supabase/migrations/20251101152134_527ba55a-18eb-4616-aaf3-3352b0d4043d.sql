-- =========================================
-- CRITICAL SECURITY FIXES - DO NOT SKIP
-- =========================================

-- 1. FIX CONVERSATIONS TABLE - Remove public access to customer PII
-- Drop the dangerous public insert policy
DROP POLICY IF EXISTS "Allow public conversation creation" ON conversations;

-- Only allow service role (edge functions) to create conversations
CREATE POLICY "Service role can create conversations"
ON conversations
FOR INSERT
TO service_role
WITH CHECK (true);

-- 2. FIX MESSAGES TABLE - Remove "OR true" that exposes all messages
DROP POLICY IF EXISTS "Allow viewing messages in conversations" ON messages;

-- Replace with proper business owner only access
CREATE POLICY "Business owners can view their messages"
ON messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN businesses b ON c.business_id = b.id
    WHERE c.id = messages.conversation_id
    AND b.owner_id = auth.uid()
  )
);

-- 3. FIX MESSAGE UPDATES - Remove "Anyone can mark messages as read"
DROP POLICY IF EXISTS "Anyone can mark messages as read" ON messages;

-- Allow only authenticated users in active conversations to mark messages read
CREATE POLICY "Authenticated users can mark messages read"
ON messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN businesses b ON c.business_id = b.id
    WHERE c.id = messages.conversation_id
    AND (b.owner_id = auth.uid() OR c.visitor_id IS NOT NULL)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN businesses b ON c.business_id = b.id
    WHERE c.id = messages.conversation_id
    AND (b.owner_id = auth.uid() OR c.visitor_id IS NOT NULL)
  )
);

-- 4. FIX WIDGET SETTINGS - Hide system prompts from public
DROP POLICY IF EXISTS "Public can view widget settings for embedding" ON widget_settings;

-- Create a view for public widget settings (without sensitive data)
CREATE OR REPLACE VIEW public_widget_settings AS
SELECT 
  id,
  business_id,
  welcome_message,
  agent_name,
  primary_color,
  widget_position,
  voice_enabled,
  pre_chat_enabled,
  pre_chat_welcome_message,
  pre_chat_required_fields
FROM widget_settings;

-- Grant public access to the view only
GRANT SELECT ON public_widget_settings TO anon, authenticated;

-- Keep full access for business owners
CREATE POLICY "Business owners view full widget settings"
ON widget_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = widget_settings.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- 5. FIX VISITOR SESSIONS - Ensure no public read access
-- Drop any existing public policies
DROP POLICY IF EXISTS "Anyone can insert sessions" ON visitor_sessions;

-- Replace with service role only for inserts
CREATE POLICY "Service role can insert sessions"
ON visitor_sessions
FOR INSERT
TO service_role
WITH CHECK (true);

-- 6. FIX VISITOR EVENTS - Ensure no public read access
DROP POLICY IF EXISTS "Anyone can insert events" ON visitor_events;

-- Replace with service role only
CREATE POLICY "Service role can insert events"
ON visitor_events
FOR INSERT
TO service_role
WITH CHECK (true);

-- 7. ADD MISSING DELETE POLICY FOR MESSAGES (business owners should be able to delete)
CREATE POLICY "Business owners can delete their messages"
ON messages
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN businesses b ON c.business_id = b.id
    WHERE c.id = messages.conversation_id
    AND b.owner_id = auth.uid()
  )
);

-- 8. FIX NOTIFICATION HISTORY - Add missing delete policy
CREATE POLICY "Users can delete own notifications"
ON notification_history
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);