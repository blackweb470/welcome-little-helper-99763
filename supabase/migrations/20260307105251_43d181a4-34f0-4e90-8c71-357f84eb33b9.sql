
-- Drop the problematic policy causing infinite recursion
DROP POLICY IF EXISTS "Pending invitees can view business name" ON public.businesses;

-- Create a SECURITY DEFINER function to get pending invitations with business names
CREATE OR REPLACE FUNCTION public.get_pending_invitations(_user_email text)
RETURNS TABLE (
  id uuid,
  business_id uuid,
  business_name text,
  role text,
  permissions jsonb,
  invited_at timestamptz,
  email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    tm.id,
    tm.business_id,
    b.name as business_name,
    tm.role,
    tm.permissions::jsonb,
    tm.invited_at,
    tm.email
  FROM public.team_members tm
  JOIN public.businesses b ON b.id = tm.business_id
  WHERE tm.status = 'pending'
    AND tm.email IS NOT NULL
    AND lower(tm.email) = lower(_user_email)
$$;
