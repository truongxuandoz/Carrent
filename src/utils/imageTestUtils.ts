/**
 * Utilities for testing and debugging image URLs
 */

export const testImageUrl = async (url: string) => {
  console.log('🔍 Testing image URL:', url);
  
  try {
    const response = await fetch(url);
    console.log('📡 Response status:', response.status, response.statusText);
    console.log('📋 Content-Type:', response.headers.get('content-type'));
    console.log('📊 Content-Length:', response.headers.get('content-length'), 'bytes');
    
    if (response.ok) {
      const blob = await response.blob();
      console.log('📦 Actual blob size:', blob.size, 'bytes');
      console.log('🏷️ Blob type:', blob.type);
      
      if (blob.size === 0) {
        console.error('❌ ERROR: File is empty (0 bytes)');
        return { success: false, error: 'File is empty' };
      } else {
        console.log('✅ File is valid!');
        return { success: true, size: blob.size, type: blob.type };
      }
    } else {
      console.error('❌ ERROR: Cannot access file');
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.error('❌ EXCEPTION:', error);
    return { success: false, error: String(error) };
  }
};

// Test specific URL from user
export const testSpecificUrl = () => {
  const url = 'https://snpvblyhwkmuobynfrfe.supabase.co/storage/v1/object/public/bike-images/bike_temp_1755037619563_1755037619603.jpg';
  return testImageUrl(url);
};

// Quick test function to run in console
export const quickTest = () => {
  console.log('🚀 Running quick image test...');
  testSpecificUrl().then(result => {
    console.log('🔍 Test result:', result);
  });
}; 