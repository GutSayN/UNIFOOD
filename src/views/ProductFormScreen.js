// src/screens/ProductFormScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { createProduct, updateProduct, pickImage } from "../services/productService";
import { getUserData } from "../hooks/useAuth";

export default function ProductFormScreen({ navigation, route }) {
  const { product, mode } = route.params || {};
  const isEditMode = mode === "edit";

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    categoryName: "",
    image: null,
  });
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadUserData();
    if (isEditMode && product) {
      setFormData({
        name: product.name || "",
        price: product.price?.toString() || "",
        description: product.description || "",
        categoryName: product.categoryName || "",
        image: product.imageUrl ? { uri: product.imageUrl } : null,
      });
    }
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await getUserData();
      setCurrentUser(userData);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePickImage = async () => {
    try {
      const image = await pickImage();
      if (image) {
        setFormData((prev) => ({ ...prev, image }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      
      if (error.message && error.message.includes('permisos')) {
        Alert.alert(
          "Permisos necesarios",
          "Para agregar fotos, necesitamos acceso a tu galería. Ve a Configuración > Unifood > Fotos y permite el acceso.",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Abrir Configuración", onPress: () => Linking.openSettings() }
          ]
        );
      } else {
        Alert.alert("Error", "No se pudo seleccionar la imagen. Intenta de nuevo.");
      }
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "El nombre del producto es obligatorio");
      return false;
    }
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      Alert.alert("Error", "El precio debe ser un número válido mayor a 0");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!currentUser) {
      Alert.alert("Error", "No se pudo obtener la información del usuario");
      return;
    }

    setLoading(true);

    try {
      const productData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        description: formData.description.trim(),
        categoryName: formData.categoryName.trim(),
        image: formData.image,
        userId: currentUser.userId || currentUser.id,
      };

      // Obtener el número de teléfono del usuario
      const userPhone = currentUser.phoneNumber || currentUser.phone;

      let response;
      if (isEditMode) {
        response = await updateProduct(product.productId, productData, userPhone);
      } else {
        response = await createProduct(productData, userPhone);
      }

      if (response.isSuccess) {
        Alert.alert(
          "Éxito",
          `Producto ${isEditMode ? "actualizado" : "creado"} correctamente`,
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert("Error", response.message || "No se pudo guardar el producto");
      }
    } catch (error) {
      console.error("Error al guardar producto:", error);
      Alert.alert("Error", "Ocurrió un problema al guardar el producto");
    } finally {
      setLoading(false);
    }
  };

  const getImageUri = () => {
    if (formData.image) {
      if (formData.image.uri) {
        // Si es una nueva imagen seleccionada o una existente con URI completa
        if (formData.image.uri.startsWith('http')) {
          return formData.image.uri;
        } else if (formData.image.uri.startsWith('/')) {
          return `https://product-microservice-cwk6.onrender.com${formData.image.uri}`;
        } else {
          return formData.image.uri;
        }
      }
    }
    return null;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {isEditMode ? "Editar Producto" : "Nuevo Producto"}
          </Text>
          <View style={{ width: 80 }} />
        </View>

        {/* Imagen */}
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={handlePickImage}
          activeOpacity={0.8}
        >
          {getImageUri() ? (
            <Image
              source={{ uri: getImageUri() }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderIcon}>📷</Text>
              <Text style={styles.imagePlaceholderText}>
                Toca para {isEditMode ? "cambiar" : "agregar"} foto
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Formulario */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del producto *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Pizza Margarita"
              value={formData.name}
              onChangeText={(value) => handleInputChange("name", value)}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Precio *</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0.00"
                value={formData.price}
                onChangeText={(value) => handleInputChange("price", value)}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoría</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Comida Rápida"
              value={formData.categoryName}
              onChangeText={(value) => handleInputChange("categoryName", value)}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe tu producto..."
              value={formData.description}
              onChangeText={(value) => handleInputChange("description", value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#999"
            />
          </View>

          {/* Información del usuario */}
          {currentUser && (
            <View style={styles.userInfoContainer}>
              <Text style={styles.userInfoLabel}>📱 Contacto</Text>
              <Text style={styles.userInfoText}>
                {currentUser.phoneNumber || currentUser.phone || "Sin número registrado"}
              </Text>
              <Text style={styles.userInfoSubtext}>
                Los compradores podrán contactarte por WhatsApp
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditMode ? "Guardar Cambios" : "Publicar Producto"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  cancelText: {
    fontSize: 16,
    color: "#3CB371",
    width: 80,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  imageContainer: {
    width: "100%",
    height: 300,
    backgroundColor: "#f5f5f5",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: "#999",
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3CB371",
    paddingLeft: 12,
  },
  priceInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  userInfoContainer: {
    backgroundColor: "#f0f9f4",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: "#3CB371",
  },
  userInfoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  userInfoText: {
    fontSize: 16,
    color: "#3CB371",
    fontWeight: "bold",
    marginBottom: 5,
  },
  userInfoSubtext: {
    fontSize: 12,
    color: "#666",
  },
  submitButton: {
    backgroundColor: "#3CB371",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: "#9cc9b3",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});