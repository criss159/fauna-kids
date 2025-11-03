# 📚 Documentación Consolidada - Fauna Kids

## 📋 Índice
1. [Información General](#información-general)
2. [Configuración Inicial](#configuración-inicial)
3. [Base de Datos](#base-de-datos)
4. [Autenticación](#autenticación)
5. [Chat y Explorador](#chat-y-explorador)
6. [Deployment](#deployment)

---

## 🎯 Información General

**Fauna Kids** es una aplicación educativa interactiva para niños donde pueden explorar y aprender sobre animales mediante conversaciones con Jaggy, un jaguar amigable asistido por IA.

### Tecnologías
- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Django REST Framework
- **Base de Datos:** PostgreSQL / SQLite
- **IA:** Google Gemini API
- **Autenticación:** JWT + Google OAuth 2.0

---

## 🚀 Configuración Inicial

### Requisitos Previos
- Python 3.10+
- Node.js 18+
- PostgreSQL (opcional, usa SQLite por defecto)

### Instalación Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Instalación Frontend
```bash
cd frontend
npm install
npm run dev
```

### Variables de Entorno
Crea un archivo `.env` en la carpeta backend:
```env
GEMINI_API_KEY=tu_api_key_aqui
GOOGLE_CLIENT_ID=tu_client_id_aqui
SECRET_KEY=tu_secret_key_django
DEBUG=True
```

---

## 🗄️ Base de Datos

### Modelos Principales

#### User
- Soporta usuarios registrados y Google OAuth
- Campos: `username`, `email`, `display_name`, `avatar_url`, `google_id`

#### Chat & ChatMessage
- Sistema de historial de conversaciones
- Detección automática de animales mencionados
- Soporte para mensajes de texto e imágenes

#### AnimalExplored
- Registro de animales explorados por usuario
- Contador de veces explorado
- Marcadores de favoritos

#### UserSettings & UserProgress
- Configuraciones personalizadas (tema, voz, etc.)
- Progreso y estadísticas del usuario

### Migraciones
```bash
python manage.py makemigrations
python manage.py migrate
```

---

## 🔐 Autenticación

### Sistema Implementado
1. **JWT Tokens:** Para usuarios registrados
2. **Google OAuth 2.0:** Login con cuenta Google
3. **Guest Sessions:** Sesiones temporales sin registro

### Endpoints
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login tradicional
- `POST /api/auth/google` - Login con Google
- `POST /api/auth/guest` - Crear sesión invitado
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/logout` - Cerrar sesión

### Configuración Google OAuth

1. **Google Cloud Console:**
   - Crear proyecto nuevo
   - Habilitar Google+ API
   - Crear credenciales OAuth 2.0
   - Agregar orígenes autorizados:
     - `http://localhost:5173`
     - Tu dominio de producción

2. **Configurar en el código:**
   ```javascript
   // frontend/src/pages/Login.jsx
   const GOOGLE_CLIENT_ID = "tu_client_id.apps.googleusercontent.com";
   ```

3. **Flujo de autenticación:**
   - Usuario hace clic en "Iniciar con Google"
   - Google devuelve credenciales
   - Frontend envía a `/api/auth/google`
   - Backend crea/actualiza usuario y devuelve tokens JWT

---

## 💬 Chat y Explorador

### Sistema de Chat
- Conversaciones con Jaggy (IA) sobre animales
- Generación de imágenes con Vertex AI
- Text-to-Speech para respuestas
- Historial guardado automáticamente

### Endpoints
- `POST /api/explorer/chats/save` - Guardar conversación
- `GET /api/explorer/chats` - Listar chats del usuario
- `GET /api/explorer/chats/<id>` - Obtener chat específico
- `DELETE /api/explorer/chats/<id>` - Eliminar chat
- `GET /api/explorer/animals` - Animales explorados

### Detección de Animales
El sistema detecta automáticamente menciones de animales en el chat y:
- Registra el animal en `AnimalExplored`
- Incrementa contador de exploraciones
- Actualiza estadísticas del usuario

---

## 📦 Deployment

### Backend (Django)
```bash
# Producción
python manage.py collectstatic
gunicorn fauna_kids_backend.wsgi:application
```

### Frontend (React)
```bash
npm run build
# Los archivos se generan en dist/
```

### Variables de Producción
- Cambiar `DEBUG=False` en Django
- Configurar CORS correctamente
- Usar PostgreSQL en lugar de SQLite
- Configurar dominios en Google OAuth
- Usar HTTPS en producción

---

## 🔧 Mantenimiento

### Limpieza de Base de Datos
```bash
# Eliminar sesiones de invitados expiradas
python manage.py shell
from api.models import GuestSession
GuestSession.objects.filter(expires_at__lt=timezone.now()).delete()
```

### Backups
```bash
# Backup SQLite
python manage.py dumpdata > backup.json

# Backup PostgreSQL
pg_dump fauna_kids > backup.sql
```

---

## 📝 Notas Importantes

### Actualización de Perfil
- El `display_name` NO se sobrescribe en login con Google
- Se respetan los apodos personalizados del usuario
- Solo se actualiza `avatar_url` y `last_login_at`

### Sesiones de Invitados
- Duración: 24 horas
- No guardan historial de chat
- No tienen estadísticas persistentes

### API de Gemini
- Límite de requests por minuto según plan
- Manejo de errores con reintentos automáticos
- Prompt optimizado para conversaciones educativas con niños

---

## 🐛 Troubleshooting

### Error: "Token inválido"
- Verificar que el token no haya expirado
- Usar endpoint `/api/auth/token/refresh` para renovar

### Error: "GEMINI_API_KEY no encontrada"
- Verificar archivo `.env` en backend
- Reiniciar servidor Django

### Google OAuth no funciona
- Verificar que el dominio esté en orígenes autorizados
- Comprobar que el GOOGLE_CLIENT_ID sea correcto
- Ver logs en Google Cloud Console

---

## 📞 Soporte

Para reportar bugs o sugerencias, crea un issue en el repositorio.

---

*Última actualización: Noviembre 2025*
