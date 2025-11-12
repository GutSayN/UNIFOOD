/**
 * Utilidades de Validación
 * Funciones helper para validación de datos
 */

import CONFIG from '../config/app.config';

export const ValidationUtils = {
  /**
   * Validar email
   */
  isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return CONFIG.VALIDATION.EMAIL_REGEX.test(email.trim());
  },

  /**
   * Validar teléfono
   */
  isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    return CONFIG.VALIDATION.PHONE_REGEX.test(phone.trim());
  },

  /**
   * Validar nombre
   */
  isValidName(name) {
    if (!name || typeof name !== 'string') return false;
    const trimmed = name.trim();
    return (
      trimmed.length >= CONFIG.VALIDATION.MIN_NAME_LENGTH &&
      trimmed.length <= CONFIG.VALIDATION.MAX_NAME_LENGTH &&
      CONFIG.VALIDATION.NAME_REGEX.test(trimmed)
    );
  },

  /**
   * Validar contraseña
   */
  isValidPassword(password) {
    if (!password || typeof password !== 'string') return false;
    return (
      password.length >= CONFIG.VALIDATION.MIN_PASSWORD_LENGTH &&
      /[A-Z]/.test(password)
    );
  },

  /**
   * Validar precio
   */
  isValidPrice(price) {
    if (price === null || price === undefined) return false;
    const priceStr = price.toString().trim();
    if (!CONFIG.VALIDATION.PRICE_REGEX.test(priceStr)) return false;
    
    const priceValue = parseFloat(priceStr);
    return priceValue > 0 && priceValue <= CONFIG.VALIDATION.MAX_PRODUCT_PRICE;
  },

  /**
   * Obtener fortaleza de contraseña
   */
  getPasswordStrength(password) {
    if (!password) return { strength: 0, label: 'Muy débil' };

    let strength = 0;

    // Longitud
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;

    // Caracteres
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;

    const labels = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte', 'Muy fuerte'];
    
    return {
      strength: Math.min(strength, 5),
      label: labels[Math.min(strength, 5)],
    };
  },

  /**
   * Sanitizar input de texto
   */
  sanitizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text.trim().replace(/[<>]/g, '');
  },

  /**
   * Validar URL de imagen
   */
  isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.startsWith('http');
  },

  /**
   * Contar palabras
   */
  countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  },

  /**
   * Formatear teléfono mexicano
   */
  formatMexicanPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    return phone;
  },

  /**
   * Limpiar número de teléfono
   */
  cleanPhoneNumber(phone) {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  },

  /**
   * Validar imagen seleccionada
   */
  isValidImageFile(image) {
    if (!image || !image.uri) return false;
    
    // Validar que sea una URI válida
    if (typeof image.uri !== 'string') return false;
    
    // Aceptar URIs locales o remotas
    return (
      image.uri.startsWith('file://') ||
      image.uri.startsWith('content://') ||
      image.uri.startsWith('http://') ||
      image.uri.startsWith('https://')
    );
  },
};

export default ValidationUtils;