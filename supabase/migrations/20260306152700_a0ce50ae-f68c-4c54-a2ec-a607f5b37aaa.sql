
-- Create a security definer function to check team membership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_team_member_of_business(_user_id uuid, _business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE user_id = _user_id
      AND business_id = _business_id
      AND status = 'active'
  )
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Team members can view their businesses" ON public.businesses;

-- Recreate using the security definer function (no recursion)
CREATE POLICY "Team members can view their businesses"
ON public.businesses
FOR SELECT
USING (
  public.is_team_member_of_business(auth.uid(), id)
);
