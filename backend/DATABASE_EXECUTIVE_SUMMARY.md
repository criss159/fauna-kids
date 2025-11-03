# 🎯 Resumen Ejecutivo: Base de Datos PostgreSQL - Fauna Kids

## 📊 Visión General

Fauna Kids utiliza **PostgreSQL** como base de datos principal para gestionar usuarios, historial de chat, logros y estadísticas. El sistema diferencia claramente entre **usuarios registrados** (con Google OAuth) y **usuarios invitados** (sesión temporal).

---

## 🗂️ Estructura de la Base de Datos

### **10 Tablas Principales**

| # | Tabla | Propósito | Registrados | Invitados |
|---|-------|-----------|-------------|-----------|
| 1 | `users` | Datos de autenticación y perfil | ✅ | ✅ (temporal) |
| 2 | `user_settings` | Preferencias personalizadas | ✅ | ❌ |
| 3 | `user_progress` | Estadísticas y progreso | ✅ | ❌ |
| 4 | `chat_sessions` | Agrupación de conversaciones | ✅ | ❌ |
| 5 | `chat_history` | Mensajes guardados | ✅ | ❌ |
| 6 | `animals_explored` | Catálogo de animales vistos | ✅ | ❌ |
| 7 | `generated_images` | Imágenes generadas por IA | ✅ | ❌ |
| 8 | `achievements` | Catálogo de logros disponibles | ✅ (global) | ❌ |
| 9 | `user_achievements` | Logros desbloqueados | ✅ | ❌ |
| 10 | `guest_sessions` | Sesiones temporales | ❌ | ✅ (24h) |

---

## 🔐 Flujo de Autenticación

### **Usuario Registrado (Google OAuth)**

```javascript
// Frontend recibe datos de Google
{
  "google_id": "115893921234567890",
  "email": "usuario@gmail.com",
  "name": "Juan Pérez",
  "picture": "https://lh3.googleusercontent.com/..."
}

// Backend crea o actualiza usuario
User.objects.get_or_create(
  google_id=google_id,
  defaults={
    'email': email,
    'display_name': name,
    'avatar_url': picture,
    'account_type': 'google',
    'is_guest': False
  }
)

// Se guardan:
✅ Historial de chat → chat_history
✅ Foto de perfil → avatar_url
✅ Estadísticas → user_progress
✅ Logros → user_achievements
✅ Preferencias → user_settings
```

### **Usuario Invitado**

```javascript
// Frontend genera nickname temporal
const nickname = `Invitado${Math.random() * 9999}`;

// Backend crea sesión temporal (24 horas)
GuestSession.objects.create(
  session_token=secrets.token_urlsafe(32),
  nickname=nickname,
  expires_at=timezone.now() + timedelta(hours=24)
)

// NO se guarda:
❌ NO historial de chat
❌ NO foto de perfil
❌ NO estadísticas
❌ NO logros
❌ NO preferencias

// Al recargar página:
❌ Todo desaparece (como ChatGPT sin cuenta)
```

---

## 📋 Comparación: Invitado vs Registrado

| Funcionalidad | Invitado | Registrado |
|---------------|----------|------------|
| Chat con Jaggy | ✅ | ✅ |
| Generar imágenes | ✅ | ✅ |
| **Guardar historial** | ❌ | ✅ |
| **Ver conversaciones anteriores** | ❌ | ✅ |
| **Logros y puntos** | ❌ | ✅ |
| **Estadísticas** | ❌ | ✅ |
| **Foto de perfil** | ❌ | ✅ (Google) |
| **Guardar configuración** | ❌ | ✅ |
| **Al recargar página** | ❌ Pierde todo | ✅ Recupera todo |
| **Persistencia** | ⏰ 24h máximo | ♾️ Permanente |

---

## 🚀 Migración Rápida

### **Opción 1: Script Automático (Recomendado)**

```powershell
cd backend
.\setup-postgres.ps1
```

Este script ejecuta automáticamente:
1. ✅ Verifica PostgreSQL instalado
2. ✅ Solicita credenciales
3. ✅ Crea base de datos `fauna_kids`
4. ✅ Habilita extensión UUID
5. ✅ Configura archivo `.env`
6. ✅ Instala `psycopg2-binary`
7. ✅ Ejecuta migraciones
8. ✅ Carga logros iniciales

### **Opción 2: Manual**

```powershell
# 1. Crear base de datos
psql -U postgres
CREATE DATABASE fauna_kids;
\c fauna_kids
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
\q

# 2. Configurar .env
# Editar backend/.env (ver .env.example)

# 3. Instalar dependencias
pip install psycopg2-binary

# 4. Migrar
python migrate_to_postgres.py
```

---

## 📊 Datos Guardados por Tabla

### **`users`** - Perfil del Usuario
```sql
- ID único (UUID)
- Email (desde Google)
- Nombre para mostrar (desde Google)
- Foto de perfil (URL de Google)
- Tipo de cuenta: 'google', 'registered', 'guest'
- is_guest: FALSE para registrados
- Fechas: creación, último login
```

