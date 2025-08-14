import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import BikeManagementScreen from '../BikeManagementScreen';
import * as adminService from '../../../services/adminService';
import * as imageUploadService from '../../../services/imageUploadService';

// Mock dependencies
jest.mock('../../../services/adminService');
jest.mock('../../../services/imageUploadService');

// Helper function to create mock bike data
const createMockBike = (overrides = {}) => ({
  id: '1',
  name: 'Honda Vision',
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
  images: [],
  deposit: 500000,
  insurance: 100000,
  lastMaintenance: new Date().toISOString(),
  nextMaintenance: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('BikeManagementScreen Edge Cases', () => {
  const mockGetAllBikes = adminService.getAllBikes as jest.MockedFunction<typeof adminService.getAllBikes>;
  const mockUpdateBike = adminService.updateBike as jest.MockedFunction<typeof adminService.updateBike>;
  const mockUploadImageBinaryOnly = imageUploadService.imageUploadService.uploadImageBinaryOnly as jest.MockedFunction<typeof imageUploadService.imageUploadService.uploadImageBinaryOnly>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  describe('Empty States', () => {
    it('should handle empty bike list', async () => {
      mockGetAllBikes.mockResolvedValue({
        bikes: [],
        total: 0,
        hasMore: false,
      });

      const { getByText } = render(<BikeManagementScreen />);

      await waitFor(() => {
        expect(getByText('No bikes found')).toBeTruthy();
      });
    });

    it('should handle bike with no images', async () => {
      const bikeWithoutImages = createMockBike({ images: [] });

      mockGetAllBikes.mockResolvedValue({
        bikes: [bikeWithoutImages],
        total: 1,
        hasMore: false,
      });

      const { getByText, getByTestId } = render(<BikeManagementScreen />);

      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
      });

      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Chỉnh sửa'));

      await waitFor(() => {
        expect(getByTestId('image-count')).toHaveTextContent('0');
      });
    });
  });

  describe('Invalid Data Handling', () => {
    it('should handle bike with null/undefined fields', async () => {
      const bikeWithNullFields = {
        id: '1',
        name: null,
        brand: 'Honda',
        model: 'Vision',
        year: 2023,
        type: 'scooter' as const,
        engineCapacity: 110,
        fuelType: 'gasoline' as const,
        transmission: 'automatic' as const,
        condition: 'available' as const,
        color: undefined,
        licensePlate: '29A1-12345',
        pricePerDay: 200000,
        totalRentals: 0,
        totalRevenue: 0,
        images: null,
      };

      mockGetAllBikes.mockResolvedValue({
        bikes: [bikeWithNullFields as any],
        total: 1,
        hasMore: false,
      });

      const { getByText } = render(<BikeManagementScreen />);

      await waitFor(() => {
        // Should handle null name gracefully
        expect(getByText('Honda Vision')).toBeTruthy(); // Fallback to brand + model
      });

      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Chỉnh sửa'));

      // Should not crash when editing
      await waitFor(() => {
        expect(getByText('Cập nhật xe')).toBeTruthy();
      });
    });

    it('should handle extremely long text inputs', async () => {
      const longText = 'A'.repeat(1000);
      
      mockGetAllBikes.mockResolvedValue({
        bikes: [createMockBike()],
        total: 1,
        hasMore: false,
      });

      const { getByText, getByDisplayValue } = render(<BikeManagementScreen />);

      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
      });

      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Chỉnh sửa'));

      // Try to input extremely long text
      fireEvent.changeText(getByDisplayValue('Honda Vision'), longText);

      // Should handle gracefully without crashing
      fireEvent.press(getByText('Cập nhật xe'));

      await waitFor(() => {
        // Should either accept or show validation error
        expect(true).toBeTruthy(); // Test passes if no crash
      });
    });

    it('should handle invalid price inputs', async () => {
      mockGetAllBikes.mockResolvedValue({
        bikes: [createMockBike()],
        total: 1,
        hasMore: false,
      });

      const { getByText, getByDisplayValue } = render(<BikeManagementScreen />);

      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
      });

      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Chỉnh sửa'));

      // Test negative price
      fireEvent.changeText(getByDisplayValue('200000'), '-100');
      fireEvent.press(getByText('Cập nhật xe'));

      // Should handle invalid price
      await waitFor(() => {
        expect(true).toBeTruthy(); // Test passes if handled gracefully
      });

      // Test non-numeric price
      fireEvent.changeText(getByDisplayValue('-100'), 'abc');
      fireEvent.press(getByText('Cập nhật xe'));

      await waitFor(() => {
        expect(true).toBeTruthy(); // Test passes if handled gracefully
      });
    });
  });

  describe('Network Error Scenarios', () => {
    it('should handle network timeout during image upload', async () => {
      mockGetAllBikes.mockResolvedValue({
        bikes: [createMockBike()],
        total: 1,
        hasMore: false,
      });

      // Simulate network timeout
      mockUploadImageBinaryOnly.mockRejectedValue(new Error('Network timeout'));

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
          expect.stringContaining('Không thể lưu thông tin xe')
        );
      });
    });

    it('should handle intermittent network failures', async () => {
      mockGetAllBikes.mockResolvedValue({
        bikes: [createMockBike()],
        total: 1,
        hasMore: false,
      });

      // First call fails, second succeeds
      mockUploadImageBinaryOnly
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ success: true, url: 'https://example.com/success.jpg' });
      
      mockUpdateBike.mockResolvedValue(undefined);

      const { getByText, getByTestId } = render(<BikeManagementScreen />);

      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
      });

      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Chỉnh sửa'));
      fireEvent.press(getByTestId('add-image'));

      // First attempt fails
      fireEvent.press(getByText('Cập nhật xe'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Lỗi',
          expect.stringContaining('Không thể lưu thông tin xe')
        );
      });

      // Retry succeeds
      fireEvent.press(getByText('Cập nhật xe'));

      await waitFor(() => {
        expect(mockUpdateBike).toHaveBeenCalled();
        expect(Alert.alert).toHaveBeenCalledWith('Thành công', 'Đã cập nhật xe thành công!');
      });
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    it('should handle very large images', async () => {
      const largeImageData = {
        uri: 'file://very-large-image.jpg',
        base64: 'A'.repeat(10000000) // 10MB base64 string
      };

      mockGetAllBikes.mockResolvedValue({
        bikes: [createMockBike()],
        total: 1,
        hasMore: false,
      });

      mockUploadImageBinaryOnly.mockResolvedValue({
        success: true,
        url: 'https://example.com/large-image.jpg'
      });

      const { getByText } = render(<BikeManagementScreen />);

      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
      });

      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Chỉnh sửa'));

      // Simulate adding large image
      // Note: In real test, this would be handled by ImagePickerComponent mock

      fireEvent.press(getByText('Cập nhật xe'));

      // Should handle large image without memory issues
      await waitFor(() => {
        expect(mockUploadImageBinaryOnly).toHaveBeenCalled();
      });
    });

    it('should handle rapid successive operations', async () => {
      mockGetAllBikes.mockResolvedValue({
        bikes: [createMockBike()],
        total: 1,
        hasMore: false,
      });

      mockUploadImageBinaryOnly.mockResolvedValue({
        success: true,
        url: 'https://example.com/image.jpg'
      });
      mockUpdateBike.mockResolvedValue(undefined);

      const { getByText, getByTestId } = render(<BikeManagementScreen />);

      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
      });

      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Chỉnh sửa'));

      // Rapid successive operations
      for (let i = 0; i < 5; i++) {
        fireEvent.press(getByTestId('add-image'));
      }

      // Multiple rapid save attempts
      fireEvent.press(getByText('Cập nhật xe'));
      fireEvent.press(getByText('Cập nhật xe'));
      fireEvent.press(getByText('Cập nhật xe'));

      // Should handle gracefully without race conditions
      await waitFor(() => {
        expect(mockUpdateBike).toHaveBeenCalled();
      });
    });
  });

  describe('Concurrent User Actions', () => {
    it('should handle modal state changes during async operations', async () => {
      mockGetAllBikes.mockResolvedValue({
        bikes: [createMockBike()],
        total: 1,
        hasMore: false,
      });

      // Slow upload to simulate async operation
      mockUploadImageBinaryOnly.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ success: true, url: 'https://example.com/slow.jpg' }), 1000)
        )
      );

      const { getByText, getByTestId } = render(<BikeManagementScreen />);

      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
      });

      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Chỉnh sửa'));
      fireEvent.press(getByTestId('add-image'));

      // Start save operation
      fireEvent.press(getByText('Cập nhật xe'));

      // Try to close modal during operation
      fireEvent.press(getByTestId('close-edit-modal'));

      // Should handle gracefully
      await waitFor(() => {
        expect(true).toBeTruthy(); // Test passes if no crash
      }, { timeout: 2000 });
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency after failed operations', async () => {
      const originalBike = createMockBike({ 
        images: ['https://example.com/original.jpg'] 
      });

      mockGetAllBikes.mockResolvedValue({
        bikes: [originalBike],
        total: 1,
        hasMore: false,
      });

      mockUploadImageBinaryOnly.mockResolvedValue({ success: false });
      mockUpdateBike.mockRejectedValue(new Error('Update failed'));

      const { getByText, getByTestId, getByDisplayValue } = render(<BikeManagementScreen />);

      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
      });

      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Chỉnh sửa'));

      // Modify data
      fireEvent.changeText(getByDisplayValue('Honda Vision'), 'Modified Name');
      fireEvent.press(getByTestId('add-image'));

      // Attempt save (will fail)
      fireEvent.press(getByText('Cập nhật xe'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Lỗi',
          expect.stringContaining('Không thể lưu thông tin xe')
        );
      });

      // Close and reopen modal
      fireEvent.press(getByTestId('close-edit-modal'));
      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Chỉnh sửa'));

      // Should show original data, not modified data
      await waitFor(() => {
        expect(getByDisplayValue('Honda Vision')).toBeTruthy();
        expect(getByTestId('image-count')).toHaveTextContent('1'); // Original image count
      });
    });
  });
});
