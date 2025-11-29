/**
 * Pantalla de Formulario de Producto (Crear/Editar)
 * Con MVVM - usa useAuthViewModel y useProductViewModel
 * CON MANEJO MEJORADO DE ERRORES PARA ANDROID ✅
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Usar los nuevos ViewModels
import { useAuthViewModel } from '../viewmodels/Auth.viewmodel';
import { useProductViewModel } from '../viewmodels/Product.viewmodel';
import CONFIG from '../config/app.config';

const { width, height } = Dimensions.get('window');

export default function ProductFormScreen({ navigation, route }) {
  const { product, mode } = route.params || {};
  const isEditMode = mode === 'edit';

  // ViewModels
  const { user } = useAuthViewModel();
  const {
    createProduct,
    updateProduct,
    pickImage,
    isLoading,
  } = useProductViewModel();

  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    categoryName: CONFIG.CATEGORIES[0],
    image: null,
  });

  const [originalFormData, setOriginalFormData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  
  // Estado para modal de error personalizado
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: '',
    message: '',
    icon: 'alert-circle',
    iconColor: '#ef4444',
  });

  // Estado para modal de confirmación personalizado
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    message: '',
    icon: 'help-circle',
    iconColor: '#f59e0b',
    onConfirm: () => {},
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
  });

  // Estado para modal de éxito personalizado
  const [successModal, setSuccessModal] = useState({
    visible: false,
    title: '',
    message: '',
    icon: 'checkmark-circle',
    iconColor: '#10b981',
    buttonText: 'Ver mis productos',
    onClose: () => {},
  });

  // Cargar datos del producto en modo edición
  useEffect(() => {
    if (isEditMode && product) {
      const initialData = {
        name: product.name || '',
        price: product.price?.toString() || '',
        description: product.description || '',
        categoryName: product.categoryName || CONFIG.CATEGORIES[0],
        image: product.imageUrl ? { uri: product.imageUrl } : null,
      };
      setFormData(initialData);
      setOriginalFormData(initialData);
    }
  }, [isEditMode, product]);

  // Detectar cambios en el formulario
  useEffect(() => {
    if (!isEditMode || !originalFormData) {
      setHasChanges(true);
      return;
    }

    const nameChanged = formData.name !== originalFormData.name;
    const priceChanged = formData.price !== originalFormData.price;
    const descriptionChanged = formData.description !== originalFormData.description;
    const categoryChanged = formData.categoryName !== originalFormData.categoryName;
    
    const imageChanged = (() => {
      const currentUri = formData.image?.uri || null;
      const originalUri = originalFormData.image?.uri || null;
      return currentUri !== originalUri;
    })();

    const hasAnyChange = nameChanged || priceChanged || descriptionChanged || categoryChanged || imageChanged;
    setHasChanges(hasAnyChange);
  }, [formData, originalFormData, isEditMode]);

  /**
   * Mostrar modal de error personalizado
   */
  const showError = (title, message, icon = 'alert-circle', iconColor = '#ef4444') => {
    setErrorModal({
      visible: true,
      title,
      message,
      icon,
      iconColor,
    });
  };

  /**
   * Mostrar modal de confirmación personalizado
   */
  const showConfirm = (title, message, onConfirm, icon = 'help-circle', iconColor = '#f59e0b', confirmText = 'Confirmar', cancelText = 'Cancelar') => {
    setConfirmModal({
      visible: true,
      title,
      message,
      icon,
      iconColor,
      onConfirm,
      confirmText,
      cancelText,
    });
  };

  /**
   * Mostrar modal de éxito personalizado
   */
  const showSuccess = (title, message, onClose, icon = 'checkmark-circle', iconColor = '#10b981', buttonText = 'Ver mis productos') => {
    setSuccessModal({
      visible: true,
      title,
      message,
      icon,
      iconColor,
      buttonText,
      onClose,
    });
  };

  /**
   * Cerrar modal de error
   */
  const closeErrorModal = () => {
    setErrorModal({ ...errorModal, visible: false });
  };

  /**
   * Cerrar modal de confirmación
   */
  const closeConfirmModal = () => {
    setConfirmModal({ ...confirmModal, visible: false });
  };

  /**
   * Cerrar modal de éxito
   */
  const closeSuccessModal = () => {
    setSuccessModal({ ...successModal, visible: false });
  };

  /**
   * Manejar confirmación
   */
  const handleConfirm = () => {
    confirmModal.onConfirm();
    closeConfirmModal();
  };

  /**
   * Manejar cierre de modal de éxito
   */
  const handleSuccessClose = () => {
    successModal.onClose();
    closeSuccessModal();
  };

  /**
   * Actualizar campo del formulario
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Seleccionar imagen
   */
  const handlePickImage = async () => {
    const result = await pickImage();

    if (result.success && result.image) {
      setFormData(prev => ({ ...prev, image: result.image }));
    } else if (result.error) {
      showError('Error al seleccionar imagen', result.error);
    }
  };

  /**
   * Remover imagen con modal personalizado
   */
  const handleRemoveImage = () => {
    showConfirm(
      '¿Eliminar imagen?',
      'Se eliminará la imagen actual del producto. Podrás agregar una nueva después.',
      () => {
        setFormData(prev => ({ ...prev, image: null }));
      },
      'trash-outline',
      '#ef4444',
      'Eliminar',
      'Cancelar'
    );
  };

  /**
   * Seleccionar categoría
   */
  const selectCategory = (category) => {
    handleInputChange('categoryName', category);
    setCategoryModalVisible(false);
  };

  /**
   * VALIDACIÓN COMPLETA DEL FORMULARIO
   */
  const validateForm = () => {
    // ========== VALIDAR IMAGEN ==========
    if (!formData.image || !formData.image.uri) {
      showError(
        'Imagen requerida',
        'Debes agregar una foto de tu producto.\n\nToca el área de la imagen para seleccionar una foto de tu galería.',
        'image-outline',
        '#f59e0b'
      );
      return false;
    }

    // ========== VALIDAR NOMBRE ==========
    if (!formData.name || !formData.name.trim()) {
      showError(
        'Nombre vacío',
        'El nombre del producto es obligatorio.\n\nPor favor ingresa un nombre para tu producto.'
      );
      return false;
    }

    const trimmedName = formData.name.trim();

    if (trimmedName.length > CONFIG.VALIDATION.MAX_PRODUCT_NAME_LENGTH) {
      showError(
        'Nombre muy largo',
        `El nombre tiene ${trimmedName.length} caracteres.\n\nEl máximo permitido es ${CONFIG.VALIDATION.MAX_PRODUCT_NAME_LENGTH} caracteres.`
      );
      return false;
    }

    if (!CONFIG.VALIDATION.NAME_REGEX.test(trimmedName)) {
      showError(
        'Nombre inválido',
        'El nombre solo puede contener letras, números y espacios.\n\nNo se permiten símbolos especiales.'
      );
      return false;
    }

    // ========== VALIDAR PRECIO ==========
    if (!formData.price || !formData.price.trim()) {
      showError(
        'Precio vacío',
        'El precio es obligatorio.\n\nPor favor ingresa el precio de tu producto.'
      );
      return false;
    }

    const trimmedPrice = formData.price.trim();

    if (!CONFIG.VALIDATION.PRICE_REGEX.test(trimmedPrice)) {
      showError(
        'Precio inválido',
        'El precio solo puede contener números.\n\nEjemplos válidos: 100, 99.99, 1250.50\n\nUsa punto para decimales.'
      );
      return false;
    }

    const priceValue = parseFloat(trimmedPrice);

    if (priceValue <= 0) {
      showError(
        'Precio muy bajo',
        'El precio debe ser mayor a 0.'
      );
      return false;
    }

    if (priceValue > CONFIG.VALIDATION.MAX_PRODUCT_PRICE) {
      showError(
        'Precio muy alto',
        `El precio máximo permitido es $${CONFIG.VALIDATION.MAX_PRODUCT_PRICE.toLocaleString()}.\n\nPrecio ingresado: $${priceValue.toLocaleString()}`
      );
      return false;
    }

    // ========== VALIDAR CATEGORÍA ==========
    if (!formData.categoryName || formData.categoryName === CONFIG.CATEGORIES[0]) {
      showError(
        'Categoría no seleccionada',
        'Debes seleccionar una categoría para tu producto.',
        'pricetag-outline',
        '#f59e0b'
      );
      return false;
    }

    // ========== VALIDAR DESCRIPCIÓN ==========
    if (!formData.description || !formData.description.trim()) {
      showError(
        'Descripción vacía',
        'La descripción es obligatoria.\n\nPor favor describe tu producto.'
      );
      return false;
    }

    const trimmedDesc = formData.description.trim();
    const words = trimmedDesc.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    if (wordCount > CONFIG.VALIDATION.MAX_PRODUCT_DESCRIPTION_WORDS) {
      showError(
        'Descripción muy larga',
        `La descripción tiene ${wordCount} palabras.\n\nEl máximo permitido es ${CONFIG.VALIDATION.MAX_PRODUCT_DESCRIPTION_WORDS} palabras.`
      );
      return false;
    }

    const descRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s,\.;:]+$/;
    if (!descRegex.test(trimmedDesc)) {
      showError(
        'Descripción inválida',
        'La descripción solo puede contener letras, números, espacios, acentos, comas, puntos, punto y coma, y dos puntos.\n\nNo se permiten otros símbolos especiales.'
      );
      return false;
    }

    return true;
  };

  /**
   * ENVIAR FORMULARIO CON MANEJO COMPLETO DE ERRORES PARA ANDROID
   */
  const handleSubmit = async () => {
    console.log('📱 [ProductForm] Iniciando handleSubmit');
    console.log('📱 [ProductForm] Platform:', Platform.OS);
    console.log('📱 [ProductForm] isEditMode:', isEditMode);
    console.log('📱 [ProductForm] User ID:', user?.id);
    
    // Validar formulario
    if (!validateForm()) {
      console.log('❌ [ProductForm] Validación fallida');
      return;
    }

    if (!user) {
      console.log('❌ [ProductForm] No hay usuario');
      showError(
        'Error de sesión',
        'No se pudo obtener la información del usuario.\n\nPor favor cierra sesión e inicia sesión nuevamente.'
      );
      return;
    }

    console.log('✅ [ProductForm] Validación exitosa, enviando a API...');

    let result;

    try {
      if (isEditMode) {
        console.log('📝 [ProductForm] Modo edición, actualizando producto ID:', product.productId);
        result = await updateProduct(product.productId, formData);
      } else {
        console.log('➕ [ProductForm] Modo creación, creando nuevo producto');
        result = await createProduct(formData, user.id);
      }

      console.log('📊 [ProductForm] Resultado recibido:', result);

      if (result && result.success) {
        console.log('✅ [ProductForm] Producto guardado exitosamente');
        
        showSuccess(
          '¡Éxito!',
          isEditMode 
            ? 'Tu producto ha sido actualizado correctamente y ya está disponible en tu catálogo.' 
            : 'Tu producto ha sido creado correctamente y ya está visible para todos los usuarios.',
          () => {
            navigation.reset({
              index: 1,
              routes: [
                { name: 'Home' },
                { name: 'ProductsList' }
              ],
            });
          },
          'checkmark-circle',
          '#10b981',
          'Ver mis productos'
        );
      } else {
        console.log('❌ [ProductForm] Resultado no exitoso:', result?.error);
        
        // Manejar errores del resultado
        if (result && result.error) {
          const errorMsg = result.error.toLowerCase();
          console.log('🔍 [ProductForm] Analizando error:', errorMsg);
          
          // DETECTAR MALAS PALABRAS
          if (errorMsg.includes("lenguaje inapropiado") || 
              errorMsg.includes("malas palabras") ||
              errorMsg.includes("palabras ofensivas") ||
              errorMsg.includes("contenido ofensivo")) {
            
            showError(
              'Lenguaje inapropiado',
              'El texto contiene lenguaje inapropiado en el nombre, descripción o categoría.\n\nPor favor revisa y corrige el contenido.',
              'close-circle',
              '#ef4444'
            );
            
          // DETECTAR IMAGEN RECHAZADA
          } else if (errorMsg.includes("imagen rechazada") || 
              errorMsg.includes("contenido sensible") || 
              errorMsg.includes("contenido violento") ||
              errorMsg.includes("contenido inapropiado") ||
              errorMsg.includes("inappropriate")) {
            
            showError(
              'Imagen no permitida',
              'La imagen que seleccionaste contiene contenido inapropiado, sensible o violento.\n\nPor favor selecciona una imagen diferente que cumpla con nuestras políticas de contenido.',
              'close-circle',
              '#ef4444'
            );
            
            setFormData(prev => ({ ...prev, image: null }));
            
          } else if (errorMsg.includes("price must not be greater than") || 
                     errorMsg.includes("precio")) {
            showError(
              'Precio muy alto',
              'El precio máximo permitido es $999,999.99\n\nPor favor reduce el precio e intenta de nuevo.',
              'cash-outline',
              '#f59e0b'
            );
          } else {
            showError(
              'No se pudo guardar',
              result.error + '\n\nPor favor verifica los datos e intenta de nuevo.'
            );
          }
        } else {
          showError(
            'Error desconocido',
            'No se pudo guardar el producto.\n\nPor favor intenta de nuevo.'
          );
        }
      }
    } catch (error) {
      console.error('💥 [ProductForm] Exception capturada:', error);
      console.error('💥 [ProductForm] Error message:', error.message);
      console.error('💥 [ProductForm] Error stack:', error.stack);
      
      // Manejar excepciones
      let errorTitle = "Error al guardar";
      let errorMessage = "Ocurrió un problema al guardar el producto.";
      let errorIcon = 'alert-circle';
      let errorColor = '#ef4444';
      
      if (error.message) {
        const errorMsg = error.message.toLowerCase();
        
        // VALIDACIÓN ESPECÍFICA PARA MALAS PALABRAS
        if (errorMsg.includes("lenguaje inapropiado") || 
            errorMsg.includes("malas palabras") ||
            errorMsg.includes("palabras ofensivas") ||
            errorMsg.includes("contenido ofensivo")) {
          
          errorTitle = "Lenguaje inapropiado";
          errorMessage = "El texto contiene lenguaje inapropiado en el nombre, descripción o categoría.\n\n" +
                        "Por favor revisa y corrige el contenido.";
          errorIcon = 'close-circle';
          
        // VALIDACIÓN ESPECÍFICA PARA IMAGEN RECHAZADA
        } else if (errorMsg.includes("imagen rechazada") || 
            errorMsg.includes("contenido sensible") || 
            errorMsg.includes("contenido violento") ||
            errorMsg.includes("contenido inapropiado") ||
            errorMsg.includes("inappropriate")) {
          
          errorTitle = "Imagen no permitida";
          errorMessage = "La imagen que seleccionaste contiene contenido inapropiado, sensible o violento.\n\n" +
                        "Por favor selecciona una imagen diferente que cumpla con nuestras políticas de contenido.";
          errorIcon = 'close-circle';
          
          setFormData(prev => ({ ...prev, image: null }));
          
        } else if (errorMsg.includes("network") || errorMsg.includes("conexión") || errorMsg.includes("timeout")) {
          errorTitle = "Sin conexión";
          errorMessage = "Error de conexión a internet.\n\nVerifica tu conexión e intenta de nuevo.\n\n" +
                        (Platform.OS === 'android' ? 'Si el problema persiste, verifica los permisos de red de la app.' : '');
          errorIcon = 'cloud-offline-outline';
          errorColor = '#f59e0b';
          
        } else if (errorMsg.includes("400") || errorMsg.includes("bad request")) {
          // Para errores 400 genéricos, intentar extraer el mensaje del servidor
          try {
            const jsonMatch = error.message.match(/\{.*\}/);
            if (jsonMatch) {
              const errorData = JSON.parse(jsonMatch[0]);
              if (errorData.message) {
                const serverMsg = errorData.message.toLowerCase();
                
                if (serverMsg.includes("lenguaje inapropiado") ||
                    serverMsg.includes("malas palabras") ||
                    serverMsg.includes("palabras ofensivas")) {
                  errorTitle = "Lenguaje inapropiado";
                  errorMessage = "El texto contiene lenguaje inapropiado.\n\n" +
                                "Por favor revisa el nombre, descripción y categoría.";
                  errorIcon = 'close-circle';
                  
                } else if (serverMsg.includes("imagen rechazada") || 
                    serverMsg.includes("contenido sensible") ||
                    serverMsg.includes("contenido inapropiado")) {
                  errorTitle = "Imagen no permitida";
                  errorMessage = "La imagen que seleccionaste contiene contenido inapropiado.\n\n" +
                                "Por favor selecciona una imagen diferente que cumpla con nuestras políticas.";
                  errorIcon = 'close-circle';
                  setFormData(prev => ({ ...prev, image: null }));
                } else {
                  errorMessage = errorData.message + "\n\nRevisa el formulario e intenta de nuevo.";
                }
              } else {
                errorMessage = "Los datos ingresados no son válidos.\n\nRevisa el formulario e intenta de nuevo.";
              }
            } else {
              errorMessage = "Los datos ingresados no son válidos.\n\nRevisa el formulario e intenta de nuevo.";
            }
          } catch (parseError) {
            errorMessage = "Los datos ingresados no son válidos.\n\nRevisa el formulario e intenta de nuevo.";
          }
          
        } else if (errorMsg.includes("price must not be greater than")) {
          errorTitle = "Precio muy alto";
          errorMessage = "El precio máximo permitido es $999,999.99\n\nPor favor reduce el precio.";
          errorIcon = 'cash-outline';
          errorColor = '#f59e0b';
          
        } else {
          // Mostrar el mensaje original del servidor si está disponible
          errorMessage = error.message + "\n\n" + 
                        (Platform.OS === 'android' ? 'Plataforma: Android' : 'Plataforma: iOS');
        }
      }
      
      showError(errorTitle, errorMessage, errorIcon, errorColor);
    }
  };

  /**
   * Obtener URI de imagen
   */
  const getImageUri = () => {
    if (formData.image && formData.image.uri) {
      return formData.image.uri;
    }
    return null;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header con gradiente */}
        <View style={styles.header}>
          <View style={styles.headerBackground}>
            <View style={styles.circle1} />
            <View style={styles.circle2} />
            <View style={styles.circle3} />
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {isEditMode ? 'Editar Producto' : 'Nuevo Producto'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isEditMode ? 'Actualiza la información' : 'Completa los datos'}
            </Text>
          </View>

          <View style={styles.headerPlaceholder} />
        </View>

        {/* Formulario */}
        <View style={styles.formContainer}>
          {/* Sección de Imagen */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIndicator} />
              <Text style={styles.sectionTitle}>Imagen del Producto</Text>
            </View>

            <TouchableOpacity
              style={styles.imageContainer}
              onPress={handlePickImage}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {getImageUri() ? (
                <>
                  <Image source={{ uri: getImageUri() }} style={styles.productImage} />
                  <View style={styles.imageOverlay}>
                    <Ionicons name="camera" size={32} color="white" />
                    <Text style={styles.imageOverlayText}>Cambiar imagen</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={handleRemoveImage}
                    disabled={isLoading}
                  >
                    <Ionicons name="close-circle" size={32} color="#ef4444" />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <View style={styles.imagePlaceholderCircle}>
                    <Ionicons name="camera-outline" size={48} color="#059669" />
                  </View>
                  <Text style={styles.imagePlaceholderText}>Toca para agregar imagen</Text>
                  <Text style={styles.imagePlaceholderSubtext}>Requerido</Text>
                  <View style={styles.requiredBadge}>
                    <Ionicons name="alert-circle" size={16} color="#ef4444" />
                    <Text style={styles.requiredBadgeText}>Obligatorio</Text>
                  </View>
                  <Text style={styles.imageWarning}>
                    No se permiten imágenes inapropiadas
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Nombre del Producto */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIndicator} />
              <Text style={styles.sectionTitle}>Información Básica</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Nombre del Producto <Text style={styles.required}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedInput === 'name' && styles.inputWrapperFocused,
                ]}
              >
                <Ionicons
                  name="pricetag-outline"
                  size={20}
                  color={focusedInput === 'name' ? '#059669' : '#6b7280'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Tacos al Pastor"
                  placeholderTextColor="#9ca3af"
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                  maxLength={CONFIG.VALIDATION.MAX_PRODUCT_NAME_LENGTH}
                  editable={!isLoading}
                />
              </View>
              {formData.name.length > 0 && (
                <Text
                  style={[
                    styles.charCounter,
                    formData.name.length >= CONFIG.VALIDATION.MAX_PRODUCT_NAME_LENGTH - 20 && styles.charCounterWarning,
                  ]}
                >
                  {formData.name.length}/{CONFIG.VALIDATION.MAX_PRODUCT_NAME_LENGTH} caracteres
                </Text>
              )}
            </View>

            {/* Precio */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Precio <Text style={styles.required}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedInput === 'price' && styles.inputWrapperFocused,
                ]}
              >
                <View style={styles.pricePrefix}>
                  <Text style={styles.pricePrefixText}>$</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.priceInput]}
                  placeholder="0.00"
                  placeholderTextColor="#9ca3af"
                  value={formData.price}
                  onChangeText={(value) => {
                    // Solo permitir números y un punto decimal
                    const cleaned = value.replace(/[^0-9.]/g, '');
                    const parts = cleaned.split('.');
                    if (parts.length > 2) return;
                    if (parts[1] && parts[1].length > 2) return;
                    handleInputChange('price', cleaned);
                  }}
                  keyboardType="decimal-pad"
                  onFocus={() => setFocusedInput('price')}
                  onBlur={() => setFocusedInput(null)}
                  editable={!isLoading}
                />
                <Text style={styles.priceSuffix}>MXN</Text>
              </View>
              {formData.price && (
                <View style={styles.pricePreview}>
                  <Ionicons name="cash-outline" size={16} color="#059669" />
                  <Text style={styles.pricePreviewText}>
                    Precio: ${parseFloat(formData.price || 0).toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    MXN
                  </Text>
                </View>
              )}
              <Text style={styles.helperText}>
                Máximo: $999,999.99 MXN
              </Text>
            </View>

            {/* Categoría */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Categoría <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.inputWrapper,
                  styles.categoryButton,
                  focusedInput === 'category' && styles.inputWrapperFocused,
                ]}
                onPress={() => setCategoryModalVisible(true)}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Ionicons
                  name="pricetag-outline"
                  size={20}
                  color="#059669"
                  style={styles.inputIcon}
                />
                <Text style={styles.categoryButtonText}>{formData.categoryName}</Text>
                <Ionicons name="chevron-down" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Descripción */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIndicator} />
              <Text style={styles.sectionTitle}>Descripción</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Descripción del Producto <Text style={styles.required}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  styles.textAreaWrapper,
                  focusedInput === 'description' && styles.inputWrapperFocused,
                ]}
              >
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe tu producto: ingredientes, sabor, tamaño, etc."
                  placeholderTextColor="#9ca3af"
                  value={formData.description}
                  onChangeText={(value) => handleInputChange('description', value)}
                  multiline
                  numberOfLines={4}
                  onFocus={() => setFocusedInput('description')}
                  onBlur={() => setFocusedInput(null)}
                  textAlignVertical="top"
                  editable={!isLoading}
                />
              </View>
              {formData.description.length > 0 && (
                <Text
                  style={[
                    styles.charCounter,
                    formData.description.trim().split(/\s+/).filter(w => w).length >= CONFIG.VALIDATION.MAX_PRODUCT_DESCRIPTION_WORDS - 10 && styles.charCounterWarning,
                  ]}
                >
                  {formData.description.trim().split(/\s+/).filter(w => w).length}/{CONFIG.VALIDATION.MAX_PRODUCT_DESCRIPTION_WORDS} palabras
                </Text>
              )}
            </View>
          </View>

          {/* Info del usuario (Número de teléfono) */}
          {user && (
            <View style={styles.userInfoContainer}>
              <Ionicons name="call-outline" size={20} color="#059669" />
              <View style={styles.userInfoText}>
                <Text style={styles.userInfoLabel}>Contacto</Text>
                <Text style={styles.userInfoPhone}>
                  {user.phoneNumber || user.phone || "Sin número registrado"}
                </Text>
                <Text style={styles.userInfoSubtext}>
                  Los compradores podrán contactarte por WhatsApp
                </Text>
              </View>
            </View>
          )}

          {/* Botones de Acción */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <Ionicons name="close-circle-outline" size={20} color="#6b7280" />
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton, 
                (isLoading || (isEditMode && !hasChanges)) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={isLoading || (isEditMode && !hasChanges)}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.submitButtonText}>Guardando...</Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name={isEditMode ? 'checkmark-circle' : 'add-circle'}
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.submitButtonText}>
                    {isEditMode ? 'Actualizar' : 'Publicar'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* MODAL DE ERROR PERSONALIZADO */}
      <Modal
        visible={errorModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeErrorModal}
      >
        <View style={styles.errorModalOverlay}>
          <View style={styles.errorModalContent}>
            <View style={[styles.errorModalIcon, { backgroundColor: `${errorModal.iconColor}15` }]}>
              <Ionicons name={errorModal.icon} size={48} color={errorModal.iconColor} />
            </View>
            
            <Text style={styles.errorModalTitle}>{errorModal.title}</Text>
            <Text style={styles.errorModalMessage}>{errorModal.message}</Text>
            
            <TouchableOpacity
              style={[styles.errorModalButton, { backgroundColor: errorModal.iconColor }]}
              onPress={closeErrorModal}
              activeOpacity={0.8}
            >
              <Text style={styles.errorModalButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE CONFIRMACIÓN PERSONALIZADO */}
      <Modal
        visible={confirmModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeConfirmModal}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContent}>
            <View style={[styles.confirmModalIcon, { backgroundColor: `${confirmModal.iconColor}15` }]}>
              <Ionicons name={confirmModal.icon} size={48} color={confirmModal.iconColor} />
            </View>
            
            <Text style={styles.confirmModalTitle}>{confirmModal.title}</Text>
            <Text style={styles.confirmModalMessage}>{confirmModal.message}</Text>
            
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={styles.confirmModalCancelButton}
                onPress={closeConfirmModal}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmModalCancelText}>{confirmModal.cancelText}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmModalConfirmButton, { backgroundColor: confirmModal.iconColor }]}
                onPress={handleConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmModalConfirmText}>{confirmModal.confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL DE ÉXITO PERSONALIZADO */}
      <Modal
        visible={successModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeSuccessModal}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <View style={[styles.successModalIcon, { backgroundColor: `${successModal.iconColor}15` }]}>
              <Ionicons name={successModal.icon} size={64} color={successModal.iconColor} />
            </View>
            
            <Text style={styles.successModalTitle}>{successModal.title}</Text>
            <Text style={styles.successModalMessage}>{successModal.message}</Text>
            
            <TouchableOpacity
              style={[styles.successModalButton, { backgroundColor: successModal.iconColor }]}
              onPress={handleSuccessClose}
              activeOpacity={0.8}
            >
              <Text style={styles.successModalButtonText}>{successModal.buttonText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Categorías */}
      <Modal visible={categoryModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona una Categoría</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setCategoryModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.categoriesContainer} showsVerticalScrollIndicator={false}>
              {CONFIG.CATEGORIES.filter(cat => cat !== CONFIG.CATEGORIES[0]).map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.categoryOption,
                    formData.categoryName === category && styles.categoryOptionSelected,
                  ]}
                  onPress={() => selectCategory(category)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      formData.categoryName === category && styles.categoryOptionTextSelected,
                    ]}
                  >
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
    backgroundColor: '#f0fdf4',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    position: 'relative',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
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
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#059669',
    opacity: 0.2,
    top: -80,
    right: -60,
  },
  circle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#10b981',
    opacity: 0.15,
    bottom: -40,
    left: -40,
  },
  circle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#34d399',
    opacity: 0.1,
    top: 50,
    left: '40%',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#d1fae5',
    marginTop: 4,
    fontWeight: '500',
  },
  headerPlaceholder: {
    width: 44,
  },
  formContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIndicator: {
    width: 4,
    height: 20,
    backgroundColor: '#059669',
    borderRadius: 2,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065f46',
  },
  imageContainer: {
    width: '100%',
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  imageOverlayText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  imagePlaceholderCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 6,
  },
  imagePlaceholderSubtext: {
    fontSize: 13,
    color: '#6b7280',
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
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 10,
  },
  required: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    minHeight: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputWrapperFocused: {
    borderColor: '#059669',
    backgroundColor: '#f0fdf4',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
  },
  pricePrefix: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  pricePrefixText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  priceInput: {
    fontSize: 18,
    fontWeight: '600',
  },
  priceSuffix: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
    marginLeft: 8,
  },
  pricePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
    gap: 6,
  },
  pricePreviewText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
    fontStyle: 'italic',
  },
  categoryButton: {
    justifyContent: 'space-between',
  },
  categoryButtonText: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '600',
  },
  textAreaWrapper: {
    minHeight: 120,
    alignItems: 'flex-start',
    paddingTop: 14,
    paddingBottom: 14,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  charCounterWarning: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  userInfoContainer: {
    flexDirection: 'row',
    backgroundColor: '#d1fae5',
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
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 4,
  },
  userInfoPhone: {
    fontSize: 16,
    color: '#059669',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userInfoSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.3,
  },
  
  // ESTILOS DEL MODAL DE ERROR PERSONALIZADO
  errorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.66)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorModalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  errorModalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorModalMessage: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  errorModalButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  errorModalButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  
  // ESTILOS DEL MODAL DE CONFIRMACIÓN PERSONALIZADO
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.66)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  confirmModalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmModalMessage: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  confirmModalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  confirmModalCancelText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmModalConfirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmModalConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  
  // ESTILOS DEL MODAL DE ÉXITO PERSONALIZADO
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.66)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  successModalIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  successModalMessage: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  successModalButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  successModalButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  
  // ESTILOS DEL MODAL DE CATEGORÍAS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 24,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#065f46',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryOptionSelected: {
    backgroundColor: '#d1fae5',
    borderColor: '#059669',
  },
  categoryOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  categoryOptionTextSelected: {
    color: '#065f46',
    fontWeight: '700',
  },
});