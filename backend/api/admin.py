from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, UserSettings, Chat, ChatMessage, UserProgress,
    AnimalExplored, GeneratedImage, Achievement, UserAchievement, GuestSession
)


# ===========================
# USER ADMIN
# ===========================

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'display_name', 'account_type', 'is_guest', 'is_active', 'created_at']
    list_filter = ['is_guest', 'account_type', 'is_active', 'is_staff']
    search_fields = ['username', 'email', 'display_name']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('username', 'email', 'display_name', 'password')
        }),
        ('Tipo de Cuenta', {
            'fields': ('account_type', 'is_guest', 'google_id', 'avatar_url')
        }),
        ('Permisos', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at', 'last_login_at')
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']


# ===========================
# USER SETTINGS ADMIN
# ===========================

@admin.register(UserSettings)
class UserSettingsAdmin(admin.ModelAdmin):
    list_display = ['user', 'voice_enabled', 'theme', 'created_at']
    list_filter = ['voice_enabled', 'theme', 'created_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at']


# ===========================
# EXPLORER CHAT ADMIN (New System)
# ===========================

@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'message_count', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['title', 'user__username', 'user__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-updated_at']
    
    def message_count(self, obj):
        return obj.messages.count()
    message_count.short_description = 'Mensajes'


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['get_chat_title', 'role', 'message_type', 'get_text_preview', 'created_at']
    list_filter = ['role', 'message_type', 'created_at']
    search_fields = ['chat__title', 'text']
    readonly_fields = ['id', 'created_at']
    ordering = ['chat', 'created_at']
    
    def get_chat_title(self, obj):
        return obj.chat.title
    get_chat_title.short_description = 'Chat'
    
    def get_text_preview(self, obj):
        if len(obj.text) > 50:
            return obj.text[:50] + '...'
        return obj.text
    get_text_preview.short_description = 'Texto'


# ===========================
# MODELOS ELIMINADOS
# ===========================
# ChatSession y ChatHistory fueron removidos (sistema antiguo)
# Ahora se usan: Chat y ChatMessage


# ===========================
# USER PROGRESS ADMIN
# ===========================

@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'current_level', 'total_points', 
        'total_animals_explored', 'total_questions_asked', 
        'current_streak_days'
    ]
    list_filter = ['current_level', 'created_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at']


# ===========================
# ANIMALS EXPLORED ADMIN
# ===========================

@admin.register(AnimalExplored)
class AnimalExploredAdmin(admin.ModelAdmin):
    list_display = ['animal_name', 'user', 'times_explored', 'is_favorite', 'last_explored_at']
    list_filter = ['is_favorite', 'last_explored_at']
    search_fields = ['animal_name', 'user__username']
    ordering = ['-last_explored_at']


# ===========================
# GENERATED IMAGES ADMIN
# ===========================

@admin.register(GeneratedImage)
class GeneratedImageAdmin(admin.ModelAdmin):
    list_display = ['user', 'animal_name', 'is_favorite', 'created_at']
    list_filter = ['is_favorite', 'created_at']
    search_fields = ['user__username', 'animal_name', 'prompt']
    readonly_fields = ['created_at']
    ordering = ['-created_at']


# ===========================
# ACHIEVEMENT ADMIN
# ===========================

@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon_emoji', 'requirement_type', 'requirement_value', 'points_reward']
    list_filter = ['requirement_type']
    search_fields = ['name', 'description', 'code']


# ===========================
# USER ACHIEVEMENT ADMIN
# ===========================

@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    list_display = ['user', 'achievement', 'current_progress', 'required_progress', 'is_unlocked', 'unlocked_at']
    list_filter = ['is_unlocked', 'unlocked_at']
    search_fields = ['user__username', 'achievement__name']
    readonly_fields = ['unlocked_at', 'created_at', 'updated_at']


# ===========================
# GUEST SESSION ADMIN
# ===========================

@admin.register(GuestSession)
class GuestSessionAdmin(admin.ModelAdmin):
    list_display = ['user_nickname', 'session_token_short', 'created_at', 'expires_at', 'is_expired_status']
    list_filter = ['created_at', 'expires_at']
    search_fields = ['user_nickname', 'session_token']
    readonly_fields = ['created_at']
    
    def session_token_short(self, obj):
        return f"{obj.session_token[:16]}..."
    session_token_short.short_description = 'Token'
    
    def is_expired_status(self, obj):
        return "❌ Expirado" if obj.is_expired() else "✅ Activo"
    is_expired_status.short_description = 'Estado'
