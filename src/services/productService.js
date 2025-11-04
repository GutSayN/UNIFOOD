// src/services/productService.js
const PRODUCT_API_URL = "https://products-microservice-a9b6.onrender.com/api/product";
const BASE_URL = "https://products-microservice-a9b6.onrender.com";
import * as ImagePicker from 'expo-image-picker';

// ✅ Construir URL completa de imagen
export const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  if (imageUrl.startsWith('/')) {
    return `${BASE_URL}${imageUrl}`;
  }
  
  return `${BASE_URL}/${imageUrl}`;
};

// ✅ Obtener todos los productos (ya vienen con userName y userPhone del backend)
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
      // Agregar URL completa de imagen a cada producto
      const productsWithFullImageUrl = result.result.map(product => ({
        ...product,
        imageUrl: getFullImageUrl(product.imageUrl),
      }));
      
      return {
        ...result,
        result: productsWithFullImageUrl,
      };
    }
    
    return result;
  } catch (error) {
    throw error;
  }
};

// ✅ Obtener producto por ID
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
      return {
        ...result,
        result: {
          ...result.result,
          imageUrl: getFullImageUrl(result.result.imageUrl),
        },
      };
    }
    
    return result;
  } catch (error) {
    throw error;
  }
};

// ✅ Obtener productos por ID de usuario
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
      const productsWithFullImageUrl = result.result.map(product => ({
        ...product,
        imageUrl: getFullImageUrl(product.imageUrl),
      }));
      
      return {
        ...result,
        result: productsWithFullImageUrl,
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