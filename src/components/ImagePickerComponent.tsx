import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { imageUploadService } from '../services/imageUploadService';
import { getSafeImageSource, handleImageError } from '../utils/placeholderImage';

interface ImageData {
  uri: string;
  base64?: string;
}

interface ImagePickerComponentProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
  // New prop to handle base64 data
  onImageDataChange?: (imageData: ImageData[]) => void;
}

const { width } = Dimensions.get('window');
const imageSize = (width - 60) / 3; // 3 images per row with padding

export const ImagePickerComponent: React.FC<ImagePickerComponentProps> = ({
  images,
  onImagesChange,
  maxImages = 5,
  disabled = false,
  onImageDataChange,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [imageDataList, setImageDataList] = useState<ImageData[]>([]);

  const handleAddImage = async () => {
    if (disabled || isUploading || images.length >= maxImages) return;

    try {
      setIsUploading(true);
      
      // Get image with base64 data for better upload reliability
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1.0, // Maximum quality
        allowsMultipleSelection: false,
        base64: true, // Get base64 for reliable upload
        exif: false,
      });
      
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const imageData: ImageData = {
          uri: asset.uri,
          base64: asset.base64 || undefined,
        };
        
        // Update both URI list (for display) and data list (for upload)
        const newImages = [...images, asset.uri];
        const newImageDataList = [...imageDataList, imageData];
        
        onImagesChange(newImages);
        setImageDataList(newImageDataList);
        
        // Notify parent component of new image data
        if (onImageDataChange) {
          onImageDataChange(newImageDataList);
        }
        
        console.log('✅ Image added with base64:', {
          uri: asset.uri,
          hasBase64: !!asset.base64,
          base64Length: asset.base64?.length || 0
        });
      }
    } catch (error) {
      console.error('❌ Error adding image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    if (disabled) return;
    
    const newImages = images.filter((_, i) => i !== index);
    const newImageDataList = imageDataList.filter((_, i) => i !== index);
    
    onImagesChange(newImages);
    setImageDataList(newImageDataList);
    
    // Notify parent component
    if (onImageDataChange) {
      onImageDataChange(newImageDataList);
    }
  };

  const renderAddButton = () => {
    if (images.length >= maxImages) return null;

    return (
      <TouchableOpacity
        style={[styles.imageContainer, styles.addButton]}
        onPress={handleAddImage}
        disabled={disabled || isUploading}
      >
        {isUploading ? (
          <ActivityIndicator color="#007AFF" size="small" />
        ) : (
          <>
            <MaterialIcons name="add-a-photo" size={32} color="#007AFF" />
            <Text style={styles.addButtonText}>Thêm ảnh</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  const renderImageItem = (imageUri: string, index: number) => (
    <View key={index} style={styles.imageContainer}>
      <Image
        source={getSafeImageSource(imageUri, 'bike')}
        style={styles.image}
        onError={() => handleImageError('bike')}
      />
      {!disabled && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveImage(index)}
        >
          <MaterialIcons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      )}
      {index === 0 && (
        <View style={styles.primaryBadge}>
          <Text style={styles.primaryText}>Chính</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Ảnh xe ({images.length}/{maxImages})
      </Text>
      <Text style={styles.subtitle}>
        Ảnh đầu tiên sẽ là ảnh chính của xe
      </Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {renderAddButton()}
        {images.map((imageUri, index) => renderImageItem(imageUri, index))}
      </ScrollView>
      
      {images.length === 0 && (
        <View style={styles.emptyState}>
          <MaterialIcons name="photo-library" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Chưa có ảnh nào</Text>
          <Text style={styles.emptySubtext}>Nhấn "Thêm ảnh" để bắt đầu</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  scrollContainer: {
    paddingHorizontal: 5,
  },
  imageContainer: {
    width: imageSize,
    height: imageSize,
    marginHorizontal: 5,
    borderRadius: 8,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  addButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 5,
    textAlign: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginTop: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
});

export default ImagePickerComponent; 