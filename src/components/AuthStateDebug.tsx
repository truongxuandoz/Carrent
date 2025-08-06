import React, { useEffect } from 'react';
import { useAuth } from '../context/SimpleAuthContext';

const AuthStateDebug: React.FC = () => {
  const { user, session, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    console.log('🔍 AUTH STATE CHANGE:', {
      isAuthenticated,
      isLoading,
      hasSession: !!session,
      hasUser: !!user,
      userEmail: user?.email,
      timestamp: new Date().toLocaleTimeString()
    });
  }, [isAuthenticated, isLoading, session, user]);

  return null; // This component doesn't render anything
};

export default AuthStateDebug; 