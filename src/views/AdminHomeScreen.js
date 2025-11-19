/**
 * Pantalla de Administración
 * Con MVVM - usa useAuthViewModel
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StyleSheet, // Se importa, pero el objeto styles estará vacío aquí
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

//  Usar ViewModels y servicios
import { useAuthViewModel } from '../viewmodels/Auth.viewmodel';
import CONFIG from '../config/app.config';
import storageService from '../services/Storage.service';

export default function AdminHomeScreen({ navigation }) {
  //  Usar ViewModel para auth
  const { user, logout } = useAuthViewModel();

  // Estados locales
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Estados para modales personalizados
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: '',
    message: '',
    icon: 'alert-circle',
    iconColor: '#ef4444',
  });

  const [successModal, setSuccessModal] = useState({
    visible: false,
    title: '',
    message: '',
    icon: 'checkmark-circle',
    iconColor: '#10b981',
  });

  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    message: '',
    icon: 'help-circle',
    iconColor: '#f59e0b',
    onConfirm: () => {},
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
  });

  // Ref para el timer
  const timerRef = useRef(null);

  useEffect(() => {
    loadUserData();
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  /**
   * Mostrar modal de error
   */
  const showError = (title, message, icon = 'alert-circle', iconColor = '#ef4444') => {
    setErrorModal({
      visible: true,
      title,
      message,
      icon,
      iconColor,
    });
  };

  /**
   * Cerrar modal de error
   */
  const closeErrorModal = () => {
    setErrorModal({ ...errorModal, visible: false });
  };

  /**
   * Mostrar modal de éxito
   */
  const showSuccess = (title, message, icon = 'checkmark-circle', iconColor = '#10b981') => {
    setSuccessModal({
      visible: true,
      title,
      message,
      icon,
      iconColor,
    });

    // Auto cerrar después de 2 segundos
    timerRef.current = setTimeout(() => {
      setSuccessModal({ ...successModal, visible: false });
    }, 2000);
  };

  /**
   * Cerrar modal de éxito
   */
  const closeSuccessModal = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setSuccessModal({ ...successModal, visible: false });
  };

  /**
   * Mostrar modal de confirmación
   */
  const showConfirm = (title, message, onConfirm, confirmText = 'Confirmar', cancelText = 'Cancelar', icon = 'help-circle', iconColor = '#f59e0b') => {
    setConfirmModal({
      visible: true,
      title,
      message,
      icon,
      iconColor,
      onConfirm,
      confirmText,
      cancelText,
    });
  };

  /**
   * Cerrar modal de confirmación
   */
  const closeConfirmModal = () => {
    setConfirmModal({ ...confirmModal, visible: false });
  };

  /**
   * Confirmar acción
   */
  const handleConfirm = () => {
    closeConfirmModal();
    confirmModal.onConfirm();
  };

  /**
   * Cargar lista de usuarios
   */
  const loadUserData = async () => {
    try {
      const token = await storageService.getItem(CONFIG.STORAGE_KEYS.USER_TOKEN);

      const response = await fetch(`${CONFIG.API.AUTH_BASE_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.isSuccess) {
        setUsers(result.result || []);
      } else {
        showError(
          'Error al cargar',
          'No se pudieron cargar los usuarios del sistema.',
          'alert-circle',
          '#ef4444'
        );
      }
    } catch (error) {
      console.error(error);
      showError(
        'Error de conexión',
        'No se pudo conectar al servidor.\n\nVerifica tu conexión a internet.',
        'cloud-offline-outline',
        '#ef4444'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cambiar estado de usuario con modal de confirmación
   */
  const handleChangeStatus = async (email, newStatus) => {
    try {
      const token = await storageService.getItem(CONFIG.STORAGE_KEYS.USER_TOKEN);

      const response = await fetch(`${CONFIG.API.AUTH_BASE_URL}/status/${email}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (result.isSuccess) {
        showSuccess(
          'Estado actualizado',
          `El usuario ha sido ${newStatus === 1 ? 'activado' : 'desactivado'} correctamente.`,
          'checkmark-circle',
          '#10b981'
        );
        // Recargar datos después de actualizar
        await loadUserData();
      } else {
        showError(
          'Error al actualizar',
          result.message || 'No se pudo cambiar el estado del usuario.',
          'alert-circle',
          '#ef4444'
        );
      }
    } catch (error) {
      console.error(error);
      showError(
        'Error de conexión',
        'No se pudo actualizar el estado del usuario.\n\nIntenta de nuevo más tarde.',
        'cloud-offline-outline',
        '#ef4444'
      );
    }
  };

  /**
   * Confirmar cambio de estado
   */
  const confirmChangeStatus = (email, currentStatus) => {
    // Cerrar el modal de detalles primero
    setModalVisible(false);
    
    // Pequeño delay para que se cierre el modal antes de mostrar la confirmación
    setTimeout(() => {
      const newStatus = currentStatus === 1 ? 2 : 1;
      const action = newStatus === 1 ? 'activar' : 'desactivar';
      
      showConfirm(
        `${action.charAt(0).toUpperCase() + action.slice(1)} usuario`,
        `¿Estás seguro que deseas ${action} a este usuario?\n\nEsta acción modificará su acceso al sistema.`,
        () => handleChangeStatus(email, newStatus),
        action.charAt(0).toUpperCase() + action.slice(1),
        'Cancelar',
        newStatus === 1 ? 'checkmark-circle' : 'close-circle',
        newStatus === 1 ? '#10b981' : '#ef4444'
      );
    }, 300);
  };
  
  /**
   * Manejar navegación al perfil
   */
  const handleProfileNavigation = () => {
    // Asegúrate de que 'Profile' sea el nombre correcto en tu Stack Navigator
    navigation.navigate('Profile'); 
  };

  /**
   * Manejar logout con confirmación
   */
  const handleLogout = () => {
    showConfirm(
      'Cerrar sesión',
      '¿Estás seguro que deseas cerrar sesión?\n\nDeberás iniciar sesión nuevamente para acceder.',
      async () => {
        const result = await logout();
        if (result.success) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
          // Navegación directa sin modal de éxito
        } else {
          showError(
            'Error',
            'No se pudo cerrar sesión.\n\nIntenta de nuevo.',
            'alert-circle',
            '#ef4444'
          );
        }
      },
      'Cerrar sesión',
      'Cancelar',
      'log-out-outline',
      '#ef4444'
    );
  };

  const totalActivos = users.filter(u => u.status === 1).length;
  const totalInactivos = users.filter(u => u.status === 2).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Cargando información...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header*/}
      <View style={styles.header}>
        {/* Patrón decorativo de fondo */}
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />

        {/* Contenido del header */}
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerLabel}>PANEL DE ADMINISTRACIÓN</Text>
              <Text style={styles.headerTitle}>
                Hola, {user?.name?.split(' ')[0] || 'Usuario'}!
              </Text>
              <Text style={styles.headerSubtitle}>
                Gestiona tu sistema de manera eficiente
              </Text>
            </View>

            {/* Contenedor de botones (Usuario y Cerrar Sesión) */}
            <View style={styles.headerButtonsContainer}>
                {/* Botón de Perfil/Usuario */}
                <TouchableOpacity
                    onPress={handleProfileNavigation}
                    style={styles.profileButton}
                    activeOpacity={0.7}
                >
                    <Ionicons name="person-circle-outline" size={28} color="white" />
                </TouchableOpacity>

                {/* Botón de cerrar sesión */}
                <TouchableOpacity
                    onPress={handleLogout}
                    style={styles.logoutButton}
                    activeOpacity={0.7}
                >
                    <Ionicons name="log-out-outline" size={24} color="white" />
                </TouchableOpacity>
            </View>
          </View>

          {/* Avatar y rol */}
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color="#059669" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.name}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {user?.roles?.[0] || 'Administrador'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Estadísticas mejoradas */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconActive}>
              <Ionicons name="people" size={28} color="#10b981" />
            </View>
            <Text style={styles.statNumber}>{totalActivos}</Text>
            <Text style={styles.statLabelActive}>Usuarios Activos</Text>
          </View>

          <View style={styles.statCardInactive}>
            <View style={styles.statIconInactive}>
              <Ionicons name="person-remove" size={28} color="#6b7280" />
            </View>
            <Text style={styles.statNumberInactive}>{totalInactivos}</Text>
            <Text style={styles.statLabelInactive}>Usuarios Inactivos</Text>
          </View>
        </View>

        {/* Lista de usuarios con diseño premium */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIndicator} />
          <Text style={styles.sectionTitle}>Gestión de Usuarios</Text>
        </View>

        {users.map((u, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              setSelectedUser(u);
              setModalVisible(true);
            }}
            style={[
              styles.userCard,
              { borderLeftColor: u.status === 1 ? '#10b981' : '#9ca3af' }
            ]}
            activeOpacity={0.7}
          >
            <View style={styles.userCardContent}>
              <View style={styles.userCardLeft}>
                <View style={[
                  styles.userCardAvatar,
                  { backgroundColor: u.status === 1 ? '#d1fae5' : '#f3f4f6' }
                ]}>
                  <Ionicons
                    name={u.status === 1 ? 'person' : 'person-outline'}
                    size={24}
                    color={u.status === 1 ? '#059669' : '#6b7280'}
                  />
                </View>

                <View style={styles.userCardInfo}>
                  <Text style={styles.userCardName}>{u.name}</Text>
                  <Text style={styles.userCardEmail}>{u.email}</Text>
                  <View style={[
                    styles.userCardBadge,
                    { backgroundColor: u.status === 1 ? '#d1fae5' : '#f3f4f6' }
                  ]}>
                    <Text style={[
                      styles.userCardStatus,
                      { color: u.status === 1 ? '#059669' : '#6b7280' }
                    ]}>
                      {u.status === 1 ? 'Activo' : 'Inactivo'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.userCardArrow}>
                <Ionicons name="chevron-forward" size={22} color="#059669" />
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 20 }} />
      </View>

      {/* Modal de detalles del usuario */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles del Usuario</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#dc2626" />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={[
                  styles.modalUserHeader,
                  { backgroundColor: selectedUser.status === 1 ? '#d1fae5' : '#f3f4f6' }
                ]}>
                  <View style={styles.modalAvatar}>
                    <Ionicons
                      name="person"
                      size={40}
                      color={selectedUser.status === 1 ? '#059669' : '#6b7280'}
                    />
                  </View>
                  <Text style={styles.modalUserName}>{selectedUser.name}</Text>
                  <View style={[
                    styles.modalStatusBadge,
                    { backgroundColor: selectedUser.status === 1 ? '#10b981' : '#6b7280' }
                  ]}>
                    <Text style={styles.modalStatusText}>
                      {selectedUser.status === 1 ? 'ACTIVO' : 'INACTIVO'}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalInfoContainer}>
                  <View style={styles.modalInfoItem}>
                    <Text style={styles.modalInfoLabel}>CORREO ELECTRÓNICO</Text>
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="mail" size={20} color="#059669" style={{ marginRight: 10 }} />
                      <Text style={styles.modalInfoText}>{selectedUser.email}</Text>
                    </View>
                  </View>

                  <View style={styles.modalInfoItem}>
                    <Text style={styles.modalInfoLabel}>NÚMERO DE TELÉFONO</Text>
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="call" size={20} color="#059669" style={{ marginRight: 10 }} />
                      <Text style={styles.modalInfoText}>{selectedUser.phoneNumber}</Text>
                    </View>
                  </View>

                  <View style={styles.modalInfoItem}>
                    <Text style={styles.modalInfoLabel}>ROL EN EL SISTEMA</Text>
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="shield-checkmark" size={20} color="#059669" style={{ marginRight: 10 }} />
                      <Text style={styles.modalInfoText}>
                        {selectedUser.roles?.[0] || 'Usuario'}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => confirmChangeStatus(selectedUser.email, selectedUser.status)}
                  style={[
                    styles.modalActionButton,
                    { backgroundColor: selectedUser.status === 1 ? '#dc2626' : '#10b981' }
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={styles.modalActionContent}>
                    <Ionicons
                      name={selectedUser.status === 1 ? 'close-circle' : 'checkmark-circle'}
                      size={24}
                      color="white"
                      style={{ marginRight: 10 }}
                    />
                    <Text style={styles.modalActionText}>
                      {selectedUser.status === 1 ? 'Desactivar Usuario' : 'Activar Usuario'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL DE ERROR PERSONALIZADO */}
      <Modal
        visible={errorModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeErrorModal}
      >
        <View style={styles.errorModalOverlay}>
          <View style={styles.errorModalContent}>
            <View style={[styles.errorModalIcon, { backgroundColor: `${errorModal.iconColor}15` }]}>
              <Ionicons name={errorModal.icon} size={48} color={errorModal.iconColor} />
            </View>
            
            <Text style={styles.errorModalTitle}>{errorModal.title}</Text>
            <Text style={styles.errorModalMessage}>{errorModal.message}</Text>
            
            <TouchableOpacity
              style={[styles.errorModalButton, { backgroundColor: errorModal.iconColor }]}
              onPress={closeErrorModal}
              activeOpacity={0.8}
            >
              <Text style={styles.errorModalButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE ÉXITO PERSONALIZADO */}
      <Modal
        visible={successModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeSuccessModal}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <View style={[styles.successModalIcon, { backgroundColor: `${successModal.iconColor}15` }]}>
              <Ionicons name={successModal.icon} size={64} color={successModal.iconColor} />
            </View>
            
            <Text style={styles.successModalTitle}>{successModal.title}</Text>
            <Text style={styles.successModalMessage}>{successModal.message}</Text>
          </View>
        </View>
      </Modal>

      {/* MODAL DE CONFIRMACIÓN PERSONALIZADO */}
      <Modal
        visible={confirmModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeConfirmModal}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContent}>
            <View style={[styles.confirmModalIcon, { backgroundColor: `${confirmModal.iconColor}15` }]}>
              <Ionicons name={confirmModal.icon} size={48} color={confirmModal.iconColor} />
            </View>
            
            <Text style={styles.confirmModalTitle}>{confirmModal.title}</Text>
            <Text style={styles.confirmModalMessage}>{confirmModal.message}</Text>
            
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={styles.confirmModalCancelButton}
                onPress={closeConfirmModal}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmModalCancelText}>{confirmModal.cancelText}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmModalConfirmButton, { backgroundColor: confirmModal.iconColor }]}
                onPress={handleConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmModalConfirmText}>{confirmModal.confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Aquí irían los estilos, pero se proporcionarán en el siguiente bloque de código.


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
  },
  loadingCard: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  loadingText: {
    marginTop: 16,
    color: '#065f46',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#065f46',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
    overflow: 'hidden',
  },
  headerCircle1: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 200,
    height: 200,
    backgroundColor: '#059669',
    borderRadius: 100,
    opacity: 0.1,
    transform: [{ translateX: 50 }, { translateY: -50 }],
  },
  headerCircle2: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 150,
    height: 150,
    backgroundColor: '#10b981',
    borderRadius: 75,
    opacity: 0.1,
    transform: [{ translateX: -40 }, { translateY: 40 }],
  },
  headerContent: {
    position: 'relative',
    zIndex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerInfo: {
    flex: 1,
  },
  headerLabel: {
    fontSize: 16,
    color: '#d1fae5',
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#a7f3d0',
    marginBottom: 16,
  },
  // *** NUEVOS ESTILOS PARA EL BOTÓN DE PERFIL ***
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10, // Espacio entre botones
  },
  profileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  // **********************************************
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: 'white',
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  roleBadge: {
    backgroundColor: 'rgba(209, 250, 229, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#d1fae5',
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '48%',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  statCardInactive: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '48%',
    shadowColor: '#6b7280',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#6b7280',
  },
  statIconActive: {
    backgroundColor: '#d1fae5',
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIconInactive: {
    backgroundColor: '#f3f4f6',
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 4,
  },
  statNumberInactive: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  statLabelActive: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  statLabelInactive: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionIndicator: {
    width: 4,
    height: 24,
    backgroundColor: '#059669',
    borderRadius: 2,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#065f46',
  },
  userCard: {
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
  },
  userCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userCardAvatar: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  userCardInfo: {
    flex: 1,
  },
  userCardName: {
    fontSize: 16,
    color: '#065f46',
    fontWeight: '700',
    marginBottom: 4,
  },
  userCardEmail: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
  },
  userCardBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  userCardStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
  userCardArrow: {
    backgroundColor: '#f0fdf4',
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#065f46',
  },
  modalCloseButton: {
    backgroundColor: '#fee2e2',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalUserHeader: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  modalAvatar: {
    backgroundColor: 'white',
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalUserName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 8,
  },
  modalStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalStatusText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  modalInfoContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  modalInfoItem: {
    marginBottom: 16,
  },
  modalInfoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
    fontWeight: '600',
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalInfoText: {
    fontSize: 15,
    color: '#065f46',
    fontWeight: '500',
  },
  modalActionButton: {
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalActionContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActionText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 17,
  },

  //  ESTILOS DEL MODAL DE ERROR PERSONALIZADO
  errorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorModalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  errorModalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorModalMessage: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  errorModalButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  errorModalButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // ESTILOS DEL MODAL DE ÉXITO
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  successModalIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  successModalMessage: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ESTILOS DEL MODAL DE CONFIRMACIÓN
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  confirmModalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmModalMessage: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  confirmModalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  confirmModalCancelText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmModalConfirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmModalConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});