# 🔄 Integración CobrarPage con face-api.js - Guía Backend

## ✅ Cambios Realizados

### 1. **CobrarPage.jsx actualizado**
- ✅ Reemplazado `FaceCaptureONNX` por `FaceCaptureSimple`
- ✅ Modo solo verificación (sin registro)
- ✅ Extrae datos del usuario reconocido para el backend

### 2. **FaceCaptureSimple.jsx mejorado**
- ✅ Título dinámico según el modo (Registro vs Verificación)
- ✅ Instrucciones específicas para modo verificación
- ✅ Base de datos local oculta en modo verificación
- ✅ Solo muestra botón de "Reconocer Usuario"

## 📊 Flujo de Verificación

### Frontend (CobrarPage):
1. Usuario abre la página de cobro
2. Activa la cámara
3. Sistema detecta su rostro
4. Hace clic en "Reconocer Usuario"
5. **FaceCaptureSimple** compara con usuarios registrados localmente
6. Si hay coincidencia, extrae los datos del usuario
7. Llama a `onUserRecognized(user)` con los datos
8. **CobrarPage** prepara y envía los datos

### Estructura de Datos Retornados:

```javascript
verificationResult = {
  match: true,                          // Boolean: si hubo coincidencia
  user: {                               // Objeto del usuario reconocido
    id: "1731140000000",                // ID único
    firstName: "Juan",                  // Nombre
    lastName: "Pérez",                 // Apellido
    email: "juan@example.com",         // Email ⭐ IMPORTANTE PARA BACKEND
    descriptors: [Array(128), ...],    // Descriptores faciales
    registeredAt: "2025-11-09T..."     // Fecha de registro
  },
  // Datos extraídos para fácil acceso:
  email: "juan@example.com",           // ⭐ Email directo
  firstName: "Juan",                    // ⭐ Nombre directo
  lastName: "Pérez",                   // ⭐ Apellido directo
  userId: "1731140000000",             // ⭐ ID directo
  timestamp: "2025-11-09T04:30:00Z"   // Timestamp de verificación
}
```

## 🔧 Integración con Backend

### Opción 1: Enviar al Backend Inmediatamente

Modificar `CobrarPage.jsx`:

```javascript
onUserRecognized={async (user) => {
  console.log('✅ Cliente reconocido:', user);
  
  try {
    // Enviar al backend para verificación adicional
    const response = await fetch('/api/face/verify-customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        userId: user.id,
        timestamp: new Date().toISOString(),
        // Opcionalmente enviar descriptores para verificación adicional
        descriptor: user.descriptors[0]
      })
    });
    
    const backendResult = await response.json();
    
    if (backendResult.verified) {
      // Usuario verificado por el backend
      const verificationResult = {
        match: true,
        user: backendResult.user, // Datos completos desde el backend
        email: backendResult.user.email,
        firstName: backendResult.user.firstName,
        lastName: backendResult.user.lastName,
        userId: backendResult.user.id,
        // Agregar datos adicionales del backend
        wallet: backendResult.user.wallet,
        balance: backendResult.user.balance,
        timestamp: new Date().toISOString()
      };
      
      // Continuar con el flujo
      if (onVerified) {
        onVerified(verificationResult);
      }
    } else {
      // Usuario no verificado
      alert('No se pudo verificar tu identidad. Intenta de nuevo.');
    }
  } catch (error) {
    console.error('❌ Error al verificar con backend:', error);
    alert('Error de conexión. Intenta de nuevo.');
  }
}}
```

### Opción 2: Base de Datos Sincronizada

En lugar de usar la base de datos local, cargar usuarios desde el backend:

```javascript
// En FaceCaptureSimple.jsx, agregar useEffect para cargar desde backend

useEffect(() => {
  const loadUsersFromBackend = async () => {
    try {
      const response = await fetch('/api/face/users');
      const users = await response.json();
      
      // Convertir descriptores de string a Float32Array si es necesario
      const processedUsers = users.map(user => ({
        ...user,
        descriptors: user.descriptors.map(d => 
          typeof d === 'string' ? JSON.parse(d) : d
        )
      }));
      
      setUsersDatabase(processedUsers);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };
  
  // Solo cargar si no estamos en modo registro
  if (!userData) {
    loadUsersFromBackend();
  }
}, [userData]);
```

