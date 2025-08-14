/**
 * NAVIGATION CACHE FIX
 * Fixes Metro bundler and navigation reset errors
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Clear all navigation-related cache
 */
export const clearNavigationCache = async () => {
  try {
    console.log('🧹 Clearing navigation cache...');
    
    // Clear all possible navigation keys
    const keysToRemove = [
      'NAVIGATION_STATE_V1',
      'REACT_NAVIGATION_PERSISTENCE_KEY',
      'navigation_state',
      'navigation',
      '@react-navigation/async-storage',
      'user',
      'user-role',
    ];
    
    await AsyncStorage.multiRemove(keysToRemove);
    console.log('✅ Navigation cache cleared');
  } catch (error) {
    console.warn('⚠️ Failed to clear navigation cache:', error);
  }
};

/**
 * Safe navigation reset with error handling
 */
export const safeNavigationReset = (navigation: any, routeName: string = 'MainTabs') => {
  try {
    console.log(`🔄 Safe navigation reset to: ${routeName}`);
    
    navigation.reset({
      index: 0,
      routes: [{ name: routeName }],
    });
    
    console.log('✅ Navigation reset successful');
  } catch (error) {
    console.warn('⚠️ Navigation reset failed, trying alternative:', error);
    
    // Fallback: try simple navigate
    try {
      navigation.navigate(routeName);
      console.log('✅ Fallback navigation successful');
    } catch (fallbackError) {
      console.error('❌ Both navigation methods failed:', fallbackError);
    }
  }
};

/**
 * Initialize app with cache clearing
 */
export const initAppWithCacheClear = async () => {
  console.log('🚀 Initializing app with cache clear...');
  
  // Clear navigation cache
  await clearNavigationCache();
  
  // Clear metro cache items from AsyncStorage
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const metroKeys = allKeys.filter(key => 
      key.includes('metro') || 
      key.includes('bundle') || 
      key.includes('expo') ||
      key.includes('__react')
    );
    
    if (metroKeys.length > 0) {
      await AsyncStorage.multiRemove(metroKeys);
      console.log(`🧹 Cleared ${metroKeys.length} metro cache keys`);
    }
  } catch (error) {
    console.warn('⚠️ Failed to clear metro cache:', error);
  }
  
  console.log('✅ App initialization with cache clear completed');
}; 