# Arquitectura MVVM - UFood

## Descripción General

Esta aplicación sigue el patrón de arquitectura **MVVM (Model-View-ViewModel)** combinado con patrones de diseño adicionales para asegurar escalabilidad, mantenibilidad y seguridad.

## Estructura del Proyecto

```
UNIFOOD/
├── src/
│   ├── config/               # Configuración centralizada
│   │   └── app.config.js
│   │
│   ├── models/               # Modelos de datos (Entity)
│   │   ├── User.model.js
│   │   └── Product.model.js
│   │
│   ├── services/             # Servicios (Business Logic)
│   │   ├── Storage.service.js
│   │   ├── Http.service.js
│   │   ├── Auth.service.js
│   │   └── Product.service.js
│   │
│   ├── viewmodels/           # ViewModels (Presentation Logic)
│   │   ├── Auth.viewmodel.js
│   │   └── Product.viewmodel.js
│   │
│   ├── views/                # Views (UI Components)
│   │   ├── auth/
│   │   │   ├── LoginScreen.js
│   │   │   └── RegisterScreen.js
│   │   ├── home/
│   │   │   ├── HomeScreen.js
│   │   │   └── AdminHomeScreen.js
│   │   └── products/
│   │       ├── ProductsListScreen.js
│   │       └── ProductFormScreen.js
│   │
│   ├── navigation/           # Navegación
│   │   └── AppNavigator.js
│   │
│   ├── utils/                # Utilidades
│   │   ├── Validation.utils.js
│   │   └── Format.utils.js
│   │
│   └── constants/            # Constantes
│       └── Colors.js
│
├── App.js
└── package.json
```

## Patrones de Diseño Implementados

### 1. MVVM (Model-View-ViewModel)

**Propósito:** Separar la lógica de presentación de la lógica de negocio

**Implementación:**
- **Model:** Clases que representan datos y lógica de validación (`User.model.js`, `Product.model.js`)
- **View:** Componentes React Native que renderizan la UI
- **ViewModel:** Hooks personalizados que manejan el estado y la lógica de presentación

**Beneficios:**
- Separación clara de responsabilidades
- Facilita pruebas unitarias
- Reutilización de lógica
- Mantenibilidad mejorada

### 2. Singleton

**Propósito:** Asegurar una única instancia de servicios críticos

**Implementación:**
```javascript
class HttpService {
  constructor() {
    if (HttpService.instance) {
      return HttpService.instance;
    }
    HttpService.instance = this;
  }
}
```

**Aplicado en:**
- `Storage.service.js`
- `Http.service.js`
- `Auth.service.js`
- `Product.service.js`

**Beneficios:**
- Control de acceso global
- Estado compartido consistente
- Eficiencia en uso de recursos

### 3. Repository Pattern

**Propósito:** Abstraer el acceso a datos

**Implementación:**
- Los servicios actúan como repositorios
- Encapsulan lógica de acceso a APIs
- Transforman respuestas en modelos

**Beneficios:**
- Cambio de fuente de datos sin afectar lógica
- Testing más sencillo con mocks
- Centralización de lógica de datos

### 4. Interceptor Pattern

**Propósito:** Modificar requests/responses de manera centralizada

**Implementación:**
```javascript
httpService.addRequestInterceptor(async (config) => {
  const token = await storageService.getItem(STORAGE_KEYS.USER_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Aplicado en:**
- `Http.service.js` para autenticación automática
- Actualización de actividad de sesión
- Logging de requests

**Beneficios:**
- Lógica centralizada de autenticación
- Manejo consistente de errores
- Extensibilidad

### 5. Observer Pattern (via Hooks)

**Propósito:** Notificar cambios de estado a la UI

**Implementación:**
- React Hooks (`useState`, `useCallback`)
- Los ViewModels exponen estado observable
- Las Views se re-renderizan automáticamente

**Beneficios:**
- Reactividad automática
- Código declarativo
- Sincronización de UI

### 6. Factory Pattern (implícito)

**Propósito:** Crear instancias de modelos

**Implementación:**
```javascript
static fromStorage(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    return new User(data);
  } catch (error) {
    return null;
  }
}
```

**Beneficios:**
- Validación en construcción
- Transformación consistente
- Encapsulación de lógica

### 7. Strategy Pattern (validación)

**Propósito:** Validación flexible y extensible

**Implementación:**
```javascript
static validate(data) {
  const errors = {};
  // Diferentes estrategias de validación
  // según tipo de dato
  return { isValid, errors };
}
```

**Beneficios:**
- Validación reutilizable
- Fácil agregar nuevas reglas
- Testeable

## Flujo de Datos

```
┌──────────┐
│   View   │ (User Interaction)
└────┬─────┘
     │
     ▼
