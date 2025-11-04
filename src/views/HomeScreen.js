// src/screens/HomeScreen.js
import React, { useState, useEffect } from "react";
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
  Platform,
  Dimensions,
  TextInput,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAllProducts } from "../services/productService";
import { getUserData, clearUserSession } from "../hooks/useAuth";

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchAnimation = useState(new Animated.Value(0))[0];

  useEffect(() => {
    loadUserAndProducts();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProducts();
    });
    return unsubscribe;
  }, [navigation]);

  // Filtrar productos en tiempo real
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(product => {
        const nameMatch = product.name?.toLowerCase().includes(query);
        const categoryMatch = product.categoryName?.toLowerCase().includes(query);
        const descriptionMatch = product.description?.toLowerCase().includes(query);
        const priceMatch = product.price?.toString().includes(query);
        return nameMatch || categoryMatch || descriptionMatch || priceMatch;
      });
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const loadUserAndProducts = async () => {
    try {
      setLoading(true);
      const userData = await getUserData();
      
      if (!userData) {
        Alert.alert("Error", "Sesión expirada");
        navigation.replace("Login");
        return;
      }
      
      setCurrentUser(userData);
      await loadProducts();
    } catch (error) {
      Alert.alert("Error", "Ocurrió un problema al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await getAllProducts();
      
      if (response.isSuccess && response.result) {
        setProducts(response.result);
        setFilteredProducts(response.result);
      } else {
        setProducts([]);
        setFilteredProducts([]);
      }
    } catch (error) {
      setProducts([]);
      setFilteredProducts([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
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
      setSearchQuery("");
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres salir?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: async () => {
            await clearUserSession();
            navigation.replace("Login");
          },
        },
      ]
    );
  };

 const handleWhatsApp = (product) => {
  // ✅ Validar que existe el número de teléfono
  if (!product.userPhone) {
    Alert.alert(
      "Sin contacto",
      "Este vendedor no tiene número de teléfono registrado."
    );
    return;
  }

  // ✅ Limpiar el número (quitar espacios, guiones, etc.)
  let phoneNumber = product.userPhone.replace(/[^\d]/g, '');
  
  // ✅ Validar que el número tenga 10 dígitos
  if (phoneNumber.length !== 10) {
    Alert.alert(
      "Número inválido",
      "El número de teléfono del vendedor no es válido."
    );
    return;
  }
  
  // ✅ Agregar código de país de México (52)
  phoneNumber = '52' + phoneNumber;
  
  // ✅ Construir mensaje personalizado
  const message = `Hola! Estoy interesado en tu producto: *${product.name}*\nPrecio: $${product.price.toLocaleString()}`;
  
  // ✅ Construir URL de WhatsApp
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  // ✅ Abrir WhatsApp
  Linking.openURL(whatsappUrl).catch((err) => {
    Alert.alert(
      "Error",
      "No se pudo abrir WhatsApp. Verifica que esté instalado."
    );
  });
};

  const isMyProduct = (product) => {
    if (!currentUser || !product) return false;
    return product.userId === currentUser.userId || product.userId === currentUser.id;
  };

  const renderProduct = ({ item }) => {
    const isOwner = isMyProduct(item);

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
              <Text style={styles.sellerName}>
                {item.userName || "Usuario Anónimo"}
              </Text>
              {item.categoryName && (
                <Text style={styles.categoryText}>{item.categoryName}</Text>
              )}
            </View>
          </View>
        </View>

        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noImage}>
            <Ionicons name="image-outline" size={60} color="#d1d5db" />
          </View>
        )}

        <View style={styles.productInfo}>
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>${item.price.toLocaleString()}</Text>
            {isOwner && (
              <View style={styles.ownerBadgeInline}>
                <Ionicons name="checkmark-circle" size={14} color="#059669" />
                <Text style={styles.ownerBadgeInlineText}>Tu producto</Text>
              </View>
            )}
          </View>

          <Text style={styles.productName}>{item.name}</Text>
          
          {item.description && (
            <Text style={styles.productDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          {!isOwner && (
            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={() => handleWhatsApp(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#fff" />
              <Text style={styles.whatsappButtonText}>Contactar vendedor</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
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
    <View style={styles.container}>
      {/* Header mejorado */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoMini}>
            <Ionicons name="restaurant" size={24} color="#059669" />
          </View>
          <Text style={styles.headerTitle}>UFood</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={toggleSearch}
          >
            <Ionicons 
              name={showSearch ? "close" : "search"} 
              size={22} 
              color="#fff" 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate("ProductsList")}
          >
            <Ionicons name="grid-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Barra de búsqueda animada */}
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
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </Animated.View>

      {/* Contador de resultados */}
      {searchQuery.trim() !== "" && (
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
              name={searchQuery ? "search-outline" : "fast-food-outline"} 
              size={60} 
              color="#059669" 
            />
          </View>
          <Text style={styles.emptyText}>
            {searchQuery ? "No se encontraron resultados" : "No hay productos disponibles"}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery 
              ? `No hay productos que coincidan con "${searchQuery}"`
              : "Aún no hay productos publicados"
            }
          </Text>
          {searchQuery && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => setSearchQuery("")}
            >
              <Text style={styles.clearSearchButtonText}>Limpiar búsqueda</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.productId}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#059669"]}
              tintColor="#059669"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#cef5daff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#f0fdf4',
  },
  header: {
    backgroundColor: '#065f46',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoMini: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 1,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#059669',
    justifyContent: "center",
    alignItems: "center",
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    backgroundColor: '#065f46',
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  resultsCounter: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#d1fae5',
    borderBottomWidth: 1,
    borderBottomColor: '#a7f3d0',
  },
  resultsText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
    paddingTop: 12,
  },
  productCard: {
    backgroundColor: "#fff",
    marginBottom: 16,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10b981',
    justifyContent: "center",
    alignItems: "center",
  },
  sellerAvatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  sellerDetails: {
    justifyContent: "center",
  },
  sellerName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#065f46",
  },
  categoryText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  productImage: {
    width: "100%",
    height: 300,
    backgroundColor: "#f9fafb",
  },
  noImage: {
    width: "100%",
    height: 300,
    backgroundColor: "#f9fafb",
    justifyContent: "center",
    alignItems: "center",
  },
  productInfo: {
    padding: 16,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  productPrice: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#059669",
  },
  ownerBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: "#d1fae5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ownerBadgeInlineText: {
    color: "#059669",
    fontSize: 12,
    fontWeight: "600",
  },
  productName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 14,
  },
  whatsappButton: {
    backgroundColor: "#25D366",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginTop: 8,
    gap: 8,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  whatsappButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#059669",
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
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
    fontWeight: "bold",
    color: "#065f46",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 20,
  },
  clearSearchButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  clearSearchButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});