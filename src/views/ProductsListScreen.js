/**
 * Pantalla de Mis Productos
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ViewModels
import { useAuthViewModel } from '../viewmodels/Auth.viewmodel';
import { useProductViewModel } from '../viewmodels/Product.viewmodel';

const { width, height } = Dimensions.get('window');

export default function ProductsListScreen({ navigation }) {
  // ViewModels
  const { user, isInitialized } = useAuthViewModel();
  const {
    products,
    isLoading,
    isRefreshing,
    hasLoadedUserProducts,
    loadUserProducts,
    deleteProduct,
  } = useProductViewModel();

  // Estados para modales personalizados
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

  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
    productName: '',
  });

  /**
   * Carga inicial
   */
  useEffect(() => {
    if (!isInitialized || !user) return;

    const silent = hasLoadedUserProducts;
    loadUserProducts(user.id, silent);
  }, [isInitialized, user?.id]);

  /**
   * Refresh silencioso al volver a la pantalla
   */
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (user?.id && hasLoadedUserProducts) {
        loadUserProducts(user.id, true);
      }
    });
    return unsubscribe;
  }, [navigation, user?.id, hasLoadedUserProducts]);

  /**
   * Mostrar modal de exito
   */
  const showSuccess = (title, message) => {
    setSuccessModal({ visible: true, title, message });
  };

  /**
   * Mostrar modal de error
   */
  const showError = (title, message) => {
    setErrorModal({ visible: true, title, message });
  };

  /**
   * Mostrar modal de confirmacion
   */
  const showConfirm = (title, message, onConfirm, productName = '') => {
    setConfirmModal({ visible: true, title, message, onConfirm, productName });
  };

  /**
   * Manejar refresh manual
   */
  const onRefresh = async () => {
    if (user?.id) {
      await loadUserProducts(user.id);
    }
  };

  /**
   * Editar producto
   */
  const handleEdit = (product) => {
    navigation.navigate('ProductForm', {
      product,
      mode: 'edit',
    });
  };

  /**
   * Eliminar producto con modal personalizado
   */
  const handleDelete = (productId, productName) => {
    showConfirm(
      'Eliminar producto',
      `El producto "${productName}" sera eliminado permanentemente. Esta acción no se puede deshacer.`,
      async () => {
        const result = await deleteProduct(productId);
        if (result.success) {
          showSuccess('Producto eliminado', `"${productName}" ha sido eliminado correctamente.`);
          // Recargar lista silenciosamente
          if (user?.id) {
            await loadUserProducts(user.id, true);
          }
        } else {
          showError(
            'Error al eliminar',
            result.error || 'No se pudo eliminar el producto. Por favor intenta de nuevo.'
          );
        }
      },
      productName
    );
  };

  /**
   * Ir a crear producto
   */
  const handleCreateProduct = () => {
    navigation.navigate('ProductForm', {
      mode: 'create',
    });
  };

  /**
   * Renderizar producto
   */
  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      {/* Imagen */}
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.productImage} resizeMode="cover" />
      ) : (
        <View style={styles.noImage}>
          <Ionicons name="image-outline" size={60} color="#d1d5db" />
        </View>
      )}

      {/* Informacion */}
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          {item.categoryName && (
            <View style={styles.categoryBadge}>
              <Ionicons name="pricetag" size={12} color="#059669" />
              <Text style={styles.categoryText}>{item.categoryName}</Text>
            </View>
          )}
        </View>

        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>

        <Text style={styles.productPrice}>
          $
          {item.price.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>

        {item.description && (
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* Botones de Accion */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEdit(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.productId, item.name)}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={styles.deleteButtonText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  /**
   * LOADING 
   */
  if (!isInitialized || (isLoading && !hasLoadedUserProducts && products.length === 0)) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>
            {!isInitialized ? 'Cargando usuario...' : 'Cargando tus productos...'}
          </Text>
        </View>
      </View>
    );
  }

  /**
   * Error si no hay usuario
   */
  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorCircle}>
          <Ionicons name="alert-circle-outline" size={60} color="#ef4444" />
        </View>
        <Text style={styles.errorText}>Error al cargar usuario</Text>
        <Text style={styles.errorSubtext}>Por favor, vuelve a iniciar sesion</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.replace('Login')}
        >
          <Text style={styles.retryButtonText}>Ir al inicio de sesion</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Mis Productos</Text>
          <Text style={styles.headerSubtitle}>
            {products.length} {products.length === 1 ? 'producto' : 'productos'}
          </Text>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleCreateProduct}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Lista de productos */}
      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCircle}>
            <Ionicons name="basket-outline" size={60} color="#059669" />
          </View>
          <Text style={styles.emptyText}>No tienes productos</Text>
          <Text style={styles.emptySubtext}>Publica tu primer producto y comienza a vender</Text>
          <TouchableOpacity
            style={styles.createFirstButton}
            onPress={handleCreateProduct}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.createFirstButtonText}>Crear Producto</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.productId)}
          renderItem={renderProduct}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={['#059669']}
              tintColor="#059669"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* MODAL DE EXITO */}
      <Modal
        visible={successModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSuccessModal({ ...successModal, visible: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#059669" />
            </View>

            <Text style={styles.modalTitle}>{successModal.title}</Text>
            <Text style={styles.modalMessage}>{successModal.message}</Text>

            <TouchableOpacity
              style={styles.successButton}
              onPress={() => setSuccessModal({ ...successModal, visible: false })}
              activeOpacity={0.8}
            >
              <Text style={styles.successButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE ERROR */}
      <Modal
        visible={errorModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setErrorModal({ ...errorModal, visible: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.errorIconContainer}>
              <Ionicons name="close-circle" size={64} color="#ef4444" />
            </View>

            <Text style={styles.modalTitle}>{errorModal.title}</Text>
            <Text style={styles.modalMessage}>{errorModal.message}</Text>

            <TouchableOpacity
              style={styles.errorButton}
              onPress={() => setErrorModal({ ...errorModal, visible: false })}
              activeOpacity={0.8}
            >
              <Text style={styles.errorButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE CONFIRMACION */}
      <Modal
        visible={confirmModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmModal({ ...confirmModal, visible: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.warningIconContainer}>
              <Ionicons name="warning" size={64} color="#f59e0b" />
            </View>

            <Text style={styles.modalTitle}>{confirmModal.title}</Text>
            <Text style={styles.modalMessage}>{confirmModal.message}</Text>

            <View style={styles.confirmButtonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setConfirmModal({ ...confirmModal, visible: false })}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  setConfirmModal({ ...confirmModal, visible: false });
                  confirmModal.onConfirm();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="trash" size={18} color="#fff" />
                <Text style={styles.confirmButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  
  // LOADING 
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
  
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 20,
  },
  header: {
    backgroundColor: '#065f46',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 13, color: '#d1fae5', marginTop: 4, fontWeight: '500' },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: { padding: 12, paddingBottom: 24 },
  columnWrapper: { justifyContent: 'space-between' },
  productCard: {
    width: (width - 36) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  productImage: { width: '100%', height: 150, backgroundColor: '#f9fafb' },
  noImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: { padding: 12 },
  productHeader: { marginBottom: 8 },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  categoryText: { fontSize: 10, color: '#059669', fontWeight: '600' },
  productName: { fontSize: 14, fontWeight: '700', color: '#1f2937', marginBottom: 6 },
  productPrice: { fontSize: 18, fontWeight: 'bold', color: '#059669', marginBottom: 6 },
  productDescription: { fontSize: 11, color: '#6b7280', lineHeight: 16, marginBottom: 10 },
  actionsContainer: { flexDirection: 'row', gap: 6 },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createFirstButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  errorCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: '#059669', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  // ESTILOS DE MODALES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
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
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  warningIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  successButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  successButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  errorButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  confirmButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});