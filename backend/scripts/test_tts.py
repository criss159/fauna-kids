"""
Script de prueba para Google Cloud Text-to-Speech
"""
import os
import sys
from pathlib import Path

# Agregar el directorio backend al path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Cargar variables de entorno
from dotenv import load_dotenv
load_dotenv(backend_dir / '.env')

print("=" * 60)
print("🎤 TEST: Google Cloud Text-to-Speech")
print("=" * 60)

# Verificar credenciales
creds_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
print(f"\n1. Credenciales: {creds_path}")
print(f"   Existe: {Path(creds_path).exists() if creds_path else False}")

# Intentar importar la biblioteca
try:
    from google.cloud import texttospeech
    print("\n2. ✅ Biblioteca google-cloud-texttospeech importada correctamente")
except ImportError as e:
    print(f"\n2. ❌ Error importando: {e}")
    sys.exit(1)

# Intentar crear cliente
try:
    client = texttospeech.TextToSpeechClient()
    print("3. ✅ Cliente Text-to-Speech creado correctamente")
except Exception as e:
    print(f"3. ❌ Error creando cliente: {e}")
    sys.exit(1)

# Intentar generar audio de prueba
try:
    print("\n4. Generando audio de prueba...")
    
    text = "¡Hola! Soy Jaggy, el jaguar más entusiasta del mundo. ¿Te gusta mi voz?"
    
    synthesis_input = texttospeech.SynthesisInput(text=text)
    
    voice = texttospeech.VoiceSelectionParams(
        language_code='es-US',
        name='es-US-Neural2-B'  # Voz masculina joven
    )
    
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        pitch=5.0,  # Agudo estilo Bob Esponja
        speaking_rate=1.2  # Rápido
    )
    
    response = client.synthesize_speech(
        input=synthesis_input,
        voice=voice,
        audio_config=audio_config
    )
    
    # Guardar archivo de prueba
    output_file = backend_dir / 'scripts' / 'test_audio.mp3'
    with open(output_file, 'wb') as out:
        out.write(response.audio_content)
    
    print(f"   ✅ Audio generado exitosamente")
    print(f"   📁 Guardado en: {output_file}")
    print(f"   📊 Tamaño: {len(response.audio_content)} bytes")
    
except Exception as e:
    print(f"4. ❌ Error generando audio: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "=" * 60)
print("✅ TODAS LAS PRUEBAS PASARON EXITOSAMENTE")
print("=" * 60)
print("\n💡 Puedes reproducir el archivo test_audio.mp3 para escuchar la voz")
