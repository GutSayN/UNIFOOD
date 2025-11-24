/**
 * Datadog Service - Monitoreo y Analytics
 * Compatible con Expo Go - Sin SDK nativo
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

class DatadogService {
  constructor() {
    // 🔑 CONFIGURACIÓN
    this.config = {
      clientToken: 'pub387707a30bf56a50f7cb3ae0fe470ed8',
      applicationId: '727e684d-de0a-40a3-8a71-ecf07a93a1f1',
      site: 'us5.datadoghq.com',
      env: 'development',
      version: '1.0.0',
      serviceName: 'ufood-mobile',
    };
    
    // Endpoints corregidos para US5
    this.endpoints = {
      logs: 'https://http-intake.logs.us5.datadoghq.com/api/v2/logs',
      rum: 'https://rum.browser-intake-us5-datadoghq.com/api/v2/rum',
    };

    // Estado interno
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.currentScreen = null;
    this.screenStartTime = null;
    this.isInitialized = false;
    this.eventQueue = [];
    this.isFlushingQueue = false;

    // Buffer para evitar spam
    this.lastEvents = new Map();
    this.DEBOUNCE_TIME = 1000;
  }

  async initialize(userId = null) {
    if (this.isInitialized) return;

    try {
      this.userId = userId;
      this.isInitialized = true;

      const savedSessionId = await AsyncStorage.getItem('datadog_session_id');
      if (savedSessionId) {
        this.sessionId = savedSessionId;
      } else {
        await AsyncStorage.setItem('datadog_session_id', this.sessionId);
      }

      await this.trackEvent('app_started', {
        platform: Platform.OS,
        version: this.config.version,
      });

      console.log('✅ Datadog inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando Datadog:', error);
    }
  }

  setUserId(userId) {
    this.userId = userId;
    this.trackEvent('user_logged_in', { userId });
  }

  clearUserId() {
    this.trackEvent('user_logged_out', { userId: this.userId });
    this.userId = null;
  }

  async trackScreenView(screenName, params = {}) {
    try {
      if (this.currentScreen && this.screenStartTime) {
        const timeSpent = Date.now() - this.screenStartTime;
        await this.trackEvent('screen_duration', {
          screen: this.currentScreen,
          duration_ms: timeSpent,
          duration_seconds: Math.round(timeSpent / 1000),
        });
      }

      this.currentScreen = screenName;
      this.screenStartTime = Date.now();

      await this.trackEvent('screen_view', {
        screen: screenName,
        params,
      });

      console.log(`📱 [Datadog] Screen: ${screenName}`);
    } catch (error) {
      console.error('Error tracking screen:', error);
    }
  }

  async trackEvent(eventName, properties = {}) {
    if (!this.isInitialized) {
      console.warn('Datadog no inicializado');
      return;
    }

    const eventKey = `${eventName}_${JSON.stringify(properties)}`;
    const lastTime = this.lastEvents.get(eventKey);
    const now = Date.now();

    if (lastTime && now - lastTime < this.DEBOUNCE_TIME) {
      return;
    }

    this.lastEvents.set(eventKey, now);

   const event = {
  event: eventName,  // Este se queda aquí
  timestamp: new Date().toISOString(),
  userId: this.userId,
  sessionId: this.sessionId,
  screen: this.currentScreen,
  platform: Platform.OS,
  env: this.config.env,
  ...properties,  // Las propiedades van al mismo nivel
};

    this.eventQueue.push(event);

    if (this.eventQueue.length >= 10) {
      await this.flushEvents();
    }

    console.log(`📊 [Datadog Event] ${eventName}`, properties);
  }

  async trackError(error, context = {}) {
    try {
      const errorData = {
        message: error.message || 'Unknown error',
        stack: error.stack || '',
        name: error.name || 'Error',
        context: {
          ...context,
          screen: this.currentScreen,
          userId: this.userId,
          sessionId: this.sessionId,
        },
      };

      await this.sendLog({
        level: 'error',
        message: errorData.message,
        error: errorData,
        ddtags: `env:${this.config.env},service:${this.config.serviceName}`,
      });

      console.error('🔴 [Datadog Error]', error);
    } catch (err) {
      console.error('Error enviando error a Datadog:', err);
    }
  }

  async trackPerformance(operationName, durationMs, metadata = {}) {
    await this.trackEvent('performance_metric', {
      operation: operationName,
      duration_ms: durationMs,
      duration_seconds: Math.round(durationMs / 1000),
      ...metadata,
    });
  }

  async trackHttpRequest(method, url, statusCode, durationMs, error = null) {
    const isSuccess = statusCode >= 200 && statusCode < 300;

    await this.trackEvent('http_request', {
      method,
      url,
      statusCode,
      duration_ms: durationMs,
      success: isSuccess,
      error: error?.message || null,
    });

    if (error) {
      await this.trackError(error, {
        type: 'http_error',
        method,
        url,
        statusCode,
      });
    }
  }

  async trackSearch(query, resultsCount) {
    await this.trackEvent('search_performed', {
      query,
      results_count: resultsCount,
      has_results: resultsCount > 0,
    });
  }

  async trackVote(productId, isLike, productName) {
    await this.trackEvent('product_voted', {
      product_id: productId,
      product_name: productName,
      vote_type: isLike ? 'like' : 'dislike',
    });
  }

  async trackWhatsAppContact(productId, productName, sellerPhone) {
    await this.trackEvent('whatsapp_contact_initiated', {
      product_id: productId,
      product_name: productName,
      seller_phone: sellerPhone,
    });
  }

  async trackRefresh(refreshType) {
    await this.trackEvent('products_refreshed', {
      refresh_type: refreshType,
    });
  }

  async trackProductInteraction(action, productId, productName) {
    await this.trackEvent('product_interaction', {
      action,
      product_id: productId,
      product_name: productName,
    });
  }

  async sendLog(logData) {
  try {
    const payload = [{
      ddsource: 'react-native',
      ddtags: `env:${this.config.env},service:${this.config.serviceName},version:${this.config.version}`,
      hostname: Platform.OS,
      service: this.config.serviceName,
      status: logData.level || 'info',
      message: logData.message || 'Event',
      ...logData,
    }];

    const response = await fetch(this.endpoints.logs, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': this.config.clientToken,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Error response from Datadog:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Error enviando log a Datadog:', error);
  }
}

  async flushEvents() {
    if (this.isFlushingQueue || this.eventQueue.length === 0) return;

    this.isFlushingQueue = true;

    try {
      const eventsToSend = [...this.eventQueue];
      this.eventQueue = [];

      await this.sendLog({
        level: 'info',
        message: 'Batch events',
        events: eventsToSend,
        event_count: eventsToSend.length,
      });

      console.log(`📤 [Datadog] Enviados ${eventsToSend.length} eventos`);
    } catch (error) {
      console.error('Error flushing events:', error);
    } finally {
      this.isFlushingQueue = false;
    }
  }

  generateSessionId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async cleanup() {
    if (this.currentScreen && this.screenStartTime) {
      const timeSpent = Date.now() - this.screenStartTime;
      await this.trackEvent('screen_duration', {
        screen: this.currentScreen,
        duration_ms: timeSpent,
      });
    }

    await this.flushEvents();
    await this.trackEvent('app_closed');
  }
}

const datadogService = new DatadogService();

export const initializeDatadog = (userId) => datadogService.initialize(userId);
export const trackScreen = (screenName, params) => datadogService.trackScreenView(screenName, params);
export const trackEvent = (eventName, properties) => datadogService.trackEvent(eventName, properties);
export const trackError = (error, context) => datadogService.trackError(error, context);
export const trackSearch = (query, resultsCount) => datadogService.trackSearch(query, resultsCount);
export const trackVote = (productId, isLike, productName) => datadogService.trackVote(productId, isLike, productName);
export const trackWhatsAppContact = (productId, productName, sellerPhone) => datadogService.trackWhatsAppContact(productId, productName, sellerPhone);
export const trackRefresh = (refreshType) => datadogService.trackRefresh(refreshType);
export const trackProductInteraction = (action, productId, productName) => datadogService.trackProductInteraction(action, productId, productName);
export const trackPerformance = (operationName, durationMs, metadata) => datadogService.trackPerformance(operationName, durationMs, metadata);
export const trackHttpRequest = (method, url, statusCode, durationMs, error) => datadogService.trackHttpRequest(method, url, statusCode, durationMs, error);
export const setUserId = (userId) => datadogService.setUserId(userId);
export const clearUserId = () => datadogService.clearUserId();

export default datadogService;