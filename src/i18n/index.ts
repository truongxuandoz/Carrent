// Polyfill for Intl.PluralRules
import 'intl-pluralrules';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import language files
import vi from '../locales/vi.json';
import en from '../locales/en.json';

const LANGUAGE_DETECTOR = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // Check if user has set a language preference
      const userLanguage = await AsyncStorage.getItem('user-language');
      if (userLanguage) {
        return callback(userLanguage);
      }
      
      // If not, use device language
      const locales = (Localization as any).getLocales ? (Localization as any).getLocales() : [];
      const deviceLanguage = locales && locales.length > 0 ? locales[0].languageCode : 'en';
      return callback(deviceLanguage);
    } catch (error) {
      // Fallback to English
      return callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem('user-language', lng);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  }
};

const resources = {
  vi: {
    translation: vi
  },
  en: {
    translation: en
  }
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false, // Set to false to reduce logs
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    react: {
      useSuspense: false,
    },
  });

export default i18n;
