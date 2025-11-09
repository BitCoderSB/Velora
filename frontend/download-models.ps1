# Script para descargar modelos de face-api.js
# Ejecuta este script desde PowerShell: .\download-models.ps1

Write-Host "🔽 Descargando modelos de face-api.js..." -ForegroundColor Cyan

# Crear directorio si no existe
$modelsDir = "public\models"
if (-not (Test-Path $modelsDir)) {
    New-Item -ItemType Directory -Path $modelsDir -Force | Out-Null
    Write-Host "✅ Directorio $modelsDir creado" -ForegroundColor Green
}

# Cambiar al directorio de modelos
Set-Location $modelsDir

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

$downloaded = 0
$failed = 0

foreach ($file in $files) {
    try {
        Write-Host "📥 Descargando $file..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri "$baseUrl$file" -OutFile $file -ErrorAction Stop
        Write-Host "   ✅ $file descargado" -ForegroundColor Green
        $downloaded++
    }
    catch {
        Write-Host "   ❌ Error descargando $file" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Descarga completada" -ForegroundColor Green
Write-Host "   Archivos descargados: $downloaded" -ForegroundColor Green
if ($failed -gt 0) {
    Write-Host "   Archivos fallidos: $failed" -ForegroundColor Red
}
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 ¡Listo! Ahora puedes ejecutar: npm run dev" -ForegroundColor Green

# Regresar al directorio anterior
Set-Location ..\..
