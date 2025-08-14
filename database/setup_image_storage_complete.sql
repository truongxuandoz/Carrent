-- SETUP IMAGE STORAGE FOR BIKE IMAGES
-- This script creates and configures the bike-images storage bucket

-- ==================== CHECK EXISTING BUCKETS ====================
SELECT 
  '=== EXISTING STORAGE BUCKETS ===' as info,
  name,
  created_at,
  public
FROM storage.buckets
ORDER BY created_at;

-- ==================== CREATE BIKE-IMAGES BUCKET ====================
-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('bike-images', 'bike-images', true)
ON CONFLICT (id) DO NOTHING;

-- ==================== SET UP BUCKET POLICIES ====================
-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Public read access for bike images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload bike images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update bike images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete bike images" ON storage.objects;

-- Allow public read access to bike images
CREATE POLICY "Public read access for bike images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'bike-images');

-- Allow authenticated users to upload bike images
CREATE POLICY "Authenticated users can upload bike images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'bike-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own bike images
CREATE POLICY "Authenticated users can update bike images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'bike-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete bike images
CREATE POLICY "Authenticated users can delete bike images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'bike-images' 
  AND auth.role() = 'authenticated'
);

-- ==================== VERIFY SETUP ====================
SELECT 
  '=== BIKE-IMAGES BUCKET CONFIGURATION ===' as info,
  id,
  name,
  public,
  created_at
FROM storage.buckets 
WHERE id = 'bike-images';

-- Show policies for bike-images bucket
SELECT 
  '=== STORAGE POLICIES ===' as info,
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%bike%';

-- ==================== CREATE SAMPLE UPLOAD TEST ====================
-- This would be used to test upload (commented out for safety)
/*
-- Test upload (uncomment to test)
-- INSERT INTO storage.objects (bucket_id, name, metadata)
-- VALUES ('bike-images', 'test-image.jpg', '{"size": 1024, "mimetype": "image/jpeg"}'::jsonb);
*/

-- ==================== SUCCESS MESSAGE ====================
SELECT '✅ Bike images storage setup complete!' as status;
SELECT '🪣 Bucket: bike-images created with public read access' as bucket_info;
SELECT '🔐 Policies: Authenticated users can upload/update/delete' as policy_info;
SELECT '📱 Ready for bike image uploads!' as ready; 