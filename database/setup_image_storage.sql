-- ==========================================
-- SUPABASE STORAGE SETUP FOR BIKE IMAGES
-- ==========================================

-- 1. Create storage bucket for bike images (if not exists)
-- Note: This needs to be run in Supabase Dashboard or via client
-- The bucket creation is handled automatically by imageUploadService.ts

-- 2. Create RLS policies for the bike-images bucket
-- Allow authenticated users to upload images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bike-images',
  'bike-images', 
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) 
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 3. Storage policies for bike-images bucket
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'bike-images');

-- Allow public read access to images
CREATE POLICY "Allow public downloads" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'bike-images');

-- Allow owners to update/delete their images
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'bike-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'bike-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Verify storage setup
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'bike-images';

-- 5. Test bucket permissions (optional - for debugging)
-- SELECT policy_name, bucket_id, roles
-- FROM storage.bucket_policies 
-- WHERE bucket_id = 'bike-images';

COMMIT; 