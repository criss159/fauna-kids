# 🐆 Fauna Kids - Plataforma Web Educativa

**Sistema web educativo interactivo para que los niños exploren y aprendan sobre animales mediante conversaciones con Jaggy, un jaguar amigable asistido por IA.**

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.1-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF.svg)](https://vitejs.dev/)

---

## 🎯 Características

- 💬 **Chat Interactivo** con Jaggy (IA) sobre animales
- 🎨 **Generación de Imágenes** con IA (Vertex AI / Gemini)
- 🔊 **Text-to-Speech** para respuestas habladas
- 📚 **Historial de Chat** guardado automáticamente
- 🐾 **Registro de Animales Explorados**
- 🔐 **Autenticación** con Google OAuth 2.0
- 🎨 **Temas Personalizables** (Bosque, Océano, Atardecer, etc.)
- 📊 **Dashboard** con estadísticas de progreso
- 👤 **Sesiones de Invitado** (sin registro)

## 🚀 Inicio Rápido

### Requisitos Previos
- Python 3.10+
- Node.js 18+
- PostgreSQL (opcional, usa SQLite por defecto)

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/fauna-kids.git
cd fauna-kids
```

2. **Configurar Backend**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

3. **Configurar Frontend**
```bash
cd frontend
npm install
npm run dev
```

4. **Variables de Entorno**

Crear archivo `.env` en la carpeta `backend`:
```env
GEMINI_API_KEY=tu_api_key_aqui
GOOGLE_CLIENT_ID=tu_client_id_aqui
SECRET_KEY=tu_secret_key_django
DEBUG=True
```

Configurar Google Client ID en `frontend/src/pages/Login.jsx`:
```javascript
const GOOGLE_CLIENT_ID = "tu_client_id.apps.googleusercontent.com";
```

## 📚 Documentación Completa

Ver [DOCUMENTATION.md](./DOCUMENTATION.md) para:
- Estructura de la base de datos
- Guía de autenticación
- Configuración de Google OAuth
- API endpoints
- Despliegue en producción

## 🗂️ Estructura del Proyecto

```
fauna-kids/
├── backend/              # Django REST API
│   ├── api/             # App principal
│   │   ├── models.py    # Modelos de BD
│   │   ├── views.py     # Vistas principales
│   │   ├── auth_views.py # Autenticación
│   │   ├── chat_views.py # Chat y historial
│   │   └── serializers.py
│   └── fauna_kids_backend/
│       └── settings.py
├── frontend/            # React + Vite
│   ├── src/
│   │   ├── pages/       # Páginas principales
│   │   ├── components/  # Componentes reutilizables
│   │   ├── services/    # Servicios API
│   │   └── theme/       # Sistema de temas
│   └── package.json
├── docs/                # Documentación adicional
├── DOCUMENTATION.md     # Documentación consolidada
└── cleanup.ps1          # Script de limpieza
```

## 🛠️ Tecnologías

### Backend
- Django 5.1
- Django REST Framework
- PostgreSQL / SQLite
- Google Gemini API
- Google Cloud Text-to-Speech
- JWT Authentication

### Frontend
- React 18
- Vite
- TailwindCSS
- Google OAuth 2.0

## 🎨 Temas Disponibles

- 🌳 Bosque (Forest)
- 🌊 Océano (Ocean)
- 🌅 Atardecer (Sunset)
- 🏜️ Desierto (Desert)
- ❄️ Ártico (Arctic)
- 🌴 Jungla (Jungle)

## 🔧 Scripts Útiles

### Limpieza del Proyecto
```powershell
.\cleanup.ps1
```

### Migraciones de Base de Datos
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### Build para Producción
```bash
cd frontend
npm run build
```

## 📸 Capturas de Pantalla

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### Explorador de Animales
![Explorer](docs/screenshots/explorer.png)

### Perfil de Usuario
![Profile](docs/screenshots/profile.png)

## 🐛 Troubleshooting

### Error: "Token inválido"
- Verificar que el token no haya expirado
- Usar endpoint `/api/auth/token/refresh`

### Google OAuth no funciona
- Verificar orígenes autorizados en Google Cloud Console
- Comprobar GOOGLE_CLIENT_ID

### Errores de CORS
- Configurar `CORS_ALLOWED_ORIGINS` en `settings.py`

## 📝 Contribuir

Ver [CONTRIBUTING.md](./CONTRIBUTING.md) para guías de contribución.

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🙋 Soporte

Para reportar bugs o sugerencias, crea un issue en el repositorio.

---

**Desarrollado con ❤️ para que los niños aprendan sobre la fauna de manera divertida**
