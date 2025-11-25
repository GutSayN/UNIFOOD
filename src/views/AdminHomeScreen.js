/**
 * AdminHomeScreen - Dashboard Principal del Administrador
 * CON DATADOG INTEGRADO ✅
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthViewModel } from '../viewmodels/Auth.viewmodel';
import { useDatadog } from '../hooks/useDatadog';
import adminService from '../services/Admin.service';

const { width } = Dimensions.get('window');

export default function AdminHomeScreen({ navigation }) {
  const { user, logout } = useAuthViewModel();
  const { trackEvent, trackError } = useDatadog('AdminHome');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalProducts: 0,
  });

  // Modal de confirmación de logout
  const [logoutModal, setLogoutModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const dashboardStats = await adminService.getDashboardStats();
      setStats(dashboardStats);
      trackEvent('admin_dashboard_loaded', {
        total_users: dashboardStats.totalUsers,
        total_products: dashboardStats.totalProducts,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
      trackError(error, { context: 'loadDashboardData' });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    trackEvent('admin_dashboard_refreshed');
    await loadDashboardData();
  };

  const handleLogout = () => {
    // Mostrar modal de confirmación
    setLogoutModal(true);
  };

  const confirmLogout = async () => {
    setLogoutModal(false);
    trackEvent('admin_logout');
    const result = await logout();
    if (result.success) {
      navigation.replace('Login');
    }
  };

  const handleNavigateToUsers = () => {
    trackEvent('admin_navigate_to_users');
    navigation.navigate('AdminUsers');
  };

  const handleNavigateToProducts = () => {
    trackEvent('admin_navigate_to_products');
    navigation.navigate('AdminProducts');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Cargando dashboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#059669']} tintColor="#059669" />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerBackground}>
            <View style={styles.circle1} />
            <View style={styles.circle2} />
            <View style={styles.circle3} />
          </View>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={24} color="#fff" />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerSubtitle}>PANEL DE ADMINISTRACIÓN</Text>
                <Text style={styles.headerTitle}>Bienvenido, {user?.name || 'Admin'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contentWrapper}>
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, styles.statCardUsers]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="people" size={32} color="#059669" />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>{stats.totalUsers}</Text>
                <Text style={styles.statLabel}>Usuarios Totales</Text>
              </View>
              <View style={styles.statDetails}>
                <View style={styles.statDetailRow}>
                  <View style={[styles.statusDot, styles.statusDotActive]} />
                  <Text style={styles.statDetailText}>{stats.activeUsers} activos</Text>
                </View>
                <View style={styles.statDetailRow}>
                  <View style={[styles.statusDot, styles.statusDotInactive]} />
                  <Text style={styles.statDetailText}>{stats.inactiveUsers} inactivos</Text>
                </View>
              </View>
            </View>
            <View style={[styles.statCard, styles.statCardProducts]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="fast-food" size={32} color="#f59e0b" />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>{stats.totalProducts}</Text>
                <Text style={styles.statLabel}>Productos Totales</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View style={styles.sectionIndicator} />
            <Text style={styles.sectionTitle}>Gestión</Text>
          </View>

          <TouchableOpacity style={styles.managementCard} onPress={handleNavigateToUsers} activeOpacity={0.8}>
            <View style={styles.managementIconContainer}>
              <Ionicons name="people" size={32} color="#059669" />
            </View>
            <View style={styles.managementContent}>
              <Text style={styles.managementTitle}>Usuarios</Text>
              <Text style={styles.managementDescription}>Ver y gestionar usuarios de la plataforma</Text>
              <View style={styles.managementStats}>
                <Text style={styles.managementStatsText}>
                  {stats.totalUsers} usuario{stats.totalUsers !== 1 ? 's' : ''} registrado{stats.totalUsers !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <View style={styles.managementArrow}>
              <Ionicons name="chevron-forward" size={24} color="#6b7280" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.managementCard} onPress={handleNavigateToProducts} activeOpacity={0.8}>
            <View style={[styles.managementIconContainer, styles.managementIconProducts]}>
              <Ionicons name="fast-food" size={32} color="#f59e0b" />
            </View>
            <View style={styles.managementContent}>
              <Text style={styles.managementTitle}>Productos</Text>
              <Text style={styles.managementDescription}>Ver, editar y gestionar productos publicados</Text>
              <View style={styles.managementStats}>
                <Text style={styles.managementStatsText}>
                  {stats.totalProducts} producto{stats.totalProducts !== 1 ? 's' : ''} publicado{stats.totalProducts !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <View style={styles.managementArrow}>
              <Ionicons name="chevron-forward" size={24} color="#6b7280" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL DE CONFIRMACIÓN DE LOGOUT */}
      <Modal
        visible={logoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Ionicons name="log-out" size={48} color="#f59e0b" />
            </View>

            <Text style={styles.modalTitle}>¿Cerrar sesión?</Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro de que deseas cerrar sesión como administrador?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setLogoutModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={confirmLogout}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out" size={18} color="#fff" />
                <Text style={styles.modalConfirmText}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0fdf4' },
  loadingCard: { backgroundColor: 'white', padding: 40, borderRadius: 20, alignItems: 'center', shadowColor: '#059669', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  loadingText: { marginTop: 16, color: '#065f46', fontSize: 16, fontWeight: '600' },
  scrollContent: { paddingBottom: 30 },
  header: { position: 'relative', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 30, overflow: 'hidden' },
  headerBackground: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#065f46' },
  circle1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: '#059669', opacity: 0.2, top: -70, right: -50 },
  circle2: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: '#10b981', opacity: 0.15, bottom: -50, left: -30 },
  circle3: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: '#34d399', opacity: 0.1, top: 15, left: '40%' },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  adminBadge: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  headerTextContainer: { flex: 1 },
  headerSubtitle: { fontSize: 11, fontWeight: '700', color: '#d1fae5', letterSpacing: 1, marginBottom: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  logoutButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
  contentWrapper: { backgroundColor: '#f0fdf4', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -20, paddingHorizontal: 20, paddingTop: 30 },
  statsContainer: { marginBottom: 30 },
  statCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5 },
  statCardUsers: { borderLeftWidth: 5, borderLeftColor: '#059669' },
  statCardProducts: { borderLeftWidth: 5, borderLeftColor: '#f59e0b' },
  statIconContainer: { width: 60, height: 60, borderRadius: 15, backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statInfo: { marginBottom: 12 },
  statValue: { fontSize: 32, fontWeight: 'bold', color: '#065f46', marginBottom: 4 },
  statLabel: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  statDetails: { gap: 6 },
  statDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusDotActive: { backgroundColor: '#10b981' },
  statusDotInactive: { backgroundColor: '#ef4444' },
  statDetailText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionIndicator: { width: 4, height: 20, backgroundColor: '#059669', borderRadius: 2, marginRight: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#065f46' },
  managementCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5 },
  managementIconContainer: { width: 60, height: 60, borderRadius: 15, backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  managementIconProducts: { backgroundColor: '#fef3c7' },
  managementContent: { flex: 1 },
  managementTitle: { fontSize: 18, fontWeight: 'bold', color: '#065f46', marginBottom: 6 },
  managementDescription: { fontSize: 13, color: '#6b7280', lineHeight: 18, marginBottom: 8 },
  managementStats: { paddingVertical: 4, paddingHorizontal: 10, backgroundColor: '#f0fdf4', borderRadius: 8, alignSelf: 'flex-start' },
  managementStatsText: { fontSize: 11, fontWeight: '600', color: '#059669' },
  managementArrow: { marginLeft: 8 },
  
  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 28, width: '100%', maxWidth: 400, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  modalIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fef3c715', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 12 },
  modalMessage: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  modalButtons: { flexDirection: 'row', width: '100%', gap: 12 },
  modalCancelButton: { flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center', backgroundColor: '#f3f4f6', borderWidth: 2, borderColor: '#e5e7eb' },
  modalCancelText: { color: '#6b7280', fontSize: 16, fontWeight: 'bold' },
  modalConfirmButton: { flex: 1, flexDirection: 'row', gap: 8, paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f59e0b', shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  modalConfirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
});