import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const RegisterScreen: React.FC = () => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !fullName || !phoneNumber) {
      Alert.alert(t('common.error'), 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passwordMismatch'));
      return;
    }

    setIsLoading(true);
    try {
      const result = await register({
        email,
        password,
        fullName,
        phoneNumber,
      });
      
      if (!result.success) {
        Alert.alert(
          t('common.error'), 
          result.error || 'Registration failed'
        );
      } else if (result.error) {
        // Success but with message (like email confirmation)
        Alert.alert(
          '✅ Success', 
          result.error, // This contains the email confirmation message
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        // Complete success
        Alert.alert(
          '✅ Success', 
          'Registration successful!',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(t('common.error'), 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{t('common.appName')}</Text>
        <Text style={styles.subtitle}>{t('auth.register')}</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder={t('auth.fullName')}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder={t('auth.phoneNumber')}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder={t('auth.confirmPassword')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? t('common.loading') : t('auth.register')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={handleLogin}>
            <Text style={styles.linkText}>
              {t('auth.login')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#007AFF',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
});

export default RegisterScreen; 