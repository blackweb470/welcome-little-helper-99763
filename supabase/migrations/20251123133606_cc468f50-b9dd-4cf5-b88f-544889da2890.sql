-- Create trigger function for updating timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create email templates table for customizable team invitation emails
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL DEFAULT 'team_invitation',
  subject TEXT NOT NULL DEFAULT 'Join our team',
  header_text TEXT,
  body_text TEXT,
  footer_text TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  button_text TEXT DEFAULT 'Accept Invitation',
  show_logo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, template_type)
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Allow business owners and team members to view templates
CREATE POLICY "Users can view their business email templates"
ON public.email_templates
FOR SELECT
USING (
  business_id IN (
    SELECT business_id FROM public.businesses WHERE owner_id = auth.uid()
    UNION
    SELECT business_id FROM public.team_members WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Allow business owners to manage templates
CREATE POLICY "Business owners can manage email templates"
ON public.email_templates
FOR ALL
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();