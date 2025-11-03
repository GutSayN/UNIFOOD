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
  Dimensions,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from '@react-native-picker/picker';
import { createProduct, updateProduct, pickImage } from "../services/productService";
import { getUserData } from "../hooks/useAuth";

const { width, height } = Dimensions.get('window');

// Categorías
const CATEGORIAS = [
  "Selecciona una categoría",
  "🍕 Comida Rápida",
  "🌮 Comida Mexicana",
  "🍝 Comida Internacional",
  "🍰 Postres y Repostería",
  "☕ Bebidas",
  "🍿 Snacks",
  "🥗 Saludable",
  "🌱 Vegetariano/Vegano",
  "📱 Celulares y Tablets",
  "💻 Computadoras",
  "🎮 Videojuegos",
  "📷 Cámaras y Fotografía",
  "🎧 Audio y Audífonos",
  "⌚ Smartwatches",
  "👕 Ropa Hombre",
  "👗 Ropa Mujer",
  "👟 Zapatos",
  "👜 Bolsos y Carteras",
  "💍 Joyería y Accesorios",
  "🏠 Muebles",
  "🛋️ Decoración",
  "🍳 Cocina y Comedor",
  "🛏️ Dormitorio",
  "🌿 Plantas y Jardín",
  "⚽ Deportes",
  "🏋️ Fitness y Gym",
  "🚴 Bicicletas",
  "🏃 Running",
  "🚗 Autos",
  "🏍️ Motos",
  "🛴 Patinetas",
  "📚 Libros",
  "📝 Material Escolar",
  "🎨 Arte y Manualidades",
  "🔧 Servicios Técnicos",
  "🏠 Servicios para el Hogar",
  "👨‍🏫 Clases y Tutorías",
  "💼 Servicios Profesionales",
  "🐕 Mascotas y Accesorios",
  "🐾 Comida para Mascotas",
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
  const [focusedInput, setFocusedInput] = useState(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

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
    // ========== VALIDAR IMAGEN ==========
    if (!formData.image || !formData.image.uri) {
      Alert.alert(
        "Imagen requerida",
        "Debes agregar una foto de tu producto.\n\nToca el área de la imagen para seleccionar una foto de tu galería."
      );
      return false;
    }

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
    // ✅ ELIMINADO: console.error("Error completo:", error);
    
    let errorTitle = "Error al guardar";
    let errorMessage = "Ocurrió un problema al guardar el producto.";
    
    if (error.message) {
      const errorMsg = error.message.toLowerCase();
      
      // ✅ VALIDACIÓN ESPECÍFICA PARA IMAGEN RECHAZADA
      if (errorMsg.includes("imagen rechazada") || 
          errorMsg.includes("contenido sensible") || 
          errorMsg.includes("contenido violento") ||
          errorMsg.includes("inappropriate")) {
        
        errorTitle = "🚫 Imagen no permitida";
        errorMessage = "La imagen que seleccionaste contiene contenido inapropiado, sensible o violento.\n\n" +
                      "Por favor selecciona una imagen diferente que cumpla con nuestras políticas de contenido.";
        
        // Limpiar la imagen rechazada
        setFormData((prev) => ({ ...prev, image: null }));
        
      } else if (errorMsg.includes("network") || errorMsg.includes("conexión")) {
        errorMessage = "Error de conexión a internet.\n\nVerifica tu conexión e intenta de nuevo.";
      } else if (errorMsg.includes("400") || errorMsg.includes("bad request")) {
        // Para errores 400 genéricos, intentar extraer el mensaje del servidor
        try {
          const jsonMatch = error.message.match(/\{.*\}/);
          if (jsonMatch) {
            const errorData = JSON.parse(jsonMatch[0]);
            if (errorData.message && 
                (errorData.message.includes("IMAGEN RECHAZADA") || 
                 errorData.message.includes("contenido sensible"))) {
              errorTitle = "🚫 Imagen no permitida";
              errorMessage = "La imagen que seleccionaste contiene contenido inapropiado.\n\n" +
                            "Por favor selecciona una imagen diferente que cumpla con nuestras políticas.";
              setFormData((prev) => ({ ...prev, image: null }));
            } else {
              errorMessage = errorData.message || "Los datos ingresados no son válidos.\n\nRevisa el formulario e intenta de nuevo.";
            }
          } else {
            errorMessage = "Los datos ingresados no son válidos.\n\nRevisa el formulario e intenta de nuevo.";
          }
        } catch (parseError) {
          errorMessage = "Los datos ingresados no son válidos.\n\nRevisa el formulario e intenta de nuevo.";
        }
      } else if (errorMsg.includes("price must not be greater than")) {
        errorMessage = "El precio máximo permitido es $100,000.\n\nPor favor reduce el precio.";
      } else {
        // Mostrar el mensaje original del servidor si está disponible
        errorMessage = error.message;
      }
    }
    
    Alert.alert(errorTitle, errorMessage);
  } finally {
    setLoading(false);
  }
};

  const getImageUri = () => {
    if (formData.image && formData.image.uri) {
      return formData.image.uri;
    }
    return null;
  };

  const selectCategory = (category) => {
    handleInputChange("categoryName", category);
    setCategoryModalVisible(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
          <Text style={styles.headerTitle}>
            {isEditMode ? "Editar Producto" : "Nuevo Producto"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Imagen CON INDICADOR DE REQUERIDO */}
        <TouchableOpacity
          style={[
            styles.imageContainer,
            !formData.image && styles.imageContainerRequired
          ]}
          onPress={handlePickImage}
          activeOpacity={0.8}
        >
          {getImageUri() ? (
            <>
              <Image
                source={{ uri: getImageUri() }}
                style={styles.image}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <View style={styles.changeImageButton}>
                  <Ionicons name="camera" size={20} color="#fff" />
                  <Text style={styles.changeImageText}>Cambiar foto</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <View style={styles.iconCircle}>
                <Ionicons name="camera" size={40} color="#059669" />
              </View>
              <Text style={styles.imagePlaceholderText}>
                Toca para agregar foto *
              </Text>
              <Text style={styles.imagePlaceholderSubtext}>
                La imagen es obligatoria
              </Text>
              <View style={styles.requiredBadge}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.requiredBadgeText}>Requerido</Text>
              </View>
              <Text style={styles.imageWarning}>
                ⚠️ No se permiten imágenes con contenido inapropiado
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Formulario */}
        <View style={styles.form}>
          {/* Nombre */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="text-outline" size={16} color="#059669" /> Nombre del producto *
            </Text>
            <View style={[
              styles.inputWrapper,
              focusedInput === 'name' && styles.inputWrapperFocused
            ]}>
              <TextInput
                style={styles.input}
                placeholder="Ej: Pizza Margarita"
                value={formData.name}
                onChangeText={(value) => handleInputChange("name", value)}
                placeholderTextColor="#9ca3af"
                maxLength={25}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
            <View style={styles.helperRow}>
              <Text style={styles.helperText}>Solo letras, números y acentos</Text>
              <Text style={[
                styles.charCount,
                formData.name.length > 20 && styles.charCountWarning
              ]}>{formData.name.length}/25</Text>
            </View>
          </View>

          {/* Precio */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="cash-outline" size={16} color="#059669" /> Precio * (máx. $100,000)
            </Text>
            <View style={[
              styles.priceInputContainer,
              focusedInput === 'price' && styles.inputWrapperFocused
            ]}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0.00"
                value={formData.price}
                onChangeText={(value) => handleInputChange("price", value)}
                keyboardType="decimal-pad"
                placeholderTextColor="#9ca3af"
                onFocus={() => setFocusedInput('price')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
            <Text style={styles.helperText}>Solo números (usar punto para decimales)</Text>
          </View>

          {/* Categoría - SELECTOR MEJORADO */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="pricetag-outline" size={16} color="#059669" /> Categoría *
            </Text>
            <TouchableOpacity
              style={styles.categorySelector}
              onPress={() => setCategoryModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.categorySelectorText,
                formData.categoryName === CATEGORIAS[0] && styles.categorySelectorPlaceholder
              ]}>
                {formData.categoryName}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#059669" />
            </TouchableOpacity>
          </View>

          {/* Descripción */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="document-text-outline" size={16} color="#059669" /> Descripción * (máx. 100 palabras)
            </Text>
            <View style={[
              styles.inputWrapper,
              focusedInput === 'description' && styles.inputWrapperFocused
            ]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe tu producto..."
                value={formData.description}
                onChangeText={(value) => handleInputChange("description", value)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#9ca3af"
                onFocus={() => setFocusedInput('description')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
            <View style={styles.helperRow}>
              <Text style={styles.helperText}>Solo letras, números, acentos, comas y puntos</Text>
              <Text style={[
                styles.charCount,
                formData.description.trim().split(/\s+/).filter(w => w).length > 90 && styles.charCountWarning
              ]}>
                {formData.description.trim().split(/\s+/).filter(w => w).length}/100
              </Text>
            </View>
          </View>

          {/* Info del usuario */}
          {currentUser && (
            <View style={styles.userInfoContainer}>
              <Ionicons name="call-outline" size={20} color="#059669" />
              <View style={styles.userInfoText}>
                <Text style={styles.userInfoLabel}>Contacto</Text>
                <Text style={styles.userInfoPhone}>
                  {currentUser.phoneNumber || currentUser.phone || "Sin número registrado"}
                </Text>
                <Text style={styles.userInfoSubtext}>
                  Los compradores podrán contactarte por WhatsApp
                </Text>
              </View>
            </View>
          )}

          {/* Botón de envío */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>
                  {isEditMode ? "Guardar Cambios" : "Publicar Producto"}
                </Text>
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de Categorías */}
      <Modal
        visible={categoryModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona una categoría</Text>
              <TouchableOpacity
                onPress={() => setCategoryModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close-circle" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
              {CATEGORIAS.slice(1).map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.categoryItem,
                    formData.categoryName === category && styles.categoryItemSelected
                  ]}
                  onPress={() => selectCategory(category)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.categoryItemText,
                    formData.categoryName === category && styles.categoryItemTextSelected
                  ]}>
                    {category}
                  </Text>
                  {formData.categoryName === category && (
                    <Ionicons name="checkmark-circle" size={24} color="#059669" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0fdf4",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    position: 'relative',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
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
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#059669',
    opacity: 0.3,
    top: -50,
    right: -30,
  },
  circle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10b981',
    opacity: 0.2,
    bottom: -20,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    zIndex: 1,
  },
  imageContainer: {
    width: "100%",
    height: 250,
    backgroundColor: "#fff",
    marginBottom: 20,
    position: 'relative',
  },
  imageContainerRequired: {
    borderWidth: 3,
    borderColor: '#fbbf24',
    borderStyle: 'dashed',
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    alignItems: 'center',
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#f9fafb',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: "#065f46",
    fontWeight: '600',
    marginBottom: 4,
  },
  imagePlaceholderSubtext: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 12,
  },
  requiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 8,
  },
  requiredBadgeText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
  imageWarning: {
    fontSize: 11,
    color: '#f59e0b',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#065f46",
    marginBottom: 10,
  },
  inputWrapper: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  inputWrapperFocused: {
    borderColor: "#059669",
    backgroundColor: "#f0fdf4",
  },
  input: {
    padding: 14,
    fontSize: 16,
    color: "#1f2937",
    fontWeight: '500',
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#059669",
    paddingLeft: 14,
  },
  priceInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: "#1f2937",
    fontWeight: '500',
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#059669",
    padding: 16,
  },
  categorySelectorText: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: '500',
    flex: 1,
  },
  categorySelectorPlaceholder: {
    color: "#9ca3af",
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  helperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  helperText: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
  },
  charCount: {
    fontSize: 12,
    color: "#059669",
    fontWeight: '600',
  },
  charCountWarning: {
    color: "#f59e0b",
  },
  userInfoContainer: {
    flexDirection: 'row',
    backgroundColor: "#d1fae5",
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    alignItems: 'flex-start',
    gap: 12,
  },
  userInfoText: {
    flex: 1,
  },
  userInfoLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#065f46",
    marginBottom: 4,
  },
  userInfoPhone: {
    fontSize: 16,
    color: "#059669",
    fontWeight: "bold",
    marginBottom: 4,
  },
  userInfoSubtext: {
    fontSize: 12,
    color: "#6b7280",
  },
  submitButton: {
    backgroundColor: "#059669",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  // Estilos del Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#065f46',
  },
  modalCloseButton: {
    padding: 4,
  },
  categoryList: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryItemSelected: {
    backgroundColor: '#d1fae5',
    borderColor: '#059669',
  },
  categoryItemText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
  },
  categoryItemTextSelected: {
    color: '#059669',
    fontWeight: '700',
  },
});