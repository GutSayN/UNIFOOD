/**
 * Modelo de Producto
 * Patrón: Entity/Model con validación
 */

import CONFIG from '../config/app.config';

export class Product {
  constructor(data = {}) {
    this.productId = data.productId || null;
    this.name = data.name || '';
    this.price = data.price || 0;
    this.description = data.description || '';
    this.categoryName = data.categoryName || CONFIG.CATEGORIES[0];
    this.imageUrl = data.imageUrl || null;
    this.userId = data.userId || null;
    this.userName = data.userName || '';
    this.userPhone = data.userPhone || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    // Para mantener orden del backend
    this.loadIndex = data.loadIndex !== undefined ? data.loadIndex : null;
    // Contadores de votos
    this.likesCount = data.likesCount || 0;
    this.dislikesCount = data.dislikesCount || 0;
  }

  // Getters
  get formattedPrice() {
    return `$${this.price.toLocaleString('es-MX')}`;
  }

  get hasImage() {
    return this.imageUrl !== null && this.imageUrl !== '';
  }

  get hasCategory() {
    return this.categoryName && this.categoryName !== CONFIG.CATEGORIES[0];
  }

  get descriptionWordCount() {
    return this.description.trim().split(/\s+/).filter(w => w.length > 0).length;
  }

  get formattedPhone() {
    if (!this.userPhone) return '';
    // Formatear teléfono: (XXX) XXX-XXXX
    const cleaned = this.userPhone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return this.userPhone;
  }

  get whatsappLink() {
    if (!this.userPhone) return null;
    const phoneNumber = '52' + this.userPhone.replace(/\D/g, '');
    const message = `Hola! Estoy interesado en tu producto: *${this.name}*\nPrecio: ${this.formattedPrice}`;
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  }

  // Validación
  static validate(data) {
    const errors = {};

    // Validar imagen
    if (!data.image || !data.image.uri) {
      errors.image = 'La imagen es obligatoria';
    }

    // Validar nombre
    if (!data.name || !data.name.trim()) {
      errors.name = 'El nombre del producto es obligatorio';
    } else {
      const trimmedName = data.name.trim();
      if (trimmedName.length > CONFIG.VALIDATION.MAX_PRODUCT_NAME_LENGTH) {
        errors.name = `El nombre no puede exceder ${CONFIG.VALIDATION.MAX_PRODUCT_NAME_LENGTH} caracteres`;
      }
      if (!CONFIG.VALIDATION.NAME_REGEX.test(trimmedName)) {
        errors.name = 'El nombre solo puede contener letras, números y espacios';
      }
    }

    // Validar precio
    if (!data.price || !data.price.toString().trim()) {
      errors.price = 'El precio es obligatorio';
    } else {
      const trimmedPrice = data.price.toString().trim();
      if (!CONFIG.VALIDATION.PRICE_REGEX.test(trimmedPrice)) {
        errors.price = 'Formato de precio inválido. Use punto para decimales';
      } else {
        const priceValue = parseFloat(trimmedPrice);
        if (priceValue <= 0) {
          errors.price = 'El precio debe ser mayor a 0';
        }
        if (priceValue > CONFIG.VALIDATION.MAX_PRODUCT_PRICE) {
          errors.price = `El precio máximo es $${CONFIG.VALIDATION.MAX_PRODUCT_PRICE.toLocaleString()}`;
        }
      }
    }

    // Validar categoría
    if (!data.categoryName || data.categoryName === CONFIG.CATEGORIES[0]) {
      errors.categoryName = 'Debes seleccionar una categoría';
    }

    // Validar descripción
    if (!data.description || !data.description.trim()) {
      errors.description = 'La descripción es obligatoria';
    } else {
      const trimmedDesc = data.description.trim();
      const words = trimmedDesc.split(/\s+/).filter(w => w.length > 0);
      if (words.length > CONFIG.VALIDATION.MAX_PRODUCT_DESCRIPTION_WORDS) {
        errors.description = `La descripción no puede exceder ${CONFIG.VALIDATION.MAX_PRODUCT_DESCRIPTION_WORDS} palabras`;
      }
      const descRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s,\.]+$/;
      if (!descRegex.test(trimmedDesc)) {
        errors.description = 'La descripción contiene caracteres no permitidos';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  // Serialización
  toJSON() {
    return {
      productId: this.productId,
      name: this.name,
      price: this.price,
      description: this.description,
      categoryName: this.categoryName,
      imageUrl: this.imageUrl,
      userId: this.userId,
      userName: this.userName,
      userPhone: this.userPhone,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      likesCount: this.likesCount,
      dislikesCount: this.dislikesCount,
    };
  }

  // Para API (FormData)
  toFormData() {
    const formData = new FormData();
    
    formData.append('name', this.name);
    formData.append('price', this.price.toString());
    
    if (this.description && this.description.trim()) {
      formData.append('description', this.description);
    }
    
    if (this.categoryName && this.categoryName !== CONFIG.CATEGORIES[0]) {
      formData.append('categoryName', this.categoryName);
    }
    
    return formData;
  }
}

export default Product;