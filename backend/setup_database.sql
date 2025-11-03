-- ================================
-- SCRIPT SQL PARA CREAR BASE DE DATOS POSTGRESQL
-- Fauna Kids - Sistema Educativo de Animales
-- ================================

-- Ejecutar como superusuario (postgres)
-- psql -U postgres -f setup_database.sql

-- Crear base de datos
CREATE DATABASE fauna_kids
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'Spanish_Colombia.1252'
    LC_CTYPE = 'Spanish_Colombia.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Conectar a la base de datos
\c fauna_kids

-- Habilitar extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear usuario administrador (opcional)
CREATE USER fauna_admin WITH PASSWORD 'fauna_admin_2024';
ALTER USER fauna_admin CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE fauna_kids TO fauna_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fauna_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fauna_admin;

-- Verificar extensiones instaladas
SELECT * FROM pg_extension;

-- Verificar configuración
SELECT 
    current_database() as database,
    current_user as user,
    version() as postgresql_version;

-- Mensaje de éxito
\echo '✅ Base de datos fauna_kids creada exitosamente'
\echo 'Ejecuta las migraciones de Django: python manage.py migrate'
