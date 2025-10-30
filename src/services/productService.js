// src/services/productService.js
const PRODUCT_API_URL = "https://product-microservice-cwk6.onrender.com/api/product";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache para usuarios
const userCache = {};

// Función para obtener datos de un usuario por ID
const getUserById = async (userId) => {
  if (userCache[userId]) {
    return userCache[userId];
  }

  try {
    const userData = await AsyncStorage.getItem("userData");
    if (userData) {
      const user = JSON.parse(userData);
      if (user.id === userId) {
        const userInfo = {
          name: user.name || "Usuario Anónimo",
          phoneNumber: user.phoneNumber || null,
        };
        userCache[userId] = userInfo;
        return userInfo;
      }
    }

    return {
      name: "Usuario Anónimo",
      phoneNumber: null,
    };
  } catch (error) {
    return {
      name: "Usuario Anónimo",
      phoneNumber: null,
    };
  }
};

// Enriquecer un producto con datos del usuario
const enrichProduct = async (product) => {
  const userData = await getUserById(product.userId);
  return {
    ...product,
    userName: userData.name,
    userPhone: userData.phoneNumber,
  };
};

// Obtener todos los productos CON datos de usuario
export const getAllProducts = async () => {
  try {
    const response = await fetch(`${PRODUCT_API_URL}/GetAll`, {
      method: "GET",
      headers: {
        accept: "*/*",
      },
    });
    const result = await response.json();
    
    if (result.isSuccess && result.result) {
      const enrichedProducts = await Promise.all(
        result.result.map(product => enrichProduct(product))
      );
      
      return {
        ...result,
        result: enrichedProducts,
      };
    }
    
    return result;
  } catch (error) {
    throw error;
  }
};

// Obtener producto por ID
export const getProductById = async (id) => {
  try {
    const response = await fetch(`${PRODUCT_API_URL}/${id}`, {
      method: "GET",
      headers: {
        accept: "*/*",
      },
    });
    const result = await response.json();
    
    if (result.isSuccess && result.result) {
      const enrichedProduct = await enrichProduct(result.result);
      return {
        ...result,
        result: enrichedProduct,
      };
    }
    
    return result;
  } catch (error) {
    throw error;
  }
};

// Obtener productos por ID de usuario
export const getProductsByUserId = async (userId) => {
  try {
    const response = await fetch(`${PRODUCT_API_URL}/user/${userId}`, {
      method: "GET",
      headers: {
        accept: "*/*",
      },
    });
    const result = await response.json();
    
    if (result.isSuccess && result.result) {
      const enrichedProducts = await Promise.all(
        result.result.map(product => enrichProduct(product))
      );
      
      return {
        ...result,
        result: enrichedProducts,
      };
    }
    
    return result;
  } catch (error) {
    throw error;
  }
};

// Crear nuevo producto
export const createProduct = async (productData) => {
  try {
    const formData = new FormData();
    
    formData.append("name", productData.name);
    formData.append("price", productData.price.toString());
    formData.append("userId", productData.userId);
    
    if (productData.description && productData.description.trim()) {
      formData.append("description", productData.description);
    }
    
    if (productData.categoryName && productData.categoryName.trim()) {
      formData.append("categoryName", productData.categoryName);
    }
    
    if (productData.image && productData.image.uri) {
      const imageUri = productData.image.uri;
      const uriParts = imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      formData.append("image", {
        uri: imageUri,
        name: `product_${Date.now()}.${fileType}`,
        type: `image/${fileType}`,
      });
    }

    const response = await fetch(PRODUCT_API_URL, {
      method: "POST",
      headers: {
        "Accept": "*/*",
      },
      body: formData,
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${responseText}`);
    }

    return JSON.parse(responseText);
    
  } catch (error) {
    throw error;
  }
};

// Actualizar producto
export const updateProduct = async (id, productData) => {
  try {
    const formData = new FormData();
    
    formData.append("name", productData.name);
    formData.append("price", productData.price.toString());
    
    if (productData.description && productData.description.trim()) {
      formData.append("description", productData.description);
    }
    
    if (productData.categoryName && productData.categoryName.trim()) {
      formData.append("categoryName", productData.categoryName);
    }
    
    if (productData.image && productData.image.uri) {
      const imageUri = productData.image.uri;
      
      if (!imageUri.startsWith('http') && !imageUri.startsWith('/')) {
        const uriParts = imageUri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        
        formData.append("image", {
          uri: imageUri,
          name: `product_${Date.now()}.${fileType}`,
          type: `image/${fileType}`,
        });
      }
    }
    
    const response = await fetch(`${PRODUCT_API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Accept": "*/*",
      },
      body: formData,
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${responseText}`);
    }

    return JSON.parse(responseText);
    
  } catch (error) {
    throw error;
  }
};

// Eliminar producto
export const deleteProduct = async (id) => {
  try {
    const response = await fetch(`${PRODUCT_API_URL}/${id}`, {
      method: "DELETE",
      headers: {
        accept: "*/*",
      },
    });
    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
};

// Seleccionar imagen
export const pickImage = async () => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Se necesitan permisos para acceder a la galería de fotos');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      
      return {
        uri: asset.uri,
        fileName: asset.fileName || `photo_${Date.now()}.jpg`,
      };
    }
    
    return null;
  } catch (error) {
    throw error;
  }
};