// src/screens/ProductsListScreen.js
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
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getProductsByUserId, deleteProduct } from "../services/productService";
import { getUserData } from "../hooks/useAuth";

const { width, height } = Dimensions.get('window');

export default function ProductsListScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadUserAndProducts();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (currentUser) {
        loadProducts();
      }
    });

    return unsubscribe;
  }, [navigation, currentUser]);

  const loadUserAndProducts = async () => {
    try {
      setLoading(true);
      const userData = await getUserData();
      
      if (!userData) {
        Alert.alert("Error", "No se pudo obtener información del usuario");
        navigation.goBack();
        return;
      }
      
      setCurrentUser(userData);
      await loadProductsForUser(userData);
    } catch (error) {
      Alert.alert("Error", "Ocurrió un problema al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const loadProductsForUser = async (userData) => {
    try {
      const userId = userData.userId || userData.id;
      const response = await getProductsByUserId(userId);
      
      if (response.isSuccess && response.result) {
        setProducts(response.result);
      } else {
        setProducts([]);
      }
    } catch (error) {
      setProducts([]);
    }
  };

  const loadProducts = async () => {
    if (currentUser) {
      await loadProductsForUser(currentUser);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const handleDelete = (id, name) => {
    Alert.alert(
      "Confirmar eliminación",
      `¿Estás seguro de eliminar "${name}"?`,
      [
        { 
          text: "Cancelar", 
          style: "cancel" 
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await deleteProduct(id);
              if (response.isSuccess) {
                Alert.alert("Éxito", "Producto eliminado correctamente");
                loadProducts();
              } else {
                Alert.alert("Error", "No se pudo eliminar el producto");
              }
            } catch (error) {
              Alert.alert("Error", "Ocurrió un problema al eliminar");
            }
          },
        },
      ]
    );
  };

  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      <View style={styles.cardContent}>
        {/* Imagen */}
        {item.imageUrl ? (
          <Image
          source={{ uri: item.imageUrl }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noImage}>
            <Ionicons name="image-outline" size={40} color="#d1d5db" />
          </View>
        )}

        {/* Info del producto */}
        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <View style={styles.productTitleContainer}>
              <Text style={styles.productName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.categoryName && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.categoryName}</Text>
                </View>
              )}
            </View>
            <Text style={styles.productPrice}>${item.price.toLocaleString()}</Text>
          </View>

          {item.description && (
            <Text style={styles.productDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          {/* Botones de acción */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() =>
                navigation.navigate("ProductForm", { product: item, mode: "edit" })
              }
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item.productId, item.name)}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Cargando tus productos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con gradiente */}
      <View style={styles.header}>
        <View style={styles.headerBackground}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
        </View>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Mis Productos</Text>
          {products.length > 0 && (
            <Text style={styles.subtitle}>
              {products.length} producto{products.length !== 1 ? "s" : ""} publicado{products.length !== 1 ? "s" : ""}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("ProductForm", { mode: "create" })}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCircle}>
            <Ionicons name="bag-handle-outline" size={60} color="#059669" />
          </View>
          <Text style={styles.emptyText}>No tienes productos publicados</Text>
          <Text style={styles.emptySubtext}>
            Toca el botón "+" para publicar tu primer producto
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate("ProductForm", { mode: "create" })}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.emptyButtonText}>Publicar Producto</Text>
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
    backgroundColor: "#cef5daff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
  },
  header: {
    position: 'relative',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    opacity: 0.3,
    top: -60,
    right: -40,
  },
  circle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#10b981',
    opacity: 0.2,
    bottom: -30,
    left: -20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    zIndex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: "#d1fae5",
    marginTop: 4,
    fontWeight: '500',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: 'row',
  },
  productImage: {
    width: 120,
    height: 160,
    backgroundColor: "#f9fafb",
  },
  noImage: {
    width: 120,
    height: 160,
    backgroundColor: "#f9fafb",
    justifyContent: "center",
    alignItems: "center",
  },
  productInfo: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  productHeader: {
    marginBottom: 8,
  },
  productTitleContainer: {
    marginBottom: 6,
  },
  productName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#065f46",
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#059669",
  },
  categoryBadge: {
    backgroundColor: "#d1fae5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  categoryText: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
  },
  productDescription: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
    marginBottom: 10,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: "#059669",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#ef4444",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
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
    marginBottom: 24,
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
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
});