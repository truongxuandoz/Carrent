// Placeholder image utility - using simple base64 PNG images for React Native compatibility

// Simple solid color placeholders as base64 PNG (compatible with React Native)
const GRAY_PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// Simple remote fallback images (more reliable than data URIs)
const REMOTE_FALLBACKS = {
  BIKE: 'https://picsum.photos/300/200?random=bike',
  USER: 'https://picsum.photos/150/150?random=user',
  GENERIC: 'https://picsum.photos/150/150?random=placeholder'
};

export interface PlaceholderOptions {
  width?: number;
  height?: number;
  type?: 'bike' | 'user' | 'generic';
}

/**
 * Generate a simple placeholder (using remote images for better compatibility)
 */
export const generatePlaceholder = (options: PlaceholderOptions = {}): string => {
  const { width = 150, height = 150, type = 'generic' } = options;
  
  // Use remote images with dimensions for better React Native compatibility
  switch (type) {
    case 'bike':
      return `https://picsum.photos/${width}/${height}?random=bike&grayscale`;
    case 'user':
      return `https://picsum.photos/${width}/${height}?random=user&grayscale`;
    default:
      return `https://picsum.photos/${width}/${height}?random=placeholder&grayscale`;
  }
};

/**
 * Get predefined placeholder images
 */
export const getPlaceholder = (type: 'bike' | 'user' | 'generic', size?: string): string => {
  switch (type) {
    case 'bike':
      if (size === '300x200') {
        return generatePlaceholder({ width: 300, height: 200, type: 'bike' });
      }
      return generatePlaceholder({ width: 150, height: 150, type: 'bike' });
    
    case 'user':
      return generatePlaceholder({ width: 150, height: 150, type: 'user' });
    
    case 'generic':
    default:
      if (size === '300x200') {
        return generatePlaceholder({ width: 300, height: 200, type: 'generic' });
      }
      return generatePlaceholder({ width: 150, height: 150, type: 'generic' });
  }
};

/**
 * Fallback placeholders for common sizes
 */
export const PLACEHOLDERS = {
  BIKE_150: getPlaceholder('bike', '150'),
  BIKE_300x200: getPlaceholder('bike', '300x200'),
  USER_150: getPlaceholder('user', '150'),
  GENERIC_150: getPlaceholder('generic', '150'),
  GRAY: GRAY_PLACEHOLDER,
} as const;

/**
 * Safe image handler with fallback
 */
export const getSafeImageSource = (imageUri: string | undefined | null, type: 'bike' | 'user' | 'generic' = 'generic'): { uri: string } => {
  // If no image provided, use placeholder
  if (!imageUri || typeof imageUri !== 'string' || imageUri.trim() === '') {
    return { uri: getPlaceholder(type) };
  }

  // Return the original image (let React Native handle errors with onError)
  return { uri: imageUri };
};

/**
 * Handle image loading errors gracefully
 */
export const handleImageError = (fallbackType: 'bike' | 'user' | 'generic' = 'generic') => {
  console.warn(`⚠️ Image loading failed, using ${fallbackType} fallback`);
  return { uri: getPlaceholder(fallbackType) };
};

/**
 * Replace via.placeholder.com URLs with compatible placeholders
 */
export const replacePlaceholderUrl = (url: string): string => {
  if (!url || !url.includes('via.placeholder.com')) {
    return url;
  }

  // Extract dimensions from URL
  if (url.includes('300x200')) {
    return PLACEHOLDERS.BIKE_300x200;
  } else if (url.includes('150')) {
    return PLACEHOLDERS.BIKE_150;
  }

  return PLACEHOLDERS.GENERIC_150;
};

export default {
  generatePlaceholder,
  getPlaceholder,
  getSafeImageSource,
  handleImageError,
  replacePlaceholderUrl,
  PLACEHOLDERS,
}; 