┌──────────────┐
│  ViewModel   │ (Presentation Logic)
└────┬─────────┘
     │
     ▼
┌──────────────┐
│   Service    │ (Business Logic)
└────┬─────────┘
     │
     ▼
┌──────────────┐
│     API      │ (External Data)
└────┬─────────┘
     │
     ▼
┌──────────────┐
│    Model     │ (Data Transformation)
└────┬─────────┘
     │
     ▼
┌──────────────┐
│  ViewModel   │ (State Update)
└────┬─────────┘
     │
     ▼
┌──────────────┐
│    View      │ (UI Update)
└──────────────┘
```

## Ejemplo de Uso

### Login Flow

```javascript
// 1. View dispara acción
const handleLogin = async () => {
  const result = await authViewModel.login(email, password);
  
  if (result.success) {
    navigation.navigate('Home');
  } else {
    Alert.alert('Error', result.error);
  }
};

// 2. ViewModel procesa
const login = async (email, password) => {
  setIsLoading(true);
  const result = await authService.login(email, password);
  setUser(result.user);
  return result;
};

// 3. Service ejecuta lógica
const login = async (email, password) => {
  const response = await httpService.post('/login', { email, password });
  const user = new User(response.user);
  await saveSession(response.token, user);
  return { success: true, user };
};

// 4. Model valida y transforma
class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    // ...
  }
}
```

## Seguridad Implementada

### 1. Almacenamiento Encriptado
- Datos sensibles encriptados en AsyncStorage
- Keys con prefijo de app (`@unifood:`)

### 2. Sesiones Seguras
- Timeout automático (1 hora)
- Verificación constante de actividad
- Logout automático al expirar

### 3. Manejo de Intentos Fallidos
- Máximo 5 intentos de login
- Bloqueo temporal de 5 minutos

### 4. Validación de Datos
- Validación en cliente y servidor
- Sanitización de inputs
- Prevención de inyecciones

### 5. Tokens de Autenticación
- Bearer tokens en headers
- Interceptores automáticos
- Refresh token (preparado para implementar)

## Testing

### Pruebas Unitarias (Recomendadas)

```javascript
// Models
test('User.validate() rechaza email inválido', () => {
  const result = User.validate({ email: 'invalid' });
  expect(result.isValid).toBe(false);
});

// Services
test('AuthService.login() retorna usuario válido', async () => {
  const result = await authService.login('test@test.com', 'password');
  expect(result.user).toBeDefined();
});

// ViewModels
test('useAuthViewModel login actualiza estado', async () => {
  const { login, user } = useAuthViewModel();
  await login('test@test.com', 'password');
  expect(user).toBeDefined();
});
```

## Mejores Prácticas

### 1. Nomenclatura
- **Models:** `Entity.model.js`
- **Services:** `Service.service.js`
- **ViewModels:** `Feature.viewmodel.js`
- **Views:** `FeatureScreen.js`

### 2. Estructura de Archivos
- Un archivo por clase/componente
- Exports con nombre para utilidades
- Default export para componentes principales

### 3. Manejo de Errores
```javascript
try {
  // Lógica
} catch (error) {
  console.error('Context:', error);
  throw new Error('User-friendly message');
}
```

### 4. Estado Inmutable
```javascript
// ✅ Correcto
setProducts(prev => [...prev, newProduct]);

// ❌ Incorrecto
products.push(newProduct);
setProducts(products);
```

### 5. Separación de Responsabilidades
- Views: Solo renderizado
- ViewModels: Lógica de presentación
- Services: Lógica de negocio
- Models: Validación y transformación

## Escalabilidad

Esta arquitectura facilita:

1. **Agregar nuevas features:** Crear Model + Service + ViewModel + View
2. **Cambiar backend:** Modificar solo Services
3. **Cambiar UI:** Modificar solo Views
4. **Agregar tests:** Cada capa es testeable independientemente
5. **Trabajar en equipo:** Responsabilidades claras

## Próximos Pasos

1. Implementar tests unitarios
2. Agregar manejo de offline
3. Implementar refresh token
4. Agregar analytics
5. Implementar notificaciones push
6. Agregar modo oscuro
7. Implementar caché de imágenes
8. Agregar internacionalización (i18n)

## Referencias

- [MVVM Pattern](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93viewmodel)
- [React Native Best Practices](https://reactnative.dev/docs/performance)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)