-- Create whatsapp_settings table for multi-tenant WhatsApp integration
CREATE TABLE public.whatsapp_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  phone_number_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  verify_token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  phone_number TEXT,
  waba_id TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id),
  UNIQUE(phone_number_id)
);

-- Add channel support to conversations table
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'web',
ADD COLUMN IF NOT EXISTS channel_metadata JSONB;

-- Create index for faster lookups
CREATE INDEX idx_whatsapp_settings_phone_number_id ON public.whatsapp_settings(phone_number_id);
CREATE INDEX idx_conversations_channel ON public.conversations(channel);

-- Enable RLS
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_settings
CREATE POLICY "Business owners can manage their WhatsApp settings"
ON public.whatsapp_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = whatsapp_settings.business_id
    AND b.owner_id = auth.uid()
  )
);

CREATE POLICY "Team members with settings permission can view WhatsApp settings"
ON public.whatsapp_settings
FOR SELECT
USING (
  public.has_business_permission(auth.uid(), business_id, 'can_manage_settings')
);

-- Trigger for updated_at
CREATE TRIGGER update_whatsapp_settings_updated_at
BEFORE UPDATE ON public.whatsapp_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();