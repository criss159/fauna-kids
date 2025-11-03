# ============================================
# 🐘 Script de Setup PostgreSQL - Fauna Kids
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🐘 SETUP POSTGRESQL - FAUNA KIDS" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Función para mostrar mensajes de error
function Show-Error {
    param([string]$Message)
    Write-Host "❌ ERROR: $Message" -ForegroundColor Red
    exit 1
}

# Función para mostrar mensajes de éxito
function Show-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

# Función para mostrar advertencias
function Show-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

# ============================================
# PASO 1: Verificar PostgreSQL instalado
# ============================================

Write-Host "🔍 Verificando instalación de PostgreSQL..." -ForegroundColor Yellow

try {
    $pgVersion = psql --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Show-Success "PostgreSQL instalado: $pgVersion"
    } else {
        throw "PostgreSQL no encontrado"
    }
} catch {
    Show-Error "PostgreSQL no está instalado.`nInstala desde: https://www.postgresql.org/download/windows/`nO con Chocolatey: choco install postgresql"
}

# ============================================
# PASO 2: Verificar Python y pip
# ============================================

Write-Host "`n🔍 Verificando Python..." -ForegroundColor Yellow

try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Show-Success "Python instalado: $pythonVersion"
    } else {
        throw "Python no encontrado"
    }
} catch {
    Show-Error "Python no está instalado."
}

# ============================================
# PASO 3: Solicitar credenciales de PostgreSQL
# ============================================

Write-Host "`n🔐 Configuración de PostgreSQL" -ForegroundColor Cyan
Write-Host "────────────────────────────────`n" -ForegroundColor Cyan

$dbUser = Read-Host "Usuario de PostgreSQL (default: postgres)"
if ([string]::IsNullOrWhiteSpace($dbUser)) {
    $dbUser = "postgres"
}

$dbPassword = Read-Host "Password de PostgreSQL" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

$dbName = Read-Host "Nombre de la base de datos (default: fauna_kids)"
if ([string]::IsNullOrWhiteSpace($dbName)) {
    $dbName = "fauna_kids"
}

# ============================================
# PASO 4: Crear base de datos
# ============================================

Write-Host "`n📦 Creando base de datos '$dbName'..." -ForegroundColor Yellow

$env:PGPASSWORD = $dbPasswordPlain

# Verificar si la base de datos ya existe
$dbExists = psql -U $dbUser -lqt 2>&1 | Select-String -Pattern "^\s*$dbName\s*\|"

if ($dbExists) {
    Show-Warning "La base de datos '$dbName' ya existe."
    $overwrite = Read-Host "¿Deseas recrearla? (s/N)"
    
    if ($overwrite -eq "s" -or $overwrite -eq "S") {
        Write-Host "🗑️  Eliminando base de datos existente..." -ForegroundColor Yellow
        psql -U $dbUser -c "DROP DATABASE IF EXISTS $dbName;" 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Show-Success "Base de datos eliminada"
        }
    } else {
        Show-Warning "Usando base de datos existente"
    }
}

# Crear base de datos
if (-not $dbExists -or $overwrite -eq "s" -or $overwrite -eq "S") {
    Write-Host "🔨 Creando base de datos..." -ForegroundColor Yellow
    psql -U $dbUser -c "CREATE DATABASE $dbName WITH ENCODING='UTF8';" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Show-Success "Base de datos $dbName creada"
    } else {
        Show-Error "No se pudo crear la base de datos"
    }
}

# Habilitar extensión UUID
Write-Host "🔧 Habilitando extensión uuid-ossp..." -ForegroundColor Yellow
psql -U $dbUser -d $dbName -c "CREATE EXTENSION IF NOT EXISTS `"uuid-ossp`";" 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Show-Success "Extensión uuid-ossp habilitada"
} else {
    Show-Error "No se pudo habilitar la extensión uuid-ossp"
}

# ============================================
# PASO 5: Configurar archivo .env
# ============================================

Write-Host "`n⚙️  Configurando archivo .env..." -ForegroundColor Yellow

$envPath = ".\.env"
$envExamplePath = ".\.env.example"

# Verificar si .env ya existe
if (Test-Path $envPath) {
    Show-Warning "El archivo .env ya existe"
    $overwriteEnv = Read-Host "¿Deseas sobrescribirlo? (s/N)"
    
    if ($overwriteEnv -ne "s" -and $overwriteEnv -ne "S") {
        Write-Host "ℹ️  Manteniendo archivo .env existente" -ForegroundColor Blue
        $skipEnv = $true
    }
}

if (-not $skipEnv) {
    # Leer .env.example
    if (Test-Path $envExamplePath) {
        $envContent = Get-Content $envExamplePath -Raw
        
        # Reemplazar valores
        $envContent = $envContent -replace 'USE_POSTGRES=False', 'USE_POSTGRES=True'
        $envContent = $envContent -replace 'DB_NAME=fauna_kids', "DB_NAME=$dbName"
        $envContent = $envContent -replace 'DB_USER=postgres', "DB_USER=$dbUser"
        $envContent = $envContent -replace 'DB_PASSWORD=tu_password_aqui', "DB_PASSWORD=$dbPasswordPlain"
        
        # Guardar .env
        $envContent | Set-Content $envPath -Encoding UTF8
        Show-Success "Archivo .env creado"
    } else {
        Show-Warning "No se encontró .env.example"
    }
}

Remove-Variable -Name dbPasswordPlain -ErrorAction SilentlyContinue

# ============================================
# PASO 6: Instalar dependencias de Python
# ============================================

Write-Host "`n📦 Instalando dependencias de Python..." -ForegroundColor Yellow

pip install psycopg2-binary --quiet 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Show-Success "psycopg2-binary instalado"
} else {
    Show-Warning "psycopg2-binary ya estaba instalado o hubo un error"
}

# ============================================
# PASO 7: Ejecutar migraciones
# ============================================

Write-Host "`n🔄 Ejecutando migraciones de Django..." -ForegroundColor Yellow

python migrate_to_postgres.py

if ($LASTEXITCODE -eq 0) {
    Show-Success "Migraciones completadas"
} else {
    Show-Error "Error al ejecutar migraciones"
}

# ============================================
# PASO 8: Mensaje final
# ============================================

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "✅ SETUP COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "📝 Próximos pasos:`n" -ForegroundColor Yellow
Write-Host "  1. Crear superusuario:" -ForegroundColor White
Write-Host "     python manage.py createsuperuser`n" -ForegroundColor Gray

Write-Host "  2. Iniciar servidor:" -ForegroundColor White
Write-Host "     python manage.py runserver`n" -ForegroundColor Gray

Write-Host "  3. Abrir admin:" -ForegroundColor White
Write-Host "     http://localhost:8000/admin`n" -ForegroundColor Gray

Write-Host "PostgreSQL esta listo para usar!" -ForegroundColor Green

# Limpiar variables de entorno
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
