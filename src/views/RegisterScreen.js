// src/views/RegisterScreen.js
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { registerUser } from "../services/api";

const RegisterScreen = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleRegister = async () => {
    if (!name || !email || !password || !phoneNumber) {
      Alert.alert("Error", "Por favor, completa todos los campos.");
      return;
    }

    const newUser = {
      email,
      name,
      phoneNumber,
      password,
      role: null, // campo oculto
    };

    try {
      const result = await registerUser(newUser);
      if (result.isSuccess) {
        Alert.alert("Éxito", "Cuenta creada correctamente.");
        // Aquí podrías navegar al login
      } else {
        Alert.alert("Error", result.message || "No se pudo crear la cuenta.");
      }
    } catch (error) {
      Alert.alert("Error", "Hubo un problema con el registro.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>REGISTRO</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre Completo"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Correo Electrónico"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Teléfono"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>CREAR CUENTA</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>O regístrate con:</Text>
    </View>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3CB371",
    marginBottom: 20,
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
    backgroundColor: "#7FFF00",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  footer: {
    marginTop: 20,
    color: "#333",
  },
});
