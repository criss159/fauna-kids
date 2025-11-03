"""
URLs de la API de Fauna Kids
"""

from django.urls import path
from . import views, auth_views, chat_views

app_name = 'api'

urlpatterns = [
    # ===========================
    # HEALTH & STATUS
    # ===========================
    path('health/', views.health, name='health'),
    
    # ===========================
    # AUTHENTICATION
    # ===========================
    path('auth/register', auth_views.register_view, name='register'),
    path('auth/login', auth_views.login_view, name='login'),
    path('auth/logout', auth_views.logout_view, name='logout'),
    path('auth/me', auth_views.me_view, name='me'),
    path('auth/token/refresh', auth_views.token_refresh_view, name='token_refresh'),
    
    # Google OAuth
    path('auth/google', auth_views.google_oauth_login, name='google_login'),
    
    # Guest sessions
    path('auth/guest', auth_views.guest_session_view, name='guest_session'),
    path('auth/guest/verify', auth_views.verify_guest_session_view, name='verify_guest'),
    
    # Check availability
    path('auth/check/username', auth_views.check_username_view, name='check_username'),
    path('auth/check/email', auth_views.check_email_view, name='check_email'),
    
    # ===========================
    # EXPLORER & IMAGES (existentes)
    # ===========================
    path('explorer/', views.explorer, name='explorer'),
    path('images/generate', views.generate_image, name='generate_image'),
    path('tts/synthesize', views.text_to_speech, name='text_to_speech'),
    

    # ===========================
    # EXPLORER CHAT (New system)
    # ===========================
    path('explorer/chats', chat_views.list_chats, name='list_chats'),
    path('explorer/chats/save', chat_views.create_or_update_chat, name='create_or_update_chat'),
    path('explorer/chats/<uuid:chat_id>', chat_views.get_chat, name='get_chat'),
    path('explorer/chats/<uuid:chat_id>/delete', chat_views.delete_chat, name='delete_chat'),
    path('explorer/animals', chat_views.get_animals_explored, name='get_animals_explored'),
    
    # ===========================
    # USER SETTINGS & STATS
    # ===========================
    path('user/settings', chat_views.user_settings, name='user_settings'),
    path('user/profile', chat_views.update_user_profile, name='update_user_profile'),
    path('user/stats', chat_views.get_user_stats, name='get_user_stats'),
]
