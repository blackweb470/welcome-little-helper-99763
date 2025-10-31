-- Drop the trigger that's causing the configuration parameter error
DROP TRIGGER IF EXISTS trigger_notify_visitor_on_agent_accept ON live_chat_sessions;

-- Drop the function that requires the missing configuration parameters
DROP FUNCTION IF EXISTS notify_visitor_on_agent_accept();