/**
 * Servicio de Almacenamiento Seguro
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import CONFIG from '../config/app.config';

class StorageService {
  constructor() {
    if (StorageService.instance) {
      return StorageService.instance;
    }
    StorageService.instance = this;
  }

  /**
   * Encriptación simple con base64
   */
  _encrypt(data) {
    try {
      //  Usar btoa en lugar de Buffer
      return btoa(unescape(encodeURIComponent(data)));
    } catch (error) {
      console.error('Error en encriptación:', error);
      return data; // Devolver sin encriptar si falla
    }
  }

  /**
   * Desencriptación simple
   */
  _decrypt(data) {
    try {
      // Usar atob en lugar de Buffer
      return decodeURIComponent(escape(atob(data)));
    } catch (error) {
      console.error('Error en desencriptación:', error);
      return data; // Devolver tal cual si falla
    }
  }

  /**
   * Guardar dato de forma segura
   */
  async setItem(key, value) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      const encryptedValue = this._encrypt(stringValue);
      await AsyncStorage.setItem(key, encryptedValue);
    } catch (error) {
      console.error(`Error guardando ${key}:`, error);
      throw new Error(`No se pudo guardar ${key}`);
    }
  }

  /**
   * Obtener dato de forma segura
   */
  async getItem(key) {
    try {
      const encryptedValue = await AsyncStorage.getItem(key);
      if (!encryptedValue) return null;
      
      const decryptedValue = this._decrypt(encryptedValue);
      
      // Intentar parsear si es JSON
      try {
        return JSON.parse(decryptedValue);
      } catch {
        return decryptedValue;
      }
    } catch (error) {
      console.error(`Error obteniendo ${key}:`, error);
      return null;
    }
  }

  /**
   * Eliminar dato
   */
  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error eliminando ${key}:`, error);
      throw new Error(`No se pudo eliminar ${key}`);
    }
  }

  /**
   * Limpiar todos los datos
   */
  async clear() {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error limpiando storage:', error);
      throw new Error('No se pudo limpiar el almacenamiento');
    }
  }

  /**
   * Guardar múltiples items
   */
  async multiSet(items) {
    try {
      const encryptedItems = items.map(([key, value]) => {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        return [key, this._encrypt(stringValue)];
      });
      await AsyncStorage.multiSet(encryptedItems);
    } catch (error) {
      console.error('Error en multiSet:', error);
      throw new Error('No se pudieron guardar los datos');
    }
  }

  /**
   * Obtener múltiples items
   */
  async multiGet(keys) {
    try {
      const encryptedItems = await AsyncStorage.multiGet(keys);
      const result = {};
      
      encryptedItems.forEach(([key, encryptedValue]) => {
        if (encryptedValue) {
          const decryptedValue = this._decrypt(encryptedValue);
          try {
            result[key] = JSON.parse(decryptedValue);
          } catch {
            result[key] = decryptedValue;
          }
        } else {
          result[key] = null;
        }
      });
      
      return result;
    } catch (error) {
      console.error('Error en multiGet:', error);
      return {};
    }
  }

  /**
   * Verificar si existe una key
   */
  async hasItem(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch (error) {
      console.error(`Error verificando ${key}:`, error);
      return false;
    }
  }

  /**
   * Obtener todas las keys
   */
  async getAllKeys() {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error obteniendo keys:', error);
      return [];
    }
  }
}

// Singleton instance
const storageService = new StorageService();

export default storageService;