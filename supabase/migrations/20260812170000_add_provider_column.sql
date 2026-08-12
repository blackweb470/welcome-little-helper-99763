-- Migration to ensure whatsapp_settings table has provider column
ALTER TABLE whatsapp_settings ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'meta';
