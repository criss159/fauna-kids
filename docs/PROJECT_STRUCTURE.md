# 📊 Estructura del Proyecto Fauna Kids

## 🎯 Resumen de la Organización

Este documento describe la estructura **profesional y ordenada** del proyecto después de la reorganización.

---

## 📁 Árbol Completo

```
fauna-kids/                           # 🏠 Raíz del proyecto
│
├── 📄 README.md                      # Documentación principal
├── 📄 CONTRIBUTING.md                # Guía de contribución
├── 📄 .gitignore                     # Archivos a ignorar en Git
│
├── 📂 backend/                       # 🐍 Backend Django
│   │
│   ├── 📂 api/                      # App principal Django
│   │   ├── 📄 models.py             # Modelos (User, ChatSession, Achievement)
│   │   ├── 📄 views.py              # Endpoints principales + IA
│   │   ├── 📄 chat_views.py         # Gestión del chat
│   │   ├── 📄 auth_views.py         # Autenticación JWT
│   │   ├── 📄 serializers.py        # Serializadores DRF
│   │   ├── 📄 urls.py               # Rutas de la API
│   │   ├── 📄 admin.py              # Configuración del admin
│   │   │
│   │   └── 📂 management/           # Comandos Django personalizados
│   │       └── 📂 commands/
│   │           ├── load_achievements.py
│   │           └── cleanup_guest_sessions.py
│   │
│   ├── 📂 fauna_kids_backend/       # Configuración Django
│   │   ├── 📄 settings.py           # Configuración principal
│   │   ├── 📄 urls.py               # URLs principales
│   │   ├── 📄 wsgi.py               # WSGI para deployment
│   │   └── 📄 asgi.py               # ASGI para async
│   │
│   ├── 📂 scripts/                  # ✅ Scripts de utilidad
│   │   ├── 📄 verify_database.py    # Verificar conexión DB
│   │   └── 📄 verify_vertex_ai.py   # Verificar Vertex AI
│   │
│   ├── 📂 docs/                     # ✅ Documentación backend
│   │   ├── 📄 BACKEND.md            # Guía del backend
│   │   └── 📄 database_schema.sql   # Schema SQL
│   │
│   ├── 🔒 credentials.json          # Credenciales Google Cloud
│   ├── 🔒 .env                      # Variables de entorno (NO subir a Git)
│   ├── 📄 .env.example              # Ejemplo de configuración
│   ├── 📄 .gitignore                # Ignorar archivos sensibles
│   ├── 📄 requirements.txt          # Dependencias Python
│   ├── 📄 manage.py                 # CLI de Django
│   └── 📜 start-backend.ps1         # Script inicio Windows
│
├── 📂 frontend/                     # ⚛️ Frontend React
│   │
│   ├── 📂 src/
│   │   │
│   │   ├── 📂 components/          # Componentes reutilizables
│   │   │   ├── 📂 layout/          # Layouts y navegación
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── DashboardLayout.jsx
│   │   │   │   ├── PublicLayout.jsx
│   │   │   │   └── AnimatedBackground.jsx
│   │   │   │
│   │   │   └── 📂 scene/           # Animaciones de fondo
│   │   │       ├── HillsAndFlowers.jsx
│   │   │       ├── SkySunClouds.jsx
│   │   │       └── SceneLayers.jsx
│   │   │
│   │   ├── 📂 pages/               # Páginas principales
│   │   │   ├── 📄 Explorer.jsx     # 🐆 Chat con Jaggy
│   │   │   ├── 📄 Login.jsx        # Autenticación
│   │   │   ├── 📄 Profile.jsx      # Perfil del usuario
│   │   │   ├── 📄 Avatar.jsx       # Selección de avatar
│   │   │   ├── 📄 Dashboard.jsx    # Panel principal
│   │   │   └── 📄 Games.jsx        # Juegos educativos
│   │   │
│   │   ├── 📂 routes/              # Configuración de rutas
│   │   │   ├── 📄 index.jsx        # Rutas principales
│   │   │   ├── 📄 ProtectedRoute.jsx
│   │   │   ├── 📄 NotFound.jsx
│   │   │   └── 📄 paths.js         # Constantes de rutas
│   │   │
│   │   ├── 📂 services/            # Lógica de API
│   │   │   ├── 📄 chat.service.js
│   │   │   └── 📄 explorer.service.js
│   │   │
│   │   ├── 📂 theme/               # Temas y estilos
│   │   │   ├── 📄 ThemeProvider.jsx
│   │   │   ├── 📄 themes.js
│   │   │   └── 📄 useTheme.js
│   │   │
│   │   ├── 📂 utils/               # Utilidades
│   │   │   └── 📄 api.js           # Cliente HTTP
│   │   │
│   │   ├── 📂 styles/              # Estilos globales
│   │   │   └── 📄 Login.css
│   │   │
│   │   ├── 📄 main.jsx             # Punto de entrada
│   │   └── 📄 index.css            # Estilos base
│   │
│   ├── 📂 public/                  # Archivos estáticos
│   │   └── 📂 assets/              # Imágenes, iconos
│   │       └── 📂 avatars/         # Avatares de usuario
│   │
│   ├── 🔒 .env                     # Variables de entorno (NO subir)
│   ├── 📄 .env.example             # Ejemplo de configuración
│   ├── 📄 .gitignore               # Ignorar archivos
│   ├── 📄 package.json             # Dependencias Node
│   ├── 📄 package-lock.json        # Lock de dependencias
│   ├── 📄 vite.config.js           # Configuración Vite
│   ├── 📄 eslint.config.js         # Linter
│   └── 📄 index.html               # HTML base
│
└── 📂 docs/                        # ✅ Documentación general
    ├── 📄 FRONTEND.md              # Guía del frontend
    └── 📄 CLEANUP_HISTORY.md       # Historial de limpieza
```

