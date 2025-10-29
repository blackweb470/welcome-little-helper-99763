-- Create business_documents table
CREATE TABLE public.business_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  content_text TEXT,
  summary TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'processing',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_business_documents_business_id ON public.business_documents(business_id);
CREATE INDEX idx_business_documents_status ON public.business_documents(status);

-- Enable RLS
ALTER TABLE public.business_documents ENABLE ROW LEVEL SECURITY;

-- Business owners can manage their documents
CREATE POLICY "Business owners can manage their documents"
ON public.business_documents
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = business_documents.business_id
    AND businesses.owner_id = auth.uid()
  )
);

-- Create storage bucket for business documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-documents',
  'business-documents',
  false,
  20971520, -- 20MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'application/json'
  ]
);

-- Storage policies for business documents
CREATE POLICY "Business owners can upload documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'business-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM businesses WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Business owners can view their documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'business-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM businesses WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Business owners can delete their documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'business-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM businesses WHERE owner_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_business_documents_updated_at
BEFORE UPDATE ON public.business_documents
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();