## 🗄️ Esquema de Base de Datos (Backend)

### Tabla: `usuarios_faciales`

```sql
CREATE TABLE usuarios_faciales (
  id VARCHAR(50) PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  
  -- Descriptores faciales (JSON array)
  face_descriptors JSON NOT NULL,
  
  -- Datos adicionales de usuario
  phone VARCHAR(20),
  city VARCHAR(100),
  country VARCHAR(100),
  wallet_address VARCHAR(255),
  payment_pointer VARCHAR(255),
  
  -- Metadatos
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_verification TIMESTAMP NULL,
  verification_count INT DEFAULT 0,
  
  -- Seguridad
  is_active BOOLEAN DEFAULT TRUE,
  blocked BOOLEAN DEFAULT FALSE,
  
  INDEX idx_email (email),
  INDEX idx_active (is_active)
);
```

### Tabla: `verificaciones_faciales` (Auditoría)

```sql
CREATE TABLE verificaciones_faciales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  
  -- Resultado de verificación
  verified BOOLEAN NOT NULL,
  confidence DECIMAL(5,2),
  distance DECIMAL(10,6),
  
  -- Metadata
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Contexto
  action VARCHAR(50), -- 'login', 'payment', 'verification', etc.
  
  FOREIGN KEY (user_id) REFERENCES usuarios_faciales(id),
  INDEX idx_user (user_id),
  INDEX idx_timestamp (timestamp)
);
```

## 🔌 Endpoints del Backend

### 1. **POST /api/face/register** - Registrar nuevo usuario con rostro

**Request:**
```json
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@example.com",
  "city": "Ciudad",
  "country": "País",
  "phone": "+1234567890",
  "wallet": "$wallet.example.com/juan",
  "paymentPointer": "$ilp.example.com/juan",
  "descriptors": [
    [0.123, 0.456, ...], // Array de 128 números
    [0.124, 0.457, ...],
    [0.125, 0.458, ...]
  ]
}
```

**Response:**
```json
{
  "success": true,
  "userId": "1731140000000",
  "message": "Usuario registrado exitosamente"
}
```

### 2. **POST /api/face/verify-customer** - Verificar cliente

**Request:**
```json
{
  "email": "juan@example.com",
  "userId": "1731140000000",
  "timestamp": "2025-11-09T04:30:00Z",
  "descriptor": [0.123, 0.456, ...] // Opcional: para verificación adicional
}
```

**Response (éxito):**
```json
{
  "verified": true,
  "user": {
    "id": "1731140000000",
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com",
    "wallet": "$wallet.example.com/juan",
    "paymentPointer": "$ilp.example.com/juan",
    "balance": 150.00,
    "city": "Ciudad",
    "country": "País"
  },
  "confidence": 0.95,
  "lastVerification": "2025-11-08T..."
}
```

**Response (fallo):**
```json
{
  "verified": false,
  "message": "Usuario no encontrado o inactivo",
  "error": "NOT_FOUND"
}
```

### 3. **GET /api/face/users** - Obtener usuarios registrados

**Response:**
```json
{
  "users": [
    {
      "id": "1731140000000",
      "firstName": "Juan",
      "lastName": "Pérez",
      "email": "juan@example.com",
      "descriptors": [
        "[0.123,0.456,...]",
        "[0.124,0.457,...]",
        "[0.125,0.458,...]"
      ],
      "registeredAt": "2025-11-09T..."
    }
  ]
}
```

### 4. **DELETE /api/face/users/:id** - Eliminar usuario

**Response:**
```json
{
  "success": true,
  "message": "Usuario eliminado"
}
```

## 🔒 Consideraciones de Seguridad

### 1. **Encriptación de Descriptores**
- Encriptar descriptores faciales en la base de datos
- Usar AES-256 o similar
- Mantener claves de encriptación seguras

### 2. **Rate Limiting**
- Limitar intentos de verificación por IP
- Máximo 5 intentos cada 10 minutos
- Bloquear temporalmente después de 10 fallos

