-- CLEANUP ZERO BYTE FILES IN STORAGE
-- This script helps identify and remove corrupted 0-byte files

-- ==================== CHECK STORAGE OBJECTS ====================
SELECT 
  '=== BIKE IMAGES STORAGE ANALYSIS ===' as info;

-- List all files in bike-images bucket with metadata
SELECT 
  name,
  metadata->>'size' as file_size_bytes,
  metadata->>'mimetype' as mime_type,
  created_at,
  updated_at
FROM storage.objects 
WHERE bucket_id = 'bike-images'
ORDER BY created_at DESC
LIMIT 20;

-- ==================== IDENTIFY ZERO BYTE FILES ====================
SELECT 
  '=== ZERO BYTE FILES ===' as info;

-- Find files with 0 bytes
SELECT 
  name,
  metadata->>'size' as file_size_bytes,
  metadata->>'mimetype' as mime_type,
  created_at
FROM storage.objects 
WHERE bucket_id = 'bike-images'
  AND CAST(metadata->>'size' AS INTEGER) = 0
ORDER BY created_at DESC;

-- Count zero byte files
SELECT 
  'Total zero byte files:' as info,
  COUNT(*) as count
FROM storage.objects 
WHERE bucket_id = 'bike-images'
  AND CAST(metadata->>'size' AS INTEGER) = 0;

-- ==================== IDENTIFY LARGE FILES ====================
SELECT 
  '=== FILES LARGER THAN 5MB ===' as info;

-- Find unusually large files (possible corruption indicator)
SELECT 
  name,
  metadata->>'size' as file_size_bytes,
  ROUND(CAST(metadata->>'size' AS NUMERIC) / 1024 / 1024, 2) as file_size_mb,
  created_at
FROM storage.objects 
WHERE bucket_id = 'bike-images'
  AND CAST(metadata->>'size' AS INTEGER) > 5242880 -- 5MB
ORDER BY CAST(metadata->>'size' AS INTEGER) DESC;

-- ==================== SHOW RECENT UPLOADS ====================
SELECT 
  '=== RECENT UPLOADS (LAST 24 HOURS) ===' as info;

SELECT 
  name,
  metadata->>'size' as file_size_bytes,
  metadata->>'mimetype' as mime_type,
  created_at
FROM storage.objects 
WHERE bucket_id = 'bike-images'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- ==================== CLEANUP COMMANDS ====================
-- UNCOMMENT THESE LINES TO ACTUALLY DELETE ZERO BYTE FILES
-- ⚠️ WARNING: This will permanently delete files!

/*
-- Delete zero byte files older than 1 hour
DELETE FROM storage.objects 
WHERE bucket_id = 'bike-images'
  AND CAST(metadata->>'size' AS INTEGER) = 0
  AND created_at < NOW() - INTERVAL '1 hour';

-- Show how many files were deleted
SELECT 'Deleted zero byte files:' as info, ROW_COUNT() as deleted_count;
*/

-- ==================== BUCKET HEALTH CHECK ====================
SELECT 
  '=== BUCKET HEALTH SUMMARY ===' as info;

SELECT 
  'Total files:' as metric,
  COUNT(*) as value
FROM storage.objects 
WHERE bucket_id = 'bike-images'

UNION ALL

SELECT 
  'Zero byte files:' as metric,
  COUNT(*) as value
FROM storage.objects 
WHERE bucket_id = 'bike-images'
  AND CAST(metadata->>'size' AS INTEGER) = 0

UNION ALL

SELECT 
  'Valid files:' as metric,
  COUNT(*) as value
FROM storage.objects 
WHERE bucket_id = 'bike-images'
  AND CAST(metadata->>'size' AS INTEGER) > 0

UNION ALL

SELECT 
  'Total storage used (MB):' as metric,
  ROUND(SUM(CAST(metadata->>'size' AS NUMERIC)) / 1024 / 1024, 2) as value
FROM storage.objects 
WHERE bucket_id = 'bike-images';

-- ==================== RECOMMENDATIONS ====================
SELECT 
  '=== RECOMMENDATIONS ===' as info;

-- Show recommended actions based on findings
SELECT 
  CASE 
    WHEN zero_count > 0 THEN 
      '⚠️ Found ' || zero_count || ' zero-byte files. Consider deletion.'
    ELSE 
      '✅ No zero-byte files found.'
  END as recommendation
FROM (
  SELECT COUNT(*) as zero_count
  FROM storage.objects 
  WHERE bucket_id = 'bike-images'
    AND CAST(metadata->>'size' AS INTEGER) = 0
) stats; 