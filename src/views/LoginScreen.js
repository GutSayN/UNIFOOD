/**
 * Pantalla de Login
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Usar el nuevo ViewModel
import { useAuthViewModel } from '../viewmodels/Auth.viewmodel';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  // Estados locales del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  // Estado para modal de error personalizado
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: '',
    message: '',
    icon: 'alert-circle',
    iconColor: '#ef4444',
  });

  // Estado para modal de bienvenida
  const [welcomeModal, setWelcomeModal] = useState({
    visible: false,
    title: '',
    message: '',
    icon: 'checkmark-circle',
    iconColor: '#10b981',
    onClose: () => {},
  });

  // Ref para el timer de auto-navegación
  const navigationTimerRef = useRef(null);

  // Usar el ViewModel en lugar de lógica dispersa
  const { login, isLoading, error, clearError } = useAuthViewModel();

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
   * Mostrar modal de bienvenida con navegación automática
   */
  const showWelcome = (title, message, onClose) => {
    setWelcomeModal({
      visible: true,
      title,
      message,
      icon: 'checkmark-circle',
      iconColor: '#10b981',
      onClose,
    });

    // Navegar automáticamente después de 1.5 segundos
    navigationTimerRef.current = setTimeout(() => {
      setWelcomeModal(prev => ({ ...prev, visible: false }));
      onClose();
    }, 1500);
  };

  /**
   * Cerrar modal de bienvenida manualmente (por si el usuario quiere cerrar antes)
   */
  const closeWelcomeModal = () => {
    if (navigationTimerRef.current) {
      clearTimeout(navigationTimerRef.current);
    }
    setWelcomeModal({ ...welcomeModal, visible: false });
    welcomeModal.onClose();
  };

  /**
   * VALIDAR EMAIL
   */
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Manejar submit del formulario CON VALIDACIONES
   */
  const handleLogin = async () => {
    // Limpiar errores previos
    clearError();

    // ========== VALIDAR CAMPOS VACÍOS ==========
    if (!email || !email.trim()) {
      showError(
        'Campo vacío',
        'Por favor ingresa tu correo electrónico.',
        'mail-outline',
        '#f59e0b'
      );
      return;
    }

    if (!password || !password.trim()) {
      showError(
        'Campo vacío',
        'Por favor ingresa tu contraseña.',
        'lock-closed-outline',
        '#f59e0b'
      );
      return;
    }

    // ========== VALIDAR FORMATO DE EMAIL ==========
    if (!validateEmail(email.trim())) {
      showError(
        'Correo inválido',
        'Por favor ingresa un correo electrónico válido.\n\nEjemplo: usuario@ejemplo.com',
        'mail-outline',
        '#f59e0b'
      );
      return;
    }

    // ========== VALIDAR LONGITUD DE CONTRASEÑA ==========
    if (password.length < 6) {
      showError(
        'Contraseña muy corta',
        'La contraseña debe tener al menos 6 caracteres.',
        'lock-closed-outline',
        '#f59e0b'
      );
      return;
    }

    // Llamar al ViewModel
    const result = await login(email.trim(), password);

    if (result.success) {
      // Mostrar modal de bienvenida con navegación automática
      const userName = result.user?.name || result.user?.userName || 'Usuario';
      
      showWelcome(
        '¡Bienvenido!',
        `Hola, ${userName}!\n\nIniciando sesión...`,
        () => {
          // Navegar según el rol del usuario
          if (result.isAdmin) {
            navigation.replace('AdminHome');
          } else {
            navigation.replace('Home');
          }
        }
      );
    } else {
      // Manejar diferentes tipos de errores
      const errorMsg = (result.error || '').toLowerCase();
      
      // Error de credenciales incorrectas
      if (errorMsg.includes('credenciales') || 
          errorMsg.includes('incorrecta') || 
          errorMsg.includes('incorrectos') ||
          errorMsg.includes('incorrect') ||
          errorMsg.includes('contraseña') ||
          errorMsg.includes('password') ||
          errorMsg.includes('invalid')) {
        showError(
          'Credenciales incorrectas',
          'El correo o la contraseña que ingresaste son incorrectos.\n\nPor favor verifica tus datos e intenta de nuevo.',
          'lock-closed-outline',
          '#ef4444'
        );
      } 
      // Error de cuenta bloqueada por intentos
      else if (errorMsg.includes('demasiados intentos') || 
               errorMsg.includes('bloqueada') ||
               errorMsg.includes('intenta de nuevo en')) {
        showError(
          'Cuenta temporalmente bloqueada',
          result.error,
          'time-outline',
          '#f59e0b'
        );
      }
      // Error de cuenta no disponible
      else if (errorMsg.includes('cuenta no disponible') || 
               errorMsg.includes('inactiva') ||
               errorMsg.includes('no existe')) {
        showError(
          'Cuenta no disponible',
          'Esta cuenta no existe o está inactiva.\n\nPor favor verifica tus datos o contacta al administrador.',
          'person-remove-outline',
          '#ef4444'
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
      // Error de rol
      else if (errorMsg.includes('rol') || errorMsg.includes('role')) {
        showError(
          'Error de autorización',
          'No se pudo determinar tu rol de usuario.\n\nPor favor contacta al administrador.',
          'shield-outline',
          '#ef4444'
        );
      } 
      // Error genérico
      else {
        showError(
          'Error al iniciar sesión',
          result.error || 'No se pudo iniciar sesión.\n\nPor favor intenta de nuevo más tarde.',
          'alert-circle',
          '#ef4444'
        );
      }
    }
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
        {/* Fondo con formas decorativas */}
        <View style={styles.topBackground}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.circle3} />
        </View>

        {/* Logo y título */}
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <View style={styles.logoCircle}>
              <Ionicons name="restaurant" size={50} color="#059669" />
            </View>
          </View>
          <Text style={styles.logoText}>UFood</Text>
          <Text style={styles.subtitle}>Tu comida, tu estilo</Text>
        </View>

        {/* Tarjeta de login */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.welcomeText}>¡Bienvenido!</Text>
            <Text style={styles.loginText}>Inicia sesión en tu cuenta</Text>
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
                placeholder="Correo electrónico"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                editable={!isLoading}
              />
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
                placeholder="Contraseña"
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
            </View>
          </View>

          {/* Botón de login */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.loginButtonText}> Iniciando...</Text>
              </>
            ) : (
              <>
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>

          {/* Registro */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              disabled={isLoading}
            >
              <Text style={styles.registerLink}>Regístrate aquí</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Decoración inferior */}
        <View style={styles.bottomDecoration}>
          <Ionicons name="leaf" size={20} color="#d1fae5" />
          <Text style={styles.bottomText}>Hecho con cariño para ti</Text>
          <Ionicons name="leaf" size={20} color="#d1fae5" />
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

      {/* MODAL DE BIENVENIDA PERSONALIZADO - NAVEGACIÓN AUTOMÁTICA */}
      <Modal
        visible={welcomeModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeWelcomeModal}
      >
        <View style={styles.welcomeModalOverlay}>
          <View style={styles.welcomeModalContent}>
            <View style={[styles.welcomeModalIcon, { backgroundColor: `${welcomeModal.iconColor}15` }]}>
              <Ionicons name={welcomeModal.icon} size={64} color={welcomeModal.iconColor} />
            </View>
            
            <Text style={styles.welcomeModalTitle}>{welcomeModal.title}</Text>
            <Text style={styles.welcomeModalMessage}>{welcomeModal.message}</Text>
            
            <ActivityIndicator size="large" color={welcomeModal.iconColor} style={styles.welcomeLoader} />
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
    minHeight: height,
  },
  topBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    backgroundColor: '#065f46',
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#059669',
    opacity: 0.3,
    top: -50,
    right: -50,
  },
  circle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#10b981',
    opacity: 0.2,
    top: 100,
    left: -30,
  },
  circle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#34d399',
    opacity: 0.25,
    bottom: 20,
    right: 60,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: height * 0.08,
    marginBottom: 30,
  },
  logoWrapper: {
    marginBottom: 20,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#d1fae5',
    marginTop: 8,
    fontWeight: '500',
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 30,
    padding: 28,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeader: {
    marginBottom: 28,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 8,
    textAlign: 'center',
  },
  loginText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 18,
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
    width: 48,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  eyeButton: {
    width: 48,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#059669',
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
    letterSpacing: 0.5,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  registerText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  registerLink: {
    fontSize: 15,
    color: '#059669',
    fontWeight: 'bold',
  },
  bottomDecoration: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
    gap: 8,
  },
  bottomText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
  },

  // ESTILOS DEL MODAL DE ERROR PERSONALIZADO
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

  // ESTILOS DEL MODAL DE BIENVENIDA
  welcomeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeModalContent: {
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
  welcomeModalIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeModalMessage: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  welcomeLoader: {
    marginTop: 8,
  },
});