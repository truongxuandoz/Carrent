import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import BikeManagementScreen from '../BikeManagementScreen';
import * as adminService from '../../../services/adminService';
import * as bikeService from '../../../services/bikeService';
import * as imageUploadService from '../../../services/imageUploadService';

// Mock dependencies
jest.mock('../../../services/adminService');
jest.mock('../../../services/bikeService');
jest.mock('../../../services/imageUploadService');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
}));

jest.mock('../../../components/AddBikeModal', () => {
  const { View, TouchableOpacity } = require('react-native');
  return function MockAddBikeModal({ visible, onClose, onSubmit }: any) {
    return visible ? (
      <View testID="add-bike-modal">
        <TouchableOpacity testID="submit-new-bike" onPress={() => onSubmit(mockBikeData)} />
        <TouchableOpacity testID="close-add-modal" onPress={onClose} />
      </View>
    ) : null;
  };
});

jest.mock('../../../components/ImagePickerComponent', () => {
  const { View, TouchableOpacity, Text } = require('react-native');
  return function MockImagePickerComponent({ images, onImagesChange, onImageDataChange }: any) {
    return (
      <View testID="image-picker">
        <TouchableOpacity 
          testID="add-image" 
          onPress={() => {
            const newImages = [...images, 'file://test-image.jpg'];
            onImagesChange(newImages);
            onImageDataChange([{ uri: 'file://test-image.jpg', base64: 'test-base64' }]);
          }} 
        />
        <Text testID="image-count">{images.length}</Text>
      </View>
    );
  };
});

// Mock data
const mockBikeData = {
  id: '1',
  name: 'Honda Vision 2023',
  brand: 'Honda',
  model: 'Vision',
  year: 2023,
  type: 'scooter' as const,
  engineCapacity: 110,
  fuelType: 'gasoline' as const,
  transmission: 'automatic' as const,
  condition: 'available' as const,
  color: 'Red',
  licensePlate: '29A1-12345',
  pricePerDay: 200000,
  pricePerHour: 25000,
  location: 'Test Location',
  address: 'Test Address',
  description: 'Test Description',
  features: [],
  availability: true,
  rating: 4.5,
  totalRentals: 0,
  totalRevenue: 0,
  deposit: 500000,
  insurance: 100000,
  lastMaintenance: new Date().toISOString(),
  nextMaintenance: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  images: ['https://example.com/image1.jpg'],
};

const createMockBike = (overrides = {}) => ({
  ...mockBikeData,
  ...overrides,
});

const mockBikes = [
  createMockBike({
    id: '1',
    totalRentals: 5,
    totalRevenue: 1000000,
    images: ['https://example.com/image1.jpg'],
  }),
  createMockBike({
    id: '2',
    name: 'Yamaha Exciter',
    brand: 'Yamaha',
    model: 'Exciter',
    year: 2022,
    type: 'sport' as const,
    engineCapacity: 155,
    fuelType: 'gasoline' as const,
    transmission: 'manual' as const,
    condition: 'rented' as const,
    color: 'Blue',
    licensePlate: '30B2-67890',
    pricePerDay: 300000,
    totalRentals: 8,
    totalRevenue: 2400000,
    images: ['https://example.com/image2.jpg'],
  }),
];

