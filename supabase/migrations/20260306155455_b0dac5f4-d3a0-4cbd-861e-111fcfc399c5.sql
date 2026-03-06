-- Allow users with pending invitations to see the business name
CREATE POLICY "Pending invitees can view business name"
ON public.businesses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.business_id = businesses.id
      AND team_members.status = 'pending'
      AND team_members.email IS NOT NULL
      AND lower(team_members.email) = lower((auth.jwt() ->> 'email'::text))
  )
);