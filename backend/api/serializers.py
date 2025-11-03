"""
Serializers para la API de Fauna Kids
Convierte modelos Django a JSON y viceversa
"""

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import (
    User, UserSettings, UserProgress,
    AnimalExplored, GeneratedImage, Achievement, UserAchievement,
    Chat, ChatMessage
)
import secrets


# ===========================
# USER SERIALIZERS
# ===========================

class UserSettingsSerializer(serializers.ModelSerializer):
    """Serializer para configuraciones del usuario"""
    
    class Meta:
        model = UserSettings
        exclude = ['user', 'created_at', 'updated_at']


class UserProgressSerializer(serializers.ModelSerializer):
    """Serializer para progreso del usuario"""
    
    class Meta:
        model = UserProgress
        exclude = ['user', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    """Serializer para información del usuario"""
    
    settings = UserSettingsSerializer(read_only=True)
    progress = UserProgressSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'display_name', 
            'account_type', 'is_guest', 'avatar_url',
            'created_at', 'settings', 'progress'
        ]
        read_only_fields = ['id', 'account_type', 'is_guest', 'created_at']


class RegisterSerializer(serializers.Serializer):
    """Serializer para registro de usuarios"""
    
    username = serializers.CharField(
        min_length=3,
        max_length=50,
        required=True
    )
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    display_name = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True
    )
    
    def validate_username(self, value):
        """Validar que el username no exista"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este nombre de usuario ya está en uso")
        return value
    
    def validate_email(self, value):
        """Validar que el email no exista"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este correo ya está registrado")
        return value
    
    def validate(self, data):
        """Validar que las contraseñas coincidan"""
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({
                "password_confirm": "Las contraseñas no coinciden"
            })
        
        # Validar fortaleza de contraseña
        try:
            validate_password(data['password'])
        except ValidationError as e:
            raise serializers.ValidationError({
                "password": list(e.messages)
            })
        
        return data
    
    def create(self, validated_data):
        """Crear usuario registrado"""
        validated_data.pop('password_confirm')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            display_name=validated_data.get('display_name', ''),
            account_type='registered',
            is_guest=False
        )
        
        # Crear configuraciones por defecto
        UserSettings.objects.create(user=user)
        
        # Crear progreso inicial
        UserProgress.objects.create(user=user)
        
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer para login de usuarios"""
    
    username = serializers.CharField(required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, data):
        """Validar credenciales"""
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            
            if not user:
                raise serializers.ValidationError(
                    "Credenciales inválidas. Verifica tu usuario y contraseña."
                )
            
            if not user.is_active:
                raise serializers.ValidationError(
                    "Esta cuenta ha sido desactivada."
                )
            
            if user.is_guest:
                raise serializers.ValidationError(
                    "No puedes iniciar sesión con una cuenta de invitado."
                )
        else:
            raise serializers.ValidationError(
                "Debes proporcionar usuario y contraseña."
            )
        
        data['user'] = user
        return data


class GuestSessionSerializer(serializers.Serializer):
    """Serializer para crear sesión de invitado"""
    
    nickname = serializers.CharField(
        max_length=50,
        required=False,
        allow_blank=True,
        default=""
    )
    
    def create(self, validated_data):
        """Crear token de invitado"""
        from .models import GuestSession
        from django.utils import timezone
        import datetime
        
        nickname = validated_data.get('nickname', '')
        if not nickname:
            nickname = f"Invitado_{secrets.token_hex(4)}"
        
        # Crear sesión temporal
        session = GuestSession.objects.create(
            session_token=secrets.token_urlsafe(32),
            user_nickname=nickname,
            expires_at=timezone.now() + datetime.timedelta(hours=24)
        )
        
        return session


# ===========================
# CHAT SERIALIZERS (Antiguo - Comentado)
# ===========================
# Estos serializers usaban ChatSession y ChatHistory (sistema antiguo)
# Ahora se usan los nuevos serializers con Chat y ChatMessage

"""
class ChatHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatHistory
        fields = [
            'id', 'message_order', 'role', 'content_type',
            'message_text', 'image_url', 'animal_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatHistorySerializer(many=True, read_only=True)
    
    class Meta:
        model = ChatSession
        fields = [
            'id', 'title', 'message_count', 'is_active',
            'created_at', 'updated_at', 'last_message_at', 'messages'
        ]
        read_only_fields = ['id', 'message_count', 'created_at', 'updated_at', 'last_message_at']


class ChatSessionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatSession
        fields = [
            'id', 'title', 'message_count', 'is_active',
            'created_at', 'last_message_at'
        ]


class CreateMessageSerializer(serializers.Serializer):
    session_id = serializers.UUIDField(required=False, allow_null=True)
    message = serializers.CharField(required=True)
    animal_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
"""


# ===========================
# PROGRESS & ACHIEVEMENTS
# ===========================

class AnimalExploredSerializer(serializers.ModelSerializer):
    """Serializer para animales explorados"""
    
    class Meta:
        model = AnimalExplored
        fields = [
            'id', 'animal_name', 'times_explored', 'is_favorite',
            'first_explored_at', 'last_explored_at'
        ]
        read_only_fields = ['id', 'first_explored_at']


class GeneratedImageSerializer(serializers.ModelSerializer):
    """Serializer para imágenes generadas"""
    
    class Meta:
        model = GeneratedImage
        fields = [
            'id', 'prompt', 'image_url', 'animal_name',
            'is_favorite', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AchievementSerializer(serializers.ModelSerializer):
    """Serializer para logros disponibles"""
    
    class Meta:
        model = Achievement
        fields = [
            'id', 'code', 'name', 'description', 'icon_emoji',
            'requirement_type', 'requirement_value', 'points_reward'
        ]


class UserAchievementSerializer(serializers.ModelSerializer):
    """Serializer para logros del usuario"""
    
    achievement = AchievementSerializer(read_only=True)
    
    class Meta:
        model = UserAchievement
        fields = [
            'id', 'achievement', 'current_progress', 'required_progress',
            'is_unlocked', 'unlocked_at'
        ]
        read_only_fields = ['id', 'unlocked_at']


class UserProgressDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado de progreso con animales y logros"""
    
    animals_explored_list = AnimalExploredSerializer(
        source='user.animals_explored',
        many=True,
        read_only=True
    )
    achievements = UserAchievementSerializer(
        source='user.achievements',
        many=True,
        read_only=True
    )
    
    class Meta:
        model = UserProgress
        fields = [
            'total_animals_explored', 'total_questions_asked',
            'total_images_generated', 'total_sessions',
            'current_streak_days', 'longest_streak_days',
            'last_activity_date', 'total_points', 'current_level',
            'points_to_next_level', 'animals_explored_list', 'achievements'
        ]


# ===========================
# CHAT SERIALIZERS
# ===========================

class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer para mensajes de chat"""
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'message_type', 'text', 'image_url', 'image_alt', 'created_at']
        read_only_fields = ['id', 'created_at']


class ChatSerializer(serializers.ModelSerializer):
    """Serializer para conversaciones de chat"""
    
    messages = ChatMessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Chat
        fields = ['id', 'title', 'created_at', 'updated_at', 'messages', 'message_count']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_message_count(self, obj):
        return obj.messages.count()


class ChatListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para lista de chats (sin mensajes)"""
    
    message_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Chat
        fields = ['id', 'title', 'created_at', 'updated_at', 'message_count']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_message_count(self, obj):
        return obj.messages.count()


# ===========================
# USER SETTINGS SERIALIZER (actualizado)
# ===========================

class UserSettingsUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar configuraciones del usuario"""
    
    class Meta:
        model = UserSettings
        fields = ['voice_enabled', 'theme']
