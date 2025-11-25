/**
 * Servicio de Administrador
 * Maneja operaciones de RUD para usuarios y productos desde el panel admin
 */

import CONFIG from '../config/app.config';
import httpService from './Http.service';
import User from '../models/User.model';
import Product from '../models/Product.model';

class AdminService {
  constructor() {
    if (AdminService.instance) {
      return AdminService.instance;
    }
    AdminService.instance = this;
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

  // ============================================
  // OPERACIONES DE USUARIOS
  // ============================================

  /**
   * Obtener todos los usuarios
   */
  async getAllUsers() {
    try {
      const response = await httpService.get(`${CONFIG.API.AUTH_BASE_URL}/users`);
      
      if (!response.isSuccess || !response.result) {
        return [];
      }

      const users = response.result.map(userData => new User(userData));
      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw new Error('No se pudieron cargar los usuarios');
    }
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(userId) {
    try {
      const response = await httpService.get(`${CONFIG.API.AUTH_BASE_URL}/public/${userId}`);
      
      if (!response.isSuccess || !response.result) {
        throw new Error('Usuario no encontrado');
      }

      return new User(response.result);
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error('No se pudo cargar el usuario');
    }
  }

  /**
   * Actualizar usuario (incluye cambio de rol y estado)
   */
  async updateUser(userId, userData) {
    try {
      // Construir el payload solo con los campos que se pueden actualizar
      const payload = {};
      
      if (userData.name !== undefined) payload.name = userData.name.trim();
      if (userData.email !== undefined) payload.email = userData.email.trim().toLowerCase();
      if (userData.phoneNumber !== undefined) payload.phoneNumber = userData.phoneNumber.trim();
      if (userData.password !== undefined && userData.password) payload.password = userData.password;

      const response = await httpService.patch(
        `${CONFIG.API.AUTH_BASE_URL}/me`,
        payload
      );

      if (!response.isSuccess) {
        throw new Error(response.message || 'No se pudo actualizar el usuario');
      }

      return {
        success: true,
        message: 'Usuario actualizado correctamente',
        user: new User(response.result),
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Cambiar estado del usuario (activar/desactivar)
   */
  async updateUserStatus(email, status) {
    try {
      const response = await httpService.put(
        `${CONFIG.API.AUTH_BASE_URL}/status/${email}`,
        { status }
      );

      if (!response.isSuccess) {
        throw new Error(response.message || 'No se pudo actualizar el estado');
      }

      return {
        success: true,
        message: status === 1 ? 'Usuario activado' : 'Usuario desactivado',
      };
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  /**
   * Eliminar usuario y sus productos
   */
  async deleteUser(userId) {
    try {
      // Primero eliminar todos los productos del usuario
      await httpService.delete(
        `${CONFIG.API.PRODUCTS_BASE_URL}/internal/users/${userId}/products`
      );

      return {
        success: true,
        message: 'Usuario y sus productos eliminados correctamente',
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('No se pudo eliminar el usuario');
    }
  }

  // ============================================
  // OPERACIONES DE PRODUCTOS
  // ============================================

  /**
   * Obtener todos los productos (para admin)
   */
  async getAllProducts() {
    try {
      const response = await httpService.get(`${CONFIG.API.PRODUCTS_BASE_URL}/GetAll`);
      
      if (!response.isSuccess || !response.result) {
        return [];
      }

      const products = response.result.map(productData => 
        new Product({
          ...productData,
          imageUrl: this._getFullImageUrl(productData.imageUrl),
        })
      );

      return products;
    } catch (error) {
      console.error('Error getting all products:', error);
      throw new Error('No se pudieron cargar los productos');
    }
  }

  /**
   * Obtener producto por ID
   */
  async getProductById(productId) {
    try {
      const response = await httpService.get(`${CONFIG.API.PRODUCTS_BASE_URL}/${productId}`);
      
      if (!response.isSuccess || !response.result) {
        throw new Error('Producto no encontrado');
      }

      return new Product({
        ...response.result,
        imageUrl: this._getFullImageUrl(response.result.imageUrl),
      });
    } catch (error) {
      console.error('Error getting product:', error);
      throw new Error('No se pudo cargar el producto');
    }
  }

  /**
   * Actualizar producto
   */
  async updateProduct(productId, productData) {
    try {
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
      console.error('Error updating product:', error);
      throw error;
    }
  }

  /**
   * Eliminar producto
   */
  async deleteProduct(productId) {
    try {
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
      console.error('Error deleting product:', error);
      throw new Error('No se pudo eliminar el producto');
    }
  }

  /**
   * Eliminar todos los productos de un usuario
   */
  async deleteUserProducts(userId) {
    try {
      const response = await httpService.delete(
        `${CONFIG.API.PRODUCTS_BASE_URL}/internal/users/${userId}/products`
      );

      if (!response.isSuccess) {
        throw new Error(response.message || 'No se pudieron eliminar los productos');
      }

      return {
        success: true,
        message: 'Productos eliminados correctamente',
      };
    } catch (error) {
      console.error('Error deleting user products:', error);
      throw new Error('No se pudieron eliminar los productos');
    }
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  /**
   * Obtener estadísticas del dashboard
   */
  async getDashboardStats() {
    try {
      const [usersResponse, productsResponse] = await Promise.all([
        this.getAllUsers(),
        this.getAllProducts(),
      ]);

      const activeUsers = usersResponse.filter(u => u.status === CONFIG.USER_STATUS.ACTIVE).length;
      const inactiveUsers = usersResponse.filter(u => u.status === CONFIG.USER_STATUS.INACTIVE).length;

      return {
        totalUsers: usersResponse.length,
        activeUsers,
        inactiveUsers,
        totalProducts: productsResponse.length,
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        totalProducts: 0,
      };
    }
  }
}

// Singleton instance
const adminService = new AdminService();
Object.freeze(adminService);

export default adminService;