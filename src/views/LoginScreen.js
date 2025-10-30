// src/screens/LoginScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { loginUser } from "../services/api";
import { saveUserSession } from "../hooks/useAuth";

export default function LoginScreen({ navigation }) {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!userName || !password) {
      Alert.alert("Error", "Por favor ingresa tu correo y contraseña.");
      return;
    }

    try {
      const response = await loginUser({ userName, password });

      if (response.isSuccess) {
        const { user, token } = response.result;

        // ✅ Validar estatus
        if (user.status === 2) {
          Alert.alert("Cuenta no disponible", "Esta cuenta no existe o está inactiva.");
          return;
        }

        if (user.status === 1) {
          // ✅ Guardar sesión con token y datos de usuario
          await saveUserSession(token, user);

          // ✅ Redirigir según rol
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
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={userName}
        onChangeText={setUserName}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Ingresar</Text>
      </TouchableOpacity>

      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>¿No tienes cuenta?</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.registerLink}> Regístrate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#3CB371",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#3CB371",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#3CB371",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  registerContainer: {
    flexDirection: "row",
    marginTop: 15,
  },
  registerText: {
    fontSize: 16,
    color: "#333",
  },
  registerLink: {
    fontSize: 16,
    color: "#00b229ed",
    fontWeight: "bold",
  },
});