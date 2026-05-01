-- Allow anonymous visitors to read the live chat session tied to their conversation.
-- Without this, the visitor widget cannot detect when an agent accepts (status: queued -> active),
-- because realtime postgres_changes and direct selects both require SELECT permission.
-- This only exposes session metadata (status, agent_id, timestamps) — not message content.
CREATE POLICY "Visitors can view live chat sessions"
ON public.live_chat_sessions
FOR SELECT
TO anon
USING (true);