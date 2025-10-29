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
} from "react-native";
import { getAllProducts } from "../services/productService";
import { getUserData, clearUserSession } from "../hooks/useAuth";

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadUserAndProducts();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProducts();
    });
    return unsubscribe;
  }, [navigation]);

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
      console.error("Error al cargar datos:", error);
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
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
      setProducts([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
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
    // ✅ Verificar que el producto tenga userPhone
    if (!product.userPhone) {
      Alert.alert(
        "Sin contacto",
        "Este vendedor no tiene número de teléfono registrado."
      );
      return;
    }

    // ✅ Limpiar el número de teléfono (quitar espacios, guiones, etc.)
    const phoneNumber = product.userPhone.replace(/[^\d+]/g, '');
    
    // ✅ Construir mensaje para WhatsApp
    const message = `Hola! Estoy interesado en tu producto: ${product.name} - $${product.price}`;
    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

    console.log("📱 Abriendo WhatsApp:", whatsappUrl);

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          Alert.alert(
            "WhatsApp no disponible",
            "No se pudo abrir WhatsApp. ¿Lo tienes instalado?"
          );
        }
      })
      .catch((err) => {
        console.error("Error al abrir WhatsApp:", err);
        Alert.alert("Error", "No se pudo abrir WhatsApp");
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
        {/* Header con info del vendedor */}
        <View style={styles.productHeader}>
          <View style={styles.sellerInfo}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarText}>
                {item.userName ? item.userName.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <View>
              <Text style={styles.sellerName}>
                {item.userName || "Usuario Anónimo"}
              </Text>
              {item.categoryName && (
                <Text style={styles.categoryText}>{item.categoryName}</Text>
              )}
            </View>
          </View>
          
          {/* Solo mostrar botón de editar si es mi producto */}
          {isOwner && (
            <TouchableOpacity
              style={styles.editIconButton}
              onPress={() =>
                navigation.navigate("ProductForm", { product: item, mode: "edit" })
              }
            >
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Imagen del producto */}
        {item.imageUrl ? (
          <Image
            source={{ 
              uri: `https://product-microservice-cwk6.onrender.com${item.imageUrl}` 
            }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noImage}>
            <Text style={styles.noImageText}>📦</Text>
          </View>
        )}

        {/* Información del producto */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productPrice}>${item.price.toLocaleString()}</Text>
          
          {item.description && (
            <Text style={styles.productDescription} numberOfLines={3}>
              {item.description}
            </Text>
          )}

          {/* Botón de WhatsApp - visible para todos menos el dueño */}
          {!isOwner && (
            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={() => handleWhatsApp(item)}
            >
              <Text style={styles.whatsappButtonText}>💬 Contactar vendedor</Text>
            </TouchableOpacity>
          )}

          {/* Mensaje para el dueño */}
          {isOwner && (
            <View style={styles.ownerBadge}>
              <Text style={styles.ownerBadgeText}>📌 Tu producto</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3CB371" />
        <Text style={styles.loadingText}>Cargando productos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Unifood</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate("ProductsList")}
          >
            <Text style={styles.headerButtonText}>Mis Productos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de productos */}
      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🍽️</Text>
          <Text style={styles.emptyText}>No hay productos disponibles</Text>
          <Text style={styles.emptySubtext}>
            Sé el primero en publicar algo
          </Text>
          <TouchableOpacity
            style={styles.addFirstButton}
            onPress={() => navigation.navigate("ProductForm", { mode: "create" })}
          >
            <Text style={styles.addFirstButtonText}>+ Publicar producto</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.productId}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#3CB371"]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Botón flotante para agregar producto */}
      {products.length > 0 && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => navigation.navigate("ProductForm", { mode: "create" })}
        >
          <Text style={styles.floatingButtonText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3CB371",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 10,
  },
  headerButton: {
    backgroundColor: "#3CB371",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  headerButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoutButtonText: {
    color: "#f44336",
    fontWeight: "600",
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 80,
  },
  productCard: {
    backgroundColor: "#fff",
    marginBottom: 2,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3CB371",
    justifyContent: "center",
    alignItems: "center",
  },
  sellerAvatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  categoryText: {
    fontSize: 12,
    color: "#666",
  },
  editIconButton: {
    padding: 5,
  },
  editIcon: {
    fontSize: 20,
  },
  productImage: {
    width: "100%",
    height: 400,
    backgroundColor: "#f0f0f0",
  },
  noImage: {
    width: "100%",
    height: 400,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    fontSize: 80,
  },
  productInfo: {
    padding: 15,
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3CB371",
    marginBottom: 10,
  },
  productDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 15,
  },
  whatsappButton: {
    backgroundColor: "#25D366",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  whatsappButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  ownerBadge: {
    backgroundColor: "#f0f9f4",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#3CB371",
  },
  ownerBadgeText: {
    color: "#3CB371",
    fontWeight: "600",
    textAlign: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 20,
  },
  addFirstButton: {
    backgroundColor: "#3CB371",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#3CB371",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  floatingButtonText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
});