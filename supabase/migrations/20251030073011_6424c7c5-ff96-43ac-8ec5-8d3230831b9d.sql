-- Enable realtime for live_chat_sessions table
ALTER TABLE live_chat_sessions REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE live_chat_sessions;