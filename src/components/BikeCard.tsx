import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);

export interface BikeCardProps {
  bike: {
    id: string;
    name: string;
    brand: string;
    model: string;
    engineCapacity: number;
    pricePerDay: number;
    pricePerHour?: number;
    condition: 'available' | 'rented' | 'maintenance' | 'retired';
    images: string[];
    rating?: number;
    totalRentals?: number;
    discount?: number;
  };
  onPress: () => void;
  onRentPress?: () => void;
  showActions?: boolean;
}

const BikeCard: React.FC<BikeCardProps> = ({
  bike,
  onPress,
  onRentPress,
  showActions = true,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getConditionBadge = () => {
    switch (bike.condition) {
      case 'available':
        return <Badge text="Còn xe" variant="success" size="small" />;
      case 'rented':
        return <Badge text="Đã thuê" variant="warning" size="small" />;
      case 'maintenance':
        return <Badge text="Bảo trì" variant="error" size="small" />;
      case 'retired':
        return <Badge text="Ngừng hoạt động" variant="neutral" size="small" />;
      default:
        return <Badge text="Không xác định" variant="neutral" size="small" />;
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={16} color="#FF6A00" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={16} color="#FF6A00" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={16} color="#CBD5E1" />
      );
    }

    return stars;
  };

  return (
    <Card onPress={onPress} className="mb-4" padding="none">
      <StyledView className="relative">
        {/* Image with 16:9 aspect ratio */}
        <StyledView className="relative">
          <StyledImage
            source={{ 
              uri: bike.images[0] || 'https://via.placeholder.com/400x225/E5E7EB/9CA3AF?text=No+Image'
            }}
            className="w-full h-48 rounded-t-card"
            resizeMode="cover"
          />
          
          {/* Condition Badge */}
          <StyledView className="absolute top-3 left-3">
            {getConditionBadge()}
          </StyledView>

          {/* Discount Badge */}
          {bike.discount && (
            <StyledView className="absolute top-3 right-3">
              <Badge 
                text={`Giảm ${bike.discount}%`} 
                variant="error" 
                size="small"
                className="bg-accent border-accent-600"
              />
            </StyledView>
          )}
        </StyledView>

        {/* Content */}
        <StyledView className="p-4">
          {/* Title and Engine */}
          <StyledView className="flex-row justify-between items-start mb-2">
            <StyledView className="flex-1">
              <StyledText className="text-h3 font-semibold text-text-light dark:text-text-dark mb-1">
                {bike.brand} {bike.model}
              </StyledText>
              <StyledText className="text-caption text-neutral-600 dark:text-neutral-400">
                {bike.engineCapacity}cc
              </StyledText>
            </StyledView>
          </StyledView>

          {/* Rating */}
          {bike.rating && (
            <StyledView className="flex-row items-center mb-3">
              <StyledView className="flex-row mr-2">
                {renderStars(bike.rating)}
              </StyledView>
              <StyledText className="text-caption text-neutral-600 dark:text-neutral-400">
                {bike.rating.toFixed(1)} ({bike.totalRentals || 0} lượt thuê)
              </StyledText>
            </StyledView>
          )}

          {/* Price */}
          <StyledView className="flex-row items-center justify-between mb-4">
            <StyledView>
              <StyledText className="text-price font-mono text-primary font-semibold">
                {formatPrice(bike.pricePerDay)}/ngày
              </StyledText>
              {bike.pricePerHour && (
                <StyledText className="text-caption text-neutral-600 dark:text-neutral-400">
                  {formatPrice(bike.pricePerHour)}/giờ
                </StyledText>
              )}
            </StyledView>
          </StyledView>

          {/* Actions */}
          {showActions && (
            <StyledView className="flex-row space-x-3">
              <Button
                title="Thuê ngay"
                onPress={onRentPress || onPress}
                variant="primary"
                size="medium"
                disabled={bike.condition !== 'available'}
                className="flex-1"
              />
              <TouchableOpacity
                onPress={onPress}
                className="px-4 py-3 rounded-button border border-primary-200 bg-transparent"
              >
                <StyledText className="text-primary font-medium text-center">
                  Chi tiết
                </StyledText>
              </TouchableOpacity>
            </StyledView>
          )}
        </StyledView>
      </StyledView>
    </Card>
  );
};

export default BikeCard;




