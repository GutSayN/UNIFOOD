import { registerUser } from "../services/api";
import { Alert } from "react-native";

export const handleRegister = async (data) => {
  try {
    if (!data.name || !data.email || !data.password) {
      Alert.alert("Error", "Todos los campos son obligatorios.");
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(data.email)) {
      Alert.alert("Error", "El correo no es válido.");
      return;
    }

    const response = await registerUser(data);

    if (response.error) {
      Alert.alert("Error", response.message || "El correo ya está registrado.");
    } else {
      Alert.alert("Éxito", "Cuenta creada correctamente.");
      return true;
    }
  } catch (error) {
    Alert.alert("Error", "Hubo un problema al registrar el usuario.");
    console.error(error);
  }
};
