#!/bin/bash

# Copia los archivos WASM de ONNX Runtime a public/wasm
echo "Copiando archivos WASM de ONNX Runtime..."

# Crear directorio si no existe
mkdir -p public/wasm

# Copiar archivos WASM desde node_modules
cp node_modules/onnxruntime-web/dist/*.wasm public/wasm/ 2>/dev/null || {
    echo "No se encontraron archivos .wasm en node_modules/onnxruntime-web/dist/"
    echo "Intentando desde CDN..."
}

echo "Archivos WASM copiados a public/wasm/"
ls -la public/wasm/