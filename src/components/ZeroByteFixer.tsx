import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { imageUploadService } from '../services/imageUploadService';
import * as ImagePicker from 'expo-image-picker';

interface ImageData {
  uri: string;
  base64?: string;
  name?: string;
}

export const ZeroByteFixer: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');

  const selectAndUploadImage = async () => {
    try {
      setIsUploading(true);
      setLastResult('🔄 Starting image selection...');

      // Request permissions
      const hasPermission = await imageUploadService.requestPermissions();
      if (!hasPermission) {
        setLastResult('❌ Permission denied');
        return;
      }

      // Pick image with both URI and base64
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1.0, // Maximum quality
        allowsMultipleSelection: false,
        base64: true, // Get base64 data
        exif: false,
      });

      if (result.canceled || !result.assets?.[0]) {
        setLastResult('❌ Image selection canceled');
        return;
      }

      const imageAsset = result.assets[0];
      setLastResult(`✅ Image selected: ${imageAsset.width}x${imageAsset.height}`);

      // Generate test bike ID
      const testBikeId = `test_${Date.now()}`;

      // Method 1: Try URI upload first
      setLastResult(prev => prev + '\n🔄 Trying URI upload...');
      let uploadResult = await imageUploadService.uploadImage(imageAsset.uri, testBikeId);

      if (!uploadResult.success && imageAsset.base64) {
        // Method 2: Fallback to base64 upload
        setLastResult(prev => prev + '\n⚠️ URI upload failed, trying base64...');
        uploadResult = await imageUploadService.uploadImageFromBase64(imageAsset.base64, testBikeId);
      }

      if (uploadResult.success) {
        setLastResult(prev => prev + `\n✅ SUCCESS! URL: ${uploadResult.url}`);
        
        // Test the uploaded URL
        const testResult = await testUploadedImage(uploadResult.url!);
        setLastResult(prev => prev + `\n${testResult}`);
        
        Alert.alert('Success!', 'Image uploaded successfully. Check console for details.');
      } else {
        setLastResult(prev => prev + `\n❌ FAILED: ${uploadResult.error}`);
        Alert.alert('Failed!', uploadResult.error || 'Upload failed');
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setLastResult(prev => prev + `\n❌ EXCEPTION: ${errorMsg}`);
      Alert.alert('Error!', errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const testUploadedImage = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return `❌ Test failed: ${response.status} ${response.statusText}`;
      }

      const blob = await response.blob();
      return `✅ Test passed: ${blob.size} bytes, type: ${blob.type}`;
    } catch (error) {
      return `❌ Test error: ${error}`;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Zero Byte Image Fixer</Text>
      
      <TouchableOpacity 
        style={[styles.button, isUploading && styles.buttonDisabled]}
        onPress={selectAndUploadImage}
        disabled={isUploading}
      >
        <Text style={styles.buttonText}>
          {isUploading ? 'Uploading...' : 'Test Image Upload'}
        </Text>
      </TouchableOpacity>

      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>📋 Test Results:</Text>
        <Text style={styles.resultText}>{lastResult || 'No tests run yet'}</Text>
      </View>

          <View style={styles.infoContainer}>
      <Text style={styles.infoTitle}>⚠️ NOTE: Enhanced Upload Available!</Text>
      <Text style={styles.infoText}>• New binary data reading method implemented</Text>
      <Text style={styles.infoText}>• Should eliminate 0-byte issues completely</Text>
      <Text style={styles.infoText}>• Uses BinaryDataTester component for verification</Text>
      <Text style={styles.infoText}>• This tool is now for legacy debugging only</Text>
    </View>
    
    <View style={styles.infoContainer}>
      <Text style={styles.infoTitle}>ℹ️ This tool will:</Text>
      <Text style={styles.infoText}>• Select an image with max quality</Text>
      <Text style={styles.infoText}>• Try URI upload first</Text>
      <Text style={styles.infoText}>• Fallback to base64 if URI fails</Text>
      <Text style={styles.infoText}>• Test the uploaded file size</Text>
      <Text style={styles.infoText}>• Show detailed debug info</Text>
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    minHeight: 200,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  resultText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333',
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#1976d2',
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 5,
  },
});

export default ZeroByteFixer; 