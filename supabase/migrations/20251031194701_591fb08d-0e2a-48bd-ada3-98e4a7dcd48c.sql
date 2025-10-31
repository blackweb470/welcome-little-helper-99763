-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  
  -- Channel preferences
  browser_enabled boolean DEFAULT true,
  email_enabled boolean DEFAULT true,
  sound_enabled boolean DEFAULT true,
  
  -- Event preferences
  notify_chat_transfer boolean DEFAULT true,
  notify_new_message boolean DEFAULT true,
  notify_new_conversation boolean DEFAULT true,
  notify_ticket_created boolean DEFAULT true,
  notify_ticket_resolved boolean DEFAULT true,
  notify_mention boolean DEFAULT true,
  
  -- Schedule preferences
  quiet_hours_enabled boolean DEFAULT false,
  quiet_hours_start time DEFAULT '22:00:00',
  quiet_hours_end time DEFAULT '08:00:00',
  
  -- Other preferences
  only_when_online boolean DEFAULT false,
  group_notifications boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, business_id)
);

-- Create notification_history table
CREATE TABLE IF NOT EXISTS public.notification_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  
  notification_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  
  -- Channels used
  sent_browser boolean DEFAULT false,
  sent_email boolean DEFAULT false,
  sent_sound boolean DEFAULT false,
  
  -- Status
  read boolean DEFAULT false,
  read_at timestamptz,
  clicked boolean DEFAULT false,
  clicked_at timestamptz,
  
  -- Related entities
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  
  -- Index for efficient queries
  CONSTRAINT valid_notification_type CHECK (
    notification_type IN (
      'chat_transfer',
      'new_message',
      'new_conversation',
      'ticket_created',
      'ticket_resolved',
      'mention',
      'system'
    )
  )
);

-- Create indexes
CREATE INDEX idx_notification_history_user_id ON public.notification_history(user_id);
CREATE INDEX idx_notification_history_business_id ON public.notification_history(business_id);
CREATE INDEX idx_notification_history_created_at ON public.notification_history(created_at DESC);
CREATE INDEX idx_notification_history_unread ON public.notification_history(user_id, read) WHERE read = false;

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_preferences
CREATE POLICY "Users can view own preferences"
  ON public.notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON public.notification_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for notification_history
CREATE POLICY "Users can view own notifications"
  ON public.notification_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notification_history
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications"
  ON public.notification_history
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Trigger to update updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to check if user should receive notification
CREATE OR REPLACE FUNCTION public.should_send_notification(
  p_user_id uuid,
  p_business_id uuid,
  p_notification_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefs record;
  v_agent_status text;
  v_current_time time;
BEGIN
  -- Get user preferences
  SELECT * INTO v_prefs
  FROM notification_preferences
  WHERE user_id = p_user_id AND business_id = p_business_id;
  
  -- If no preferences, allow all notifications
  IF v_prefs IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if only_when_online is enabled
  IF v_prefs.only_when_online THEN
    SELECT status INTO v_agent_status
    FROM agent_availability
    WHERE user_id = p_user_id AND business_id = p_business_id;
    
    IF v_agent_status != 'online' THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Check quiet hours
  IF v_prefs.quiet_hours_enabled THEN
    v_current_time := CURRENT_TIME;
    
    IF v_prefs.quiet_hours_start < v_prefs.quiet_hours_end THEN
      -- Normal range (e.g., 22:00 to 08:00 next day)
      IF v_current_time >= v_prefs.quiet_hours_start OR v_current_time <= v_prefs.quiet_hours_end THEN
        RETURN false;
      END IF;
    ELSE
      -- Spans midnight (e.g., 08:00 to 22:00)
      IF v_current_time >= v_prefs.quiet_hours_start AND v_current_time <= v_prefs.quiet_hours_end THEN
        RETURN false;
      END IF;
    END IF;
  END IF;
  
  -- Check notification type preferences
  RETURN CASE p_notification_type
    WHEN 'chat_transfer' THEN v_prefs.notify_chat_transfer
    WHEN 'new_message' THEN v_prefs.notify_new_message
    WHEN 'new_conversation' THEN v_prefs.notify_new_conversation
    WHEN 'ticket_created' THEN v_prefs.notify_ticket_created
    WHEN 'ticket_resolved' THEN v_prefs.notify_ticket_resolved
    WHEN 'mention' THEN v_prefs.notify_mention
    ELSE true
  END;
END;
$$;