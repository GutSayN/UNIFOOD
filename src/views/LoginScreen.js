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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { loginUser } from "../services/api";
import { saveUserSession } from "../hooks/useAuth";

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const handleLogin = async () => {
    if (!userName || !password) {
      Alert.alert("Error", "Por favor ingresa tu correo y contraseña.");
      return;
    }

    try {
      const response = await loginUser({ userName, password });

      if (response.isSuccess) {
        const { user, token } = response.result;

        if (user.status === 2) {
          Alert.alert("Cuenta no disponible", "Esta cuenta no existe o está inactiva.");
          return;
        }

        if (user.status === 1) {
          await saveUserSession(token, user);

          if (user.roles.includes("ADMIN")) {
            Alert.alert("Bienvenido", `Hola, ${user.name}!`);
            navigation.replace("AdminHome");
          } else if (user.roles.includes("USER")) {
            Alert.alert("Bienvenido", `Hola, ${user.name}!`);
            navigation.replace("Home");
          } else {
            Alert.alert("Error", "Rol de usuario no reconocido.");
          }
        }
      } else {
        Alert.alert("Error", response.message || "Credenciales incorrectas");
      }
    } catch (error) {
      Alert.alert("Error", "Ocurrió un problema al iniciar sesión");
      console.error(error);
    }
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
            <Text style={styles.welcomeText}>¡Bienvenido! 👋</Text>
            <Text style={styles.loginText}>Inicia sesión en tu cuenta</Text>
          </View>

          {/* Input de correo */}
          <View style={styles.inputContainer}>
            <View style={[
              styles.inputWrapper,
              focusedInput === 'email' && styles.inputWrapperFocused
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
                placeholder="Correo electrónico"
                placeholderTextColor="#9ca3af"
                value={userName}
                onChangeText={setUserName}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>

          {/* Input de contraseña */}
          <View style={styles.inputContainer}>
            <View style={[
              styles.inputWrapper,
              focusedInput === 'password' && styles.inputWrapperFocused
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
                placeholder="Contraseña"
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
            </View>
          </View>

          {/* Botón de login */}
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>


          {/* Registro */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.registerLink}>Regístrate aquí</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Decoración inferior */}
        <View style={styles.bottomDecoration}>
          <Ionicons name="leaf" size={20} color="#d1fae5" />
          <Text style={styles.bottomText}>Hecho con ❤️ para ti</Text>
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
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 8,
  },
  loginText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
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
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
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
});