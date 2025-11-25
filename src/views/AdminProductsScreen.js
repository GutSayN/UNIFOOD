/**
 * AdminProductsScreen - Gestión de Productos
 * Lista de productos con búsqueda, filtrado y acciones RUD
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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDatadog } from '../hooks/useDatadog';
import adminService from '../services/Admin.service';

export default function AdminProductsScreen({ navigation }) {
  const { trackEvent, trackError } = useDatadog('AdminProducts');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchAnimation = useState(new Animated.Value(0))[0];
  const AUTO_REFRESH_INTERVAL = 2000;
  const [deleteModal, setDeleteModal] = useState({
    visible: false,
    product: null,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, products]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const loadedProducts = await adminService.getAllProducts();
      setProducts(loadedProducts);
      trackEvent('admin_products_loaded', { count: loadedProducts.length });
    } catch (error) {
      console.error('Error loading products:', error);
      trackError(error, { context: 'loadProducts' });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Al inicio del componente, después de los otros useEffect
useEffect(() => {
  const intervalId = setInterval(() => {
    // Solo auto-refrescar si no hay una búsqueda activa y no está cargando
    if (!searchQuery && !isLoading && !isRefreshing) {
      loadProducts();
    }
  }, AUTO_REFRESH_INTERVAL);

  // Limpiar el intervalo cuando el componente se desmonte
  return () => clearInterval(intervalId);
}, [searchQuery, isLoading, isRefreshing]);


  const onRefresh = async () => {
    setIsRefreshing(true);
    trackEvent('admin_products_refreshed');
    await loadProducts();
  };

  const filterProducts = () => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = products.filter(product => {
      const nameMatch = product.name?.toLowerCase().includes(query);
      const categoryMatch = product.categoryName?.toLowerCase().includes(query);
      const priceMatch = product.price?.toString().includes(query);
      const userMatch = product.userName?.toLowerCase().includes(query);
      return nameMatch || categoryMatch || priceMatch || userMatch;
    });

    setFilteredProducts(filtered);
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

    trackEvent('admin_products_search_toggled', { opened: !showSearch });
  };

  const handleProductPress = (product) => {
    trackEvent('admin_product_selected', { product_id: product.productId });
    navigation.navigate('AdminProductDetail', { product });
  };

  const handleDeletePress = (product) => {
    setDeleteModal({ visible: true, product });
    trackEvent('admin_product_delete_initiated', { product_id: product.productId });
  };

  const confirmDelete = async () => {
    const product = deleteModal.product;
    setDeleteModal({ visible: false, product: null });

    try {
      setIsLoading(true);
      await adminService.deleteProduct(product.productId);
      
      setProducts(prev => prev.filter(p => p.productId !== product.productId));
      
      trackEvent('admin_product_deleted', { product_id: product.productId });
    } catch (error) {
      console.error('Error deleting product:', error);
      trackError(error, { context: 'deleteProduct', product_id: product.productId });
      alert('Error al eliminar producto: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductPress(item)}
      activeOpacity={0.8}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.productImage} resizeMode="cover" />
      ) : (
        <View style={styles.noImage}>
          <Ionicons name="image-outline" size={40} color="#d1d5db" />
        </View>
      )}

      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          {item.categoryName && (
            <View style={styles.categoryBadge}>
              <Ionicons name="pricetag" size={10} color="#059669" />
              <Text style={styles.categoryText}>{item.categoryName}</Text>
            </View>
          )}
        </View>

        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productPrice}>
          ${item.price.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>

        {item.description && (
          <Text style={styles.productDescription} numberOfLines={2}>{item.description}</Text>
        )}

        {item.userName && (
          <View style={styles.sellerInfo}>
            <Ionicons name="person-outline" size={12} color="#6b7280" />
            <Text style={styles.sellerText}>Vendedor: {item.userName}</Text>
          </View>
        )}

        <View style={styles.productActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleProductPress(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={16} color="#059669" />
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeletePress(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={styles.deleteButtonText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && products.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Cargando productos...</Text>
      </View>
    );
  }

  const searchHeight = searchAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
  });

  return (
    <SafeAreaView style={styles.container}>
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
          <Text style={styles.headerTitle}>Gestión de Productos</Text>
          <Text style={styles.headerSubtitle}>
            {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <TouchableOpacity style={styles.searchButton} onPress={toggleSearch}>
          <Ionicons name={showSearch ? 'close' : 'search'} size={24} color="white" />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.searchContainer, { height: searchHeight }]}>
        {showSearch && (
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre, categoría, precio o vendedor..."
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

      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCircle}>
            <Ionicons name={searchQuery ? 'search-outline' : 'fast-food-outline'} size={60} color="#f59e0b" />
          </View>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No se encontraron productos' : 'No hay productos'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Aún no hay productos publicados'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => String(item.productId)}
          renderItem={renderProduct}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#059669']} tintColor="#059669" />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={deleteModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteModal({ visible: false, product: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Ionicons name="warning" size={48} color="#ef4444" />
            </View>
            <Text style={styles.modalTitle}>¿Eliminar producto?</Text>
            <Text style={styles.modalMessage}>
              Se eliminará "{deleteModal.product?.name}".{'\n\n'}Esta acción no se puede deshacer.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setDeleteModal({ visible: false, product: null })}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmButton} onPress={confirmDelete} activeOpacity={0.8}>
                <Ionicons name="trash" size={18} color="#fff" />
                <Text style={styles.modalConfirmText}>Eliminar</Text>
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
  loadingText: { marginTop: 16, color: '#065f46', fontSize: 16, fontWeight: '600' },
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
  searchContainer: { backgroundColor: '#065f46', paddingHorizontal: 20, overflow: 'hidden' },
  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, height: 48, marginBottom: 12, gap: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#1f2937', fontWeight: '500' },
  listContent: { padding: 12, paddingBottom: 24 },
  columnWrapper: { justifyContent: 'space-between' },
  productCard: { width: '48%', backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  productImage: { width: '100%', height: 120, backgroundColor: '#f9fafb' },
  noImage: { width: '100%', height: 120, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center' },
  productInfo: { padding: 10 },
  productHeader: { marginBottom: 6 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#d1fae5', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  categoryText: { fontSize: 9, color: '#059669', fontWeight: '600' },
  productName: { fontSize: 13, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  productPrice: { fontSize: 16, fontWeight: 'bold', color: '#f59e0b', marginBottom: 4 },
  productDescription: { fontSize: 10, color: '#6b7280', lineHeight: 14, marginBottom: 6 },
  sellerInfo: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  sellerText: { fontSize: 10, color: '#6b7280' },
  productActions: { flexDirection: 'row', gap: 4 },
  editButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: '#d1fae5', paddingVertical: 6, borderRadius: 8 },
  editButtonText: { fontSize: 11, fontWeight: 'bold', color: '#059669' },
  deleteButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: '#fee2e2', paddingVertical: 6, borderRadius: 8 },
  deleteButtonText: { fontSize: 11, fontWeight: 'bold', color: '#ef4444' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#065f46', marginBottom: 8, textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 28, width: '100%', maxWidth: 400, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  modalIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fee2e215', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 12 },
  modalMessage: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  modalButtons: { flexDirection: 'row', width: '100%', gap: 12 },
  modalCancelButton: { flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center', backgroundColor: '#f3f4f6', borderWidth: 2, borderColor: '#e5e7eb' },
  modalCancelText: { color: '#6b7280', fontSize: 16, fontWeight: 'bold' },
  modalConfirmButton: { flex: 1, flexDirection: 'row', gap: 8, paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ef4444', shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  modalConfirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
});

