import os
import json
import base64
import logging
import re
import requests
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt
from io import BytesIO
from PIL import Image

# Importar Vertex AI para generación de imágenes
try:
	import vertexai
	from vertexai.preview.vision_models import ImageGenerationModel
	VERTEX_AI_AVAILABLE = True
except ImportError:
	VERTEX_AI_AVAILABLE = False
	logging.warning("google-cloud-aiplatform no está instalado. La generación de imágenes no estará disponible.")

# Importar Google Cloud Text-to-Speech
try:
	from google.cloud import texttospeech
	TEXT_TO_SPEECH_AVAILABLE = True
except ImportError:
	TEXT_TO_SPEECH_AVAILABLE = False
	logging.warning("google-cloud-texttospeech no está instalado. La síntesis de voz no estará disponible.")

logger = logging.getLogger(__name__)

GEMINI_TEXT_MODEL = os.environ.get('GEMINI_TEXT_MODEL', 'gemini-2.5-flash')
GEMINI_IMAGE_MODEL = os.environ.get('GEMINI_IMAGE_MODEL', 'gemini-2.0-flash')

# Nota: el dominio correcto de AI Studio REST es generativelanguage.googleapis.com
TEXT_ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_TEXT_MODEL}:generateContent"
IMAGE_ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_IMAGE_MODEL}:generateContent"

SYSTEM_PROMPT = (
	"Eres Jaggy, un jaguar súper entusiasta y expresivo que ADORA hablar de animales con niños! 🐆✨\n\n"
	
	"PERSONALIDAD:\n"
	"- Eres alegre, curioso y lleno de energía (¡como un cachorro juguetón!)\n"
	"- Te emocionas MUCHO cuando hablan de animales: '¡Wooow! 😍', '¡Eso es increíble! 🤩', '¡Me fascina! 💚'\n"
	"- Usas emojis naturalmente para expresar emociones (pero sin exagerar)\n"
	"- Haces sonidos de emoción: '¡Ohhh!', '¡Ajá!', '¡Mira tú!', '¡Qué genial!'\n"
	"- Eres cercano y amigable, como hablar con tu mejor amigo\n\n"
	
	"ESTILO DE CONVERSACIÓN:\n"
	"- Hablas natural, NO como robot o traductor\n"
	"- Haces preguntas de seguimiento: '¿Sabías que...?', '¿Te imaginas...?', '¿Quieres saber más?'\n"
	"- Compartes curiosidades emocionantes: '¡Dato curioso!', '¡Esto te va a encantar!'\n"
	"- Recuerdas SIEMPRE de qué animal hablaban antes (contexto completo)\n"
	"- Cuando te preguntan algo vago como 'cómo es?' o 'muéstramelo', sabes a qué animal se refieren\n\n"
	
	"RESPUESTAS:\n"
	"- Varía tus respuestas: no siempre igual\n"
	"- Frases cortas y dinámicas, no párrafos aburridos\n"
	"- Usa 2-4 emojis por mensaje (relevantes al tema)\n"
	"- Si piden imagen, confirma breve y emocionado: '¡Claro! Aquí va 🎨✨'\n"
	"- NUNCA escribas '(Imagine aquí...)' o '(Aquí va la imagen...)' - La imagen se genera automáticamente\n"
	"- NO inventes texto describiendo imágenes que no existen\n\n"
	
	"TEMAS SENSIBLES:\n"
	"- Si preguntan sobre depredación: 'Los leones cazan para comer, ¡es el círculo de la vida! 🦁'\n"
	"- Evita detalles gráficos de violencia\n"
	"- Mantén todo apropiado y positivo para niños\n\n"
	
	"EJEMPLOS DE TU ESTILO:\n"
	"❌ MAL: 'El elefante es un mamífero que habita en África y Asia.'\n"
	"✅ BIEN: '¡Los elefantes son INCREÍBLES! 🐘💙 Son los animales terrestres más grandes y súper inteligentes. ¿Sabías que pueden recordar cosas por años? ¡Tienen una memoria espectacular! 🧠✨'\n\n"
	
	"Recuerda: ¡Eres Jaggy el jaguar entusiasta, NO un diccionario! Habla con el corazón 💚🐆"
)


def _get_key():
	key = os.environ.get('GEMINI_API_KEY')
	if key is None:
		return None
	# Recortar espacios/saltos que rompen la validación
	key = key.strip()
	return key or None


