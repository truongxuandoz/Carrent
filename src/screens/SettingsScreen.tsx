import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = async (language: string) => {
    await i18n.changeLanguage(language);
    await AsyncStorage.setItem('user-language', language);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.settings')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        
        <TouchableOpacity
          style={[
            styles.languageButton,
            i18n.language === 'vi' && styles.languageButtonActive,
          ]}
          onPress={() => changeLanguage('vi')}
        >
          <Text
            style={[
              styles.languageButtonText,
              i18n.language === 'vi' && styles.languageButtonTextActive,
            ]}
          >
            🇻🇳 {t('settings.vietnamese')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.languageButton,
            i18n.language === 'en' && styles.languageButtonActive,
          ]}
          onPress={() => changeLanguage('en')}
        >
          <Text
            style={[
              styles.languageButtonText,
              i18n.language === 'en' && styles.languageButtonTextActive,
            ]}
          >
            🇺🇸 {t('settings.english')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
        <Text style={styles.comingSoon}>Coming soon...</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
        <Text style={styles.comingSoon}>Coming soon...</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  languageButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  languageButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  languageButtonText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  languageButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  comingSoon: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default SettingsScreen; 