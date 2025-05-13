-- RLS Policies for doctor-documents bucket
-- These policies should be executed in the Supabase SQL Editor

-- First, enable RLS on the storage.objects table if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to select (view) objects in the doctor-documents bucket
CREATE POLICY "Allow authenticated users to view doctor documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'doctor-documents');

-- Policy for authenticated users to insert objects into the doctor-documents bucket
CREATE POLICY "Allow authenticated users to upload doctor documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'doctor-documents');

-- Policy for authenticated users to update objects in the doctor-documents bucket
CREATE POLICY "Allow authenticated users to update doctor documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'doctor-documents');

-- Policy for authenticated users to delete objects from the doctor-documents bucket
CREATE POLICY "Allow authenticated users to delete doctor documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'doctor-documents');

-- Note: These policies allow any authenticated user to access all documents in the bucket.
-- For more granular control, you could add additional conditions based on user roles or ownership.
