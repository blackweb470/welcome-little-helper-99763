-- Add max_input_characters column to widget_settings table
ALTER TABLE widget_settings 
ADD COLUMN max_input_characters integer DEFAULT 500 CHECK (max_input_characters >= 150 AND max_input_characters <= 1000);