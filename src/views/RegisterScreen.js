// src/views/RegisterScreen.js
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { registerUser } from "../services/api";

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");



  // Estado para mostrar mensajes de error debajo de cada campo
  const [errors, setErrors] = useState({});

  const validateFields = () => {
    const newErrors = {};
    let isValid = true;

    // 🔹 Validar nombre (solo letras)
    if (!name.trim()) {
      newErrors.name = "El nombre es obligatorio.";
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
      newErrors.phoneNumber = "El teléfono debe tener 10 dígitos.";
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
      role: null,
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>REGISTRO</Text>

      {/* 🔹 Campo nombre */}
      <TextInput
        style={styles.input}
        placeholder="Nombre Completo"
        value={name}
        onChangeText={setName}
      />
      {errors.name && <Text style={styles.error}>{errors.name}</Text>}

      {/* Campo correo */}
      <TextInput
        style={styles.input}
        placeholder="Correo Electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {errors.email && <Text style={styles.error}>{errors.email}</Text>}

      {/*Campo teléfono */}
      <TextInput
        style={styles.input}
        placeholder="Teléfono"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="numeric"
        maxLength={10}
      />
      {errors.phoneNumber && <Text style={styles.error}>{errors.phoneNumber}</Text>}

      {/* Campo contraseña */}
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {errors.password && <Text style={styles.error}>{errors.password}</Text>}

      {/* 🔹 Botón de registro */}
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>CREAR CUENTA</Text>
      </TouchableOpacity>

      {/* 🔹 Enlace a iniciar sesión */}
      <View style={styles.loginLinkContainer}>
        <Text style={styles.loginText}>¿Ya tienes cuenta?</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.loginLink}> Inicia sesión</Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 26,
    fontWeight: "bold",
    color: "#3CB371",
    marginBottom: 25,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#3CB371",
    borderRadius: 8,
    padding: 10,
    marginBottom: 5,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#3CB371",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 15,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loginLinkContainer: {
    flexDirection: "row",
    marginTop: 15,
  },
  loginText: {
    fontSize: 15,
    color: "#333",
  },
  loginLink: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#00b229ed",
  },
  error: {
    color: "red",
    fontSize: 13,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
});