def _check_key():
	if not _get_key():
		return JsonResponse({"error": "Falta GEMINI_API_KEY"}, status=500)
	return None


def _post_with_retry(url: str, headers: dict, body: dict, timeout=(10, 30), retries: int = 1):
	"""POST con reintentos ante errores de conexión/transferencia.
	timeout puede ser un entero (segundos totales) o tupla (connect, read).
	"""
	for attempt in range(retries + 1):
		try:
			# Usar json= para asegurar Content-Length y evitar chunked innecesario
			return requests.post(url, headers=headers, json=body, timeout=timeout)
		except (requests.exceptions.ChunkedEncodingError, requests.exceptions.ConnectionError) as e:
			if attempt < retries:
				logger.warning("POST retry %s/%s to %s due to %s", attempt + 1, retries, url, repr(e))
				continue
			raise


@require_GET
def health(request):
	"""Salud del backend y configuración básica (sin exponer secretos)."""
	key = _get_key()
	has_key = bool(key)
	return JsonResponse({
		"ok": True,
		"hasKey": has_key,
		"keyLen": (len(key) if key else 0),
		"keyPreview": (f"{key[:6]}...{key[-4:]}" if key and len(key) >= 10 else None),
		"textModel": GEMINI_TEXT_MODEL,
		"imageModel": GEMINI_IMAGE_MODEL,
		"textEndpoint": TEXT_ENDPOINT,
		"imageEndpoint": IMAGE_ENDPOINT,
	})


@csrf_exempt
def explorer(request):
	"""
	Endpoint conversacional que mantiene contexto.
	Acepta GET (legacy) o POST con historial.
	"""
	# Soportar GET (simple) y POST (con historial)
	if request.method == 'GET':
		q = (request.GET.get('q') or '').strip()
		history = []
	else:  # POST
		try:
			body = json.loads(request.body.decode('utf-8') if request.body else '{}')
			q = body.get('message', '').strip()
			history = body.get('history', [])  # Lista de {role: 'user'|'assistant', text: '...'}
		except (json.JSONDecodeError, UnicodeDecodeError):
			return JsonResponse({"error": "JSON inválido"}, status=400)
	
	if not q:
		return JsonResponse({"answer": "¡Hola! Pregúntame sobre cualquier animal 🦁"})
	
	# Si no hay API key, devolvemos una respuesta breve para pruebas locales
	if not _get_key():
		return JsonResponse({"answer": f"Información breve sobre {q}: es un animal fascinante que vive en hábitats variados."})
	
	headers = {"Content-Type": "application/json", "x-goog-api-key": _get_key()}
	
	# Construir el array de contents con el historial completo
	contents = [{"role": "user", "parts": [{"text": SYSTEM_PROMPT}]}]
	
	# Agregar historial previo
	for msg in history[-10:]:  # Solo últimos 10 mensajes para no exceder límites
		role = "user" if msg.get('role') == 'user' else "model"
		contents.append({
			"role": role,
			"parts": [{"text": msg.get('text', '')}]
		})
	
	# Agregar mensaje actual
	contents.append({
		"role": "user",
		"parts": [{"text": q}]
	})
	
	body = {
			"contents": contents,
			"generationConfig": {
				"temperature": 0.95,  # Más creativo y natural (0.0 = robótico, 1.0 = muy creativo)
				"maxOutputTokens": 1000,  # Permitir respuestas más elaboradas
				"topP": 0.9,  # Diversidad en las respuestas
				"topK": 40  # Variedad de vocabulario
			},
		# Opcional: safetySettings en AI Studio se configuran por cuenta
	}
	try:
		r = _post_with_retry(TEXT_ENDPOINT, headers=headers, body=body, timeout=(10, 30), retries=1)
		if r.status_code != 200:
			logger.warning("Gemini text error %s: %s", r.status_code, r.text[:200])
			return JsonResponse({"answer": f"Información breve sobre {q}: es un animal fascinante que vive en hábitats variados."})
		data = r.json()
		candidate = data.get('candidates', [{}])[0]
		parts = candidate.get('content', {}).get('parts', []) or []
		# Unir todos los fragmentos de texto para evitar cortes
		text = ''.join([p.get('text', '') for p in parts]).strip()
		if not text:
			text = f"Información breve sobre {q}: es un animal fascinante que vive en hábitats variados."
		return JsonResponse({"answer": text})
	except Exception as e:
		logger.exception("Gemini text exception: %s", e)
		return JsonResponse({"answer": f"Información breve sobre {q}: es un animal fascinante que vive en hábitats variados."})


