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
import { useAuth } from '../../context/SimpleAuthContext';
import LoadingOverlay from '../../components/LoadingOverlay';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import { validateRegistrationData } from '../../utils/errorHandler';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const RegisterScreen: React.FC = () => {
  const { t } = useTranslation();
  const { register, operationLoading } = useAuth();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleRegister = async () => {
    // Validate registration data
    const validation = validateRegistrationData({
      email: email.trim(),
      password,
      confirmPassword,
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
    });

    if (!validation.isValid) {
      Alert.alert(
        t('common.error'), 
        validation.errorKey ? t(validation.errorKey) : validation.errorMessage
      );
      return;
    }

    try {
      const result = await register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      
      if (!result.success) {
        Alert.alert(
          t('common.error'), 
          result.errorKey ? t(result.errorKey) : result.error || t('auth.registrationFailed')
        );
      } else if (result.error) {
        // Success but with message (like email confirmation required)
        console.log('✅ Registration successful but needs email confirmation');
        Alert.alert(
          t('common.success'), 
          result.errorKey ? t(result.errorKey) : result.error,
          [{ 
            text: t('common.ok'), 
            onPress: () => {
              console.log('✅ Email confirmation message acknowledged - returning to home');
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            }
          }]
        );
      } else {
        // Complete success - user is automatically logged in (no email confirmation needed)
        console.log('✅ Registration completed successfully - auto logged in');
        
        // Show brief success message and auto-dismiss for better UX
        Alert.alert(
          t('common.success'), 
          t('auth.registerSuccess') + ' ' + t('auth.autoLoggedIn')
        );
        
        // Automatically go back after showing success message
        setTimeout(() => {
          console.log('✅ Auto-dismissing registration modal - returning to home as logged user');
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
        }, 2000); // 2 second delay to show success message
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(t('common.error'), t('auth.unknownError'));
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
            style={[styles.button, operationLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={operationLoading}
          >
            <Text style={styles.buttonText}>
              {operationLoading ? t('common.loading') : t('auth.register')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={handleLogin}>
            <Text style={styles.linkText}>
              {t('auth.login')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <LoadingOverlay
        visible={operationLoading}
        text={t('auth.creatingAccount', 'Creating account...')}
        style="overlay"
      />
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