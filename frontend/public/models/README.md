# Modelos de face-api.js

Esta carpeta debe contener los modelos pre-entrenados de face-api.js para que el reconocimiento facial funcione.

## Modelos necesarios

Descarga los siguientes modelos desde el repositorio oficial de face-api.js:
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

### Modelos requeridos:

1. **tiny_face_detector_model-weights_manifest.json**
2. **tiny_face_detector_model-shard1**
3. **face_landmark_68_model-weights_manifest.json**
4. **face_landmark_68_model-shard1**
5. **face_recognition_model-weights_manifest.json**
6. **face_recognition_model-shard1**
7. **face_recognition_model-shard2**
8. **face_expression_model-weights_manifest.json**
9. **face_expression_model-shard1**

## Instalación rápida

### Opción 1: Descarga manual
1. Ve a: https://github.com/justadudewhohacks/face-api.js/tree/master/weights
2. Descarga todos los archivos mencionados arriba
3. Colócalos en esta carpeta `/public/models/`

### Opción 2: Usando PowerShell (Recomendado para Windows)
Ejecuta este script en PowerShell desde esta carpeta:

```powershell
$baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/"
$files = @(
    "tiny_face_detector_model-weights_manifest.json",
    "tiny_face_detector_model-shard1",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1",
    "face_recognition_model-shard2",
    "face_expression_model-weights_manifest.json",
    "face_expression_model-shard1"
)

foreach ($file in $files) {
    Write-Host "Descargando $file..."
    Invoke-WebRequest -Uri "$baseUrl$file" -OutFile $file
}

Write-Host "✅ Todos los modelos descargados correctamente"
```

## Verificación

Después de descargar, verifica que tengas estos archivos en esta carpeta:
- ✅ tiny_face_detector_model-weights_manifest.json
- ✅ tiny_face_detector_model-shard1
- ✅ face_landmark_68_model-weights_manifest.json
- ✅ face_landmark_68_model-shard1
- ✅ face_recognition_model-weights_manifest.json
- ✅ face_recognition_model-shard1
- ✅ face_recognition_model-shard2
- ✅ face_expression_model-weights_manifest.json
- ✅ face_expression_model-shard1

## Tamaño aproximado
Los modelos ocupan aproximadamente **5-10 MB** en total.