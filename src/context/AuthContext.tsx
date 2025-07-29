import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { supabase, TABLES } from '../config/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { notificationService } from '../services/notificationService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  role?: 'customer' | 'admin';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('🔍 Fetching profile for auth_id:', userId);
      
      // Get auth user data first (this always works)
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      // Simple fallback approach - just use auth data if database fails
      console.log('🔄 Using auth data directly (database query disabled)');
      const data = null;
      const error = { code: 'FALLBACK', message: 'Using auth fallback' };

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        console.log('🔧 Using fallback due to error:', error.message);
        
        // For any database error (400, PGRST116, etc.), use auth data as fallback
        console.log('⚠️ Profile fetch failed, using auth data as fallback');
        
        if (authUser) {
          const basicUser: User = {
            id: '', // Will be empty until profile is created
            email: authUser.email || '',
            fullName: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            phoneNumber: authUser.user_metadata?.phone_number || '',
            avatar: authUser.user_metadata?.avatar_url || '',
            role: 'customer',
            isActive: true,
            createdAt: authUser.created_at,
            updatedAt: authUser.updated_at || authUser.created_at,
          };
          setUser(basicUser);
          console.log('✅ Using auth data fallback:', basicUser.fullName);
          
                     // Try to create missing profile if it's just missing (not RLS blocked)
           if (error.code === 'PGRST116') {
             console.log('🔄 Will attempt to create missing profile...');
           }
        }
        
        setIsLoading(false);
        return;
      }

      // Skip database profile logic since we're using fallback
      console.log('⚠️ Database profile loading skipped');
    } catch (error) {
      console.error('❌ Exception in fetchUserProfile:', error);
      
      // Still try to get basic auth data
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const basicUser: User = {
            id: '',
            email: authUser.email || '',
            fullName: 'User',
            phoneNumber: '',
            avatar: '',
            role: 'customer',
            isActive: true,
            createdAt: authUser.created_at,
            updatedAt: authUser.created_at,
          };
          setUser(basicUser);
          console.log('✅ Fallback to basic auth user');
        }
      } catch (fallbackError) {
        console.error('❌ Fallback auth fetch failed:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  };



  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        // fetchUserProfile will be called automatically via onAuthStateChange
        
        // Skip login notification due to database issues
        console.log('⚠️ Skipping login notification (database disabled)');
        
        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: 'Login failed' };
    } catch (error) {
      setIsLoading(false);
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      console.log('🚀 Starting registration for:', userData.email);

      // Sign up user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName,
            phone_number: userData.phoneNumber,
            role: userData.role || 'customer',
          }
        }
      });

      if (error) {
        console.error('❌ Supabase Auth Error:', error);
        console.error('Error Code:', error.message);
        console.error('Error Details:', JSON.stringify(error, null, 2));
        setIsLoading(false);
        return { success: false, error: `Auth Error: ${error.message}` };
      }

      if (data.user) {
        console.log('✅ Auth user created:', data.user.email);
        
        // Skip database profile creation due to RLS policy issues
        console.log('⚠️ Skipping profile creation (RLS policy fix needed)');
        
        // Create basic user from auth data only
        const basicUser: User = {
          id: data.user.id,
          email: data.user.email || userData.email,
          fullName: userData.fullName,
          phoneNumber: userData.phoneNumber,
          avatar: '',
          role: userData.role || 'customer',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        setUser(basicUser);
        console.log('✅ Basic user profile set from auth data');
        
        setIsLoading(false);
        
        // If email confirmation is required, inform user
        if (!data.session) {
          return { 
            success: true, 
            error: 'Registration successful! Please check your email to confirm your account.' 
          };
        }

        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      setIsLoading(false);
      console.error('Registration error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 Starting logout process...');
      setIsLoading(true);
      
      // Sign out from Supabase
      console.log('📤 Signing out from Supabase...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Supabase logout error:', error);
        throw error; // Re-throw to handle in ProfileScreen
      }

      console.log('✅ Supabase logout successful');

      // Clear user data immediately
      console.log('🧹 Clearing user data...');
      setUser(null);
      setSession(null);
      
      // Clear any cached data
      try {
        await AsyncStorage.removeItem('user');
        console.log('✅ AsyncStorage cleared');
      } catch (storageError) {
        console.warn('⚠️ AsyncStorage clear failed:', storageError);
        // Don't throw, this is not critical
      }
      
      console.log('✅ Logout completed successfully');
      
    } catch (error) {
      console.error('❌ Logout process failed:', error);
      // Still clear local data even if Supabase logout fails
      setUser(null);
      setSession(null);
      throw error; // Re-throw for ProfileScreen to handle
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: 'No user logged in' };
      }

      setIsLoading(true);

      // Update user profile in database
      const updateData: any = {};
      if (userData.fullName) updateData.full_name = userData.fullName;
      if (userData.phoneNumber) updateData.phone_number = userData.phoneNumber;
      if (userData.avatar) updateData.avatar_url = userData.avatar;
      if (userData.role) updateData.role = userData.role;

      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      // Update local user state
      if (data) {
        const updatedUser: User = {
          ...user,
          fullName: data.full_name,
          phoneNumber: data.phone_number,
          avatar: data.avatar_url,
          role: data.role,
          updatedAt: data.updated_at,
        };
        
        setUser(updatedUser);
      }

      setIsLoading(false);
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      console.error('Update user error:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!session, // Only check session for now
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 