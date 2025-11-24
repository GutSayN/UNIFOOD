/**
 * Navigation Tracker - Wrapper para rastrear navegación automáticamente
 * Este componente envuelve el NavigationContainer y automáticamente
 * rastrea cada cambio de pantalla en Datadog
 */

import React, { useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import datadogService from '../services/Datadog.service';

export default function NavigationTracker({ children, ...props }) {
  const navigationRef = useRef();
  const routeNameRef = useRef();

  useEffect(() => {
    // Inicializar Datadog cuando el componente se monta
    datadogService.initialize();

    // Cleanup cuando la app se cierra
    return () => {
      datadogService.cleanup();
    };
  }, []);

  const onReady = () => {
    // Guardar la ruta inicial
    routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
    
    // Track la pantalla inicial
    if (routeNameRef.current) {
      datadogService.trackScreenView(routeNameRef.current);
    }

    // Llamar onReady del padre si existe
    if (props.onReady) {
      props.onReady();
    }
  };

  const onStateChange = async () => {
    const previousRouteName = routeNameRef.current;
    const currentRoute = navigationRef.current?.getCurrentRoute();
    const currentRouteName = currentRoute?.name;

    if (previousRouteName !== currentRouteName) {
      // Track el cambio de pantalla
      await datadogService.trackScreenView(currentRouteName, currentRoute?.params);
      
      // Guardar la ruta actual para la próxima vez
      routeNameRef.current = currentRouteName;

      console.log(`🔄 Navegación: ${previousRouteName} → ${currentRouteName}`);
    }
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={onReady}
      onStateChange={onStateChange}
      {...props}
    >
      {children}
    </NavigationContainer>
  );
}