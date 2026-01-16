-- Create table to link web widget conversations to WhatsApp conversations
CREATE TABLE public.conversation_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_code VARCHAR(8) NOT NULL UNIQUE,
  source_conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  target_conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  linked_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

-- Enable RLS
ALTER TABLE public.conversation_links ENABLE ROW LEVEL SECURITY;

-- Allow public read access for linking (webhook needs to read)
CREATE POLICY "Allow public read for linking" 
ON public.conversation_links 
FOR SELECT 
USING (true);

-- Allow public insert for creating links from widget
CREATE POLICY "Allow public insert for links" 
ON public.conversation_links 
FOR INSERT 
WITH CHECK (true);

-- Allow public update for linking conversations
CREATE POLICY "Allow public update for links" 
ON public.conversation_links 
FOR UPDATE 
USING (true);

-- Create index for faster lookup
CREATE INDEX idx_conversation_links_code ON public.conversation_links(link_code);
CREATE INDEX idx_conversation_links_source ON public.conversation_links(source_conversation_id);
CREATE INDEX idx_conversation_links_business ON public.conversation_links(business_id);