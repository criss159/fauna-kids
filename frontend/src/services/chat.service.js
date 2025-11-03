/**
 * Servicio para gestionar el historial de chat
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

/**
 * Obtiene el token de acceso de localStorage
 */
function getAccessToken() {
    return localStorage.getItem('fauna_access_token')
}

/**
 * Verifica si el usuario es invitado
 */
function isGuestUser() {
    const nick = localStorage.getItem('fauna_nick')
    return nick && nick.startsWith('guest_')
}

/**
 * Guarda un mensaje de chat en el historial
 * @param {string} userMessage - Mensaje del usuario
 * @param {string} assistantMessage - Respuesta del asistente
 * @param {string|null} sessionId - ID de sesión (opcional, se crea una nueva si no se proporciona)
 * @param {string|null} animalMentioned - Animal mencionado en la conversación (opcional)
 * @returns {Promise<{session_id: string, message: string}>}
 */
export async function saveChatMessage(userMessage, assistantMessage, sessionId = null, animalMentioned = null) {
    // No guardar si es invitado
    if (isGuestUser()) {
        return { session_id: null, message: 'Guest user, not saved' }
    }

    const token = getAccessToken()
    if (!token) {
        return { session_id: null, message: 'No token' }
    }

    try {
        const response = await fetch(`${API_URL}/chat/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                user_message: userMessage,
                assistant_message: assistantMessage,
                session_id: sessionId,
                animal_mentioned: animalMentioned
            })
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Error al guardar el mensaje')
        }

        const data = await response.json()
        return data
    } catch (error) {
        console.error('Error guardando mensaje de chat:', error)
        return { session_id: sessionId, message: 'Error saving' }
    }
}

/**
 * Obtiene todas las sesiones de chat del usuario
 * @returns {Promise<Array>}
 */
export async function getChatSessions() {
    if (isGuestUser()) {
        return []
    }

    const token = getAccessToken()
    if (!token) {
        return []
    }

    try {
        const response = await fetch(`${API_URL}/chat/sessions`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })

        if (!response.ok) {
            throw new Error('Error al obtener sesiones')
        }

        const data = await response.json()
        return data.sessions || []
    } catch (error) {
        console.error('Error obteniendo sesiones:', error)
        return []
    }
}

/**
 * Obtiene los mensajes de una sesión específica
 * @param {string} sessionId - ID de la sesión
 * @returns {Promise<Array>}
 */
export async function getChatMessages(sessionId) {
    if (isGuestUser()) {
        return []
    }

    const token = getAccessToken()
    if (!token) {
        return []
    }

    try {
        const response = await fetch(`${API_URL}/chat/sessions/${sessionId}/messages`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })

        if (!response.ok) {
            throw new Error('Error al obtener mensajes')
        }

        const data = await response.json()
        return data.messages || []
    } catch (error) {
        console.error('Error obteniendo mensajes:', error)
        return []
    }
}

/**
 * Elimina una sesión de chat
 * @param {string} sessionId - ID de la sesión
 * @returns {Promise<boolean>}
 */
export async function deleteChatSession(sessionId) {
    if (isGuestUser()) {
        return false
    }

    const token = getAccessToken()
    if (!token) {
        return false
    }

    try {
        const response = await fetch(`${API_URL}/chat/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })

        if (!response.ok) {
            throw new Error('Error al eliminar sesión')
        }

        return true
    } catch (error) {
        console.error('Error eliminando sesión:', error)
        return false
    }
}

/**
 * Obtiene un resumen del historial de chat
 * @returns {Promise<Object>}
 */
export async function getChatSummary() {
    if (isGuestUser()) {
        return { total_sessions: 0, total_messages: 0, animals_discussed: [] }
    }

    const token = getAccessToken()
    if (!token) {
        return { total_sessions: 0, total_messages: 0, animals_discussed: [] }
    }

    try {
        const response = await fetch(`${API_URL}/chat/summary`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })

        if (!response.ok) {
            throw new Error('Error al obtener resumen')
        }

        const data = await response.json()
        return data
    } catch (error) {
        console.error('Error obteniendo resumen:', error)
        return { total_sessions: 0, total_messages: 0, animals_discussed: [] }
    }
}

/**
 * Detecta menciones de animales en el texto
 * @param {string} text - Texto a analizar
 * @returns {string|null} - Primer animal detectado o null
 */
export function detectAnimalInText(text) {
    const animales = [
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

    const textLower = text.toLowerCase()
    
    for (const animal of animales) {
        if (textLower.includes(animal)) {
            return animal.charAt(0).toUpperCase() + animal.slice(1)
        }
    }
    
    return null
}
