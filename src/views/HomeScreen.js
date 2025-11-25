/**
 * Pantalla Principal (Home)
 * CON HEADER MEJORADO CON CÍRCULOS DECORATIVOS ✨
 * CON FILTRO DE CATEGORÍAS EN TIEMPO REAL ✅
 * CON DATADOG INTEGRADO ✅
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
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// ViewModels
import { useAuthViewModel } from '../viewmodels/Auth.viewmodel';
import { useProductViewModel } from '../viewmodels/Product.viewmodel';

// Config
import CONFIG from '../config/app.config';

// 🔥 DATADOG
import { useDatadog } from '../hooks/useDatadog';

const { width } = Dimensions.get('window');
const AUTO_REFRESH_INTERVAL = 5000;

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
  } = useDatadog('Home');

  // Estados locales para UI
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchAnimation = useState(new Animated.Value(0))[0];
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  
  // Estados para filtro de categorías
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const categoryAnimation = useState(new Animated.Value(0))[0];
  
  // Estado para tracking de votos del usuario
  const [userVotes, setUserVotes] = useState({});
  
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
   * Guardar votos en AsyncStorage
   */
  const saveVotesToStorage = async (votes) => {
    try {
      if (user) {
        const key = `userVotes_${user.id || user.userId}`;
        await AsyncStorage.setItem(key, JSON.stringify(votes));
      }
    } catch (error) {
      console.error('Error guardando votos:', error);
    }
  };

  /**
   * Cargar votos desde AsyncStorage
   */
  const loadVotesFromStorage = async () => {
    try {
      if (user) {
        const key = `userVotes_${user.id || user.userId}`;
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const votes = JSON.parse(stored);
          setUserVotes(votes);
          return votes;
        }
      }
    } catch (error) {
      console.error('Error cargando votos:', error);
    }
    return {};
  };

  /**
   * Cargar votos guardados al iniciar
   */
  useEffect(() => {
    if (user) {
      loadVotesFromStorage();
    }
  }, [user]);

  /**
   * Cargar productos inicialmente y configurar auto-refresh silencioso
   */
  useEffect(() => {
    loadAllProducts();

    refreshIntervalRef.current = setInterval(() => {
      if (!isLoading && !searchQuery.trim()) {
        refreshProductsSilently();
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
   * Cargar votos del usuario desde los productos
   */
  useEffect(() => {
    if (!user || !products || products.length === 0) return;

    setUserVotes(prevVotes => {
      const newVotesMap = { ...prevVotes };
      
      products.forEach(product => {
        if (newVotesMap[product.productId] === undefined) {
          if (product.userVote) {
            newVotesMap[product.productId] = product.userVote;
          } else if (product.voters && Array.isArray(product.voters)) {
            const userVoteData = product.voters.find(
              v => String(v.userId) === String(user.id || user.userId)
            );
            if (userVoteData) {
              newVotesMap[product.productId] = userVoteData.isLike ? 'like' : 'dislike';
            }
          }
        }
      });

      return newVotesMap;
    });
    
    trackEvent('user_votes_loaded', {
      votes_count: Object.keys(userVotes).length,
    });
  }, [products, user]);

  /**
   * Refresh al volver a la pantalla
   */
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAllProducts();
      trackRefresh('on_focus');
    });
    return unsubscribe;
  }, [navigation]);

  /**
   * Trackear búsquedas
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
    trackEvent('logout_modal_opened');
  };

  const closeLogoutModal = () => {
    setLogoutModal(prev => ({ ...prev, visible: false }));
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
    
    trackEvent('logout_confirmed');
    
    const result = await logout();
    if (result.success) {
      navigation.replace('Login');
    } else {
      Alert.alert('Error', result.error || 'No se pudo cerrar sesión');
      trackError(new Error(result.error || 'Logout failed'), {
        context: 'logout',
      });
    }
  };

  const onRefresh = async () => {
    trackRefresh('manual');
    await refreshProducts();
  };

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

    trackWhatsAppContact(product.productId, product.name, phoneNumber);

    Linking.openURL(whatsappUrl).catch((error) => {
      Alert.alert('Error', 'No se pudo abrir WhatsApp. Verifica que esté instalado.');
      trackError(error, {
        context: 'whatsapp_open',
        product_id: product.productId,
      });
    });
  };

  /**
   * Sistema de votos con persistencia local
   */
  const handleVote = async (productId, voteType) => {
    if (!user) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para votar');
      return;
    }

    const currentVote = userVotes[productId];
    const isLike = voteType === 'like';
    
    if (currentVote === voteType) {
      const newVotes = { ...userVotes, [productId]: null };
      setUserVotes(newVotes);
      await saveVotesToStorage(newVotes);
      
      trackEvent('vote_removed', {
        product_id: productId,
        previous_vote: voteType,
      });
      
      return;
    }
    
    const previousVote = currentVote;
    const newVotes = { ...userVotes, [productId]: voteType };
    setUserVotes(newVotes);
    
    await saveVotesToStorage(newVotes);

    const product = products.find(p => p.productId === productId);
    trackVote(productId, isLike, product?.name || '');

    const result = await voteProduct(productId, user.id, isLike);
    
    if (!result.success) {
      const revertedVotes = { ...userVotes, [productId]: previousVote };
      setUserVotes(revertedVotes);
      await saveVotesToStorage(revertedVotes);
      
      Alert.alert('Error', result.error || 'No se pudo registrar el voto');
      trackError(new Error(result.error || 'Vote failed'), {
        context: 'vote',
        product_id: productId,
        vote_type: voteType,
      });
    } else {
      trackEvent('vote_success', {
        product_id: productId,
        vote_type: voteType,
        previous_vote: previousVote,
      });
    }
  };

  const toggleDescription = (productId) => {
    const isExpanding = !expandedDescriptions[productId];
    
    setExpandedDescriptions(prev => ({
      ...prev,
      [productId]: isExpanding,
    }));

    if (isExpanding) {
      const product = products.find(p => p.productId === productId);
      trackProductInteraction('expand_description', productId, product?.name || '');
    }
  };

  /**
   * Toggle búsqueda Y filtro de categorías juntos
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

    Animated.spring(categoryAnimation, {
      toValue,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();

    if (showSearch) {
      setSearchQuery('');
    }

    setShowCategoryFilter(!showCategoryFilter);

    trackEvent('search_and_filter_toggled', {
      opened: !showSearch,
    });
  };

  /**
   * Manejar selección de categoría con auto-limpieza
   */
  const handleCategorySelect = (category) => {
    if (selectedCategory === category && category !== 'Todas') {
      setSelectedCategory('Todas');
      trackEvent('category_filter_cleared', {
        previous_category: category,
      });
    } else {
      setSelectedCategory(category);
      trackEvent('category_filtered', {
        category: category,
        results_count: getFilteredAndSortedProducts().length,
      });
    }
  };

  /**
   * Filtrar y ordenar productos por búsqueda Y categoría
   */
  const getFilteredAndSortedProducts = () => {
    let filtered = searchProducts(searchQuery);
    
    if (selectedCategory !== 'Todas') {
      filtered = filtered.filter(product => 
        product.categoryName === selectedCategory
      );
    }
    
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
    
    const userVote = userVotes[item.productId];
    const hasLiked = userVote === 'like';
    const hasDisliked = userVote === 'dislike';

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
              style={[
                styles.voteButton,
                hasLiked && styles.voteButtonActive,
              ]}
              onPress={() => handleVote(item.productId, 'like')}
              disabled={isOwner}
              activeOpacity={0.7}
            >
              <View style={styles.voteIconWrapper}>
                <Ionicons 
                  name={hasLiked ? 'thumbs-up' : 'thumbs-up-outline'}
                  size={22} 
                  color={isOwner ? '#9ca3af' : hasLiked ? '#059669' : '#6b7280'} 
                />
                <View style={[
                  styles.voteBadge,
                  hasLiked && styles.voteBadgeActive,
                  isOwner && styles.voteBadgeDisabled,
                ]}>
                  <Text style={[
                    styles.voteBadgeText,
                    hasLiked && styles.voteBadgeTextActive,
                    isOwner && styles.voteBadgeTextDisabled,
                  ]}>
                    {item.likesCount || 0}
                  </Text>
                </View>
              </View>
              <Text style={[
                styles.voteText,
                isOwner && styles.voteTextDisabled,
                hasLiked && styles.voteTextActive,
              ]}>
                {hasLiked ? 'Te gustó' : 'Me gusta'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.voteButton,
                hasDisliked && styles.voteButtonActiveDislike,
              ]}
              onPress={() => handleVote(item.productId, 'dislike')}
              disabled={isOwner}
              activeOpacity={0.7}
            >
              <View style={styles.voteIconWrapper}>
                <Ionicons 
                  name={hasDisliked ? 'thumbs-down' : 'thumbs-down-outline'}
                  size={22} 
                  color={isOwner ? '#9ca3af' : hasDisliked ? '#ef4444' : '#6b7280'} 
                />
                <View style={[
                  styles.voteBadge,
                  hasDisliked && styles.voteBadgeActiveDislike,
                  isOwner && styles.voteBadgeDisabled,
                ]}>
                  <Text style={[
                    styles.voteBadgeText,
                    hasDisliked && styles.voteBadgeTextActiveDislike,
                    isOwner && styles.voteBadgeTextDisabled,
                  ]}>
                    {item.dislikesCount || 0}
                  </Text>
                </View>
              </View>
              <Text style={[
                styles.voteText,
                isOwner && styles.voteTextDisabled,
                hasDisliked && styles.voteTextActiveDislike,
              ]}>
                {hasDisliked ? 'No te gustó' : 'No me gusta'}
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

  const categoryHeight = categoryAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 50],
  });

  // Categorías disponibles
  const allCategories = [
    "🌮 Tacos", "🫔 Burritos y Quesadillas", "🥙 Tortas y Pambazo", "🍲 Pozole y Menudo",
    "🌶️ Enchiladas y Chilaquiles", "🫘 Frijoles y Sopes", "🌽 Elotes y Esquites",
    "🥗 Ensaladas Mexicanas", "🍔 Hamburguesas", "🍕 Pizza", "🌭 Hot Dogs",
    "🍟 Papas Fritas", "🥪 Sándwiches", "🍗 Pollo Frito", "🥙 Wraps y Rolls",
    "🍝 Pasta Italiana", "🍜 Comida Asiática", "🍱 Sushi y Comida Japonesa",
    "🥘 Comida Española", "🥗 Comida Mediterránea", "🍛 Comida Hindú",
    "🥟 Comida China", "🍲 Comida Tailandesa", "🍿 Palomitas", "🥨 Pretzels",
    "🧀 Nachos con Queso", "🌶️ Picantes y Sabritas", "🥜 Cacahuates y Nueces",
    "🍪 Galletas Saladas", "🍰 Pasteles", "🧁 Cupcakes", "🍩 Donas",
    "🥧 Pay y Tartas", "🍮 Flanes y Gelatinas", "🍨 Helados", "🍪 Galletas Dulces",
    "🍫 Chocolate y Dulces", "🧇 Waffles y Hotcakes", "☕ Café", "🍵 Té",
    "🥤 Refrescos", "🧃 Jugos Naturales", "🥛 Leche y Bebidas Lácteas",
    "🧋 Bebidas de Boba", "🍹 Smoothies y Batidos", "💧 Agua y Bebidas Hidratantes",
    "🥗 Ensaladas Frescas", "🥙 Bowls Nutritivos", "🍇 Frutas Frescas",
    "🥑 Aguacate y Tostadas", "🥕 Vegetales al Vapor", "🍠 Camote y Tubérculos",
    "🌱 Platillos Veganos", "🥬 Verduras Orgánicas", "🍄 Hongos y Setas",
    "🥜 Proteínas Vegetales", "🌾 Granos y Cereales", "🍳 Huevos al Gusto",
    "🥞 Hotcakes", "🥐 Pan Dulce", "🥓 Tocino y Salchichas", "🥣 Cereales y Avena",
    "🧈 Molletes", "🍱 Comida Corrida", "🍛 Platillos del Día", "🍲 Sopas y Caldos",
    "🥘 Guisados Caseros", "🦐 Camarones", "🐟 Pescado Fresco", "🦀 Cangrejo y Langosta",
    "🦑 Ceviche y Aguachiles", "🍤 Coctel de Mariscos", "🥩 Carne Asada",
    "🍖 Carne al Pastor", "🥓 Tocino y Chorizo", "🍗 Pollo", "🐷 Carnitas y Chicharrón",
    "🥖 Pan Francés", "🥐 Pan Dulce", "🍞 Pan Blanco", "🥨 Pan Artesanal",
    "🧁 Panqués", "📦 Otro",
  ];
  
  const availableCategories = ['Todas', ...allCategories];

  return (
    <View style={styles.container}>
      {/* 🎨 HEADER MEJORADO CON CÍRCULOS DECORATIVOS */}
      <View style={styles.header}>
        {/* Fondo con círculos decorativos */}
        <View style={styles.headerBackground}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.circle3} />
        </View>

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
              trackEvent('navigate_to_products_list');
              navigation.navigate('ProductsList');
            }}
          >
            <Ionicons name="bag-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => {
              trackEvent('navigate_to_profile');
              navigation.navigate('Profile');
            }}
          >
            <Ionicons name="person-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Búsqueda */}
      <Animated.View style={[styles.searchContainer, { height: searchHeight }]}>
        {showSearch && (
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar productos..."
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

      {/* Filtro de Categorías */}
      <Animated.View style={[styles.categoryContainer, { height: categoryHeight }]}>
        {showCategoryFilter && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {availableCategories.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive
                ]}
                onPress={() => handleCategorySelect(category)}
              >
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category && styles.categoryChipTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </Animated.View>

      {/* Indicador de filtros activos */}
      {(searchQuery.trim() !== '' || selectedCategory !== 'Todas') && (
        <View style={styles.filterIndicator}>
          <Text style={styles.filterIndicatorText}>
            {filteredProducts.length} {filteredProducts.length === 1 ? 'resultado' : 'resultados'}
            {selectedCategory !== 'Todas' && ` en ${selectedCategory}`}
          </Text>
        </View>
      )}

      {/* Lista */}
      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCircle}>
            <Ionicons
              name={searchQuery || selectedCategory !== 'Todas' ? 'search-outline' : 'fast-food-outline'}
              size={60}
              color="#059669"
            />
          </View>
          <Text style={styles.emptyText}>
            {searchQuery || selectedCategory !== 'Todas' ? 'No se encontraron resultados' : 'No hay productos disponibles'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery || selectedCategory !== 'Todas'
              ? 'Intenta con otros filtros o búsqueda'
              : 'Aún no hay productos publicados'}
          </Text>
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

      {/* MODAL DE LOGOUT */}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0fdf4' },
  loadingCard: { backgroundColor: 'white', padding: 40, borderRadius: 20, alignItems: 'center', shadowColor: '#059669', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  loadingText: { marginTop: 16, color: '#065f46', fontSize: 16, fontWeight: '600' },
  
  // HEADER MEJORADO CON CÍRCULOS DECORATIVOS
  header: { 
    position: 'relative',
    paddingHorizontal: 20, 
    paddingTop: 50, 
    paddingBottom: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    overflow: 'hidden',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#065f46',
  },
  circle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#059669',
    opacity: 0.2,
    top: -75,
    right: -50,
  },
  circle2: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#10b981',
    opacity: 0.15,
    bottom: 3,
    left: -30,
  },
  circle3: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#34d399',
    opacity: 0.1,
    top: 15,
    left: '40%',
  },
  
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, zIndex: 1 },
  logoMini: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },
  headerButtons: { flexDirection: 'row', gap: 10, zIndex: 1 },
  headerButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
  
  searchContainer: { backgroundColor: '#065f46', paddingHorizontal: 20, overflow: 'hidden' },
  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, height: 48, marginBottom: 12, gap: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#1f2937', fontWeight: '500' },
  
  categoryContainer: { 
    backgroundColor: '#065f46', 
    paddingHorizontal: 20, 
    overflow: 'hidden',
  },
  categoryScrollContent: { 
    paddingVertical: 8,
    gap: 6,
    alignItems: 'center',
  },
  categoryChip: { 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16, 
    marginRight: 6,
  },
  categoryChipActive: { backgroundColor: '#fff' },
  categoryChipText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  categoryChipTextActive: { color: '#065f46' },
  
  filterIndicator: { 
    flexDirection: 'row', 
    justifyContent: 'center',
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    backgroundColor: '#d1fae5', 
    borderBottomWidth: 1, 
    borderBottomColor: '#a7f3d0' 
  },
  filterIndicatorText: { fontSize: 14, color: '#059669', fontWeight: '600' },
  
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
  
  interactionBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 16, 
    paddingVertical: 10,
    borderTopWidth: 1, 
    borderTopColor: '#f3f4f6',
    gap: 6,
  },
  
  votesContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  voteButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
  },
  voteButtonActive: { 
    backgroundColor: '#d1fae5',
  },
  voteButtonActiveDislike: { 
    backgroundColor: '#fee2e2',
  },
  
  voteIconWrapper: {
    position: 'relative',
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  voteBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#6b7280',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  voteBadgeActive: {
    backgroundColor: '#059669',
  },
  voteBadgeActiveDislike: {
    backgroundColor: '#ef4444',
  },
  voteBadgeDisabled: {
    backgroundColor: '#9ca3af',
  },
  voteBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    lineHeight: 12,
  },
  voteBadgeTextActive: {
    color: '#fff',
  },
  voteBadgeTextActiveDislike: {
    color: '#fff',
  },
  voteBadgeTextDisabled: {
    color: '#fff',
  },
  
  voteText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  voteTextActive: {
    color: '#059669',
  },
  voteTextActiveDislike: {
    color: '#ef4444',
  },
  voteTextDisabled: {
    color: '#9ca3af',
  },
  
  whatsappButtonCompact: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5,
    backgroundColor: '#25D366', 
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'center',
  },
  whatsappButtonCompactText: { 
    color: '#fff', 
    fontSize: 11,
    fontWeight: 'bold' 
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#065f46', marginBottom: 8, textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 20 },
  
  // Modal de logout
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