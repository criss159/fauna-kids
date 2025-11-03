"""
Script de Migración Rápida a PostgreSQL
Ejecuta todos los pasos necesarios para migrar la base de datos
"""

import os
import sys
import django
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fauna_kids_backend.settings')
django.setup()

from django.core.management import call_command
from django.db import connection
from api.models import User, Achievement

def check_postgres_connection():
    """Verifica que la conexión a PostgreSQL funcione"""
    print("\n🔍 Verificando conexión a PostgreSQL...")
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]
            print(f"✅ Conectado a PostgreSQL: {version}")
            return True
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

def run_migrations():
    """Ejecuta todas las migraciones"""
    print("\n🔄 Ejecutando migraciones...")
    try:
        call_command('migrate', verbosity=2)
        print("✅ Migraciones completadas")
        return True
    except Exception as e:
        print(f"❌ Error en migraciones: {e}")
        return False

def load_initial_data():
    """Carga datos iniciales (logros)"""
    print("\n📦 Cargando datos iniciales...")
    try:
        # Verificar si ya existen logros
        if Achievement.objects.exists():
            print("ℹ️  Los logros ya están cargados")
            return True
        
        call_command('load_achievements')
        print("✅ Logros cargados exitosamente")
        return True
    except Exception as e:
        print(f"❌ Error cargando datos: {e}")
        return False

def verify_tables():
    """Verifica que todas las tablas estén creadas"""
    print("\n🔍 Verificando tablas...")
    expected_tables = [
        'users', 'user_settings', 'user_progress',
        'chat_sessions', 'chat_history',
        'animals_explored', 'generated_images',
        'achievements', 'user_achievements',
        'guest_sessions'
    ]
    
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public'
            AND tablename NOT LIKE 'django_%'
            AND tablename NOT LIKE 'auth_%'
        """)
        existing_tables = [row[0] for row in cursor.fetchall()]
    
    missing = []
    for table in expected_tables:
        if table in existing_tables:
            print(f"✅ {table}")
        else:
            print(f"❌ {table} - FALTA")
            missing.append(table)
    
    if missing:
        print(f"\n⚠️  Faltan {len(missing)} tablas")
        return False
    
    print(f"\n✅ Todas las tablas están creadas ({len(existing_tables)} totales)")
    return True

def show_database_stats():
    """Muestra estadísticas de la base de datos"""
    print("\n📊 Estadísticas de la base de datos:")
    
    stats = {
        'Usuarios totales': User.objects.count(),
        'Usuarios registrados': User.objects.filter(is_guest=False).count(),
        'Usuarios invitados': User.objects.filter(is_guest=True).count(),
        'Logros disponibles': Achievement.objects.count(),
    }
    
    for key, value in stats.items():
        print(f"  • {key}: {value}")

def main():
    """Ejecuta la migración completa"""
    print("=" * 60)
    print("🐘 MIGRACIÓN A POSTGRESQL - FAUNA KIDS")
    print("=" * 60)
    
    steps = [
        ("Conexión a PostgreSQL", check_postgres_connection),
        ("Migraciones", run_migrations),
        ("Verificación de tablas", verify_tables),
        ("Datos iniciales", load_initial_data),
    ]
    
    for step_name, step_func in steps:
        if not step_func():
            print(f"\n❌ Falló: {step_name}")
            print("Revisa el archivo .env y asegúrate de que PostgreSQL esté corriendo")
            sys.exit(1)
    
    show_database_stats()
    
    print("\n" + "=" * 60)
    print("✅ MIGRACIÓN COMPLETADA EXITOSAMENTE")
    print("=" * 60)
    print("\n📝 Próximos pasos:")
    print("  1. Ejecutar: python manage.py createsuperuser")
    print("  2. Iniciar servidor: python manage.py runserver")
    print("  3. Abrir admin: http://localhost:8000/admin")
    print("\n🎉 ¡Listo para usar PostgreSQL!")

if __name__ == '__main__':
    main()
