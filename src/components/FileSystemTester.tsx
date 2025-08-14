import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export const FileSystemTester: React.FC = () => {
  const [result, setResult] = useState<string>('');

  const testImageReading = async () => {
    try {
      setResult('🔄 Testing image reading methods...\n');

      // Pick image
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1.0,
        allowsMultipleSelection: false,
        base64: true, // Get base64 for fallback
        exif: false,
      });

      if (pickerResult.canceled || !pickerResult.assets?.[0]) {
        setResult(prev => prev + '❌ Image selection canceled\n');
        return;
      }

      const imageAsset = pickerResult.assets[0];
      setResult(prev => prev + `✅ Image selected: ${imageAsset.width}x${imageAsset.height}\n`);
      setResult(prev => prev + `📱 URI: ${imageAsset.uri}\n`);
      setResult(prev => prev + `📊 Has base64: ${!!imageAsset.base64}\n`);

      // Test Method 1: Direct fetch (current problematic method)
      setResult(prev => prev + '\n🔄 Method 1: Direct fetch...\n');
      try {
        const response = await fetch(imageAsset.uri);
        const blob = await response.blob();
        setResult(prev => prev + `📦 Fetch blob size: ${blob.size} bytes\n`);
        setResult(prev => prev + `📋 Fetch blob type: ${blob.type}\n`);
        
        if (blob.size === 0) {
          setResult(prev => prev + '❌ Fetch method produces 0 bytes!\n');
        } else {
          setResult(prev => prev + '✅ Fetch method works!\n');
        }
      } catch (fetchError) {
        setResult(prev => prev + `❌ Fetch error: ${fetchError}\n`);
      }

      // Test Method 2: Base64 conversion (backup method)
      if (imageAsset.base64) {
        setResult(prev => prev + '\n🔄 Method 2: Base64 conversion...\n');
        try {
          const base64Data = imageAsset.base64;
          setResult(prev => prev + `📊 Base64 length: ${base64Data.length} chars\n`);
          
          // Convert to blob
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/jpeg' });
          
          setResult(prev => prev + `📦 Base64 blob size: ${blob.size} bytes\n`);
          setResult(prev => prev + `📋 Base64 blob type: ${blob.type}\n`);
          
          if (blob.size === 0) {
            setResult(prev => prev + '❌ Base64 method also produces 0 bytes!\n');
          } else {
            setResult(prev => prev + '✅ Base64 method works!\n');
          }
        } catch (base64Error) {
          setResult(prev => prev + `❌ Base64 error: ${base64Error}\n`);
        }
      } else {
        setResult(prev => prev + '\n⚠️ No base64 data available\n');
      }

      // Test Method 3: Check if expo-file-system is available
      setResult(prev => prev + '\n🔄 Method 3: FileSystem availability...\n');
      try {
        // Try to import FileSystem
        const FileSystem = require('expo-file-system');
        setResult(prev => prev + '✅ expo-file-system is available\n');
        
        // Try to read file
        const fileInfo = await FileSystem.getInfoAsync(imageAsset.uri);
        setResult(prev => prev + `📊 File info: exists=${fileInfo.exists}, size=${fileInfo.size}\n`);
        
        if (fileInfo.exists && fileInfo.size > 0) {
          const base64Data = await FileSystem.readAsStringAsync(imageAsset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          setResult(prev => prev + `📊 FileSystem base64 length: ${base64Data.length} chars\n`);
          
          if (base64Data.length > 0) {
            setResult(prev => prev + '✅ FileSystem method should work!\n');
          } else {
            setResult(prev => prev + '❌ FileSystem returned empty data\n');
          }
        } else {
          setResult(prev => prev + '❌ File does not exist or is empty\n');
        }
      } catch (fsError) {
        setResult(prev => prev + `⚠️ expo-file-system not available: ${fsError}\n`);
        setResult(prev => prev + '💡 Need to install: expo install expo-file-system\n');
      }

    } catch (error) {
      setResult(prev => prev + `❌ Test failed: ${error}\n`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 FileSystem Tester</Text>
      
      <TouchableOpacity style={styles.button} onPress={testImageReading}>
        <Text style={styles.buttonText}>Test Image Reading Methods</Text>
      </TouchableOpacity>

      <View style={styles.resultContainer}>
        <Text style={styles.resultText}>{result || 'No tests run yet'}</Text>
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    flex: 1,
  },
  resultText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333',
  },
});

export default FileSystemTester; 