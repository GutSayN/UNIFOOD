/**
 * HTTP Interceptor - Interceptor de Axios para Datadog
 * Automáticamente rastrea todas las llamadas HTTP a tus microservicios
 * 
 * INSTALACIÓN:
 * Importa este archivo en tu Http.service.js o donde configures axios
 */

import axios from 'axios';
import datadogService from './Datadog.service';

/**
 * Configurar interceptores de Axios para Datadog
 */
export const setupHttpInterceptors = (axiosInstance = axios) => {
  // Interceptor de Request - Agregar timestamp de inicio
  axiosInstance.interceptors.request.use(
    (config) => {
      // Agregar timestamp de inicio a la config
      config.metadata = { startTime: Date.now() };
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Interceptor de Response - Trackear la llamada
  axiosInstance.interceptors.response.use(
    (response) => {
      // Calcular duración
      const endTime = Date.now();
      const startTime = response.config.metadata?.startTime || endTime;
      const durationMs = endTime - startTime;

      // Trackear la llamada exitosa
      datadogService.trackHttpRequest(
        response.config.method?.toUpperCase() || 'GET',
        response.config.url || '',
        response.status,
        durationMs,
        null
      );

      return response;
    },
    (error) => {
      // Calcular duración
      const endTime = Date.now();
      const startTime = error.config?.metadata?.startTime || endTime;
      const durationMs = endTime - startTime;

      // Trackear el error
      datadogService.trackHttpRequest(
        error.config?.method?.toUpperCase() || 'GET',
        error.config?.url || '',
        error.response?.status || 0,
        durationMs,
        error
      );

      return Promise.reject(error);
    }
  );

  console.log('✅ HTTP Interceptors configurados para Datadog');
};

export default setupHttpInterceptors;