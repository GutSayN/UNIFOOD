/**
 * Pantalla de Registro
 * Con MVVM - usa useAuthViewModel
 * ✅ CON MODALES PERSONALIZADOS
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Linking,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

//  Usar el nuevo ViewModel
import { useAuthViewModel } from '../viewmodels/Auth.viewmodel';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
  // Estados locales del formulario
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Estado para modal de error personalizado
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: '',
    message: '',
    icon: 'alert-circle',
    iconColor: '#ef4444',
  });

  // Estado para modal de éxito
  const [successModal, setSuccessModal] = useState({
    visible: false,
    title: '',
    message: '',
    icon: 'checkmark-circle',
    iconColor: '#10b981',
    onClose: () => {},
  });

  // Ref para el timer de auto-navegación
  const navigationTimerRef = useRef(null);

  //  Usar el ViewModel
  const { register, isLoading, validateField } = useAuthViewModel();

  // Limpiar timer al desmontar el componente
  useEffect(() => {
    return () => {
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
      }
    };
  }, []);

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
   * Cerrar modal de error
   */
  const closeErrorModal = () => {
    setErrorModal({ ...errorModal, visible: false });
  };

  /**
   * Mostrar modal de éxito con navegación automática
   */
  const showSuccess = (title, message, onClose) => {
    setSuccessModal({
      visible: true,
      title,
      message,
      icon: 'checkmark-circle',
      iconColor: '#10b981',
      onClose,
    });

    // ✅ Navegar automáticamente después de 2 segundos
    navigationTimerRef.current = setTimeout(() => {
      setSuccessModal(prev => ({ ...prev, visible: false }));
      onClose();
    }, 2000);
  };

  /**
   * Cerrar modal de éxito manualmente
   */
  const closeSuccessModal = () => {
    if (navigationTimerRef.current) {
      clearTimeout(navigationTimerRef.current);
    }
    setSuccessModal({ ...successModal, visible: false });
    successModal.onClose();
  };

  /**
   * VALIDAR EMAIL
   */
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * VALIDAR TELÉFONO (10 dígitos)
   */
  const validatePhone = (phone) => {
    return /^\d{10}$/.test(phone);
  };

  /**
   * Manejar registro CON VALIDACIONES Y MODALES
   */
  const handleRegister = async () => {
    // VALIDAR CAMPOS VACÍOS
    if (!name || !name.trim()) {
      showError(
        'Campo vacío',
        'Por favor ingresa tu nombre completo.',
        'person-outline',
        '#f59e0b'
      );
      return;
    }

    if (!email || !email.trim()) {
      showError(
        'Campo vacío',
        'Por favor ingresa tu correo electrónico.',
        'mail-outline',
        '#f59e0b'
      );
      return;
    }

    if (!phoneNumber || !phoneNumber.trim()) {
      showError(
        'Campo vacío',
        'Por favor ingresa tu número de teléfono.',
        'call-outline',
        '#f59e0b'
      );
      return;
    }

    if (!password || !password.trim()) {
      showError(
        'Campo vacío',
        'Por favor ingresa una contraseña.',
        'lock-closed-outline',
        '#f59e0b'
      );
      return;
    }

    // VALIDAR NOMBRE (mínimo 3 caracteres)
    if (name.trim().length < 3) {
      showError(
        'Nombre muy corto',
        'El nombre debe tener al menos 3 caracteres.',
        'person-outline',
        '#f59e0b'
      );
      return;
    }

    // VALIDAR FORMATO DE EMAIL
    if (!validateEmail(email.trim())) {
      showError(
        'Correo inválido',
        'Por favor ingresa un correo electrónico válido.\n\nEjemplo: usuario@ejemplo.com',
        'mail-outline',
        '#f59e0b'
      );
      return;
    }

    // VALIDAR TELÉFONO (10 dígitos)
    if (!validatePhone(phoneNumber.trim())) {
      showError(
        'Teléfono inválido',
        'El número de teléfono debe tener exactamente 10 dígitos.',
        'call-outline',
        '#f59e0b'
      );
      return;
    }

    // VALIDAR CONTRASEÑA (mínimo 8 caracteres)
    if (password.length < 8) {
      showError(
        'Contraseña muy corta',
        'La contraseña debe tener al menos 8 caracteres.',
        'lock-closed-outline',
        '#f59e0b'
      );
      return;
    }

    // VALIDAR MAYÚSCULA EN CONTRASEÑA
    if (!/[A-Z]/.test(password)) {
      showError(
        'Contraseña débil',
        'La contraseña debe contener al menos una letra mayúscula.',
        'lock-closed-outline',
        '#f59e0b'
      );
      return;
    }

    // VALIDAR TÉRMINOS Y CONDICIONES
    if (!acceptedTerms) {
      showError(
        'Términos y condiciones',
        'Debes aceptar los términos y condiciones para continuar.',
        'document-text-outline',
        '#f59e0b'
      );
      return;
    }

    //  Llamar al ViewModel
    const result = await register({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phoneNumber.trim(),
      password,
    });

    if (result.success) {
      // Mostrar modal de éxito con navegación automática
      showSuccess(
        'Cuenta creada',
        result.message || 'Tu cuenta ha sido creada exitosamente.\n\nRedirigiendo al inicio de sesión...',
        () => {
          navigation.replace('Login');
        }
      );
    } else {
      // Manejar diferentes tipos de errores
      const errorMsg = (result.error || '').toLowerCase();
      
      // Error de correo ya registrado
      if (errorMsg.includes('correo ya está registrado') || 
          errorMsg.includes('email ya existe') ||
          errorMsg.includes('already exists') ||
          errorMsg.includes('ya registrado')) {
        showError(
          'Correo en uso',
          'Este correo electrónico ya está registrado.\n\n¿Ya tienes una cuenta? Intenta iniciar sesión.',
          'mail-outline',
          '#ef4444'
        );
      }
      // Error de datos inválidos
      else if (errorMsg.includes('datos inválidos') || 
               errorMsg.includes('invalid data') ||
               errorMsg.includes('validation')) {
        showError(
          'Datos inválidos',
          'Por favor verifica que todos los campos estén correctos.',
          'alert-circle',
          '#f59e0b'
        );
      }
      // Error de conexión
      else if (errorMsg.includes('network') || 
               errorMsg.includes('conexión') ||
               errorMsg.includes('connection') ||
               errorMsg.includes('sin conexión')) {
        showError(
          'Sin conexión',
          'No se pudo conectar al servidor.\n\nVerifica tu conexión a internet e intenta de nuevo.',
          'cloud-offline-outline',
          '#f59e0b'
        );
      }
      // Error de timeout
      else if (errorMsg.includes('timeout') || 
               errorMsg.includes('tiempo de espera')) {
        showError(
          'Tiempo agotado',
          'La conexión tardó demasiado.\n\nPor favor intenta de nuevo.',
          'time-outline',
          '#f59e0b'
        );
      }
      // Error del servidor
      else if (errorMsg.includes('servidor') || 
               errorMsg.includes('server error')) {
        showError(
          'Error del servidor',
          'Hay un problema en el servidor.\n\nPor favor intenta más tarde.',
          'construct-outline',
          '#ef4444'
        );
      }
      // Error genérico
      else {
        showError(
          'Error al crear cuenta',
          result.error || 'No se pudo crear la cuenta.\n\nPor favor intenta de nuevo más tarde.',
          'alert-circle',
          '#ef4444'
        );
      }
    }
  };

  /**
   * Abrir términos y condiciones
   */
  const openTerms = async () => {
    const url = 'https://gutsayn.github.io/ufood-legal/legal/terms.html';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        showError(
          'Error',
          'No se puede abrir el enlace en este momento.',
          'link-outline',
          '#ef4444'
        );
      }
    } catch (error) {
      showError(
        'Error',
        'Ocurrió un problema al abrir los términos y condiciones.',
        'link-outline',
        '#ef4444'
      );
    }
  };

  /**
   * Validación visual en tiempo real
   */
  const getFieldStatus = (field) => {
    if (field === 'name' && name.length > 0) {
      const validation = validateField('name', name);
      return validation.isValid;
    }
    if (field === 'email' && email.length > 0) {
      const validation = validateField('email', email);
      return validation.isValid;
    }
    if (field === 'phone' && phoneNumber.length > 0) {
      const validation = validateField('phoneNumber', phoneNumber);
      return validation.isValid;
    }
    if (field === 'password' && password.length > 0) {
      const validation = validateField('password', password);
      return validation.isValid;
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
        {/* Fondo decorativo */}
        <View style={styles.topBackground}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.circle3} />
        </View>

        {/* Header con botón de regreso */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Login')}
            disabled={isLoading}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Logo y título */}
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <View style={styles.logoCircle}>
              <Ionicons name="restaurant" size={40} color="#059669" />
            </View>
          </View>
          <Text style={styles.logoText}>UFood</Text>
          <Text style={styles.subtitle}>Crea tu cuenta</Text>
        </View>

        {/* Tarjeta de registro */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.welcomeText}>¡Únete!</Text>
            <Text style={styles.registerText}>Completa tus datos para comenzar</Text>
          </View>

          {/* Input de nombre completo */}
          <View style={styles.inputContainer}>
            <View
              style={[
                styles.inputWrapper,
                focusedInput === 'name' && styles.inputWrapperFocused,
              ]}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name="person-outline"
                  size={22}
                  color={focusedInput === 'name' ? '#059669' : '#6b7280'}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Nombre Completo"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
                maxLength={40}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
                editable={!isLoading}
              />
              {getFieldStatus('name') !== null && (
                <View style={styles.statusIcon}>
                  <Ionicons
                    name={getFieldStatus('name') ? 'checkmark-circle' : 'alert-circle'}
                    size={20}
                    color={getFieldStatus('name') ? '#10b981' : '#f59e0b'}
                  />
                </View>
              )}
            </View>
            {/* Contador de caracteres */}
            {name.length > 0 && (
              <Text
                style={[
                  styles.charCounter,
                  name.trim().length >= 30
                    ? styles.charCounterSuccess
                    : styles.charCounterWarning,
                ]}
              >
                {name.trim().length}/30 caracteres{' '}
                {name.trim().length >= 30 ? 'OK' : ''}
              </Text>
            )}
          </View>

          {/* Input de correo */}
          <View style={styles.inputContainer}>
            <View
              style={[
                styles.inputWrapper,
                focusedInput === 'email' && styles.inputWrapperFocused,
              ]}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name="mail-outline"
                  size={22}
                  color={focusedInput === 'email' ? '#059669' : '#6b7280'}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Correo Electrónico"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                editable={!isLoading}
              />
              {getFieldStatus('email') !== null && (
                <View style={styles.statusIcon}>
                  <Ionicons
                    name={getFieldStatus('email') ? 'checkmark-circle' : 'alert-circle'}
                    size={20}
                    color={getFieldStatus('email') ? '#10b981' : '#f59e0b'}
                  />
                </View>
              )}
            </View>
          </View>

          {/* Input de teléfono */}
          <View style={styles.inputContainer}>
            <View
              style={[
                styles.inputWrapper,
                focusedInput === 'phone' && styles.inputWrapperFocused,
              ]}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name="call-outline"
                  size={22}
                  color={focusedInput === 'phone' ? '#059669' : '#6b7280'}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Teléfono (10 dígitos)"
                placeholderTextColor="#9ca3af"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="numeric"
                maxLength={10}
                onFocus={() => setFocusedInput('phone')}
                onBlur={() => setFocusedInput(null)}
                editable={!isLoading}
              />
              {getFieldStatus('phone') !== null && (
                <View style={styles.statusIcon}>
                  <Ionicons
                    name={getFieldStatus('phone') ? 'checkmark-circle' : 'alert-circle'}
                    size={20}
                    color={getFieldStatus('phone') ? '#10b981' : '#f59e0b'}
                  />
                </View>
              )}
            </View>
          </View>

          {/* Input de contraseña */}
          <View style={styles.inputContainer}>
            <View
              style={[
                styles.inputWrapper,
                focusedInput === 'password' && styles.inputWrapperFocused,
              ]}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={22}
                  color={focusedInput === 'password' ? '#059669' : '#6b7280'}
                />
              </View>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Contraseña (mín. 8 caracteres)"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                disabled={isLoading}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color="#6b7280"
                />
              </TouchableOpacity>
              {getFieldStatus('password') !== null && (
                <View style={styles.statusIcon}>
                  <Ionicons
                    name={
                      getFieldStatus('password') ? 'checkmark-circle' : 'alert-circle'
                    }
                    size={20}
                    color={getFieldStatus('password') ? '#10b981' : '#f59e0b'}
                  />
                </View>
              )}
            </View>
          </View>

          {/* Indicadores de requisitos de contraseña */}
          <View style={styles.passwordRequirements}>
            <View style={styles.requirementItem}>
              <Text
                style={[
                  styles.requirementDot,
                  password.length >= 8 && styles.requirementDotActive,
                ]}
              >
                ●
              </Text>
              <Text
                style={[
                  styles.requirementText,
                  password.length >= 8 && styles.requirementTextActive,
                ]}
              >
                Mínimo 8 caracteres
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Text
                style={[
                  styles.requirementDot,
                  /[A-Z]/.test(password) && styles.requirementDotActive,
                ]}
              >
                ●
              </Text>
              <Text
                style={[
                  styles.requirementText,
                  /[A-Z]/.test(password) && styles.requirementTextActive,
                ]}
              >
                Una letra mayúscula
              </Text>
            </View>
          </View>

          {/* Checkbox de Términos y Condiciones */}
          <View style={styles.termsContainer}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                acceptedTerms && styles.checkboxChecked,
              ]}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              {acceptedTerms && <Ionicons name="checkmark" size={18} color="white" />}
            </TouchableOpacity>
            <View style={styles.termsTextContainer}>
              <Text style={styles.termsText}>
                Acepto los{' '}
                <Text style={styles.termsLink} onPress={openTerms}>
                  Términos y Condiciones
                </Text>
              </Text>
            </View>
          </View>

          {/* Botón de registro */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              (!acceptedTerms || isLoading) && styles.registerButtonDisabled,
            ]}
            onPress={handleRegister}
            activeOpacity={0.8}
            disabled={!acceptedTerms || isLoading}
          >
            {isLoading ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.registerButtonText}> Creando...</Text>
              </>
            ) : (
              <>
                <Text style={styles.registerButtonText}>Crear Cuenta</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>

          {/* Separador */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Link a login */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              disabled={isLoading}
            >
              <Text style={styles.loginLink}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Decoración inferior */}
        <View style={styles.bottomDecoration}>
          <Ionicons name="leaf" size={20} color="#d1fae5" />
          <Text style={styles.bottomText}>Únete a la familia UFood</Text>
          <Ionicons name="leaf" size={20} color="#d1fae5" />
        </View>
      </ScrollView>

      {/* ✅ MODAL DE ERROR PERSONALIZADO */}
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

      {/* ✅ MODAL DE ÉXITO PERSONALIZADO */}
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
            
            <ActivityIndicator size="large" color={successModal.iconColor} style={styles.successLoader} />
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
  topBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
    backgroundColor: '#065f46',
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#059669',
    opacity: 0.3,
    top: -40,
    right: -40,
  },
  circle2: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#10b981',
    opacity: 0.2,
    top: 80,
    left: -20,
  },
  circle3: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#34d399',
    opacity: 0.25,
    bottom: 15,
    right: 50,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  logoWrapper: {
    marginBottom: 15,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#d1fae5',
    marginTop: 6,
    fontWeight: '500',
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 30,
    padding: 24,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    textAlign: 'center', 
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#065f46',
    textAlign: 'center', 
    marginBottom: 6,
  },
  registerText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    paddingHorizontal: 4,
  },
  inputWrapperFocused: {
    borderColor: '#059669',
    backgroundColor: '#f0fdf4',
  },
  iconContainer: {
    width: 44,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
  },
  statusIcon: {
    width: 40,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeButton: {
    width: 44,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  charCounter: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '600',
  },
  charCounterWarning: {
    color: '#f59e0b',
  },
  charCounterSuccess: {
    color: '#10b981',
  },
  passwordRequirements: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requirementDot: {
    fontSize: 10,
    color: '#d1d5db',
    marginRight: 8,
    fontWeight: 'bold',
  },
  requirementDotActive: {
    color: '#10b981',
  },
  requirementText: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  requirementTextActive: {
    color: '#059669',
    fontWeight: '600',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    lineHeight: 20,
  },
  termsLink: {
    color: '#059669',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  registerButton: {
    backgroundColor: '#059669',
    borderRadius: 16,
    height: 54,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  registerButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0.1,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginRight: 10,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '500',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  loginLink: {
    fontSize: 14,
    color: '#059669',
    fontWeight: 'bold',
  },
  bottomDecoration: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    gap: 8,
  },
  bottomText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '600',
  },

  // ✅ ESTILOS DEL MODAL DE ERROR PERSONALIZADO
  errorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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

  // ✅ ESTILOS DEL MODAL DE ÉXITO
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    marginBottom: 20,
  },
  successLoader: {
    marginTop: 8,
  },
});