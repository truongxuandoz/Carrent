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
import { isValidEmail } from '../../utils/errorHandler';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const { login, operationLoading } = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }

    if (!isValidEmail(email.trim())) {
      Alert.alert(t('common.error'), t('auth.invalidEmailFormat'));
      return;
    }

    try {
      const result = await login(email.trim(), password);
      if (!result.success) {
        Alert.alert(
          t('common.error'), 
          result.errorKey ? t(result.errorKey) : result.error || t('auth.invalidCredentials')
        );
      } else {
        // Login successful - dismiss modal and go back to main app
        console.log('✅ Login successful - navigating to home');
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('auth.loginFailed'));
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{t('common.appName')}</Text>
        <Text style={styles.subtitle}>{t('auth.login')}</Text>

        {/* Debug components removed for clean UI */}

        <View style={styles.form}>
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
            placeholder={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.button, operationLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={operationLoading}
          >
            <Text style={styles.buttonText}>
              {operationLoading ? t('common.loading') : t('auth.login')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={handleRegister}>
            <Text style={styles.linkText}>
              {t('auth.register')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <LoadingOverlay
        visible={operationLoading}
        text={t('auth.signingIn', 'Signing in...')}
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

export default LoginScreen; 