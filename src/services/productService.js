// src/services/productService.js
const PRODUCT_API_URL = "https://product-microservice-cwk6.onrender.com/api/product";
import * as ImagePicker from 'expo-image-picker';

// Obtener todos los productos
export const getAllProducts = async () => {
  try {
    const response = await fetch(`${PRODUCT_API_URL}/GetAll`, {
      method: "GET",
      headers: {
        accept: "*/*",
      },
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error al obtener productos:", error);
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
    return result;
  } catch (error) {
    console.error("Error al obtener producto:", error);
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
    return result;
  } catch (error) {
    console.error("Error al obtener productos del usuario:", error);
    throw error;
  }
};

// Crear nuevo producto
export const createProduct = async (productData, userPhone = null) => {
  try {
    const formData = new FormData();
    
    // ✅ Campos requeridos según tu API
    formData.append("name", productData.name);
    formData.append("price", productData.price.toString());
    formData.append("userId", productData.userId); // ← Requerido
    
    // ✅ Campos opcionales
    if (productData.description && productData.description.trim()) {
      formData.append("description", productData.description);
    }
    
    if (productData.categoryName && productData.categoryName.trim()) {
      formData.append("categoryName", productData.categoryName);
    }
    
    // ✅ Agregar imagen si existe
    if (productData.image && productData.image.uri) {
      const imageUri = productData.image.uri;
      
      // Obtener extensión del archivo
      const uriParts = imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      const imageFile = {
        uri: imageUri,
        name: `product_${Date.now()}.${fileType}`,
        type: `image/${fileType}`,
      };
      
      formData.append("image", imageFile);
    }

    console.log("📤 Enviando producto:", {
      name: productData.name,
      price: productData.price,
      userId: productData.userId,
      hasImage: !!productData.image
    });

    const response = await fetch(PRODUCT_API_URL, {
      method: "POST",
      headers: {
        "Accept": "*/*",
        // NO incluir Content-Type cuando usas FormData
      },
      body: formData,
    });

    const responseText = await response.text();
    console.log("📥 Respuesta del servidor:", responseText);

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status} - ${responseText}`);
    }

    const result = JSON.parse(responseText);
    return result;
    
  } catch (error) {
    console.error("❌ Error completo:", error);
    throw error;
  }
};

// Actualizar producto existente
export const updateProduct = async (id, productData, userPhone = null) => {
  try {
    const formData = new FormData();
    
    formData.append("name", productData.name);
    formData.append("price", productData.price.toString());
    formData.append("userId", productData.userId); // ← Requerido
    
    if (productData.description && productData.description.trim()) {
      formData.append("description", productData.description);
    }
    
    if (productData.categoryName && productData.categoryName.trim()) {
      formData.append("categoryName", productData.categoryName);
    }
    
    if (productData.image && productData.image.uri && !productData.image.uri.startsWith('http')) {
      const imageUri = productData.image.uri;
      const uriParts = imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      const imageFile = {
        uri: imageUri,
        name: `product_${Date.now()}.${fileType}`,
        type: `image/${fileType}`,
      };
      
      formData.append("image", imageFile);
    }
    
    console.log("📤 Actualizando producto:", id);
    
    const response = await fetch(`${PRODUCT_API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Accept": "*/*",
      },
      body: formData,
    });

    const responseText = await response.text();
    console.log("📥 Respuesta del servidor:", responseText);

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status} - ${responseText}`);
    }

    const result = JSON.parse(responseText);
    return result;
    
  } catch (error) {
    console.error("❌ Error al actualizar:", error);
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
    console.error("Error al eliminar producto:", error);
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
      mediaTypes: ['images'], // ✅ Corregido: usar array en lugar de ImagePicker.MediaTypeOptions
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
    console.error('Error al seleccionar imagen:', error);
    throw error;
  }
};