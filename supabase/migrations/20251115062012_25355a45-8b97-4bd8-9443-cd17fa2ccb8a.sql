-- Add email column to team_members table so we can display it without RLS issues
ALTER TABLE team_members ADD COLUMN email TEXT;

-- Update existing records to populate email from profiles where possible
-- Note: This is a one-time update for existing data
UPDATE team_members tm
SET email = p.email
FROM profiles p
WHERE tm.user_id = p.id AND tm.email IS NULL;