/**
 * Configuración Central de la Aplicación
 */

const CONFIG = {
  // URLs de las APIs
  API: {
    AUTH_BASE_URL: 'https://auth-microservice-tfql.onrender.com/api/auth',
    PRODUCTS_BASE_URL: 'https://products-microservice-a9b6.onrender.com/api/product',
    TIMEOUT: 30000,
  },

  // Claves de almacenamiento
  STORAGE_KEYS: {
    USER_TOKEN: '@ufood_user_token',
    USER_DATA: '@ufood_user_data',
    SESSION_TIMESTAMP: '@ufood_session_timestamp',
    LOGIN_ATTEMPTS: '@ufood_login_attempts',
    LOCKOUT_UNTIL: '@ufood_lockout_until',
    LOCKOUT_TIME: '@ufood_lockout_time',
    LAST_ACTIVITY: '@ufood_last_activity',
  },

  // Configuración de seguridad
  SECURITY: {
    SESSION_TIMEOUT: 3600000,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_TIME: 900000,
    LOCKOUT_DURATION: 900000,
    ENCRYPTION_KEY: 'ufood_secure_key_2024',
    TOKEN_PREFIX: 'Bearer ',
  },

  // Configuración de validación
  VALIDATION: {
    // Contraseña
    PASSWORD_MIN_LENGTH: 8,
    MIN_PASSWORD_LENGTH: 8,
    PASSWORD_PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
    
    // Email
    EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    
    // Teléfono
    PHONE_LENGTH: 10,
    PHONE_PATTERN: /^\d{10}$/,
    PHONE_REGEX: /^\d{10}$/,
    
    // Nombre
    NAME_MIN_LENGTH: 3,
    MIN_NAME_LENGTH: 3,
    NAME_MAX_LENGTH: 50,
    MAX_NAME_LENGTH: 50,
    NAME_REGEX: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
    
    // Producto - Nombre
    PRODUCT_NAME_MIN_LENGTH: 3,
    PRODUCT_NAME_MAX_LENGTH: 100,
    
    // Producto - Descripción
    PRODUCT_DESCRIPTION_MAX_LENGTH: 500,
    MAX_PRODUCT_DESCRIPTION_WORDS: 100,
    
    // Precio
    PRICE_MIN: 0.01,
    PRICE_MAX: 999999.99,
    MAX_PRODUCT_PRICE: 999999.99,
    PRICE_REGEX: /^\d+(\.\d{1,2})?$/,
  },

  // Categorías de productos (SOLO COMIDA - ACTUALIZADO)
  CATEGORIES: [
    "Selecciona una categoría",
    
    // === COMIDA MEXICANA ===
    "🌮 Tacos",
    "🫔 Burritos y Quesadillas",
    "🥙 Tortas y Pambazo",
    "🍲 Pozole y Menudo",
    "🌶️ Enchiladas y Chilaquiles",
    "🫘 Frijoles y Sopes",
    "🌽 Elotes y Esquites",
    "🥗 Ensaladas Mexicanas",
    
    // === COMIDA RÁPIDA ===
    "🍔 Hamburguesas",
    "🍕 Pizza",
    "🌭 Hot Dogs",
    "🍟 Papas Fritas",
    "🥪 Sándwiches",
    "🍗 Pollo Frito",
    "🥙 Wraps y Rolls",
    
    // === COMIDA INTERNACIONAL ===
    "🍝 Pasta Italiana",
    "🍜 Comida Asiática",
    "🍱 Sushi y Comida Japonesa",
    "🥘 Comida Española",
    "🥗 Comida Mediterránea",
    "🍛 Comida Hindú",
    "🥟 Comida China",
    "🍲 Comida Tailandesa",
    
    // === ANTOJITOS Y BOTANAS ===
    "🍿 Palomitas",
    "🥨 Pretzels",
    "🧀 Nachos con Queso",
    "🌶️ Picantes y Sabritas",
    "🥜 Cacahuates y Nueces",
    "🍪 Galletas Saladas",
    
    // === POSTRES Y REPOSTERÍA ===
    "🍰 Pasteles",
    "🧁 Cupcakes",
    "🍩 Donas",
    "🥧 Pay y Tartas",
    "🍮 Flanes y Gelatinas",
    "🍨 Helados",
    "🍪 Galletas Dulces",
    "🍫 Chocolate y Dulces",
    "🧇 Waffles y Hotcakes",
    
    // === BEBIDAS ===
    "☕ Café",
    "🍵 Té",
    "🥤 Refrescos",
    "🧃 Jugos Naturales",
    "🥛 Leche y Bebidas Lácteas",
    "🧋 Bebidas de Boba",
    "🍹 Smoothies y Batidos",
    "💧 Agua y Bebidas Hidratantes",
    
    // === COMIDA SALUDABLE ===
    "🥗 Ensaladas Frescas",
    "🥙 Bowls Nutritivos",
    "🍇 Frutas Frescas",
    "🥑 Aguacate y Tostadas",
    "🥕 Vegetales al Vapor",
    "🍠 Camote y Tubérculos",
    
    // === VEGETARIANO Y VEGANO ===
    "🌱 Platillos Veganos",
    "🥬 Verduras Orgánicas",
    "🍄 Hongos y Setas",
    "🥜 Proteínas Vegetales",
    "🌾 Granos y Cereales",
    
    // === DESAYUNOS ===
    "🍳 Huevos al Gusto",
    "🥞 Hotcakes",
    "🥐 Pan Dulce",
    "🥓 Tocino y Salchichas",
    "🥣 Cereales y Avena",
    "🧈 Molletes",
    
    // === COMIDAS COMPLETAS ===
    "🍱 Comida Corrida",
    "🍛 Platillos del Día",
    "🍲 Sopas y Caldos",
    "🥘 Guisados Caseros",
    
    // === MARISCOS ===
    "🦐 Camarones",
    "🐟 Pescado Fresco",
    "🦀 Cangrejo y Langosta",
    "🦑 Ceviche y Aguachiles",
    "🍤 Coctel de Mariscos",
    
    // === CARNES ===
    "🥩 Carne Asada",
    "🍖 Carne al Pastor",
    "🥓 Tocino y Chorizo",
    "🍗 Pollo",
    "🐷 Carnitas y Chicharrón",
    
    // === PAN Y PANADERÍA ===
    "🥖 Pan Francés",
    "🥐 Pan Dulce",
    "🍞 Pan Blanco",
    "🥨 Pan Artesanal",
    "🧁 Panqués",
    
    // === OTROS ===
    "📦 Otro",
  ],

  // Configuración de rate limiting
  RATE_LIMIT: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 900000,
  },

  // Mensajes de error
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Error de conexión. Verifica tu internet.',
    SESSION_EXPIRED: 'Tu sesión ha expirado. Inicia sesión nuevamente.',
    INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
    ACCOUNT_LOCKED: 'Cuenta bloqueada temporalmente. Intenta más tarde.',
    SERVER_ERROR: 'Error del servidor. Intenta nuevamente.',
    VALIDATION_ERROR: 'Por favor verifica los datos ingresados.',
    UNAUTHORIZED: 'No tienes permisos para realizar esta acción.',
    NOT_FOUND: 'Recurso no encontrado.',
    TIMEOUT: 'La solicitud tardó demasiado. Intenta nuevamente.',
  },

  // Mensajes de éxito
  SUCCESS_MESSAGES: {
    LOGIN_SUCCESS: 'Inicio de sesión exitoso',
    REGISTER_SUCCESS: 'Cuenta creada exitosamente',
    LOGOUT_SUCCESS: 'Sesión cerrada correctamente',
    PRODUCT_CREATED: 'Producto publicado exitosamente',
    PRODUCT_UPDATED: 'Producto actualizado correctamente',
    PRODUCT_DELETED: 'Producto eliminado exitosamente',
  },

  // Configuración de imagen
  IMAGE: {
    MAX_SIZE: 5242880,
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png'],
    QUALITY: 0.7,
    MAX_WIDTH: 1200,
    MAX_HEIGHT: 1200,
  },

  // Roles de usuario
  ROLES: {
    USER: 'USER',
    ADMIN: 'ADMIN',
  },

  // Estados de usuario
  USER_STATUS: {
    ACTIVE: 1,
    INACTIVE: 2,
    SUSPENDED: 3,
  },

  // Configuración de la app
  APP: {
    NAME: 'UFood',
    VERSION: '1.0.0',
    ENVIRONMENT: 'production',
    DEBUG: false,
  },
};

Object.freeze(CONFIG);

export default CONFIG;