
-- Create a secure function that visitors can call to check if WhatsApp is enabled
-- This avoids exposing the access_token column via RLS
CREATE OR REPLACE FUNCTION public.get_whatsapp_public_info(p_business_id UUID)
RETURNS TABLE(phone_number TEXT, enabled BOOLEAN) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ws.phone_number, ws.enabled
  FROM whatsapp_settings ws
  WHERE ws.business_id = p_business_id
    AND ws.enabled = true
  LIMIT 1;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_whatsapp_public_info(UUID) TO anon, authenticated;
