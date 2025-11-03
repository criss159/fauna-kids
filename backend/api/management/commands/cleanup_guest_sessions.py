"""
Comando para limpiar sesiones de invitados expiradas
Ejecutar con: python manage.py cleanup_guest_sessions

Recomendado: Configurar como tarea CRON para ejecutar cada hora
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import GuestSession


class Command(BaseCommand):
    help = 'Elimina sesiones de invitados expiradas (> 24 horas)'

    def handle(self, *args, **options):
        now = timezone.now()
        
        # Buscar sesiones expiradas
        expired_sessions = GuestSession.objects.filter(expires_at__lt=now)
        count = expired_sessions.count()
        
        if count > 0:
            # Eliminar sesiones expiradas
            expired_sessions.delete()
            self.stdout.write(
                self.style.SUCCESS(f'✅ Se eliminaron {count} sesiones expiradas')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('✅ No hay sesiones expiradas')
            )
