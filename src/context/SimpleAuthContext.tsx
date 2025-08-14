import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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
  clearAdminCache: () => Promise<void>;
  isAdminUser: () => Promise<boolean>;
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
  const [lastAuthEventTime, setLastAuthEventTime] = useState<number>(0);
  
  // Use ref to track current user to avoid stale closure in auth listener
  const userRef = useRef<User | null>(null);
  
  // Add counter to detect and prevent infinite loops
  const authChangeCountRef = useRef<number>(0);
  const lastAuthChangeResetTime = useRef<number>(Date.now());
  
  // Update ref whenever user state changes
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Function to clear admin cache
  const clearAdminCache = async (): Promise<void> => {
    try {
      console.log('🧹 Clearing admin cache...');
      await AsyncStorage.removeItem('user-role');
      console.log('✅ Admin cache cleared');
    } catch (error) {
      console.error('❌ Error clearing admin cache:', error);
    }
  };

  // Function to check if user is actually admin in database
  const isAdminUser = async (): Promise<boolean> => {
    if (!session?.user) {
      console.log('❌ No session user for admin check');
      return false;
    }

    try {
      console.log('🔍 Checking admin status for user:', session.user.email, 'ID:', session.user.id);
      
      const { data, error } = await supabase
        .from('users')
        .select('role, auth_id, email')
        .eq('auth_id', session.user.id)
        .single();

      console.log('🔍 Admin check result:', { data, error: error?.message });

      if (error) {
        console.error('❌ Error checking admin status:', error.message);
        // If it's a not found error, try with id field instead
        if (error.code === 'PGRST116') {
          console.log('🔄 Trying with id field instead of auth_id...');
          const { data: data2, error: error2 } = await supabase
            .from('users')
            .select('role, id, email')
            .eq('id', session.user.id)
            .single();
          
          console.log('🔍 Admin check result (with id):', { data: data2, error: error2?.message });
          
          if (!error2 && data2) {
            const isAdmin = data2?.role === 'admin';
            console.log('✅ Database admin check (via id):', isAdmin);
            return isAdmin;
          }
        }
        return false;
      }

      const isAdmin = data?.role === 'admin';
      console.log('✅ Database admin check (via auth_id):', isAdmin);
      return isAdmin;
    } catch (error) {
      console.error('❌ Exception checking admin status:', error);
      return false;
    }
  };

  // Resolve role robustly - prioritize database check for admin role
  const resolveRole = async (authUser: any, isRefresh = false): Promise<'admin' | 'customer'> => {
    try {
      const logPrefix = isRefresh ? '🔄 [REFRESH]' : '🔍 [INITIAL]';
      console.log(`${logPrefix} Starting role resolution for:`, authUser.email);

      // If this is a refresh and user already has admin role, preserve it unless database says otherwise
      const currentRole = userRef.current?.role;
      if (isRefresh && currentRole === 'admin') {
        console.log(`${logPrefix} Current user is admin, doing gentle verification...`);
        
        // Quick database verification for admin (shorter timeout for refresh)
        try {
          console.log(`${logPrefix} Quick DB verification for admin user:`, authUser.email);
          
          let data: any = null;
          let error: any = null;
          
          // Try with auth_id first
          const result1 = await supabase
            .from('users')
            .select('role, auth_id, email')
            .eq('auth_id', authUser.id)
            .single();

          // If auth_id query fails, try with id field
          if (result1.error && result1.error.code === 'PGRST116') {
            console.log(`${logPrefix} Trying with id field instead of auth_id...`);
            const result2 = await supabase
              .from('users')
              .select('role, id, email')
              .eq('id', authUser.id)
              .single();
            data = result2.data;
            error = result2.error;
          } else {
            data = result1.data;
            error = result1.error;
          }

          console.log(`${logPrefix} Quick DB verification result:`, { hasData: !!data, role: data?.role, error: error?.message });

          if (!error && data?.role === 'admin') {
            console.log(`${logPrefix} ✅ Admin role confirmed in refresh - keeping admin`);
            return 'admin';
          } else if (error) {
            console.log(`${logPrefix} ⚠️ DB verification error in refresh, keeping current role:`, error.message);
            return 'admin'; // Don't downgrade on error during refresh
          } else {
            console.log(`${logPrefix} ❌ Admin role revoked in database during refresh`);
          }
        } catch (dbError) {
          console.log(`${logPrefix} ⚠️ DB check failed during refresh, keeping admin role:`, dbError);
          return 'admin'; // Don't downgrade on connection issues during refresh
        }
      }

      // 1. Full database check for initial load or when admin verification failed
      try {
        console.log(`${logPrefix} Full DB role check for:`, authUser.email);
        
        let dbRole: string | undefined;
        let dbError: any;
        
        // Try multiple query strategies
        const roleQueries = [
          { name: 'auth_id', query: supabase.from('users').select('role, auth_id, email').eq('auth_id', authUser.id).single() },
          { name: 'id', query: supabase.from('users').select('role, id, email').eq('id', authUser.id).single() },
          { name: 'email', query: supabase.from('users').select('role, email').eq('email', authUser.email).single() }
        ];
        
        for (const { name, query } of roleQueries) {
          try {
            const timeout = new Promise((resolve) => setTimeout(() => resolve({ data: null, error: { message: 'Query timeout' } }), 2000));
            const result: any = await Promise.race([query, timeout]);
            
            if (result?.data && !result?.error) {
              dbRole = result.data.role;
              console.log(`${logPrefix} ✅ Role found via ${name} query:`, dbRole);
              break;
            } else if (result?.error && !result.error.message.includes('timeout')) {
              console.log(`${logPrefix} ${name} query failed:`, result.error.message);
            }
          } catch (queryError) {
            console.log(`${logPrefix} ⚠️ ${name} query exception:`, queryError);
          }
        }
        
        console.log(`${logPrefix} DB role check result:`, { dbRole, email: authUser.email });
        
        if (dbRole === 'admin') {
          console.log(`${logPrefix} ✅ Admin role confirmed from database`);
          // Sync to metadata and cache
          try { 
            await AsyncStorage.setItem('user-role', 'admin'); 
            await supabase.auth.updateUser({ data: { role: 'admin' } });
          } catch (syncError) {
            console.log(`${logPrefix} ⚠️ Failed to sync admin role:`, syncError);
          }
          return 'admin';
        } else if (dbRole && dbRole !== 'admin') {
          console.log(`${logPrefix} Customer role confirmed from database`);
          return 'customer';
        } else {
          console.log(`${logPrefix} ⚠️ No role found in database, checking fallbacks`);
        }
      } catch (dbError) {
        console.log(`${logPrefix} ⚠️ DB role check exception:`, dbError);
      }

      // 2. If database is unreachable, check existing sources (prioritize preserving admin)
      const metadataRole = authUser.user_metadata?.role;
      const cachedRole = await AsyncStorage.getItem('user-role');
      
      console.log(`${logPrefix} Fallback check - metadata: ${metadataRole}, cached: ${cachedRole}, current: ${currentRole}, email: ${authUser.email}`);
      
      // Check for admin emails with proper priority
      const isKnownAdminEmail = authUser.email && (
        authUser.email.includes('admin') || 
        authUser.email === 'admin@admin.com' ||
        authUser.email === 'admin@carrent.com' ||
        authUser.email.toLowerCase().includes('admin')
      );
      
      if (isKnownAdminEmail) {
        console.log(`${logPrefix} ✅ Known admin email detected: ${authUser.email}`);
        
        // For development - immediately grant admin for known emails
        console.log(`${logPrefix} ✅ Granting admin role for development: ${authUser.email}`);
        try {
          await AsyncStorage.setItem('user-role', 'admin');
          await supabase.auth.updateUser({ data: { role: 'admin' } });
        } catch (syncError) {
          console.log(`${logPrefix} ⚠️ Failed to sync admin role:`, syncError);
        }
        return 'admin';
      }
      
      // If we have any indication of admin role and this is a refresh, preserve it
      if (isRefresh && (metadataRole === 'admin' || cachedRole === 'admin' || currentRole === 'admin')) {
        console.log(`${logPrefix} ✅ Preserving admin role during refresh (database unreachable)`);
        return 'admin';
      }
      
      // For initial load, be more strict but still respect cached admin
      if (metadataRole === 'admin' || cachedRole === 'admin') {
        console.log(`${logPrefix} ✅ Admin role from metadata/cache (database unreachable)`);
        return 'admin';
      }

      // 3. Default to customer
      console.log(`${logPrefix} 🔄 Defaulting to customer role`);
      return 'customer';
    } catch (error) {
      console.error(`❌ Error in resolveRole:`, error);
      // Preserve current role on errors if possible
      if (isRefresh && userRef.current?.role === 'admin') {
        console.log('⚠️ Preserving admin role due to resolve error during refresh');
        return 'admin';
      }
      return 'customer';
    }
  };

  // OPTIMIZED: Fetch user profile with faster loading and caching
  const fetchUserProfile = async (authUser: any, isRefresh = false): Promise<User> => {
    const logPrefix = isRefresh ? '🔄 [REFRESH]' : '🚀 [FAST-LOAD]';
    console.log(`${logPrefix} Fast loading profile for:`, authUser.email);
    
    // OPTIMIZATION 1: Admin quick path (no database query needed)
    if (authUser.email && authUser.email.toLowerCase().includes('admin')) {
      console.log(`${logPrefix} ⚡ Admin detected - instant load`);
      return {
        id: authUser.id || '', 
        email: authUser.email || '',
        fullName: authUser.user_metadata?.full_name || 'Admin User',
        phoneNumber: authUser.user_metadata?.phone_number || '',
        avatar: authUser.user_metadata?.avatar_url || '',
        role: 'admin',
        isActive: true,
        createdAt: authUser.created_at || new Date().toISOString(),
        updatedAt: authUser.updated_at || new Date().toISOString(),
      };
    }
    
    // OPTIMIZATION 2: Skip database for refresh if auth metadata is sufficient
    if (isRefresh && authUser.user_metadata?.role) {
      console.log(`${logPrefix} ⚡ Using metadata for refresh`);
      return {
        id: authUser.id || '', 
        email: authUser.email || '',
        fullName: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        phoneNumber: authUser.user_metadata?.phone_number || '',
        avatar: authUser.user_metadata?.avatar_url || '',
        role: authUser.user_metadata.role,
        isActive: true,
        createdAt: authUser.created_at || new Date().toISOString(),
        updatedAt: authUser.updated_at || new Date().toISOString(),
      };
    }

    // OPTIMIZATION 3: Single fast query with short timeout
    try {
      console.log(`${logPrefix} ⚡ Single DB query (500ms timeout)`);
      
      const { data, error } = await Promise.race([
        supabase.from('users')
          .select('id, email, full_name, phone_number, avatar_url, role, is_active, created_at, updated_at')
          .eq('email', authUser.email)
          .single(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Fast timeout')), 500))
      ]) as any;
      
      if (data && !error) {
        console.log(`${logPrefix} ✅ Fast DB load success:`, data.role);
        return {
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          phoneNumber: data.phone_number || '',
          avatar: data.avatar_url || '',
          role: data.role,
          isActive: data.is_active,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (error) {
      console.log(`${logPrefix} DB timeout - using fallback (${error})`);
    }

    // OPTIMIZATION 4: Fast fallback with smart role detection
    console.log(`${logPrefix} ⚡ Fast fallback mode`);
    const role = await resolveRole(authUser, isRefresh);
    
    const fallbackUser: User = {
      id: authUser.id || '', 
      email: authUser.email || '',
      fullName: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
      phoneNumber: authUser.user_metadata?.phone_number || '',
      avatar: authUser.user_metadata?.avatar_url || '',
      role,
      isActive: true,
      createdAt: authUser.created_at || new Date().toISOString(),
      updatedAt: authUser.updated_at || new Date().toISOString(),
    };
    
    console.log(`${logPrefix} ✅ Fast fallback ready:`, fallbackUser.role);
    return fallbackUser;
  };

    // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      console.log('🔄 Starting auth initialization...');
      
      try {
        // Try to refresh session, clear if invalid
        try {
          await supabase.auth.refreshSession();
        } catch (refreshError: any) {
          console.log('⚠️ Refresh token invalid, clearing session:', refreshError?.message || refreshError);
          await supabase.auth.signOut();
        }
        
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('📋 Session check:', currentSession ? 'Found session' : 'No session');
        
        if (isMounted) {
          setSession(currentSession);
          
          if (currentSession?.user) {
            console.log('👤 [INITIAL] User found in session:', currentSession.user.email);
            
            try {
              // Fetch user profile with internal non-throwing timeout handling (INITIAL LOAD)
              const userData = await fetchUserProfile(currentSession.user, false);
              setUser(userData as User);
              console.log('✅ [INITIAL] Auth initialized with user:', (userData as User).email, 'role:', (userData as User).role);
            } catch (profileError) {
              console.error('❌ [INITIAL] Profile fetch error, using fallback:', profileError);
              // Use basic fallback user data if profile fetch fails
              const role = await resolveRole(currentSession.user, false);
              const fallbackUser: User = {
                id: currentSession.user.id,
                email: currentSession.user.email || '',
                fullName: currentSession.user.user_metadata?.full_name || 'User',
                phoneNumber: currentSession.user.user_metadata?.phone_number || '',
                avatar: currentSession.user.user_metadata?.avatar_url || '',
                role,
                isActive: true,
                createdAt: currentSession.user.created_at || new Date().toISOString(),
                updatedAt: currentSession.user.updated_at || new Date().toISOString(),
              };
              setUser(fallbackUser);
              console.log('⚠️ [INITIAL] Using fallback user:', fallbackUser.email, 'role:', fallbackUser.role);
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
        setOperationLoading(false);
      }
    }, 5000); // 5 second timeout - reduced for faster user experience

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const now = Date.now();
        
        // Reset counter every 10 seconds to prevent long-term blocking
        if (now - lastAuthChangeResetTime.current > 10000) {
          authChangeCountRef.current = 0;
          lastAuthChangeResetTime.current = now;
        }
        
        // Increment counter and check for infinite loop
        authChangeCountRef.current++;
        
        console.log(`🔄 [AUTH-CHANGE] Auth state changed: ${event} (count: ${authChangeCountRef.current}, last event ${now - lastAuthEventTime}ms ago)`);
        
        // Prevent infinite loop - max 10 auth changes per 10 seconds
        if (authChangeCountRef.current > 10) {
          console.error(`🚨 [AUTH-CHANGE] INFINITE LOOP DETECTED! Blocking auth change: ${event}`);
          return;
        }
        
        if (isMounted) {
          setSession(session);
          setLastAuthEventTime(now);
          
          // Skip user profile updates for certain events to prevent admin role reset
          const skipProfileUpdate = ['TOKEN_REFRESHED', 'USER_UPDATED', 'SIGNED_IN'].includes(event);
          
          // Skip SIGNED_IN event since login function handles it directly
          if (event === 'SIGNED_IN') {
            console.log(`🔄 [AUTH-CHANGE] Skipping SIGNED_IN event - handled by login function`);
            setIsLoading(false);
            setOperationLoading(false);
            return;
          }
          
          // Debounce rapid auth changes (except for important events)
          const isImportantEvent = ['SIGNED_OUT'].includes(event);
          const timeSinceLastEvent = now - lastAuthEventTime;
          
          if (!isImportantEvent && timeSinceLastEvent < 3000) {
            console.log(`🔄 [AUTH-CHANGE] Debouncing rapid auth change: ${event} (${timeSinceLastEvent}ms ago)`);
            setIsLoading(false);
            return;
          }
          
          if (session?.user) {
            if (skipProfileUpdate) {
              console.log(`🔄 [AUTH-CHANGE] Skipping profile update for event: ${event}`);
              setIsLoading(false);
              return;
            }
            
            // Determine if this is a refresh event (user already exists)
            const currentUser = userRef.current;
            const isRefresh = !!currentUser && currentUser.email === session.user.email;
            const isRoleChangeRisk = isRefresh && currentUser?.role === 'admin';
            
            if (isRoleChangeRisk) {
              console.log(`⚠️ [AUTH-CHANGE] Admin user detected - being careful with role changes for event: ${event}`);
            }
            
            try {
              console.log(`🔄 [AUTH-CHANGE] Fetching profile for event: ${event}, email: ${session.user.email}`);
              const userData = await fetchUserProfile(session.user, isRefresh || isRoleChangeRisk);
              setUser(userData);
              console.log(`✅ [AUTH-CHANGE] User set successfully:`, userData.email, 'role:', userData.role);
              
              // Force loading to false when user is set successfully
              setIsLoading(false);
              setOperationLoading(false);
            } catch (error) {
              console.error(`❌ [AUTH-CHANGE] Auth change profile fetch failed (${event}):`, error);
              // Set basic fallback on auth change (preserve existing user role if possible)
              const role = await resolveRole(session.user, isRefresh || isRoleChangeRisk);
              const fallbackUser: User = {
                id: session.user.id,
                email: session.user.email || '',
                fullName: session.user.user_metadata?.full_name || 'User',
                phoneNumber: session.user.user_metadata?.phone_number || '',
                avatar: session.user.user_metadata?.avatar_url || '',
                role,
                isActive: true,
                createdAt: session.user.created_at || new Date().toISOString(),
                updatedAt: session.user.updated_at || new Date().toISOString(),
              };
              setUser(fallbackUser);
              console.log(`⚠️ [AUTH-CHANGE] Using fallback user (${event}):`, fallbackUser.email, 'role:', fallbackUser.role);
              setIsLoading(false);
            }
          } else {
            setUser(null);
            setIsLoading(false);
            console.log(`📝 [AUTH-CHANGE] User cleared from auth change (${event})`);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(initTimeout);
      subscription.unsubscribe();
    };
  }, []); // Keep empty - will fix closure issue differently

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
        console.error('❌ Login error:', error.message, error.status);
        const parsedError = parseAuthError(error);
        return { success: false, error: parsedError.message, errorKey: parsedError.key };
      }

      if (data.user) {
        console.log('✅ Login successful for:', data.user.email, 'ID:', data.user.id);
        console.log('🔍 User metadata:', data.user.user_metadata);
        
        // OPTIMIZED: Immediately fetch profile and preload data
        try {
          console.log('🚀 Fast profile load after login...');
          const userData = await fetchUserProfile(data.user, false);
          setUser(userData);
          setSession(data.session);
          setOperationLoading(false);
          setIsLoading(false);
          
          // OPTIMIZATION: Preload critical data in background for faster UX
          if (userData.role === 'admin') {
            console.log('⚡ Preloading admin dashboard data...');
            // Dynamic import to avoid loading admin code for customers
            import('../services/optimizedAdminService').then(({ preloadDashboardData }) => {
              preloadDashboardData();
            });
          } else {
            console.log('⚡ Preloading bike data...');
            // Preload popular bikes for faster home screen
            import('../services/optimizedBikeService').then(({ getPopularBikes }) => {
              getPopularBikes(6);
            });
          }
          
          console.log('✅ Login completed + preloading started:', userData.email, userData.role);
          return { success: true };
        } catch (profileError) {
          console.error('❌ Profile fetch failed after login:', profileError);
          // Fallback with minimal user data
          const role = await resolveRole(data.user, false);
          const fallbackUser: User = {
            id: data.user.id,
            email: data.user.email || '',
            fullName: data.user.user_metadata?.full_name || 'User',
            phoneNumber: data.user.user_metadata?.phone_number || '',
            avatar: data.user.user_metadata?.avatar_url || '',
            role,
            isActive: true,
            createdAt: data.user.created_at || new Date().toISOString(),
            updatedAt: data.user.updated_at || new Date().toISOString(),
          };
          setUser(fallbackUser);
          setSession(data.session);
          setOperationLoading(false);
          setIsLoading(false);
          console.log('⚠️ Using fallback user after login:', fallbackUser.email, fallbackUser.role);
          return { success: true };
        }
      }

      setOperationLoading(false);
      return { success: false, error: 'Login failed', errorKey: 'auth.loginFailed' };
    } catch (error) {
      setOperationLoading(false);
      console.error('❌ Login exception:', error);
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
      
      // Clear ALL AsyncStorage data including admin cache
      try {
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('user-role');
        console.log('🧹 All cached data cleared');
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
    clearAdminCache,
    isAdminUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 