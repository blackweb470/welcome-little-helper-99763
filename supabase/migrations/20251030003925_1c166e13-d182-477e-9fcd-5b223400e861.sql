-- Fix widget_settings RLS policies for embedded widget support
-- Allow public read access for embedded widgets
CREATE POLICY "Public can view widget settings for embedding"
  ON public.widget_settings FOR SELECT
  USING (true);

-- Allow business owners to insert widget settings
CREATE POLICY "Business owners can insert widget settings"
  ON public.widget_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE businesses.id = widget_settings.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );