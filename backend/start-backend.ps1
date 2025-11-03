# Script de inicio del backend - Fauna Kids
# Ejecutar con: .\start-backend.ps1

Write-Host "=== Fauna Kids Backend ===" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "manage.py")) {
    Write-Host "Error: No se encontro manage.py" -ForegroundColor Red
    Write-Host "Ejecuta este script desde la carpeta backend/" -ForegroundColor Yellow
    exit 1
}

# Verificar variables de entorno
if (-not $env:GEMINI_API_KEY) {
    Write-Host "ADVERTENCIA: GEMINI_API_KEY no esta configurada" -ForegroundColor Yellow
    Write-Host "El backend funcionara en modo fallback (sin IA)" -ForegroundColor Yellow
    Write-Host ""
}

# Activar entorno virtual si existe
if (Test-Path ".venv\Scripts\Activate.ps1") {
    Write-Host "Activando entorno virtual..." -ForegroundColor Green
    & .\.venv\Scripts\Activate.ps1
} else {
    Write-Host "ADVERTENCIA: No se encontro entorno virtual en .venv/" -ForegroundColor Yellow
    Write-Host "Instala dependencias con: python -m venv .venv && .venv\Scripts\Activate.ps1 && pip install -r requirements.txt" -ForegroundColor Yellow
    Write-Host ""
}

# Ejecutar migraciones
Write-Host "Ejecutando migraciones..." -ForegroundColor Green
python manage.py migrate

# Iniciar servidor
Write-Host ""
Write-Host "Iniciando servidor en http://localhost:8000" -ForegroundColor Cyan
Write-Host "Presiona Ctrl+C para detener" -ForegroundColor Yellow
Write-Host ""
python manage.py runserver 0.0.0.0:8000
