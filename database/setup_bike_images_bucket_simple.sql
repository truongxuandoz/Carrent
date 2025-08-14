-- SIMPLE BIKE IMAGES BUCKET SETUP
-- This script creates the bike-images bucket with basic permissions

-- Create the bucket (public access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('bike-images', 'bike-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Public read access for bike images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload for bike images" ON storage.objects;

-- Allow public read access to bike images
CREATE POLICY "Public read access for bike images"
ON storage.objects FOR SELECT
USING (bucket_id = 'bike-images');

-- Allow authenticated users to upload bike images  
CREATE POLICY "Authenticated upload for bike images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'bike-images' 
  AND auth.role() = 'authenticated'
);

-- Verify bucket was created
SELECT 'Bucket created successfully:' as status, * 
FROM storage.buckets 
WHERE id = 'bike-images'; 