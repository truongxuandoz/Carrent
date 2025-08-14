// Error handler utility for Supabase auth errors
import { AuthError } from '@supabase/supabase-js';

export interface AuthResult {
  success: boolean;
  error?: string;
  errorKey?: string; // For i18n translation key
}

// Map Supabase error codes/messages to translation keys
export const parseAuthError = (error: AuthError | Error | any): { message: string; key: string } => {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code || '';

  // Email already exists
  if (errorMessage.includes('user already registered') || 
      errorMessage.includes('email already registered') ||
      errorMessage.includes('already been registered') ||
      errorCode === 'user_already_exists') {
    return { message: 'This email is already registered', key: 'auth.emailAlreadyExists' };
  }

  // Invalid credentials
  if (errorMessage.includes('invalid login credentials') ||
      errorMessage.includes('invalid credentials') ||
      errorMessage.includes('invalid email or password') ||
      errorCode === 'invalid_credentials') {
    return { message: 'Invalid email or password', key: 'auth.invalidCredentials' };
  }

  // Account not confirmed
  if (errorMessage.includes('email not confirmed') ||
      errorMessage.includes('confirmation') ||
      errorCode === 'email_not_confirmed') {
    return { message: 'Account not confirmed. Please check your email', key: 'auth.accountNotConfirmed' };
  }

  // Weak password
  if (errorMessage.includes('password') && 
      (errorMessage.includes('weak') || errorMessage.includes('short') || errorMessage.includes('6'))) {
    return { message: 'Password too weak, requires at least 6 characters', key: 'auth.weakPassword' };
  }

  // Invalid email format
  if (errorMessage.includes('invalid email') || 
      errorMessage.includes('email format') ||
      errorCode === 'invalid_email') {
    return { message: 'Invalid email format', key: 'auth.invalidEmailFormat' };
  }

  // Rate limiting
  if (errorMessage.includes('too many') || 
      errorMessage.includes('rate limit') ||
      errorCode === 'too_many_requests') {
    return { message: 'Too many requests. Please try again later', key: 'auth.tooManyRequests' };
  }

  // Network errors
  if (errorMessage.includes('network') || 
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection')) {
    return { message: 'Network error. Please check your internet connection', key: 'auth.networkError' };
  }

  // Default unknown error
  return { 
    message: error?.message || 'An unknown error occurred', 
    key: 'auth.unknownError' 
  };
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

// Validate phone number (basic)
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[0-9+\-\s()]{8,15}$/;
  return phoneRegex.test(phone.trim());
};

// Format user registration data
export const validateRegistrationData = (data: {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phoneNumber: string;
}): { isValid: boolean; errorKey?: string; errorMessage?: string } => {
  if (!data.email || !data.password || !data.confirmPassword || !data.fullName || !data.phoneNumber) {
    return { isValid: false, errorKey: 'auth.fillAllFields', errorMessage: 'Please fill in all fields' };
  }

  if (!isValidEmail(data.email)) {
    return { isValid: false, errorKey: 'auth.invalidEmailFormat', errorMessage: 'Invalid email format' };
  }

  if (!isValidPassword(data.password)) {
    return { isValid: false, errorKey: 'auth.weakPassword', errorMessage: 'Password too weak, requires at least 6 characters' };
  }

  if (data.password !== data.confirmPassword) {
    return { isValid: false, errorKey: 'auth.passwordMismatch', errorMessage: 'Passwords do not match' };
  }

  if (!isValidPhoneNumber(data.phoneNumber)) {
    return { isValid: false, errorKey: 'auth.phoneRequired', errorMessage: 'Phone number is required' };
  }

  return { isValid: true };
};

export default {
  parseAuthError,
  isValidEmail,
  isValidPassword,
  isValidPhoneNumber,
  validateRegistrationData,
}; 