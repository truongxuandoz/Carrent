import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import Button from './Button';

export interface BikeCardProps {
  id: string;
  name: string;
  type: string;
  pricePerHour: number;
  pricePerDay: number;
  imageUrl: string;
  status: 'available' | 'rented' | 'maintenance';
  rating?: number;
  discount?: number;
  onRent: () => void;
  onViewDetails: () => void;
  onEdit?: () => void;
  isAdmin?: boolean;
}

const BikeCard: React.FC<BikeCardProps> = ({
  id,
  name,
  type,
  pricePerHour,
  pricePerDay,
  imageUrl,
  status,
  rating,
  discount,
  onRent,
  onViewDetails,
  onEdit,
  isAdmin = false,
}) => {
  const { isDark, colors } = useTheme();

  const getStatusBadge = () => {
    const badgeStyle = {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: BorderRadius.chip,
      position: 'absolute' as const,
      top: 12,
      right: 12,
      zIndex: 1,
    };

    switch (status) {
      case 'available':
        return (
          <View style={[badgeStyle, { backgroundColor: Colors.success }]}>
            <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>
              Còn xe
            </Text>
          </View>
        );
      case 'rented':
        return (
          <View style={[badgeStyle, { backgroundColor: Colors.accent }]}>
            <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>
              Đã thuê
            </Text>
          </View>
        );
      case 'maintenance':
        return (
          <View style={[badgeStyle, { backgroundColor: Colors.warning }]}>
            <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>
              Bảo trì
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  const getDiscountBadge = () => {
    if (!discount) return null;

    return (
      <View style={[
        styles.discountBadge,
        { backgroundColor: Colors.accent }
      ]}>
        <Text style={[styles.discountText, { color: '#FFFFFF' }]}>
          Giảm {discount}%
        </Text>
      </View>
    );
  };

  const getRatingStars = () => {
    if (!rating) return null;

    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Ionicons 
            key={i} 
            name="star" 
            size={16} 
            color={Colors.accent} 
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Ionicons 
            key={i} 
            name="star-half" 
            size={16} 
            color={Colors.accent} 
          />
        );
      } else {
        stars.push(
          <Ionicons 
            key={i} 
            name="star-outline" 
            size={16} 
            color={Colors.neutral[400]} 
          />
        );
      }
    }

    return (
      <View style={styles.ratingContainer}>
        <View style={styles.starsContainer}>
          {stars}
        </View>
        <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
          ({rating.toFixed(1)})
        </Text>
      </View>
    );
  };

  const cardStyle = {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.card,
    marginBottom: Spacing.lg,
    overflow: 'hidden' as const,
    ...(isDark ? Shadows.dark.card : Shadows.light.card),
  };

  return (
    <View style={cardStyle}>
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.image}
          resizeMode="cover"
        />
        {getStatusBadge()}
        {getDiscountBadge()}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={[styles.bikeName, { color: colors.text }]}>
              {name}
            </Text>
            <Text style={[styles.bikeType, { color: colors.textSecondary }]}>
              {type}
            </Text>
          </View>
          {isAdmin && (
            <TouchableOpacity 
              onPress={onEdit}
              style={styles.editButton}
            >
              <Ionicons 
                name="pencil" 
                size={20} 
                color={isDark ? Colors.primaryDark : Colors.primary} 
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Rating */}
        {getRatingStars()}

        {/* Pricing */}
        <View style={styles.pricingContainer}>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
              Theo giờ:
            </Text>
            <Text style={[styles.priceValue, { color: colors.text }]}>
              {pricePerHour.toLocaleString('vi-VN')}đ
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
              Theo ngày:
            </Text>
            <Text style={[styles.priceValue, { color: colors.text }]}>
              {pricePerDay.toLocaleString('vi-VN')}đ
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Chi tiết"
            onPress={onViewDetails}
            variant="secondary"
            size="medium"
            fullWidth={false}
            testID={`bike-details-${id}`}
          />
          <View style={{ width: 12 }} />
          <Button
            title={status === 'available' ? 'Thuê ngay' : 'Không khả dụng'}
            onPress={onRent}
            variant="primary"
            size="medium"
            disabled={status !== 'available'}
            fullWidth={true}
            testID={`bike-rent-${id}`}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    position: 'relative',
    aspectRatio: 16 / 9,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeText: {
    ...Typography.textStyles.captionMedium,
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.chip,
    zIndex: 1,
  },
  discountText: {
    ...Typography.textStyles.captionMedium,
    fontWeight: Typography.fontWeight.semibold,
  },
  content: {
    padding: Spacing.cardPadding,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  bikeName: {
    ...Typography.textStyles.h3,
  },
  bikeType: {
    ...Typography.textStyles.caption,
    marginTop: 2,
  },
  editButton: {
    padding: 8,
    marginLeft: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 6,
  },
  ratingText: {
    ...Typography.textStyles.caption,
  },
  pricingContainer: {
    marginBottom: Spacing.lg,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceLabel: {
    ...Typography.textStyles.body,
  },
  priceValue: {
    ...Typography.textStyles.price,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default BikeCard;
