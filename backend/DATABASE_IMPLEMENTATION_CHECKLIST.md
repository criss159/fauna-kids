# ✅ Checklist de Implementación - Base de Datos PostgreSQL

## 🎯 Objetivo
Migrar de SQLite a PostgreSQL e implementar diferenciación entre usuarios **invitados** y **registrados** con Google OAuth.

---

## 📋 Fase 1: Migración de Base de Datos

### ✅ Configuración Inicial
- [ ] Instalar PostgreSQL en el sistema
- [ ] Verificar instalación: `psql --version`
- [ ] Crear base de datos `fauna_kids`
- [ ] Habilitar extensión UUID: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
- [ ] Instalar `psycopg2-binary`: `pip install psycopg2-binary`

### ✅ Configuración del Backend
- [ ] Copiar `backend/.env.example` a `backend/.env`
- [ ] Configurar variables de entorno PostgreSQL:
  ```env
  USE_POSTGRES=True
  DB_NAME=fauna_kids
  DB_USER=postgres
  DB_PASSWORD=tu_password
  DB_HOST=localhost
  DB_PORT=5432
  ```
- [ ] Verificar `backend/fauna_kids_backend/settings.py` lee correctamente las variables

### ✅ Migraciones
- [ ] Ejecutar: `python manage.py migrate`
- [ ] Verificar tablas creadas: `python manage.py dbshell` → `\dt`
- [ ] Cargar logros iniciales: `python manage.py load_achievements`
- [ ] Verificar logros: `SELECT code, name FROM achievements;`

### ✅ Verificación Post-Migración
- [ ] Iniciar servidor: `python manage.py runserver`
- [ ] Crear superusuario: `python manage.py createsuperuser`
- [ ] Acceder a admin: http://localhost:8000/admin
- [ ] Verificar modelos en admin: Users, Achievements, ChatSessions, etc.

---

## 📋 Fase 2: Backend - Google OAuth

### ✅ Configuración de Google Cloud Console
- [ ] Ir a https://console.cloud.google.com/apis/credentials
- [ ] Crear proyecto "Fauna Kids" (si no existe)
- [ ] Habilitar "Google+ API" o "People API"
- [ ] Crear credenciales OAuth 2.0:
  - Tipo: Web Application
  - Authorized JavaScript origins: `http://localhost:5173`
  - Authorized redirect URIs: `http://localhost:5173/auth/callback`
- [ ] Copiar Client ID y Client Secret
- [ ] Agregar a `backend/.env`:
  ```env
  GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET=tu_client_secret
  ```

### ✅ Implementar Endpoint de Google OAuth
- [ ] Crear/actualizar `backend/api/auth_views.py`:
  - Función `google_oauth_login(request)`:
    - Recibe `google_id`, `email`, `name`, `picture` desde frontend
    - Busca o crea usuario con `User.objects.get_or_create(google_id=...)`
    - Si es nuevo: crea `UserSettings` y `UserProgress`
    - Actualiza `avatar_url` y `last_login_at`
    - Genera tokens JWT
    - Retorna `{ user, tokens }`
  
- [ ] Agregar ruta en `backend/api/urls.py`:
  ```python
  path('auth/google', auth_views.google_oauth_login, name='google_login'),
  ```

- [ ] Probar endpoint con Postman/Thunder Client:
  ```json
  POST http://localhost:8000/api/auth/google
  {
    "google_id": "123456789",
    "email": "test@gmail.com",
    "name": "Test User",
    "picture": "https://example.com/photo.jpg"
  }
  ```

### ✅ Implementar Endpoint de Modo Invitado
- [ ] Crear función `create_guest_session(request)` en `auth_views.py`:
  - Genera nickname aleatorio: `Invitado{random}`
  - Crea `GuestSession` con token único
  - Establece expiración: 24 horas
  - Retorna `{ session_token, nickname }`

- [ ] Agregar ruta en `urls.py`:
  ```python
  path('auth/guest', auth_views.create_guest_session, name='guest_session'),
  ```

- [ ] Probar endpoint:
  ```json
  POST http://localhost:8000/api/auth/guest
  {}
  ```

### ✅ Actualizar Endpoints Existentes
- [ ] Modificar `chat_views.py` → `save_chat_message()`:
  ```python
  if user.is_guest:
      return Response({"message": "Invitados no guardan historial"}, status=200)
  ```

- [ ] Modificar endpoints de progreso para verificar `is_guest=False`

- [ ] Agregar decorador personalizado `@require_registered_user` para endpoints que requieren cuenta registrada

---

## 📋 Fase 3: Frontend - Google OAuth

### ✅ Instalación de Dependencias
- [ ] Instalar Google OAuth: `npm install @react-oauth/google`
- [ ] Verificar instalación en `package.json`

