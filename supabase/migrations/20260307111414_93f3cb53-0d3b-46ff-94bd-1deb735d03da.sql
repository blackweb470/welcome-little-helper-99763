-- Replace the trigger function to not crash on missing app settings
CREATE OR REPLACE FUNCTION public.notify_team_member_removed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_business_name TEXT;
BEGIN
  -- Only proceed if it's a DELETE or status changed to 'deactivated'
  IF (TG_OP = 'DELETE') OR (TG_OP = 'UPDATE' AND NEW.status = 'deactivated' AND OLD.status != 'deactivated') THEN
    -- Log removal but don't block the operation
    -- The notification can be handled at the application level instead
    RAISE LOG 'Team member removed: user_id=%, business_id=%', OLD.user_id, OLD.business_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;