---

## 🎯 Cambios Realizados

### ✅ Backend

| Antes | Después | Razón |
|-------|---------|-------|
| `backend/verify_database.py` | `backend/scripts/verify_database.py` | Organización de scripts |
| `backend/verify_vertex_ai.py` | `backend/scripts/verify_vertex_ai.py` | Organización de scripts |
| `backend/database_schema.sql` | `backend/docs/database_schema.sql` | Documentación centralizada |
| `backend/README.md` | `backend/docs/BACKEND.md` | Naming consistente |

### ✅ Frontend

| Antes | Después | Razón |
|-------|---------|-------|
| `frontend/README.md` | `docs/FRONTEND.md` | Docs en raíz |

### ✅ Raíz del Proyecto

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `README.md` | ✅ Renovado | Documentación profesional completa |
| `CONTRIBUTING.md` | ✅ Nuevo | Guía de contribución |
| `.gitignore` | ✅ Mejorado | Reglas completas |
| `docs/` | ✅ Nueva | Carpeta de documentación |

---

## 📌 Principios de Organización

### 1. **Separación de Responsabilidades**
- `scripts/` para utilidades ejecutables
- `docs/` para documentación
- `src/` para código fuente

### 2. **Naming Consistente**
- **Inglés** para código y carpetas
- **Español** para documentación
- **PascalCase** para componentes React
- **snake_case** para Python
- **camelCase** para JavaScript

### 3. **Agrupación Lógica**
- Componentes por funcionalidad (`layout/`, `scene/`)
- Servicios por dominio (`chat.service`, `explorer.service`)
- Docs por tecnología (`BACKEND.md`, `FRONTEND.md`)

### 4. **Seguridad**
- `.env` en `.gitignore`
- `credentials.json` protegido
- `.env.example` como guía

---

## 🔄 Scripts Útiles

### Backend
```bash
# Verificaciones
python scripts/verify_database.py
python scripts/verify_vertex_ai.py

# Comandos Django
python manage.py load_achievements
python manage.py cleanup_guest_sessions
```

### Frontend
```bash
npm run dev          # Desarrollo
npm run build        # Producción
npm run preview      # Preview
npm run lint         # Linter
```

---

## 📖 Documentación

### Principal
- **[README.md](../README.md)** - Guía principal del proyecto
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Guía de contribución

### Backend
- **[BACKEND.md](../backend/docs/BACKEND.md)** - Documentación del backend
- **[database_schema.sql](../backend/docs/database_schema.sql)** - Schema SQL

### Frontend
- **[FRONTEND.md](FRONTEND.md)** - Documentación del frontend

### Historial
- **[CLEANUP_HISTORY.md](CLEANUP_HISTORY.md)** - Historial de limpieza

---

## ✨ Ventajas de esta Estructura

### 🎯 Profesional
- Estructura clara y ordenada
- Fácil de navegar
- Estándares de la industria

### 📚 Documentada
- README completo
- Guías separadas
- Ejemplos de configuración

### 🔒 Segura
- Archivos sensibles protegidos
- `.gitignore` robusto
- Ejemplos sin credenciales

### 🚀 Escalable
- Fácil agregar nuevas features
- Carpetas organizadas por dominio
- Separación clara de concerns

### 🤝 Colaborativa
- CONTRIBUTING.md claro
- Estructura intuitiva
- Docs actualizadas

---

## 📞 Navegación Rápida

| Necesito... | Voy a... |
|-------------|----------|
| Configurar backend | `backend/docs/BACKEND.md` |
| Configurar frontend | `docs/FRONTEND.md` |
| Contribuir | `CONTRIBUTING.md` |
| Ejecutar verificaciones | `backend/scripts/` |
| Ver schema de DB | `backend/docs/database_schema.sql` |
| Agregar comando Django | `backend/api/management/commands/` |
| Crear componente React | `frontend/src/components/` |
| Agregar página | `frontend/src/pages/` |
| Modificar rutas | `frontend/src/routes/` |

---

**📊 Estructura actualizada: 2025-11-01**
**🐆 Fauna Kids - Proyecto Profesional y Organizado**
