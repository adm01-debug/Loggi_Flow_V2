
-- Drop existing overly permissive policies on documents bucket
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;

-- Recreate with proper ownership checks
CREATE POLICY "Documents: users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Documents: users can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Documents: users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Documents: users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1]);
