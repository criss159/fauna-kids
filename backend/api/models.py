from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
import uuid


# ===========================
# USER MANAGER
# ===========================

class UserManager(BaseUserManager):
    """Manager personalizado para el modelo User"""
    
    def create_user(self, username, email=None, password=None, **extra_fields):
        """Crea y guarda un usuario normal"""
        if not username:
            raise ValueError('El username es obligatorio')
        
        # Si tiene email, es usuario registrado
        if email:
            email = self.normalize_email(email)
            extra_fields.setdefault('is_guest', False)
            extra_fields.setdefault('account_type', 'registered')
        else:
            # Sin email = invitado
            extra_fields.setdefault('is_guest', True)
            extra_fields.setdefault('account_type', 'guest')
        
        user = self.model(
            username=username,
            email=email,
            **extra_fields
        )
        
        if password:
            user.set_password(password)
        
        user.save(using=self._db)
        return user
    
    def create_superuser(self, username, email, password=None, **extra_fields):
        """Crea y guarda un superusuario"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_guest', False)
        extra_fields.setdefault('account_type', 'registered')
        
        return self.create_user(username, email, password, **extra_fields)


# ===========================
# USER MODEL
# ===========================

class User(AbstractBaseUser, PermissionsMixin):
    """
    Modelo de usuario personalizado
    Soporta usuarios registrados (con email) e invitados (sin email)
    """
    
    ACCOUNT_TYPES = [
        ('guest', 'Invitado'),
        ('registered', 'Registrado'),
        ('google', 'Google OAuth'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=50, unique=True, db_index=True)
    email = models.EmailField(max_length=255, unique=True, null=True, blank=True, db_index=True)
    display_name = models.CharField(max_length=100, blank=True)
    
    # Autenticación
    password = models.CharField(max_length=255)  # Heredado de AbstractBaseUser
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPES, default='registered')
    is_guest = models.BooleanField(default=False)
    
    # Google OAuth
    google_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    avatar_url = models.URLField(max_length=500, null=True, blank=True)
    
    # Permisos Django
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    
    # Metadatos
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    last_login_at = models.DateTimeField(null=True, blank=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['username']),
            models.Index(fields=['is_guest']),
        ]
        constraints = [
            # Si es invitado, email debe ser NULL
            models.CheckConstraint(
                check=(
                    models.Q(is_guest=True, email__isnull=True) |
                    models.Q(is_guest=False, email__isnull=False)
                ),
                name='guest_email_constraint'
            ),
        ]
    
    def __str__(self):
        if self.is_guest:
            return f"Invitado: {self.username}"
        return f"{self.display_name or self.username} ({self.email})"
    
    def save(self, *args, **kwargs):
        # Auto-generar display_name si no existe
        if not self.display_name:
            self.display_name = self.username
        super().save(*args, **kwargs)


# ===========================
# USER SETTINGS
# ===========================

class UserSettings(models.Model):
    """
    Configuraciones personalizadas del usuario
    Solo para usuarios registrados (is_guest=False)
    """
    
    THEMES = [
        ('forest', 'Bosque'),
        ('ocean', 'Océano'),
        ('sunset', 'Atardecer'),
        ('desert', 'Desierto'),
        ('arctic', 'Ártico'),
        ('jungle', 'Jungla'),
    ]
    
    LANGUAGES = [
        ('es', 'Español'),
        ('en', 'English'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='settings')
    
    # Apariencia
    theme = models.CharField(max_length=50, choices=THEMES, default='forest')
    dark_mode = models.BooleanField(default=False)
    
    # Localización
    language = models.CharField(max_length=10, choices=LANGUAGES, default='es')
    user_timezone = models.CharField(max_length=50, default='America/Bogota')
    
    # Notificaciones
    email_notifications = models.BooleanField(default=True)
    achievement_notifications = models.BooleanField(default=True)
    
    # Audio
    sound_effects = models.BooleanField(default=True)
    music_enabled = models.BooleanField(default=True)
    volume_level = models.IntegerField(default=70)
    
    # Metadatos
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_settings'
        verbose_name = 'Configuración de Usuario'
        verbose_name_plural = 'Configuraciones de Usuarios'
    
    def __str__(self):
        return f"Configuración de {self.user.username}"


# ===========================
# MODELOS ELIMINADOS (Sistema antiguo de chat)
# ===========================
# ChatSession y ChatHistory fueron reemplazados por:
# - Chat (nuevo sistema de conversaciones)
# - ChatMessage (nuevo sistema de mensajes)
# Las tablas chat_sessions y chat_history serán eliminadas en la próxima migración


# ===========================
# USER PROGRESS
# ===========================

class UserProgress(models.Model):
    """
    Progreso y estadísticas del usuario
    Solo para usuarios registrados
    """
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='progress')
    
    # Estadísticas generales
    total_animals_explored = models.IntegerField(default=0)
    total_questions_asked = models.IntegerField(default=0)
    total_images_generated = models.IntegerField(default=0)
    total_sessions = models.IntegerField(default=0)
    
    # Rachas
    current_streak_days = models.IntegerField(default=0)
    longest_streak_days = models.IntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)
    
    # Gamificación
    total_points = models.IntegerField(default=0)
    current_level = models.IntegerField(default=1)
    points_to_next_level = models.IntegerField(default=100)
    
    # Metadatos
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_progress'
        verbose_name = 'Progreso de Usuario'
        verbose_name_plural = 'Progreso de Usuarios'
    
    def __str__(self):
        return f"Progreso de {self.user.username} - Nivel {self.current_level}"
    
    def add_points(self, points):
        """Añade puntos y verifica si sube de nivel"""
        self.total_points += points
        
        while self.total_points >= self.points_to_next_level:
            self.total_points -= self.points_to_next_level
            self.current_level += 1
            self.points_to_next_level = int(self.points_to_next_level * 1.5)
        
        self.save()


# ===========================
# ANIMALS EXPLORED
# ===========================

class AnimalExplored(models.Model):
    """
    Animales que el usuario ha explorado
    Solo para usuarios registrados
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='animals_explored')
    
    animal_name = models.CharField(max_length=100)
    times_explored = models.IntegerField(default=1)
    is_favorite = models.BooleanField(default=False)
    
    first_explored_at = models.DateTimeField(default=timezone.now)
    last_explored_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'animals_explored'
        verbose_name = 'Animal Explorado'
        verbose_name_plural = 'Animales Explorados'
        unique_together = [['user', 'animal_name']]
        indexes = [
            models.Index(fields=['user', '-last_explored_at']),
            models.Index(fields=['user', 'is_favorite']),
        ]
    
    def __str__(self):
        fav = "⭐" if self.is_favorite else ""
        return f"{self.user.username} - {self.animal_name} {fav}"


