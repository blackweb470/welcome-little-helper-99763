-- Make user_id nullable to allow pending invitations
ALTER TABLE public.team_members 
ALTER COLUMN user_id DROP NOT NULL;

-- Add index for pending invitations lookup by email
CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email) WHERE status = 'pending';

-- Add a check to ensure either user_id is set OR (email is set AND status is pending)
ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_user_or_pending_check 
CHECK (
  user_id IS NOT NULL 
  OR 
  (email IS NOT NULL AND status = 'pending')
);