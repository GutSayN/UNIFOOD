import AsyncStorage from "@react-native-async-storage/async-storage";

export const clearAllStorage = async () => {
  try {
    await AsyncStorage.clear();
    console.log("✅ AsyncStorage limpiado completamente");
  } catch (error) {
    console.error("Error al limpiar:", error);
  }
};