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
      console.log("🔄 HomeScreen enfocado - recargando productos");
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
      console.log("📥 Cargando productos...");
      const response = await getAllProducts();
      
      if (response.isSuccess && response.result) {
        console.log("✅ Productos cargados:", response.result.length);
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
    if (!product.userPhone) {
      Alert.alert(
        "Sin contacto",
        "Este vendedor no tiene número de teléfono registrado."
      );
      return;
    }

    // ✅ Limpiar y formatear número correctamente
    let phoneNumber = product.userPhone.replace(/[^\d]/g, ''); // Solo dígitos
    
    // Si el número no tiene código de país, agregar +52 (México)
    if (!phoneNumber.startsWith('521') && phoneNumber.length === 10) {
      phoneNumber = '52' + phoneNumber;
    }
    
    const message = `Hola! Estoy interesado en tu producto: ${product.name} - $${product.price}`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    console.log("📱 Abriendo WhatsApp:", whatsappUrl);

    Linking.openURL(whatsappUrl).catch((err) => {
      console.error("Error al abrir WhatsApp:", err);
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

        <View style={styles.productInfo}>
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>${item.price.toLocaleString()}</Text>
            {isOwner && (
              <View style={styles.ownerBadgeInline}>
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
            >
              <Text style={styles.whatsappIcon}>💬</Text>
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
        <ActivityIndicator size="large" color="#3CB371" />
        <Text style={styles.loadingText}>Cargando productos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Unifood</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate("ProductsList")}
          >
            <Text style={styles.headerButtonIcon}>📦</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleLogout}
          >
            <Text style={styles.headerButtonIcon}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🍽️</Text>
          <Text style={styles.emptyText}>No hay productos disponibles</Text>
          <Text style={styles.emptySubtext}>
            Aún no hay productos publicados
          </Text>
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
              tintColor="#3CB371"
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
    backgroundColor: "#3CB371", // ✅ Fondo verde
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#3CB371", // ✅ Fondo verde
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#dbdbdb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#3CB371", // ✅ Verde
  },
  headerButtons: {
    flexDirection: "row",
    gap: 15,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3CB371", // ✅ Verde
    justifyContent: "center",
    alignItems: "center",
  },
  headerButtonIcon: {
    fontSize: 18,
  },
  listContent: {
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: "#fff",
    marginBottom: 10,
    borderRadius: 12,
    marginHorizontal: 10,
    marginTop: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sellerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3CB371",
    justifyContent: "center",
    alignItems: "center",
  },
  sellerAvatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  sellerDetails: {
    justifyContent: "center",
  },
  sellerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#262626",
  },
  categoryText: {
    fontSize: 11,
    color: "#8e8e8e",
    marginTop: 2,
  },
  productImage: {
    width: "100%",
    height: 375,
    backgroundColor: "#f5f5f5",
  },
  noImage: {
    width: "100%",
    height: 375,
    backgroundColor: "#efefef",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    fontSize: 60,
    opacity: 0.5,
  },
  productInfo: {
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 15,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 22,
    fontWeight: "700",
    color: "#3CB371",
  },
  ownerBadgeInline: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ownerBadgeInlineText: {
    color: "#2e7d32",
    fontSize: 11,
    fontWeight: "600",
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#262626",
    marginBottom: 6,
  },
  productDescription: {
    fontSize: 14,
    color: "#8e8e8e",
    lineHeight: 18,
    marginBottom: 12,
  },
  whatsappButton: {
    backgroundColor: "#25D366",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  whatsappIcon: {
    fontSize: 18,
  },
  whatsappButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#fff", // ✅ Blanco para fondo verde
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#3CB371", // ✅ Fondo verde
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
    opacity: 0.8,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff", // ✅ Blanco
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#e0f2e9", // ✅ Verde claro
    textAlign: "center",
    marginBottom: 24,
  },
});