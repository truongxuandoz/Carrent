import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/SimpleAuthContext';
import LoadingOverlay from '../../components/LoadingOverlay';
import Button from '../../components/ui/Button';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import { isValidEmail } from '../../utils/errorHandler';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const { login, operationLoading } = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { isDark, colors } = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorText, setErrorText] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { width, height } = Dimensions.get('window');

  const handleLogin = async () => {
    setErrorText('');

    if (!email.trim() || !password) {
      const msg = t('auth.fillAllFields');
      setErrorText(msg as string);
      Alert.alert(t('common.error'), msg);
      return;
    }

    if (!isValidEmail(email.trim())) {
      const msg = t('auth.invalidEmailFormat');
      setErrorText(msg as string);
      Alert.alert(t('common.error'), msg);
      return;
    }

    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        // Navigation will be handled by auth context
      } else {
        const msg = result.error || t('auth.loginFailed');
        setErrorText(msg);
        Alert.alert(t('common.error'), msg);
      }
    } catch (error) {
      const msg = t('auth.loginFailed');
      setErrorText(msg as string);
      Alert.alert(t('common.error'), msg);
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <LinearGradient
      colors={Colors.gradients.primary as [string, string]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.appName}>
                {t('common.appName')}
              </Text>
              <Text style={styles.welcomeText}>
                {t('auth.welcomeBack')}
              </Text>
            </View>

            {/* Form Container */}
            <View style={[
              styles.formContainer, 
              { backgroundColor: colors.surface },
              isDark ? Shadows.dark.card : Shadows.light.card
            ]}>
              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  {t('auth.email')}
                </Text>
                <View style={[
                  styles.inputContainer, 
                  { 
                    backgroundColor: isDark ? Colors.neutral[800] : Colors.neutral[50], 
                    borderColor: isDark ? Colors.neutral[700] : Colors.neutral[200] 
                  }
                ]}>
                  <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    placeholder={t('auth.email')}
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={(text: string) => { 
                      setEmail(text); 
                      if (errorText) setErrorText(''); 
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  {t('auth.password')}
                </Text>
                <View style={[
                  styles.inputContainer, 
                  { 
                    backgroundColor: isDark ? Colors.neutral[800] : Colors.neutral[50], 
                    borderColor: isDark ? Colors.neutral[700] : Colors.neutral[200] 
                  }
                ]}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    placeholder={t('auth.password')}
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={(text: string) => { 
                      setPassword(text); 
                      if (errorText) setErrorText(''); 
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Error Message */}
              {errorText ? (
                <View style={[
                  styles.errorContainer, 
                  { backgroundColor: isDark ? '#7F1D1D' : '#FEF2F2' }
                ]}>
                  <Ionicons name="alert-circle" size={20} color={Colors.error} />
                  <Text style={[styles.errorText, { color: Colors.error }]}>
                    {errorText}
                  </Text>
                </View>
              ) : null}

              {/* Login Button */}
              <View style={styles.buttonContainer}>
                <Button
                  title={operationLoading ? t('common.loading') : t('auth.login')}
                  onPress={handleLogin}
                  variant="primary"
                  size="large"
                  disabled={operationLoading}
                  loading={operationLoading}
                  fullWidth
                  testID="login-button"
                />
              </View>

              {/* Register Link */}
              <View style={styles.registerContainer}>
                <Text style={[styles.registerText, { color: colors.textSecondary }]}>
                  {t('auth.noAccount')}
                </Text>
                <TouchableOpacity onPress={handleRegister}>
                  <Text style={[
                    styles.registerLink, 
                    { color: isDark ? Colors.primaryDark : Colors.primary }
                  ]}>
                    {t('auth.register')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingOverlay
        visible={operationLoading}
        text={t('auth.signingIn', 'Signing in...')}
        style="overlay"
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appName: {
    ...Typography.textStyles.h1,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeText: {
    ...Typography.textStyles.body,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  formContainer: {
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    marginHorizontal: 8,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    ...Typography.textStyles.bodyMedium,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    height: 48,
  },
  textInput: {
    flex: 1,
    marginLeft: 12,
    ...Typography.textStyles.body,
  },
  eyeButton: {
    padding: 8,
  },
  errorContainer: {
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    marginLeft: 8,
    ...Typography.textStyles.caption,
    flex: 1,
  },
  buttonContainer: {
    marginBottom: Spacing.xl,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    ...Typography.textStyles.body,
    marginRight: 4,
  },
  registerLink: {
    ...Typography.textStyles.bodyMedium,
    fontWeight: Typography.fontWeight.semibold,
  },
});

export default LoginScreen;