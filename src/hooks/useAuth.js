import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveUserSession = async (token, user) => {
  try {
    if (!token) {
      console.warn("Token inválido");
      return;
    }

    await AsyncStorage.setItem("userToken", token);
    await AsyncStorage.setItem("userData", JSON.stringify(user));
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

// ✅ Función para obtener los datos del usuario
export const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem("userData");
    
    if (!userData) {
      console.warn("No hay datos de usuario guardados");
      return null;
    }

    const user = JSON.parse(userData);
    
    // Normalizar campos - tu API devuelve "id" no "userId"
    return {
      userId: user.id, // ← API devuelve "id"
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      phone: user.phoneNumber,
      roles: user.roles || [],
      status: user.status
    };
  } catch (error) {
    console.error("Error al obtener datos del usuario:", error);
    return null;
  }
};

export const clearUserSession = async () => {
  try {
    await AsyncStorage.removeItem("userToken");
    await AsyncStorage.removeItem("userData");
    await AsyncStorage.removeItem("lastActivity");
    await AsyncStorage.removeItem("userName"); // Limpia también esto
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
};