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
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/SimpleAuthContext';
import LoadingOverlay from '../../components/LoadingOverlay';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import { validateRegistrationData } from '../../utils/errorHandler';
import { Typography } from '../../constants/theme';

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
  const [errorText, setErrorText] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { width, height } = Dimensions.get('window');

  const handleRegister = async () => {
    setErrorText('');

    // Validate registration data
    const validation = validateRegistrationData({
      email: email.trim(),
      password,
      confirmPassword,
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
    });

    if (!validation.isValid) {
      const msg = validation.errorKey ? t(validation.errorKey) : validation.errorMessage;
      setErrorText(String(msg));
      Alert.alert(
        t('common.error'), 
        msg
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
        const msg = result.errorKey ? t(result.errorKey) : (result.error || t('auth.registrationFailed'));
        setErrorText(String(msg));
        Alert.alert(t('common.error'), String(msg));
      } else if (result.error) {
        console.log('✅ Registration successful but needs email confirmation');
        const msg = result.errorKey ? t(result.errorKey) : result.error;
        setErrorText('');
        Alert.alert(
          t('common.success'), 
          String(msg),
                  [{ 
          text: t('common.ok'), 
          onPress: () => {
            console.log('✅ Email confirmation message acknowledged - AuthContext will handle navigation');
            // Let AuthContext handle navigation automatically
          }
        }]
        );
      } else {
        console.log('✅ Registration completed successfully - auto logged in');
        setErrorText('');
        Alert.alert(
          t('common.success'), 
          t('auth.registerSuccess') + ' ' + t('auth.autoLoggedIn')
        );
        setTimeout(() => {
          console.log('✅ Auto-dismissing registration modal - AuthContext will handle navigation');
          // Let AuthContext handle navigation automatically
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      const msg = t('auth.unknownError');
      setErrorText(msg as string);
      Alert.alert(t('common.error'), msg);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>{t('common.appName')}</Text>
              <Text style={styles.subtitle}>{t('auth.createAccount')}</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.form}>
                {/* Full Name Input */}
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.fullName')}
                    placeholderTextColor="#999"
                    value={fullName}
                    onChangeText={(text) => { setFullName(text); if (errorText) setErrorText(''); }}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.email')}
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={(text) => { setEmail(text); if (errorText) setErrorText(''); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Phone Number Input */}
                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.phoneNumber')}
                    placeholderTextColor="#999"
                    value={phoneNumber}
                    onChangeText={(text) => { setPhoneNumber(text); if (errorText) setErrorText(''); }}
                    keyboardType="phone-pad"
                    autoCorrect={false}
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.password')}
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={(text) => { setPassword(text); if (errorText) setErrorText(''); }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.confirmPassword')}
                    placeholderTextColor="#999"
                    value={confirmPassword}
                    onChangeText={(text) => { setConfirmPassword(text); if (errorText) setErrorText(''); }}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>

                {!!errorText && (
                  <Text style={styles.errorText}>{errorText}</Text>
                )}

                <TouchableOpacity
                  style={[styles.button, operationLoading && styles.buttonDisabled]}
                  onPress={handleRegister}
                  disabled={operationLoading}
                >
                  <LinearGradient
                    colors={operationLoading ? ['#ccc', '#ccc'] : ['#4facfe', '#00f2fe']}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>
                      {operationLoading ? t('common.loading') : t('auth.register')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>{t('auth.or')}</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity style={styles.linkButton} onPress={handleLogin}>
                  <Text style={styles.linkText}>
                    {t('auth.alreadyHaveAccount')} <Text style={styles.linkTextBold}>{t('auth.login')}</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <LoadingOverlay
        visible={operationLoading}
        text={t('auth.creatingAccount', 'Creating account...')}
        style="overlay"
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    ...Typography.textStyles.h1,
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    ...Typography.textStyles.h3,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    ...Typography.textStyles.bodyMedium,
    color: '#333',
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#4facfe',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    ...Typography.textStyles.h3,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e9ecef',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6c757d',
    ...Typography.textStyles.captionMedium,
    fontSize: 14,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkText: {
    ...Typography.textStyles.body,
    color: '#6c757d',
  },
  linkTextBold: {
    color: '#667eea',
    fontWeight: '700',
  },
  errorText: {
    ...Typography.textStyles.captionMedium,
    color: '#dc3545',
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 14,
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
});

export default RegisterScreen; 