# Frontend - Skylikely

## Configuración Inicial

### 1. Modelo de Reconocimiento Facial

**IMPORTANTE**: Debes descargar el modelo ArcFace antes de usar el reconocimiento facial.

```bash
# Crear directorio si no existe
mkdir -p frontend/public/models/

# Descargar el modelo ArcFace (249 MB)
curl -L -o frontend/public/models/arcface.onnx "https://github.com/onnx/models/raw/main/validated/vision/body_analysis/arcface/model/arcface-resnet100-8.onnx"
```

### 2. Mapbox 3D Globe

Para habilitar el globo 3D con Mapbox, crea un archivo `.env.local` en `frontend/` con:

```
VITE_MAPBOX_TOKEN=tu_token_de_mapbox
```

Reinicia el servidor de desarrollo después de agregar el token. Luego cambia a modo 3D desde el conmutador en el panel.
