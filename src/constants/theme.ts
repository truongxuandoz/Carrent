export const Colors = {
  // Primary Colors
  primary: '#0D6EFD',
  primaryDark: '#60A5FA',
  primaryLight: '#EAF2FF',
  primaryPressed: '#0B5ED7', // ~8% darker
  
  // Accent Colors
  accent: '#FF6A00',
  accentDark: '#FF8A33',
  accentLight: '#FFF4ED',
  
  // Success Colors
  success: '#16A34A',
  successDark: '#22C55E',
  successLight: '#F0FDF4',
  
  // Neutral Colors
  neutral: {
    900: '#0F172A', // text dark
    800: '#1E293B',
    700: '#334155',
    600: '#475569',
    500: '#64748B',
    400: '#94A3B8',
    300: '#CBD5E1',
    200: '#E2E8F0',
    100: '#F1F5F9',
    50: '#F8FAFC',  // background light
  },
  
  // Status Colors
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#0D6EFD',
  
  // Light Theme
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#64748B',
    border: '#E5E7EB',
    shadow: 'rgba(0, 0, 0, 0.08)',
  },
  
  // Dark Theme
  dark: {
    background: '#0B1220',
    surface: '#111827',
    text: '#E5E7EB',
    textSecondary: '#9CA3AF',
    border: '#1F2937',
    shadow: 'rgba(255, 255, 255, 0.06)',
  },
  
  // Gradients
  gradients: {
    primary: ['#0D6EFD', '#1E40AF'],
    hero: ['#0D6EFD', '#1E40AF'],
  },
};

export const Typography = {
  fontFamily: {
    primary: 'System', // Use system font for better compatibility
    mono: 'monospace',
  },
  
  fontSize: {
    h1: 28,
    h2: 22,
    h3: 18,
    body: 16,
    caption: 13,
    price: 16, // mono font for prices
  },
  
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  lineHeight: {
    h1: 34, // 120% of 28
    h2: 27, // 120% of 22
    h3: 22, // 120% of 18
    body: 22, // 140% of 16
    caption: 16, // 120% of 13
  },
  
  // Text styles for consistent usage
  textStyles: {
    h1: {
      fontSize: 28,
      fontWeight: '600' as const,
      lineHeight: 34,
      fontFamily: 'System',
    },
    h2: {
      fontSize: 22,
      fontWeight: '600' as const,
      lineHeight: 27,
      fontFamily: 'System',
    },
    h3: {
      fontSize: 18,
      fontWeight: '500' as const,
      lineHeight: 22,
      fontFamily: 'System',
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 22,
      fontFamily: 'System',
    },
    bodyMedium: {
      fontSize: 16,
      fontWeight: '500' as const,
      lineHeight: 22,
      fontFamily: 'System',
    },
    caption: {
      fontSize: 13,
      fontWeight: '400' as const,
      lineHeight: 16,
      fontFamily: 'System',
    },
    captionMedium: {
      fontSize: 13,
      fontWeight: '500' as const,
      lineHeight: 16,
      fontFamily: 'System',
    },
    price: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 22,
      fontFamily: 'monospace',
    },
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  
  // Card specific
  cardPadding: 16,
  cardMargin: 16,
  
  // Button specific
  buttonPaddingVertical: 12,
  buttonPaddingHorizontal: 24,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  
  // Component specific
  card: 12,
  button: 12,
  buttonLarge: 20,
  image: 24,
  chip: 16,
};

export const Shadows = {
  light: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 8,
    },
    button: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  dark: {
    card: {
      shadowColor: '#FFF',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 8,
    },
    button: {
      shadowColor: '#FFF',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};

export const ButtonSizes = {
  small: {
    height: 40,
    paddingHorizontal: 16,
    fontSize: 14,
    iconSize: 16,
  },
  medium: {
    height: 48,
    paddingHorizontal: 24,
    fontSize: 16,
    iconSize: 20,
  },
  large: {
    height: 56,
    paddingHorizontal: 32,
    fontSize: 16,
    iconSize: 20,
  },
};

export const Animation = {
  duration: {
    fast: 150,
    normal: 220,
    slow: 300,
  },
  
  easing: {
    easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
  
  scale: {
    bounce: 1.04,
  },
};

// Accessibility
export const Accessibility = {
  minTouchTarget: 44,
  minContrastRatio: 4.5,
  focusRingWidth: 2,
};

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  ButtonSizes,
  Animation,
  Accessibility,
};
