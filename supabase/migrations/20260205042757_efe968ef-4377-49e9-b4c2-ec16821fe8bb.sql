-- Fix team invitation acceptance (pending rows have user_id NULL, so existing policy blocks acceptance)

-- Replace policies that rely on user_id for pending invitations
DROP POLICY IF EXISTS "Team members can accept invitation" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view own record" ON public.team_members;

-- Allow invitees to view their pending invitation by matching auth email
CREATE POLICY "Team members can view own record"
ON public.team_members
FOR SELECT
USING (
  (auth.uid() = user_id)
  OR (
    status = 'pending'
    AND email IS NOT NULL
    AND lower(email) = lower((auth.jwt() ->> 'email'))
  )
);

-- Allow invitees to accept (UPDATE) their pending invitation by matching auth email,
-- and require that acceptance sets user_id to the authenticated user.
CREATE POLICY "Team members can accept invitation"
ON public.team_members
FOR UPDATE
USING (
  status = 'pending'
  AND email IS NOT NULL
  AND lower(email) = lower((auth.jwt() ->> 'email'))
)
WITH CHECK (
  status = 'active'
  AND auth.uid() = user_id
  AND email IS NOT NULL
  AND lower(email) = lower((auth.jwt() ->> 'email'))
);
