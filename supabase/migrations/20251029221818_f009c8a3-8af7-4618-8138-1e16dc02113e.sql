-- Allow business owners to delete their own businesses
CREATE POLICY "Business owners can delete their businesses"
ON public.businesses
FOR DELETE
USING (auth.uid() = owner_id);