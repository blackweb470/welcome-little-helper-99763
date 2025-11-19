-- Add logo_url column to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS logo_url TEXT;