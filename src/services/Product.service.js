/**
 * Servicio de Productos
 * Patrón: Singleton Service con Repository Pattern
 */

import CONFIG from '../config/app.config';
import httpService from './Http.service';
import Product from '../models/Product.model';
import * as ImagePicker from 'expo-image-picker';

class ProductService {
  constructor() {
    if (ProductService.instance) {
      return ProductService.instance;
    }
    ProductService.instance = this;
  }

  /**
   * Construir URL completa de imagen
   */
  _getFullImageUrl(imageUrl) {
    if (!imageUrl) return null;
    
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    const baseUrl = CONFIG.API.PRODUCTS_BASE_URL.replace('/api/product', '');
    
    if (imageUrl.startsWith('/')) {
      return `${baseUrl}${imageUrl}`;
    }
    
    return `${baseUrl}/${imageUrl}`;
  }

  /**
   * Extraer mensaje de error HTTP
   */
  _extractErrorMessage(error) {
    let errorMessage = 'Error en la operación';

    // Si es un HttpError, extraer el mensaje del data
    if (error.name === 'HttpError' && error.data) {
      // El data puede ser un objeto o un string
      if (typeof error.data === 'object' && error.data.message) {
        return error.data.message;
      }
      
      if (typeof error.data === 'string') {
        try {
          // Intentar parsear si es un JSON string
          const parsed = JSON.parse(error.data);
          if (parsed.message) {
            return parsed.message;
          }
        } catch (e) {
          // Si no es JSON, usar el string directamente
          return error.data;
        }
      }
    }

    // Fallback al mensaje del error
    if (error.message) {
      errorMessage = error.message;
    }

    return errorMessage;
  }

  /**
   * Obtener todos los productos
   */
  async getAllProducts() {
    try {
      const response = await httpService.get(`${CONFIG.API.PRODUCTS_BASE_URL}/GetAll`);
      
      if (!response.isSuccess || !response.result) {
        return [];
      }

      const loadTimestamp = Date.now();

      const products = response.result.map((productData, index) => {
        const product = new Product({
          ...productData,
          imageUrl: this._getFullImageUrl(productData.imageUrl),
          createdAt: productData.createdAt || new Date(loadTimestamp + index * 1000).toISOString(),
          loadIndex: index,
        });
        return product;
      });

      return products;
    } catch (error) {
      throw new Error('No se pudieron cargar los productos');
    }
  }

  /**
   * Obtener producto por ID
   */
  async getProductById(id) {
    try {
      if (!id) {
        throw new Error('ID de producto requerido');
      }

      const response = await httpService.get(`${CONFIG.API.PRODUCTS_BASE_URL}/${id}`);
      
      if (!response.isSuccess || !response.result) {
        throw new Error('Producto no encontrado');
      }

      const product = new Product({
        ...response.result,
        imageUrl: this._getFullImageUrl(response.result.imageUrl),
      });

      return product;
    } catch (error) {
      throw new Error('No se pudo cargar el producto');
    }
  }

  /**
   * Obtener productos por ID de usuario
   */
  async getProductsByUserId(userId) {
    try {
      if (!userId) {
        throw new Error('ID de usuario requerido');
      }

      const response = await httpService.get(
        `${CONFIG.API.PRODUCTS_BASE_URL}/user/${userId}`
      );
      
      if (!response.isSuccess || !response.result) {
        return [];
      }

      const products = response.result.map(productData => {
        const product = new Product({
          ...productData,
          imageUrl: this._getFullImageUrl(productData.imageUrl),
        });
        return product;
      });

      return products;
    } catch (error) {
      throw new Error('No se pudieron cargar tus productos');
    }
  }

