# 🚀 Guía Rápida de Migración a PostgreSQL

## ⚡ Pasos Rápidos

### 1️⃣ Instalar PostgreSQL (si no está instalado)

**Windows**:
```powershell
# Descargar instalador desde:
# https://www.postgresql.org/download/windows/

# O con Chocolatey:
choco install postgresql
```

**Verificar instalación**:
```powershell
psql --version
# Debe mostrar: psql (PostgreSQL) 16.x
```

---

### 2️⃣ Crear la Base de Datos

**Opción A: Usando el script SQL**
```powershell
# Desde PowerShell
cd backend
psql -U postgres -f setup_database.sql
```

**Opción B: Manualmente**
```powershell
# Conectar a PostgreSQL
psql -U postgres

# En el prompt de PostgreSQL:
CREATE DATABASE fauna_kids;
\c fauna_kids
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
\q
```

---

### 3️⃣ Configurar Variables de Entorno

Crear archivo `backend/.env`:
```env
USE_POSTGRES=True
DB_NAME=fauna_kids
DB_USER=postgres
DB_PASSWORD=tu_password_postgres
DB_HOST=localhost
DB_PORT=5432

GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
GEMINI_API_KEY=tu_gemini_api_key
```

---

### 4️⃣ Instalar Dependencia PostgreSQL

```powershell
cd backend
pip install psycopg2-binary
```

---

### 5️⃣ Ejecutar Migración Automática

```powershell
python migrate_to_postgres.py
```

Este script ejecuta automáticamente:
- ✅ Verifica conexión a PostgreSQL
- ✅ Ejecuta migraciones (`python manage.py migrate`)
- ✅ Carga logros iniciales (`python manage.py load_achievements`)
- ✅ Verifica todas las tablas
- ✅ Muestra estadísticas

---

### 6️⃣ Crear Superusuario (Opcional)

```powershell
python manage.py createsuperuser
```

---

### 7️⃣ Iniciar Servidor

```powershell
python manage.py runserver
```

---

## 🎯 Verificación

### Verificar tablas creadas:
```powershell
python manage.py dbshell
```

```sql
-- Listar todas las tablas
\dt

-- Ver estructura de una tabla
\d users

-- Verificar logros cargados
SELECT code, name FROM achievements;

-- Salir
\q
```

---

## 🔍 Troubleshooting

### Error: "psycopg2 not installed"
```powershell
pip install psycopg2-binary
```

### Error: "FATAL: password authentication failed"
```powershell
# Edita backend/.env y verifica DB_PASSWORD
# O reinicia PostgreSQL:
net stop postgresql-x64-16
net start postgresql-x64-16
```

### Error: "database does not exist"
```powershell
psql -U postgres
CREATE DATABASE fauna_kids;
\q
```

### Error: "extension uuid-ossp does not exist"
```powershell
psql -U postgres -d fauna_kids
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
\q
```

---

## 📊 Estructura de Datos

### Tablas Principales Creadas:

1. **`users`** - Usuarios (registrados + invitados)
2. **`user_settings`** - Preferencias de usuario
3. **`user_progress`** - Estadísticas y progreso
4. **`chat_sessions`** - Sesiones de conversación
5. **`chat_history`** - Historial de mensajes
6. **`animals_explored`** - Animales explorados
7. **`generated_images`** - Imágenes generadas
8. **`achievements`** - Catálogo de logros
9. **`user_achievements`** - Logros desbloqueados
10. **`guest_sessions`** - Sesiones temporales de invitados

---

## 🔐 Diferencias: Invitado vs Registrado

| Dato | Invitado | Registrado (Google) |
|------|----------|---------------------|
| **Historial de chat** | ❌ No se guarda | ✅ Se guarda en `chat_history` |
| **Foto de perfil** | ❌ No | ✅ Desde Google (`avatar_url`) |
| **Estadísticas** | ❌ No | ✅ En `user_progress` |
| **Logros** | ❌ No | ✅ En `user_achievements` |
| **Al recargar página** | ❌ Pierde todo | ✅ Recupera todo |

---

## ✅ ¡Listo!

Ahora PostgreSQL está configurado y listo. Los próximos pasos son:

1. ⏳ **Implementar Google OAuth en el frontend**
2. ⏳ **Actualizar user.service.js para diferenciar invitados**
3. ⏳ **Probar flujo completo**

---

**¿Necesitas ayuda?** Revisa `POSTGRESQL_MIGRATION_PLAN.md` para más detalles.
