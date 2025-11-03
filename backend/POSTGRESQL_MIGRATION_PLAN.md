# 🐘 Plan de Migración a PostgreSQL - Fauna Kids

## 📋 Resumen Ejecutivo

**Objetivo**: Migrar de SQLite a PostgreSQL para soportar funcionalidades avanzadas de autenticación con Google OAuth y persistencia de datos de usuarios registrados.

**Diferencias clave**:
- ✅ **Usuarios registrados (Google OAuth)**: Se guarda TODO (perfil, historial, logros, imágenes)
- ❌ **Usuarios invitados**: NO se guarda nada, sesión temporal en memoria (como ChatGPT sin cuenta)

---

## 🗄️ Estructura de Base de Datos

### **Tablas Principales**

#### 1. **`users`** - Usuarios del Sistema
```sql
- id (UUID, PK)
- username (VARCHAR 50, UNIQUE)
- email (VARCHAR 255, UNIQUE, NULLABLE) ← NULL para invitados
- display_name (VARCHAR 100)
- password (VARCHAR 255)
- account_type (VARCHAR 20) → 'guest', 'registered', 'google'
- is_guest (BOOLEAN) ← TRUE = no guarda datos
- google_id (VARCHAR 255, UNIQUE, NULLABLE) ← OAuth ID
- avatar_url (VARCHAR 500, NULLABLE) ← Foto de perfil de Google
- is_active, is_staff, is_superuser (BOOLEAN)
- created_at, updated_at, last_login_at (TIMESTAMP)
```

**Restricción clave**: Si `is_guest=TRUE`, entonces `email` debe ser NULL

#### 2. **`user_settings`** - Preferencias de Usuario
```sql
- id (BIGINT, PK)
- user_id (UUID, FK → users.id)
- theme (VARCHAR 50) → 'forest', 'ocean', 'sunset', etc.
- dark_mode (BOOLEAN)
- language (VARCHAR 10) → 'es', 'en'
- user_timezone (VARCHAR 50)
- email_notifications (BOOLEAN)
- achievement_notifications (BOOLEAN)
- sound_effects (BOOLEAN)
- music_enabled (BOOLEAN)
- volume_level (INTEGER)
- created_at, updated_at (TIMESTAMP)
```

**⚠️ SOLO para usuarios registrados** (is_guest=FALSE)

#### 3. **`chat_sessions`** - Sesiones de Conversación
```sql
- id (UUID, PK)
- user_id (UUID, FK → users.id)
- title (VARCHAR 200) ← Auto-generado del primer mensaje
- message_count (INTEGER)
- is_active (BOOLEAN)
- created_at, updated_at, last_message_at (TIMESTAMP)
```

**⚠️ SOLO para usuarios registrados**

#### 4. **`chat_history`** - Historial de Mensajes
```sql
- id (UUID, PK)
- session_id (UUID, FK → chat_sessions.id)
- user_id (UUID, FK → users.id)
- message_order (INTEGER)
- role (VARCHAR 20) → 'user', 'assistant'
- content_type (VARCHAR 20) → 'text', 'image'
- message_text (TEXT)
- image_url (VARCHAR 1000, NULLABLE)
- animal_name (VARCHAR 100, NULLABLE)
- created_at (TIMESTAMP)
```

**⚠️ SOLO para usuarios registrados**

#### 5. **`user_progress`** - Estadísticas y Progreso
```sql
- id (BIGINT, PK)
- user_id (UUID, FK → users.id, ONE-TO-ONE)
- total_animals_explored (INTEGER)
- total_questions_asked (INTEGER)
- total_images_generated (INTEGER)
- total_sessions (INTEGER)
- current_streak_days (INTEGER)
- longest_streak_days (INTEGER)
- last_activity_date (DATE, NULLABLE)
- total_points (INTEGER)
- current_level (INTEGER)
- points_to_next_level (INTEGER)
- created_at, updated_at (TIMESTAMP)
```

**⚠️ SOLO para usuarios registrados**

#### 6. **`animals_explored`** - Catálogo de Animales Explorados
```sql
- id (UUID, PK)
- user_id (UUID, FK → users.id)
- animal_name (VARCHAR 100)
- first_explored_at (TIMESTAMP)
- times_explored (INTEGER)
- last_explored_at (TIMESTAMP)
```

**⚠️ SOLO para usuarios registrados**

