import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveUserSession = async (token) => {
  try {
    if (!token) {
      console.warn("Token inválido");
      return;
    }

    await AsyncStorage.setItem("userToken", token);
    await AsyncStorage.setItem("lastActivity", Date.now().toString());
  } catch (error) {
    console.error("Error al guardar la sesión:", error);
  }
};

export const getUserSession = async () => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    const lastActivity = await AsyncStorage.getItem("lastActivity");

    if (!token || !lastActivity) return null;

    const now = Date.now();
    const elapsed = now - parseInt(lastActivity, 10);

    // 1 hora = 3600000 ms
    if (elapsed > 3600000) {
      await AsyncStorage.clear();
      return null;
    }

    return token;
  } catch (error) {
    console.error("Error al obtener la sesión:", error);
    return null;
  }
};

export const clearUserSession = async () => {
  try {
    await AsyncStorage.removeItem("userToken");
    await AsyncStorage.removeItem("lastActivity");
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
};