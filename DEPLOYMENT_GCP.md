# 🚀 Guía de Despliegue en Google Cloud Platform (GCP)

## 📋 Tabla de Contenidos
1. [Prerrequisitos](#prerrequisitos)
2. [Configuración de Google Cloud](#configuración-de-google-cloud)
3. [Creación de la VM](#creación-de-la-vm)
4. [Configuración del Servidor](#configuración-del-servidor)
5. [Despliegue del Backend (Django)](#despliegue-del-backend)
6. [Despliegue del Frontend (React)](#despliegue-del-frontend)
7. [Configuración de Dominio y SSL](#configuración-de-dominio-y-ssl)
8. [Optimizaciones y Seguridad](#optimizaciones-y-seguridad)

---

## 1. Prerrequisitos

### Cuenta de Google Cloud
- Cuenta de Google Cloud Platform activa
- Proyecto creado en GCP
- Billing habilitado (hay $300 de crédito gratis)

### Herramientas Locales
```bash
# Instalar Google Cloud SDK
# Windows: Descargar desde https://cloud.google.com/sdk/docs/install
# Mac/Linux:
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

### Archivos Necesarios
- Tu código en GitHub/GitLab (recomendado)
- Credenciales de Google OAuth
- API Key de Gemini

---

## 2. Configuración de Google Cloud

### 2.1 Crear Proyecto
```bash
# Listar proyectos existentes
gcloud projects list

# Crear nuevo proyecto
gcloud projects create fauna-kids-prod --name="Fauna Kids Production"

# Configurar proyecto activo
gcloud config set project fauna-kids-prod
```

### 2.2 Habilitar APIs Necesarias
```bash
# Habilitar Compute Engine API
gcloud services enable compute.googleapis.com

# Habilitar Cloud SQL (si usas PostgreSQL)
gcloud services enable sqladmin.googleapis.com

# Habilitar Cloud Storage
gcloud services enable storage-api.googleapis.com
```

### 2.3 Configurar Facturación
```bash
# Listar cuentas de facturación
gcloud billing accounts list

# Asociar cuenta de facturación al proyecto
gcloud billing projects link fauna-kids-prod --billing-account=XXXXXX-XXXXXX-XXXXXX
```

---

## 3. Creación de la VM

### 3.1 Crear Instancia de VM

**Opción A: Mediante Consola Web**
1. Ve a: https://console.cloud.google.com/compute
2. Click en "Crear Instancia"
3. Configuración recomendada:
   - **Nombre:** fauna-kids-vm
   - **Región:** us-central1 (o la más cercana)
   - **Tipo de máquina:** e2-medium (2 vCPU, 4 GB RAM)
   - **Sistema operativo:** Ubuntu 22.04 LTS
   - **Disco de arranque:** 30 GB SSD
   - **Firewall:** Permitir tráfico HTTP y HTTPS

**Opción B: Mediante Línea de Comandos**
```bash
gcloud compute instances create fauna-kids-vm \
    --zone=us-central1-a \
    --machine-type=e2-medium \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=30GB \
    --boot-disk-type=pd-ssd \
    --tags=http-server,https-server \
    --metadata=startup-script='#!/bin/bash
        apt-get update
        apt-get install -y python3-pip python3-venv nginx git
    '
```

### 3.2 Configurar Reglas de Firewall
```bash
# Permitir HTTP (puerto 80)
gcloud compute firewall-rules create allow-http \
    --allow tcp:80 \
    --target-tags http-server

# Permitir HTTPS (puerto 443)
gcloud compute firewall-rules create allow-https \
    --allow tcp:443 \
    --target-tags https-server

# Permitir puerto personalizado para backend (8000)
gcloud compute firewall-rules create allow-django \
    --allow tcp:8000 \
    --target-tags http-server
```

### 3.3 Reservar IP Estática
```bash
# Crear IP estática
gcloud compute addresses create fauna-kids-ip --region=us-central1

# Ver la IP asignada
gcloud compute addresses describe fauna-kids-ip --region=us-central1

# Asignar IP a la VM
gcloud compute instances add-access-config fauna-kids-vm \
    --zone=us-central1-a \
    --access-config-name="External NAT" \
    --address=DIRECCIÓN_IP_ESTÁTICA
```

---

## 4. Configuración del Servidor

### 4.1 Conectar a la VM
```bash
# SSH a la VM
gcloud compute ssh fauna-kids-vm --zone=us-central1-a

# O usar la consola web: Compute Engine > Instancias de VM > SSH
```

### 4.2 Instalar Dependencias del Sistema
```bash
# Actualizar paquetes
sudo apt-get update
sudo apt-get upgrade -y

# Instalar Python y herramientas
sudo apt-get install -y python3-pip python3-venv python3-dev

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar Nginx
sudo apt-get install -y nginx

# Instalar PostgreSQL (opcional)
sudo apt-get install -y postgresql postgresql-contrib libpq-dev

# Instalar supervisor (para mantener Django corriendo)
sudo apt-get install -y supervisor

# Instalar Git
sudo apt-get install -y git
```

### 4.3 Crear Usuario para la Aplicación
```bash
# Crear usuario
sudo adduser faunakids --disabled-password --gecos ""

# Agregar al grupo sudo (opcional)
sudo usermod -aG sudo faunakids

# Cambiar a ese usuario
sudo su - faunakids
```

---

## 5. Despliegue del Backend (Django)

### 5.1 Clonar el Repositorio
```bash
# Como usuario faunakids
cd /home/faunakids
git clone https://github.com/tu-usuario/fauna-kids.git
cd fauna-kids
```

### 5.2 Configurar Entorno Virtual
```bash
cd backend

# Crear entorno virtual
python3 -m venv venv

# Activar entorno
source venv/bin/activate

# Instalar dependencias
pip install --upgrade pip
pip install -r requirements.txt

# Instalar gunicorn
pip install gunicorn
```

### 5.3 Configurar Variables de Entorno
```bash
# Crear archivo .env
nano .env
```

Contenido del `.env`:
```env
# Django
SECRET_KEY=tu_secret_key_super_segura_aqui
DEBUG=False
ALLOWED_HOSTS=tu-dominio.com,www.tu-dominio.com,IP_DE_LA_VM

# Base de datos (PostgreSQL)
DATABASE_URL=postgresql://usuario:password@localhost:5432/fauna_kids_db

# APIs
GEMINI_API_KEY=tu_gemini_api_key
GOOGLE_CLIENT_ID=tu_google_client_id.apps.googleusercontent.com

# CORS
CORS_ALLOWED_ORIGINS=https://tu-dominio.com,https://www.tu-dominio.com

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu_app_password
```

### 5.4 Configurar PostgreSQL (Opcional)
```bash
# Volver a usuario con sudo
exit

# Cambiar a usuario postgres
sudo -u postgres psql

# En el prompt de PostgreSQL:
CREATE DATABASE fauna_kids_db;
CREATE USER faunakids_user WITH PASSWORD 'tu_password_segura';
ALTER ROLE faunakids_user SET client_encoding TO 'utf8';
ALTER ROLE faunakids_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE faunakids_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE fauna_kids_db TO faunakids_user;
\q

# Volver a usuario faunakids
sudo su - faunakids
cd fauna-kids/backend
source venv/bin/activate
```

### 5.5 Migrar Base de Datos
```bash
# Cargar variables de entorno
export $(cat .env | xargs)

# Hacer migraciones
python manage.py makemigrations
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Colectar archivos estáticos
python manage.py collectstatic --noinput
```

### 5.6 Probar Gunicorn
```bash
# Probar que gunicorn funciona
gunicorn fauna_kids_backend.wsgi:application --bind 0.0.0.0:8000
```

### 5.7 Configurar Supervisor
```bash
# Salir del usuario faunakids
exit

# Crear archivo de configuración de Supervisor
sudo nano /etc/supervisor/conf.d/faunakids.conf
```

Contenido de `faunakids.conf`:
```ini
[program:faunakids]
command=/home/faunakids/fauna-kids/backend/venv/bin/gunicorn fauna_kids_backend.wsgi:application --bind 0.0.0.0:8000 --workers 3
directory=/home/faunakids/fauna-kids/backend
user=faunakids
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/faunakids/gunicorn.log
stderr_logfile=/var/log/faunakids/gunicorn_error.log
environment=PATH="/home/faunakids/fauna-kids/backend/venv/bin"
```

```bash
# Crear directorio de logs
sudo mkdir -p /var/log/faunakids
sudo chown faunakids:faunakids /var/log/faunakids

# Recargar Supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start faunakids

# Verificar estado
sudo supervisorctl status faunakids
```

---

## 6. Despliegue del Frontend (React)

### 6.1 Build del Frontend
```bash
# Como usuario faunakids
sudo su - faunakids
cd fauna-kids/frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
nano .env.production
```

Contenido de `.env.production`:
```env
VITE_API_URL=https://api.tu-dominio.com
VITE_GOOGLE_CLIENT_ID=tu_google_client_id.apps.googleusercontent.com
```

```bash
# Build de producción
npm run build

# Los archivos se generan en dist/
```

### 6.2 Configurar Nginx

```bash
# Salir de usuario faunakids
exit

# Crear configuración de Nginx
sudo nano /etc/nginx/sites-available/faunakids
```

Contenido de configuración:
```nginx
# Frontend
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    root /home/faunakids/fauna-kids/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache estático
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Backend API
server {
    listen 80;
    server_name api.tu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /home/faunakids/fauna-kids/backend/staticfiles/;
    }

    location /media/ {
        alias /home/faunakids/fauna-kids/backend/media/;
    }
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/faunakids /etc/nginx/sites-enabled/

# Eliminar sitio por defecto
sudo rm /etc/nginx/sites-enabled/default

# Probar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 7. Configuración de Dominio y SSL

### 7.1 Configurar DNS
En tu proveedor de dominio (Namecheap, GoDaddy, etc.):

```
Tipo    Nombre              Valor
A       @                   IP_DE_TU_VM
A       www                 IP_DE_TU_VM
A       api                 IP_DE_TU_VM
```

### 7.2 Instalar Certbot (SSL Gratuito)
```bash
# Instalar Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtener certificados SSL
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com -d api.tu-dominio.com

# Renovación automática (ya viene configurado)
sudo certbot renew --dry-run
```

### 7.3 Actualizar Google OAuth
En Google Cloud Console:
1. Ve a: https://console.cloud.google.com/apis/credentials
2. Edita tu OAuth 2.0 Client ID
3. Agrega orígenes autorizados:
   - `https://tu-dominio.com`
   - `https://www.tu-dominio.com`
4. Agrega URIs de redirección:
   - `https://tu-dominio.com`

---

## 8. Optimizaciones y Seguridad

### 8.1 Firewall UFW
```bash
# Habilitar UFW
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

### 8.2 Fail2ban (Protección contra ataques)
```bash
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 8.3 Backups Automáticos
```bash
# Crear script de backup
sudo nano /home/faunakids/backup.sh
```

Contenido:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/faunakids/backups"

mkdir -p $BACKUP_DIR

# Backup de base de datos
pg_dump -U faunakids_user fauna_kids_db > $BACKUP_DIR/db_$DATE.sql

# Backup de archivos
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /home/faunakids/fauna-kids

# Mantener solo los últimos 7 días
find $BACKUP_DIR -type f -mtime +7 -delete
```

```bash
# Dar permisos
chmod +x /home/faunakids/backup.sh

# Agregar a crontab (diario a las 2 AM)
crontab -e
# Agregar: 0 2 * * * /home/faunakids/backup.sh
```

### 8.4 Monitoreo
```bash
# Ver logs de Django
sudo tail -f /var/log/faunakids/gunicorn.log

# Ver logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Estado de servicios
sudo supervisorctl status
sudo systemctl status nginx
```

---

## 9. Actualización de la Aplicación

### Script de Actualización
```bash
# Crear script
nano /home/faunakids/update.sh
```

Contenido:
```bash
#!/bin/bash
cd /home/faunakids/fauna-kids

# Pull últimos cambios
git pull origin main

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
deactivate

# Frontend
cd ../frontend
npm install
npm run build

# Reiniciar servicios
sudo supervisorctl restart faunakids
sudo systemctl reload nginx

echo "✅ Actualización completada!"
```

```bash
chmod +x /home/faunakids/update.sh
```

---

## 10. Checklist Final

### Antes de ir a producción:
- [ ] `DEBUG=False` en Django
- [ ] `ALLOWED_HOSTS` configurado correctamente
- [ ] SSL/HTTPS habilitado
- [ ] Certificados SSL renovables automáticamente
- [ ] Backups automáticos configurados
- [ ] Firewall habilitado
- [ ] Variables de entorno seguras
- [ ] Google OAuth actualizado con dominios de producción
- [ ] Base de datos PostgreSQL (no SQLite)
- [ ] Logs configurados y rotables
- [ ] Monitoreo básico funcionando

---

## 📚 Recursos Adicionales

- [Google Cloud Documentation](https://cloud.google.com/docs)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

---

## 🆘 Troubleshooting Común

### Error: "502 Bad Gateway"
```bash
# Verificar que Gunicorn esté corriendo
sudo supervisorctl status faunakids
sudo supervisorctl restart faunakids
```

### Error: "Static files not loading"
```bash
cd /home/faunakids/fauna-kids/backend
source venv/bin/activate
python manage.py collectstatic --noinput
sudo systemctl reload nginx
```

### Error: "Database connection failed"
```bash
# Verificar PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -c "\l"
```

---

**¡Tu aplicación Fauna Kids está lista para producción en Google Cloud! 🎉**