#### 7. **`generated_images`** - Imágenes Generadas por IA
```sql
- id (UUID, PK)
- user_id (UUID, FK → users.id)
- session_id (UUID, FK → chat_sessions.id, NULLABLE)
- prompt (TEXT)
- image_url (VARCHAR 1000)
- animal_name (VARCHAR 100, NULLABLE)
- is_favorite (BOOLEAN)
- created_at (TIMESTAMP)
```

**⚠️ SOLO para usuarios registrados**

#### 8. **`achievements`** - Catálogo de Logros Disponibles
```sql
- id (UUID, PK)
- code (VARCHAR 50, UNIQUE)
- name (VARCHAR 100)
- description (TEXT)
- icon_emoji (VARCHAR 10)
- requirement_type (VARCHAR 50) → 'questions_asked', 'animals_explored', etc.
- requirement_value (INTEGER)
- points_reward (INTEGER)
- created_at (TIMESTAMP)
```

**✅ Tabla global** (no depende de usuarios)

#### 9. **`user_achievements`** - Logros Desbloqueados por Usuario
```sql
- id (UUID, PK)
- user_id (UUID, FK → users.id)
- achievement_id (UUID, FK → achievements.id)
- current_progress (INTEGER)
- required_progress (INTEGER)
- is_unlocked (BOOLEAN)
- unlocked_at (TIMESTAMP, NULLABLE)
- created_at, updated_at (TIMESTAMP)
```

**⚠️ SOLO para usuarios registrados**

#### 10. **`guest_sessions`** - Sesiones Temporales de Invitados
```sql
- id (UUID, PK)
- session_token (VARCHAR 64, UNIQUE)
- nickname (VARCHAR 50)
- created_at (TIMESTAMP)
- expires_at (TIMESTAMP)
- last_activity_at (TIMESTAMP)
```

**⚠️ SOLO para invitados** - Se auto-elimina después de 24 horas de inactividad

---

## 🔐 Flujo de Autenticación con Google OAuth

### **Cuando un usuario entra con Google**:

1. **Frontend** recibe datos de Google:
   ```json
   {
     "google_id": "115893921234567890",
     "email": "usuario@gmail.com",
     "name": "Juan Pérez",
     "picture": "https://lh3.googleusercontent.com/..."
   }
   ```

2. **Backend** verifica si el usuario existe:
   ```python
   # En auth_views.py
   user, created = User.objects.get_or_create(
       google_id=google_id,
       defaults={
           'username': email.split('@')[0],
           'email': email,
           'display_name': name,
           'avatar_url': picture,
           'account_type': 'google',
           'is_guest': False
       }
   )
   ```

3. **Si es nuevo**:
   - ✅ Crea registro en `users`
   - ✅ Crea `user_settings` con valores por defecto
   - ✅ Crea `user_progress` inicializado en 0
   - ✅ NO tiene historial ni logros aún

4. **Si ya existe**:
   - ✅ Actualiza `last_login_at`
   - ✅ Actualiza `avatar_url` si cambió
   - ✅ Carga sus datos existentes (historial, logros, etc.)

5. **Frontend** guarda en `localStorage`:
   ```javascript
   localStorage.setItem('fauna_token', accessToken);
   localStorage.setItem('fauna_email', user.email);
   localStorage.setItem('fauna_nick', user.display_name);
   localStorage.setItem('fauna_avatar', user.avatar_url);
   localStorage.setItem('fauna_is_guest', 'false');
   ```

---

## 🚫 Flujo de Modo Invitado (Sin Guardar Datos)

### **Cuando un usuario entra como invitado**:

1. **Frontend** genera un nickname temporal:
   ```javascript
   const nickname = `Invitado${Math.floor(Math.random() * 9999)}`;
   ```

2. **Backend** crea una sesión temporal:
   ```python
   guest_session = GuestSession.objects.create(
       session_token=secrets.token_urlsafe(32),
       nickname=nickname,
       expires_at=timezone.now() + timedelta(hours=24)
   )
   ```

3. **NO se guarda**:
   - ❌ NO se crea registro en `users`
   - ❌ NO se guarda en `chat_history`
   - ❌ NO se registran logros ni progreso
   - ❌ NO se guardan imágenes generadas

4. **Frontend** guarda solo en memoria:
   ```javascript
   sessionStorage.setItem('fauna_session_token', sessionToken);
   sessionStorage.setItem('fauna_nick', nickname);
   sessionStorage.setItem('fauna_is_guest', 'true');
   ```

