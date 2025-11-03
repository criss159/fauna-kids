# ✅ Checklist de Despliegue - Fauna Kids

## 📋 Pre-Despliegue (En tu computadora local)

### Código
- [ ] Código en GitHub/GitLab con último commit
- [ ] `.env.production.example` actualizado con todas las variables
- [ ] `.gitignore` no permite subir archivos sensibles
- [ ] `requirements.txt` actualizado (`pip freeze > requirements.txt`)
- [ ] `package.json` con dependencias correctas

### Testing
- [ ] Backend corre sin errores: `python manage.py runserver`
- [ ] Frontend corre sin errores: `npm run dev`
- [ ] Todas las funcionalidades probadas localmente
- [ ] Google OAuth funciona correctamente

### Documentación
- [ ] README.md actualizado
- [ ] DEPLOYMENT_GCP.md revisado
- [ ] Variables de entorno documentadas

---

## 🚀 Configuración de Google Cloud

### Proyecto GCP
- [ ] Proyecto creado en Google Cloud Console
- [ ] Facturación habilitada
- [ ] APIs habilitadas:
  - [ ] Compute Engine API
  - [ ] Cloud SQL Admin API (si usas PostgreSQL)
  - [ ] Cloud Storage API

### VM (Máquina Virtual)
- [ ] VM creada (e2-medium recomendado)
- [ ] IP estática reservada
- [ ] Reglas de firewall configuradas:
  - [ ] Puerto 80 (HTTP)
  - [ ] Puerto 443 (HTTPS)
  - [ ] Puerto 22 (SSH)

### Dominio
- [ ] Dominio comprado (Namecheap, GoDaddy, etc.)
- [ ] DNS configurado apuntando a IP de VM:
  - [ ] Registro A: `@` → IP_VM
  - [ ] Registro A: `www` → IP_VM
  - [ ] Registro A: `api` → IP_VM

---

## 🛠️ Configuración del Servidor

### Conexión
- [ ] SSH a la VM funcionando
- [ ] Usuario `faunakids` creado

### Sistema Base
- [ ] Sistema actualizado: `sudo apt-get update && upgrade`
- [ ] Python 3.10+ instalado
- [ ] Node.js 18+ instalado
- [ ] Nginx instalado
- [ ] PostgreSQL instalado (opcional)
- [ ] Supervisor instalado
- [ ] Git instalado

### Repositorio
- [ ] Código clonado en `/home/faunakids/fauna-kids`
- [ ] Branch correcto (main/master)

---

## 🐍 Backend (Django)

### Entorno Virtual
- [ ] Virtual environment creado: `python3 -m venv venv`
- [ ] Dependencias instaladas: `pip install -r requirements.txt`
- [ ] Gunicorn instalado: `pip install gunicorn`

### Base de Datos
- [ ] PostgreSQL configurado (si aplica)
- [ ] Base de datos creada
- [ ] Usuario de BD creado con permisos
- [ ] Migraciones ejecutadas: `python manage.py migrate`
- [ ] Superusuario creado: `python manage.py createsuperuser`

### Variables de Entorno
- [ ] Archivo `.env` creado en backend/
- [ ] `SECRET_KEY` generada (50+ caracteres)
- [ ] `DEBUG=False`
- [ ] `ALLOWED_HOSTS` configurado correctamente
- [ ] `DATABASE_URL` configurado
- [ ] `GEMINI_API_KEY` configurado
- [ ] `GOOGLE_CLIENT_ID` configurado
- [ ] `CORS_ALLOWED_ORIGINS` configurado

### Archivos Estáticos
- [ ] `python manage.py collectstatic --noinput` ejecutado
- [ ] Archivos en `staticfiles/` generados

### Supervisor
- [ ] Archivo `/etc/supervisor/conf.d/faunakids.conf` creado
- [ ] Directorio de logs creado: `/var/log/faunakids/`
- [ ] Supervisor recargado: `sudo supervisorctl reread && update`
- [ ] Django corriendo: `sudo supervisorctl status faunakids`

---

## ⚛️ Frontend (React)

### Variables de Entorno
- [ ] Archivo `.env.production` creado en frontend/
- [ ] `VITE_API_URL` apunta a API de producción
- [ ] `VITE_GOOGLE_CLIENT_ID` configurado

### Build
- [ ] Dependencias instaladas: `npm install`
- [ ] Build de producción: `npm run build`
- [ ] Archivos en `dist/` generados

### Nginx
- [ ] Archivo `/etc/nginx/sites-available/faunakids` creado
- [ ] Configuración para frontend (puerto 80)
- [ ] Configuración para backend API (proxy a 8000)
- [ ] Symlink creado en `sites-enabled/`
- [ ] Configuración válida: `sudo nginx -t`
- [ ] Nginx reiniciado: `sudo systemctl restart nginx`

