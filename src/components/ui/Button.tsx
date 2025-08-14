import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator, Animated } from 'react-native';
import { Colors, Typography, ButtonSizes, BorderRadius, Shadows } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  testID?: string;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  testID,
}) => {
  const { isDark } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const sizeConfig = ButtonSizes[size];
  
  const handlePressIn = () => {
    if (!disabled && !loading) {
      Animated.spring(scaleAnim, {
        toValue: 1.04,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }
  };

  const getButtonStyle = () => {
    const baseStyle = {
      height: sizeConfig.height,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      borderRadius: size === 'large' ? BorderRadius.buttonLarge : BorderRadius.button,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minWidth: 44, // Accessibility
      ...(fullWidth && { width: '100%' }),
    };

    if (disabled) {
      return {
        ...baseStyle,
        backgroundColor: Colors.neutral[300],
        borderWidth: 0,
      };
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: isDark ? Colors.primaryDark : Colors.primary,
          borderWidth: 0,
          ...(!isDark ? Shadows.light.button : Shadows.dark.button),
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: isDark ? Colors.dark.surface : Colors.light.surface,
          borderWidth: 1,
          borderColor: isDark ? Colors.primaryDark : Colors.primary,
        };
      case 'destructive':
        return {
          ...baseStyle,
          backgroundColor: Colors.error,
          borderWidth: 0,
          ...(!isDark ? Shadows.light.button : Shadows.dark.button),
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = () => {
    const baseStyle = {
      ...Typography.textStyles.bodyMedium,
      fontSize: sizeConfig.fontSize,
      textAlign: 'center' as const,
    };

    if (disabled) {
      return {
        ...baseStyle,
        color: Colors.neutral[500],
      };
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          color: '#FFFFFF',
        };
      case 'secondary':
        return {
          ...baseStyle,
          color: isDark ? Colors.primaryDark : Colors.primary,
        };
      case 'destructive':
        return {
          ...baseStyle,
          color: '#FFFFFF',
        };
      default:
        return baseStyle;
    }
  };

  const getLoadingColor = () => {
    if (variant === 'secondary') {
      return isDark ? Colors.primaryDark : Colors.primary;
    }
    return '#FFFFFF';
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={getButtonStyle()}
        testID={testID}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={getLoadingColor()} 
          />
        ) : (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {icon && (
              <View style={{ 
                marginRight: title ? 8 : 0,
                width: sizeConfig.iconSize,
                height: sizeConfig.iconSize,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {icon}
              </View>
            )}
            {title ? <Text style={getTextStyle()}>{title}</Text> : null}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default Button;