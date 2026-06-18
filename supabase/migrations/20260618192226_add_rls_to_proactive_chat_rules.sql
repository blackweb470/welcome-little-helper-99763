-- Enable RLS for proactive_chat_rules
ALTER TABLE proactive_chat_rules ENABLE ROW LEVEL SECURITY;

-- Allow public (anon) access to view proactive chat rules
-- This is necessary for the chat widget to fetch proactive chat rules for a business
CREATE POLICY "Public can view active proactive rules"
ON proactive_chat_rules
FOR SELECT
USING (enabled = true);
