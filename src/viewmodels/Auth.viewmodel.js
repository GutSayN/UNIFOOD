/**
 * ViewModel de Autenticación
 */

import { useState, useCallback, useEffect } from 'react';
import authService from '../services/Auth.service';
import User from '../models/User.model';

export const useAuthViewModel = () => {
  // Estado
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Esto asegura que el usuario esté disponible en todas las pantallas
   */
  useEffect(() => {
    const initUser = async () => {
      try {
        const result = await authService.checkSession();
        if (result.isValid && result.user) {
          setUser(result.user);
        }
      } catch (error) {
        // Error silencioso
      } finally {
        setIsInitialized(true);
      }
    };

    initUser();
  }, []);

  /**
   * Iniciar sesión
   */
  const login = useCallback(async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await authService.login(email, password);

      setUser(result.user);
      
      return {
        success: true,
        user: result.user,
        isAdmin: result.user.isAdmin,
      };
    } catch (err) {
      const errorMessage = err.message || 'Error al iniciar sesión';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Registrar usuario
   */
  const register = useCallback(async (userData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Validar datos antes de enviar
      const validation = User.validate(userData);
      if (!validation.isValid) {
        const errors = Object.values(validation.errors);
        throw new Error(errors[0]);
      }

      const result = await authService.register(userData);

      return {
        success: true,
        message: result.message,
      };
    } catch (err) {
      const errorMessage = err.message || 'Error al registrar usuario';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Cerrar sesión
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await authService.logout();
      setUser(null);

      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Error al cerrar sesión';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Verificar y recargar sesión
   */
  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await authService.checkSession();

      if (result.isValid && result.user) {
        setUser(result.user);
      } else {
        setUser(null);
      }

      return result;
    } catch (err) {
      setError(err.message);
      setUser(null);
      return { isValid: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Recargar usuario manualmente
   */
  const reloadUser = useCallback(async () => {
    const result = await checkSession();
    return result.isValid;
  }, [checkSession]);

  /**
   * Obtener usuario actual
   */
  const getCurrentUser = useCallback(() => {
    const serviceUser = authService.getCurrentUser();
    const currentUser = serviceUser || user;
    
    return currentUser;
  }, [user]);

  /**
   * Limpiar errores
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Validar campos en tiempo real
   */
  const validateField = useCallback((field, value) => {
    const tempData = { [field]: value };
    const validation = User.validate(tempData);
    
    return {
      isValid: !validation.errors[field],
      error: validation.errors[field] || null,
    };
  }, []);

  return {
    // Estado
    isLoading,
    user,
    error,
    isAuthenticated: !!user,
    isInitialized, 

    // Métodos
    login,
    register,
    logout,
    checkSession,
    reloadUser, 
    getCurrentUser,
    clearError,
    validateField,
  };
};

export default useAuthViewModel;