import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { imageUploadService } from '../services/imageUploadService';

export const StorageDebugger: React.FC = () => {
  const [testUrl, setTestUrl] = useState('https://snpvblyhwkmuobynfrfe.supabase.co/storage/v1/object/public/bike-images/bike_temp_1755037619563_1755037619603.jpg');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testImageUrl = async () => {
    setIsLoading(true);
    setDebugInfo('🔄 Testing image URL...\n');
    
    try {
      // Test 1: Basic fetch
      const response = await fetch(testUrl);
      setDebugInfo(prev => prev + `📡 Fetch status: ${response.status} ${response.statusText}\n`);
      setDebugInfo(prev => prev + `📋 Content-Type: ${response.headers.get('content-type')}\n`);
      setDebugInfo(prev => prev + `📊 Content-Length: ${response.headers.get('content-length')} bytes\n`);
      
      if (response.ok) {
        const blob = await response.blob();
        setDebugInfo(prev => prev + `📦 Blob size: ${blob.size} bytes\n`);
        setDebugInfo(prev => prev + `🏷️ Blob type: ${blob.type}\n`);
        
        if (blob.size === 0) {
          setDebugInfo(prev => prev + `❌ ERROR: File is empty (0 bytes)\n`);
        } else {
          setDebugInfo(prev => prev + `✅ File looks good!\n`);
        }
      } else {
        setDebugInfo(prev => prev + `❌ ERROR: Cannot access file\n`);
      }

      // Test 2: Binary data reading using our enhanced service
      try {
        const binaryData = await imageUploadService.readBinaryFromUri(testUrl);
        setDebugInfo(prev => prev + `\n🔍 Binary read result:\n`);
        setDebugInfo(prev => prev + `  Success: true\n`);
        setDebugInfo(prev => prev + `  Size: ${binaryData.size} bytes\n`);
        setDebugInfo(prev => prev + `  MIME: ${binaryData.mimeType}\n`);
      } catch (binaryError) {
        setDebugInfo(prev => prev + `\n🔍 Binary read result:\n`);
        setDebugInfo(prev => prev + `  Success: false\n`);
        setDebugInfo(prev => prev + `  Error: ${binaryError}\n`);
      }

    } catch (error) {
      setDebugInfo(prev => prev + `❌ EXCEPTION: ${error}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const testBucketPermissions = async () => {
    setIsLoading(true);
    setDebugInfo('🔄 Testing bucket permissions...\n');
    
    try {
      const bucketCheck = await imageUploadService.checkBucket();
      setDebugInfo(prev => prev + `🪣 Bucket check result: ${bucketCheck}\n`);
    } catch (error) {
      setDebugInfo(prev => prev + `❌ Bucket error: ${error}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔧 Storage Debugger</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>Test Image URL:</Text>
        <TextInput
          style={styles.input}
          value={testUrl}
          onChangeText={setTestUrl}
          placeholder="Enter image URL to test"
          multiline
        />
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.button}
            onPress={testImageUrl}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Test URL</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={testBucketPermissions}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Test Bucket</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>🖼️ Image Preview:</Text>
        <Image 
          source={{ uri: testUrl }}
          style={styles.imagePreview}
          onError={(error) => {
            Alert.alert('Image Error', 'Failed to load image');
            console.log('Image load error:', error);
          }}
          onLoad={() => {
            console.log('✅ Image loaded successfully');
          }}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>📋 Debug Information:</Text>
        <ScrollView style={styles.debugBox}>
          <Text style={styles.debugText}>{debugInfo || 'No debug info yet. Click "Test URL" to start.'}</Text>
        </ScrollView>
      </View>
    </ScrollView>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginBottom: 10,
    minHeight: 60,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  debugBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    maxHeight: 300,
  },
  debugText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333',
  },
});

export default StorageDebugger; 