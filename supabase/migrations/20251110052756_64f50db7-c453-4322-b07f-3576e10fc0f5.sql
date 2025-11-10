-- Allow public (unauthenticated) read access to widget_settings for embedded widgets
CREATE POLICY "Public can view widget settings"
ON public.widget_settings
FOR SELECT
TO anon
USING (true);

-- Create function to check team member permissions
CREATE OR REPLACE FUNCTION public.has_business_permission(_user_id uuid, _business_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm
    JOIN public.businesses b ON b.id = tm.business_id
    WHERE tm.user_id = _user_id
      AND tm.business_id = _business_id
      AND tm.status = 'active'
      AND (
        -- Business owner has all permissions
        b.owner_id = _user_id
        OR
        -- Check specific permission in permissions jsonb
        (tm.permissions->>_permission)::boolean = true
      )
  )
$$;

-- Create function to get user's businesses (owned or team member)
CREATE OR REPLACE FUNCTION public.get_user_businesses(_user_id uuid)
RETURNS TABLE (
  business_id uuid,
  business_name text,
  is_owner boolean,
  role text,
  permissions jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Get owned businesses
  SELECT 
    b.id as business_id,
    b.name as business_name,
    true as is_owner,
    'owner'::text as role,
    '{"can_chat": true, "can_view_analytics": true, "can_manage_settings": true}'::jsonb as permissions
  FROM public.businesses b
  WHERE b.owner_id = _user_id
  
  UNION ALL
  
  -- Get team member businesses
  SELECT 
    tm.business_id,
    b.name as business_name,
    false as is_owner,
    tm.role,
    tm.permissions
  FROM public.team_members tm
  JOIN public.businesses b ON b.id = tm.business_id
  WHERE tm.user_id = _user_id
    AND tm.status = 'active'
$$;