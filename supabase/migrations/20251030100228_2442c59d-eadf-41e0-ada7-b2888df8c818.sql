-- Create function to notify visitor when agent accepts
CREATE OR REPLACE FUNCTION notify_visitor_on_agent_accept()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id uuid;
  v_visitor_email text;
  v_business_id uuid;
  v_agent_name text;
BEGIN
  -- Only trigger when status changes to 'active'
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    -- Get conversation details
    SELECT c.id, c.visitor_email, c.business_id
    INTO v_conversation_id, v_visitor_email, v_business_id
    FROM conversations c
    WHERE c.id = NEW.conversation_id;
    
    -- Get agent name if available
    SELECT p.full_name INTO v_agent_name
    FROM profiles p
    WHERE p.id = NEW.agent_id;
    
    -- Only send notification if visitor provided email
    IF v_visitor_email IS NOT NULL THEN
      -- Call the send-notification edge function
      PERFORM
        net.http_post(
          url := current_setting('app.settings.supabase_url') || '/functions/v1/send-notification',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
          ),
          body := jsonb_build_object(
            'type', 'agent_accepted',
            'businessId', v_business_id,
            'data', jsonb_build_object(
              'conversationId', v_conversation_id,
              'visitorEmail', v_visitor_email,
              'agentName', COALESCE(v_agent_name, 'Support Team')
            )
          )
        );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_notify_visitor_on_agent_accept ON live_chat_sessions;
CREATE TRIGGER trigger_notify_visitor_on_agent_accept
  AFTER INSERT OR UPDATE OF status ON live_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION notify_visitor_on_agent_accept();