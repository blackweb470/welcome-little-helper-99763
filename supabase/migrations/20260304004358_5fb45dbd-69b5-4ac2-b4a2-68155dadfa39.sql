-- Add SELECT policy for team members to view businesses they belong to
CREATE POLICY "Team members can view their businesses"
ON public.businesses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.business_id = businesses.id
      AND team_members.user_id = auth.uid()
      AND team_members.status = 'active'
  )
);