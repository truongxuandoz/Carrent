/**
 * IMAGE UPLOAD SERVICE FOR SUPABASE STORAGE
 * Handles bike image uploads for admin users
 */

import { supabase } from '../config/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

class ImageUploadService {
  private bucketName = 'bike-images';

  /**
   * Request camera/gallery permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      // Request camera permission
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      
      // Request media library permission  
      const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus.status !== 'granted' || galleryStatus.status !== 'granted') {
        Alert.alert(
          'Quyền truy cập cần thiết',
          'Ứng dụng cần quyền truy cập camera và thư viện ảnh để upload hình xe.',
          [{ text: 'OK' }]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Pick image from gallery
   */
  async pickImageFromGallery(): Promise<ImagePicker.ImagePickerResult | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1.0, // Maximum quality to prevent data loss
        allowsMultipleSelection: false,
        base64: true, // Get base64 as backup
        exif: false, // Don't need EXIF data
      });

      return result;
    } catch (error) {
      console.error('❌ Error picking image:', error);
      return null;
    }
  }

  /**
   * Take photo with camera
   */
  async takePhotoWithCamera(): Promise<ImagePicker.ImagePickerResult | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1.0, // Maximum quality to prevent data loss
        base64: true, // Get base64 as backup
        exif: false, // Don't need EXIF data
      });

      return result;
    } catch (error) {
      console.error('❌ Error taking photo:', error);
      return null;
    }
  }

  /**
   * Show image picker options
   */
  async showImagePicker(): Promise<string | null> {
    return new Promise((resolve) => {
      Alert.alert(
        'Chọn ảnh xe',
        'Bạn muốn chọn ảnh từ đâu?',
        [
          {
            text: 'Hủy',
            onPress: () => resolve(null),
            style: 'cancel',
          },
          {
            text: 'Thư viện ảnh',
            onPress: async () => {
              const result = await this.pickImageFromGallery();
              if (result && !result.canceled && result.assets?.[0]) {
                resolve(result.assets[0].uri);
              } else {
                resolve(null);
              }
            },
          },
          {
            text: 'Chụp ảnh',
            onPress: async () => {
              const result = await this.takePhotoWithCamera();
              if (result && !result.canceled && result.assets?.[0]) {
                resolve(result.assets[0].uri);
              } else {
                resolve(null);
              }
            },
          },
        ]
      );
    });
  }

  /**
   * Read binary data from React Native URI using proper methods
   */
  async readBinaryFromUri(imageUri: string): Promise<{ data: Uint8Array; size: number; mimeType: string }> {
    console.log('🔍 Reading binary data from URI:', imageUri);
    
    try {
      // Method 1: Try FileSystem first (most reliable for RN)
      try {
        const FileSystem = require('expo-file-system');
        
        // Get file info first to validate
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        console.log('📊 FileSystem info:', fileInfo);
        
        if (!fileInfo.exists || fileInfo.size === 0) {
          throw new Error(`File does not exist or is empty: exists=${fileInfo.exists}, size=${fileInfo.size}`);
        }
        
        // Read as base64 then convert to binary
        const base64Data = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        if (!base64Data || base64Data.length === 0) {
          throw new Error('FileSystem returned empty base64 data');
        }
        
        console.log('📊 FileSystem base64 length:', base64Data.length, 'chars');
        
        // Convert base64 to Uint8Array
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        console.log('✅ FileSystem read successful:', bytes.length, 'bytes');
        
        return {
          data: bytes,
          size: bytes.length,
          mimeType: 'image/jpeg' // Default for FileSystem
        };
        
      } catch (fsError) {
        console.warn('⚠️ FileSystem failed:', fsError);
        
        // Method 2: XMLHttpRequest with arraybuffer (RN compatible)
        try {
          console.log('🔄 Trying XMLHttpRequest with arraybuffer...');
          
          const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function() {
              if (xhr.status === 200) {
                if (xhr.response.byteLength === 0) {
                  reject(new Error('XHR returned empty arraybuffer'));
                } else {
                  resolve(xhr.response);
                }
              } else {
                reject(new Error(`XHR failed: ${xhr.status}`));
              }
            };
            xhr.onerror = () => reject(new Error('XHR network error'));
            xhr.ontimeout = () => reject(new Error('XHR timeout'));
            xhr.timeout = 10000;
            xhr.responseType = 'arraybuffer';
            xhr.open('GET', imageUri, true);
            xhr.send(null);
          });
          
          const bytes = new Uint8Array(arrayBuffer);
          console.log('✅ XMLHttpRequest read successful:', bytes.length, 'bytes');
          
          return {
            data: bytes,
            size: bytes.length,
            mimeType: 'image/jpeg'
          };
          
        } catch (xhrError) {
          console.warn('⚠️ XMLHttpRequest failed:', xhrError);
          
          // Method 3: Fetch with arraybuffer (last resort)
          console.log('🔄 Trying fetch with arraybuffer...');
          
          const response = await fetch(imageUri);
          if (!response.ok) {
            throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
          }
          
          const arrayBuffer = await response.arrayBuffer();
          if (arrayBuffer.byteLength === 0) {
            throw new Error('Fetch returned empty arraybuffer');
          }
          
          const bytes = new Uint8Array(arrayBuffer);
          const mimeType = response.headers.get('content-type') || 'image/jpeg';
          
          console.log('✅ Fetch read successful:', bytes.length, 'bytes');
          
          return {
            data: bytes,
            size: bytes.length,
            mimeType
          };
        }
      }
      
    } catch (error) {
      console.error('❌ All binary reading methods failed:', error);
      throw new Error(`Cannot read binary data from URI: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Upload image to Supabase Storage with robust validation
   */
  async uploadImage(imageUri: string, bikeId: string, retryCount = 0): Promise<UploadResult> {
    const maxRetries = 2;
    
    try {
      console.log(`🔄 Uploading image (attempt ${retryCount + 1}/${maxRetries + 1})...`);
      console.log('📱 Image URI:', imageUri);

      // Step 1: Read binary data from URI (this validates and reads in one step)
      console.log('🔍 Step 1: Reading binary data from URI...');
      const binaryData = await this.readBinaryFromUri(imageUri);
      console.log('✅ Binary data read successful:', binaryData.size, 'bytes');

      // Create unique filename
      const timestamp = Date.now();
      const fileName = `bike_${bikeId}_${timestamp}.jpg`;

      // Step 2: Upload binary data directly to Supabase Storage
      console.log('🔄 Step 2: Uploading binary data to storage bucket:', this.bucketName);
      console.log('📦 Upload size:', binaryData.size, 'bytes');
      
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, binaryData.data, {
          contentType: binaryData.mimeType,
          cacheControl: '3600', // Cache for 1 hour
          upsert: false
        });

      if (error) {
        console.error('❌ Storage upload error:', error);
        throw new Error(`Storage upload failed: ${error.message}`);
      }

      console.log('✅ Upload successful:', data);

      // Step 3: Verify upload by checking file size
      console.log('🔄 Step 3: Verifying upload...');
      const { data: fileInfo, error: infoError } = await supabase.storage
        .from(this.bucketName)
        .list('', {
          search: fileName
        });

      if (infoError) {
        console.warn('⚠️ Could not verify upload:', infoError.message);
      } else if (fileInfo && fileInfo.length > 0) {
        const uploadedFile = fileInfo[0];
        console.log('📊 Uploaded file info:', uploadedFile);
        
        if (uploadedFile.metadata?.size === 0) {
          throw new Error('❌ CRITICAL: File was uploaded but has 0 bytes in storage!');
        }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      console.log('✅ Image uploaded successfully:', urlData.publicUrl);

      return {
        success: true,
        url: urlData.publicUrl
      };

    } catch (error) {
      console.error(`❌ Upload attempt ${retryCount + 1} failed:`, error);
      
      // Retry logic for certain types of errors
      if (retryCount < maxRetries) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Retry on network or temporary errors
        if (errorMessage.includes('fetch') || 
            errorMessage.includes('timeout') || 
            errorMessage.includes('network') ||
            errorMessage.includes('AbortError')) {
          console.log(`🔄 Retrying upload (${retryCount + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Progressive delay
          return this.uploadImage(imageUri, bikeId, retryCount + 1);
        }
      }
      
      // Final error handling
      let errorMessage = 'Upload failed after all attempts';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  /**
   * Upload image using base64 data (alternative method)
   */
  async uploadImageFromBase64(base64Data: string, bikeId: string): Promise<UploadResult> {
    try {
      console.log('🔄 Uploading image from base64...');
      
      // Remove data URI prefix if present
      const base64Clean = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Convert base64 to blob
      const byteCharacters = atob(base64Clean);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      
      console.log('📊 Base64 blob size:', blob.size, 'bytes');
      
      if (blob.size === 0) {
        throw new Error('Base64 conversion resulted in empty blob');
      }
      
      // Create unique filename
      const timestamp = Date.now();
      const fileName = `bike_${bikeId}_${timestamp}.jpg`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Storage upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      console.log('✅ Base64 upload successful:', urlData.publicUrl);

      return {
        success: true,
        url: urlData.publicUrl
      };

    } catch (error) {
      console.error('❌ Base64 upload failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Base64 upload failed'
      };
    }
  }

  /**
   * Upload image using base64 data directly (most reliable method)
   */
  async uploadImageDirectBase64(base64Data: string, bikeId: string): Promise<UploadResult> {
    try {
      console.log('🔄 Direct base64 upload...');
      
      if (!base64Data || base64Data.length === 0) {
        throw new Error('Base64 data is empty');
      }
      
      console.log('📊 Base64 length:', base64Data.length, 'characters');
      
      // Remove data URI prefix if present
      const base64Clean = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Convert base64 to Uint8Array for direct upload
      const byteCharacters = atob(base64Clean);
      const byteArray = new Uint8Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
      
      console.log('📦 Direct base64 binary size:', byteArray.length, 'bytes');
      
      if (byteArray.length === 0) {
        throw new Error('Base64 conversion resulted in empty binary data');
      }
      
      // Create filename
      const timestamp = Date.now();
      const fileName = `bike_${bikeId}_${timestamp}.jpg`;
      
      // Upload binary data directly (no Blob creation)
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, byteArray, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Storage upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      console.log('✅ Direct base64 upload successful:', urlData.publicUrl);

      return {
        success: true,
        url: urlData.publicUrl
      };

    } catch (error) {
      console.error('❌ Direct base64 upload failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Direct base64 upload failed'
      };
    }
  }

  /**
   * OPTIMAL: Pure binary upload method (no base64, maximum efficiency)
   */
  async uploadImageBinaryOnly(imageUri: string, bikeId: string): Promise<UploadResult> {
    try {
      console.log('🚀 OPTIMAL binary upload - no base64 overhead');
      console.log('📱 Image URI:', imageUri);

      // Read pure binary data
      const binaryData = await this.readBinaryFromUri(imageUri);
      console.log('✅ Binary data read:', binaryData.size, 'bytes');

      // Create filename
      const timestamp = Date.now();
      const fileName = `bike_${bikeId}_${timestamp}.jpg`;
      
      // Direct binary upload (0% overhead)
      console.log('🔄 Direct binary upload to Supabase...');
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, binaryData.data, {
          contentType: binaryData.mimeType,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Binary upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      console.log('✅ OPTIMAL binary upload successful:', urlData.publicUrl);

      return {
        success: true,
        url: urlData.publicUrl
      };

    } catch (error) {
      console.error('❌ Binary upload failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Binary upload failed'
      };
    }
  }

  /**
   * Upload multiple images with optimized binary-first strategy
   */
  async uploadMultipleImagesWithBase64(imageData: Array<{uri: string; base64?: string}>, bikeId: string): Promise<string[]> {
    console.log(`🔄 Optimized binary upload of ${imageData.length} images...`);
    
    const uploadPromises = imageData.map(async (data, index) => {
      console.log(`🔄 Uploading image ${index + 1}/${imageData.length}...`);
      
      // PRIORITY 1: Direct binary from URI (most efficient)
      console.log(`📱 Using optimized binary method for image ${index + 1}`);
      try {
        return await this.uploadImage(data.uri, `${bikeId}_${index}`);
      } catch (uriError) {
        console.warn(`⚠️ URI method failed for image ${index + 1}:`, uriError);
        
        // FALLBACK: Base64 method (only if URI fails)
        if (data.base64) {
          console.log(`📱 Fallback to base64 method for image ${index + 1}`);
          return this.uploadImageDirectBase64(data.base64, `${bikeId}_${index}`);
        }
        
        throw uriError;
      }
    });
    
    const results = await Promise.all(uploadPromises);
    
    const successfulUrls = results
      .filter(result => result.success)
      .map(result => result.url!)
      .filter(Boolean);

    console.log(`✅ Binary-first upload: ${successfulUrls.length}/${imageData.length} successful`);
    
    return successfulUrls;
  }

  /**
   * Upload multiple images (legacy method - direct URI upload)
   */
  async uploadMultipleImages(imageUris: string[], bikeId: string): Promise<string[]> {
    console.log(`🔄 Legacy upload of ${imageUris.length} images...`);
    
    // Upload images directly without pre-validation
    // (validation happens inside uploadImage method)
    const uploadPromises = imageUris.map((uri, index) => 
      this.uploadImage(uri, `${bikeId}_${index}`)
    );
    
    const results = await Promise.all(uploadPromises);
    
    const successfulUrls = results
      .filter(result => result.success)
      .map(result => result.url!)
      .filter(Boolean);

    const failedCount = results.length - successfulUrls.length;
    if (failedCount > 0) {
      console.warn(`⚠️ ${failedCount}/${results.length} uploads failed`);
    }

    console.log(`✅ Legacy upload: ${successfulUrls.length}/${imageUris.length} successful`);
    
    return successfulUrls;
  }

  /**
   * Delete image from Storage (for cleanup)
   */
  async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      // Extract filename from URL
      const fileName = imageUrl.split('/').pop();
      if (!fileName) return false;

      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([fileName]);

      if (error) {
        console.error('❌ Delete error:', error);
        return false;
      }

      console.log('✅ Image deleted successfully:', fileName);
      return true;

    } catch (error) {
      console.error('❌ Delete exception:', error);
      return false;
    }
  }

  /**
   * Check if storage bucket exists (simplified - no creation)
   */
  async checkBucket(): Promise<boolean> {
    try {
      // Just check if bucket exists, don't try to create
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.warn('⚠️ Cannot check buckets:', listError.message);
        return true; // Assume it exists and proceed
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.bucketName);
      
      if (bucketExists) {
        console.log('✅ Storage bucket exists:', this.bucketName);
      } else {
        console.warn('⚠️ Storage bucket may not exist:', this.bucketName);
        console.log('💡 Please create bucket manually in Supabase Dashboard');
      }

      return true; // Continue regardless

    } catch (error) {
      console.warn('⚠️ Bucket check warning:', error);
      return true; // Continue regardless
    }
  }
}

export const imageUploadService = new ImageUploadService();

// Note: Bucket will be checked on first upload 