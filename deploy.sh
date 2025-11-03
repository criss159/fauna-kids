#!/bin/bash
# Script de despliegue rápido para Fauna Kids
# Uso: ./deploy.sh

set -e  # Salir si hay error

echo "🚀 Iniciando despliegue de Fauna Kids..."

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Directorio del proyecto
PROJECT_DIR="/home/faunakids/fauna-kids"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo -e "${YELLOW}📦 Actualizando código desde repositorio...${NC}"
cd $PROJECT_DIR
git pull origin main

echo -e "${YELLOW}🐍 Actualizando Backend (Django)...${NC}"
cd $BACKEND_DIR
source venv/bin/activate

# Instalar/actualizar dependencias
pip install -r requirements.txt

# Migraciones de base de datos
python manage.py migrate --noinput

# Colectar archivos estáticos
python manage.py collectstatic --noinput

deactivate

echo -e "${YELLOW}⚛️  Actualizando Frontend (React)...${NC}"
cd $FRONTEND_DIR

# Instalar/actualizar dependencias
npm install

# Build de producción
npm run build

echo -e "${YELLOW}🔄 Reiniciando servicios...${NC}"

# Reiniciar Gunicorn (Django)
sudo supervisorctl restart faunakids

# Recargar Nginx (sin downtime)
sudo systemctl reload nginx

echo -e "${GREEN}✅ Despliegue completado exitosamente!${NC}"
echo ""
echo "📊 Estado de los servicios:"
sudo supervisorctl status faunakids
sudo systemctl status nginx --no-pager

echo ""
echo "📝 Para ver logs:"
echo "  Backend:  sudo tail -f /var/log/faunakids/gunicorn.log"
echo "  Nginx:    sudo tail -f /var/log/nginx/error.log"
