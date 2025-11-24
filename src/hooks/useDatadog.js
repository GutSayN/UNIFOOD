/**
 * useDatadog Hook - Hook personalizado para facilitar el uso de Datadog
 * 
 * USO:
 * const { trackEvent, trackError, trackSearch } = useDatadog();
 */

import { useCallback, useEffect } from 'react';
import datadogService from '../services/Datadog.service';

export const useDatadog = (screenName = null) => {
  // Si se proporciona un screenName, trackear cuando el componente se monta
  useEffect(() => {
    if (screenName) {
      datadogService.trackScreenView(screenName);
    }
  }, [screenName]);

  // Wrapper para trackEvent
  const trackEvent = useCallback((eventName, properties = {}) => {
    return datadogService.trackEvent(eventName, properties);
  }, []);

  // Wrapper para trackError
  const trackError = useCallback((error, context = {}) => {
    return datadogService.trackError(error, context);
  }, []);

  // Wrapper para trackSearch
  const trackSearch = useCallback((query, resultsCount) => {
    return datadogService.trackSearch(query, resultsCount);
  }, []);

  // Wrapper para trackVote
  const trackVote = useCallback((productId, isLike, productName = '') => {
    return datadogService.trackVote(productId, isLike, productName);
  }, []);

  // Wrapper para trackWhatsAppContact
  const trackWhatsAppContact = useCallback((productId, productName, sellerPhone) => {
    return datadogService.trackWhatsAppContact(productId, productName, sellerPhone);
  }, []);

  // Wrapper para trackRefresh
  const trackRefresh = useCallback((refreshType) => {
    return datadogService.trackRefresh(refreshType);
  }, []);

  // Wrapper para trackProductInteraction
  const trackProductInteraction = useCallback((action, productId, productName) => {
    return datadogService.trackProductInteraction(action, productId, productName);
  }, []);

  // Wrapper para trackPerformance
  const trackPerformance = useCallback((operationName, durationMs, metadata = {}) => {
    return datadogService.trackPerformance(operationName, durationMs, metadata);
  }, []);

  // Helper para medir tiempo de operaciones
  const measurePerformance = useCallback((operationName, metadata = {}) => {
    const startTime = Date.now();
    
    return () => {
      const durationMs = Date.now() - startTime;
      datadogService.trackPerformance(operationName, durationMs, metadata);
    };
  }, []);

  // Helper para trackear errores en try-catch
  const withErrorTracking = useCallback(async (fn, errorContext = {}) => {
    try {
      return await fn();
    } catch (error) {
      await trackError(error, errorContext);
      throw error; // Re-throw para que el error siga propagándose
    }
  }, [trackError]);

  return {
    trackEvent,
    trackError,
    trackSearch,
    trackVote,
    trackWhatsAppContact,
    trackRefresh,
    trackProductInteraction,
    trackPerformance,
    measurePerformance,
    withErrorTracking,
  };
};

export default useDatadog;