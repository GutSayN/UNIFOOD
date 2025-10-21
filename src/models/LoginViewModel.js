import { loginUser } from "../services/api";
import { saveUserSession } from "../hooks/useAuth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

export const handleLogin = async (data, navigation) => {
  try {
    if (!data.email || !data.password) {
      Alert.alert("Error", "Ingresa tu correo y contraseña.");
      return;
    }

    // ✅ La API espera userName, no email
    const response = await loginUser({
      userName: data.email,
      password: data.password
    });

    // ✅ La API devuelve: { isSuccess, message, result: { user, token } }
    if (response.isSuccess && response.result && response.result.token) {
      const { token, user } = response.result;
      
      // Guardar token en sesión
      await saveUserSession(token);
      
      // Guardar el nombre del usuario para mostrar en HomeScreen
      await AsyncStorage.setItem("userName", user.name);
      
      Alert.alert("Bienvenido", `¡Hola ${user.name}!`);
      
      // Redirigir a Home
      navigation.replace("Home");
    } else {
      Alert.alert("Error", response.message || "Credenciales inválidas.");
    }
  } catch (error) {
    Alert.alert("Error", "No se pudo iniciar sesión.");
    console.error(error);
  }
};