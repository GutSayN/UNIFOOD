import AsyncStorage from "@react-native-async-storage/async-storage";

export const checkSession = async (navigation) => {
  const expiration = await AsyncStorage.getItem("session_expiration");
  const token = await AsyncStorage.getItem("token");

  if (!token || !expiration) {
    navigation.replace("Login");
    return;
  }

  const now = Date.now();
  if (now > parseInt(expiration)) {
    await AsyncStorage.clear();
    alert("⏰ Tu sesión ha expirado. Inicia sesión nuevamente.");
    navigation.replace("Login");
  }
};