### **`chat_history`** - Mensajes
```sql
- ID del mensaje
- ID de sesión (chat_sessions)
- Rol: 'user' o 'assistant'
- Texto del mensaje
- URL de imagen (si generó imagen)
- Animal mencionado
- Fecha y hora
```

### **`user_progress`** - Estadísticas
```sql
- Total de animales explorados
- Total de preguntas hechas
- Total de imágenes generadas
- Total de sesiones
- Racha actual (días consecutivos)
- Racha más larga
- Puntos totales
- Nivel actual
```

### **`user_achievements`** - Logros Desbloqueados
```sql
- ID del logro (achievements)
- Progreso actual (ej: 5/10 preguntas)
- Progreso requerido
- ¿Desbloqueado? (TRUE/FALSE)
- Fecha de desbloqueo
```

---

## 🎮 Logros Predefinidos

### **Preguntas**
- 🗣️ **Primera Pregunta** (1 pregunta) - 10 puntos
- 🔍 **Explorador Curioso** (10 preguntas) - 50 puntos
- 📚 **Sabio de la Fauna** (50 preguntas) - 200 puntos

### **Animales**
- 🐾 **Primer Animal** (1 animal) - 10 puntos
- 🦁 **Coleccionista** (10 animales) - 100 puntos
- 🌍 **Conocedor del Reino Animal** (25 animales) - 250 puntos

### **Imágenes**
- 🎨 **Primer Artista** (1 imagen) - 10 puntos
- 🖼️ **Galería Personal** (10 imágenes) - 100 puntos

### **Rachas**
- 📅 **Visitante Diario** (3 días seguidos) - 50 puntos
- ⭐ **Guerrero Semanal** (7 días seguidos) - 150 puntos
- 🔥 **Maestro Constante** (30 días seguidos) - 500 puntos

---

## 🔧 Archivos de Configuración

### **`backend/.env`** (Principal)
```env
USE_POSTGRES=True
DB_NAME=fauna_kids
DB_USER=postgres
DB_PASSWORD=tu_password
DB_HOST=localhost
DB_PORT=5432

GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json

GEMINI_API_KEY=tu_gemini_api_key
```

### **`backend/fauna_kids_backend/settings.py`** (Ya configurado)
```python
# Detecta automáticamente si usar PostgreSQL o SQLite
USE_POSTGRES = os.environ.get('USE_POSTGRES', 'False') == 'True'

if USE_POSTGRES:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'fauna_kids'),
            ...
        }
    }
```

---

## 🧪 Verificación Post-Migración

### **1. Verificar tablas creadas**
```powershell
python manage.py dbshell
```

```sql
-- Listar tablas
\dt

-- Verificar usuarios
SELECT username, email, is_guest, account_type FROM users;

-- Verificar logros
SELECT code, name, requirement_value FROM achievements;

-- Salir
\q
```

### **2. Verificar datos desde Python**
```powershell
python manage.py shell
```

```python
from api.models import User, Achievement, UserProgress

# Contar usuarios
User.objects.count()  # 0 inicialmente

# Listar logros
Achievement.objects.values_list('code', 'name')

# Salir
exit()
```

---

## 📁 Documentación Completa

| Documento | Descripción |
|-----------|-------------|
| `POSTGRESQL_MIGRATION_PLAN.md` | Plan detallado de migración (20+ páginas) |
| `QUICKSTART_POSTGRES.md` | Guía rápida de inicio (5 minutos) |
| `DATABASE_DIAGRAM.md` | Diagrama ASCII de la base de datos |
| `DATABASE_DESIGN.md` | Diseño conceptual de la base de datos |
| `setup-postgres.ps1` | Script automático de configuración |
| `migrate_to_postgres.py` | Script de migración en Python |
| `setup_database.sql` | Script SQL para crear la BD manualmente |

---

## 🎯 Próximos Pasos

1. ✅ **Migrar a PostgreSQL** (usar `setup-postgres.ps1`)
2. ⏳ **Implementar Google OAuth en frontend** (React)
3. ⏳ **Actualizar `user.service.js`** (diferenciar invitados)
4. ⏳ **Crear página de login** (botón "Continuar con Google")
5. ⏳ **Actualizar Dashboard** (mostrar advertencia para invitados)
6. ⏳ **Probar flujo completo** (invitado → registrado)

---

## 📞 Soporte

- **Documentación completa**: `backend/POSTGRESQL_MIGRATION_PLAN.md`
- **Guía rápida**: `backend/QUICKSTART_POSTGRES.md`
- **Diagrama de BD**: `backend/DATABASE_DIAGRAM.md`
- **Errores comunes**: Ver sección "Troubleshooting" en QUICKSTART_POSTGRES.md

---

**¿Listo para migrar?** Ejecuta: `.\setup-postgres.ps1` 🚀
