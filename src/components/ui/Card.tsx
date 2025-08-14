import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledTouchableOpacity = styled(TouchableOpacity);

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
  shadow?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  onPress,
  className = '',
  padding = 'medium',
  shadow = true,
}) => {
  const getPaddingStyles = () => {
    switch (padding) {
      case 'none':
        return '';
      case 'small':
        return 'p-2';
      case 'medium':
        return 'p-4';
      case 'large':
        return 'p-6';
      default:
        return 'p-4';
    }
  };

  const baseStyles = `
    bg-surface-light dark:bg-surface-dark
    rounded-card
    border border-border-light dark:border-border-dark
    ${shadow ? 'shadow-card-light dark:shadow-card-dark' : ''}
    ${getPaddingStyles()}
    ${className}
  `;

  if (onPress) {
    return (
      <StyledTouchableOpacity
        onPress={onPress}
        className={`${baseStyles} active:opacity-90`}
        activeOpacity={0.9}
      >
        {children}
      </StyledTouchableOpacity>
    );
  }

  return (
    <StyledView className={baseStyles}>
      {children}
    </StyledView>
  );
};

export default Card;




