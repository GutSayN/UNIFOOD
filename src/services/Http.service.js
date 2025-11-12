/**
 * Servicio HTTP con interceptores y manejo de errores
 * Patrón: Singleton Service con Interceptors
 */

import CONFIG from '../config/app.config';
import storageService from './Storage.service';

class HttpService {
  constructor() {
    if (HttpService.instance) {
      return HttpService.instance;
    }
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    HttpService.instance = this;
  }

  /**
   * Agregar interceptor de request
   */
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Agregar interceptor de response
   */
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Aplicar interceptores de request
   */
  async _applyRequestInterceptors(url, config) {
    let modifiedConfig = { ...config, url }; //  Pasar URL al interceptor
    for (const interceptor of this.requestInterceptors) {
      modifiedConfig = await interceptor(modifiedConfig);
    }
    return modifiedConfig;
  }

  /**
   * Aplicar interceptores de response
   */
  async _applyResponseInterceptors(response) {
    let modifiedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      modifiedResponse = await interceptor(modifiedResponse);
    }
    return modifiedResponse;
  }

  /**
   * Realizar petición HTTP
   */
 /**
 * Realizar petición HTTP
 */
async request(url, options = {}) {
  try {
    // Configuración por defecto
    const defaultConfig = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
      },
      timeout: CONFIG.API.TIMEOUT,
    };

    // Combinar configuración
    let config = {
      ...defaultConfig,
      ...options,
      headers: {
        ...defaultConfig.headers,
        ...options.headers,
      },
    };

    //  Aplicar interceptores de request (con URL)
    config = await this._applyRequestInterceptors(url, config);

    // Crear AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      // Realizar petición
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parsear respuesta
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Crear objeto de respuesta
      let responseObj = {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data,
        ok: response.ok,
      };

      // Aplicar interceptores de response
      responseObj = await this._applyResponseInterceptors(responseObj);

      // Manejar errores HTTP
      if (!response.ok) {
        throw new HttpError(
          `HTTP Error: ${response.status}`,
          response.status,
          data
        );
      }

      return responseObj.data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new HttpError('Tiempo de espera agotado', 408);
      }
      throw error;
    }
  } catch (error) {
    // No mostrar en consola, solo manejar el error
    throw this._handleError(error);
  }
}

  /**
   * GET request
   */
  async get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }

  /**
   * POST con FormData
   */
  async postFormData(url, formData, options = {}) {
    const headers = { ...options.headers };
    delete headers['Content-Type']; // Dejar que el browser lo establezca

    return this.request(url, {
      ...options,
      method: 'POST',
      body: formData,
      headers,
    });
  }

  /**
   * PUT con FormData
   */
  async putFormData(url, formData, options = {}) {
    const headers = { ...options.headers };
    delete headers['Content-Type'];

    return this.request(url, {
      ...options,
      method: 'PUT',
      body: formData,
      headers,
    });
  }

  /**
   * Manejar errores
   */
  _handleError(error) {
    if (error instanceof HttpError) {
      return error;
    }

    if (error.message === 'Network request failed') {
      return new HttpError('Sin conexión a internet', 0);
    }

    if (error.message.includes('timeout')) {
      return new HttpError('Tiempo de espera agotado', 408);
    }

    return new HttpError(error.message || 'Error desconocido', 500);
  }
}

/**
 * Clase de error HTTP personalizada
 */
class HttpError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

const httpService = new HttpService();

//  Interceptor de autenticación CORREGIDO
httpService.addRequestInterceptor(async (config) => {
  const url = config.url || '';
  
  //  NO agregar token en rutas de autenticación
  const isAuthRoute = url.includes('/login') || url.includes('/register');
  
  if (!isAuthRoute) {
    const token = await storageService.getItem(CONFIG.STORAGE_KEYS.USER_TOKEN);
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }
  }
  
  return config;
});

// Interceptor de respuesta (actualizar actividad)
httpService.addResponseInterceptor(async (response) => {
  if (response.ok) {
    await storageService.setItem(
      CONFIG.STORAGE_KEYS.LAST_ACTIVITY,
      Date.now().toString()
    );
  }
  return response;
});

export default httpService;
export { HttpError };