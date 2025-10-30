-- Enable realtime for messages table
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;