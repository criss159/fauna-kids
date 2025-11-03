# Backend Django para Fauna Kids

Backend REST API con integración de Google Gemini AI para:
- 🤖 Respuestas educativas sobre animales
- 🎨 Generación de imágenes educativas

## 📋 Requisitos

- Python 3.10+
- API Key de Google Gemini ([Obtener aquí](https://aistudio.google.com/apikey))

## 🚀 Inicio Rápido

### 1. Crear entorno virtual e instalar dependencias

```powershell
# Crear entorno virtual
python -m venv .venv

# Activar entorno virtual
.\.venv\Scripts\Activate.ps1

# Instalar dependencias
pip install -r requirements.txt
```

### 2. Configurar variables de entorno

```powershell
# Configurar API Key de Gemini (REQUERIDO)
$env:GEMINI_API_KEY = "tu_clave_api_aqui"

# Configurar origen del frontend (opcional)
$env:FRONTEND_ORIGIN = "http://localhost:5173"

# Configurar modelos (opcional, defaults disponibles)
$env:GEMINI_TEXT_MODEL = "gemini-2.0-flash-exp"
$env:GEMINI_IMAGE_MODEL = "gemini-2.0-flash-exp"
```

**⚠️ Importante:** Las variables de entorno solo existen en la sesión actual de PowerShell.
Debes ejecutar `runserver` en la misma ventana donde configuraste las variables.

### 3. Ejecutar migraciones y servidor

```powershell
# Aplicar migraciones
python manage.py migrate

# Iniciar servidor
python manage.py runserver 0.0.0.0:8000
```

**O usa el script automático:**

```powershell
.\start-backend.ps1
```

## 📡 Endpoints

### GET /api/health
Verifica el estado del backend y configuración

**Respuesta:**
```json
{
  "ok": true,
  "hasKey": true,
  "keyLen": 39,
  "keyPreview": "AIzaSy...iXU",
  "textModel": "gemini-2.0-flash-exp",
  "imageModel": "gemini-2.0-flash-exp"
}
```

### GET /api/explorer/?q={consulta}
Consulta educativa sobre animales

**Parámetros:**
- `q`: Pregunta sobre un animal (ej: "pingüino", "¿Qué come el león?")

**Respuesta:**
```json
{
  "answer": "El pingüino es un ave marina que vive en el hemisferio sur..."
}
```

### POST /api/images/generate
Genera imagen educativa de un animal

**Body:**
```json
{
  "prompt": "un león en la sabana",
  "size": "768x768"
}
```

**Respuesta:**
```json
{
  "imageBase64": "iVBORw0KGgoAAAANS...",
  "mime": "image/png"
}
```

## 🔧 Configuración

### Variables de Entorno

| Variable | Descripción | Requerido | Default |
|----------|-------------|-----------|---------|
| `GEMINI_API_KEY` | API Key de Google Gemini | ✅ Sí | - |
| `GEMINI_TEXT_MODEL` | Modelo para texto | ❌ No | `gemini-2.0-flash-exp` |
| `GEMINI_IMAGE_MODEL` | Modelo para imágenes | ❌ No | `gemini-2.0-flash-exp` |
| `FRONTEND_ORIGIN` | URL del frontend para CORS | ❌ No | `http://localhost:5173` |

### Modo Fallback

Si no se configura `GEMINI_API_KEY`, el backend funcionará en modo fallback:
- ✅ Las consultas de texto devolverán respuestas genéricas
- ❌ La generación de imágenes fallará (error 500)

## 🐛 Troubleshooting

### Error: "Falta GEMINI_API_KEY"
- Asegúrate de configurar la variable en la misma sesión de PowerShell
- Verifica con: `echo $env:GEMINI_API_KEY`

### Error: CORS
- Verifica que `FRONTEND_ORIGIN` coincida con la URL de tu frontend
- Por defecto es `http://localhost:5173` (Vite default)

### Error: "ModuleNotFoundError"
- Activa el entorno virtual: `.\.venv\Scripts\Activate.ps1`
- Reinstala dependencias: `pip install -r requirements.txt`

## 📦 Dependencias Principales

- `Django 5.2.5` - Framework web
- `djangorestframework 3.16.1` - API REST
- `django-cors-headers 4.7.0` - Manejo de CORS
- `requests 2.31.0+` - Cliente HTTP para Gemini API

## 🔐 Seguridad

**⚠️ IMPORTANTE para producción:**

1. Cambiar `SECRET_KEY` en `settings.py`
2. Configurar `DEBUG = False`
3. Actualizar `ALLOWED_HOSTS`
4. Usar variables de entorno persistentes
5. Configurar HTTPS y certificados SSL

## �️ Base de Datos

### Configuración Rápida (SQLite - Desarrollo)

Por defecto, el proyecto usa SQLite para desarrollo rápido:

```powershell
# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Iniciar servidor
python manage.py runserver
```

### PostgreSQL (Producción)

Para usar PostgreSQL, consulta la guía completa: **[POSTGRESQL_SETUP.md](POSTGRESQL_SETUP.md)**

**Resumen rápido:**

1. Instalar PostgreSQL
2. Crear base de datos: `CREATE DATABASE fauna_kids;`
3. Configurar `.env`:
   ```bash
   USE_POSTGRES=True
   DB_PASSWORD=tu_password
   ```
4. Migrar: `python manage.py migrate`

### Modelos de Datos

El sistema incluye modelos completos para:

- **👤 Usuarios**: Registrados (con email) e invitados (sin persistencia)
- **💬 Chat**: Sesiones y mensajes con historial completo
- **📊 Progreso**: Estadísticas, rachas, niveles y puntos
- **🐾 Animales**: Explorados, favoritos y contador de visitas
- **🎨 Imágenes**: Galería de imágenes generadas por IA
- **🏆 Logros**: Sistema de achievements y gamificación
- **🕶️ Invitados**: Sesiones temporales (24h) auto-eliminadas

Ver diseño completo: **[DATABASE_DESIGN.md](DATABASE_DESIGN.md)**

### Comandos de Gestión

```powershell
# Cargar logros iniciales
python manage.py load_achievements

# Limpiar sesiones de invitados expiradas
python manage.py cleanup_guest_sessions

# Acceder al panel de administración
# http://127.0.0.1:8000/admin
```

## �📝 Notas

- El backend usa SQLite por defecto (desarrollo), PostgreSQL en producción
- Las consultas tienen timeout de 30 segundos
- Las imágenes se generan en formato PNG base64
- El sistema usa reintentos automáticos en caso de errores de red
- Usuarios registrados: historial completo y persistencia
- Usuarios invitados: sesión temporal sin persistencia (como ChatGPT sin login)

