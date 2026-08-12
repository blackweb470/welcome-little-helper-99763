-- Add columns to support Twilio OAuth 2.0 token refreshment
ALTER TABLE public.whatsapp_settings
ADD COLUMN IF NOT EXISTS refresh_token TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

COMMENT ON COLUMN public.whatsapp_settings.refresh_token IS 'OAuth 2.0 refresh token for renewing short-lived access tokens';
COMMENT ON COLUMN public.whatsapp_settings.expires_at IS 'Timestamp when the current access token expires';
