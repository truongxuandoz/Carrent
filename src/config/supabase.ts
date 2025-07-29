import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration
const supabaseUrl = 'https://snpvblyhwkmuobynfrfe.supabase.co'; // Replace with your Supabase URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucHZibHlod2ttdW9ieW5mcmZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzM1NjUsImV4cCI6MjA2OTM0OTU2NX0.IBR0I3PEly__eSWtAw5dtXTB1zvEOnObHlVmrvLwUOg'; // Replace with your Supabase anon key

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabaseUrl.includes('supabase.co') && supabaseAnonKey.startsWith('eyJ');
};

// Database table names
export const TABLES = {
  USERS: 'users',
  BIKES: 'bikes',
  BOOKINGS: 'bookings',
  REVIEWS: 'reviews',
  NOTIFICATIONS: 'notifications',
  EMERGENCY_REPORTS: 'emergency_reports',
} as const;

export default supabase; 