  /**
   * Votar en un producto
   */
  async voteProduct(productId, userId, isLike) {
    try {
      if (!productId || !userId) {
        throw new Error('ID de producto y usuario requeridos');
      }

      const response = await httpService.post(
        `${CONFIG.API.PRODUCTS_BASE_URL}/${productId}/vote`,
        {
          isLike: isLike,
          userId: userId,
        }
      );

      if (!response.isSuccess) {
        throw new Error(response.message || 'No se pudo registrar el voto');
      }

      return {
        success: true,
        likesCount: response.result?.likesCount || 0,
        dislikesCount: response.result?.dislikesCount || 0,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crear nuevo producto con manejo de errores
   */
  async createProduct(productData, userId) {
    try {
      // Validar datos
      const validation = Product.validate(productData);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        throw new Error(firstError);
      }

      // Crear FormData
      const formData = new FormData();
      
      formData.append('name', productData.name.trim());
      formData.append('price', parseFloat(productData.price).toString());
      formData.append('userId', userId);
      
      if (productData.description && productData.description.trim()) {
        formData.append('description', productData.description.trim());
      }
      
      if (productData.categoryName && productData.categoryName !== CONFIG.CATEGORIES[0]) {
        formData.append('categoryName', productData.categoryName);
      }
      
      // Agregar imagen
      if (productData.image && productData.image.uri) {
        const imageUri = productData.image.uri;
        const uriParts = imageUri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        
        formData.append('image', {
          uri: imageUri,
          name: `product_${Date.now()}.${fileType}`,
          type: `image/${fileType}`,
        });
      }

      const response = await httpService.postFormData(
        CONFIG.API.PRODUCTS_BASE_URL,
        formData
      );

      if (!response.isSuccess) {
        throw new Error(response.message || 'No se pudo crear el producto');
      }

      return {
        success: true,
        message: 'Producto creado correctamente',
        product: response.result,
      };
    } catch (error) {
      // Extraer mensaje del error
      const errorMessage = this._extractErrorMessage(error);
      const lowerMsg = errorMessage.toLowerCase();

      // Detectar errores específicos y lanzar mensajes claros
      if (lowerMsg.includes('imagen rechazada') || 
          lowerMsg.includes('contenido sensible') || 
          lowerMsg.includes('contenido violento') ||
          lowerMsg.includes('contenido inapropiado')) {
        throw new Error('IMAGEN RECHAZADA: contiene contenido sensible o violento.');
      }

      if (lowerMsg.includes('lenguaje inapropiado') || 
          lowerMsg.includes('malas palabras') ||
          lowerMsg.includes('palabras ofensivas')) {
        throw new Error('El texto contiene lenguaje inapropiado en el nombre, descripción o categoría.');
      }

      if (lowerMsg.includes('price must not be greater than')) {
        throw new Error('El precio máximo permitido es $100,000.');
      }

      // Lanzar el mensaje extraído
      throw new Error(errorMessage);
    }
  }

  /**
   * Actualizar producto con manejo de errores
   */
  async updateProduct(productId, productData) {
    try {
      if (!productId) {
        throw new Error('ID de producto requerido');
      }

      // Validar datos
      const validation = Product.validate(productData);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        throw new Error(firstError);
      }

      // Crear FormData
      const formData = new FormData();
      
      formData.append('name', productData.name.trim());
      formData.append('price', parseFloat(productData.price).toString());
      
      if (productData.description && productData.description.trim()) {
        formData.append('description', productData.description.trim());
      }
      
      if (productData.categoryName && productData.categoryName !== CONFIG.CATEGORIES[0]) {
        formData.append('categoryName', productData.categoryName);
      }
      
      // Agregar imagen solo si es nueva
      if (productData.image && productData.image.uri) {
        const imageUri = productData.image.uri;
        
        if (!imageUri.startsWith('http') && !imageUri.startsWith('/')) {
          const uriParts = imageUri.split('.');
          const fileType = uriParts[uriParts.length - 1];
          
          formData.append('image', {
            uri: imageUri,
            name: `product_${Date.now()}.${fileType}`,
            type: `image/${fileType}`,
          });
        }
      }

      const response = await httpService.putFormData(
        `${CONFIG.API.PRODUCTS_BASE_URL}/${productId}`,
        formData
      );

      if (!response.isSuccess) {
        throw new Error(response.message || 'No se pudo actualizar el producto');
      }

      return {
        success: true,
        message: 'Producto actualizado correctamente',
        product: response.result,
      };
    } catch (error) {
      // Extraer mensaje del error
      const errorMessage = this._extractErrorMessage(error);
      const lowerMsg = errorMessage.toLowerCase();

      // Detectar errores específicos y lanzar mensajes claros
      if (lowerMsg.includes('imagen rechazada') || 
          lowerMsg.includes('contenido sensible') || 
          lowerMsg.includes('contenido violento') ||
          lowerMsg.includes('contenido inapropiado')) {
        throw new Error('IMAGEN RECHAZADA: contiene contenido sensible o violento.');
      }

      if (lowerMsg.includes('lenguaje inapropiado') || 
          lowerMsg.includes('malas palabras') ||
          lowerMsg.includes('palabras ofensivas')) {
        throw new Error('El texto contiene lenguaje inapropiado en el nombre, descripción o categoría.');
      }

      if (lowerMsg.includes('price must not be greater than')) {
        throw new Error('El precio máximo permitido es $100,000.');
      }

      // Lanzar el mensaje extraído
      throw new Error(errorMessage);
    }
  }

  /**
   * Eliminar producto
   */
  async deleteProduct(productId) {
    try {
      if (!productId) {
        throw new Error('ID de producto requerido');
      }

      const response = await httpService.delete(
        `${CONFIG.API.PRODUCTS_BASE_URL}/${productId}`
      );

      if (!response.isSuccess) {
        throw new Error(response.message || 'No se pudo eliminar el producto');
      }

      return {
        success: true,
        message: 'Producto eliminado correctamente',
      };
    } catch (error) {
      throw new Error('No se pudo eliminar el producto');
    }
  }

  /**
   * Seleccionar imagen de la galería
   */
  async pickImage() {
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
      throw new Error('No se pudo seleccionar la imagen');
    }
  }

  /**
   * Tomar foto con la cámara
   */
  async takePhoto() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('Se necesitan permisos para acceder a la cámara');
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        return {
          uri: asset.uri,
          fileName: `photo_${Date.now()}.jpg`,
        };
      }
      
      return null;
    } catch (error) {
      throw new Error('No se pudo tomar la foto');
    }
  }
}

// Singleton instance
const productService = new ProductService();
Object.freeze(productService);

export default productService;