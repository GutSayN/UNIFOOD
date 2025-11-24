/**
 * Navegador Principal de la Aplicación
 * CON DATADOG INTEGRADO ✅
 */

import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Importar NavigationTracker en lugar de NavigationContainer
import NavigationTracker from './NavigationTracker';

// Importar servicio de autenticación
import authService from '../services/Auth.service';

// Importar Datadog
import datadogService from '../services/Datadog.service';

// Importar pantallas
import LoginScreen from '../views/LoginScreen';
import RegisterScreen from '../views/RegisterScreen';
import HomeScreen from '../views/HomeScreen';
import AdminHomeScreen from '../views/AdminHomeScreen';
import ProductsListScreen from '../views/ProductsListScreen';
import ProductFormScreen from '../views/ProductFormScreen';
import ProfileScreen from "../views/ProfileScreen";

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  /**
   * Verificar si hay una sesión activa al iniciar la app
   */
  const checkSession = async () => {
    try {
      // Usa authService
      const session = await authService.checkSession();

      if (session.isValid && session.user) {
        // Inicializar Datadog con el userId
        await datadogService.initialize(session.user.id);
        datadogService.setUserId(session.user.id);

        // Si hay sesión válida, ir a la pantalla correspondiente según el rol
        if (session.user.isAdmin) {
          setInitialRoute('AdminHome');
        } else {
          setInitialRoute('Home');
        }
      } else {
        // Si no hay sesión, inicializar Datadog sin userId
        await datadogService.initialize();
        setInitialRoute('Login');
      }
    } catch (error) {
      console.error('Error checking session:', error);
      
      // Trackear el error en Datadog
      datadogService.trackError(error, {
        context: 'checkSession',
        location: 'AppNavigator',
      });
      
      await datadogService.initialize();
      setInitialRoute('Login');
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar loading mientras se verifica la sesión
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  // Si aún no hay ruta inicial (no debería pasar), mostrar loading
  if (!initialRoute) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <NavigationTracker>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#f0fdf4' },
        }}
      >
        {/* Pantallas de autenticación */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        {/* Pantallas principales */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />

        {/* Pantallas de productos */}
        <Stack.Screen name="ProductsList" component={ProductsListScreen} />
        <Stack.Screen name="ProductForm" component={ProductFormScreen} />
      </Stack.Navigator>
    </NavigationTracker>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
  },
});