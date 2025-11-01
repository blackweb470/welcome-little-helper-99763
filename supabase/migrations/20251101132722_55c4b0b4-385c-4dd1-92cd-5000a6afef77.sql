-- Enable realtime for notification_history table
ALTER TABLE public.notification_history REPLICA IDENTITY FULL;

-- Add notification_history to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_history;