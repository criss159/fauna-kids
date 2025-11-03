# 🎙️ Google Cloud Text-to-Speech Integration

## 📋 Resumen

Se integró **Google Cloud Text-to-Speech** para reemplazar el Web Speech API nativo del navegador y proporcionar voces más naturales y de mayor calidad para Jaggy.

---

## 🎯 Objetivo

Mejorar la calidad de voz de Jaggy con una voz neural más natural que suene como "Bob Esponja": aguda, rápida y enérgica.

---

## 🔧 Cambios Realizados

### 1. Backend (`backend/api/views.py`)

#### **Imports Agregados**
```python
from google.cloud import texttospeech
```

#### **Nuevo Endpoint: `/api/tts/synthesize`**
- **Método**: POST
- **Body**:
  ```json
  {
    "text": "Texto a convertir en voz",
    "languageCode": "es-US",
    "voiceName": "es-US-Neural2-B",
    "pitch": 5.0,
    "speakingRate": 1.2
  }
  ```
- **Response**:
  ```json
  {
    "audioContent": "base64_encoded_audio",
    "mime": "audio/mp3",
    "voice": "es-US-Neural2-B",
    "text": "texto_limpio"
  }
  ```

#### **Características**
- Limpia emojis del texto antes de enviar
- Voz por defecto: `es-US-Neural2-B` (masculina joven)
- Pitch: 5.0 (agudo estilo Bob Esponja)
- Speaking Rate: 1.2 (rápido y enérgico)
- Formato de salida: MP3

---

### 2. Frontend (`frontend/src/services/explorer.service.js`)

#### **Nueva Función: `textToSpeech()`**
```javascript
export async function textToSpeech(text, options = {}) {
  const res = await api.post('/tts/synthesize', {
    text: t,
    languageCode: options.languageCode || 'es-US',
    voiceName: options.voiceName || 'es-US-Neural2-B',
    pitch: options.pitch !== undefined ? options.pitch : 5.0,
    speakingRate: options.speakingRate !== undefined ? options.speakingRate : 1.2
  })

  return {
    audioBase64: res.audioContent,
    mime: res.mime || 'audio/mp3',
    voice: res.voice
  }
}
```

---

### 3. Componente Explorer (`frontend/src/pages/Explorer.jsx`)

#### **Cambios Principales**

1. **Import del servicio**:
   ```javascript
   import { askExplorer, generateExplorerImage, textToSpeech } from '../services/explorer.service';
   ```

2. **Nueva referencia para el audio**:
   ```javascript
   const audioRef = useRef(null)
   ```

3. **Función `speakText()` reescrita**:
   ```javascript
   async function speakText(text) {
     // Detener audio anterior si existe
     if (audioRef.current) {
       audioRef.current.pause()
       audioRef.current = null
     }

     // Generar audio con Google Cloud TTS
     const audioData = await textToSpeech(text, {
       languageCode: 'es-US',
       voiceName: 'es-US-Neural2-B',
       pitch: 5.0,
       speakingRate: 1.2
     })

     // Convertir base64 a Blob y reproducir
     const audioBlob = base64ToBlob(audioData.audioBase64, audioData.mime)
     const audioUrl = URL.createObjectURL(audioBlob)
     const audio = new Audio(audioUrl)
     
     audioRef.current = audio
     await audio.play()
   }
   ```

4. **Función auxiliar `base64ToBlob()`**:
   ```javascript
   function base64ToBlob(base64, mimeType) {
     const byteCharacters = atob(base64)
     const byteArrays = []

     for (let offset = 0; offset < byteCharacters.length; offset += 512) {
       const slice = byteCharacters.slice(offset, offset + 512)
       const byteNumbers = new Array(slice.length)
       
       for (let i = 0; i < slice.length; i++) {
         byteNumbers[i] = slice.charCodeAt(i)
       }
       
       const byteArray = new Uint8Array(byteNumbers)
       byteArrays.push(byteArray)
     }

     return new Blob(byteArrays, { type: mimeType })
   }
   ```

