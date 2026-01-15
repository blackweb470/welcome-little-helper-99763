-- Add admin_phone_numbers to whatsapp_settings for admin management via WhatsApp
ALTER TABLE public.whatsapp_settings
ADD COLUMN IF NOT EXISTS admin_phone_numbers text[] DEFAULT '{}';

-- Add column comment for documentation
COMMENT ON COLUMN public.whatsapp_settings.admin_phone_numbers IS 'List of phone numbers that can manage the business via WhatsApp commands';