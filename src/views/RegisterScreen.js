// src/views/RegisterScreen.js
import React, { useState } from "react";
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
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { registerUser } from "../services/api";

const { width, height } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [errors, setErrors] = useState({});
  const [acceptedTerms, setAcceptedTerms] = useState(false); // 🆕 Estado para términos

  const validateFields = () => {
    const newErrors = {};
    let isValid = true;

    // 🔹 Validar nombre completo (solo letras y MÍNIMO 30 caracteres)
    if (!name.trim()) {
      newErrors.name = "El nombre completo es obligatorio.";
      isValid = false;
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(name)) {
      newErrors.name = "El nombre solo puede contener letras.";
      isValid = false;
    }

    // 🔹 Validar correo electrónico
    if (!email.trim()) {
      newErrors.email = "El correo es obligatorio.";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Correo electrónico no válido.";
      isValid = false;
    }

    // 🔹 Validar teléfono (exactamente 10 dígitos)
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = "El teléfono es obligatorio.";
      isValid = false;
    } else if (!/^\d{10}$/.test(phoneNumber)) {
      newErrors.phoneNumber = "El teléfono debe tener exactamente 10 dígitos.";
      isValid = false;
    }

    // 🔹 Validar contraseña (mínimo 8 caracteres, al menos una mayúscula)
    if (!password.trim()) {
      newErrors.password = "La contraseña es obligatoria.";
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = "Debe tener al menos 8 caracteres.";
      isValid = false;
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = "Debe incluir al menos una letra mayúscula.";
      isValid = false;
    }

    // 🆕 Validar términos y condiciones
    if (!acceptedTerms) {
      newErrors.terms = "Debes aceptar los términos y condiciones.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateFields()) return;

    const newUser = {
      email,
      name,
      phoneNumber,
      password,
      role: "USER",
    };

    try {
      const result = await registerUser(newUser);
      if (result.isSuccess) {
        Alert.alert("Éxito", "Cuenta creada correctamente.");
        navigation.replace("Login");
      } else {
        Alert.alert("Error", result.message || "No se pudo crear la cuenta.");
      }
    } catch (error) {
      Alert.alert("Error", "Hubo un problema con el registro.");
    }
  };

  // 🆕 Función para abrir términos y condiciones
  const openTerms = async () => {
    const url = "https://gutsayn.github.io/ufood-legal/legal/terms.html";
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "No se puede abrir el enlace");
      }
    } catch (error) {
      Alert.alert("Error", "Ocurrió un problema al abrir los términos");
    }
  };

  // Validación visual en tiempo real para mostrar checkmarks
  const getFieldStatus = (field) => {
    if (field === 'name' && name.length > 0) {
      return name.trim().length < 40 && /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(name);
    }
    if (field === 'email' && email.length > 0) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    if (field === 'phone' && phoneNumber.length > 0) {
      return /^\d{10}$/.test(phoneNumber);
    }
    if (field === 'password' && password.length > 0) {
      return password.length >= 8 && /[A-Z]/.test(password);
    }
    return null;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Fondo decorativo con círculos animados */}
        <View style={styles.topBackground}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.circle3} />
        </View>

        {/* Header con botón de regreso */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate("Login")}
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
            <Text style={styles.welcomeText}>¡Únete! 🎉</Text>
            <Text style={styles.registerText}>Completa tus datos para comenzar</Text>
          </View>

          {/* Input de nombre completo con validación de 30 caracteres */}
          <View style={styles.inputContainer}>
            <View style={[
              styles.inputWrapper,
              focusedInput === 'name' && styles.inputWrapperFocused,
              errors.name && styles.inputWrapperError
            ]}>
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
              />
              {getFieldStatus('name') !== null && (
                <View style={styles.statusIcon}>
                  <Ionicons 
                    name={getFieldStatus('name') ? "checkmark-circle" : "alert-circle"} 
                    size={20} 
                    color={getFieldStatus('name') ? '#10b981' : '#f59e0b'} 
                  />
                </View>
              )}
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            {/* Contador de caracteres en tiempo real */}
            {name.length > 0 && (
              <Text style={[
                styles.charCounter,
                name.trim().length <= 30 ? styles.charCounterSuccess : styles.charCounterWarning
              ]}>
                {name.trim().length}/30 caracteres {name.trim().length >= 30 ? '✓' : ''}
              </Text>
            )}
          </View>

          {/* Input de correo */}
          <View style={styles.inputContainer}>
            <View style={[
              styles.inputWrapper,
              focusedInput === 'email' && styles.inputWrapperFocused,
              errors.email && styles.inputWrapperError
            ]}>
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
              />
              {getFieldStatus('email') !== null && (
                <View style={styles.statusIcon}>
                  <Ionicons 
                    name={getFieldStatus('email') ? "checkmark-circle" : "alert-circle"} 
                    size={20} 
                    color={getFieldStatus('email') ? '#10b981' : '#f59e0b'} 
                  />
                </View>
              )}
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Input de teléfono */}
          <View style={styles.inputContainer}>
            <View style={[
              styles.inputWrapper,
              focusedInput === 'phone' && styles.inputWrapperFocused,
              errors.phoneNumber && styles.inputWrapperError
            ]}>
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
              />
              {getFieldStatus('phone') !== null && (
                <View style={styles.statusIcon}>
                  <Ionicons 
                    name={getFieldStatus('phone') ? "checkmark-circle" : "alert-circle"} 
                    size={20} 
                    color={getFieldStatus('phone') ? '#10b981' : '#f59e0b'} 
                  />
                </View>
              )}
            </View>
            {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
          </View>

          {/* Input de contraseña */}
          <View style={styles.inputContainer}>
            <View style={[
              styles.inputWrapper,
              focusedInput === 'password' && styles.inputWrapperFocused,
              errors.password && styles.inputWrapperError
            ]}>
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
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={22} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
              {getFieldStatus('password') !== null && (
                <View style={styles.statusIcon}>
                  <Ionicons 
                    name={getFieldStatus('password') ? "checkmark-circle" : "alert-circle"} 
                    size={20} 
                    color={getFieldStatus('password') ? '#10b981' : '#f59e0b'} 
                  />
                </View>
              )}
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* Indicadores de requisitos de contraseña */}
          <View style={styles.passwordRequirements}>
            <View style={styles.requirementItem}>
              <Text style={[
                styles.requirementDot,
                password.length >= 8 && styles.requirementDotActive
              ]}>●</Text>
              <Text style={[
                styles.requirementText,
                password.length >= 8 && styles.requirementTextActive
              ]}>Mínimo 8 caracteres</Text>
            </View>
            <View style={styles.requirementItem}>
              <Text style={[
                styles.requirementDot,
                /[A-Z]/.test(password) && styles.requirementDotActive
              ]}>●</Text>
              <Text style={[
                styles.requirementText,
                /[A-Z]/.test(password) && styles.requirementTextActive
              ]}>Una letra mayúscula</Text>
            </View>
          </View>

          {/* 🆕 Checkbox de Términos y Condiciones */}
          <View style={styles.termsContainer}>
            <TouchableOpacity 
              style={[
                styles.checkbox,
                acceptedTerms && styles.checkboxChecked,
                errors.terms && styles.checkboxError
              ]}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              activeOpacity={0.7}
            >
              {acceptedTerms && (
                <Ionicons name="checkmark" size={18} color="white" />
              )}
            </TouchableOpacity>
            <View style={styles.termsTextContainer}>
              <Text style={styles.termsText}>
                Acepto los{' '}
                <Text 
                  style={styles.termsLink}
                  onPress={openTerms}
                >
                  Términos y Condiciones
                </Text>
              </Text>
            </View>
          </View>
          {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}

          {/* Botón de registro */}
          <TouchableOpacity 
            style={[
              styles.registerButton,
              !acceptedTerms && styles.registerButtonDisabled
            ]} 
            onPress={handleRegister}
            activeOpacity={0.8}
            disabled={!acceptedTerms}
          >
            <Text style={styles.registerButtonText}>Crear Cuenta</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
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
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Decoración inferior */}
        <View style={styles.bottomDecoration}>
          <Ionicons name="leaf" size={20} color="#d1fae5" />
          <Text style={styles.bottomText}>Únete a la familia UNIFOOD</Text>
          <Ionicons name="leaf" size={20} color="#d1fae5" />
        </View>
      </ScrollView>
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
    marginBottom: 6,
  },
  registerText: {
    fontSize: 14,
    color: '#6b7280',
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
  inputWrapperError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
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
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
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
  // 🆕 Estilos para Términos y Condiciones
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
  checkboxError: {
    borderColor: '#ef4444',
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
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
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
});