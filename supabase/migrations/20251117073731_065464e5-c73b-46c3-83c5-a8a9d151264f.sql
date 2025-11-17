-- Create a function to send team member removal notification
CREATE OR REPLACE FUNCTION public.notify_team_member_removed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_name TEXT;
  v_user_email TEXT;
  v_business_id UUID;
BEGIN
  -- Get the business_id from OLD record (for DELETE) or NEW record (for UPDATE)
  v_business_id := COALESCE(OLD.business_id, NEW.business_id);
  
  -- Only proceed if it's a DELETE or status changed to 'deactivated'
  IF (TG_OP = 'DELETE') OR (TG_OP = 'UPDATE' AND NEW.status = 'deactivated' AND OLD.status != 'deactivated') THEN
    
    -- Get business name
    SELECT name INTO v_business_name
    FROM businesses
    WHERE id = v_business_id;
    
    -- Get user email
    SELECT email INTO v_user_email
    FROM profiles
    WHERE id = OLD.user_id;
    
    -- Only send notification if we have valid email
    IF v_user_email IS NOT NULL THEN
      -- Call the send-notification edge function
      PERFORM net.http_post(
        url := current_setting('app.settings.supabase_url') || '/functions/v1/send-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := jsonb_build_object(
          'type', 'team_member_removed',
          'businessId', v_business_id,
          'data', jsonb_build_object(
            'userEmail', v_user_email,
            'businessName', v_business_name
          )
        )
      );
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$;

-- Create trigger for team member deletion/deactivation
DROP TRIGGER IF EXISTS trigger_notify_team_member_removed ON team_members;
CREATE TRIGGER trigger_notify_team_member_removed
  AFTER DELETE OR UPDATE OF status ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION notify_team_member_removed();