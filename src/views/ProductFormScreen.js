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
import { Picker } from '@react-native-picker/picker';
import { createProduct, updateProduct, pickImage } from "../services/productService";
import { getUserData } from "../hooks/useAuth";

// ✅ CATEGORÍAS AMPLIADAS
const CATEGORIAS = [
  "Selecciona una categoría",
  // Alimentos y Bebidas
  "🍕 Comida Rápida",
  "🌮 Comida Mexicana",
  "🍝 Comida Internacional",
  "🍰 Postres y Repostería",
  "☕ Bebidas",
  "🍿 Snacks",
  "🥗 Saludable",
  "🌱 Vegetariano/Vegano",
  // Electrónica
  "📱 Celulares y Tablets",
  "💻 Computadoras",
  "🎮 Videojuegos",
  "📷 Cámaras y Fotografía",
  "🎧 Audio y Audífonos",
  "⌚ Smartwatches",
  // Moda y Accesorios
  "👕 Ropa Hombre",
  "👗 Ropa Mujer",
  "👟 Zapatos",
  "👜 Bolsos y Carteras",
  "⌚ Relojes",
  "💍 Joyería y Accesorios",
  // Hogar y Decoración
  "🏠 Muebles",
  "🛋️ Decoración",
  "🍳 Cocina y Comedor",
  "🛏️ Dormitorio",
  "🌿 Plantas y Jardín",
  // Deportes y Fitness
  "⚽ Deportes",
  "🏋️ Fitness y Gym",
  "🚴 Bicicletas",
  "🏃 Running",
  // Vehículos
  "🚗 Autos",
  "🏍️ Motos",
  "🚲 Bicicletas",
  "🛴 Patinetas",
  // Libros y Educación
  "📚 Libros",
  "📝 Material Escolar",
  "🎨 Arte y Manualidades",
  // Servicios
  "🔧 Servicios Técnicos",
  "🏠 Servicios para el Hogar",
  "👨‍🏫 Clases y Tutorías",
  "💼 Servicios Profesionales",
  // Mascotas
  "🐕 Mascotas y Accesorios",
  "🐾 Comida para Mascotas",
  // Otros
  "🎁 Regalos",
  "🎉 Eventos y Fiestas",
  "📦 Otro",
];

