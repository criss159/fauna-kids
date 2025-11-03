"""
Vistas de autenticación para Fauna Kids
Maneja registro, login, logout y sesiones de invitados
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login, logout
from django.utils import timezone

from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer,
    GuestSessionSerializer
)
from .models import User, GuestSession


# ===========================
# HELPER FUNCTIONS
# ===========================

def get_tokens_for_user(user):
    """Genera tokens JWT para el usuario con claims personalizados"""
    refresh = RefreshToken.for_user(user)
    
    # Agregar claims personalizados al token
    refresh['username'] = user.username
    refresh['email'] = user.email or ''
    refresh['is_guest'] = user.is_guest
    refresh['account_type'] = user.account_type
    
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


# ===========================
# REGISTRATION
# ===========================

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Registra un nuevo usuario
    
    POST /api/auth/register
    Body: {
        "username": "maria",
        "email": "maria@example.com",
        "password": "segura123",
        "password_confirm": "segura123",
        "display_name": "María García" (opcional)
    }
    
    Response: {
        "user": { ...datos del usuario },
        "tokens": { "access": "...", "refresh": "..." },
        "message": "Usuario registrado exitosamente"
    }
    """
    serializer = RegisterSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        
        # Generar tokens
        tokens = get_tokens_for_user(user)
        
        # Actualizar last_login
        user.last_login_at = timezone.now()
        user.save()
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': tokens,
            'message': 'Usuario registrado exitosamente'
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ===========================
# LOGIN
# ===========================

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Inicia sesión con credenciales
    
    POST /api/auth/login
    Body: {
        "username": "maria",
        "password": "segura123"
    }
    
    Response: {
        "user": { ...datos del usuario },
        "tokens": { "access": "...", "refresh": "..." },
        "message": "Inicio de sesión exitoso"
    }
    """
    serializer = LoginSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Generar tokens
        tokens = get_tokens_for_user(user)
        
        # Actualizar last_login
        user.last_login_at = timezone.now()
        user.save()
        
        # Login en sesión Django (opcional)
        login(request, user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': tokens,
            'message': 'Inicio de sesión exitoso'
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ===========================
# LOGOUT
# ===========================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Cierra sesión del usuario
    
    POST /api/auth/logout
    Headers: { "Authorization": "Bearer <access_token>" }
    Body: {
        "refresh": "refresh_token_here"
    }
    
    Response: {
        "message": "Sesión cerrada exitosamente"
    }
    """
    try:
        refresh_token = request.data.get("refresh")
        
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        logout(request)
        
        return Response({
            'message': 'Sesión cerrada exitosamente'
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'error': 'Error al cerrar sesión'
        }, status=status.HTTP_400_BAD_REQUEST)


# ===========================
# GUEST SESSION
# ===========================

