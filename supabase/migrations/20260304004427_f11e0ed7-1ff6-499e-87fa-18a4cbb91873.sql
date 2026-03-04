-- Allow business owners to view profiles of their team members
CREATE POLICY "Business owners can view team member profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.businesses b ON b.id = tm.business_id
    WHERE tm.user_id = profiles.id
      AND b.owner_id = auth.uid()
      AND tm.status = 'active'
  )
);