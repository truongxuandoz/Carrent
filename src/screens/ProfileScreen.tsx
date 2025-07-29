import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Alert,
  StatusBar 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import BasicTest from '../components/BasicTest';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ProfileScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, isLoading } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
    try {
      console.log('🔘 Logout button pressed');
      setIsLoggingOut(true);
      
      await logout();
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      Alert.alert('Error', 'Could not logout');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleEditProfile = () => {
    Alert.alert(
      t('profile.editProfile'),
      t('profile.editProfileDesc'),
      [{ text: 'OK' }]
    );
  };

  const handleNotificationSettings = () => {
    Alert.alert(
      t('profile.notificationSettings'),
      t('profile.notificationSettingsDesc'),
      [{ text: 'OK' }]
    );
  };

  const handleLanguageChange = () => {
    const currentLang = i18n.language;
    const newLang = currentLang === 'vi' ? 'en' : 'vi';
    
    Alert.alert(
      t('profile.changeLanguage'),
      t('profile.changeLanguageConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => {
            i18n.changeLanguage(newLang);
            Alert.alert(t('common.success'), t('profile.languageChanged'));
          },
        },
      ]
    );
  };

  const handleBookingHistory = () => {
    navigation.navigate('MainTabs');
  };

  const handleSupport = () => {
    Alert.alert(
      t('profile.support'),
      t('profile.supportDesc'),
      [{ text: 'OK' }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      t('profile.privacy'),
      t('profile.privacyDesc'),
      [{ text: 'OK' }]
    );
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: t('profile.editProfile'),
      subtitle: t('profile.editProfileDesc'),
      onPress: handleEditProfile,
      color: '#007AFF',
    },
    {
      icon: 'time-outline',
      title: t('profile.bookingHistory'),
      subtitle: t('profile.bookingHistoryDesc'),
      onPress: handleBookingHistory,
      color: '#34C759',
    },
    {
      icon: 'notifications-outline',
      title: t('profile.notificationSettings'),
      subtitle: t('profile.notificationSettingsDesc'),
      onPress: handleNotificationSettings,
      color: '#FF9500',
    },
    {
      icon: 'language-outline',
      title: t('profile.changeLanguage'),
      subtitle: i18n.language === 'vi' ? 'Tiếng Việt → English' : 'English → Tiếng Việt',
      onPress: handleLanguageChange,
      color: '#5856D6',
    },
    {
      icon: 'help-circle-outline',
      title: t('profile.support'),
      subtitle: t('profile.supportDesc'),
      onPress: handleSupport,
      color: '#32D74B',
    },
    {
      icon: 'shield-outline',
      title: t('profile.privacy'),
      subtitle: t('profile.privacyDesc'),
      onPress: handlePrivacy,
      color: '#8E8E93',
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatMemberSince = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString(i18n.language, { month: 'long' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header with Avatar */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {getInitials(user?.fullName || 'U')}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.editAvatarButton} onPress={handleEditProfile}>
            <Ionicons name="camera" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.fullName || t('profile.unknownUser')}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.userMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="call-outline" size={16} color="#8E8E93" />
              <Text style={styles.metaText}>{user?.phoneNumber || t('profile.noPhone')}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color="#8E8E93" />
              <Text style={styles.metaText}>
                {user?.createdAt 
                  ? `${t('profile.memberSince')} ${formatMemberSince(user.createdAt)}`
                  : t('profile.newMember')
                }
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* User Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>{t('profile.totalTrips')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>{t('profile.totalReviews')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>5.0</Text>
          <Text style={styles.statLabel}>{t('profile.avgRating')}</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Basic Test Component */}
      <BasicTest />

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>CarRent v1.0.0</Text>
        <Text style={styles.appInfoText}>{t('profile.madeWithLove')}</Text>
      </View>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity
          style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <Text style={styles.logoutButtonText}>Đang đăng xuất...</Text>
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
              <Text style={styles.logoutButtonText}>Đăng xuất</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 8,
  },
  userMeta: {
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  metaText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 6,
  },
  statsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    flexDirection: 'row',
    paddingVertical: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 8,
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  appInfo: {
    alignItems: 'center',
    marginVertical: 20,
  },
  appInfoText: {
    fontSize: 12,
    color: '#8E8E93',
    marginVertical: 2,
  },
  logoutContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  logoutButtonDisabled: {
    opacity: 0.5,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 8,
  },
});

export default ProfileScreen; 