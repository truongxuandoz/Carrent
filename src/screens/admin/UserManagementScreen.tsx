import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getAllUsers, updateUserStatus, updateUserRole, UserManagement, sendNotificationToUser } from '../../services/adminService';

const UserManagementScreen = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserManagement | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (page = 1, search = '') => {
    try {
      if (page === 1) setLoading(true);
      
      const response = await getAllUsers(page, 20, search);
      
      if (page === 1) {
        setUsers(response.users);
      } else {
        setUsers(prev => [...prev, ...response.users]);
      }
      
      setHasMore(response.hasMore);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    loadUsers(1, searchQuery);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      loadUsers(currentPage + 1, searchQuery);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    loadUsers(1, query);
  };

  const handleStatusUpdate = async (userId: string, newStatus: 'active' | 'suspended' | 'blocked') => {
    try {
      await updateUserStatus(userId, newStatus);
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, accountStatus: newStatus, isActive: newStatus === 'active' }
          : user
      ));
      
      Alert.alert('Success', `User status updated to ${newStatus}`);
      setShowUserModal(false);
    } catch (error) {
      console.error('Error updating user status:', error);
      Alert.alert('Error', 'Failed to update user status');
    }
  };

  const handleRoleUpdate = async (userId: string, newRole: 'customer' | 'admin') => {
    try {
      await updateUserRole(userId, newRole);
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, role: newRole }
          : user
      ));
      
      // Update selected user
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, role: newRole } : null);
      }
      
      Alert.alert('Success', `User role updated to ${newRole}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      Alert.alert('Error', 'Failed to update user role');
    }
  };

  const handleSendNotification = async () => {
    if (!selectedUser || !notificationTitle.trim() || !notificationMessage.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await sendNotificationToUser(selectedUser.id, notificationTitle.trim(), notificationMessage.trim());
      Alert.alert('Success', 'Notification sent successfully');
      setShowNotificationModal(false);
      setNotificationTitle('');
      setNotificationMessage('');
    } catch (error) {
      console.error('Error sending notification:', error);
      Alert.alert('Error', 'Failed to send notification');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#27AE60';
      case 'suspended': return '#F39C12';
      case 'blocked': return '#E74C3C';
      default: return '#95A5A6';
    }
  };

  const renderUserItem = ({ item }: { item: UserManagement }) => (
    <TouchableOpacity 
      style={styles.userCard}
      onPress={() => {
        setSelectedUser(item);
        setShowUserModal(true);
      }}
    >
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.fullName || 'N/A'}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.userPhone}>{item.phoneNumber || 'No phone'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.accountStatus) }]}>
          <Text style={styles.statusText}>{item.accountStatus}</Text>
        </View>
      </View>
      
      <View style={styles.userStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.totalBookings}</Text>
          <Text style={styles.statLabel}>Bookings</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatCurrency(item.totalSpent)}</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatDate(item.joinedDate)}</Text>
          <Text style={styles.statLabel}>Joined</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderUserModal = () => (
    <Modal
      visible={showUserModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>User Details</Text>
          <TouchableOpacity 
            onPress={() => setShowUserModal(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {selectedUser && (
          <View style={styles.modalContent}>
            <View style={styles.userDetail}>
              <Text style={styles.detailLabel}>Full Name</Text>
              <Text style={styles.detailValue}>{selectedUser.fullName || 'N/A'}</Text>
            </View>
            
            <View style={styles.userDetail}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{selectedUser.email}</Text>
            </View>
            
            <View style={styles.userDetail}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>{selectedUser.phoneNumber || 'N/A'}</Text>
            </View>
            
            <View style={styles.userDetail}>
              <Text style={styles.detailLabel}>Role</Text>
              <View style={styles.roleContainer}>
                <Text style={styles.detailValue}>{selectedUser.role}</Text>
                <View style={styles.roleButtons}>
                  <TouchableOpacity 
                    style={[styles.roleButton, selectedUser.role === 'customer' && styles.activeRole]}
                    onPress={() => handleRoleUpdate(selectedUser.id, 'customer')}
                  >
                    <Text style={styles.roleButtonText}>Customer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.roleButton, selectedUser.role === 'admin' && styles.activeRole]}
                    onPress={() => handleRoleUpdate(selectedUser.id, 'admin')}
                  >
                    <Text style={styles.roleButtonText}>Admin</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={styles.userDetail}>
              <Text style={styles.detailLabel}>Account Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedUser.accountStatus) }]}>
                <Text style={styles.statusText}>{selectedUser.accountStatus}</Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#27AE60' }]}
                onPress={() => handleStatusUpdate(selectedUser.id, 'active')}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Activate</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#F39C12' }]}
                onPress={() => handleStatusUpdate(selectedUser.id, 'suspended')}
              >
                <Ionicons name="pause-circle" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Suspend</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#E74C3C' }]}
                onPress={() => handleStatusUpdate(selectedUser.id, 'blocked')}
              >
                <Ionicons name="ban" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Block</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => {
                setShowUserModal(false);
                setShowNotificationModal(true);
              }}
            >
              <Ionicons name="notifications" size={20} color="#4ECDC4" />
              <Text style={styles.notificationButtonText}>Send Notification</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );

  const renderNotificationModal = () => (
    <Modal
      visible={showNotificationModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Send Notification</Text>
          <TouchableOpacity 
            onPress={() => setShowNotificationModal(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <Text style={styles.inputLabel}>Title</Text>
          <TextInput
            style={styles.textInput}
            value={notificationTitle}
            onChangeText={setNotificationTitle}
            placeholder="Enter notification title"
          />

          <Text style={styles.inputLabel}>Message</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={notificationMessage}
            onChangeText={setNotificationMessage}
            placeholder="Enter notification message"
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity 
            style={styles.sendButton}
            onPress={handleSendNotification}
          >
            <Text style={styles.sendButtonText}>Send Notification</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
      />

      {renderUserModal()}
      {renderNotificationModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
  },
  userCard: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  userDetail: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 90,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 5,
  },
  notificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderWidth: 2,
    borderColor: '#4ECDC4',
    borderRadius: 10,
    marginTop: 20,
  },
  notificationButtonText: {
    color: '#4ECDC4',
    fontWeight: '600',
    marginLeft: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#4ECDC4',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  roleContainer: {
    flexDirection: 'column',
  },
  roleButtons: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  roleButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#f8f9fa',
  },
  activeRole: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
});

export default UserManagementScreen; 