export default function ProductFormScreen({ navigation, route }) {
  const { product, mode } = route.params || {};
  const isEditMode = mode === "edit";

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    categoryName: CATEGORIAS[0],
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
        categoryName: product.categoryName || CATEGORIAS[0],
        image: product.imageUrl ? { uri: product.imageUrl } : null,
      });
    }
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await getUserData();
      setCurrentUser(userData);
    } catch (error) {
      Alert.alert(
        "Error al cargar usuario",
        "No se pudo obtener la información del usuario. Por favor intenta de nuevo."
      );
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
      Alert.alert(
        "Error al seleccionar imagen",
        "No se pudo seleccionar la imagen. Asegúrate de dar permisos a la aplicación para acceder a tus fotos."
      );
    }
  };

  const validateForm = () => {
    // ========== VALIDAR NOMBRE ==========
    if (!formData.name || !formData.name.trim()) {
      Alert.alert(
        "Nombre vacío",
        "El nombre del producto es obligatorio.\n\nPor favor ingresa un nombre para tu producto."
      );
      return false;
    }

    const trimmedName = formData.name.trim();

    if (trimmedName.length > 25) {
      Alert.alert(
        "Nombre muy largo",
        `El nombre tiene ${trimmedName.length} caracteres.\n\nEl máximo permitido es 25 caracteres.`
      );
      return false;
    }

    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+$/;
    if (!nameRegex.test(trimmedName)) {
      Alert.alert(
        "Nombre inválido",
        "El nombre solo puede contener letras, números, espacios y acentos.\n\nNo se permiten símbolos especiales."
      );
      return false;
    }

    // ========== VALIDAR PRECIO ==========
    if (!formData.price || !formData.price.trim()) {
      Alert.alert(
        "Precio vacío",
        "El precio es obligatorio.\n\nPor favor ingresa el precio de tu producto."
      );
      return false;
    }

    const trimmedPrice = formData.price.trim();

    const priceRegex = /^\d+(\.\d{1,2})?$/;
    if (!priceRegex.test(trimmedPrice)) {
      Alert.alert(
        "Precio inválido",
        "El precio solo puede contener números.\n\nEjemplos válidos: 100, 99.99, 1250.50"
      );
      return false;
    }

    const priceValue = parseFloat(trimmedPrice);

    if (priceValue <= 0) {
      Alert.alert(
        "Precio muy bajo",
        "El precio debe ser mayor a 0."
      );
      return false;
    }

    if (priceValue > 100000) {
      Alert.alert(
        "Precio muy alto",
        `El precio máximo permitido es $100,000.\n\nPrecio ingresado: $${priceValue.toLocaleString()}`
      );
      return false;
    }

    // ========== VALIDAR CATEGORÍA ==========
    if (!formData.categoryName || formData.categoryName === CATEGORIAS[0]) {
      Alert.alert(
        "Categoría no seleccionada",
        "Debes seleccionar una categoría para tu producto."
      );
      return false;
    }

    // ========== VALIDAR DESCRIPCIÓN ==========
    if (!formData.description || !formData.description.trim()) {
      Alert.alert(
        "Descripción vacía",
        "La descripción es obligatoria.\n\nPor favor describe tu producto."
      );
      return false;
    }

    const trimmedDesc = formData.description.trim();
    const words = trimmedDesc.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    if (wordCount > 100) {
      Alert.alert(
        "Descripción muy larga",
        `La descripción tiene ${wordCount} palabras.\n\nEl máximo permitido es 100 palabras.`
      );
      return false;
    }

    const descRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s,\.]+$/;
    if (!descRegex.test(trimmedDesc)) {
      Alert.alert(
        "Descripción inválida",
        "La descripción solo puede contener letras, números, espacios, acentos, comas y puntos.\n\nNo se permiten otros símbolos especiales."
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!currentUser) {
      Alert.alert(
        "Error de sesión",
        "No se pudo obtener la información del usuario.\n\nPor favor cierra sesión e inicia sesión nuevamente."
      );
      return;
    }

    setLoading(true);

    try {
      const productData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        description: formData.description.trim(),
        categoryName: formData.categoryName,
        image: formData.image,
      };

      if (!isEditMode) {
        productData.userId = currentUser.userId || currentUser.id;
      }

      let response;
      if (isEditMode) {
        response = await updateProduct(product.productId, productData);
      } else {
        response = await createProduct(productData);
      }

      if (response.isSuccess) {
        Alert.alert(
          "¡Éxito!",
          `Tu producto "${productData.name}" ha sido ${isEditMode ? 'actualizado' : 'publicado'} correctamente.`,
          [
            {
              text: "Ver productos",
              onPress: () => navigation.navigate("Home"),
            },
          ]
        );
      } else {
        let errorMessage = "No se pudo guardar el producto.";
        
        if (response.message) {
          if (response.message.includes("price must not be greater than")) {
            errorMessage = "El precio máximo permitido es $100,000.\n\nPor favor reduce el precio e intenta de nuevo.";
          } else {
            errorMessage = response.message;
          }
        }
        
        Alert.alert(
          "No se pudo guardar",
          errorMessage + "\n\nPor favor verifica los datos e intenta de nuevo."
        );
      }
    } catch (error) {
      let errorMessage = "Ocurrió un problema al guardar el producto.";
      
      if (error.message) {
        if (error.message.includes("Network") || error.message.includes("network")) {
          errorMessage = "Error de conexión a internet.\n\nVerifica tu conexión e intenta de nuevo.";
        } else if (error.message.includes("400")) {
          errorMessage = "Los datos ingresados no son válidos.\n\nRevisa el formulario e intenta de nuevo.";
        } else if (error.message.includes("price must not be greater than")) {
          errorMessage = "El precio máximo permitido es $100,000.\n\nPor favor reduce el precio.";
        }
      }
      
      Alert.alert(
        "Error al guardar",
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  const getImageUri = () => {
    if (formData.image) {
      if (formData.image.uri) {
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {isEditMode ? "Editar Producto" : "Nuevo Producto"}
          </Text>
          <View style={{ width: 80 }} />
        </View>

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

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre * (máx. 25 caracteres)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Pizza Margarita"
              value={formData.name}
              onChangeText={(value) => handleInputChange("name", value)}
              placeholderTextColor="#999"
              maxLength={25}
            />
            <Text style={styles.charCount}>{formData.name.length}/25</Text>
            <Text style={styles.helperText}>Solo letras, números y acentos</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Precio * (máx. $100,000)</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0.00"
                value={formData.price}
                onChangeText={(value) => handleInputChange("price", value)}
                keyboardType="decimal-pad"
                placeholderTextColor="#999"
              />
            </View>
            <Text style={styles.helperText}>Solo números (usar punto para decimales)</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoría *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.categoryName}
                onValueChange={(value) => handleInputChange("categoryName", value)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {CATEGORIAS.map((cat, index) => (
                  <Picker.Item 
                    key={index} 
                    label={cat} 
                    value={cat}
                    color={index === 0 ? "#999" : "#333"}
                  />
                ))}
              </Picker>
            </View>
            {formData.categoryName === CATEGORIAS[0] && (
              <Text style={styles.helperText}>Selecciona la categoría de tu producto</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción * (máx. 100 palabras)</Text>
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
            <Text style={styles.charCount}>
              {formData.description.trim().split(/\s+/).filter(w => w).length}/100 palabras
            </Text>
            <Text style={styles.helperText}>Solo letras, números, acentos, comas y puntos</Text>
          </View>

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
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  helperText: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
    fontStyle: "italic",
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
  pickerContainer: {
    borderWidth: 2,
    borderColor: "#3CB371",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  pickerItem: {
    fontSize: 16,
    height: 50,
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