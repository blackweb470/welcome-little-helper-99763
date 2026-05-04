UPDATE storage.buckets SET public = true WHERE id = 'message-attachments';

DROP POLICY IF EXISTS "Public can view message attachments" ON storage.objects;
CREATE POLICY "Public can view message attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'message-attachments');