/**
 * EJEMPLO: HomeScreen CON DATADOG INTEGRADO
 * 
 * Este archivo muestra cómo integrar Datadog en tu HomeScreen
 * Solo necesitas copiar las líneas marcadas con 🔥 a tu archivo original
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
  Linking,
  Dimensions,
  TextInput,
  Animated,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ViewModels
import { useAuthViewModel } from '../viewmodels/Auth.viewmodel';
import { useProductViewModel } from '../viewmodels/Product.viewmodel';

// 🔥 IMPORTAR DATADOG
import { useDatadog } from '../hooks/useDatadog';

const { width } = Dimensions.get('window');
const AUTO_REFRESH_INTERVAL = 15000;

export default function HomeScreen({ navigation }) {
  // 🔥 HOOK DE DATADOG
  const {
    trackSearch,
    trackVote,
    trackWhatsAppContact,
    trackRefresh,
    trackProductInteraction,
    trackEvent,
    trackError,
  } = useDatadog('Home'); // Auto-trackea cuando entras a la pantalla

  // Estados locales para UI
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchAnimation = useState(new Animated.Value(0))[0];
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [logoutModal, setLogoutModal] = useState({
    visible: false,
    title: '¿Cerrar sesión?',
    message: 'Se cerrará tu sesión actual y regresarás a la pantalla de inicio de sesión.',
    icon: 'log-out-outline',
    iconColor: '#f59e0b',
    confirmText: 'Cerrar sesión',
    cancelText: 'Cancelar',
  });
  
  const refreshIntervalRef = useRef(null);

  // ViewModels
  const { user, logout } = useAuthViewModel();
  const {
    products,
    isLoading,
    isRefreshing,
    loadAllProducts,
    refreshProducts,
    refreshProductsSilently,
    searchProducts,
    voteProduct,
  } = useProductViewModel();

  /**
   * Cargar productos inicialmente y configurar auto-refresh silencioso
   */
  useEffect(() => {
    loadAllProducts();

    refreshIntervalRef.current = setInterval(() => {
      if (!isLoading && !searchQuery.trim()) {
        refreshProductsSilently();
        // 🔥 TRACKEAR AUTO-REFRESH
        trackRefresh('automatic');
      }
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [searchQuery]);

  /**
   * Refresh al volver a la pantalla
   */
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAllProducts();
      // 🔥 TRACKEAR REFRESH AL ENFOCAR
      trackRefresh('on_focus');
    });
    return unsubscribe;
  }, [navigation]);

  /**
   * 🔥 TRACKEAR BÚSQUEDAS - useEffect para detectar cambios en la búsqueda
   */
  useEffect(() => {
    if (searchQuery.trim()) {
      const filteredProducts = getFilteredAndSortedProducts();
      trackSearch(searchQuery, filteredProducts.length);
    }
  }, [searchQuery]);

  const isMyProduct = (product) => {
    if (!user || !product) return false;
    const productUserId = String(product.userId || '');
    const currentUserId = String(user.id || user.userId || '');
    return productUserId === currentUserId;
  };

  const showLogoutModal = () => {
    setLogoutModal(prev => ({ ...prev, visible: true }));
    // 🔥 TRACKEAR INTENTO DE LOGOUT
    trackEvent('logout_modal_opened');
  };

  const closeLogoutModal = () => {
    setLogoutModal(prev => ({ ...prev, visible: false }));
    // 🔥 TRACKEAR CANCELACIÓN DE LOGOUT
    trackEvent('logout_cancelled');
  };

  const handleLogout = () => {
    showLogoutModal();
  };

  const confirmLogout = async () => {
    closeLogoutModal();
    
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    // 🔥 TRACKEAR LOGOUT CONFIRMADO
    trackEvent('logout_confirmed');
    
    const result = await logout();
    if (result.success) {
      navigation.replace('Login');
    } else {
      Alert.alert('Error', result.error || 'No se pudo cerrar sesión');
      // 🔥 TRACKEAR ERROR DE LOGOUT
      trackError(new Error(result.error || 'Logout failed'), {
        context: 'logout',
      });
    }
  };

  /**
   * Manejar refresh manual (pull-to-refresh)
   */
  const onRefresh = async () => {
    // 🔥 TRACKEAR REFRESH MANUAL
    trackRefresh('manual');
    await refreshProducts();
  };

  /**
   * Manejar WhatsApp
   */
  const handleWhatsApp = (product) => {
    if (!product.userPhone) {
      Alert.alert('Sin contacto', 'Este vendedor no tiene número de teléfono registrado.');
      return;
    }

    let phoneNumber = product.userPhone.replace(/[^\d]/g, '');

    if (phoneNumber.length !== 10) {
      Alert.alert('Número inválido', 'El número de teléfono del vendedor no es válido.');
      return;
    }

    phoneNumber = '52' + phoneNumber;
    const message = `Hola! Estoy interesado en tu producto: *${product.name}*\nPrecio: $${product.price.toLocaleString()}`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    // 🔥 TRACKEAR CONTACTO POR WHATSAPP
    trackWhatsAppContact(product.productId, product.name, phoneNumber);

    Linking.openURL(whatsappUrl).catch((error) => {
      Alert.alert('Error', 'No se pudo abrir WhatsApp. Verifica que esté instalado.');
      // 🔥 TRACKEAR ERROR AL ABRIR WHATSAPP
      trackError(error, {
        context: 'whatsapp_open',
        product_id: product.productId,
      });
    });
  };

  /**
   * Manejar voto (like/dislike)
   */
  const handleVote = async (productId, isLike) => {
    if (!user) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para votar');
      return;
    }

    // 🔥 TRACKEAR VOTO
    const product = products.find(p => p.productId === productId);
    trackVote(productId, isLike, product?.name || '');

    const result = await voteProduct(productId, user.id, isLike);
    
    if (!result.success) {
      Alert.alert('Error', result.error || 'No se pudo registrar el voto');
      // 🔥 TRACKEAR ERROR DE VOTO
      trackError(new Error(result.error || 'Vote failed'), {
        context: 'vote',
        product_id: productId,
        vote_type: isLike ? 'like' : 'dislike',
      });
    }
  };

  /**
   * Toggle descripción expandida
   */
  const toggleDescription = (productId) => {
    const isExpanding = !expandedDescriptions[productId];
    
    setExpandedDescriptions(prev => ({
      ...prev,
      [productId]: isExpanding,
    }));

    // 🔥 TRACKEAR EXPANSIÓN DE DESCRIPCIÓN
    if (isExpanding) {
      const product = products.find(p => p.productId === productId);
      trackProductInteraction('expand_description', productId, product?.name || '');
    }
  };

  /**
   * Toggle búsqueda
   */
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

    // 🔥 TRACKEAR TOGGLE DE BÚSQUEDA
    trackEvent('search_toggled', {
      opened: !showSearch,
    });
  };

  /**
   * Filtrar y ordenar productos
   */
  const getFilteredAndSortedProducts = () => {
    let filtered = searchProducts(searchQuery);
    filtered = [...filtered].reverse();
    return filtered;
  };

  const filteredProducts = getFilteredAndSortedProducts();

  /**
   * Renderizar producto estilo Facebook
   */
  const renderProduct = ({ item }) => {
    const isOwner = isMyProduct(item);
    const isExpanded = expandedDescriptions[item.productId];
    const descriptionLength = item.description?.length || 0;
    const shouldShowMore = descriptionLength > 150;

    return (
      <View style={styles.productCard}>
        <View style={styles.productHeader}>
          <View style={styles.sellerInfo}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarText}>
                {item.userName ? item.userName.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <View style={styles.sellerDetails}>
              <Text style={styles.sellerName}>{item.userName || 'Usuario Anónimo'}</Text>
              {item.categoryName && <Text style={styles.categoryText}>{item.categoryName}</Text>}
            </View>
          </View>
          {isOwner && (
            <View style={styles.ownerBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.ownerBadgeText}>Tu publicación</Text>
            </View>
          )}
        </View>

        {item.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productPrice}>
              ${item.price.toLocaleString('es-MX', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} MXN
            </Text>
            <Text
              style={styles.productDescription}
              numberOfLines={isExpanded ? undefined : 3}
            >
              {item.description}
            </Text>
            {shouldShowMore && (
              <TouchableOpacity onPress={() => toggleDescription(item.productId)}>
                <Text style={styles.seeMoreText}>
                  {isExpanded ? 'Ver menos' : 'Ver más'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <View style={styles.noImage}>
            <Ionicons name="image-outline" size={60} color="#d1d5db" />
          </View>
        )}

        <View style={styles.interactionBar}>
          <View style={styles.votesContainer}>
            <TouchableOpacity
              style={styles.voteButton}
              onPress={() => handleVote(item.productId, true)}
              disabled={isOwner}
            >
              <Ionicons 
                name="thumbs-up" 
                size={20} 
                color={isOwner ? '#9ca3af' : '#059669'} 
              />
              <Text style={[styles.voteCount, isOwner && styles.voteCountDisabled]}>
                {item.likesCount || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.voteButton}
              onPress={() => handleVote(item.productId, false)}
              disabled={isOwner}
            >
              <Ionicons 
                name="thumbs-down" 
                size={20} 
                color={isOwner ? '#9ca3af' : '#ef4444'} 
              />
              <Text style={[styles.voteCount, isOwner && styles.voteCountDisabled]}>
                {item.dislikesCount || 0}
              </Text>
            </TouchableOpacity>
          </View>

          {!isOwner && (
            <TouchableOpacity
              style={styles.whatsappButtonCompact}
              onPress={() => handleWhatsApp(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#fff" />
              <Text style={styles.whatsappButtonCompactText}>Contactar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // LOADING
  if (isLoading && products.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Cargando información...</Text>
        </View>
      </View>
    );
  }

  const searchHeight = searchAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoMini}>
            <Ionicons name="restaurant" size={24} color="#059669" />
          </View>
          <Text style={styles.headerTitle}>UFood</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={toggleSearch}>
            <Ionicons name={showSearch ? 'close' : 'search'} size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              // 🔥 TRACKEAR NAVEGACIÓN A LISTA DE PRODUCTOS
              trackEvent('navigate_to_products_list');
              navigation.navigate('ProductsList');
            }}
          >
            <Ionicons name="grid-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => {
              // 🔥 TRACKEAR NAVEGACIÓN A PERFIL
              trackEvent('navigate_to_profile');
              navigation.navigate('Profile');
            }}
          >
            <Ionicons name="document-text-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View style={[styles.searchContainer, { height: searchHeight }]}>
        {showSearch && (
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar productos, categorías..."
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

      {searchQuery.trim() !== '' && (
        <View style={styles.resultsCounter}>
          <Text style={styles.resultsText}>
            {filteredProducts.length} {filteredProducts.length === 1 ? 'resultado' : 'resultados'}
          </Text>
        </View>
      )}

      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCircle}>
            <Ionicons
              name={searchQuery ? 'search-outline' : 'fast-food-outline'}
              size={60}
              color="#059669"
            />
          </View>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No se encontraron resultados' : 'No hay productos disponibles'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery
              ? `No hay productos que coincidan con "${searchQuery}"`
              : 'Aún no hay productos publicados'}
          </Text>
          {searchQuery && (
            <TouchableOpacity style={styles.clearSearchButton} onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchButtonText}>Limpiar búsqueda</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => String(item.productId)}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
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

      <Modal
        visible={logoutModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeLogoutModal}
      >
        <View style={styles.logoutModalOverlay}>
          <View style={styles.logoutModalContent}>
            <View style={[styles.logoutModalIcon, { backgroundColor: `${logoutModal.iconColor}15` }]}>
              <Ionicons name={logoutModal.icon} size={48} color={logoutModal.iconColor} />
            </View>
            
            <Text style={styles.logoutModalTitle}>{logoutModal.title}</Text>
            <Text style={styles.logoutModalMessage}>{logoutModal.message}</Text>
            
            <View style={styles.logoutModalButtons}>
              <TouchableOpacity
                style={styles.logoutModalCancelButton}
                onPress={closeLogoutModal}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutModalCancelText}>{logoutModal.cancelText}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.logoutModalConfirmButton, { backgroundColor: logoutModal.iconColor }]}
                onPress={confirmLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutModalConfirmText}>{logoutModal.confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Estilos... (los mismos del archivo original)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0fdf4' },
  loadingCard: { backgroundColor: 'white', padding: 40, borderRadius: 20, alignItems: 'center', shadowColor: '#059669', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  loadingText: { marginTop: 16, color: '#065f46', fontSize: 16, fontWeight: '600' },
  header: { backgroundColor: '#065f46', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoMini: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },
  headerButtons: { flexDirection: 'row', gap: 12 },
  headerButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center' },
  searchContainer: { backgroundColor: '#065f46', paddingHorizontal: 20, overflow: 'hidden' },
  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, height: 48, marginBottom: 12, gap: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#1f2937', fontWeight: '500' },
  resultsCounter: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#d1fae5', borderBottomWidth: 1, borderBottomColor: '#a7f3d0' },
  resultsText: { fontSize: 14, color: '#059669', fontWeight: '600' },
  listContent: { paddingBottom: 20, paddingTop: 12 },
  productCard: { backgroundColor: '#fff', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  sellerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sellerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },
  sellerAvatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  sellerDetails: { justifyContent: 'center' },
  sellerName: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' },
  categoryText: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  ownerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ownerBadgeText: { fontSize: 11, color: '#059669', fontWeight: '600' },
  descriptionContainer: { paddingHorizontal: 16, paddingBottom: 12 },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  productPrice: { fontSize: 18, fontWeight: 'bold', color: '#059669', marginBottom: 8 },
  productDescription: { fontSize: 14, color: '#374151', lineHeight: 20 },
  seeMoreText: { fontSize: 14, color: '#059669', fontWeight: '600', marginTop: 4 },
  productImage: { width: '100%', height: 300, backgroundColor: '#f9fafb' },
  noImage: { width: '100%', height: 300, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center' },
  interactionBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  votesContainer: { flexDirection: 'row', gap: 16 },
  voteButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  voteCount: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  voteCountDisabled: { color: '#9ca3af' },
  whatsappButtonCompact: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#25D366', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  whatsappButtonCompactText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#065f46', marginBottom: 8, textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 20 },
  clearSearchButton: { backgroundColor: '#059669', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 10 },
  clearSearchButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  logoutModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  logoutModalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 28, width: '100%', maxWidth: 400, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  logoutModalIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  logoutModalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 12 },
  logoutModalMessage: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  logoutModalButtons: { flexDirection: 'row', width: '100%', gap: 12 },
  logoutModalCancelButton: { flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center', backgroundColor: '#f3f4f6', borderWidth: 2, borderColor: '#e5e7eb' },
  logoutModalCancelText: { color: '#6b7280', fontSize: 16, fontWeight: 'bold' },
  logoutModalConfirmButton: { flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  logoutModalConfirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
});