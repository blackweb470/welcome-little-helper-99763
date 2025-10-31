-- Create canned_responses table for agent productivity
CREATE TABLE IF NOT EXISTS canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  shortcut_key TEXT,
  created_by UUID REFERENCES profiles(id),
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE canned_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for canned_responses
CREATE POLICY "Business owners can view their canned responses"
  ON canned_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = canned_responses.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can insert canned responses"
  ON canned_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = canned_responses.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can update their canned responses"
  ON canned_responses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = canned_responses.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can delete their canned responses"
  ON canned_responses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = canned_responses.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_canned_responses_business_id ON canned_responses(business_id);
CREATE INDEX idx_canned_responses_category ON canned_responses(category);
CREATE INDEX idx_canned_responses_shortcut_key ON canned_responses(shortcut_key) WHERE shortcut_key IS NOT NULL;

-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- Create message_attachments table
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_attachments
CREATE POLICY "Business owners can view message attachments"
  ON message_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      JOIN businesses b ON c.business_id = b.id
      WHERE m.id = message_attachments.message_id
      AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can insert attachments"
  ON message_attachments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Storage policies for message-attachments bucket
CREATE POLICY "Business owners can view attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'message-attachments' AND
    EXISTS (
      SELECT 1 FROM message_attachments ma
      JOIN messages m ON ma.message_id = m.id
      JOIN conversations c ON m.conversation_id = c.id
      JOIN businesses b ON c.business_id = b.id
      WHERE storage.objects.name = ma.file_path
      AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can upload attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'message-attachments' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Business owners can delete attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'message-attachments' AND
    EXISTS (
      SELECT 1 FROM message_attachments ma
      JOIN messages m ON ma.message_id = m.id
      JOIN conversations c ON m.conversation_id = c.id
      JOIN businesses b ON c.business_id = b.id
      WHERE storage.objects.name = ma.file_path
      AND b.owner_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_message_attachments_message_id ON message_attachments(message_id);

-- Trigger to update updated_at on canned_responses
CREATE TRIGGER update_canned_responses_updated_at
  BEFORE UPDATE ON canned_responses
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();