### ✅ Configuración en `frontend/.env`
- [ ] Agregar Client ID:
  ```env
  VITE_GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
  ```

### ✅ Configurar Provider de Google
- [ ] Envolver aplicación con `GoogleOAuthProvider` en `main.jsx`:
  ```jsx
  import { GoogleOAuthProvider } from '@react-oauth/google';
  
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
  ```

### ✅ Crear Página de Login
- [ ] Crear `frontend/src/pages/Login.jsx`:
  - Mostrar dos opciones:
    1. Botón "Continuar con Google" (usa `useGoogleLogin` hook)
    2. Botón "Entrar como invitado"
  
- [ ] Implementar función `handleGoogleLogin`:
  ```javascript
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      // Obtener datos del usuario de Google
      const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
      }).then(res => res.json());
      
      // Enviar a backend
      const response = await api.post('/auth/google', {
        google_id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      });
      
      // Guardar tokens y datos
      localStorage.setItem('fauna_token', response.tokens.access);
      localStorage.setItem('fauna_email', response.user.email);
      localStorage.setItem('fauna_nick', response.user.display_name);
      localStorage.setItem('fauna_avatar', response.user.avatar_url);
      localStorage.setItem('fauna_is_guest', 'false');
      
      navigate('/dashboard');
    }
  });
  ```

- [ ] Implementar función `handleGuestLogin`:
  ```javascript
  const handleGuestLogin = async () => {
    const response = await api.post('/auth/guest');
    
    sessionStorage.setItem('fauna_session_token', response.session_token);
    sessionStorage.setItem('fauna_nick', response.nickname);
    sessionStorage.setItem('fauna_is_guest', 'true');
    
    navigate('/explorar');
  };
  ```

### ✅ Actualizar `user.service.js`
- [ ] Implementar función `getUserProfile()`:
  ```javascript
  export async function getUserProfile() {
    const isGuest = localStorage.getItem('fauna_is_guest') === 'true';
    
    if (isGuest) {
      return {
        nick: sessionStorage.getItem('fauna_nick') || 'Invitado',
        email: null,
        photoUrl: null,
        initial: 'I',
        isGuest: true
      };
    }
    
    const response = await api.get('/user/profile');
    return {
      nick: response.display_name,
      email: response.email,
      photoUrl: response.avatar_url,
      initial: response.display_name[0].toUpperCase(),
      isGuest: false
    };
  }
  ```