---

## 🔒 SSL/HTTPS

### Certbot
- [ ] Certbot instalado: `sudo apt-get install certbot python3-certbot-nginx`
- [ ] Certificados obtenidos: `sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com -d api.tu-dominio.com`
- [ ] Renovación automática configurada
- [ ] Prueba de renovación exitosa: `sudo certbot renew --dry-run`

### Verificación
- [ ] HTTPS funciona en todos los subdominios
- [ ] Redirección HTTP → HTTPS automática
- [ ] Certificados válidos (A+ en SSL Labs)

---

## 🔐 Google OAuth

### Configuración
- [ ] Google Cloud Console → APIs & Services → Credentials
- [ ] OAuth 2.0 Client ID editado
- [ ] Orígenes JavaScript autorizados:
  - [ ] `https://tu-dominio.com`
  - [ ] `https://www.tu-dominio.com`
- [ ] URIs de redirección autorizadas:
  - [ ] `https://tu-dominio.com`
  - [ ] `https://www.tu-dominio.com`

### Testing
- [ ] Login con Google funciona en producción
- [ ] Callback URL correcta
- [ ] Usuario se crea correctamente

---

## 🛡️ Seguridad

### Firewall
- [ ] UFW habilitado
- [ ] Puertos correctos abiertos (22, 80, 443)
- [ ] Puertos innecesarios cerrados

### Fail2ban
- [ ] Fail2ban instalado y configurado
- [ ] Protección contra ataques de fuerza bruta

### Django Security
- [ ] `DEBUG=False`
- [ ] `SECRET_KEY` segura y única
- [ ] `SECURE_SSL_REDIRECT=True`
- [ ] `SESSION_COOKIE_SECURE=True`
- [ ] `CSRF_COOKIE_SECURE=True`
- [ ] `SECURE_HSTS_SECONDS=31536000`

---

## 📊 Monitoreo y Mantenimiento

### Logs
- [ ] Logs de Django accesibles: `/var/log/faunakids/`
- [ ] Logs de Nginx accesibles: `/var/log/nginx/`
- [ ] Rotación de logs configurada

### Backups
- [ ] Script `backup.sh` en `/home/faunakids/`
- [ ] Crontab configurado para backups automáticos
- [ ] Backup manual probado
- [ ] Backups antiguos se eliminan automáticamente

### Actualización
- [ ] Script `deploy.sh` en `/home/faunakids/`
- [ ] Script probado
- [ ] Proceso de actualización documentado

---

## ✅ Verificación Final

### Funcionalidad
- [ ] Sitio carga correctamente en `https://tu-dominio.com`
- [ ] API responde en `https://api.tu-dominio.com`
- [ ] Login con Google funciona
- [ ] Chat con IA funciona
- [ ] Generación de imágenes funciona
- [ ] Text-to-Speech funciona
- [ ] Perfiles de usuario funcionan
- [ ] Dashboard muestra estadísticas
- [ ] Temas se cambian correctamente

### Performance
- [ ] Tiempos de carga < 3 segundos
- [ ] Imágenes optimizadas
- [ ] Caché habilitado
- [ ] Gzip compression activo

### SEO y Accesibilidad
- [ ] Meta tags configurados
- [ ] Favicon presente
- [ ] robots.txt configurado (si aplica)
- [ ] sitemap.xml configurado (si aplica)

### Monitoreo
- [ ] Uptime monitoring configurado (UptimeRobot, Pingdom, etc.)
- [ ] Alertas configuradas para downtime
- [ ] Google Analytics (opcional)
- [ ] Sentry para errores (opcional)

---

## 🎉 Post-Despliegue

### Documentación
- [ ] Credenciales guardadas en gestor de contraseñas
- [ ] Documentación de accesos actualizada
- [ ] Procedimientos de emergencia documentados

### Comunicación
- [ ] Usuarios informados del nuevo sitio
- [ ] Redes sociales actualizadas (si aplica)
- [ ] Email de lanzamiento enviado (si aplica)

### Testing de Usuarios
- [ ] Pruebas con usuarios reales
- [ ] Feedback recopilado
- [ ] Issues críticos resueltos

---

## 📞 Contactos de Emergencia

- **Hosting:** Google Cloud Platform
- **Dominio:** [Tu proveedor de dominio]
- **Email:** [Tu email]
- **Backup Admin:** [Email de backup]

---

**Fecha de despliegue:** _______________  
**Responsable:** _______________  
**Versión desplegada:** _______________

---

✅ **¡Despliegue completado exitosamente!**
