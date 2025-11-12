/**
 * Navegador Principal de la Aplicación
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Importar servicio de autenticación
import authService from '../services/Auth.service';

// Importar pantallas
import LoginScreen from '../views/LoginScreen';
import RegisterScreen from '../views/RegisterScreen';
import HomeScreen from '../views/HomeScreen';
import AdminHomeScreen from '../views/AdminHomeScreen';
import ProductsListScreen from '../views/ProductsListScreen';
import ProductFormScreen from '../views/ProductFormScreen';

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
        // Si hay sesión válida, ir a la pantalla correspondiente según el rol
        if (session.user.isAdmin) {
          setInitialRoute('AdminHome');
        } else {
          setInitialRoute('Home');
        }
      } else {
        // Si no hay sesión o expiró, ir a Login
        setInitialRoute('Login');
      }
    } catch (error) {
      console.error('Error checking session:', error);
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
    <NavigationContainer>
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

        {/* Pantallas de productos */}
        <Stack.Screen name="ProductsList" component={ProductsListScreen} />
        <Stack.Screen name="ProductForm" component={ProductFormScreen} />
      </Stack.Navigator>
    </NavigationContainer>
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