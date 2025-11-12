/**
 * Servicio de Autenticación
 */

import CONFIG from '../config/app.config';
import httpService, { HttpError } from './Http.service';
import storageService from './Storage.service';
import User from '../models/User.model';

class AuthService {
  constructor() {
    if (AuthService.instance) {
      return AuthService.instance;
    }
    this.currentUser = null;
    this.sessionCheckInterval = null;
    AuthService.instance = this;
  }

  /**
   * Iniciar sesión con manejo de errores
   */
  async login(email, password) {
    try {
      // Verificar bloqueo por intentos fallidos
      await this._checkLoginLockout();

      // Validar credenciales básicas
      if (!email || !password) {
        throw new Error('Correo y contraseña son obligatorios');
      }

      // La API espera "email"
      const requestBody = {
        email: email.trim().toLowerCase(),
        password: password,
      };

      // Realizar petición de login
      const response = await httpService.post(
        `${CONFIG.API.AUTH_BASE_URL}/login`,
        requestBody
      );

      // Validar respuesta
      if (!response.isSuccess || !response.result) {
        await this._handleFailedLogin();
        throw new Error(response.message || 'Credenciales incorrectas');
      }

      const { user: userData, token } = response.result;

      // Verificar estado del usuario
      if (userData.status === CONFIG.USER_STATUS.INACTIVE) {
        throw new Error('Esta cuenta está inactiva');
      }

      // Crear instancia de usuario
      const user = new User(userData);

      // Guardar sesión
      await this._saveSession(token, user);

      // Limpiar intentos fallidos
      await storageService.removeItem(CONFIG.STORAGE_KEYS.LOGIN_ATTEMPTS);
      await storageService.removeItem(CONFIG.STORAGE_KEYS.LOCKOUT_TIME);

      // Establecer usuario actual
      this.currentUser = user;

      // Iniciar monitoreo de sesión
      this._startSessionMonitoring();

      return {
        success: true,
        user,
        token,
      };
    } catch (error) {
      // Procesar diferentes tipos de errores
      throw this._processLoginError(error);
    }
  }

  /**
   * Procesar errores de login para mensajes claros
   */
  _processLoginError(error) {
    // Si es un HttpError, extraer información detallada
    if (error instanceof HttpError) {
      const status = error.status;
      const data = error.data;

      // Error 401 - Credenciales incorrectas
      if (status === 401) {
        // Registrar intento fallido
        this._handleFailedLogin().catch(() => {});
        
        // Intentar extraer mensaje del servidor
        if (data && typeof data === 'object') {
          if (data.message) {
            return new Error(data.message);
          }
          if (data.error) {
            return new Error(data.error);
          }
          if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
            return new Error(data.errors[0]);
          }
        }
        
        return new Error('Correo o contraseña incorrectos');
      }

      // Error 400 - Bad Request
      if (status === 400) {
        if (data && data.message) {
          return new Error(data.message);
        }
        return new Error('Datos inválidos. Verifica tu correo y contraseña');
      }

      // Error 403 - Forbidden
      if (status === 403) {
        return new Error('Cuenta no disponible');
      }

      // Error 404 - Not Found
      if (status === 404) {
        return new Error('Servicio no disponible');
      }

      // Error 500 - Server Error
      if (status >= 500) {
        return new Error('Error del servidor. Intenta más tarde');
      }

      // Sin conexión
      if (status === 0) {
        return new Error('Sin conexión a internet');
      }

      // Timeout
      if (status === 408) {
        return new Error('Tiempo de espera agotado');
      }
    }