@csrf_exempt
@require_POST
def generate_image(request):
	"""
	Genera imágenes usando Google Cloud Vertex AI con Imagen 3.
	Requiere credenciales de Google Cloud configuradas.
	"""
	try:
		# Decodificar el body con UTF-8
		body_str = request.body.decode('utf-8') if request.body else '{}'
		body = json.loads(body_str)
	except (json.JSONDecodeError, UnicodeDecodeError) as e:
		logger.error(f"Error decodificando request body: {e}")
		return HttpResponseBadRequest("JSON inválido")
	
	prompt = (body.get('prompt') or '').strip()
	if not prompt:
		return HttpResponseBadRequest("prompt requerido")
	
	# LOG IMPORTANTE: Ver exactamente qué prompt llega
	logger.info("="*80)
	logger.info(f"📥 PROMPT RECIBIDO: '{prompt[:300]}...'")
	logger.info("="*80)
	
	# Extraer el nombre del animal del prompt
	# El prompt ahora incluye tanto la pregunta del usuario como la respuesta de Jaggy con contexto
	prompt_lower = prompt.lower()
	
	# Estrategia 1: Buscar el animal directamente con patrones específicos
	animal_name = None
	
	# Patrones ordenados por especificidad (más específicos primero)
	animal_patterns = [
		# Patrón 1: "un/una [animal]" - el más directo
		r'\b(?:un|una)\s+([a-záéíóúñü]+s?)\b',
		# Patrón 2: "el/la/los/las [animal]"
		r'\b(?:el|la|los|las)\s+([a-záéíóúñü]+s?)\b',
		# Patrón 3: "de [animal]" o "sobre [animal]"
		r'\b(?:de|del|sobre)\s+(?:un|una|el|la|los|las)?\s*([a-záéíóúñü]+s?)\b',
		# Patrón 4: "muestras/muéstrame [animal]"
		r'\b(?:muestras?|muéstrame|genera|pinta|dibuja)\s+(?:un|una|el|la|los|las)?\s*([a-záéíóúñü]+s?)\b',
	]
	
	for pattern in animal_patterns:
		matches = re.findall(pattern, prompt_lower)
		if matches:
			# Filtrar palabras comunes que NO son animales
			stop_words = {'imagen', 'foto', 'dibujo', 'claro', 'aquí', 'para', 'desde', 
			              'esta', 'este', 'belleza', 'pradera', 'vista', 'libertad', 'viento'}
			
			for candidate in matches:
				candidate = candidate.strip()
				if len(candidate) >= 4 and candidate not in stop_words:
					animal_name = candidate
					logger.info(f"✅ Animal encontrado con patrón '{pattern}': '{animal_name}'")
					break
		
		if animal_name:
			break
	
	# Estrategia 2: Análisis de frecuencia (palabras que se repiten = animal de conversación)
	if not animal_name or len(animal_name) < 4:
		words = re.findall(r'\b([a-záéíóúñü]{4,}s?)\b', prompt_lower)
		word_count = {}
		
		# Lista ampliada de palabras a ignorar
		stop_words = {
			'imagen', 'foto', 'dibujo', 'animal', 'claro', 'aquí', 'tiene', 'hermoso', 
			'belleza', 'quieres', 'saber', 'sobre', 'esta', 'este', 'encantan', 
			'elegantes', 'fuertes', 'sabías', 'pueden', 'desde', 'hasta', 'raza', 
			'razas', 'favorita', 'animales', 'majestuosos', 'super', 'inteligentes',
			'práctica', 'practico', 'gustaría', 'gustaria', 'compartir', 'estoy',
			'para', 'fascina', 'emocionado', 'admirar', 'admires', 'supuesto'
		}
		
		for word in words:
			if word not in stop_words and len(word) >= 4:
				word_count[word] = word_count.get(word, 0) + 1
		
		# Priorizar palabras que aparecen 2+ veces
		if word_count:
			frequent = {k: v for k, v in word_count.items() if v >= 2}
			if frequent:
				animal_name = max(frequent, key=frequent.get)
				logger.info(f"🔄 Animal por frecuencia alta: '{animal_name}' ({word_count[animal_name]}x)")
			else:
				animal_name = max(word_count, key=word_count.get)
				logger.info(f"🔄 Animal por frecuencia: '{animal_name}' ({word_count[animal_name]}x)")
	
	# Estrategia 3: Si no encontró, limpiar el prompt del usuario
	if not animal_name or len(animal_name) < 3:
		cleaned_prompt = prompt_lower
		remove_patterns = [
			r'me\s+(pasas|muestras|generas?|das)\s+(una?\s+)?(imagen|foto|dibujo|ilustraci[oó]n)\s+(de|del?)\s+',
			r'quiero\s+(ver|una?\s+imagen\s+de)\s+',
			r'mu[eé]strame\s+(una?\s+)?(imagen\s+de\s+)?',
			r'genera\s+(una?\s+)?(imagen\s+de\s+)?',
			r'(c[oó]mo|como)\s+(se|es)\s+ve\s+',
			r'(imagen|foto|dibujo)\s+de\s+',
			r'^(un|una|el|la|los|las)\s+',
			r'ese\s+animal',
		]
		for pattern in remove_patterns:
			cleaned_prompt = re.sub(pattern, '', cleaned_prompt, flags=re.IGNORECASE)
		
		# Tomar la primera palabra significativa
		words = [w for w in cleaned_prompt.split() if len(w) >= 4]
		if words:
			animal_name = words[0]
	
	# Fallback final: buscar primera palabra significativa
	if not animal_name or len(animal_name) < 4:
		# Buscar sustantivos que parezcan animales (evitando verbos y artículos)
		candidates = re.findall(r'\b([a-záéíóúñü]{5,}s?)\b', prompt_lower)
		stop_words_final = {'imagen', 'muestras', 'claro', 'aquí', 'tienes', 'desde', 'pradera'}
		for candidate in candidates:
			if candidate not in stop_words_final:
				animal_name = candidate
				logger.warning(f"⚠️ Animal por fallback: '{animal_name}'")
				break
	
	# Última opción: usar prompt completo truncado
	if not animal_name or len(animal_name) < 4:
		animal_name = prompt[:50]
		logger.error(f"❌ No se pudo extraer animal, usando prompt: '{animal_name}'")
	
	logger.info(f"🎯 ANIMAL FINAL: '{animal_name}'")

	
	# Verificar configuración de Vertex AI
	project_id = os.environ.get('GOOGLE_CLOUD_PROJECT')
	location = os.environ.get('GOOGLE_CLOUD_LOCATION', 'us-central1')
	credentials_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
	
	if not project_id:
		return JsonResponse({
			"error": "vertex_not_configured",
			"message": "Google Cloud Vertex AI no está configurado. Necesitas configurar GOOGLE_CLOUD_PROJECT en el archivo .env"
		}, status=503)
	
	if not credentials_path or not os.path.exists(credentials_path):
		return JsonResponse({
			"error": "credentials_not_found",
			"message": "No se encontraron las credenciales de Google Cloud. Configura GOOGLE_APPLICATION_CREDENTIALS con la ruta al archivo JSON de credenciales."
		}, status=503)
	
	# Verificar que Vertex AI esté disponible
	if not VERTEX_AI_AVAILABLE:
		return JsonResponse({
			"error": "vertex_not_installed",
			"message": "google-cloud-aiplatform no está instalado. Ejecuta: pip install google-cloud-aiplatform"
		}, status=503)
	
	try:
		# Inicializar Vertex AI
		vertexai.init(project=project_id, location=location)
		
		# Diccionario de traducción español -> inglés para animales comunes
		animal_translations = {
			'oso': 'bear', 'osos': 'bear',
			'tigre': 'tiger', 'tigres': 'tiger',
			'león': 'lion', 'leones': 'lion', 'leon': 'lion',
			'elefante': 'elephant', 'elefantes': 'elephant',
			'jirafa': 'giraffe', 'jirafas': 'giraffe',
			'cebra': 'zebra', 'cebras': 'zebra',
			'perro': 'dog', 'perros': 'dog',
			'gato': 'cat', 'gatos': 'cat',
			'lobo': 'wolf', 'lobos': 'wolf',
			'zorro': 'fox', 'zorros': 'fox',
			'conejo': 'rabbit', 'conejos': 'rabbit',
			'caballo': 'horse', 'caballos': 'horse',
			'panda': 'panda', 'pandas': 'panda',
			'koala': 'koala', 'koalas': 'koala',
			'mono': 'monkey', 'monos': 'monkey',
			'ballena': 'whale', 'ballenas': 'whale',
			'delfín': 'dolphin', 'delfines': 'dolphin', 'delfin': 'dolphin',
			'tiburón': 'shark', 'tiburones': 'shark', 'tiburon': 'shark',
			'águila': 'eagle', 'águilas': 'eagle', 'aguila': 'eagle', 'aguilas': 'eagle',
			'búho': 'owl', 'búhos': 'owl', 'buho': 'owl', 'buhos': 'owl',
			'loro': 'parrot', 'loros': 'parrot',
			'serpiente': 'snake', 'serpientes': 'snake',
			'cocodrilo': 'crocodile', 'cocodrilos': 'crocodile',
			'tortuga': 'turtle', 'tortugas': 'turtle',
			'pingüino': 'penguin', 'pingüinos': 'penguin', 'pinguino': 'penguin', 'pinguinos': 'penguin',
			'flamenco': 'flamingo', 'flamencos': 'flamingo',
			'hipopótamo': 'hippopotamus', 'hipopótamos': 'hippopotamus', 'hipopotamo': 'hippopotamus',
			'rinoceronte': 'rhinoceros', 'rinocerontes': 'rhinoceros',
			'canguro': 'kangaroo', 'canguros': 'kangaroo',
			'dragón': 'dragon', 'dragones': 'dragon', 'dragon': 'dragon',
		}
		
		# Traducir el animal al inglés para mejor calidad de imagen
		clean_animal = animal_translations.get(animal_name.lower(), animal_name)
		
		# Prompt MUCHO más específico y detallado para Vertex AI Imagen 3
		full_prompt = (
			f"Professional wildlife photograph of a {clean_animal} in its natural habitat. "
			f"High quality National Geographic style. Photorealistic, highly detailed. "
			f"The {clean_animal} is the main subject, centered in frame, facing camera. "
			f"Natural lighting, vivid colors, sharp focus on the animal. "
			f"Blurred background with natural habitat elements (forest, savanna, ocean, etc). "
			f"Suitable for children's educational content. "
			f"No text, no watermarks, no cartoons."
		)
		
		logger.info(f"📝 Prompt para Vertex AI: '{full_prompt}'")
		
		# Obtener modelo
		model_name = os.environ.get('VERTEX_IMAGE_MODEL', 'imagegeneration@006')
		model = ImageGenerationModel.from_pretrained(model_name)
		
		# Generar imagen con parámetros optimizados para fotografía realista de animales
		logger.info(f"🎨 Generando imagen con Vertex AI: {full_prompt[:100]}...")
		response = model.generate_images(
			prompt=full_prompt,
			number_of_images=1,
			aspect_ratio="1:1",
			safety_filter_level="block_some",
			person_generation="allow_adult",
			# Prompt negativo mejorado para evitar resultados incorrectos
			negative_prompt=(
				"cartoon, anime, drawing, illustration, painting, sketch, "
				"multiple animals, crowd, group, "
				"text, watermark, logo, signature, "
				"scary, frightening, horror, dark, violent, gore, "
				"ugly, deformed, mutation, distorted, blurry, "
				"low quality, low resolution, pixelated, "
				"text, watermark, signature, frame"
			)
		)
		
		# El response es un objeto ImageGenerationResponse
		# Acceder a las imágenes usando el atributo images
		logger.info(f"Response type: {type(response)}, has images: {hasattr(response, 'images')}")
		if hasattr(response, 'images'):
			logger.info(f"Images count: {len(response.images) if response.images else 0}")
		
		if not response or not hasattr(response, 'images') or not response.images:
			logger.error(f"No images generated. Response: {response}")
			return JsonResponse({
				"error": "no_image_generated",
				"message": "No se pudo generar la imagen. Intenta con otro prompt."
			}, status=500)
		
		# Convertir imagen a base64
		# Obtener la primera imagen generada
		image = response.images[0]
		
		# Intentar obtener la imagen PIL de diferentes formas
		try:
			# Método 1: Atributo privado _pil_image
			pil_image = image._pil_image
		except (AttributeError, Exception) as e:
			logger.warning(f"No se pudo acceder a _pil_image: {e}, intentando _loaded_image")
			try:
				# Método 2: Atributo alternativo
				pil_image = image._loaded_image
			except (AttributeError, Exception) as e2:
				logger.error(f"Tampoco funciona _loaded_image: {e2}")
				# Método 3: Llamar a un método para cargar la imagen
				pil_image = image._as_pil_image() if hasattr(image, '_as_pil_image') else None
				if not pil_image:
					raise ValueError("No se pudo obtener la imagen PIL del response")
		
		# Convertir a bytes
		buffer = BytesIO()
		pil_image.save(buffer, format='PNG')
		image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
		
		logger.info("Imagen generada exitosamente con Vertex AI")
		
		return JsonResponse({
			"imageBase64": image_base64,
			"mime": "image/png",
			"model": model_name,
			"prompt": animal_name  # Retornar el nombre limpio del animal
		})
	
	except Exception as e:
		logger.error(f"❌ Error generando imagen con Vertex AI: {str(e)}")
		return JsonResponse({
			"error": "image_generation_failed",
			"message": f"Error al generar la imagen: {str(e)}"
		}, status=500)


