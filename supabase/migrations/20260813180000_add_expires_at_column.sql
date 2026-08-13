-- Add expires_at column to whatsapp_settings table to support token expiration caching
ALTER TABLE whatsapp_settings ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
