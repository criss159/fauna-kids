"""
Comando para cargar logros iniciales en la base de datos
Ejecutar con: python manage.py load_achievements
"""

from django.core.management.base import BaseCommand
from api.models import Achievement


class Command(BaseCommand):
    help = 'Carga logros iniciales en la base de datos'

    def handle(self, *args, **options):
        achievements_data = [
            # Logros de preguntas
            {
                'code': 'first_question',
                'name': 'Primera Pregunta',
                'description': 'Haz tu primera pregunta sobre un animal',
                'icon_emoji': '❓',
                'requirement_type': 'questions_asked',
                'requirement_value': 1,
                'points_reward': 10,
            },
            {
                'code': 'curious_mind',
                'name': 'Mente Curiosa',
                'description': 'Realiza 10 preguntas',
                'icon_emoji': '🤔',
                'requirement_type': 'questions_asked',
                'requirement_value': 10,
                'points_reward': 50,
            },
            {
                'code': 'question_master',
                'name': 'Maestro de Preguntas',
                'description': 'Realiza 50 preguntas',
                'icon_emoji': '🎓',
                'requirement_type': 'questions_asked',
                'requirement_value': 50,
                'points_reward': 150,
            },
            
            # Logros de animales
            {
                'code': 'first_discovery',
                'name': 'Primer Descubrimiento',
                'description': 'Explora tu primer animal',
                'icon_emoji': '🐾',
                'requirement_type': 'animals_explored',
                'requirement_value': 1,
                'points_reward': 10,
            },
            {
                'code': 'animal_enthusiast',
                'name': 'Fanático de Animales',
                'description': 'Explora 10 animales diferentes',
                'icon_emoji': '🦁',
                'requirement_type': 'animals_explored',
                'requirement_value': 10,
                'points_reward': 50,
            },
            {
                'code': 'wildlife_expert',
                'name': 'Experto en Vida Silvestre',
                'description': 'Explora 25 animales diferentes',
                'icon_emoji': '🌍',
                'requirement_type': 'animals_explored',
                'requirement_value': 25,
                'points_reward': 100,
            },
            {
                'code': 'animal_master',
                'name': 'Maestro Animal',
                'description': 'Explora 50 animales diferentes',
                'icon_emoji': '👑',
                'requirement_type': 'animals_explored',
                'requirement_value': 50,
                'points_reward': 250,
            },
            
            # Logros de imágenes
            {
                'code': 'first_image',
                'name': 'Primera Creación',
                'description': 'Genera tu primera imagen con IA',
                'icon_emoji': '🎨',
                'requirement_type': 'images_generated',
                'requirement_value': 1,
                'points_reward': 15,
            },
            {
                'code': 'artist',
                'name': 'Artista',
                'description': 'Genera 10 imágenes',
                'icon_emoji': '🖼️',
                'requirement_type': 'images_generated',
                'requirement_value': 10,
                'points_reward': 75,
            },
            {
                'code': 'master_artist',
                'name': 'Maestro Artista',
                'description': 'Genera 25 imágenes',
                'icon_emoji': '🎭',
                'requirement_type': 'images_generated',
                'requirement_value': 25,
                'points_reward': 200,
            },
            
            # Logros de racha
            {
                'code': 'streak_3',
                'name': 'Constancia',
                'description': 'Mantén una racha de 3 días consecutivos',
                'icon_emoji': '🔥',
                'requirement_type': 'streak_days',
                'requirement_value': 3,
                'points_reward': 30,
            },
            {
                'code': 'streak_7',
                'name': 'Dedicación',
                'description': 'Mantén una racha de 7 días consecutivos',
                'icon_emoji': '⚡',
                'requirement_type': 'streak_days',
                'requirement_value': 7,
                'points_reward': 100,
            },
            {
                'code': 'streak_30',
                'name': 'Compromiso Total',
                'description': 'Mantén una racha de 30 días consecutivos',
                'icon_emoji': '💪',
                'requirement_type': 'streak_days',
                'requirement_value': 30,
                'points_reward': 500,
            },
            
            # Logros de puntos
            {
                'code': 'points_100',
                'name': 'Primer Centenar',
                'description': 'Acumula 100 puntos',
                'icon_emoji': '💯',
                'requirement_type': 'total_points',
                'requirement_value': 100,
                'points_reward': 20,
            },
            {
                'code': 'points_500',
                'name': 'Coleccionista',
                'description': 'Acumula 500 puntos',
                'icon_emoji': '💰',
                'requirement_type': 'total_points',
                'requirement_value': 500,
                'points_reward': 50,
            },
            {
                'code': 'points_1000',
                'name': 'Millonario',
                'description': 'Acumula 1000 puntos',
                'icon_emoji': '💎',
                'requirement_type': 'total_points',
                'requirement_value': 1000,
                'points_reward': 100,
            },
            
            # Logros de sesiones
            {
                'code': 'session_10',
                'name': 'Explorador Activo',
                'description': 'Completa 10 sesiones de chat',
                'icon_emoji': '📝',
                'requirement_type': 'sessions_completed',
                'requirement_value': 10,
                'points_reward': 40,
            },
            {
                'code': 'session_50',
                'name': 'Conversador Experto',
                'description': 'Completa 50 sesiones de chat',
                'icon_emoji': '💬',
                'requirement_type': 'sessions_completed',
                'requirement_value': 50,
                'points_reward': 150,
            },
        ]
        
        created_count = 0
        updated_count = 0
        
        for achievement_data in achievements_data:
            achievement, created = Achievement.objects.update_or_create(
                code=achievement_data['code'],
                defaults=achievement_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Creado: {achievement.icon_emoji} {achievement.name}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'🔄 Actualizado: {achievement.icon_emoji} {achievement.name}')
                )
        
        self.stdout.write('\n')
        self.stdout.write(
            self.style.SUCCESS(f'🎉 Proceso completado:')
        )
        self.stdout.write(f'   • Logros creados: {created_count}')
        self.stdout.write(f'   • Logros actualizados: {updated_count}')
        self.stdout.write(f'   • Total: {len(achievements_data)}')
