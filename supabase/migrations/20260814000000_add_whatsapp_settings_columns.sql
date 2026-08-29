-- Ensure all whatsapp_settings columns expected by the dashboard and edge functions exist
ALTER TABLE public.whatsapp_settings
  ADD COLUMN IF NOT EXISTS connection_method TEXT DEFAULT 'embedded_signup',
  ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS meta_business_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS connected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'meta';

-- Notify PostgREST to reload schema cache immediately
NOTIFY pgrst, 'reload schema';