5. **Al recargar la página**:
   - ❌ Todo el historial desaparece
   - ❌ Como ChatGPT sin cuenta

6. **Limpieza automática**:
   ```python
   # Comando Django que se ejecuta cada hora
   # management/commands/cleanup_guest_sessions.py
   GuestSession.objects.filter(
       expires_at__lt=timezone.now()
   ).delete()
   ```

---

## 📊 Comparación: Invitado vs Registrado

| Funcionalidad | 🚫 Invitado | ✅ Registrado (Google) |
|---------------|-------------|------------------------|
| **Chat con Jaggy** | ✅ Funciona | ✅ Funciona |
| **Generar imágenes** | ✅ Funciona | ✅ Funciona |
| **Guardar historial** | ❌ NO | ✅ Sí (tabla `chat_history`) |
| **Ver conversaciones anteriores** | ❌ NO | ✅ Sí (lista en perfil) |
| **Logros y puntos** | ❌ NO | ✅ Sí (tabla `user_achievements`) |
| **Estadísticas** | ❌ NO | ✅ Sí (tabla `user_progress`) |
| **Foto de perfil** | ❌ NO | ✅ Sí (desde Google) |
| **Cambiar tema** | ✅ Solo en sesión | ✅ Se guarda (tabla `user_settings`) |
| **Al recargar página** | ❌ Pierde todo | ✅ Recupera todo |
| **Persistencia** | ❌ 24 horas máximo | ✅ Permanente |

---

## 🚀 Pasos de Migración

### **1. Instalar PostgreSQL** (si no está instalado)
```powershell
# Descargar desde: https://www.postgresql.org/download/windows/
# O con Chocolatey:
choco install postgresql

# Verificar instalación:
psql --version
```

### **2. Crear base de datos**
```powershell
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE fauna_kids;

# Crear usuario (opcional)
CREATE USER fauna_admin WITH PASSWORD 'tu_password_seguro';
ALTER USER fauna_admin CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE fauna_kids TO fauna_admin;

# Habilitar extensión UUID
\c fauna_kids
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### **3. Configurar variables de entorno**
```powershell
# Crear/editar backend/.env
```

Contenido del archivo `.env`:
```env
# PostgreSQL Configuration
USE_POSTGRES=True
DB_NAME=fauna_kids
DB_USER=postgres
DB_PASSWORD=tu_password_seguro
DB_HOST=localhost
DB_PORT=5432

# Google OAuth
GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret

# Google Cloud TTS
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json

# Gemini API
GEMINI_API_KEY=tu_api_key

# Django
SECRET_KEY=django-insecure-cambiar-en-produccion
DEBUG=True
```

### **4. Instalar dependencias de PostgreSQL**
```powershell
cd backend
pip install psycopg2-binary
```

### **5. Ejecutar migraciones**
```powershell
# Aplicar todas las migraciones
python manage.py migrate

# Verificar tablas creadas
python manage.py dbshell
\dt
```

### **6. Cargar datos iniciales**
```powershell
# Cargar logros predefinidos
python manage.py load_achievements

# Crear superusuario (para admin)
python manage.py createsuperuser
```

### **7. Verificar migración**
```powershell
# Ejecutar script de verificación
python verify_database.py
```

---

## 📝 Datos Sugeridos para la Base de Datos

### **Logros Iniciales** (tabla `achievements`)

```python
# Ya existe en: backend/api/management/commands/load_achievements.py

