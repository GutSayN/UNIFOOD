# 🍔 UFood - Plataforma de Venta de Alimentos

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.22-black.svg)](https://expo.dev/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Una aplicación móvil moderna para compra y venta de alimentos, construida con React Native y siguiendo la arquitectura MVVM.

## 📱 Características

### Para Usuarios
- ✅ Registro e inicio de sesión seguro
- 📸 Publicar productos con fotos
- 💬 Contacto directo por WhatsApp
- 🔍 Búsqueda y filtrado de productos
- 📱 Interfaz intuitiva y moderna
- 🔔 Notificaciones en tiempo real

### Para Administradores
- 👥 Gestión de usuarios
- 📊 Panel de estadísticas
- 🔒 Control de acceso
- ⚙️ Configuración del sistema

### Seguridad
- 🔐 Autenticación con tokens JWT
- 🔒 Almacenamiento encriptado
- ⏱️ Sesiones con timeout automático
- 🛡️ Protección contra ataques de fuerza bruta
- ✅ Validación exhaustiva de datos

## 🏗️ Arquitectura

Este proyecto implementa **MVVM (Model-View-ViewModel)** con los siguientes patrones:

- **Singleton:** Servicios únicos y compartidos
- **Repository:** Abstracción de acceso a datos
- **Interceptor:** Modificación automática de requests
- **Observer:** Reactividad con React Hooks
- **Factory:** Creación consistente de modelos
- **Strategy:** Validación flexible

Ver [ARCHITECTURE.md](./ARCHITECTURE.md) para detalles completos.

## 📋 Requisitos Previos

- Node.js >= 18.0.0
- npm o yarn
- Expo CLI
- Android Studio (para Android) o Xcode (para iOS)

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/GutSayN/UNIFOOD.git
cd unifood
```

### 2. Instalar dependencias

```bash
npm install
# o
yarn install
```

### 3. Configurar variables de entorno

Editar `src/config/app.config.js` con tus endpoints:

```javascript
const CONFIG = {
  API: {
    AUTH_BASE_URL: 'https://auth-microservice-tfql.onrender.com/api/auth',
    PRODUCTS_BASE_URL: 'https://products-microservice-a9b6.onrender.com/api/product',
  },
};
```

### 4. Iniciar la aplicación

```bash
# Desarrollo
npm start

# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

## 📁 Estructura del Proyecto

```
unifood/
├── src/
│   ├── config/           # Configuración centralizada
│   ├── models/           # Modelos de datos
│   ├── services/         # Lógica de negocio
│   ├── viewmodels/       # Lógica de presentación
│   ├── views/            # Componentes de UI
│   ├── navigation/       # Configuración de navegación
│   └── utils/            # Utilidades
├── assets/               # Imágenes y recursos
├── App.js               # Punto de entrada
└── package.json         # Dependencias
```

## 🔧 Configuración

### Configurar API URLs

Edita `src/config/app.config.js`:

```javascript
const CONFIG = {
  API: {
    AUTH_BASE_URL: 'https://auth-microservice-tfql.onrender.com/api/auth',
    PRODUCTS_BASE_URL: 'https://products-microservice-a9b6.onrender.com/api/product',
    TIMEOUT: 30000,
  },
  // ...
};
```

### Configurar Seguridad

```javascript
SECURITY: {
  SESSION_TIMEOUT: 3600000,        // 1 hora
  MAX_LOGIN_ATTEMPTS: 5,           // Máximo de intentos
  LOCKOUT_DURATION: 300000,        // 5 minutos de bloqueo
},
```

### Configurar Validaciones

```javascript
VALIDATION: {
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 40,
  MIN_NAME_LENGTH: 30,
  PHONE_LENGTH: 10,
  MAX_PRODUCT_PRICE: 100000,
},
```

## 💻 Uso

### Registro de Usuario

```javascript
import { useAuthViewModel } from './src/viewmodels/Auth.viewmodel';

const { register, isLoading, error } = useAuthViewModel();

const handleRegister = async () => {
  const result = await register({
    name: 'Juan Pérez García',
    email: 'juan@example.com',
    phoneNumber: '5512345678',
    password: 'Password123',
  });

  if (result.success) {
    // Navegar a login
  }
};
```

### Login

```javascript
const { login, user } = useAuthViewModel();

const handleLogin = async () => {
  const result = await login('juan@example.com', 'Password123');

  if (result.success) {
    if (result.isAdmin) {
      // Navegar a panel admin
    } else {
      // Navegar a home
    }
  }
};
```

### Crear Producto

```javascript
import { useProductViewModel } from './src/viewmodels/Product.viewmodel';

const { createProduct, pickImage } = useProductViewModel();

const handleCreate = async () => {
  const image = await pickImage();
  
  const result = await createProduct({
    name: 'Pizza Margarita',
    price: 150,
    description: 'Deliciosa pizza artesanal',
    categoryName: '🍕 Comida Rápida',
    image,
  }, userId);

  if (result.success) {
    // Mostrar éxito
  }
};
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Cobertura
npm run test:coverage

# Watch mode
npm run test:watch
```

### Ejemplo de Test

```javascript
import { User } from './src/models/User.model';

describe('User Model', () => {
  test('valida email correctamente', () => {
    const validation = User.validate({
      email: 'invalid-email',
      name: 'Test User',
      phoneNumber: '1234567890',
      password: 'Password123',
    });

    expect(validation.isValid).toBe(false);
    expect(validation.errors.email).toBeDefined();
  });
});
```

## 📦 Build para Producción

### Android

```bash
# Generar APK
npm run android -- --variant=release

# Generar AAB para Google Play
eas build --platform android
```

### iOS

```bash
# Generar IPA
eas build --platform ios
```

## 🔐 Seguridad

### Mejores Prácticas Implementadas

1. **Tokens JWT:** Autenticación basada en tokens
2. **Encriptación:** Datos sensibles encriptados
3. **Timeout de Sesión:** Cierre automático
4. **Rate Limiting:** Protección contra fuerza bruta
5. **Validación:** Datos validados en cliente y servidor
6. **Sanitización:** Prevención de inyecciones
7. **HTTPS:** Comunicación segura

### Recomendaciones Adicionales

- Usar HTTPS en producción
- Implementar 2FA (autenticación de dos factores)
- Agregar biometría (Touch ID/Face ID)
- Configurar Content Security Policy
- Implementar rate limiting en servidor
- Usar certificado SSL pinning

## 📊 Cumplimiento Google Play

### Requisitos Implementados

✅ Política de Privacidad publicada  
✅ Permisos justificados  
✅ Datos de usuario protegidos  
✅ Funcionalidad completa  
✅ No contiene malware  
✅ Interfaz responsive  

### Permisos Solicitados

```json
"permissions": [
  "android.permission.CAMERA",
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE"
]
```

**Justificación:**
- `CAMERA`: Para tomar fotos de productos
- `READ/WRITE_EXTERNAL_STORAGE`: Para seleccionar fotos de galería

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guía de Contribución

- Seguir la arquitectura MVVM
- Agregar tests para nuevas features
- Documentar cambios en código
- Actualizar README si es necesario

## 📝 Changelog

### v1.0.0 (2025-01-XX)

**Agregado:**
- ✨ Sistema de autenticación completo
- 🛍️ CRUD de productos
- 💬 Integración con WhatsApp
- 🔍 Búsqueda y filtrado
- 👨‍💼 Panel de administración

**Seguridad:**
- 🔐 Encriptación de datos
- ⏱️ Sesiones con timeout
- 🛡️ Protección contra ataques


**Template:**


**Entorno:**
- OS: [e.g. iOS 16, Android 13]
- Versión: [e.g. 1.0.0]
```

## 🙏 Agradecimientos

- React Native Team
- Expo Team
- Comunidad de código abierto

## 📞 Contacto

- Email: ufoodmabn@gmail.com


## 📚 Documentación Adicional

- [Guía de Arquitectura](./ARCHITECTURE.md)

---

⭐ **¡Si te gusta este proyecto, dale una estrella!** ⭐