5. **Actualización de `toggleVoice()`**:
   ```javascript
   function toggleVoice() {
     if (!newValue) {
       // Detener voz si se desactiva
       if (audioRef.current) {
         audioRef.current.pause()
         audioRef.current = null
       }
       setIsSpeaking(false)
     }
   }
   ```

---

### 4. Dependencias (`backend/requirements.txt`)

#### **Agregado**:
```txt
# Google Cloud Text-to-Speech (para voz natural)
google-cloud-texttospeech>=2.14.0
```

---

### 5. URLs (`backend/api/urls.py`)

#### **Nueva ruta**:
```python
path('tts/synthesize', views.text_to_speech, name='text_to_speech'),
```

---

## 🧪 Pruebas

### Script de Prueba: `backend/scripts/test_tts.py`

Ejecutar:
```bash
cd backend
python scripts/test_tts.py
```

**Resultado esperado**:
```
============================================================
🎤 TEST: Google Cloud Text-to-Speech
============================================================

1. Credenciales: E:/proyecto de grado/fauna-kids/backend/credentials.json
   Existe: True

2. ✅ Biblioteca google-cloud-texttospeech importada correctamente
3. ✅ Cliente Text-to-Speech creado correctamente

4. Generando audio de prueba...
   ✅ Audio generado exitosamente
   📁 Guardado en: E:\proyecto de grado\fauna-kids\backend\scripts\test_audio.mp3
   📊 Tamaño: 32064 bytes

============================================================
✅ TODAS LAS PRUEBAS PASARON EXITOSAMENTE
============================================================
```

---

## 📊 Comparación: Web Speech API vs Google Cloud TTS

| Característica | Web Speech API | Google Cloud TTS |
|----------------|----------------|------------------|
| **Calidad de voz** | Sintética, varía por navegador | Neural, muy natural |
| **Consistencia** | Depende del sistema/navegador | Consistente en todos los dispositivos |
| **Costo** | Gratis | $4 por 1M caracteres |
| **Latencia** | Instantánea (local) | ~1-2 segundos (red) |
| **Personalización** | Limitada (pitch, rate, volume) | Avanzada (SSML, efectos de voz) |
| **Disponibilidad offline** | Sí (voces del sistema) | No (requiere internet) |
| **Idiomas** | Limitado a voces instaladas | 220+ voces, 40+ idiomas |

---

## 🎵 Voces Disponibles en Google Cloud TTS

### Voces en Español (es-US)

| Nombre | Tipo | Género | Descripción |
|--------|------|--------|-------------|
| **es-US-Neural2-B** | Neural | Masculino | **VOZ ACTUAL** - Joven, clara |
| es-US-Neural2-A | Neural | Femenino | Natural, profesional |
| es-US-Neural2-C | Neural | Femenino | Cálida, amigable |
| es-US-Standard-A | Standard | Femenino | Sintética básica |
| es-US-Standard-B | Standard | Masculino | Sintética básica |

### Otras opciones para probar:
- `es-US-News-D` - Voz de noticias (masculina)
- `es-US-News-E` - Voz de noticias (femenina)
- `es-US-Wavenet-B` - Alta calidad (masculina)

**Cambiar voz**: Modificar `voiceName` en el endpoint `/api/tts/synthesize`.

---

## 🔐 Configuración de Credenciales

### Archivo `.env` (backend)
```env
GOOGLE_APPLICATION_CREDENTIALS=E:/proyecto de grado/fauna-kids/backend/credentials.json
```

### Credenciales de Google Cloud
El archivo `credentials.json` debe tener permisos para:
- **Cloud Text-to-Speech API**
- **Vertex AI API** (para imágenes)

---

## 📝 Configuración de Voz Estilo Bob Esponja

