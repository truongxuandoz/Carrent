import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/SimpleAuthContext';

const AuthDebugger: React.FC = () => {
  const [status, setStatus] = useState('Ready to debug');
  const [isLoading, setIsLoading] = useState(false);
  const { user, session } = useAuth();

  const debugRegistration = async () => {
    setIsLoading(true);
    setStatus('Testing registration...');
    
    try {
      const testEmail = `test${Date.now()}@example.com`;
      const testPassword = 'password123';
      
      // Step 1: Test Supabase Auth signup
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: 'Test User Debug',
            phone_number: '0123456789',
            role: 'customer',
          }
        }
      });

      if (error) {
        setStatus(`❌ Auth Error: ${error.message}`);
        return;
      }

      setStatus(`✅ Auth User Created: ${data.user?.email}\nSession: ${data.session ? 'Yes' : 'No'}`);

      // Step 2: Test manual profile creation
      if (data.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .insert([
            {
              auth_id: data.user.id,
              email: data.user.email,
              full_name: 'Test User Debug',
              phone_number: '0123456789',
              role: 'customer',
              is_active: true,
            }
          ])
          .select()
          .single();

        if (profileError) {
          setStatus(prev => prev + `\n❌ Profile Error: ${profileError.message}`);
        } else {
          setStatus(prev => prev + `\n✅ Profile Created: ${profileData.id}`);
          
          // Step 3: Test notification creation
          const { data: notifData, error: notifError } = await supabase
            .from('notifications')
            .insert([
              {
                user_id: profileData.id,
                title: 'Debug Welcome',
                message: 'Test notification from debugger',
                type: 'welcome',
                is_read: false,
              }
            ])
            .select()
            .single();

          if (notifError) {
            setStatus(prev => prev + `\n❌ Notification Error: ${notifError.message}`);
          } else {
            setStatus(prev => prev + `\n✅ Notification Created: ${notifData.id}`);
          }
        }
      }
      
    } catch (error) {
      setStatus(`❌ Exception: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkCurrentUser = async () => {
    setIsLoading(true);
    
    try {
      // Check auth user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      // Check profile
      let profileData = null;
      if (authUser) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', authUser.id)
          .single();
        profileData = data;
      }

      // Check notifications
      let notificationCount = 0;
      if (profileData) {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profileData.id);
        notificationCount = count || 0;
      }

      setStatus(`Current Status:
Auth User: ${authUser ? authUser.email : 'None'}
Profile: ${profileData ? profileData.full_name : 'None'}
Notifications: ${notificationCount}
Context User: ${user ? user.fullName : 'None'}
Context Session: ${session ? 'Yes' : 'No'}`);
      
    } catch (error) {
      setStatus(`❌ Check Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testTables = async () => {
    setIsLoading(true);
    
    try {
      // Test users table
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      // Test notifications table  
      const { data: notifsData, error: notifsError } = await supabase
        .from('notifications')
        .select('count')
        .limit(1);

      setStatus(`Tables Status:
users: ${usersError ? `❌ ${usersError.message}` : '✅ OK'}
notifications: ${notifsError ? `❌ ${notifsError.message}` : '✅ OK'}`);
      
    } catch (error) {
      setStatus(`❌ Tables Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearTestData = async () => {
    setIsLoading(true);
    
    try {
      // Delete test notifications
      await supabase
        .from('notifications')
        .delete()
        .like('message', '%test%');

      // Delete test users (profiles only, auth users stay)
      await supabase
        .from('users')
        .delete()
        .like('email', '%test%');

      setStatus('✅ Test data cleared');
      
    } catch (error) {
      setStatus(`❌ Clear Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fixEmailProvider = async () => {
    setIsLoading(true);
    setStatus('Attempting to fix email provider...');
    
    try {
      // Try to check auth config (may fail due to RLS)
      const { data, error } = await supabase
        .from('auth.config')
        .select('*')
        .in('key', ['DISABLE_SIGNUP', 'ENABLE_EMAIL_CONFIRMATIONS']);

      if (error) {
        setStatus(`❌ Cannot access auth.config: ${error.message}
        
📋 Manual Fix Required:
1. Go to Supabase Dashboard
2. Authentication → Settings  
3. Disable "Enable email confirmations"
4. Or run database/fix_email_provider.sql`);
      } else {
        setStatus(`Auth Config:
${JSON.stringify(data, null, 2)}

👆 If ENABLE_EMAIL_CONFIRMATIONS = true, that's the issue!`);
      }
      
    } catch (error) {
      setStatus(`❌ Error: ${error}

📋 Manual Fix Required:
1. Supabase Dashboard → Authentication → Settings
2. Turn OFF "Enable email confirmations"  
3. Save settings`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔍 Auth Debugger</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{status}</Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={testTables}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Check Tables</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={checkCurrentUser}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Check Current User</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.primaryButton, isLoading && styles.buttonDisabled]} 
        onPress={debugRegistration}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Debug Registration'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.warningButton, isLoading && styles.buttonDisabled]} 
        onPress={fixEmailProvider}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>🚨 Fix Email Provider</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.dangerButton, isLoading && styles.buttonDisabled]} 
        onPress={clearTestData}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Clear Test Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    margin: 15,
    maxHeight: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    minHeight: 100,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#007bff',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  warningButton: {
    backgroundColor: '#ffc107',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default AuthDebugger; 