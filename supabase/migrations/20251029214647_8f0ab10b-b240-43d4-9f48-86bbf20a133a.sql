-- Fix Security Issue #1: Remove public access to widget_settings
-- Only business owners should see full widget configuration
DROP POLICY IF EXISTS "Anyone can view widget settings" ON widget_settings;

-- Fix Security Issue #2: Remove public access to proactive_chat_rules  
-- Only business owners should manage rules
DROP POLICY IF EXISTS "Anyone can view enabled proactive rules" ON proactive_chat_rules;

-- Note: conversation_analytics is a view, not a table, so RLS policies cannot be applied to it
-- The view should be recreated with proper filtering or access should be controlled at the application level