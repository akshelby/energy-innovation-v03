
-- Create a public storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs', 'pdfs', true);

-- Allow anyone to read PDFs
CREATE POLICY "Public read access for pdfs"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'pdfs');

-- Allow authenticated users to upload/manage PDFs
CREATE POLICY "Authenticated users can upload pdfs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pdfs');

CREATE POLICY "Authenticated users can update pdfs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'pdfs');

CREATE POLICY "Authenticated users can delete pdfs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'pdfs');
