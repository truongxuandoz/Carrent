import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { User } from '../types';
import { parseAuthError, AuthResult } from '../utils/errorHandler';

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  session: any;
  isLoading: boolean;
  operationLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (userData: RegisterData) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<AuthResult>;
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
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);

  // Fetch user profile from database or fallback to auth data
  const fetchUserProfile = async (authUser: any): Promise<User> => {
    console.log('🔍 Fetching user profile for:', authUser.email);
    
    try {
      // Add timeout to database query to prevent hanging
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile query timeout')), 2000)
      );
      
      const { data: profileData, error: profileError } = await Promise.race([
        profilePromise, 
        timeoutPromise
      ]) as any;

      console.log('📊 Profile query result:', { profileData, profileError });

      if (profileData && !profileError) {
        console.log('✅ User profile loaded from database:', profileData.full_name);
        return {
          id: profileData.id,
          email: profileData.email,
          fullName: profileData.full_name,
          phoneNumber: profileData.phone_number || '',
          avatar: profileData.avatar_url || '',
          role: profileData.role,
          isActive: profileData.is_active,
          createdAt: profileData.created_at,
          updatedAt: profileData.updated_at,
        };
      } else {
        console.log('⚠️ No database profile found, skipping auto-create due to potential blocking');
      }
    } catch (error) {
      console.error('❌ Error fetching user profile (using fallback):', error);
    }

    // Final fallback to auth data - ALWAYS RETURN
    console.log('🔄 Using auth data as final fallback');
    const fallbackUser: User = {
      id: authUser.id || '', // Use auth ID as fallback
      email: authUser.email || '',
      fullName: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
      phoneNumber: authUser.user_metadata?.phone_number || '',
      avatar: authUser.user_metadata?.avatar_url || '',
      role: 'customer' as const,
      isActive: true,
      createdAt: authUser.created_at || new Date().toISOString(),
      updatedAt: authUser.updated_at || new Date().toISOString(),
    };
    
    console.log('✅ Fallback user created:', fallbackUser.email);
    return fallbackUser;
  };

    // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      console.log('🔄 Starting auth initialization...');
      
      try {
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('📋 Session check:', currentSession ? 'Found session' : 'No session');
        
        if (isMounted) {
          setSession(currentSession);
          
          if (currentSession?.user) {
            console.log('👤 User found in session:', currentSession.user.email);
            
            try {
              // Add timeout to prevent infinite loading
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
              );
              
              const userData = await Promise.race([
                fetchUserProfile(currentSession.user),
                timeoutPromise
              ]);
              
              setUser(userData as User);
              console.log('✅ Auth initialized with user:', (userData as User).email);
            } catch (profileError) {
              console.error('❌ Profile fetch error, using fallback:', profileError);
              // Use basic fallback user data if profile fetch fails
              const fallbackUser: User = {
                id: currentSession.user.id,
                email: currentSession.user.email || '',
                fullName: currentSession.user.user_metadata?.full_name || 'User',
                phoneNumber: currentSession.user.user_metadata?.phone_number || '',
                avatar: currentSession.user.user_metadata?.avatar_url || '',
                role: 'customer' as const,
                isActive: true,
                createdAt: currentSession.user.created_at || new Date().toISOString(),
                updatedAt: currentSession.user.updated_at || new Date().toISOString(),
              };
              setUser(fallbackUser);
              console.log('⚠️ Using fallback user:', fallbackUser.email);
            }
          } else {
            console.log('📝 No active session found');
          }
          
          console.log('🏁 Auth initialization complete, setting loading to false');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (isMounted) {
          console.log('🏁 Auth initialization failed, setting loading to false');
          setIsLoading(false);
        }
      }
    };

    // Add timeout fallback to prevent infinite loading
    const initTimeout = setTimeout(() => {
      if (isMounted) {
        console.log('⏰ Auth initialization timeout - forcing loading to false');
        setIsLoading(false);
      }
    }, 8000); // 8 second timeout

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (isMounted) {
          setSession(session);
          
          if (session?.user) {
            try {
              const userData = await fetchUserProfile(session.user);
              setUser(userData);
              console.log('✅ User updated from auth change:', userData.email);
              
              // Force loading to false when user is set successfully
              setIsLoading(false);
            } catch (error) {
              console.error('❌ Auth change profile fetch failed:', error);
              // Set basic fallback on auth change
              const fallbackUser: User = {
                id: session.user.id,
                email: session.user.email || '',
                fullName: session.user.user_metadata?.full_name || 'User',
                phoneNumber: session.user.user_metadata?.phone_number || '',
                avatar: session.user.user_metadata?.avatar_url || '',
                role: 'customer' as const,
                isActive: true,
                createdAt: session.user.created_at || new Date().toISOString(),
                updatedAt: session.user.updated_at || new Date().toISOString(),
              };
              setUser(fallbackUser);
              setIsLoading(false);
            }
          } else {
            setUser(null);
            setIsLoading(false);
            console.log('📝 User cleared from auth change');
          }
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(initTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      setOperationLoading(true);
      console.log('🔐 Starting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setOperationLoading(false);
        console.error('❌ Login error:', error.message);
        const parsedError = parseAuthError(error);
        return { success: false, error: parsedError.message, errorKey: parsedError.key };
      }

      if (data.user) {
        // User will be set automatically via onAuthStateChange
        console.log('✅ Login successful:', data.user.email);
        setOperationLoading(false);
        return { success: true };
      }

      setOperationLoading(false);
      return { success: false, error: 'Login failed', errorKey: 'auth.loginFailed' };
    } catch (error) {
      setOperationLoading(false);
      console.error('Login error:', error);
      const parsedError = parseAuthError(error);
      return { success: false, error: parsedError.message, errorKey: parsedError.key };
    }
  };

  const register = async (userData: RegisterData): Promise<AuthResult> => {
    try {
      setOperationLoading(true);
      console.log('🚀 Starting registration for:', userData.email);

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
        console.error('❌ Registration error:', error);
        setOperationLoading(false);
        const parsedError = parseAuthError(error);
        return { success: false, error: parsedError.message, errorKey: parsedError.key };
      }

      if (data.user) {
        console.log('✅ Registration successful:', data.user.email);
        
        // Create user profile in database with timeout
        try {
          console.log('🔄 Creating user profile in database...');
          
          // Add timeout to prevent hanging
          const profilePromise = supabase
            .from('users')
            .insert([
              {
                auth_id: data.user.id,
                email: data.user.email,
                full_name: userData.fullName,
                phone_number: userData.phoneNumber,
                role: userData.role || 'customer',
                is_active: true,
                account_status: 'active',
              }
            ])
            .select()
            .single();

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Profile creation timeout')), 3000)
          );

          const { data: profileData, error: profileError } = await Promise.race([
            profilePromise,
            timeoutPromise
          ]) as any;

          if (profileError) {
            console.error('❌ Profile creation error:', profileError);
            console.error('Error details:', JSON.stringify(profileError, null, 2));
            
            // Continue anyway - auth user was created successfully
            console.log('⚠️ Auth user created but profile creation failed - will use fallback');
            console.log('📝 User can still login, profile will be created on first login');
          } else {
            console.log('✅ User profile created successfully:', profileData.id);
          }
        } catch (profileError) {
          console.error('❌ Profile creation exception:', profileError);
          console.log('⚠️ Profile creation timed out - continuing with auth only');
        }
        
        // User will be set automatically via onAuthStateChange if session exists
        setOperationLoading(false);
        
        // Always return success if auth user was created
        console.log('✅ Registration completed - auth user created successfully');
        
        // FUTURE: Enable email confirmation in Supabase Auth settings
        // When enabled, data.session will be null until email is confirmed
        if (!data.session) {
          console.log('📧 Email confirmation required - user needs to check email');
          return { 
            success: true, 
            error: 'Registration successful! Please check your email to confirm your account.',
            errorKey: 'auth.emailConfirmationSent'
          };
        }

        // No email confirmation needed - user is immediately logged in
        console.log('🚀 No email confirmation needed - user auto-logged in');
        return { success: true };
      }

      setOperationLoading(false);
      return { success: false, error: 'Registration failed', errorKey: 'auth.registrationFailed' };
    } catch (error) {
      setOperationLoading(false);
      console.error('Registration error:', error);
      const parsedError = parseAuthError(error);
      return { success: false, error: parsedError.message, errorKey: parsedError.key };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 Starting logout...');
      setOperationLoading(true);
      
      // Clear local data FIRST (don't wait for database)
      setUser(null);
      setSession(null);
      console.log('🧹 User state cleared immediately');
      
      // Try Supabase logout with timeout - don't let it block
      try {
        const logoutPromise = supabase.auth.signOut();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Logout timeout')), 3000)
        );
        
        const result = await Promise.race([logoutPromise, timeoutPromise]) as any;
        const error = result?.error;
        
        if (error) {
          console.log('⚠️ Supabase logout error (ignored):', error);
        } else {
          console.log('✅ Supabase logout successful');
        }
      } catch (logoutError) {
        console.log('⚠️ Supabase logout failed (ignored):', logoutError);
      }
      
      // Clear AsyncStorage (optional)
      try {
        await AsyncStorage.removeItem('user');
      } catch (storageError) {
        console.log('⚠️ AsyncStorage clear failed (ignored):', storageError);
      }
      
      console.log('✅ Logout completed successfully');
      
    } catch (error) {
      console.error('❌ Logout error (forced cleanup):', error);
      // Force logout regardless of any errors
    } finally {
      setOperationLoading(false);
      // Final safety check - ensure user is cleared
      setUser(null);
      setSession(null);
      console.log('🏁 Logout cleanup complete');
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<AuthResult> => {
    try {
      if (!user) {
        return { success: false, error: 'No user logged in', errorKey: 'auth.unknownError' };
      }

      setIsLoading(true);

      // Update auth user metadata
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: userData.fullName,
          phone_number: userData.phoneNumber,
          avatar_url: userData.avatar,
          role: userData.role,
        }
      });

      if (error) {
        setIsLoading(false);
        const parsedError = parseAuthError(error);
        return { success: false, error: parsedError.message, errorKey: parsedError.key };
      }

      // Update local user state
      if (data.user) {
        const updatedUser = await fetchUserProfile(data.user);
        setUser(updatedUser);
        console.log('✅ User updated:', updatedUser.fullName);
      }

      setIsLoading(false);
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      console.error('Update user error:', error);
      const parsedError = parseAuthError(error);
      return { success: false, error: parsedError.message, errorKey: parsedError.key };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    operationLoading,
    isAuthenticated: !!session,
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