# ===========================
# GENERATED IMAGES
# ===========================

class GeneratedImage(models.Model):
    """
    Imágenes generadas por IA para el usuario
    Solo para usuarios registrados
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='generated_images')
    # session = models.ForeignKey(Chat, on_delete=models.SET_NULL, null=True, blank=True)  # Referencia opcional al chat
    
    prompt = models.TextField()
    image_url = models.URLField(max_length=1000)
    animal_name = models.CharField(max_length=100, null=True, blank=True)
    
    is_favorite = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'generated_images'
        verbose_name = 'Imagen Generada'
        verbose_name_plural = 'Imágenes Generadas'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_favorite']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.animal_name or 'Imagen'}"


# ===========================
# ACHIEVEMENTS (Catálogo)
# ===========================

class Achievement(models.Model):
    """
    Catálogo de logros disponibles
    """
    
    REQUIREMENT_TYPES = [
        ('questions_asked', 'Preguntas Realizadas'),
        ('animals_explored', 'Animales Explorados'),
        ('images_generated', 'Imágenes Generadas'),
        ('streak_days', 'Días Consecutivos'),
        ('total_points', 'Puntos Totales'),
        ('sessions_completed', 'Sesiones Completadas'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True)
    
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon_emoji = models.CharField(max_length=10, default='🏆')
    
    requirement_type = models.CharField(max_length=50, choices=REQUIREMENT_TYPES)
    requirement_value = models.IntegerField()
    
    points_reward = models.IntegerField(default=10)
    
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'achievements'
        verbose_name = 'Logro'
        verbose_name_plural = 'Logros'
        ordering = ['requirement_value']
    
    def __str__(self):
        return f"{self.icon_emoji} {self.name}"


# ===========================
# USER ACHIEVEMENTS
# ===========================

class UserAchievement(models.Model):
    """
    Logros desbloqueados por el usuario
    Solo para usuarios registrados
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    
    current_progress = models.IntegerField(default=0)
    required_progress = models.IntegerField()
    
    is_unlocked = models.BooleanField(default=False)
    unlocked_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_achievements'
        verbose_name = 'Logro de Usuario'
        verbose_name_plural = 'Logros de Usuarios'
        unique_together = [['user', 'achievement']]
        indexes = [
            models.Index(fields=['user', 'is_unlocked']),
        ]
    
    def __str__(self):
        status = "✅" if self.is_unlocked else f"⏳ {self.current_progress}/{self.required_progress}"
        return f"{self.user.username} - {self.achievement.name} {status}"
    
    def check_unlock(self):
        """Verifica si el logro debe desbloquearse"""
        if not self.is_unlocked and self.current_progress >= self.required_progress:
            self.is_unlocked = True
            self.unlocked_at = timezone.now()
            self.save()
            
            # Añadir puntos al usuario
            self.user.progress.add_points(self.achievement.points_reward)
            
            return True
        return False


