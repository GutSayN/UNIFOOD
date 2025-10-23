// src/services/productService.js
const PRODUCT_API_URL = "https://product-microservice-cwk6.onrender.com/api/product";

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
    
    if (productData.image) {
      formData.append("image", {
        uri: productData.image.uri,
        type: productData.image.type || "image/jpeg",
        name: productData.image.fileName || "product.jpg",
      });
    }

    const response = await fetch(PRODUCT_API_URL, {
      method: "POST",
      headers: {
        accept: "*/*",
      },
      body: formData,
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error al crear producto:", error);
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
      formData.append("image", {
        uri: productData.image.uri,
        type: productData.image.type || "image/jpeg",
        name: productData.image.fileName || "product.jpg",
      });
    }
    
    if (productData.imageUrl) {
      formData.append("imageUrl", productData.imageUrl);
    }
    
    if (productData.imageLocalPath) {
      formData.append("imageLocalPath", productData.imageLocalPath);
    }

    const response = await fetch(`${PRODUCT_API_URL}/${id}`, {
      method: "PUT",
      headers: {
        accept: "*/*",
      },
      body: formData,
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error al actualizar producto:", error);
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