import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import BikeManagementScreen from '../BikeManagementScreen';
import * as adminService from '../../../services/adminService';
import * as imageUploadService from '../../../services/imageUploadService';

// Mock dependencies
jest.mock('../../../services/adminService');
jest.mock('../../../services/bikeService');
jest.mock('../../../services/imageUploadService');

// Integration test data
const mockBikeWithImages = {
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
  totalRentals: 5,
  totalRevenue: 1000000,
  images: [
    'https://example.com/existing-image1.jpg',
    'https://example.com/existing-image2.jpg'
  ],
};

describe('BikeManagementScreen Integration Tests', () => {
  const mockGetAllBikes = adminService.getAllBikes as jest.MockedFunction<typeof adminService.getAllBikes>;
  const mockUpdateBike = adminService.updateBike as jest.MockedFunction<typeof adminService.updateBike>;
  const mockUploadImageBinaryOnly = imageUploadService.imageUploadService.uploadImageBinaryOnly as jest.MockedFunction<typeof imageUploadService.imageUploadService.uploadImageBinaryOnly>;
  const mockUploadMultipleImagesWithBase64 = imageUploadService.imageUploadService.uploadMultipleImagesWithBase64 as jest.MockedFunction<typeof imageUploadService.imageUploadService.uploadMultipleImagesWithBase64>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAllBikes.mockResolvedValue({
      bikes: [mockBikeWithImages],
      total: 1,
      hasMore: false,
    });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  describe('Complete Edit Bike with Image Upload Flow', () => {
    it('should handle complete edit flow with new image upload', async () => {
      // Setup successful image upload
      mockUploadImageBinaryOnly.mockResolvedValue({
        success: true,
        url: 'https://example.com/new-uploaded-image.jpg'
      });
      mockUpdateBike.mockResolvedValue(undefined);

      const { getByText, getByTestId, getByDisplayValue } = render(<BikeManagementScreen />);

      // Wait for bikes to load
      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
      });

      // Open bike details
      fireEvent.press(getByText('Honda Vision'));

      // Start editing
      await waitFor(() => {
        expect(getByText('Chỉnh sửa')).toBeTruthy();
      });
      fireEvent.press(getByText('Chỉnh sửa'));

      // Verify form is populated with existing data
      await waitFor(() => {
        expect(getByDisplayValue('Honda Vision 2023')).toBeTruthy();
        expect(getByDisplayValue('Honda')).toBeTruthy();
        expect(getByDisplayValue('29A1-12345')).toBeTruthy();
      });

      // Modify bike data
      fireEvent.changeText(getByDisplayValue('Honda Vision 2023'), 'Honda Vision 2023 Updated');
      fireEvent.changeText(getByDisplayValue('200000'), '250000');

      // Add new image
      fireEvent.press(getByTestId('add-image'));

      // Verify image count increased
      await waitFor(() => {
        expect(getByTestId('image-count')).toHaveTextContent('3'); // 2 existing + 1 new
      });

      // Save changes
      fireEvent.press(getByText('Cập nhật xe'));

      // Verify image upload was called
      await waitFor(() => {
        expect(mockUploadImageBinaryOnly).toHaveBeenCalledWith(
          'file://test-image.jpg',
          expect.stringContaining('edit_1')
        );
      });

      // Verify bike update was called with correct data
      await waitFor(() => {
        expect(mockUpdateBike).toHaveBeenCalledWith('1', expect.objectContaining({
          name: 'Honda Vision 2023 Updated',
          pricePerDay: 250000,
          images: expect.arrayContaining([
            'https://example.com/existing-image1.jpg',
            'https://example.com/existing-image2.jpg',
            'https://example.com/new-uploaded-image.jpg'
          ])
        }));
      });

      // Verify success message
      expect(Alert.alert).toHaveBeenCalledWith('Thành công', 'Đã cập nhật xe thành công!');
    });

    it('should handle mixed success/failure in image uploads', async () => {
      // Setup mixed upload results
      mockUploadImageBinaryOnly
        .mockResolvedValueOnce({ success: true, url: 'https://example.com/success1.jpg' })
        .mockResolvedValueOnce({ success: false })
        .mockResolvedValueOnce({ success: true, url: 'https://example.com/success2.jpg' });
      
      mockUploadMultipleImagesWithBase64.mockResolvedValue(['https://example.com/fallback.jpg']);
      mockUpdateBike.mockResolvedValue(undefined);

      const { getByText, getByTestId } = render(<BikeManagementScreen />);

      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
      });

      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Chỉnh sửa'));

      // Add multiple new images
      fireEvent.press(getByTestId('add-image'));
      fireEvent.press(getByTestId('add-image'));
      fireEvent.press(getByTestId('add-image'));

      fireEvent.press(getByText('Cập nhật xe'));

      // Verify fallback upload was called for failed images
      await waitFor(() => {
        expect(mockUploadImageBinaryOnly).toHaveBeenCalledTimes(3);
        expect(mockUploadMultipleImagesWithBase64).toHaveBeenCalled();
      });

      // Verify bike was updated with successful uploads
      await waitFor(() => {
        expect(mockUpdateBike).toHaveBeenCalledWith('1', expect.objectContaining({
          images: expect.arrayContaining([
            'https://example.com/existing-image1.jpg',
            'https://example.com/existing-image2.jpg',
            'https://example.com/success1.jpg',
            'https://example.com/success2.jpg',
            'https://example.com/fallback.jpg'
          ])
        }));
      });
    });

    it('should handle complete image upload failure gracefully', async () => {
      // Setup complete upload failure
      mockUploadImageBinaryOnly.mockResolvedValue({ success: false });
      mockUploadMultipleImagesWithBase64.mockResolvedValue([]);

      const { getByText, getByTestId } = render(<BikeManagementScreen />);

      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
      });

      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Chỉnh sửa'));

      // Add new image
      fireEvent.press(getByTestId('add-image'));

      // Try to save
      fireEvent.press(getByText('Cập nhật xe'));

      // Verify error handling
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Lỗi',
          'Không thể lưu thông tin xe. Vui lòng thử lại.'
        );
      });

      // Verify bike update was not called
      expect(mockUpdateBike).not.toHaveBeenCalled();
    });
  });

  describe('Form State Management', () => {
    it('should maintain form state during image operations', async () => {
      mockUploadImageBinaryOnly.mockResolvedValue({
        success: true,
        url: 'https://example.com/uploaded.jpg'
      });

      const { getByText, getByTestId, getByDisplayValue } = render(<BikeManagementScreen />);

      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
      });

      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Chỉnh sửa'));

      // Modify form data
      fireEvent.changeText(getByDisplayValue('Honda Vision 2023'), 'Modified Name');
      fireEvent.changeText(getByDisplayValue('Red'), 'Blue');

      // Add image
      fireEvent.press(getByTestId('add-image'));

      // Verify form data is still modified
      expect(getByDisplayValue('Modified Name')).toBeTruthy();
      expect(getByDisplayValue('Blue')).toBeTruthy();

      // Verify image was added
      await waitFor(() => {
        expect(getByTestId('image-count')).toHaveTextContent('3');
      });
    });

    it('should reset form when modal is closed and reopened', async () => {
      const { getByText, getByTestId, getByDisplayValue, queryByDisplayValue } = render(<BikeManagementScreen />);

      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
      });

      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Chỉnh sửa'));

      // Modify form
      fireEvent.changeText(getByDisplayValue('Honda Vision 2023'), 'Modified Name');
      fireEvent.press(getByTestId('add-image'));

      // Close modal
      fireEvent.press(getByTestId('close-edit-modal'));

      // Reopen modal
      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Chỉnh sửa'));

      // Verify form is reset
      await waitFor(() => {
        expect(getByDisplayValue('Honda Vision 2023')).toBeTruthy();
        expect(queryByDisplayValue('Modified Name')).toBeNull();
        expect(getByTestId('image-count')).toHaveTextContent('2'); // Back to original count
      });
    });
  });

  describe('Error Recovery', () => {
    it('should allow retry after image upload failure', async () => {
      // First attempt fails
      mockUploadImageBinaryOnly.mockResolvedValueOnce({ success: false });
      mockUploadMultipleImagesWithBase64.mockResolvedValueOnce([]);

      // Second attempt succeeds
      mockUploadImageBinaryOnly.mockResolvedValueOnce({
        success: true,
        url: 'https://example.com/retry-success.jpg'
      });
      mockUpdateBike.mockResolvedValue(undefined);

      const { getByText, getByTestId } = render(<BikeManagementScreen />);

      await waitFor(() => {
        expect(getByText('Honda Vision')).toBeTruthy();
      });

      fireEvent.press(getByText('Honda Vision'));
      fireEvent.press(getByText('Chỉnh sửa'));
      fireEvent.press(getByTestId('add-image'));

      // First save attempt (should fail)
      fireEvent.press(getByText('Cập nhật xe'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Lỗi',
          'Không thể lưu thông tin xe. Vui lòng thử lại.'
        );
      });

      // Retry (should succeed)
      fireEvent.press(getByText('Cập nhật xe'));

      await waitFor(() => {
        expect(mockUpdateBike).toHaveBeenCalled();
        expect(Alert.alert).toHaveBeenCalledWith('Thành công', 'Đã cập nhật xe thành công!');
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle large number of images efficiently', async () => {
      const manyImages = Array.from({ length: 10 }, (_, i) => 
        `https://example.com/image${i}.jpg`
      );

      const bikeWithManyImages = {
        ...mockBikeWithImages,
        images: manyImages
      };

      mockGetAllBikes.mockResolvedValue({
        bikes: [bikeWithManyImages],
        total: 1,
        hasMore: false,
      });

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

      // Verify all images are loaded
      await waitFor(() => {
        expect(getByTestId('image-count')).toHaveTextContent('10');
      });

      // Add one more image
      fireEvent.press(getByTestId('add-image'));

      await waitFor(() => {
        expect(getByTestId('image-count')).toHaveTextContent('11');
      });

      // Save should handle all images
      fireEvent.press(getByText('Cập nhật xe'));

      await waitFor(() => {
        expect(mockUpdateBike).toHaveBeenCalledWith('1', expect.objectContaining({
          images: expect.arrayContaining([
            ...manyImages,
            'https://example.com/new-image.jpg'
          ])
        }));
      });
    });
  });
});
