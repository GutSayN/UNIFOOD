
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { View, ActivityIndicator } from "react-native";

import LoginScreen from "../views/LoginScreen";
import HomeScreen from "../views/HomeScreen";
import RegisterScreen from "../views/RegisterScreen";
import ProductsListScreen from "../views/ProductsListScreen";
import ProductFormScreen from "../views/ProductFormScreen";
import { getUserSession } from "../hooks/useAuth";
import AdminHome from "../views/AdminHomeScreen"; 

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const session = await getUserSession();
      setInitialRoute(session ? "Home" : "Login");
    };
    checkSession();
  }, []);

  if (!initialRoute) {
    return  null;;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ProductsList" component={ProductsListScreen} />
        <Stack.Screen name="ProductForm" component={ProductFormScreen} />
        <Stack.Screen name="AdminHome" component={AdminHome} /> 
     
      </Stack.Navigator>
    </NavigationContainer>
  );
}