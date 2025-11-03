# Script de Limpieza - Fauna Kids
# Elimina archivos temporales y consolida documentacion

Write-Host "Iniciando limpieza del proyecto Fauna Kids..." -ForegroundColor Cyan

# Archivos markdown temporales a eliminar
$tempDocs = @(
    "ANALISIS_TABLAS_BD.md",
    "ANIMALES_EXPLORADOS_IMPLEMENTADO.md",
    "CHAT_DATABASE_IMPLEMENTATION.md",
    "CONFIGURACION_GOOGLE_CLOUD.md",
    "CORRECCIONES_OAUTH.md",
    "DEBUG_AVATAR.md",
    "DEBUG_LOGIN_GOOGLE.md",
    "GOOGLE_OAUTH_SETUP_COMPLETE.md",
    "GUIA_BD_LIMPIA.md",
    "INTEGRACION_COMPLETA.md",
    "RESUMEN_CHAT_DB.md"
)

$deleted = 0
$notFound = 0

foreach ($file in $tempDocs) {
    $path = Join-Path $PSScriptRoot $file
    if (Test-Path $path) {
        Remove-Item $path -Force
        Write-Host "  Eliminado: $file" -ForegroundColor Green
        $deleted++
    } else {
        Write-Host "  No encontrado: $file" -ForegroundColor Yellow
        $notFound++
    }
}

Write-Host "`nResumen:" -ForegroundColor Cyan
Write-Host "  Archivos eliminados: $deleted" -ForegroundColor Green
Write-Host "  No encontrados: $notFound" -ForegroundColor Yellow

Write-Host "`nLimpieza completada!" -ForegroundColor Green
Write-Host "Documentacion consolidada en: DOCUMENTATION.md" -ForegroundColor Cyan
Write-Host "Documentacion README.md actualizado" -ForegroundColor Cyan

# Opcional: Limpiar archivos __pycache__ y .pyc
Write-Host "`nDesea limpiar archivos cache de Python? (S/N): " -ForegroundColor Yellow -NoNewline
$response = Read-Host

if ($response -eq 'S' -or $response -eq 's') {
    Write-Host "Limpiando cache de Python..." -ForegroundColor Cyan
    Get-ChildItem -Path ".\backend" -Recurse -Include "__pycache__","*.pyc" | Remove-Item -Recurse -Force
    Write-Host "Cache de Python limpiado" -ForegroundColor Green
}

Write-Host "`nTodo listo!" -ForegroundColor Green
