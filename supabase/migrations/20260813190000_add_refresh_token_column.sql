-- Add refresh_token column to whatsapp_settings table to support token refresh flows
ALTER TABLE whatsapp_settings ADD COLUMN IF NOT EXISTS refresh_token TEXT DEFAULT NULL;
