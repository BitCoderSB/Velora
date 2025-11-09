# Modelo ArcFace para Reconocimiento Facial

Este directorio debe contener el modelo ArcFace ONNX (249 MB) para el reconocimiento facial.

## Descargar el Modelo

**Archivo esperado**: `arcface.onnx`

### Opción 1: Descarga directa
```bash
curl -L -o arcface.onnx "https://github.com/onnx/models/raw/main/validated/vision/body_analysis/arcface/model/arcface-resnet100-8.onnx"
```

### Opción 2: Descarga manual
1. Ir a: https://github.com/onnx/models/tree/main/validated/vision/body_analysis/arcface
2. Descargar `arcface-resnet100-8.onnx` 
3. Renombrar a `arcface.onnx`
4. Colocar en este directorio

## Nota
Este archivo está excluido del control de versiones debido a su gran tamaño (249 MB).

El componente FaceCaptureONNX busca el modelo en: `/models/arcface.onnx`