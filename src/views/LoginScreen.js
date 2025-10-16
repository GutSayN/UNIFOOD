// src/screens/LoginScreen.js
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { loginUser } from "../services/api";

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
        // Guardar token y datos del usuario
        const { token, user } = response.result;

        // Puedes guardarlo con AsyncStorage si quieres persistencia
        // await AsyncStorage.setItem("token", token);

        Alert.alert("Bienvenido", `Hola, ${user.name}!`);
        navigation.replace("Home"); // Redirigir al Home
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },
  input: { width: "100%", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 15 },
  button: { backgroundColor: "#4CAF50", padding: 12, borderRadius: 8, width: "100%", alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 18 },
});
