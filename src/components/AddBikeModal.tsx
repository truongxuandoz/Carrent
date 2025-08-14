import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
// Removed Picker import - using custom buttons for iOS compatibility
import ImagePickerComponent from './ImagePickerComponent';
import { imageUploadService } from '../services/imageUploadService';

interface BikeFormData {
  name: string;
  brand: string;
  model: string;
  year: number;
  type: 'scooter' | 'manual' | 'sport' | 'electric';
  engineCapacity: number;
  fuelType: 'gasoline' | 'electric';
  transmission: 'automatic' | 'manual';
  condition: 'available' | 'rented' | 'maintenance' | 'retired';
  color: string;
  licensePlate: string;
  pricePerDay: number;
  images: string[];
}

interface AddBikeModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (bikeData: BikeFormData) => Promise<void>;
}

export const AddBikeModal: React.FC<AddBikeModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<BikeFormData>({
    name: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    type: 'scooter',
    engineCapacity: 110,
    fuelType: 'gasoline',
    transmission: 'automatic',
    condition: 'available',
    color: '',
    licensePlate: '',
    pricePerDay: 0,
    images: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageDataList, setImageDataList] = useState<Array<{uri: string; base64?: string}>>([]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Tên xe là bắt buộc';
    if (!formData.brand.trim()) newErrors.brand = 'Hãng xe là bắt buộc';
    if (!formData.model.trim()) newErrors.model = 'Mẫu xe là bắt buộc';
    if (!formData.licensePlate.trim()) newErrors.licensePlate = 'Biển số là bắt buộc';
    if (!formData.color.trim()) newErrors.color = 'Màu xe là bắt buộc';
    if (formData.pricePerDay <= 0) newErrors.pricePerDay = 'Giá thuê/ngày phải > 0';
    if (formData.images.length === 0) newErrors.images = 'Cần ít nhất 1 ảnh xe';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Lỗi', 'Vui lòng kiểm tra lại thông tin đã nhập');
      return;
    }

    try {
      setIsSubmitting(true);

      // Generate temporary bike ID for image upload
      const tempBikeId = `temp_${Date.now()}`;
      
      // Upload images using OPTIMAL binary-first method
      console.log('🚀 Uploading images with OPTIMAL binary method...');
      console.log('📸 Images to upload:', formData.images.length);
      
      let uploadedImageUrls: string[] = [];
      
      if (formData.images.length > 0) {
        // PRIORITY 1: Pure binary upload (most efficient)
        const uploadPromises = formData.images.map((uri, index) => 
          imageUploadService.uploadImageBinaryOnly(uri, `${tempBikeId}_${index}`)
        );
        
        const results = await Promise.all(uploadPromises);
        uploadedImageUrls = results
          .filter(result => result.success)
          .map(result => result.url!)
          .filter(Boolean);
        
        console.log('🎯 Binary upload results:', uploadedImageUrls.length, 'successful');
        
        // FALLBACK: If binary fails, try with base64 data
        if (uploadedImageUrls.length === 0 && imageDataList.length > 0) {
          console.log('⚠️ Binary upload failed, trying base64 fallback...');
          uploadedImageUrls = await imageUploadService.uploadMultipleImagesWithBase64(
            imageDataList,
            tempBikeId
          );
        }
      }

      console.log('✅ OPTIMAL upload results:', uploadedImageUrls.length, 'successful uploads');
      console.log('🔗 Uploaded URLs:', uploadedImageUrls);

      if (uploadedImageUrls.length === 0) {
        throw new Error('Không thể upload ảnh với binary method. Vui lòng thử lại.');
      }

      // Submit form with uploaded image URLs
      const finalFormData = {
        ...formData,
        images: uploadedImageUrls,
      };

      await onSubmit(finalFormData);
      
      // Reset form
      setFormData({
        name: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        type: 'scooter',
        engineCapacity: 110,
        fuelType: 'gasoline',
        transmission: 'automatic',
        condition: 'available',
        color: '',
        licensePlate: '',
        pricePerDay: 0,
        images: [],
      });
      
      setErrors({});
      onClose();

    } catch (error) {
      console.error('❌ Error submitting bike:', error);
      Alert.alert(
        'Lỗi', 
        error instanceof Error ? error.message : 'Không thể thêm xe. Vui lòng thử lại.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof BikeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderTextInput = (
    field: keyof BikeFormData,
    label: string,
    placeholder: string,
    keyboardType?: 'default' | 'numeric' | 'email-address',
    multiline?: boolean
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea, errors[field] && styles.inputError]}
        value={String(formData[field])}
        onChangeText={(value) => updateFormData(field, keyboardType === 'numeric' ? Number(value) || 0 : value)}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const renderCustomSelect = (
    field: keyof BikeFormData,
    label: string,
    options: { label: string; value: string | number }[]
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.customSelectContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.selectOption,
              formData[field] === option.value && styles.selectedOption
            ]}
            onPress={() => updateFormData(field, option.value)}
          >
            <Text style={[
              styles.optionText,
              formData[field] === option.value && styles.selectedOptionText
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Thêm xe mới</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Lưu</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Images */}
          <ImagePickerComponent
            images={formData.images}
            onImagesChange={(images) => updateFormData('images', images)}
            onImageDataChange={setImageDataList}
            maxImages={5}
            disabled={isSubmitting}
          />
          {errors.images && <Text style={styles.errorText}>{errors.images}</Text>}

          {/* Basic Info */}
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          {renderTextInput('name', 'Tên xe *', 'VD: Honda Wave Alpha')}
          {renderTextInput('brand', 'Hãng xe *', 'VD: Honda')}
          {renderTextInput('model', 'Mẫu xe *', 'VD: Wave Alpha')}
          {renderTextInput('year', 'Năm sản xuất', 'VD: 2023', 'numeric')}
          {renderTextInput('licensePlate', 'Biển số *', 'VD: 59A1-12345')}
          {renderTextInput('color', 'Màu xe *', 'VD: Đỏ')}

          {/* Technical Specs */}
          <Text style={styles.sectionTitle}>Thông số kỹ thuật</Text>
          {renderCustomSelect('type', 'Loại xe', [
            { label: 'Xe tay ga', value: 'scooter' },
            { label: 'Xe số', value: 'manual' },
            { label: 'Xe thể thao', value: 'sport' },
            { label: 'Xe điện', value: 'electric' },
          ])}
          {renderTextInput('engineCapacity', 'Dung tích động cơ (cc)', 'VD: 110', 'numeric')}
          {renderCustomSelect('fuelType', 'Loại nhiên liệu', [
            { label: 'Xăng', value: 'gasoline' },
            { label: 'Điện', value: 'electric' },
          ])}
          {renderCustomSelect('transmission', 'Hộp số', [
            { label: 'Tự động', value: 'automatic' },
            { label: 'Số sàn', value: 'manual' },
          ])}
          {renderCustomSelect('condition', 'Trạng thái', [
            { label: 'Có sẵn', value: 'available' },
            { label: 'Đang thuê', value: 'rented' },
            { label: 'Bảo trì', value: 'maintenance' },
            { label: 'Ngừng hoạt động', value: 'retired' },
          ])}

          {/* Pricing */}
          <Text style={styles.sectionTitle}>Giá thuê</Text>
          {renderTextInput('pricePerDay', 'Giá thuê/ngày (VNĐ) *', 'VD: 200000', 'numeric')}

          {/* No other info needed */}

          {/* Bottom padding */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: Platform.OS === 'ios' ? 50 : 15,
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 25,
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  customSelectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectOption: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 3,
  },
  bottomPadding: {
    height: 50,
  },
});

export default AddBikeModal; 