/**
 * AdminUsersScreen - Gestión de Usuarios
 * Lista de usuarios con búsqueda y acciones de activar/desactivar
 * CON DATADOG INTEGRADO ✅
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  SafeAreaView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDatadog } from '../hooks/useDatadog';
import adminService from '../services/Admin.service';
import CONFIG from '../config/app.config';

export default function AdminUsersScreen({ navigation }) {
  const { trackEvent, trackError } = useDatadog('AdminUsers');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchAnimation = useState(new Animated.Value(0))[0];

  // Modal de confirmación de cambio de estado
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    user: null,
    newStatus: null,
  });

  // Modales de éxito y error
  const [successModal, setSuccessModal] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const loadedUsers = await adminService.getAllUsers();
      setUsers(loadedUsers);
      trackEvent('admin_users_loaded', { count: loadedUsers.length });
    } catch (error) {
      console.error('Error loading users:', error);
      trackError(error, { context: 'loadUsers' });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    trackEvent('admin_users_refreshed');
    await loadUsers();
  };

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = users.filter(user => {
      const nameMatch = user.name?.toLowerCase().includes(query);
      const emailMatch = user.email?.toLowerCase().includes(query);
      const phoneMatch = user.phoneNumber?.includes(query);
      return nameMatch || emailMatch || phoneMatch;
    });

    setFilteredUsers(filtered);
  };

  const toggleSearch = () => {
    const toValue = showSearch ? 0 : 1;
    setShowSearch(!showSearch);

    Animated.spring(searchAnimation, {
      toValue,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();

    if (showSearch) {
      setSearchQuery('');
    }

    trackEvent('admin_users_search_toggled', { opened: !showSearch });
  };

  const handleUserPress = (user) => {
    trackEvent('admin_user_selected', { user_id: user.id });
    navigation.navigate('AdminUserDetail', { user });
  };

  const handleStatusPress = (user) => {
    const newStatus = user.status === CONFIG.USER_STATUS.ACTIVE ? CONFIG.USER_STATUS.INACTIVE : CONFIG.USER_STATUS.ACTIVE;
    setConfirmModal({ visible: true, user, newStatus });
    trackEvent('admin_user_status_change_initiated', { user_id: user.id, new_status: newStatus });
  };

  const confirmStatusChange = async () => {
    const { user, newStatus } = confirmModal;
    setConfirmModal({ visible: false, user: null, newStatus: null });

    try {
      setIsLoading(true);
      await adminService.updateUserStatus(user.email, newStatus);
      
      // Actualizar lista local
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, status: newStatus } : u
      ));
      
      // Mostrar modal de éxito
      showSuccess(
        'Estado actualizado',
        `El usuario ha sido ${newStatus === CONFIG.USER_STATUS.ACTIVE ? 'activado' : 'desactivado'} correctamente.`
      );

      trackEvent('admin_user_status_changed', { user_id: user.id, new_status: newStatus });
    } catch (error) {
      console.error('Error changing user status:', error);
      trackError(error, { context: 'changeUserStatus', user_id: user.id });
      showError('Error al actualizar', error.message || 'No se pudo cambiar el estado del usuario.');
    } finally {
      setIsLoading(false);
    }
  };

  const showSuccess = (title, message) => {
    setSuccessModal({ visible: true, title, message });
    setTimeout(() => {
      setSuccessModal({ visible: false, title: '', message: '' });
    }, 2000);
  };

  const showError = (title, message) => {
    setErrorModal({ visible: true, title, message });
  };

  const renderUser = ({ item }) => {
    const isActive = item.status === CONFIG.USER_STATUS.ACTIVE;
    const roleLabel = item.isAdmin ? 'ADMIN' : 'USER';

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => handleUserPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.userHeader}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {item.name ? item.name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>

          <View style={styles.userInfo}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>{item.name || 'Sin nombre'}</Text>
              <View style={[styles.roleBadge, item.isAdmin && styles.roleBadgeAdmin]}>
                <Text style={styles.roleBadgeText}>{roleLabel}</Text>
              </View>
            </View>

            <View style={styles.userDetails}>
              <Ionicons name="mail-outline" size={14} color="#6b7280" />
              <Text style={styles.userDetailText}>{item.email}</Text>
            </View>

            {item.phoneNumber && (
              <View style={styles.userDetails}>
                <Ionicons name="call-outline" size={14} color="#6b7280" />
                <Text style={styles.userDetailText}>{item.phoneNumber}</Text>
              </View>
            )}

            <View style={styles.userFooter}>
              <View style={[styles.statusBadge, isActive ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
                <View style={[styles.statusDot, isActive ? styles.statusDotActive : styles.statusDotInactive]} />
                <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextInactive]}>
                  {isActive ? 'Activo' : 'Inactivo'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.userActions}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              isActive ? styles.deactivateButton : styles.activateButton
            ]}
            onPress={() => handleStatusPress(item)}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={isActive ? 'close-circle' : 'checkmark-circle'} 
              size={18} 
              color={isActive ? '#ef4444' : '#10b981'} 
            />
            <Text style={[
              styles.statusButtonText,
              isActive ? styles.deactivateButtonText : styles.activateButtonText
            ]}>
              {isActive ? 'Desactivar Usuario' : 'Activar Usuario'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && users.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Cargando usuarios...</Text>
      </View>
    );
  }

  const searchHeight = searchAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerBackground}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.circle3} />
        </View>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
          <Text style={styles.headerSubtitle}>
            {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <TouchableOpacity style={styles.searchButton} onPress={toggleSearch}>
          <Ionicons name={showSearch ? 'close' : 'search'} size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* BÚSQUEDA */}
      <Animated.View style={[styles.searchContainer, { height: searchHeight }]}>
        {showSearch && (
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre, email o teléfono..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </Animated.View>

      {/* LISTA */}
      {filteredUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCircle}>
            <Ionicons name={searchQuery ? 'search-outline' : 'people-outline'} size={60} color="#059669" />
          </View>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Aún no hay usuarios registrados'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#059669']} tintColor="#059669" />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      <Modal
        visible={confirmModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmModal({ visible: false, user: null, newStatus: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[
              styles.modalIcon,
              { backgroundColor: confirmModal.newStatus === CONFIG.USER_STATUS.ACTIVE ? '#10b98115' : '#ef444415' }
            ]}>
              <Ionicons 
                name={confirmModal.newStatus === CONFIG.USER_STATUS.ACTIVE ? 'checkmark-circle' : 'close-circle'} 
                size={48} 
                color={confirmModal.newStatus === CONFIG.USER_STATUS.ACTIVE ? '#10b981' : '#ef4444'} 
              />
            </View>

            <Text style={styles.modalTitle}>
              {confirmModal.newStatus === CONFIG.USER_STATUS.ACTIVE ? 'Activar usuario' : 'Desactivar usuario'}
            </Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro que deseas {confirmModal.newStatus === CONFIG.USER_STATUS.ACTIVE ? 'activar' : 'desactivar'} a "{confirmModal.user?.name}"?
              {'\n\n'}
              Esta acción modificará su acceso al sistema.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setConfirmModal({ visible: false, user: null, newStatus: null })}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmButton,
                  { backgroundColor: confirmModal.newStatus === CONFIG.USER_STATUS.ACTIVE ? '#10b981' : '#ef4444' }
                ]}
                onPress={confirmStatusChange}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={confirmModal.newStatus === CONFIG.USER_STATUS.ACTIVE ? 'checkmark-circle' : 'close-circle'} 
                  size={18} 
                  color="#fff" 
                />
                <Text style={styles.modalConfirmText}>
                  {confirmModal.newStatus === CONFIG.USER_STATUS.ACTIVE ? 'Activar' : 'Desactivar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL DE ÉXITO */}
      <Modal
        visible={successModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSuccessModal({ visible: false, title: '', message: '' })}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successModalIcon}>
              <Ionicons name="checkmark-circle" size={64} color="#10b981" />
            </View>
            <Text style={styles.successModalTitle}>{successModal.title}</Text>
            <Text style={styles.successModalMessage}>{successModal.message}</Text>
          </View>
        </View>
      </Modal>

      {/* MODAL DE ERROR */}
      <Modal
        visible={errorModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setErrorModal({ visible: false, title: '', message: '' })}
      >
        <View style={styles.errorModalOverlay}>
          <View style={styles.errorModalContent}>
            <View style={styles.errorModalIcon}>
              <Ionicons name="alert-circle" size={48} color="#ef4444" />
            </View>
            <Text style={styles.errorModalTitle}>{errorModal.title}</Text>
            <Text style={styles.errorModalMessage}>{errorModal.message}</Text>
            <TouchableOpacity
              style={styles.errorModalButton}
              onPress={() => setErrorModal({ visible: false, title: '', message: '' })}
              activeOpacity={0.8}
            >
              <Text style={styles.errorModalButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0fdf4' },
  loadingText: { marginTop: 16, color: '#065f46', fontSize: 16, fontWeight: '600' },
  
  // HEADER
  header: { position: 'relative', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden' },
  headerBackground: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#065f46' },
  circle1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: '#059669', opacity: 0.2, top: -70, right: -50 },
  circle2: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: '#10b981', opacity: 0.15, bottom: -30, left: -30 },
  circle3: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: '#34d399', opacity: 0.1, top: 40, left: '40%' },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 16, zIndex: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 13, color: '#d1fae5', marginTop: 4, fontWeight: '500' },
  searchButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  
  // BÚSQUEDA
  searchContainer: { backgroundColor: '#065f46', paddingHorizontal: 20, overflow: 'hidden' },
  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, height: 48, marginBottom: 12, gap: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#1f2937', fontWeight: '500' },
  
  // LISTA
  listContent: { padding: 20, paddingBottom: 30 },
  userCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  userHeader: { flexDirection: 'row', marginBottom: 12 },
  userAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  userAvatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  userInfo: { flex: 1 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginRight: 8 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: '#d1fae5' },
  roleBadgeAdmin: { backgroundColor: '#fef3c7' },
  roleBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#059669' },
  userDetails: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  userDetailText: { fontSize: 13, color: '#6b7280' },
  userFooter: { marginTop: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  statusBadgeActive: { backgroundColor: '#d1fae5' },
  statusBadgeInactive: { backgroundColor: '#fee2e2' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusDotActive: { backgroundColor: '#10b981' },
  statusDotInactive: { backgroundColor: '#ef4444' },
  statusText: { fontSize: 12, fontWeight: '600' },
  statusTextActive: { color: '#059669' },
  statusTextInactive: { color: '#ef4444' },
  
  // ACCIONES DE USUARIO
  userActions: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  statusButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  activateButton: { backgroundColor: '#d1fae5' },
  deactivateButton: { backgroundColor: '#fee2e2' },
  statusButtonText: { fontSize: 15, fontWeight: 'bold' },
  activateButtonText: { color: '#10b981' },
  deactivateButtonText: { color: '#ef4444' },
  
  // EMPTY STATE
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#065f46', marginBottom: 8, textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  
  // MODAL DE CONFIRMACIÓN
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 28, width: '100%', maxWidth: 400, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  modalIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 12 },
  modalMessage: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  modalButtons: { flexDirection: 'row', width: '100%', gap: 12 },
  modalCancelButton: { flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center', backgroundColor: '#f3f4f6', borderWidth: 2, borderColor: '#e5e7eb' },
  modalCancelText: { color: '#6b7280', fontSize: 16, fontWeight: 'bold' },
  modalConfirmButton: { flex: 1, flexDirection: 'row', gap: 8, paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  modalConfirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },

  // MODAL DE ÉXITO
  successModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  successModalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 400, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  successModalIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#10b98115', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successModalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 12 },
  successModalMessage: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22 },

  // MODAL DE ERROR
  errorModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorModalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 28, width: '100%', maxWidth: 400, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  errorModalIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ef444415', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  errorModalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 12 },
  errorModalMessage: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  errorModalButton: { width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center', backgroundColor: '#ef4444', shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  errorModalButtonText: { color: '#fff', fontSize: 17, fontWeight: 'bold', letterSpacing: 0.5 },
});