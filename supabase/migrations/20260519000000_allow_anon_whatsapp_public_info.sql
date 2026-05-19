-- Grant execute permission to anon for get_whatsapp_public_info so the chat widget can check WhatsApp status
GRANT EXECUTE ON FUNCTION public.get_whatsapp_public_info(uuid) TO anon;
