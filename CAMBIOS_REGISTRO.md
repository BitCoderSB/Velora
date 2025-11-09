# Cambios Realizados en el Sistema de Registro

## 📊 Base de Datos

### Migración Ejecutada ✅
Se ejecutó la migración `001_update_schema.sql` que realizó los siguientes cambios:

#### Tabla `users`
- ✅ Agregado: `password` VARCHAR(120) - contraseña hasheada con bcrypt
- ✅ Eliminado: `payment_pointer` (ahora está en client_keys como `url`)
- ✅ Ajustado: `email` a VARCHAR(120)
- ✅ Ajustado: `nip` a VARCHAR(60) - se hashea con bcrypt

#### Tabla `client_profile`
- ✅ Agregado: `ciudad` VARCHAR(30)
- ✅ Agregado: `pais` VARCHAR(30)
- ✅ Eliminado: `fecha_nacimiento` 
- ✅ Eliminado: `telefono`

#### Tabla `vendor_profile`
- ✅ Agregado: `descripcion` TEXT

#### Tabla `client_keys`
- ✅ Agregado: `url` TEXT - Wallet URL de Interledger
- ✅ Mantenido: `key_id`, `public_key`, `private_key`
- ✅ Eliminado: `created_at`, `is_active`

#### Tablas de Reconocimiento Facial (MANTENIDAS) ✅
- `face_embeddings` - Almacena vectores faciales (512D)
- `face_auth_logs` - Logs de autenticación facial
- Ambas tablas tienen relación con `users.id`

---

## 🎨 Frontend

### RegisterPage.jsx ✅
**Campos actuales (ya estaba bien):**
- ✅ firstName (nombre)
- ✅ lastName (apellido)
- ✅ city (ciudad)
- ✅ country (país)
- ✅ email
- ✅ password
- ✅ confirmPassword

### Registro2Page.jsx ✅
**Campos actuales (ya estaba bien):**
- ✅ walletUrl (Payment Pointer de Interledger)
- ✅ keyId (Key ID de Interledger)
- ✅ pin (4 dígitos)
- ✅ confirmPin

### RegistroFacialPage.jsx ✅
**Cambios realizados:**
- ❌ Eliminado: Campos de formulario (nombre, teléfono, email)
- ✅ Agregado: Resumen de datos del usuario (muestra info de páginas anteriores)
- ✅ Actualizado: Componente ahora recibe `userData` completo
- ✅ Actualizado: Muestra: firstName, lastName, email, ciudad, país, walletUrl

### FaceCaptureONNX.jsx ✅
**Cambios realizados:**
- ❌ Eliminado: Props individuales (`nombre`, `email`)
- ✅ Agregado: Prop `userData` (objeto completo con todos los datos)
- ✅ Actualizado: Envía todos los datos del usuario al endpoint `/api/face/enroll`

---

## 🔧 Backend

### DTOs (`face.dtos.js`) ✅
**Actualizado EnrollDto para validar:**
```javascript
- email (requerido)
- password (mínimo 8 caracteres, requerido)
- firstName (requerido)
- lastName (requerido)
- city (requerido)
- country (requerido)
- walletUrl (requerido)
- keyId (requerido)
- pin (4 dígitos, requerido)
- embeddings (1-5 embeddings faciales, requerido)
- quality (opcional)
```

### Servicio (`face.service.js`) ✅
**Función `enroll` actualizada:**
- Recibe todos los nuevos campos
- Los pasa al repositorio para crear el usuario completo

### Repositorio (`face.repo.js`) ✅
**Función `ensureUserId` completamente reescrita:**

1. **Transacción atómica** - Usa BEGIN/COMMIT/ROLLBACK
2. **Verifica email duplicado** - Evita registros duplicados
3. **Hashea credenciales** - password y PIN con bcrypt (10 rounds)
4. **Crea usuario en 3 tablas:**
   - `users` → Credenciales y configuración
   - `client_profile` → Datos personales
   - `client_keys` → Información de Interledger

**Función `topK` actualizada:**
- Ahora hace JOIN con `users` y `client_profile` (nuevo esquema)
- Ya no usa la tabla legacy `clientes`

---

## 📦 Dependencias Agregadas

```bash
✅ bcrypt - Para hash de contraseñas y PIN
✅ pg - Cliente PostgreSQL (si no estaba)
```

---

## 🔄 Flujo Completo de Registro

```
1. RegisterPage.jsx
   └─> Usuario ingresa: firstName, lastName, city, country, email, password
   
2. Registro2Page.jsx  
   └─> Usuario ingresa: walletUrl, keyId, pin
   └─> Muestra resumen de datos anteriores
   
3. RegistroFacialPage.jsx
   └─> Muestra resumen completo de datos
   └─> Captura embeddings faciales con FaceCaptureONNX
   
4. FaceCaptureONNX.jsx
   └─> Captura 3 embeddings faciales
   └─> Envía POST a /api/face/enroll con TODOS los datos
   
5. Backend (/api/face/enroll)
   └─> Valida datos con EnrollDto (Zod)
   └─> Llama a face.service.enroll()
   └─> Ejecuta face.repo.ensureUserId() que:
       ├─> Hashea password y PIN
       ├─> Crea registro en users
       ├─> Crea registro en client_profile
       ├─> Crea registro en client_keys
       └─> Guarda embeddings en face_embeddings
   └─> Retorna user_id
```

---

## ⚠️ Notas Importantes

### Campos que necesitan atención futura:

1. **`client_keys.public_key` y `client_keys.private_key`**
   - Actualmente se guardan como strings vacíos
   - Se debe implementar la generación/obtención de llaves de Interledger
   - Considerar cifrado para `private_key`

2. **`client_profile.direccion`**
   - El campo existe pero no se usa en el formulario
   - Evaluar si es necesario agregarlo o eliminarlo

3. **Tabla `clientes` (legacy)**
   - Sigue existiendo en la BD pero ya no se usa
   - Considerar migrar datos antiguos y eliminar la tabla

---

## ✅ Verificación

Para probar el sistema completo:

1. **Frontend:** Ir a la página de registro
2. **Llenar RegisterPage:** Datos personales y credenciales
3. **Llenar Registro2Page:** Datos de Interledger
4. **RegistroFacialPage:** Capturar rostro
5. **Verificar en BD:**
   ```sql
   SELECT * FROM users WHERE email = 'test@example.com';
   SELECT * FROM client_profile WHERE user_id = X;
   SELECT * FROM client_keys WHERE client_user_id = X;
   SELECT * FROM face_embeddings WHERE user_id = X;
   ```

---

## 🔐 Seguridad

✅ Contraseñas hasheadas con bcrypt (10 rounds)
✅ PINs hasheados con bcrypt (10 rounds)
✅ Validación de datos con Zod
✅ Transacciones atómicas en BD
⚠️ TODO: Cifrar `private_key` en `client_keys`
⚠️ TODO: Implementar rate limiting en endpoints de registro