ACHIEVEMENTS = [
    # Preguntas
    {
        'code': 'first_question',
        'name': '🗣️ Primera Pregunta',
        'description': 'Hiciste tu primera pregunta a Jaggy',
        'requirement_type': 'questions_asked',
        'requirement_value': 1,
        'points_reward': 10
    },
    {
        'code': 'curious_explorer',
        'name': '🔍 Explorador Curioso',
        'description': 'Hiciste 10 preguntas',
        'requirement_type': 'questions_asked',
        'requirement_value': 10,
        'points_reward': 50
    },
    
    # Animales
    {
        'code': 'first_animal',
        'name': '🐾 Primer Animal',
        'description': 'Exploraste tu primer animal',
        'requirement_type': 'animals_explored',
        'requirement_value': 1,
        'points_reward': 10
    },
    {
        'code': 'animal_collector',
        'name': '🦁 Coleccionista',
        'description': 'Exploraste 10 animales diferentes',
        'requirement_type': 'animals_explored',
        'requirement_value': 10,
        'points_reward': 100
    },
    
    # Imágenes
    {
        'code': 'first_image',
        'name': '🎨 Primer Artista',
        'description': 'Generaste tu primera imagen',
        'requirement_type': 'images_generated',
        'requirement_value': 1,
        'points_reward': 10
    },
    
    # Rachas
    {
        'code': 'daily_visitor',
        'name': '📅 Visitante Diario',
        'description': 'Entraste 3 días seguidos',
        'requirement_type': 'streak_days',
        'requirement_value': 3,
        'points_reward': 50
    },
    {
        'code': 'weekly_warrior',
        'name': '⭐ Guerrero Semanal',
        'description': 'Entraste 7 días seguidos',
        'requirement_type': 'streak_days',
        'requirement_value': 7,
        'points_reward': 150
    },
]
```

### **Temas Disponibles** (ya definido en `UserSettings.THEMES`)
- `forest` (Bosque) - **Por defecto**
- `ocean` (Océano)
- `sunset` (Atardecer)
- `desert` (Desierto)
- `arctic` (Ártico)
- `jungle` (Jungla)

---

## 🔧 Configuración del Frontend

### **Actualizar `user.service.js`**

```javascript
// frontend/src/services/user.service.js

export async function getUserProfile() {
  const isGuest = localStorage.getItem('fauna_is_guest') === 'true';
  
  if (isGuest) {
    // Invitado: datos locales temporales
    return {
      nick: sessionStorage.getItem('fauna_nick') || 'Invitado',
      email: null,
      photoUrl: null,
      initial: 'I',
      isGuest: true
    };
  }
  
  // Registrado: obtener desde API
  const response = await api.get('/user/profile');
  return {
    nick: response.display_name,
    email: response.email,
    photoUrl: response.avatar_url,
    initial: response.display_name[0].toUpperCase(),
    isGuest: false
  };
}

export async function getUserStats() {
  const isGuest = localStorage.getItem('fauna_is_guest') === 'true';
  
  if (isGuest) {
    // Invitado: sin estadísticas
    return {
      totalAnimals: 0,
      totalMessages: 0,
      totalSessions: 0,
      currentStreak: 0,
      isGuest: true
    };
  }
  
  // Registrado: obtener desde API
  const response = await api.get('/user/progress');
  return {
    totalAnimals: response.total_animals_explored,
    totalMessages: response.total_questions_asked,
    totalSessions: response.total_sessions,
    currentStreak: response.current_streak_days,
    isGuest: false
  };
}
```

### **Actualizar componentes**

```jsx
// Dashboard.jsx - Mostrar advertencia para invitados
{profile.isGuest && (
  <div className="guest-warning">
    <h3>⚠️ Modo Invitado</h3>
    <p>Inicia sesión con Google para guardar tu progreso y desbloquear logros.</p>
    <button onClick={handleGoogleLogin}>
      <img src="/google-icon.svg" alt="Google" />
      Iniciar sesión con Google
    </button>
  </div>
)}
```

---

## 🧪 Testing

### **1. Probar modo invitado**
```javascript
// No debe guardar nada
1. Entrar sin cuenta
2. Hacer preguntas
3. Recargar página
4. Verificar que el historial desapareció ✅
```

### **2. Probar Google OAuth**
```javascript
// Debe guardar todo
1. Entrar con Google
2. Hacer preguntas
3. Recargar página
4. Verificar que el historial persiste ✅
5. Ver foto de perfil de Google ✅
```

### **3. Probar migración de invitado a registrado**
```javascript
// Debe perder datos temporales
1. Entrar como invitado
2. Hacer preguntas
3. Iniciar sesión con Google
4. Verificar que empieza desde 0 ✅
```

---

## 🎯 Siguientes Pasos

1. ✅ **Instalar PostgreSQL**
2. ✅ **Crear base de datos `fauna_kids`**
3. ✅ **Configurar archivo `.env`**
4. ✅ **Ejecutar migraciones con `python manage.py migrate`**
5. ✅ **Cargar logros con `python manage.py load_achievements`**
6. ⏳ **Implementar Google OAuth en frontend**
7. ⏳ **Actualizar `user.service.js`**
8. ⏳ **Probar flujo completo**

---

## 📚 Referencias

- [Django PostgreSQL Setup](https://docs.djangoproject.com/en/5.2/ref/databases/#postgresql-notes)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Django Migrations](https://docs.djangoproject.com/en/5.2/topics/migrations/)

---

**¿Todo listo para empezar la migración?** 🚀
