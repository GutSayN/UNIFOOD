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

// Crear nuevo producto
export const createProduct = async (productData) => {
  try {
    const formData = new FormData();
    formData.append("name", productData.name);
    formData.append("price", productData.price.toString());
    
    if (productData.description) {
      formData.append("description", productData.description);
    }
    
    if (productData.categoryName) {
      formData.append("categoryName", productData.categoryName);
    }
    
    if (productData.image && productData.image.uri) {
      const imageUri = productData.image.uri;
      const filename = productData.image.fileName || 
                      imageUri.split('/').pop() || 
                      `product_${Date.now()}.jpg`;
      
      let imageType = 'image/jpeg';
      
      if (productData.image.mimeType) {
        imageType = productData.image.mimeType;
      } else if (productData.image.type) {
        if (productData.image.type === 'image') {
          if (filename.toLowerCase().endsWith('.png')) {
            imageType = 'image/png';
          } else if (filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg')) {
            imageType = 'image/jpeg';
          }
        } else if (productData.image.type.startsWith('image/')) {
          imageType = productData.image.type;
        }
      }
      
      formData.append("image", {
        uri: imageUri,
        type: imageType,
        name: filename,
      });
    }

    const response = await fetch(PRODUCT_API_URL, {
      method: "POST",
      headers: {
        "Accept": "*/*",
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error del servidor: ${response.status}`);
    }

    const result = await response.json();
    return result;
    
  } catch (error) {
    throw error;
  }
};

// Actualizar producto existente
export const updateProduct = async (id, productData) => {
  try {
    const formData = new FormData();
    formData.append("name", productData.name);
    formData.append("price", productData.price.toString());
    
    if (productData.description) {
      formData.append("description", productData.description);
    }
    
    if (productData.categoryName) {
      formData.append("categoryName", productData.categoryName);
    }
    
    if (productData.image && productData.image.uri) {
      const imageUri = productData.image.uri;
      const filename = productData.image.fileName || 
                      imageUri.split('/').pop() || 
                      `product_${Date.now()}.jpg`;
      
      let imageType = 'image/jpeg'; 
      
      if (productData.image.mimeType) {
        imageType = productData.image.mimeType;
      } else if (productData.image.type) {
        if (productData.image.type === 'image') {
          if (filename.toLowerCase().endsWith('.png')) {
            imageType = 'image/png';
          } else if (filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg')) {
            imageType = 'image/jpeg';
          }
        } else if (productData.image.type.startsWith('image/')) {
          imageType = productData.image.type;
        }
      }
      
      formData.append("image", {
        uri: imageUri,
        type: imageType,
        name: filename,
      });
    }
    
    const response = await fetch(`${PRODUCT_API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Accept": "*/*",
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error del servidor: ${response.status}`);
    }

    const result = await response.json();
    return result;
    
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
    console.error("Error al eliminar producto:", error);
    throw error;
  }
};

const pickImage = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images, 
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      
      let mimeType = 'image/jpeg';
      if (asset.uri.toLowerCase().endsWith('.png')) {
        mimeType = 'image/png';
      }
      
      return {
        uri: asset.uri,
        type: mimeType,  
        fileName: asset.fileName || `photo_${Date.now()}.${mimeType === 'image/png' ? 'png' : 'jpg'}`,
        mimeType: mimeType,
      };
    }
    
    return null;
  } catch (error) {
    throw error;
  }
};