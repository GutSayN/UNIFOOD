/**
 * AdminProductDetailScreen - Detalle y Edición de Producto
 * Permite al admin editar información del producto
 * CON DATADOG INTEGRADO ✅
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDatadog } from '../hooks/useDatadog';
import adminService from '../services/Admin.service';
import productService from '../services/Product.service';
import CONFIG from '../config/app.config';

export default function AdminProductDetailScreen({ navigation, route }) {
  const { product: initialProduct } = route.params;
  const { trackEvent, trackError } = useDatadog('AdminProductDetail');

  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const [formData, setFormData] = useState({
    name: initialProduct.name || '',
    price: initialProduct.price?.toString() || '',
    description: initialProduct.description || '',
    categoryName: initialProduct.categoryName || CONFIG.CATEGORIES[0],
    image: initialProduct.imageUrl ? { uri: initialProduct.imageUrl } : null,
  });

  const [originalFormData, setOriginalFormData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const [successModal, setSuccessModal] = useState({ visible: false, message: '' });
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });

  useEffect(() => {
    const initial = {
      name: initialProduct.name || '',
      price: initialProduct.price?.toString() || '',
      description: initialProduct.description || '',
      categoryName: initialProduct.categoryName || CONFIG.CATEGORIES[0],
      image: initialProduct.imageUrl ? { uri: initialProduct.imageUrl } : null,
    };
    setOriginalFormData(initial);
  }, [initialProduct]);

  useEffect(() => {
    if (!originalFormData) return;

    const nameChanged = formData.name !== originalFormData.name;
    const priceChanged = formData.price !== originalFormData.price;
    const descChanged = formData.description !== originalFormData.description;
    const categoryChanged = formData.categoryName !== originalFormData.categoryName;
    
    const currentUri = formData.image?.uri || null;
    const originalUri = originalFormData.image?.uri || null;
    const imageChanged = currentUri !== originalUri;

    setHasChanges(nameChanged || priceChanged || descChanged || categoryChanged || imageChanged);
  }, [formData, originalFormData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePickImage = async () => {
    const result = await productService.pickImage();
    if (result) {
      setFormData(prev => ({ ...prev, image: result }));
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
  };

  const selectCategory = (category) => {
    handleInputChange('categoryName', category);
    setCategoryModalVisible(false);
  };

  const validateForm = () => {
    if (!formData.image || !formData.image.uri) {
      setErrorModal({ visible: true, message: 'La imagen es obligatoria' });
      return false;
    }

    if (!formData.name || !formData.name.trim()) {
      setErrorModal({ visible: true, message: 'El nombre es obligatorio' });
      return false;
    }

    if (formData.name.trim().length > CONFIG.VALIDATION.MAX_PRODUCT_NAME_LENGTH) {
      setErrorModal({ visible: true, message: `El nombre no puede exceder ${CONFIG.VALIDATION.MAX_PRODUCT_NAME_LENGTH} caracteres` });
      return false;
    }

    if (!formData.price || !formData.price.trim()) {
      setErrorModal({ visible: true, message: 'El precio es obligatorio' });
      return false;
    }

    if (!CONFIG.VALIDATION.PRICE_REGEX.test(formData.price.trim())) {
      setErrorModal({ visible: true, message: 'Formato de precio inválido' });
      return false;
    }

    const priceValue = parseFloat(formData.price);
    if (priceValue <= 0) {
      setErrorModal({ visible: true, message: 'El precio debe ser mayor a 0' });
      return false;
    }

    if (priceValue > CONFIG.VALIDATION.MAX_PRODUCT_PRICE) {
      setErrorModal({ visible: true, message: `El precio máximo es $${CONFIG.VALIDATION.MAX_PRODUCT_PRICE.toLocaleString()}` });
      return false;
    }

    if (!formData.categoryName || formData.categoryName === CONFIG.CATEGORIES[0]) {
      setErrorModal({ visible: true, message: 'Debes seleccionar una categoría' });
      return false;
    }

    if (!formData.description || !formData.description.trim()) {
      setErrorModal({ visible: true, message: 'La descripción es obligatoria' });
      return false;
    }

    const words = formData.description.trim().split(/\s+/).filter(w => w);
    if (words.length > CONFIG.VALIDATION.MAX_PRODUCT_DESCRIPTION_WORDS) {
      setErrorModal({ visible: true, message: `La descripción no puede exceder ${CONFIG.VALIDATION.MAX_PRODUCT_DESCRIPTION_WORDS} palabras` });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      await adminService.updateProduct(initialProduct.productId, formData);

      trackEvent('admin_product_updated', { product_id: initialProduct.productId });

      // Recargar productos silenciosamente en segundo plano
      productService.getAllProducts().catch(err => {
        console.warn('Error reloading products in background:', err);
      });

      setSuccessModal({ visible: true, message: 'Producto actualizado correctamente' });
      setOriginalFormData({ ...formData });
    } catch (error) {
      console.error('Error updating product:', error);
      trackError(error, { context: 'updateProduct', product_id: initialProduct.productId });
      
      // MANEJO COMPLETO DE ERRORES
      let errorTitle = 'Error al actualizar';
      let errorMessage = 'No se pudo actualizar el producto';
      
      if (error.message) {
        const errorMsg = error.message.toLowerCase();
        
        // DETECTAR MALAS PALABRAS
        if (errorMsg.includes('lenguaje inapropiado') || 
            errorMsg.includes('malas palabras') ||
            errorMsg.includes('palabras ofensivas') ||
            errorMsg.includes('contenido ofensivo') ||
            errorMsg.includes('inappropriate language')) {
          
          errorTitle = 'Lenguaje inapropiado';
          errorMessage = 'El texto contiene lenguaje inapropiado en el nombre, descripción o categoría.\n\nPor favor revisa y corrige el contenido.';
          
        // DETECTAR IMAGEN RECHAZADA
        } else if (errorMsg.includes('imagen rechazada') || 
            errorMsg.includes('contenido sensible') || 
            errorMsg.includes('contenido violento') ||
            errorMsg.includes('contenido inapropiado') ||
            errorMsg.includes('inappropriate image') ||
            errorMsg.includes('inappropriate content')) {
          
          errorTitle = 'Imagen no permitida';
          errorMessage = 'La imagen que seleccionaste contiene contenido inapropiado, sensible o violento.\n\nPor favor selecciona una imagen diferente que cumpla con nuestras políticas de contenido.';
          
          // Limpiar la imagen rechazada
          setFormData(prev => ({ ...prev, image: null }));
          
        } else if (errorMsg.includes('price must not be greater than') || 
                   errorMsg.includes('precio muy alto')) {
          errorTitle = 'Precio muy alto';
          errorMessage = 'El precio máximo permitido es $999,999.99\n\nPor favor reduce el precio e intenta de nuevo.';
          
        } else if (errorMsg.includes('network') || errorMsg.includes('conexión')) {
          errorTitle = 'Sin conexión';
          errorMessage = 'Error de conexión a internet.\n\nVerifica tu conexión e intenta de nuevo.';
          
        } else if (errorMsg.includes('400') || errorMsg.includes('bad request')) {
          // Para errores 400 genéricos, intentar extraer el mensaje del servidor
          try {
            const jsonMatch = error.message.match(/\{.*\}/);
            if (jsonMatch) {
              const errorData = JSON.parse(jsonMatch[0]);
              if (errorData.message) {
                const serverMsg = errorData.message.toLowerCase();
                
                if (serverMsg.includes('lenguaje inapropiado') ||
                    serverMsg.includes('malas palabras') ||
                    serverMsg.includes('palabras ofensivas')) {
                  errorTitle = 'Lenguaje inapropiado';
                  errorMessage = 'El texto contiene lenguaje inapropiado.\n\nPor favor revisa el nombre, descripción y categoría.';
                  
                } else if (serverMsg.includes('imagen rechazada') || 
                    serverMsg.includes('contenido sensible') ||
                    serverMsg.includes('contenido inapropiado')) {
                  errorTitle = 'Imagen no permitida';
                  errorMessage = 'La imagen que seleccionaste contiene contenido inapropiado.\n\nPor favor selecciona una imagen diferente.';
                  setFormData(prev => ({ ...prev, image: null }));
                } else {
                  errorMessage = errorData.message + '\n\nRevisa el formulario e intenta de nuevo.';
                }
              } else {
                errorMessage = 'Los datos ingresados no son válidos.\n\nRevisa el formulario e intenta de nuevo.';
              }
            } else {
              errorMessage = 'Los datos ingresados no son válidos.\n\nRevisa el formulario e intenta de nuevo.';
            }
          } catch (parseError) {
            errorMessage = 'Los datos ingresados no son válidos.\n\nRevisa el formulario e intenta de nuevo.';
          }
          
        } else {
          // Mostrar el mensaje original del servidor si está disponible
          errorMessage = error.message + '\n\nPor favor verifica los datos e intenta de nuevo.';
        }
      }
      
      setErrorModal({ visible: true, message: errorTitle + '\n\n' + errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      setFormData({ ...originalFormData });
    }
    navigation.goBack();
  };

  const getImageUri = () => {
    if (formData.image && formData.image.uri) {
      return formData.image.uri;
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.headerBackground}>
              <View style={styles.circle1} />
              <View style={styles.circle2} />
              <View style={styles.circle3} />
            </View>

            <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Editar Producto</Text>
              <Text style={styles.headerSubtitle}>Actualiza la información</Text>
            </View>

            <View style={styles.headerPlaceholder} />
          </View>

          <View style={styles.contentWrapper}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIndicator} />
                <Text style={styles.sectionTitle}>Imagen del Producto</Text>
              </View>

              <TouchableOpacity style={styles.imageContainer} onPress={handlePickImage} activeOpacity={0.8} disabled={isLoading}>
                {getImageUri() ? (
                  <>
                    <Image source={{ uri: getImageUri() }} style={styles.productImage} />
                    <View style={styles.imageOverlay}>
                      <Ionicons name="camera" size={32} color="white" />
                      <Text style={styles.imageOverlayText}>Cambiar imagen</Text>
                    </View>
                    <TouchableOpacity style={styles.removeImageButton} onPress={handleRemoveImage} disabled={isLoading}>
                      <Ionicons name="close-circle" size={32} color="#ef4444" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <View style={styles.imagePlaceholderCircle}>
                      <Ionicons name="camera-outline" size={48} color="#f59e0b" />
                    </View>
                    <Text style={styles.imagePlaceholderText}>Toca para agregar imagen</Text>
                    <Text style={styles.imagePlaceholderSubtext}>Requerido</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIndicator} />
                <Text style={styles.sectionTitle}>Información Básica</Text>
              </View>

              <View style={styles.editCard}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nombre del Producto <Text style={styles.required}>*</Text></Text>
                  <View style={[styles.inputWrapper, focusedInput === 'name' && styles.inputWrapperFocused]}>
                    <Ionicons name="pricetag-outline" size={20} color={focusedInput === 'name' ? '#f59e0b' : '#6b7280'} style={styles.inputIcon} />
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
                    <Text style={[styles.charCounter, formData.name.length >= CONFIG.VALIDATION.MAX_PRODUCT_NAME_LENGTH - 20 && styles.charCounterWarning]}>
                      {formData.name.length}/{CONFIG.VALIDATION.MAX_PRODUCT_NAME_LENGTH} caracteres
                    </Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Precio <Text style={styles.required}>*</Text></Text>
                  <View style={[styles.inputWrapper, focusedInput === 'price' && styles.inputWrapperFocused]}>
                    <View style={styles.pricePrefix}>
                      <Text style={styles.pricePrefixText}>$</Text>
                    </View>
                    <TextInput
                      style={[styles.input, styles.priceInput]}
                      placeholder="0.00"
                      placeholderTextColor="#9ca3af"
                      value={formData.price}
                      onChangeText={(value) => {
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
                      <Ionicons name="cash-outline" size={16} color="#f59e0b" />
                      <Text style={styles.pricePreviewText}>
                        Precio: ${parseFloat(formData.price || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Categoría <Text style={styles.required}>*</Text></Text>
                  <TouchableOpacity
                    style={[styles.inputWrapper, styles.categoryButton, focusedInput === 'category' && styles.inputWrapperFocused]}
                    onPress={() => setCategoryModalVisible(true)}
                    activeOpacity={0.7}
                    disabled={isLoading}
                  >
                    <Ionicons name="pricetag-outline" size={20} color="#f59e0b" style={styles.inputIcon} />
                    <Text style={styles.categoryButtonText}>{formData.categoryName}</Text>
                    <Ionicons name="chevron-down" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIndicator} />
                <Text style={styles.sectionTitle}>Descripción</Text>
              </View>

              <View style={styles.editCard}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Descripción del Producto <Text style={styles.required}>*</Text></Text>
                  <View style={[styles.inputWrapper, styles.textAreaWrapper, focusedInput === 'description' && styles.inputWrapperFocused]}>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Describe tu producto..."
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
                    <Text style={[styles.charCounter, formData.description.trim().split(/\s+/).filter(w => w).length >= CONFIG.VALIDATION.MAX_PRODUCT_DESCRIPTION_WORDS - 10 && styles.charCounterWarning]}>
                      {formData.description.trim().split(/\s+/).filter(w => w).length}/{CONFIG.VALIDATION.MAX_PRODUCT_DESCRIPTION_WORDS} palabras
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {initialProduct.userName && (
              <View style={styles.sellerInfoContainer}>
                <Ionicons name="person-outline" size={20} color="#6b7280" />
                <View style={styles.sellerInfoText}>
                  <Text style={styles.sellerInfoLabel}>Vendedor</Text>
                  <Text style={styles.sellerInfoName}>{initialProduct.userName}</Text>
                </View>
              </View>
            )}

            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} activeOpacity={0.8} disabled={isLoading}>
                <Ionicons name="close-circle-outline" size={20} color="#6b7280" />
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, (!hasChanges || isLoading) && styles.saveButtonDisabled]}
                onPress={handleSave}
                activeOpacity={0.8}
                disabled={!hasChanges || isLoading}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.saveButtonText}>Guardando...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Actualizar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={successModal.visible} transparent={true} animationType="fade" onRequestClose={() => setSuccessModal({ visible: false, message: '' })}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color="#10b981" />
            </View>
            <Text style={styles.modalTitle}>¡Actualizado!</Text>
            <Text style={styles.modalMessage}>{successModal.message}</Text>
            <TouchableOpacity style={styles.successButton} onPress={() => { setSuccessModal({ visible: false, message: '' }); navigation.goBack(); }} activeOpacity={0.8}>
              <Text style={styles.successButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={errorModal.visible} transparent={true} animationType="fade" onRequestClose={() => setErrorModal({ visible: false, message: '' })}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.errorIcon}>
              <Ionicons name="close-circle" size={64} color="#ef4444" />
            </View>
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={styles.modalMessage}>{errorModal.message}</Text>
            <TouchableOpacity style={styles.errorButton} onPress={() => setErrorModal({ visible: false, message: '' })} activeOpacity={0.8}>
              <Text style={styles.errorButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={categoryModalVisible} animationType="slide" transparent={true}>
        <View style={styles.categoryModalOverlay}>
          <View style={styles.categoryModalContent}>
            <View style={styles.categoryModalHeader}>
              <Text style={styles.categoryModalTitle}>Selecciona una Categoría</Text>
              <TouchableOpacity style={styles.categoryModalCloseButton} onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.categoriesContainer} showsVerticalScrollIndicator={false}>
              {CONFIG.CATEGORIES.filter(cat => cat !== CONFIG.CATEGORIES[0]).map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.categoryOption, formData.categoryName === category && styles.categoryOptionSelected]}
                  onPress={() => selectCategory(category)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categoryOptionText, formData.categoryName === category && styles.categoryOptionTextSelected]}>{category}</Text>
                  {formData.categoryName === category && <Ionicons name="checkmark-circle" size={24} color="#f59e0b" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  scrollContent: { paddingBottom: 30 },
  header: { position: 'relative', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden' },
  headerBackground: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#065f46' },
  circle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#059669', opacity: 0.2, top: -80, right: -60 },
  circle2: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: '#10b981', opacity: 0.15, bottom: -40, left: -40 },
  circle3: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: '#34d399', opacity: 0.1, top: 50, left: '40%' },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 16, zIndex: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 13, color: '#d1fae5', marginTop: 4, fontWeight: '500' },
  headerPlaceholder: { width: 44 },
  contentWrapper: { backgroundColor: '#f0fdf4', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -20, paddingHorizontal: 20, paddingTop: 30 },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionIndicator: { width: 4, height: 20, backgroundColor: '#f59e0b', borderRadius: 2, marginRight: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#065f46' },
  imageContainer: { width: '100%', height: 240, borderRadius: 20, overflow: 'hidden', backgroundColor: '#fff', shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, position: 'relative' },
  productImage: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', opacity: 0 },
  imageOverlayText: { color: '#fff', marginTop: 8, fontSize: 14, fontWeight: '600' },
  removeImageButton: { position: 'absolute', top: 12, right: 12, backgroundColor: 'white', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  imagePlaceholderCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  imagePlaceholderText: { fontSize: 16, fontWeight: '600', color: '#065f46', marginBottom: 6 },
  imagePlaceholderSubtext: { fontSize: 13, color: '#6b7280', marginBottom: 12 },
  editCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '600', color: '#065f46', marginBottom: 10 },
  required: { color: '#ef4444', fontWeight: 'bold' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 2, borderColor: '#e5e7eb', paddingHorizontal: 14, minHeight: 52, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  inputWrapperFocused: { borderColor: '#f59e0b', backgroundColor: '#fef3c7', shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#1f2937', fontWeight: '500' },
  pricePrefix: { backgroundColor: '#fef3c7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 10 },
  pricePrefixText: { fontSize: 18, fontWeight: 'bold', color: '#f59e0b' },
  priceInput: { fontSize: 18, fontWeight: '600' },
  priceSuffix: { fontSize: 13, color: '#6b7280', fontWeight: '600', marginLeft: 8 },
  pricePreview: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingHorizontal: 4, gap: 6 },
  pricePreviewText: { fontSize: 14, color: '#f59e0b', fontWeight: '600' },
  categoryButton: { justifyContent: 'space-between' },
  categoryButtonText: { flex: 1, fontSize: 15, color: '#1f2937', fontWeight: '600' },
  textAreaWrapper: { minHeight: 120, alignItems: 'flex-start', paddingTop: 14, paddingBottom: 14 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  charCounter: { fontSize: 12, color: '#6b7280', marginTop: 6, marginLeft: 4, fontWeight: '500' },
  charCounterWarning: { color: '#f59e0b', fontWeight: '600' },
  sellerInfoContainer: { flexDirection: 'row', backgroundColor: '#fef3c7', padding: 16, borderRadius: 14, marginBottom: 20, alignItems: 'flex-start', gap: 12 },
  sellerInfoText: { flex: 1 },
  sellerInfoLabel: { fontSize: 13, fontWeight: '600', color: '#065f46', marginBottom: 4 },
  sellerInfoName: { fontSize: 16, color: '#f59e0b', fontWeight: 'bold' },
  actionsContainer: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 16 },
  cancelButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', paddingVertical: 16, borderRadius: 14, borderWidth: 2, borderColor: '#e5e7eb' },
  cancelButtonText: { fontSize: 16, fontWeight: 'bold', color: '#6b7280' },
  saveButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f59e0b', paddingVertical: 16, borderRadius: 14, shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  saveButtonDisabled: { backgroundColor: '#9ca3af', shadowOpacity: 0.1 },
  saveButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff', letterSpacing: 0.3 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 400, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  successIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#d1fae515', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  errorIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#fee2e215', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 12 },
  modalMessage: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  successButton: { width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center', backgroundColor: '#10b981', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  successButtonText: { color: '#fff', fontSize: 17, fontWeight: 'bold', letterSpacing: 0.5 },
  errorButton: { width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center', backgroundColor: '#ef4444', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  errorButtonText: { color: '#fff', fontSize: 17, fontWeight: 'bold', letterSpacing: 0.5 },
  categoryModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  categoryModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 24, maxHeight: '70%' },
  categoryModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
  categoryModalTitle: { fontSize: 20, fontWeight: 'bold', color: '#065f46' },
  categoryModalCloseButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  categoriesContainer: { paddingHorizontal: 24, paddingBottom: 24 },
  categoryOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
  categoryOptionSelected: { backgroundColor: '#fef3c7', borderColor: '#f59e0b' },
  categoryOptionText: { fontSize: 16, fontWeight: '600', color: '#1f2937', flex: 1 },
  categoryOptionTextSelected: { color: '#065f46', fontWeight: '700' },
});