# ===========================
# GUEST SESSIONS
# ===========================

class GuestSession(models.Model):
    """
    Sesiones temporales para usuarios invitados
    Se auto-eliminan después de 24 horas
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session_token = models.CharField(max_length=255, unique=True, db_index=True)
    user_nickname = models.CharField(max_length=50, blank=True)
    
    # Datos temporales (no persistentes)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField()
    last_activity_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'guest_sessions'
        verbose_name = 'Sesión de Invitado'
        verbose_name_plural = 'Sesiones de Invitados'
        indexes = [
            models.Index(fields=['session_token']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"Invitado: {self.user_nickname or self.session_token[:8]}"
    
    def is_expired(self):
        """Verifica si la sesión ha expirado"""
        return timezone.now() > self.expires_at
    
    def save(self, *args, **kwargs):
        # Auto-establecer expiración a 24 horas si no está definida
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(hours=24)
        super().save(*args, **kwargs)


# ===========================
# CHAT MODELS
# ===========================

class Chat(models.Model):
    """
    Modelo para almacenar conversaciones del Explorer
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chats')
    title = models.CharField(max_length=200, default='Nueva conversación')
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'chats'
        verbose_name = 'Chat'
        verbose_name_plural = 'Chats'
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', '-updated_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"


class ChatMessage(models.Model):
    """
    Modelo para almacenar mensajes individuales de cada chat
    """
    MESSAGE_TYPES = [
        ('text', 'Texto'),
        ('image', 'Imagen'),
    ]
    
    MESSAGE_ROLES = [
        ('user', 'Usuario'),
        ('assistant', 'Asistente'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=20, choices=MESSAGE_ROLES)
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='text')
    
    # Contenido del mensaje
    text = models.TextField(blank=True)
    image_url = models.TextField(null=True, blank=True)  # TextField para soportar imágenes base64 grandes
    image_alt = models.CharField(max_length=500, null=True, blank=True)
    
    # Animal mencionado (para tracking)
    animal_mentioned = models.CharField(max_length=100, null=True, blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'chat_messages'
        verbose_name = 'Mensaje de Chat'
        verbose_name_plural = 'Mensajes de Chat'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['chat', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.chat.title} - {self.role}: {self.text[:50]}"


# ===========================
# USER SETTINGS MODEL
# ===========================

class UserSettings(models.Model):
    """
    Modelo para almacenar configuraciones del usuario
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='settings', primary_key=True)
    
    # Configuraciones del Explorer
    voice_enabled = models.BooleanField(default=False)
    
    # Configuraciones de tema (para futuro)
    theme = models.CharField(max_length=50, default='default')
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_settings'
        verbose_name = 'Configuración de Usuario'
        verbose_name_plural = 'Configuraciones de Usuarios'
    
    def __str__(self):
        return f"Settings - {self.user.username}"
