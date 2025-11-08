-- Create team_members table for managing agents/staff per business
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('owner', 'admin', 'agent', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  permissions JSONB DEFAULT '{"can_chat": true, "can_view_analytics": false, "can_manage_settings": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(business_id, user_id)
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Business owners can view all team members
CREATE POLICY "Business owners can view team members"
ON public.team_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = team_members.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- Business owners can insert team members (invite)
CREATE POLICY "Business owners can invite team members"
ON public.team_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = team_members.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- Business owners can update team members
CREATE POLICY "Business owners can update team members"
ON public.team_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = team_members.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- Business owners can delete team members
CREATE POLICY "Business owners can delete team members"
ON public.team_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = team_members.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- Team members can view their own record
CREATE POLICY "Team members can view own record"
ON public.team_members
FOR SELECT
USING (auth.uid() = user_id);

-- Team members can update their own status (accept invitation)
CREATE POLICY "Team members can accept invitation"
ON public.team_members
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_team_members_business_id ON team_members(business_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_status ON team_members(status);

-- Add trigger for updated_at
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();