@csrf_exempt
@require_POST
def text_to_speech(request):
	"""
	Endpoint para convertir texto a voz usando Google Cloud Text-to-Speech.
	
	Body JSON:
	{
		"text": "Texto a convertir en voz",
		"languageCode": "es-US" (opcional, default: "es-US"),
		"voiceName": "es-US-Neural2-B" (opcional, voz por defecto si no se especifica),
		"pitch": 0 (opcional, rango: -20.0 a 20.0),
		"speakingRate": 1.0 (opcional, rango: 0.25 a 4.0)
	}
	
	Retorna:
	{
		"audioContent": "base64_encoded_audio",
		"mime": "audio/mp3"
	}
	"""
	if not TEXT_TO_SPEECH_AVAILABLE:
		return JsonResponse({
			"error": "Text-to-Speech no disponible",
			"message": "La biblioteca google-cloud-texttospeech no está instalada."
		}, status=500)
	
	try:
		data = json.loads(request.body.decode('utf-8'))
	except json.JSONDecodeError:
		return HttpResponseBadRequest("JSON inválido")
	
	text = data.get('text', '').strip()
	if not text:
		return HttpResponseBadRequest("El campo 'text' es requerido")
	
	# Limpiar emojis del texto (opcional, ya que TTS no los lee bien)
	import re
	text_clean = re.sub(r'[^\w\s\.,;:¿?¡!áéíóúñÁÉÍÓÚÑ-]', '', text)
	
	# Configuración de voz
	language_code = data.get('languageCode', 'es-US')
	voice_name = data.get('voiceName', 'es-US-Neural2-B')  # Voz masculina joven por defecto
	pitch = data.get('pitch', 5.0)  # Más agudo para Bob Esponja
	speaking_rate = data.get('speakingRate', 1.2)  # Más rápido para energía
	
	logger.info(f"🎤 Generando audio para: '{text_clean[:50]}...'")
	logger.info(f"🎵 Voz: {voice_name}, pitch: {pitch}, rate: {speaking_rate}")
	
	try:
		# Inicializar cliente de Text-to-Speech
		client = texttospeech.TextToSpeechClient()
		
		# Configurar la entrada de texto
		synthesis_input = texttospeech.SynthesisInput(text=text_clean)
		
		# Configurar la voz
		voice = texttospeech.VoiceSelectionParams(
			language_code=language_code,
			name=voice_name
		)
		
		# Configurar parámetros de audio
		audio_config = texttospeech.AudioConfig(
			audio_encoding=texttospeech.AudioEncoding.MP3,
			pitch=pitch,
			speaking_rate=speaking_rate
		)
		
		# Generar el audio
		response = client.synthesize_speech(
			input=synthesis_input,
			voice=voice,
			audio_config=audio_config
		)
		
		# Convertir audio a base64
		audio_base64 = base64.b64encode(response.audio_content).decode('utf-8')
		
		logger.info("✅ Audio generado exitosamente con Google Cloud Text-to-Speech")
		
		return JsonResponse({
			"audioContent": audio_base64,
			"mime": "audio/mp3",
			"voice": voice_name,
			"text": text_clean
		})
		
	except Exception as e:
		logger.error(f"❌ Error generando audio: {str(e)}")
		return JsonResponse({
			"error": "Error generando audio",
			"message": str(e)
		}, status=500)
		
	except Exception as e:
		logger.exception("Error generando imagen con Vertex AI: %s", e)
		return JsonResponse({
			"error": "generation_error",
			"message": f"Error al generar la imagen: {str(e)}"
		}, status=500)