    // Error genérico
    return error;
  }

  /**
   * Registrar nuevo usuario
   */
  async register(userData) {
    try {
      // Validar datos
      const validation = User.validate(userData);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        throw new Error(firstError);
      }

      // Realizar petición de registro
      const response = await httpService.post(`${CONFIG.API.AUTH_BASE_URL}/register`, {
        name: userData.name.trim(),
        email: userData.email.trim().toLowerCase(),
        phoneNumber: userData.phoneNumber.trim(),
        password: userData.password,
        role: CONFIG.ROLES.USER,
      });

      // Validar respuesta
      if (!response.isSuccess) {
        throw new Error(response.message || 'No se pudo crear la cuenta');
      }

      return {
        success: true,
        message: response.message || 'Cuenta creada correctamente',
      };
    } catch (error) {
      console.error('Register error:', error);
      throw this._processRegisterError(error);
    }
  }

  /**
   * Procesar errores de registro
   */
  _processRegisterError(error) {
    if (error instanceof HttpError) {
      const status = error.status;
      const data = error.data;

      // Error 409 - Conflicto (email ya existe)
      if (status === 409) {
        return new Error('Este correo ya está registrado');
      }

      // Error 400 - Datos inválidos
      if (status === 400) {
        if (data && data.message) {
          return new Error(data.message);
        }
        return new Error('Datos inválidos. Verifica la información');
      }

      // Sin conexión
      if (status === 0) {
        return new Error('Sin conexión a internet');
      }
    }

    return error;
  }

  /**
   * Cerrar sesión
   */
  async logout() {
    try {
      // Detener monitoreo de sesión
      this._stopSessionMonitoring();

      // Limpiar almacenamiento
      await storageService.clear();

      // Limpiar usuario actual
      this.currentUser = null;

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Verificar si hay una sesión activa
   */
  async checkSession() {
    try {
      const data = await storageService.multiGet([
        CONFIG.STORAGE_KEYS.USER_TOKEN,
        CONFIG.STORAGE_KEYS.USER_DATA,
        CONFIG.STORAGE_KEYS.LAST_ACTIVITY,
      ]);

      const token = data[CONFIG.STORAGE_KEYS.USER_TOKEN];
      const userData = data[CONFIG.STORAGE_KEYS.USER_DATA];
      const lastActivity = data[CONFIG.STORAGE_KEYS.LAST_ACTIVITY];

      if (!token || !userData || !lastActivity) {
        return { isValid: false };
      }

      // Verificar expiración de sesión
      const now = Date.now();
      const elapsed = now - parseInt(lastActivity, 10);

      if (elapsed > CONFIG.SECURITY.SESSION_TIMEOUT) {
        await this.logout();
        return { 
          isValid: false, 
          reason: 'session_expired' 
        };
      }

      // Actualizar última actividad
      await storageService.setItem(
        CONFIG.STORAGE_KEYS.LAST_ACTIVITY,
        now.toString()
      );

      // Crear instancia de usuario
      const user = User.fromStorage(JSON.stringify(userData));
      this.currentUser = user;

      // Iniciar monitoreo de sesión
      this._startSessionMonitoring();

      return {
        isValid: true,
        user,
        token,
      };
    } catch (error) {
      console.error('Check session error:', error);
      return { isValid: false };
    }
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Guardar sesión
   */
  async _saveSession(token, user) {
    await storageService.multiSet([
      [CONFIG.STORAGE_KEYS.USER_TOKEN, token],
      [CONFIG.STORAGE_KEYS.USER_DATA, user.toStorage()],
      [CONFIG.STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString()],
    ]);
  }

  /**
   * Verificar bloqueo por intentos fallidos
   */
  async _checkLoginLockout() {
    const lockoutTime = await storageService.getItem(CONFIG.STORAGE_KEYS.LOCKOUT_TIME);
    
    if (lockoutTime) {
      const now = Date.now();
      const elapsed = now - parseInt(lockoutTime, 10);
      
      if (elapsed < CONFIG.SECURITY.LOCKOUT_DURATION) {
        const remainingMinutes = Math.ceil(
          (CONFIG.SECURITY.LOCKOUT_DURATION - elapsed) / 60000
        );
        throw new Error(
          `Demasiados intentos fallidos. Intenta de nuevo en ${remainingMinutes} minuto(s)`
        );
      } else {
        // Limpiar bloqueo expirado
        await storageService.removeItem(CONFIG.STORAGE_KEYS.LOCKOUT_TIME);
        await storageService.removeItem(CONFIG.STORAGE_KEYS.LOGIN_ATTEMPTS);
      }
    }
  }

  /**
   * Manejar login fallido
   */
  async _handleFailedLogin() {
    let attempts = await storageService.getItem(CONFIG.STORAGE_KEYS.LOGIN_ATTEMPTS) || 0;
    attempts = parseInt(attempts, 10) + 1;

    await storageService.setItem(CONFIG.STORAGE_KEYS.LOGIN_ATTEMPTS, attempts.toString());

    if (attempts >= CONFIG.SECURITY.MAX_LOGIN_ATTEMPTS) {
      await storageService.setItem(
        CONFIG.STORAGE_KEYS.LOCKOUT_TIME,
        Date.now().toString()
      );
      const lockoutMinutes = CONFIG.SECURITY.LOCKOUT_DURATION / 60000;
      throw new Error(
        `Demasiados intentos fallidos. Cuenta bloqueada por ${lockoutMinutes} minutos`
      );
    }
  }

  /**
   * Iniciar monitoreo de sesión
   */
  _startSessionMonitoring() {
    if (this.sessionCheckInterval) return;

    this.sessionCheckInterval = setInterval(async () => {
      const lastActivity = await storageService.getItem(
        CONFIG.STORAGE_KEYS.LAST_ACTIVITY
      );

      if (!lastActivity) {
        this._stopSessionMonitoring();
        return;
      }

      const now = Date.now();
      const elapsed = now - parseInt(lastActivity, 10);

      if (elapsed > CONFIG.SECURITY.SESSION_TIMEOUT) {
        await this.logout();
      }
    }, 60000);
  }

  /**
   * Detener monitoreo de sesión
   */
  _stopSessionMonitoring() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }
}

// Singleton instance
const authService = new AuthService();

export default authService;