```javascript
// Parámetros actuales
voiceName: 'es-US-Neural2-B'  // Voz masculina joven
pitch: 5.0                     // Muy agudo (rango: -20 a 20)
speakingRate: 1.2              // Rápido (rango: 0.25 a 4.0)
```

**Para ajustar**:
- **Más agudo**: Aumentar `pitch` (máximo 20.0)
- **Más rápido**: Aumentar `speakingRate` (máximo 4.0)
- **Voz diferente**: Cambiar `voiceName` a otra de la tabla

---

## 🚀 Uso en la Aplicación

1. **Usuario abre Explorer** (`http://localhost:5173/explorer`)
2. **Activa la voz** (botón de micrófono en la UI)
3. **Jaggy responde** con la nueva voz de Google Cloud TTS
4. **Audio se genera** en el backend y se reproduce en el navegador

---

## 🐛 Problemas Conocidos y Soluciones

### Error: "Text-to-Speech no disponible"
**Causa**: Biblioteca no instalada.
**Solución**:
```bash
cd backend
pip install google-cloud-texttospeech
```

### Error: "No se encontraron las credenciales"
**Causa**: `GOOGLE_APPLICATION_CREDENTIALS` no configurado.
**Solución**:
1. Verificar archivo `.env` en backend
2. Verificar que `credentials.json` exista
3. Reiniciar el servidor Django

### Audio no se reproduce
**Causa**: Navegador bloqueó autoplay.
**Solución**:
- El usuario debe interactuar primero (click en la página)
- El audio solo se reproduce si `voiceEnabled` está activado

### Latencia alta
**Causa**: Generación de audio en la nube.
**Solución**:
- Implementar caché de respuestas frecuentes
- Considerar pre-generar audios comunes

---

## 💰 Costos Estimados

### Google Cloud Text-to-Speech Pricing

| Tipo de Voz | Precio por 1M caracteres |
|--------------|--------------------------|
| Standard | $4.00 USD |
| **Neural (WaveNet)** | **$16.00 USD** |

### Ejemplo de Uso
- Respuesta promedio: 150 caracteres
- 1000 respuestas al día: 150,000 caracteres
- 30 días: 4,500,000 caracteres (~4.5M)
- **Costo mensual**: ~$18 USD (Neural) o ~$4.5 USD (Standard)

**Recomendación**: Usar voces Standard para desarrollo, Neural para producción.

---

## 📚 Referencias

- [Google Cloud Text-to-Speech Docs](https://cloud.google.com/text-to-speech/docs)
- [Voces disponibles](https://cloud.google.com/text-to-speech/docs/voices)
- [SSML Tutorial](https://cloud.google.com/text-to-speech/docs/ssml)
- [Pricing](https://cloud.google.com/text-to-speech/pricing)

---

## ✅ Checklist de Integración

- [x] Instalar `google-cloud-texttospeech`
- [x] Crear endpoint `/api/tts/synthesize`
- [x] Agregar servicio `textToSpeech()` en frontend
- [x] Actualizar componente `Explorer.jsx`
- [x] Configurar credenciales de Google Cloud
- [x] Crear script de prueba `test_tts.py`
- [x] Documentar configuración de voz
- [x] Probar reproducción de audio
- [ ] **PENDIENTE**: Probar en producción
- [ ] **PENDIENTE**: Implementar caché de audios
- [ ] **PENDIENTE**: Agregar fallback a Web Speech API

---

## 🎉 Resultado Final

Jaggy ahora tiene una voz **natural, clara y energética** similar a Bob Esponja gracias a:
- Voz neural de Google Cloud (`es-US-Neural2-B`)
- Pitch alto (5.0) para sonido agudo
- Speaking rate rápido (1.2) para energía
- Calidad profesional consistente en todos los dispositivos

---

**Fecha de Integración**: 2 de noviembre de 2025  
**Versión**: 1.0.0  
**Estado**: ✅ Completado