@api_view(['POST'])
@permission_classes([AllowAny])
def guest_session_view(request):
    """
    Crea una sesión temporal de invitado (24 horas)
    
    POST /api/auth/guest
    Body: {
        "nickname": "Invitado Curioso" (opcional)
    }
    
    Response: {
        "guest_token": "token_unico_temporal",
        "nickname": "Invitado Curioso",
        "expires_at": "2025-10-17T12:00:00Z",
        "message": "Sesión de invitado creada"
    }
    """
    serializer = GuestSessionSerializer(data=request.data)
    
    if serializer.is_valid():
        session = serializer.save()
        
        return Response({
            'guest_token': session.session_token,
            'nickname': session.user_nickname,
            'expires_at': session.expires_at,
            'message': 'Sesión de invitado creada. Válida por 24 horas.'
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_guest_session_view(request):
    """
    Verifica si una sesión de invitado es válida
    
    GET /api/auth/guest/verify?token=...
    
    Response: {
        "valid": true/false,
        "nickname": "Invitado Curioso",
        "expires_at": "..."
    }
    """
    token = request.query_params.get('token')
    
    if not token:
        return Response({
            'valid': False,
            'error': 'Token no proporcionado'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        session = GuestSession.objects.get(session_token=token)
        
        if session.is_expired():
            session.delete()
            return Response({
                'valid': False,
                'error': 'Sesión expirada'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Actualizar última actividad
        session.last_activity_at = timezone.now()
        session.save()
        
        return Response({
            'valid': True,
            'nickname': session.user_nickname,
            'expires_at': session.expires_at
        }, status=status.HTTP_200_OK)
    
    except GuestSession.DoesNotExist:
        return Response({
            'valid': False,
            'error': 'Sesión no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)


# ===========================
# CURRENT USER
# ===========================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """
    Obtiene información del usuario actual
    
    GET /api/auth/me
    Headers: { "Authorization": "Bearer <access_token>" }
    
    Response: {
        "user": { ...datos completos del usuario }
    }
    """
    user = request.user
    return Response({
        'user': UserSerializer(user).data
    }, status=status.HTTP_200_OK)


# ===========================
# TOKEN REFRESH
# ===========================

@api_view(['POST'])
@permission_classes([AllowAny])
def token_refresh_view(request):
    """
    Refresca el access token usando el refresh token
    
    POST /api/auth/token/refresh
    Body: {
        "refresh": "refresh_token_here"
    }
    
    Response: {
        "access": "new_access_token"
    }
    """
    try:
        refresh_token = request.data.get("refresh")
        
        if not refresh_token:
            return Response({
                'error': 'Refresh token requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        token = RefreshToken(refresh_token)
        
        return Response({
            'access': str(token.access_token)
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'error': 'Token inválido o expirado'
        }, status=status.HTTP_401_UNAUTHORIZED)


# ===========================
# CHECK USERNAME/EMAIL
# ===========================

@api_view(['GET'])
@permission_classes([AllowAny])
def check_username_view(request):
    """
    Verifica si un username está disponible
    
    GET /api/auth/check/username?username=maria
    
    Response: {
        "available": true/false
    }
    """
    username = request.query_params.get('username')
    
    if not username:
        return Response({
            'error': 'Username requerido'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    exists = User.objects.filter(username=username).exists()
    
    return Response({
        'available': not exists,
        'username': username
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_email_view(request):
    """
    Verifica si un email está disponible
    
    GET /api/auth/check/email?email=maria@example.com
    
    Response: {
        "available": true/false
    }
    """
    email = request.query_params.get('email')
    
    if not email:
        return Response({
            'error': 'Email requerido'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    exists = User.objects.filter(email=email).exists()
    
    return Response({
        'available': not exists,
        'email': email
    }, status=status.HTTP_200_OK)


# ===========================
# GOOGLE OAUTH
# ===========================

@api_view(['POST'])
@permission_classes([AllowAny])
def google_oauth_login(request):
    """
    Autenticación con Google OAuth
    
    POST /api/auth/google
    Body: {
        "google_id": "115893921234567890",
        "email": "usuario@gmail.com",
        "name": "Juan Pérez",
        "picture": "https://lh3.googleusercontent.com/..."
    }
    
    Response: {
        "user": { ...datos del usuario },
        "tokens": { "access": "...", "refresh": "..." },
        "is_new_user": true/false,
        "message": "Inicio de sesión exitoso"
    }
    """
    # Log para debugging
    print("=== Google OAuth Login ===")
    print(f"Request data: {request.data}")
    
    google_id = request.data.get('google_id')
    email = request.data.get('email')
    name = request.data.get('name')
    picture = request.data.get('picture')
    
    print(f"google_id: {google_id}")
    print(f"email: {email}")
    print(f"name: {name}")
    print(f"picture: {picture}")
    
    # Validar datos requeridos
    if not google_id or not email:
        return Response({
            'error': 'google_id y email son requeridos'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Buscar o crear usuario por google_id
    user, created = User.objects.get_or_create(
        google_id=google_id,
        defaults={
            'username': email.split('@')[0],  # Usar parte antes del @ como username
            'email': email,
            'display_name': name or email.split('@')[0],
            'avatar_url': picture,
            'account_type': 'google',
            'is_guest': False
        }
    )
    
    # Si el usuario ya existía, actualizar solo avatar y last_login
    if not created:
        # NO actualizar display_name para respetar apodos personalizados
        # Solo actualizar foto de perfil de Google
        if picture:
            user.avatar_url = picture
        
        user.last_login_at = timezone.now()
        user.save()
        print(f"✅ Usuario actualizado - display_name: {user.display_name}, avatar_url: {user.avatar_url}")
    else:
        # Usuario nuevo: crear UserSettings y UserProgress
        from .models import UserSettings, UserProgress
        
        UserSettings.objects.get_or_create(user=user)
        UserProgress.objects.get_or_create(user=user)
    
    # Generar tokens JWT
    tokens = get_tokens_for_user(user)
    
    # Serializar usuario
    user_data = UserSerializer(user).data
    print(f"📤 Enviando datos al frontend:")
    print(f"   - display_name: {user_data.get('display_name')}")
    print(f"   - avatar_url: {user_data.get('avatar_url')}")
    print(f"   - email: {user_data.get('email')}")
    
    return Response({
        'user': user_data,
        'tokens': tokens,
        'is_new_user': created,
        'message': 'Inicio de sesión exitoso con Google'
    }, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)
