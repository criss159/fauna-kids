import { api } from '../utils/api'

// Llamada al backend Django con fallback a mock
// Ahora soporta historial de conversación para respuestas más naturales
export async function askExplorer(query, conversationHistory = []){
  const q = (query || '').trim()
  if(!q) return 'Escribe el nombre de un animal.'
  
  // Ya no limpiamos caracteres especiales para permitir preguntas naturales
  
  try{
    const basePath = import.meta?.env?.VITE_EXPLORER_PATH || '/explorer/'
    
    // Si hay historial, usar POST; sino GET (legacy)
    let data
    if (conversationHistory.length > 0) {
      data = await api.post(basePath, {
        message: q,
        history: conversationHistory
      }, { headers: { 'X-AI-Provider': 'gemini' } })
    } else {
      // Fallback a GET para compatibilidad
      const path = `${basePath}?q=${encodeURIComponent(q)}`
      data = await api.get(path, { headers: { 'X-AI-Provider': 'gemini' } })
    }
    
    // Validar respuesta del backend
    if (typeof data === 'string') {
      // Filtrar respuestas "Unknown word"
      if (data.includes('Unknown word') || data.includes('unknown word')) {
        return `No encontré información específica sobre "${q}". ¿Podrías ser más específico o probar con otro animal?`
      }
      return data
    }
    
    if (data && typeof data.answer === 'string') {
      if (data.answer.includes('Unknown word') || data.answer.includes('unknown word')) {
        return `No encontré información específica sobre "${q}". ¿Podrías ser más específico o probar con otro animal?`
      }
      return data.answer
    }
    
    return `Información sobre ${q}: Es un tema interesante. ¿Podrías ser más específico para darte mejores detalles?`
  }catch{
    // Fallback local si el backend no está disponible
    return `Información sobre ${q}: Es un animal fascinante que vive en hábitats variados. Aquí podrías añadir datos de interés como su alimentación, tamaño y curiosidades.`
  }
}

// Generación de imagen (vía backend Gemini Imagen). Devuelve { dataUrl, mime } o null en error.
export async function generateExplorerImage(prompt, { size = '768x768' } = {}){
  const p = (prompt || '').trim()
  if(!p) return null
  
  // Limpiar el prompt para evitar caracteres problemáticos
  const cleanPrompt = p.replace(/[^a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s]/g, '').trim()
  if(!cleanPrompt) return null
  
  try{
    const res = await api.post('/images/generate', { prompt: p, size })
    // Backend puede responder { imageBase64, mime } o { imageUrl }
    if(res?.imageBase64){
      const mime = res?.mime || 'image/png'
      return { dataUrl: `data:${mime};base64,${res.imageBase64}`, mime }
    }
    if(res?.imageUrl){
      return { dataUrl: res.imageUrl, mime: 'image/png' }
    }
    return null
  }catch{
    // Si el error indica que la generación de imágenes no está disponible, devolver null
    return null
  }
}

// Convertir texto a voz usando Google Cloud Text-to-Speech
export async function textToSpeech(text, options = {}) {
  const t = (text || '').trim()
  if (!t) {
    return null
  }

  try {
    const res = await api.post('/tts/synthesize', {
      text: t,
      languageCode: options.languageCode || 'es-US',
      voiceName: options.voiceName || 'es-US-Neural2-B', // Voz masculina joven
      pitch: options.pitch !== undefined ? options.pitch : 5.0, // Agudo estilo Bob Esponja
      speakingRate: options.speakingRate !== undefined ? options.speakingRate : 1.2 // Rápido
    })

    if (res?.audioContent) {
      return {
        audioBase64: res.audioContent,
        mime: res.mime || 'audio/mp3',
        voice: res.voice
      }
    }
    
    console.error('❌ No se recibió audioContent en la respuesta')
    return null
  } catch (error) {
    console.error('❌ Error en Text-to-Speech:', error)
    console.error('Detalles del error:', error.response?.data || error.message)
    return null
  }
}
