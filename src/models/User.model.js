/**
 * Modelo de Usuario
 */

import CONFIG from '../config/app.config';

export class User {
  constructor(data = {}) {
    this.id = data.id || data.userId || null;
    this.name = data.name || '';
    this.email = data.email || '';
    this.phoneNumber = data.phoneNumber || data.phone || '';
    this.roles = Array.isArray(data.roles) ? data.roles : [];
    this.status = data.status || CONFIG.USER_STATUS.ACTIVE;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  // Getters
  get isAdmin() {
    return this.roles.includes(CONFIG.ROLES.ADMIN);
  }

  get isActive() {
    return this.status === CONFIG.USER_STATUS.ACTIVE;
  }

  get displayName() {
    return this.name.split(' ')[0];
  }

  get fullName() {
    return this.name;
  }

  get primaryRole() {
    return this.roles[0] || CONFIG.ROLES.USER;
  }

  // Validación
  static validate(data) {
    const errors = {};

    // Validar nombre (SOLO si existe en data)
    if (data.name !== undefined) {
      if (!data.name || !data.name.trim()) {
        errors.name = 'El nombre es obligatorio';
      } else if (data.name.trim().length < CONFIG.VALIDATION.NAME_MIN_LENGTH) {
        errors.name = `El nombre debe tener al menos ${CONFIG.VALIDATION.NAME_MIN_LENGTH} caracteres`;
      } else if (data.name.trim().length > CONFIG.VALIDATION.NAME_MAX_LENGTH) {
        errors.name = `El nombre no puede exceder ${CONFIG.VALIDATION.NAME_MAX_LENGTH} caracteres`;
      } else if (!CONFIG.VALIDATION.NAME_REGEX.test(data.name)) {
        errors.name = 'El nombre solo puede contener letras y espacios';
      }
    }

    //  Validar email (SOLO si existe en data)
    if (data.email !== undefined) {
      if (!data.email || !data.email.trim()) {
        errors.email = 'El correo es obligatorio';
      } else if (!CONFIG.VALIDATION.EMAIL_PATTERN.test(data.email)) {
        errors.email = 'Formato de correo inválido';
      }
    }

    //  Validar teléfono (SOLO si existe en data)
    if (data.phoneNumber !== undefined) {
      if (!data.phoneNumber || !data.phoneNumber.trim()) {
        errors.phoneNumber = 'El teléfono es obligatorio';
      } else if (!CONFIG.VALIDATION.PHONE_PATTERN.test(data.phoneNumber)) {
        errors.phoneNumber = `El teléfono debe tener exactamente ${CONFIG.VALIDATION.PHONE_LENGTH} dígitos`;
      }
    }

    //  Validar contraseña (solo en registro)
    if (data.password !== undefined) {
      if (!data.password || !data.password.trim()) {
        errors.password = 'La contraseña es obligatoria';
      } else if (data.password.length < CONFIG.VALIDATION.PASSWORD_MIN_LENGTH) {
        errors.password = `La contraseña debe tener al menos ${CONFIG.VALIDATION.PASSWORD_MIN_LENGTH} caracteres`;
      } else if (!/[A-Z]/.test(data.password)) {
        errors.password = 'La contraseña debe incluir al menos una letra mayúscula';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  // Serialización segura (sin datos sensibles)
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phoneNumber: this.phoneNumber,
      roles: this.roles,
      status: this.status,
      createdAt: this.createdAt,
    };
  }

  // Para almacenamiento local
  toStorage() {
    return JSON.stringify(this.toJSON());
  }

  // Desde almacenamiento local
  static fromStorage(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      return new User(data);
    } catch (error) {
      console.error('Error parsing user from storage:', error);
      return null;
    }
  }
}

export default User;