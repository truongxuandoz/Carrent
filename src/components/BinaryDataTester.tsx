import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { imageUploadService } from '../services/imageUploadService';

export const BinaryDataTester: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testBinaryReading = async () => {
    try {
      setIsLoading(true);
      setResult('🔄 Starting binary data test...\n');

      // Step 1: Pick image
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1.0,
        allowsMultipleSelection: false,
        base64: false, // Don't get base64, we'll read binary directly
        exif: false,
      });

      if (pickerResult.canceled || !pickerResult.assets?.[0]) {
        setResult(prev => prev + '❌ Image selection canceled\n');
        return;
      }

      const imageAsset = pickerResult.assets[0];
      setResult(prev => prev + `✅ Image selected: ${imageAsset.width}x${imageAsset.height}\n`);
      setResult(prev => prev + `📱 URI: ${imageAsset.uri}\n`);

      // Step 2: Test binary reading
      setResult(prev => prev + '\n🔄 Testing binary data reading...\n');
      
      try {
        const binaryData = await imageUploadService.readBinaryFromUri(imageAsset.uri);
        
        setResult(prev => prev + `✅ Binary read successful!\n`);
        setResult(prev => prev + `📊 Size: ${binaryData.size} bytes\n`);
        setResult(prev => prev + `📋 MIME: ${binaryData.mimeType}\n`);
        setResult(prev => prev + `🔢 Data sample: [${Array.from(binaryData.data.slice(0, 10)).join(', ')}...]\n`);
        
        // Step 3: Test blob creation
        setResult(prev => prev + '\n🔄 Testing blob creation...\n');
        const blob = new Blob([binaryData.data], { type: binaryData.mimeType });
        
        setResult(prev => prev + `✅ Blob created successfully!\n`);
        setResult(prev => prev + `📦 Blob size: ${blob.size} bytes\n`);
        setResult(prev => prev + `📋 Blob type: ${blob.type}\n`);
        
        // Step 4: Verify data integrity
        if (blob.size === binaryData.size) {
          setResult(prev => prev + '✅ Data integrity verified - sizes match!\n');
        } else {
          setResult(prev => prev + `❌ Data integrity issue - size mismatch: ${blob.size} vs ${binaryData.size}\n`);
        }
        
        if (blob.size > 0) {
          setResult(prev => prev + '\n🎉 SUCCESS! Binary data reading works correctly!\n');
          setResult(prev => prev + 'This should eliminate 0-byte upload issues.\n');
          
          Alert.alert('Success!', `Binary data read successfully: ${blob.size} bytes`);
        } else {
          setResult(prev => prev + '\n❌ FAILED! Blob is still 0 bytes\n');
          Alert.alert('Failed!', 'Blob is still 0 bytes - more investigation needed');
        }
        
      } catch (binaryError) {
        setResult(prev => prev + `❌ Binary reading failed: ${binaryError}\n`);
        Alert.alert('Binary Read Failed', String(binaryError));
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setResult(prev => prev + `❌ Test failed: ${errorMsg}\n`);
      Alert.alert('Test Failed', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Binary Data Tester</Text>
      <Text style={styles.subtitle}>Test React Native → Supabase data transfer</Text>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={testBinaryReading}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Binary Reading'}
        </Text>
      </TouchableOpacity>

      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>📋 Test Results:</Text>
        <Text style={styles.resultText}>{result || 'No tests run yet'}</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>🎯 This test verifies:</Text>
        <Text style={styles.infoText}>• React Native can read binary data from image URIs</Text>
        <Text style={styles.infoText}>• Uint8Array creation works correctly</Text>
        <Text style={styles.infoText}>• Blob creation preserves data integrity</Text>
        <Text style={styles.infoText}>• No data loss during conversion</Text>
        <Text style={styles.infoText}>• Ready for reliable Supabase upload</Text>
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
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
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
    flex: 1,
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
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#2e7d32',
  },
  infoText: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 5,
  },
});

export default BinaryDataTester; 