- [ ] Implementar función `getUserStats()`:
  ```javascript
  export async function getUserStats() {
    const isGuest = localStorage.getItem('fauna_is_guest') === 'true';
    
    if (isGuest) {
      return {
        totalAnimals: 0,
        totalMessages: 0,
        totalSessions: 0,
        currentStreak: 0,
        isGuest: true
      };
    }
    
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

### ✅ Actualizar Dashboard
- [ ] Agregar advertencia para invitados:
  ```jsx
  {profile.isGuest && (
    <div className="guest-warning">
      <h3>⚠️ Modo Invitado</h3>
      <p>Tus datos no se guardan. Inicia sesión con Google para:</p>
      <ul>
        <li>✅ Guardar tu historial de conversaciones</li>
        <li>✅ Desbloquear logros y puntos</li>
        <li>✅ Ver tus estadísticas</li>
        <li>✅ Guardar tus imágenes favoritas</li>
      </ul>
      <button onClick={handleGoogleLogin}>
        <img src="/google-icon.svg" />
        Continuar con Google
      </button>
    </div>
  )}
  ```

### ✅ Actualizar Profile
- [ ] Mostrar foto de perfil si `profile.photoUrl` existe
- [ ] Deshabilitar edición de preferencias para invitados
- [ ] Agregar botón "Guardar tu progreso" que redirige a login

### ✅ Actualizar Explorer (Chat)
- [ ] Verificar que `chat.service.js` → `saveMessage()` no intente guardar si es invitado
- [ ] Mostrar banner temporal: "Modo invitado: Tu historial no se guardará"

---

## 📋 Fase 4: Testing

### ✅ Probar Modo Invitado
- [ ] Entrar como invitado
- [ ] Hacer 3-5 preguntas a Jaggy
- [ ] Generar 1-2 imágenes
- [ ] Verificar que NO aparece en Dashboard:
  - ❌ Historial de conversaciones
  - ❌ Logros
  - ❌ Estadísticas (todas en 0)
- [ ] Recargar página
- [ ] Verificar que todo desapareció ✅

### ✅ Probar Google OAuth
- [ ] Hacer clic en "Continuar con Google"
- [ ] Iniciar sesión con cuenta de Google
- [ ] Verificar que aparece foto de perfil en Navbar ✅
- [ ] Verificar que Dashboard muestra "Bienvenido, [Nombre]" ✅
- [ ] Hacer 3-5 preguntas a Jaggy
- [ ] Recargar página
- [ ] Verificar que historial persiste ✅
- [ ] Verificar que estadísticas se actualizan ✅

### ✅ Probar Transición Invitado → Registrado
- [ ] Entrar como invitado
- [ ] Hacer 3-5 preguntas
- [ ] Iniciar sesión con Google
- [ ] Verificar que datos del invitado NO se transfieren ✅
- [ ] Verificar que empieza desde 0 ✅

### ✅ Probar Base de Datos
- [ ] Conectar a PostgreSQL: `psql -U postgres -d fauna_kids`
- [ ] Verificar usuarios registrados: `SELECT username, email, is_guest FROM users WHERE is_guest=FALSE;`
- [ ] Verificar sesiones de invitados: `SELECT nickname, expires_at FROM guest_sessions;`
- [ ] Verificar historial solo de registrados: `SELECT COUNT(*) FROM chat_history;`
- [ ] Verificar logros desbloqueados: `SELECT u.username, a.name FROM user_achievements ua JOIN users u ON ua.user_id = u.id JOIN achievements a ON ua.achievement_id = a.id WHERE ua.is_unlocked=TRUE;`

---

## 📋 Fase 5: Limpieza y Documentación

### ✅ Limpieza de Código
- [ ] Eliminar código comentado o sin usar
- [ ] Agregar comentarios en funciones complejas
- [ ] Formatear código con Prettier/Black

### ✅ Documentación
- [x] Crear `POSTGRESQL_MIGRATION_PLAN.md`
- [x] Crear `QUICKSTART_POSTGRES.md`
- [x] Crear `DATABASE_DIAGRAM.md`
- [x] Crear `DATABASE_EXECUTIVE_SUMMARY.md`
- [x] Actualizar `README.md` con sección de base de datos
- [ ] Crear `GOOGLE_OAUTH_SETUP.md` con pasos de configuración
- [ ] Actualizar `backend/README.md` con nuevos endpoints

### ✅ Scripts de Utilidad
- [x] `setup-postgres.ps1` - Configuración automática
- [x] `migrate_to_postgres.py` - Migración de datos
- [x] `setup_database.sql` - Script SQL de creación
- [ ] `cleanup_old_guests.py` - Limpieza de sesiones expiradas (comando Django)

---

## 📋 Fase 6: Deployment (Futuro)

### ✅ Preparación para Producción
- [ ] Configurar Render/Railway para PostgreSQL
- [ ] Actualizar variables de entorno en producción
- [ ] Configurar dominio autorizado en Google Cloud Console
- [ ] Cambiar `DEBUG=False` en producción
- [ ] Configurar HTTPS obligatorio
- [ ] Agregar rate limiting a endpoints de auth
- [ ] Configurar backup automático de PostgreSQL

---

## 📊 Resumen de Progreso

### ✅ Completado (Backend)
- [x] Modelos Django definidos (10 tablas)
- [x] Migraciones creadas
- [x] Scripts de migración
- [x] Documentación completa
- [x] Comando `load_achievements`
- [x] Configuración de PostgreSQL en `settings.py`

### ⏳ Pendiente (Backend)
- [ ] Endpoint `/auth/google` (Google OAuth)
- [ ] Endpoint `/auth/guest` (Sesión invitado)
- [ ] Middleware para verificar `is_guest`
- [ ] Actualizar endpoints existentes para rechazar invitados
- [ ] Comando Django `cleanup_guest_sessions`

### ⏳ Pendiente (Frontend)
- [ ] Instalar `@react-oauth/google`
- [ ] Crear página Login con botones Google + Invitado
- [ ] Actualizar `user.service.js` para diferenciar invitados
- [ ] Agregar advertencia en Dashboard para invitados
- [ ] Mostrar foto de perfil de Google en Navbar
- [ ] Deshabilitar funciones para invitados

### ⏳ Testing
- [ ] Probar modo invitado completo
- [ ] Probar Google OAuth completo
- [ ] Probar transición invitado → registrado
- [ ] Verificar datos en PostgreSQL

---

## 🎯 Siguientes Pasos Inmediatos

1. **Migrar a PostgreSQL** (si no lo has hecho):
   ```powershell
   cd backend
   .\setup-postgres.ps1
   ```

2. **Implementar Google OAuth en backend**:
   - Crear endpoint `/api/auth/google`
   - Crear endpoint `/api/auth/guest`

3. **Implementar Google OAuth en frontend**:
   - Instalar dependencia
   - Crear página Login
   - Actualizar user.service.js

4. **Testing completo**:
   - Probar ambos flujos
   - Verificar base de datos

---

**¿Listo para continuar?** Empieza con: `.\setup-postgres.ps1` 🚀
