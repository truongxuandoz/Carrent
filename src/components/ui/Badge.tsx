import React from 'react';
import { View, Text } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);

export interface BadgeProps {
  text: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'small' | 'medium';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'neutral',
  size = 'medium',
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-success-100 border-success-200';
      case 'warning':
        return 'bg-yellow-100 border-yellow-200';
      case 'error':
        return 'bg-red-100 border-red-200';
      case 'info':
        return 'bg-primary-100 border-primary-200';
      case 'neutral':
        return 'bg-neutral-100 border-neutral-200';
      default:
        return 'bg-neutral-100 border-neutral-200';
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case 'success':
        return 'text-success-700';
      case 'warning':
        return 'text-yellow-700';
      case 'error':
        return 'text-red-700';
      case 'info':
        return 'text-primary-700';
      case 'neutral':
        return 'text-neutral-700';
      default:
        return 'text-neutral-700';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'px-2 py-1 rounded-lg';
      case 'medium':
        return 'px-3 py-1.5 rounded-chip';
      default:
        return 'px-3 py-1.5 rounded-chip';
    }
  };

  const getTextSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'text-xs font-medium';
      case 'medium':
        return 'text-sm font-medium';
      default:
        return 'text-sm font-medium';
    }
  };

  return (
    <StyledView
      className={`
        ${getVariantStyles()}
        ${getSizeStyles()}
        border
        ${className}
      `}
    >
      <StyledText className={`${getTextStyles()} ${getTextSizeStyles()}`}>
        {text}
      </StyledText>
    </StyledView>
  );
};

export default Badge;




