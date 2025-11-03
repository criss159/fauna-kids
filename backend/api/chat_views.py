"""
Vistas para manejo de chat y historial
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import User
# ===========================
# SISTEMA NUEVO DE CHATS
# ===========================
# Este archivo solo contiene las funciones del sistema nuevo
# que usa los modelos Chat y ChatMessage
# El sistema antiguo (ChatSession/ChatHistory) ha sido eliminado


# ===========================
# NUEVAS VISTAS PARA EXPLORER CHAT
# ===========================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_chats(request):
    """
    Lista todos los chats del usuario
    GET /api/explorer/chats
    """
    user = request.user
    
    print(f"📋 LIST_CHATS - Usuario: {user.email}, is_guest: {user.is_guest}")
    
    # No listar para invitados
    if user.is_guest:
        print("⚠️ Usuario invitado, devolviendo lista vacía")
        return Response([], status=status.HTTP_200_OK)
    
    from .models import Chat
    from .serializers import ChatListSerializer
    
    chats = Chat.objects.filter(user=user).order_by('-updated_at')
    print(f"📊 Chats encontrados en DB: {chats.count()}")
    
    for chat in chats:
        print(f"  - Chat ID: {chat.id}, Título: {chat.title}, Mensajes: {chat.messages.count()}")
    
    serializer = ChatListSerializer(chats, many=True)
    print(f"📦 Serializer data: {serializer.data}")
    print(f"📤 Devolviendo {len(serializer.data)} chats")
    
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chat(request, chat_id):
    """
    Obtiene un chat específico con todos sus mensajes
    GET /api/explorer/chats/<chat_id>
    """
    user = request.user
    
    if user.is_guest:
        return Response({
            "error": "Los invitados no pueden acceder a chats guardados"
        }, status=status.HTTP_403_FORBIDDEN)
    
    from .models import Chat
    from .serializers import ChatSerializer
    
    try:
        chat = Chat.objects.get(id=chat_id, user=user)
        serializer = ChatSerializer(chat)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Chat.DoesNotExist:
        return Response({
            "error": "Chat no encontrado"
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_or_update_chat(request):
    """
    Crea un nuevo chat o actualiza uno existente
    POST /api/explorer/chats
    {
        "chat_id": "uuid (opcional, si se quiere actualizar)",
        "title": "título del chat",
        "messages": [
            {
                "role": "user" o "assistant",
                "message_type": "text" o "image",
                "text": "contenido del mensaje",
                "image_url": "url (opcional)",
                "image_alt": "texto alternativo (opcional)"
            }
        ]
    }
    """
    user = request.user
    print(f"\n💾 CREATE/UPDATE CHAT - Usuario: {user.username}, ID: {user.id}, is_guest: {user.is_guest}")
    print(f"📦 Data recibida: {request.data}")
    
    # No guardar para invitados
    if user.is_guest:
        print("⚠️ Usuario invitado - no se guarda en BD")
        return Response({
            "message": "Los invitados no pueden guardar chats",
            "chat_id": None
        }, status=status.HTTP_200_OK)
    
    from .models import Chat, ChatMessage
    from .serializers import ChatSerializer
    
    data = request.data
    chat_id = data.get('chat_id')
    title = data.get('title', 'Nueva conversación')
    messages_data = data.get('messages', [])
    
    # Crear o actualizar chat
    if chat_id:
        try:
            chat = Chat.objects.get(id=chat_id, user=user)
            chat.title = title
            chat.save()
            
            # Eliminar mensajes anteriores y crear nuevos
            chat.messages.all().delete()
        except Chat.DoesNotExist:
            chat = Chat.objects.create(user=user, title=title)
    else:
        chat = Chat.objects.create(user=user, title=title)
    
    # Crear mensajes y detectar animales
    print(f"📝 Guardando {len(messages_data)} mensajes...")
    for msg_data in messages_data:
        text = msg_data.get('text', '')
        
        # Detectar animal en el mensaje
        animal_detected = detect_animal_in_text(text)
        if animal_detected:
            print(f"🐾 Animal detectado: {animal_detected}")
        
        ChatMessage.objects.create(
            chat=chat,
            role=msg_data.get('role', 'user'),
            message_type=msg_data.get('message_type', 'text'),
            text=text,
            image_url=msg_data.get('image_url'),
            image_alt=msg_data.get('image_alt'),
            animal_mentioned=animal_detected
        )
        
        # Registrar animal explorado si se detectó uno
        if animal_detected:
            print(f"✅ Registrando animal explorado: {animal_detected}")
            register_animal_explored(user, animal_detected)
    
    print(f"✅ Chat guardado exitosamente: ID={chat.id}, Title={chat.title}")
    
    # Recargar el chat desde la base de datos para incluir todos los mensajes
    chat.refresh_from_db()
    print(f"🔄 Chat recargado desde DB, mensajes: {chat.messages.count()}")
    
    serializer = ChatSerializer(chat)
    print(f"📦 Serializer data: {serializer.data}")
    print(f"📤 Devolviendo respuesta con status 201")
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_chat(request, chat_id):
    """
    Elimina un chat específico
    DELETE /api/explorer/chats/<chat_id>
    """
    user = request.user
    
    if user.is_guest:
        return Response({
            "error": "Los invitados no pueden eliminar chats"
        }, status=status.HTTP_403_FORBIDDEN)
    
    from .models import Chat
    
    try:
        chat = Chat.objects.get(id=chat_id, user=user)
        chat.delete()
        return Response({
            "message": "Chat eliminado exitosamente"
        }, status=status.HTTP_200_OK)
    except Chat.DoesNotExist:
        return Response({
            "error": "Chat no encontrado"
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_settings(request):
    """
    Obtiene o actualiza las configuraciones del usuario
    GET/PUT /api/user/settings
    {
        "voice_enabled": true/false,
        "theme": "default"
    }
    """
    user = request.user
    
    if user.is_guest:
        # Los invitados no guardan configuraciones
        if request.method == 'GET':
            return Response({
                "voice_enabled": False,
                "theme": "default"
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                "message": "Los invitados no pueden guardar configuraciones"
            }, status=status.HTTP_200_OK)
    
    from .models import UserSettings
    from .serializers import UserSettingsUpdateSerializer
    
    # Obtener o crear configuraciones
    settings, created = UserSettings.objects.get_or_create(user=user)
    
    if request.method == 'GET':
        serializer = UserSettingsUpdateSerializer(settings)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == 'PUT':
        serializer = UserSettingsUpdateSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    """
    Actualiza el perfil del usuario (display_name/apodo)
    PUT/PATCH /api/user/profile
    {
        "display_name": "Mi nuevo apodo"
    }
    """
    user = request.user
    
    print(f"\n💾 UPDATE_USER_PROFILE - Usuario: {user.username}, ID: {user.id}")
    print(f"📝 display_name anterior: '{user.display_name}'")
    
    # Obtener el nuevo display_name
    display_name = request.data.get('display_name', '').strip()
    print(f"📝 display_name nuevo: '{display_name}'")
    
    if not display_name:
        return Response({
            "error": "El apodo no puede estar vacío"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if len(display_name) > 100:
        return Response({
            "error": "El apodo no puede tener más de 100 caracteres"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Actualizar el display_name
    user.display_name = display_name
    user.save(update_fields=['display_name', 'updated_at'])
    
    # Verificar que se guardó correctamente
    user.refresh_from_db()
    print(f"✅ display_name guardado en BD: '{user.display_name}'")
    
    return Response({
        "success": True,
        "display_name": user.display_name,
        "message": "Perfil actualizado correctamente"
    }, status=status.HTTP_200_OK)


# ===========================
# ANIMALES EXPLORADOS
# ===========================

def detect_animal_in_text(text):
    """
    Detecta menciones de animales en el texto
    """
    animales = [
        'león', 'tigre', 'elefante', 'jirafa', 'cebra', 'rinoceronte', 'hipopótamo',
        'cocodrilo', 'serpiente', 'águila', 'búho', 'loro', 'tucán', 'pingüino',
        'delfín', 'ballena', 'tiburón', 'oso', 'lobo', 'zorro', 'conejo', 'ardilla',
        'perro', 'gato', 'caballo', 'vaca', 'cerdo', 'gallina', 'pato', 'pavo',
        'mono', 'gorila', 'chimpancé', 'orangután', 'canguro', 'koala', 'panda',
        'rana', 'sapo', 'tortuga', 'galápago', 'lagarto', 'iguana', 'camaleón',
        'mariposa', 'abeja', 'hormiga', 'araña', 'mosquito', 'mosca', 'escarabajo',
        'pájaro', 'paloma', 'gorrión', 'canario', 'flamenco', 'pelícano', 'gaviota',
        'pez', 'salmón', 'atún', 'trucha', 'carpa', 'piraña', 'anguila',
        'venado', 'ciervo', 'alce', 'bisonte', 'búfalo', 'camello', 'dromedario',
        'llama', 'alpaca', 'oveja', 'cabra', 'burro', 'mula', 'yak',
        'jaguar', 'leopardo', 'guepardo', 'pantera', 'lince', 'puma', 'ocelote',
        'mapache', 'tejón', 'nutria', 'foca', 'morsa', 'león marino',
        'murciélago', 'rata', 'ratón', 'hámster', 'cobaya', 'erizo', 'topo'
    ]
    
    text_lower = text.lower()
    
    for animal in animales:
        if animal in text_lower:
            return animal.capitalize()
    
    return None


def register_animal_explored(user, animal_name):
    """
    Registra o actualiza un animal explorado por el usuario
    """
    if user.is_guest or not animal_name:
        return None
    
    from .models import AnimalExplored
    
    try:
        animal, created = AnimalExplored.objects.get_or_create(
            user=user,
            animal_name=animal_name.capitalize(),
            defaults={
                'times_explored': 1,
                'first_explored_at': timezone.now(),
                'last_explored_at': timezone.now()
            }
        )
        
        if not created:
            animal.times_explored += 1
            animal.last_explored_at = timezone.now()
            animal.save()
        
        return animal
    except Exception as e:
        print(f"Error registrando animal: {e}")
        return None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_animals_explored(request):
    """
    Obtiene la lista de animales explorados por el usuario
    GET /api/explorer/animals
    """
    user = request.user
    
    if user.is_guest:
        return Response([], status=status.HTTP_200_OK)
    
    from .models import AnimalExplored
    
    animals = AnimalExplored.objects.filter(user=user).order_by('-last_explored_at')
    
    data = [{
        'id': str(animal.id),
        'name': animal.animal_name,
        'times_explored': animal.times_explored,
        'is_favorite': animal.is_favorite,
        'first_explored_at': animal.first_explored_at,
        'last_explored_at': animal.last_explored_at
    } for animal in animals]
    
    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_stats(request):
    """
    Obtiene estadísticas del usuario para el dashboard
    GET /api/user/stats
    """
    try:
        user = request.user
        
        print(f"🔍 DEBUG get_user_stats - Usuario: {user.username}, ID: {user.id}, is_guest: {user.is_guest}")
        
        if user.is_guest:
            print("👤 Usuario invitado - retornando ceros")
            return Response({
                'total_animals': 0,
                'total_chats': 0,
                'total_messages': 0,
                'current_streak': 0
            }, status=status.HTTP_200_OK)
        
        from .models import AnimalExplored, Chat, ChatMessage, UserProgress
        
        # Contar animales únicos explorados
        total_animals = AnimalExplored.objects.filter(user=user).count()
        print(f"🐾 Total animales: {total_animals}")
        
        # Contar chats totales
        total_chats = Chat.objects.filter(user=user).count()
        print(f"💬 Total chats: {total_chats}")
        
        # Contar mensajes totales
        total_messages = ChatMessage.objects.filter(
            chat__user=user
        ).count()
        print(f"📝 Total mensajes: {total_messages}")
        
        # Obtener racha actual
        try:
            progress = UserProgress.objects.get(user=user)
            current_streak = progress.current_streak_days
            print(f"🔥 Racha actual: {current_streak}")
        except UserProgress.DoesNotExist:
            print("⚠️ UserProgress no existe - creando con racha 0")
            current_streak = 0
        
        response_data = {
            'total_animals': total_animals,
            'total_chats': total_chats,
            'total_messages': total_messages,
            'current_streak': current_streak
        }
        
        print(f"✅ Respuesta exitosa: {response_data}")
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"❌ ERROR en get_user_stats: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': str(e),
            'type': type(e).__name__
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
