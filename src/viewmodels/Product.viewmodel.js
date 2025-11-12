/**
 * ViewModel de Productos
 */

import { useState, useCallback } from 'react';
import productService from '../services/Product.service';
import Product from '../models/Product.model';

export const useProductViewModel = () => {
  // Estado
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Estado para saber si ya se cargaron productos del usuario
  const [hasLoadedUserProducts, setHasLoadedUserProducts] = useState(false);

  /**
   * Cargar todos los productos
   */
  const loadAllProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setCurrentUserId(null);

      const loadedProducts = await productService.getAllProducts();
      setProducts(loadedProducts);

      return {
        success: true,
        products: loadedProducts,
      };
    } catch (err) {
      const errorMessage = err.message || 'Error al cargar productos';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refrescar productos según el contexto
   */
  const refreshProducts = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      let loadedProducts;
      
      if (currentUserId) {
        loadedProducts = await productService.getProductsByUserId(currentUserId);
      } else {
        loadedProducts = await productService.getAllProducts();
      }
      
      setProducts(loadedProducts);

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false };
    } finally {
      setIsRefreshing(false);
    }
  }, [currentUserId]);

  /**
   * Refrescar productos silenciosamente (sin indicador de carga)
   */
  const refreshProductsSilently = useCallback(async () => {
    try {
      // NO usamos setIsRefreshing ni setIsLoading
      setError(null);

      let loadedProducts;
      
      if (currentUserId) {
        loadedProducts = await productService.getProductsByUserId(currentUserId);
      } else {
        loadedProducts = await productService.getAllProducts();
      }
      
      setProducts(loadedProducts);

      return { success: true };
    } catch (err) {
      // Silenciar errores en refresh automático
      console.error('Error en refresh silencioso:', err);
      return { success: false };
    }
  }, [currentUserId]);

  /**
   * Cargar productos por usuario
   * @param {string} userId - ID del usuario
   * @param {boolean} silent - Si es true, no muestra loading
   */
  const loadUserProducts = useCallback(async (userId, silent = false) => {
    try {
      // Solo mostrar loading si no es silencioso Y no se ha cargado antes
      if (!silent && !hasLoadedUserProducts) {
        setIsLoading(true);
      }
      
      setError(null);
      setCurrentUserId(userId);

      const loadedProducts = await productService.getProductsByUserId(userId);
      setProducts(loadedProducts);
      
      // Marcar como cargado
      setHasLoadedUserProducts(true);

      return {
        success: true,
        products: loadedProducts,
      };
    } catch (err) {
      const errorMessage = err.message || 'Error al cargar tus productos';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      if (!silent && !hasLoadedUserProducts) {
        setIsLoading(false);
      }
    }
  }, [hasLoadedUserProducts]);

  /**
   * Cargar producto por ID
   */
  const loadProductById = useCallback(async (productId) => {
    try {
      setIsLoading(true);
      setError(null);

      const product = await productService.getProductById(productId);
      setCurrentProduct(product);

      return {
        success: true,
        product,
      };
    } catch (err) {
      const errorMessage = err.message || 'Error al cargar producto';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Votar en un producto
   */
  const voteProduct = useCallback(async (productId, userId, isLike) => {
    try {
      const result = await productService.voteProduct(productId, userId, isLike);

      // Actualizar el producto en la lista local
      setProducts(prev => prev.map(p => 
        p.productId === productId 
          ? { ...p, likesCount: result.likesCount, dislikesCount: result.dislikesCount }
          : p
      ));

      return {
        success: true,
        likesCount: result.likesCount,
        dislikesCount: result.dislikesCount,
      };
    } catch (err) {
      const errorMessage = err.message || 'Error al votar';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }, []);

  /**
   * Crear producto
   */
  const createProduct = useCallback(async (productData, userId) => {
    try {
      setIsLoading(true);
      setError(null);

      // Validar datos
      const validation = Product.validate(productData);
      if (!validation.isValid) {
        const errors = Object.values(validation.errors);
        throw new Error(errors[0]);
      }

      const result = await productService.createProduct(productData, userId);

      return {
        success: true,
        message: result.message,
        product: result.product,
      };
    } catch (err) {
      const errorMessage = err.message || 'Error al crear producto';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Actualizar producto
   */
  const updateProduct = useCallback(async (productId, productData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Validar datos
      const validation = Product.validate(productData);
      if (!validation.isValid) {
        const errors = Object.values(validation.errors);
        throw new Error(errors[0]);
      }

      const result = await productService.updateProduct(productId, productData);

      return {
        success: true,
        message: result.message,
        product: result.product,
      };
    } catch (err) {
      const errorMessage = err.message || 'Error al actualizar producto';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Eliminar producto
   */
  const deleteProduct = useCallback(async (productId) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await productService.deleteProduct(productId);

      // Actualizar lista local
      setProducts(prev => prev.filter(p => p.productId !== productId));

      return {
        success: true,
        message: result.message,
      };
    } catch (err) {
      const errorMessage = err.message || 'Error al eliminar producto';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Seleccionar imagen
   */
  const pickImage = useCallback(async () => {
    try {
      const image = await productService.pickImage();
      return {
        success: true,
        image,
      };
    } catch (err) {
      const errorMessage = err.message || 'Error al seleccionar imagen';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }, []);

  /**
   * Tomar foto
   */
  const takePhoto = useCallback(async () => {
    try {
      const image = await productService.takePhoto();
      return {
        success: true,
        image,
      };
    } catch (err) {
      const errorMessage = err.message || 'Error al tomar foto';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }, []);

  /**
   * Buscar productos
   */
  const searchProducts = useCallback((query) => {
    if (!query || query.trim() === '') {
      return products;
    }

    const normalizedQuery = query.toLowerCase().trim();
    
    return products.filter(product => {
      const nameMatch = product.name?.toLowerCase().includes(normalizedQuery);
      const categoryMatch = product.categoryName?.toLowerCase().includes(normalizedQuery);
      const descriptionMatch = product.description?.toLowerCase().includes(normalizedQuery);
      const priceMatch = product.price?.toString().includes(normalizedQuery);
      
      return nameMatch || categoryMatch || descriptionMatch || priceMatch;
    });
  }, [products]);

  /**
   * Filtrar productos por categoría
   */
  const filterByCategory = useCallback((category) => {
    if (!category) return products;
    
    return products.filter(product => product.categoryName === category);
  }, [products]);

  /**
   * Ordenar productos
   */
  const sortProducts = useCallback((sortBy = 'date', order = 'desc') => {
    const sorted = [...products];

    switch (sortBy) {
      case 'price':
        sorted.sort((a, b) => {
          return order === 'asc' ? a.price - b.price : b.price - a.price;
        });
        break;
      
      case 'name':
        sorted.sort((a, b) => {
          return order === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        });
        break;
      
      case 'date':
      default:
        sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return order === 'asc' ? dateA - dateB : dateB - dateA;
        });
        break;
    }

    setProducts(sorted);
  }, [products]);

  /**
   * Validar campo en tiempo real
   */
  const validateField = useCallback((field, value) => {
    const tempData = { 
      [field]: value,
      image: field === 'image' ? value : { uri: 'dummy' },
      name: field === 'name' ? value : 'Dummy',
      price: field === 'price' ? value : '100',
      categoryName: field === 'categoryName' ? value : 'Dummy Category',
      description: field === 'description' ? value : 'Dummy description',
    };
    
    const validation = Product.validate(tempData);
    
    return {
      isValid: !validation.errors[field],
      error: validation.errors[field] || null,
    };
  }, []);

  /**
   * Limpiar errores
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Limpiar producto actual
   */
  const clearCurrentProduct = useCallback(() => {
    setCurrentProduct(null);
  }, []);

  return {
    // Estado
    isLoading,
    isRefreshing,
    products,
    currentProduct,
    error,
    hasProducts: products.length > 0,
    productCount: products.length,
    hasLoadedUserProducts, 
    // Métodos de carga
    loadAllProducts,
    refreshProducts,
    refreshProductsSilently, 
    loadUserProducts,
    loadProductById,

    // Métodos CRUD
    createProduct,
    updateProduct,
    deleteProduct,

    // Método de votación
    voteProduct,

    // Métodos de imagen
    pickImage,
    takePhoto,

    // Métodos de búsqueda y filtrado
    searchProducts,
    filterByCategory,
    sortProducts,

    // Validación
    validateField,

    // Utilidades
    clearError,
    clearCurrentProduct,
  };
};

export default useProductViewModel;