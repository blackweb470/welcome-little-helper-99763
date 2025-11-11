-- Fix: Allow team members with can_chat permission to create and view conversations
-- This enables agents to use voice interface and handle chats

-- Drop existing restrictive policy if it exists
DROP POLICY IF EXISTS "Users can create conversations for their businesses" ON public.conversations;
DROP POLICY IF EXISTS "Users can view conversations for their businesses" ON public.conversations;
DROP POLICY IF EXISTS "Team members can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Team members can view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Team members can update conversations" ON public.conversations;

-- Create new policies that check business permissions
CREATE POLICY "Team members can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_business_permission(auth.uid(), business_id, 'can_chat')
  OR 
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE id = business_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Team members can view conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  public.has_business_permission(auth.uid(), business_id, 'can_chat')
  OR 
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE id = business_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Team members can update conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING (
  public.has_business_permission(auth.uid(), business_id, 'can_chat')
  OR 
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE id = business_id AND owner_id = auth.uid()
  )
)
WITH CHECK (
  public.has_business_permission(auth.uid(), business_id, 'can_chat')
  OR 
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE id = business_id AND owner_id = auth.uid()
  )
);

-- Also fix messages table RLS to allow team members to insert/view messages
DROP POLICY IF EXISTS "Users can create messages for conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages for conversations" ON public.messages;
DROP POLICY IF EXISTS "Team members can create messages" ON public.messages;
DROP POLICY IF EXISTS "Team members can view messages" ON public.messages;

CREATE POLICY "Team members can create messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id 
    AND (
      public.has_business_permission(auth.uid(), c.business_id, 'can_chat')
      OR 
      EXISTS (
        SELECT 1 FROM public.businesses 
        WHERE id = c.business_id AND owner_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Team members can view messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id 
    AND (
      public.has_business_permission(auth.uid(), c.business_id, 'can_chat')
      OR 
      EXISTS (
        SELECT 1 FROM public.businesses 
        WHERE id = c.business_id AND owner_id = auth.uid()
      )
    )
  )
);