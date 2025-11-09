# Modelo ArcFace

Este directorio debe contener el modelo ArcFace ONNX para el reconocimiento facial.

Archivo esperado: `arcface.onnx`

Para obtener el modelo:
1. Descargar desde: https://github.com/onnx/models/tree/main/vision/body_analysis/arcface
2. O usar un modelo personalizado entrenado
3. Colocar el archivo .onnx en esta carpeta

El componente FaceCaptureONNX busca el modelo en: `/models/arcface.onnx`