describe('BikeManagementScreen', () => {
  const mockGetAllBikes = adminService.getAllBikes as jest.MockedFunction<typeof adminService.getAllBikes>;
  const mockCreateBike = adminService.createBike as jest.MockedFunction<typeof adminService.createBike>;
  const mockUpdateBike = adminService.updateBike as jest.MockedFunction<typeof adminService.updateBike>;
  const mockDeleteBike = adminService.deleteBike as jest.MockedFunction<typeof adminService.deleteBike>;
  const mockCreateBikeForAdmin = bikeService.bikeService.createBikeForAdmin as jest.MockedFunction<typeof bikeService.bikeService.createBikeForAdmin>;
  const mockUploadImageBinaryOnly = imageUploadService.imageUploadService.uploadImageBinaryOnly as jest.MockedFunction<typeof imageUploadService.imageUploadService.uploadImageBinaryOnly>;
  const mockUploadMultipleImagesWithBase64 = imageUploadService.imageUploadService.uploadMultipleImagesWithBase64 as jest.MockedFunction<typeof imageUploadService.imageUploadService.uploadMultipleImagesWithBase64>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAllBikes.mockResolvedValue({
      bikes: mockBikes,
      total: 2,
      hasMore: false,
    });
    
    // Mock Alert
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  describe('Initial Loading', () => {
    it('should load bikes on mount', async () => {
      render(<BikeManagementScreen />);
      
      await waitFor(() => {
        expect(mockGetAllBikes).toHaveBeenCalledWith(1, 20, '');
      });
    });

    it('should display bikes after loading', async () => {
      const { getByText } = render(<BikeManagementScreen />);
      
      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
        expect(getByText('Yamaha Exciter')).toBeTruthy();
      });
    });

    it('should handle loading error', async () => {
      mockGetAllBikes.mockRejectedValue(new Error('Network error'));
      
      render(<BikeManagementScreen />);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error Loading Bikes',
          expect.stringContaining('Failed to load bikes')
        );
      });
    });
  });

  describe('Filter Functionality', () => {
    it('should filter bikes by status', async () => {
      const { getByText } = render(<BikeManagementScreen />);
      
      await waitFor(() => {
        expect(getByText('available')).toBeTruthy();
      });

      fireEvent.press(getByText('available'));
      
      await waitFor(() => {
        expect(mockGetAllBikes).toHaveBeenCalledWith(1, 20, 'available');
      });
    });

    it('should show all bikes when "All" filter is selected', async () => {
      const { getByText } = render(<BikeManagementScreen />);
      
      await waitFor(() => {
        expect(getByText('All')).toBeTruthy();
      });

      fireEvent.press(getByText('All'));
      
      await waitFor(() => {
        expect(mockGetAllBikes).toHaveBeenCalledWith(1, 20, '');
      });
    });
  });

  describe('Add Bike Functionality', () => {
    it('should open add bike modal when add button is pressed', async () => {
      const { getByTestId } = render(<BikeManagementScreen />);
      
      await waitFor(() => {
        expect(getByTestId('add-button')).toBeTruthy();
      });

      fireEvent.press(getByTestId('add-button'));
      
      await waitFor(() => {
        expect(getByTestId('add-bike-modal')).toBeTruthy();
      });
    });

    it('should create new bike successfully', async () => {
      mockCreateBikeForAdmin.mockResolvedValue({ success: true, data: mockBikeData });
      
      const { getByTestId } = render(<BikeManagementScreen />);
      
      // Open add modal
      fireEvent.press(getByTestId('add-button'));
      
      await waitFor(() => {
        expect(getByTestId('add-bike-modal')).toBeTruthy();
      });

      // Submit new bike
      fireEvent.press(getByTestId('submit-new-bike'));
      
      await waitFor(() => {
        expect(mockCreateBikeForAdmin).toHaveBeenCalledWith(mockBikeData);
        expect(Alert.alert).toHaveBeenCalledWith('Thành công', 'Xe đã được thêm thành công!');
      });
    });

    it('should handle create bike error', async () => {
      mockCreateBikeForAdmin.mockResolvedValue({ 
        success: false, 
        error: 'Failed to create bike' 
      });
      
      const { getByTestId } = render(<BikeManagementScreen />);
      
      fireEvent.press(getByTestId('add-button'));
      fireEvent.press(getByTestId('submit-new-bike'));
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Lỗi',
          'Failed to create bike'
        );
      });
    });
  });

  describe('Edit Bike Functionality', () => {
    it('should open edit modal when edit button is pressed', async () => {
      const { getByText, getByTestId } = render(<BikeManagementScreen />);
      
      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
      });

      // Open bike detail modal
      fireEvent.press(getByText('Honda Vision'));
      
      await waitFor(() => {
        expect(getByText('Chỉnh sửa')).toBeTruthy();
      });

      // Press edit button
      fireEvent.press(getByText('Chỉnh sửa'));
      
      await waitFor(() => {
        expect(getByTestId('edit-modal')).toBeTruthy();
      });
    });

    it('should populate form with existing bike data', async () => {
      const { getByText, getByDisplayValue } = render(<BikeManagementScreen />);
      
      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
      });

      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Chỉnh sửa'));
      
      await waitFor(() => {
        expect(getByDisplayValue('Honda Vision 2023')).toBeTruthy();
        expect(getByDisplayValue('Honda')).toBeTruthy();
        expect(getByDisplayValue('Vision')).toBeTruthy();
        expect(getByDisplayValue('29A1-12345')).toBeTruthy();
      });
    });

    it('should update bike successfully', async () => {
      mockUpdateBike.mockResolvedValue(undefined);
      mockUploadImageBinaryOnly.mockResolvedValue({ 
        success: true, 
        url: 'https://example.com/new-image.jpg' 
      });
      
      const { getByText, getByTestId } = render(<BikeManagementScreen />);
      
      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
      });

      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Chỉnh sửa'));
      
      // Add new image
      fireEvent.press(getByTestId('add-image'));
      
      // Save changes
      fireEvent.press(getByText('Cập nhật xe'));
      
      await waitFor(() => {
        expect(mockUploadImageBinaryOnly).toHaveBeenCalled();
        expect(mockUpdateBike).toHaveBeenCalled();
        expect(Alert.alert).toHaveBeenCalledWith('Thành công', 'Đã cập nhật xe thành công!');
      });
    });
  });

  describe('Image Upload Functionality', () => {
    it('should upload new images when editing bike', async () => {
      mockUploadImageBinaryOnly.mockResolvedValue({ 
        success: true, 
        url: 'https://example.com/uploaded-image.jpg' 
      });
      mockUpdateBike.mockResolvedValue(undefined);
      
      const { getByText, getByTestId } = render(<BikeManagementScreen />);
      
      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
      });

      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Chỉnh sửa'));
      
      // Add new image
      fireEvent.press(getByTestId('add-image'));
      
      await waitFor(() => {
        expect(getByTestId('image-count')).toHaveTextContent('2'); // 1 existing + 1 new
      });

      // Save changes
      fireEvent.press(getByText('Cập nhật xe'));
      
      await waitFor(() => {
        expect(mockUploadImageBinaryOnly).toHaveBeenCalledWith(
          'file://test-image.jpg',
          expect.stringContaining('edit_1')
        );
      });
    });

    it('should fallback to base64 upload if binary upload fails', async () => {
      mockUploadImageBinaryOnly.mockResolvedValue({ success: false });
      mockUploadMultipleImagesWithBase64.mockResolvedValue(['https://example.com/fallback-image.jpg']);
      mockUpdateBike.mockResolvedValue(undefined);
      
      const { getByText, getByTestId } = render(<BikeManagementScreen />);
      
      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
      });

      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Chỉnh sửa'));
      fireEvent.press(getByTestId('add-image'));
      fireEvent.press(getByText('Cập nhật xe'));
      
      await waitFor(() => {
        expect(mockUploadImageBinaryOnly).toHaveBeenCalled();
        expect(mockUploadMultipleImagesWithBase64).toHaveBeenCalled();
      });
    });

    it('should handle image upload failure', async () => {
      mockUploadImageBinaryOnly.mockResolvedValue({ success: false });
      mockUploadMultipleImagesWithBase64.mockResolvedValue([]);
      
      const { getByText, getByTestId } = render(<BikeManagementScreen />);
      
      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
      });

      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Chỉnh sửa'));
      fireEvent.press(getByTestId('add-image'));
      fireEvent.press(getByText('Cập nhật xe'));
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Lỗi',
          'Không thể lưu thông tin xe. Vui lòng thử lại.'
        );
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields when saving bike', async () => {
      const { getByText, getByTestId, getByDisplayValue } = render(<BikeManagementScreen />);
      
      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
      });

      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Chỉnh sửa'));
      
      // Clear required field
      fireEvent.changeText(getByDisplayValue('Honda Vision 2023'), '');
      
      // Try to save
      fireEvent.press(getByText('Cập nhật xe'));
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Lỗi',
          'Vui lòng điền đầy đủ thông tin bắt buộc (Tên xe, Hãng, Model, Biển số)'
        );
      });
    });

    it('should not save bike if validation fails', async () => {
      const { getByText, getByDisplayValue } = render(<BikeManagementScreen />);
      
      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
      });

      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Chỉnh sửa'));
      
      // Clear all required fields
      fireEvent.changeText(getByDisplayValue('Honda Vision 2023'), '');
      fireEvent.changeText(getByDisplayValue('Honda'), '');
      fireEvent.changeText(getByDisplayValue('Vision'), '');
      fireEvent.changeText(getByDisplayValue('29A1-12345'), '');
      
      fireEvent.press(getByText('Cập nhật xe'));
      
      await waitFor(() => {
        expect(mockUpdateBike).not.toHaveBeenCalled();
      });
    });
  });

  describe('Delete Bike Functionality', () => {
    it('should show confirmation dialog when delete is pressed', async () => {
      const { getByText } = render(<BikeManagementScreen />);
      
      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
      });

      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Xóa'));
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Confirm Delete',
        'Are you sure you want to delete this bike? This action cannot be undone.',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel' }),
          expect.objectContaining({ text: 'Delete' }),
        ])
      );
    });

    it('should delete bike when confirmed', async () => {
      mockDeleteBike.mockResolvedValue(undefined);
      
      // Mock Alert.alert to automatically confirm deletion
      (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        const deleteButton = buttons?.find((btn: any) => btn.text === 'Delete');
        if (deleteButton) {
          deleteButton.onPress();
        }
      });
      
      const { getByText } = render(<BikeManagementScreen />);
      
      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
      });

      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Xóa'));
      
      await waitFor(() => {
        expect(mockDeleteBike).toHaveBeenCalledWith('1');
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Bike deleted successfully');
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh bike list when pull to refresh', async () => {
      const { getByTestId } = render(<BikeManagementScreen />);
      
      await waitFor(() => {
        expect(mockGetAllBikes).toHaveBeenCalledTimes(1);
      });

      // Simulate pull to refresh
      const flatList = getByTestId('bike-list');
      fireEvent(flatList, 'refresh');
      
      await waitFor(() => {
        expect(mockGetAllBikes).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Modal Management', () => {
    it('should close edit modal and reset form when close button is pressed', async () => {
      const { getByText, getByTestId, queryByTestId } = render(<BikeManagementScreen />);
      
      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
      });

      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Chỉnh sửa'));
      
      await waitFor(() => {
        expect(getByTestId('edit-modal')).toBeTruthy();
      });

      // Close modal
      fireEvent.press(getByTestId('close-edit-modal'));
      
      await waitFor(() => {
        expect(queryByTestId('edit-modal')).toBeNull();
      });
    });

    it('should reset form data when modal is closed', async () => {
      const { getByText, getByTestId, getByDisplayValue } = render(<BikeManagementScreen />);
      
      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
      });

      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Chỉnh sửa'));
      
      // Modify form data
      fireEvent.changeText(getByDisplayValue('Honda Vision 2023'), 'Modified Name');
      
      // Close and reopen modal
      fireEvent.press(getByTestId('close-edit-modal'));
      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Chỉnh sửa'));
      
      await waitFor(() => {
        expect(getByDisplayValue('Honda Vision 2023')).toBeTruthy(); // Should be reset
      });
    });
  });
});
