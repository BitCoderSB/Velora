# Instrucciones de Instalación - FaceCaptureONNX

## Dependencias Requeridas

Ejecuta el siguiente comando en la carpeta `frontend`:

```bash
npm install onnxruntime-web @mediapipe/tasks-vision
```

## Estructura de Archivos

Asegúrate de tener la siguiente estructura:

```
frontend/
├── public/
│   └── models/
│       └── arcface.onnx          # Modelo ArcFace (descarga requerida)
├── src/
│   ├── components/
│   │   ├── FaceCaptureONNX.jsx   # ✅ Componente principal
│   │   └── pages/
│   │       ├── CobrarPage.jsx    # ✅ Página que integra el componente
│   │       ├── HomePage.jsx
│   │       └── WelcomePage.jsx
│   └── App.jsx
```

## Modelo ONNX

### Opción 1: Descargar modelo pre-entrenado
Descarga un modelo ArcFace ONNX de:
- https://github.com/onnx/models (buscar "arcface")
- https://github.com/deepinsight/insightface (modelos oficiales)

Coloca el archivo en: `frontend/public/models/arcface.onnx`

### Opción 2: Convertir modelo PyTorch/TensorFlow a ONNX
Si tienes un modelo ArcFace en otro formato, conviértelo usando:

```python
import torch
import torch.onnx

# Cargar tu modelo
model = ...  # tu modelo ArcFace
model.eval()

# Input dummy
dummy_input = torch.randn(1, 3, 112, 112)

# Exportar
torch.onnx.export(
    model,
    dummy_input,
    "arcface.onnx",
    input_names=['input'],
    output_names=['embeddings'],
    dynamic_axes={'input': {0: 'batch'}}
)
```

## Configuración del Backend

El componente espera que tu backend tenga los siguientes endpoints:

### POST /api/face/enroll
Request:
```json
{
  "nombre": "Juan Pérez",
  "nip_hash": "$argon2id$v=19$m=65536,t=3,p=4$...",
  "embeddings": [
    [0.123, -0.456, ...],  // 512 valores
    [0.234, -0.567, ...],
    [0.345, -0.678, ...]
  ]
}
```

Response:
```json
{
  "ok": true,
  "user_id": "usr_abc123"
}
```

### POST /api/face/verify
Request:
```json
{
  "emb": [0.123, -0.456, ...],  // 512 valores
  "pos_id": "POS-WEB",
  "liveness_ok": true
}
```

Response:
```json
{
  "match": true,
  "score": 0.8543,
  "user_id": "usr_abc123",
  "decision": "APPROVED"
}
```

## Verificación de WebGPU

Para verificar si el navegador soporta WebGPU, abre la consola del navegador y ejecuta:

```javascript
if ('gpu' in navigator) {
  console.log('✅ WebGPU disponible');
} else {
  console.log('⚠️ WebGPU no disponible, se usará WASM (más lento)');
}
```

### Navegadores con soporte WebGPU:
- Chrome/Edge 113+
- Firefox 119+ (experimental)

Si WebGPU no está disponible, el componente automáticamente usará WASM como fallback.

## Notas de Seguridad

1. **NIP Hash**: El componente NO genera el hash del NIP. Debes generarlo previamente con Argon2id.

2. **Imágenes**: El componente NO guarda imágenes en el frontend, solo embeddings.

3. **HTTPS**: Para usar la cámara en producción, necesitas HTTPS.

4. **CORS**: Asegúrate de que tu backend permita peticiones desde el origen del frontend.

## Personalización

### Cambiar dimensión del embedding
```jsx
<FaceCaptureONNX embeddingDim={256} />
```

### Cambiar ruta del modelo
```jsx
<FaceCaptureONNX modelPath="/custom/path/model.onnx" />
```

### Cambiar endpoints
```jsx
<FaceCaptureONNX 
  endpoints={{
    enroll: '/custom/enroll',
    verify: '/custom/verify'
  }}
/>
```

### Callbacks personalizados
```jsx
<FaceCaptureONNX 
  onEnrolled={(userId) => {
    alert(`Usuario ${userId} enrolado!`);
    // Tu lógica aquí
  }}
  onVerified={(result) => {
    if (result.match) {
      // Acceso concedido
    }
  }}
/>
```

## Troubleshooting

### Error: "No se detectó rostro"
- Asegúrate de tener buena iluminación
- Acerca tu rostro a la cámara
- Centra tu rostro en el óvalo guía

### Error: "Liveness check falló"
- Sigue las instrucciones en pantalla (parpadea o gira)
- Asegúrate de hacer movimientos visibles

### Error: "Error al cargar modelos"
- Verifica que el archivo `arcface.onnx` existe en `/public/models/`
- Revisa la consola del navegador para ver el error específico
- Verifica la conexión a internet (MediaPipe se descarga de CDN)

### Rendimiento lento
- Verifica que estás usando WebGPU (debe aparecer "WEBGPU" en la UI)
- Si usas WASM, considera usar un servidor más potente o reducir la frecuencia de detección

## Testing

Para probar el componente sin backend:

1. Comenta las llamadas `fetch` en los métodos `handleEnroll` y `handleVerify`
2. Simula respuestas:

```javascript
// En handleEnroll
const data = { ok: true, user_id: 'test_123' };

// En handleVerify
const data = { 
  match: true, 
  score: 0.95, 
  user_id: 'test_123',
  decision: 'APPROVED' 
};
```

## Producción

Antes de deployment:

1. ✅ Modelo ONNX incluido en `/public/models/`
2. ✅ Backend endpoints implementados
3. ✅ HTTPS habilitado
4. ✅ CORS configurado
5. ✅ Pruebas de liveness ajustadas
6. ✅ Logging y monitoring en backend
