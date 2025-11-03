#!/bin/bash
# Script de backup para Fauna Kids
# Uso: ./backup.sh

# Configuración
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/faunakids/backups"
PROJECT_DIR="/home/faunakids/fauna-kids"
DB_NAME="fauna_kids_db"
DB_USER="faunakids_user"

# Crear directorio de backups si no existe
mkdir -p $BACKUP_DIR

echo "🔄 Iniciando backup de Fauna Kids - $DATE"

# Backup de base de datos PostgreSQL
echo "📊 Haciendo backup de base de datos..."
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup de archivos de la aplicación (código + media)
echo "📁 Haciendo backup de archivos..."
tar -czf $BACKUP_DIR/files_$DATE.tar.gz \
    --exclude='*.pyc' \
    --exclude='__pycache__' \
    --exclude='node_modules' \
    --exclude='venv' \
    --exclude='.git' \
    $PROJECT_DIR

# Backup de archivos de configuración del sistema
echo "⚙️  Haciendo backup de configuraciones..."
tar -czf $BACKUP_DIR/config_$DATE.tar.gz \
    /etc/nginx/sites-available/faunakids \
    /etc/supervisor/conf.d/faunakids.conf

# Listar backups creados
echo ""
echo "✅ Backups creados:"
ls -lh $BACKUP_DIR/*_$DATE.*

# Limpiar backups antiguos (mantener solo últimos 7 días)
echo ""
echo "🧹 Limpiando backups antiguos (>7 días)..."
find $BACKUP_DIR -type f -name "*.gz" -mtime +7 -delete
find $BACKUP_DIR -type f -name "*.tar.gz" -mtime +7 -delete

echo ""
echo "✅ Backup completado exitosamente!"
echo "📍 Ubicación: $BACKUP_DIR"

# Mostrar espacio en disco usado por backups
echo ""
echo "💾 Espacio usado por backups:"
du -sh $BACKUP_DIR