### 3. **Auditoría**
- Registrar todas las verificaciones (exitosas y fallidas)
- Guardar IP, timestamp, user agent
- Alertar sobre patrones sospechosos

### 4. **HTTPS Obligatorio**
- Toda comunicación debe ser sobre HTTPS
- Validar certificados SSL
- Usar tokens JWT para autenticación

### 5. **GDPR/Privacidad**
- Consentimiento explícito del usuario
- Derecho al olvido (eliminar datos)
- Portabilidad de datos
- Notificación de brechas de seguridad

## 📝 Ejemplo Completo de Integración

### Frontend: `CobrarPage.jsx`
```javascript
import FaceCaptureSimple from '@components/FaceCaptureSimple.jsx';

export default function CobrarPage({ onBack, onVerified }) {
  const handleUserRecognized = async (user) => {
    try {
      // 1. Mostrar loading
      console.log('Verificando usuario...', user.email);
      
      // 2. Enviar al backend
      const response = await fetch('/api/face/verify-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          userId: user.id,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) throw new Error('Error de verificación');
      
      const result = await response.json();
      
      // 3. Verificar respuesta
      if (result.verified) {
        console.log('✅ Usuario verificado por backend:', result.user);
        
        // 4. Continuar con el flujo de cobro
        onVerified({
          match: true,
          user: result.user,
          email: result.user.email,
          wallet: result.user.wallet,
          balance: result.user.balance
        });
      } else {
        alert('No se pudo verificar tu identidad.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al verificar. Intenta de nuevo.');
    }
  };
  
  return (
    <div>
      {/* ... UI ... */}
      <FaceCaptureSimple
        modelsPath="/models"
        threshold={0.6}
        userData={null} // Modo verificación
        onUserRecognized={handleUserRecognized}
      />
    </div>
  );
}
```

### Backend: `face-routes.js` (Node.js/Express)
```javascript
router.post('/verify-customer', async (req, res) => {
  try {
    const { email, userId, timestamp } = req.body;
    
    // 1. Buscar usuario en BD
    const user = await db.query(
      'SELECT * FROM usuarios_faciales WHERE email = ? AND is_active = TRUE',
      [email]
    );
    
    if (!user.length) {
      return res.json({ verified: false, error: 'NOT_FOUND' });
    }
    
    // 2. Actualizar última verificación
    await db.query(
      'UPDATE usuarios_faciales SET last_verification = NOW(), verification_count = verification_count + 1 WHERE id = ?',
      [userId]
    );
    
    // 3. Registrar en auditoría
    await db.query(
      'INSERT INTO verificaciones_faciales (user_id, email, verified, timestamp, ip_address, action) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, email, true, timestamp, req.ip, 'payment']
    );
    
    // 4. Retornar datos del usuario
    res.json({
      verified: true,
      user: {
        id: user[0].id,
        firstName: user[0].first_name,
        lastName: user[0].last_name,
        email: user[0].email,
        wallet: user[0].wallet_address,
        paymentPointer: user[0].payment_pointer,
        balance: user[0].balance,
        city: user[0].city,
        country: user[0].country
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ verified: false, error: 'SERVER_ERROR' });
  }
});
```

## ✅ Checklist de Implementación

### Frontend:
- [x] Reemplazar FaceCaptureONNX con FaceCaptureSimple
- [x] Configurar modo verificación (userData = null)
- [x] Extraer email y datos del usuario reconocido
- [ ] Agregar llamada al endpoint de backend
- [ ] Manejar loading states
- [ ] Manejar errores de red
- [ ] Agregar retry logic

### Backend:
- [ ] Crear tabla `usuarios_faciales`
- [ ] Crear tabla `verificaciones_faciales`
- [ ] Implementar endpoint `/api/face/register`
- [ ] Implementar endpoint `/api/face/verify-customer`
- [ ] Implementar endpoint `/api/face/users`
- [ ] Agregar encriptación de descriptores
- [ ] Implementar rate limiting
- [ ] Agregar logging y auditoría
- [ ] Agregar tests

---

**Estado**: ✅ Frontend completado, listo para integración backend  
**Fecha**: 9 de noviembre, 2025
