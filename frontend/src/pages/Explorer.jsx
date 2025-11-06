import React, { useEffect, useRef, useState, useCallback } from 'react'
import { askExplorer, generateExplorerImage, textToSpeech } from '../services/explorer.service';
import { saveChatMessage, detectAnimalInText } from '../services/chat.service';
import { 
    listChats, 
    getChat, 
    saveChat, 
    deleteChat as deleteChatAPI, 
    isGuestUser
} from '../services/explorerChat.service';
import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import JaggyAvatar from '../components/JaggyAvatar.jsx'

export default function Explorer(){
    // Estado de carga inicial para evitar errores de hidratación
    const [isReady, setIsReady] = useState(false);
    
    // Detectar si es usuario invitado - calcular directamente cada vez
    const isGuest = isGuestUser();
    
    // Ref para evitar guardados duplicados
    const isSavingRef = useRef(false)
    
    // Sistema de múltiples conversaciones
    const [chatList, setChatList] = useState(() => {
        // Los invitados siempre usan localStorage
        if (isGuestUser()) {
            try {
                const saved = localStorage.getItem('fauna_chat_list')
                if (saved) {
                    return JSON.parse(saved)
                }
            } catch (e) {
                console.error('Error cargando lista de chats:', e)
            }
        }
        return []
    })
    
    const [currentChatId, setCurrentChatId] = useState(() => {
        try {
            const saved = localStorage.getItem('fauna_current_chat_id')
            return saved || null
        } catch {
            return null
        }
    })

    const [messages, setMessages] = useState(() => {
        // Cargar conversación actual
        if (currentChatId) {
            try {
                const saved = localStorage.getItem(`fauna_chat_${currentChatId}`)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    return parsed.messages || [{ role: 'assistant', text: '¡Hola! Pregúntame sobre cualquier animal.' }]
                }
            } catch (e) {
                console.error('Error cargando conversación:', e)
            }
        }
        return [{ role: 'assistant', text: '¡Hola! Pregúntame sobre cualquier animal.' }]
    })

    const [showChatList, setShowChatList] = useState(false)
    const [input, setInput] = useState('')
    const [isThinking, setIsThinking] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [voiceEnabled, setVoiceEnabled] = useState(() => {
        // Leer preferencia guardada
        try {
            return localStorage.getItem('fauna_voice_enabled') === 'true'
        } catch {
            return false
        }
    })
    const [sessionId, setSessionId] = useState(null) // Para mantener la sesión activa
    const [imageModal, setImageModal] = useState(null) // Para modal de imagen ampliada
    const [conversationHistory, setConversationHistory] = useState([]) // Historial para contexto
    const listRef = useRef(null)
    const chatRef = useRef(null)
    const recognitionRef = useRef(null)
    const audioRef = useRef(null) // Referencia al audio actual para poder detenerlo
    const headerIcon = '/logo.png'

    // Detectar emoción según el último mensaje del asistente
    const [currentEmotion, setCurrentEmotion] = useState('neutral')

    // Función helper para detectar emoción en texto
    const detectEmotion = useCallback((text) => {
        if (!text) return 'neutral';
        const lower = text.toLowerCase();
        // Palabras clave para emociones
        if (lower.match(/jaja|jeje|😂|🤣|divertido|gracioso|genial|increíble|excelente|maravilloso/)) {
            return 'happy';
        }
        if (lower.match(/sorprend|asombr|wow|increíble|vaya|guau|😲|😮/)) {
            return 'surprised';
        }
        if (lower.match(/triste|pena|lament|😢|😭|desafortunadamente|lástima/)) {
            return 'sad';
        }
        if (lower.match(/peligro|cuidado|no debes|advertencia|⚠️|😠|enojado/)) {
            return 'angry';
        }
        return 'neutral';
    }, []);

    // Efecto para actualizar emoción cuando cambian los mensajes
    useEffect(() => {
        const lastAssistantMsg = messages.slice().reverse().find(m => m.role === 'assistant');
        if (lastAssistantMsg?.text) {
            const detectedEmotion = detectEmotion(lastAssistantMsg.text);
            setCurrentEmotion(detectedEmotion);
        }
    }, [messages, detectEmotion]);

    useEffect(()=>{
        if(typeof window !== 'undefined'){
            const n = localStorage.getItem('fauna_nick');
            if(!n) {
                window.location.href = '/login';
            } else {
                // Marcar como listo después de verificar autenticación
                setTimeout(() => setIsReady(true), 100);
            }
        }
    }, [])

    // Cargar chats de la API si es usuario registrado
    useEffect(() => {
        async function loadChatsFromAPI() {
            if (!isGuest) {
                try {
                    const chats = await listChats()
                    
                    // Transformar chats del backend al formato del frontend
                    const transformedChats = chats.map(chat => ({
                        id: chat.id,
                        title: chat.title,
                        timestamp: chat.updated_at || chat.created_at  // Usar updated_at o created_at del backend
                    }))
                    
                    setChatList(transformedChats)
                } catch {
                    // Error silencioso
                }
            }
        }
        loadChatsFromAPI()
    }, [isGuest])

    // Inicializar reconocimiento de voz
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition()
                recognition.lang = 'es-ES'
                recognition.continuous = false
                recognition.interimResults = false
                recognition.maxAlternatives = 1

                recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript
                    setInput(transcript)
                    setIsListening(false)
                }

                recognition.onerror = (event) => {
                    console.error('Error de reconocimiento de voz:', event.error)
                    setIsListening(false)
                    if (event.error === 'not-allowed') {
                        alert('Por favor, permite el acceso al micrófono en la configuración de tu navegador.')
                    }
                }

                recognition.onend = () => {
                    setIsListening(false)
                }

                recognitionRef.current = recognition
            }

        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort()
            }
            // Limpiar audio al desmontar componente
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
        }
    }, [])

    // Función para generar título del chat basado en el primer mensaje
    const generateChatTitle = useCallback((msgs) => {
        const firstUserMsg = msgs.find(m => m.role === 'user')
        if (firstUserMsg) {
            const text = firstUserMsg.text.trim()
            return text.length > 40 ? text.substring(0, 40) + '...' : text
        }
        return 'Nueva conversación'
    }, [])

    const saveChatData = useCallback(async () => {
        // Evitar guardados duplicados simultáneos
        if (isSavingRef.current) {
            return;
        }
        
        if (messages?.length > 1 || (messages?.length === 1 && messages[0]?.role === 'user')) {
                isSavingRef.current = true;  // Marcar que estamos guardando
                
                // Para invitados: timestamp, para registrados: currentChatId o null (backend genera UUID)
                const chatId = isGuest ? (currentChatId || Date.now().toString()) : currentChatId
                
                // Si no hay ID actual y es invitado, crear uno nuevo
                if (!currentChatId && isGuest) {
                    setCurrentChatId(chatId)
                    localStorage.setItem('fauna_current_chat_id', chatId)
                }

                // Guardar mensajes de la conversación actual
                const title = generateChatTitle(messages)
                const chatData = {
                    id: chatId,
                    messages: messages,
                    timestamp: Date.now(),
                    title: title
                }

                try {
                    if (isGuest) {
                        // Invitados usan localStorage
                        localStorage.setItem(`fauna_chat_${chatId}`, JSON.stringify(chatData))
                        
                        // Actualizar lista de chats
                        setChatList(prev => {
                            const exists = prev.find(c => c.id === chatId)
                            const newList = exists 
                                ? prev.map(c => c.id === chatId ? { id: chatId, title: chatData.title, timestamp: chatData.timestamp } : c)
                                : [{ id: chatId, title: chatData.title, timestamp: chatData.timestamp }, ...prev]
                            
                            localStorage.setItem('fauna_chat_list', JSON.stringify(newList))
                            return newList
                        })
                    } else {
                        // Usuarios registrados usan API
                        const formattedMessages = messages.map(msg => ({
                            role: msg.role,
                            message_type: msg.type === 'image' || msg.image || msg.url ? 'image' : 'text',
                            text: msg.text || '',
                            image_url: msg.url || msg.image || null,  // Buscar en msg.url primero (nuevo formato) o msg.image (viejo formato)
                            image_alt: msg.alt || null
                        }))

                        const savedChat = await saveChat({
                            chat_id: chatId || undefined, // No enviar si es null (backend genera UUID)
                            title: title,
                            messages: formattedMessages
                        })

                        // Verificar que savedChat tenga datos
                        if (!savedChat || !savedChat.id) {
                            return;
                        }

                        // Actualizar el currentChatId con el ID del backend
                        if (!currentChatId) {
                            setCurrentChatId(savedChat.id);
                        }

                        // Actualizar lista de chats
                        setChatList(prev => {
                            const exists = prev?.find(c => c.id === savedChat.id)
                            if (exists) {
                                return prev.map(c => c.id === savedChat.id ? {
                                    id: savedChat.id,
                                    title: savedChat.title,
                                    timestamp: savedChat.updated_at  // Usar fecha ISO directamente del backend
                                } : c)
                            } else {
                                return [{
                                    id: savedChat.id,
                                    title: savedChat.title,
                                    timestamp: savedChat.updated_at  // Usar fecha ISO directamente del backend
                                }, ...(prev || [])]
                            }
                        })
                    }
                } catch {
                    // Error silencioso
                } finally {
                    // Siempre desmarcar el flag de guardado al terminar
                    isSavingRef.current = false;
                }
        }
    }, [messages, isGuest, currentChatId, generateChatTitle, setChatList, setCurrentChatId]);

    // Guardar conversación actual cada vez que cambien los mensajes
    // Usar debounce para evitar guardados múltiples mientras se generan respuestas
    useEffect(() => {
        // Debounce: esperar 2 segundos después del último cambio en messages
        const timeoutId = setTimeout(async () => {
            await saveChatData();
        }, 2000);
        
        // Limpiar timeout si messages cambia de nuevo antes de 2 segundos
        return () => clearTimeout(timeoutId);
    }, [messages, isGuest, currentChatId, saveChatData]);

    useEffect(()=>{
        if(listRef.current){
            listRef.current.scrollTop = listRef.current.scrollHeight
        }
    }, [messages, isThinking])

    function handleVoiceInput() {
        if (!recognitionRef.current) {
            alert('Tu navegador no soporta reconocimiento de voz. Prueba con Chrome o Edge.')
            return
        }

        if (isListening) {
            recognitionRef.current.stop()
            setIsListening(false)
        } else {
            try {
                recognitionRef.current.start()
                setIsListening(true)
            } catch (error) {
                console.error('Error al iniciar reconocimiento:', error)
            }
        }
    }

    async function speakText(text) {
        if (!voiceEnabled || !text) {
            return
        }

        try {
            // Detener audio anterior si existe
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }

            setIsSpeaking(true)
            
            // Llamar al servicio de Text-to-Speech
            const audioData = await textToSpeech(text, {
                languageCode: 'es-US',
                voiceName: 'es-US-Neural2-B', // Voz masculina joven natural
                pitch: 5.0, // Agudo estilo Bob Esponja
                speakingRate: 1.2 // Rápido y enérgico
            })

            if (!audioData) {
                setIsSpeaking(false)
                return
            }

            // Crear un elemento de audio y reproducirlo
            const audioBlob = base64ToBlob(audioData.audioBase64, audioData.mime)
            const audioUrl = URL.createObjectURL(audioBlob)
            const audio = new Audio(audioUrl)
            
            // Guardar referencia para poder detenerlo
            audioRef.current = audio

            audio.onended = () => {
                setIsSpeaking(false)
                audioRef.current = null
                URL.revokeObjectURL(audioUrl) // Limpiar memoria
            }

            audio.onerror = () => {
                setIsSpeaking(false)
                audioRef.current = null
                URL.revokeObjectURL(audioUrl)
            }

            await audio.play()

        } catch {
            setIsSpeaking(false)
            audioRef.current = null
        }
    }

    // Función auxiliar para convertir base64 a Blob
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

    function toggleVoice() {
        const newValue = !voiceEnabled
        setVoiceEnabled(newValue)
        try {
            localStorage.setItem('fauna_voice_enabled', String(newValue))
        } catch {
            // Ignorar errores de almacenamiento
        }
        
        if (!newValue) {
            // Detener voz si se desactiva
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
            setIsSpeaking(false)
        }
    }

    function handleNewChat() {
        const initialMessage = { role: 'assistant', text: '¡Hola! Pregúntame sobre cualquier animal.' }
        setMessages([initialMessage])
        setSessionId(null)
        setConversationHistory([])
        setCurrentChatId(null)
        try {
            localStorage.removeItem('fauna_current_chat_id')
        } catch (e) {
            console.error('Error creando nuevo chat:', e)
        }
    }

    async function loadChat(chatId) {
        try {
            if (isGuest) {
                // Invitados usan localStorage
                const saved = localStorage.getItem(`fauna_chat_${chatId}`)
                if (saved) {
                    const chatData = JSON.parse(saved)
                    setMessages(chatData.messages || [{ role: 'assistant', text: '¡Hola! Pregúntame sobre cualquier animal.' }])
                    setCurrentChatId(chatId)
                    localStorage.setItem('fauna_current_chat_id', chatId)
                    setShowChatList(false)
                }
            } else {
                // Usuarios registrados usan API
                const chatData = await getChat(chatId)
                
                // Convertir formato de API a formato local
                const formattedMessages = chatData.messages.map(msg => {
                    // Si es una imagen, usar el formato correcto
                    if (msg.message_type === 'image' || msg.image_url) {
                        return {
                            role: msg.role,
                            type: 'image',
                            url: msg.image_url,  // Usar 'url' para consistencia con el renderizado
                            alt: msg.image_alt,
                            text: msg.text
                        }
                    }
                    // Si es texto
                    return {
                        role: msg.role,
                        text: msg.text
                    }
                })
                
                setMessages(formattedMessages.length > 0 ? formattedMessages : [{ role: 'assistant', text: '¡Hola! Pregúntame sobre cualquier animal.' }])
                setCurrentChatId(chatId)
                setShowChatList(false)
            }
        } catch {
            // Error silencioso
        }
    }

    async function deleteChatFunc(chatId, e) {
        e.stopPropagation()
        try {
            if (isGuest) {
                // Invitados usan localStorage
                localStorage.removeItem(`fauna_chat_${chatId}`)
                const newList = chatList.filter(c => c.id !== chatId)
                setChatList(newList)
                localStorage.setItem('fauna_chat_list', JSON.stringify(newList))
            } else {
                // Usuarios registrados usan API
                await deleteChatAPI(chatId)
                const updatedChats = await listChats()
                setChatList(updatedChats)
            }
            
            // Si es el chat actual, crear uno nuevo
            if (currentChatId === chatId) {
                handleNewChat()
            }
        } catch (error) {
            console.error('Error eliminando chat:', error)
        }
    }

    async function handleSend(e){
        e && e.preventDefault()
        const text = input.trim()
        if(!text) return

        const userMsg = { role: 'user', text }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsThinking(true)

        try{
            // Detecta intención de imagen (más amplia y flexible en español)
            const imageWords = /(imagen|ilustraci[oó]n|dibujo|foto|p[oó]ster|sticker|wallpaper|fondo|pint(a|ame)|dibuja|genera( r)?\s+una?\s+imagen|ver\s+imagen)/i
            const showWords = /(muestra|muestras|mostrar|mu[eé]strame|muestrame|ens[eé]ñame|quiero\s+ver|puedes\s+(hacer|generar|mostrar)|pasas|pasa|dame|d[aá]me)/i
            const seeWords = /(c[oó]mo|como)\s+(se|es|son)\s+ve|(c[oó]mo|como)\s+(son|es)|verlo|verla|verle|ver\s+(un|una|al|a\s+la)/i
            const animalWords = /\b(un|una|el|la|los|las|al|a\s+la)\s+[a-záéíóúñü]{4,}s?\b/i  // "un caballo", "la jirafa", "los leones"
            
            // Detecta imagen si:
            // 1. Tiene palabra explícita de imagen (imagen, foto, dibujo)
            // 2. Pide mostrar/ver algo (muestra + ver/como se ve/como son)
            // 3. Pide mostrar + menciona un animal ("muestra un caballo")
            const wantsImage = imageWords.test(text) || 
                             (showWords.test(text) && seeWords.test(text)) ||
                             (showWords.test(text) && animalWords.test(text))
            


            // Si SOLO pide una imagen (frase corta), dar respuesta breve
            const isOnlyImageRequest = wantsImage && text.split(' ').length <= 10
            
            // Preparar el mensaje con instrucción si solo pide imagen
            const userMessage = isOnlyImageRequest 
                ? `${text}\n\n[INSTRUCCIÓN: Responde en UNA sola frase corta confirmando que generarás la imagen. Ejemplo: "¡Claro! Aquí tienes la imagen de [animal]."]`
                : text

            // Pasar todo el historial de conversación al backend para contexto completo
            const textPromise = askExplorer(userMessage, conversationHistory)
            
            // IMPORTANTE: Primero obtener la respuesta de texto para tener contexto del animal
            const [textRes] = await Promise.allSettled([textPromise])

            let assistantText = ''
            if(textRes.status === 'fulfilled'){
                assistantText = textRes.value
                setMessages(prev => [...prev, { role: 'assistant', text: assistantText }])
                
                // Actualizar historial de conversación para contexto
                setConversationHistory(prev => [...prev, userMsg, { role: 'assistant', text: assistantText }])
                
                // Hablar la respuesta si la voz está habilitada
                speakText(assistantText)
            } else {
                assistantText = 'Lo siento, ocurrió un error al responder.'
                setMessages(prev => [...prev, { role: 'assistant', text: assistantText }])
                setConversationHistory(prev => [...prev, userMsg, { role: 'assistant', text: assistantText }])
                speakText(assistantText)
            }

            // Generar imagen DESPUÉS de tener la respuesta para usar el contexto completo
            let imgRes = null
            if (wantsImage) {
                try {
                    // Construir contexto rico: mensaje actual + respuesta de Jaggy (que ya tiene contexto)
                    // Jaggy ya sabe de qué animal hablaban, así que su respuesta tiene el contexto
                    const contextForImage = `${text} ${assistantText}`
                    
                    imgRes = await generateExplorerImage(contextForImage)
                } catch (err) {
                    console.error('❌ Error generando imagen:', err)
                    imgRes = { error: err }
                }
            }

            // ========================================
            // GUARDAR EN EL HISTORIAL (SOLO USUARIOS CON CUENTA)
            // ========================================
            const animalDetected = detectAnimalInText(text + ' ' + assistantText)
            const saveResult = await saveChatMessage(text, assistantText, sessionId, animalDetected)
            
            // Actualizar sessionId si se creó una nueva sesión
            if (saveResult && saveResult.session_id && !sessionId) {
                setSessionId(saveResult.session_id)
            }
            // ========================================

            if(imgRes && imgRes.dataUrl){
                setMessages(prev => [...prev, { role: 'assistant', type: 'image', url: imgRes.dataUrl, alt: `Imagen generada sobre: ${text}` }])
            } else if (wantsImage) {
                // Si pidió imagen pero falló, mostrar mensaje según el error
                const errorMsg = imgRes?.error?.message || imgRes?.error?.toString() || 'No pude generar la imagen'
                
                if (errorMsg.includes('vertex_not_configured') || errorMsg.includes('credentials_not_found')) {
                    setMessages(prev => [...prev, { 
                        role: 'assistant', 
                        text: '🎨 Lo siento, la generación de imágenes no está disponible. Necesita configuración de Google Cloud Vertex AI.\n\n¡Pero puedo contarte todo sobre el animal que quieras saber! 🦁🐘🦒' 
                    }])
                } else {
                    // Error genérico o timeout
                    setMessages(prev => [...prev, { 
                        role: 'assistant', 
                        text: '🎨 No pude generar la imagen en este momento. Esto puede tomar unos segundos, intenta de nuevo.\n\nMientras tanto, ¿quieres que te cuente más sobre este animal? 🦁' 
                    }])
                }
            }
        }catch{
            setMessages(prev => [...prev, { role: 'assistant', text: 'Lo siento, ocurrió un error.' }])
        }finally{
            setIsThinking(false)
        }
    }

    // Mostrar loading mientras se inicializa
    if (!isReady) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                        <p className="mt-4 text-slate-600">Cargando...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
    <DashboardLayout>
                <section className="mx-auto max-w-7xl px-3 sm:px-4 py-2 sm:py-3">
                    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
                        {/* Panel lateral con el avatar guía y botón Nuevo Chat */}
                        <aside className="hidden lg:flex flex-col rounded-2xl border p-4 sticky top-20 self-start max-h-[85vh] overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                            {/* Header con Jaggy y botón Nuevo Chat */}
                            <div className="flex flex-col items-center text-center flex-shrink-0">
                                <div className="relative">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur opacity-25"></div>
                                    <JaggyAvatar 
                                        emotion={currentEmotion} 
                                        isSpeaking={isSpeaking}
                                        width={80}
                                        height={80}
                                        className="relative drop-shadow-lg"
                                    />
                                </div>
                                <h3 className="mt-2 text-base font-bold" style={{ color: 'var(--text-color)' }}>Jaggy</h3>
                                <p className="mt-1 text-xs" style={{ color: 'var(--text-color)', opacity: 0.7 }}>Tu guía de fauna</p>
                                
                                {/* Botón Nuevo Chat */}
                                <button
                                    onClick={handleNewChat}
                                    className="mt-3 w-full px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold hover:from-purple-600 hover:to-pink-600 transition flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Nuevo Chat
                                </button>
                            </div>

                            {/* Lista de conversaciones guardadas - OCUPA TODO EL ESPACIO */}
                            {chatList?.length > 0 && (
                                <div className="mt-4 flex-1 overflow-hidden flex flex-col min-h-0">
                                    <h4 className="text-sm font-semibold mb-2 px-1 flex-shrink-0" style={{ color: 'var(--text-color)' }}>Historial</h4>
                                    <div className="overflow-y-auto flex-1 space-y-1.5 pr-1 min-h-0">
                                        {chatList?.map(chat => (
                                            <div
                                                key={chat.id}
                                                onClick={() => loadChat(chat.id)}
                                                className="group relative w-full p-2.5 rounded-lg cursor-pointer transition text-left block"
                                                style={{
                                                    background: currentChatId === chat.id 
                                                        ? 'rgba(168, 85, 247, 0.15)' 
                                                        : 'transparent'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (currentChatId !== chat.id) {
                                                        e.currentTarget.style.background = 'var(--bg-subtle)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (currentChatId !== chat.id) {
                                                        e.currentTarget.style.background = 'transparent';
                                                    }
                                                }}
                                            >
                                                <div className="w-full pr-8">
                                                    <p className="text-sm font-medium truncate w-full" style={{ color: 'var(--text-color)' }}>{chat.title}</p>
                                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-color)', opacity: 0.6 }}>
                                                        {new Date(chat.timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => deleteChatFunc(chat.id, e)}
                                                    className="absolute top-2.5 right-2.5 p-1.5 rounded opacity-0 group-hover:opacity-100 transition z-10"
                                                    style={{ color: '#ef4444' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                    title="Eliminar chat"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sugerencias */}
                            <div className="mt-4 w-full rounded-xl p-3 text-left text-xs border flex-shrink-0" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}>
                                <p className="font-semibold mb-2 flex items-center gap-1" style={{ color: 'var(--text-color)' }}>
                                    <span>💡</span> Sugerencias
                                </p>
                                <ul className="space-y-1.5" style={{ color: 'var(--text-color)', opacity: 0.8 }}>
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-500 mt-0.5">•</span>
                                        <span>¿Dónde vive el pingüino?</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-500 mt-0.5">•</span>
                                        <span>Curiosidad del tiburón</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-500 mt-0.5">•</span>
                                        <span>Muestra un león</span>
                                    </li>
                                </ul>
                            </div>
                        </aside>

                        {/* Tarjeta de chat - Mejorada y responsive */}
                                    <div ref={chatRef} className="relative rounded-2xl border flex flex-col h-[calc(100vh-140px)] sm:h-[calc(100vh-120px)] lg:h-[82vh]" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                                        {/* Header mejorado */}
                                        <div className="flex items-center gap-2 p-2 sm:p-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                                <div className="relative">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full blur opacity-40"></div>
                                    <img src={headerIcon} alt="Jaggy" className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-sm sm:text-base font-bold leading-tight">Explorar</h2>
                                    <p className="text-xs text-slate-600 hidden sm:block">Hola, soy Jaggy. ¿Qué quieres saber?</p>
                                </div>
                                
                                {/* Botón Historial (móvil) */}
                                <button 
                                    type="button" 
                                    onClick={() => setShowChatList(!showChatList)}
                                    className="lg:hidden p-1.5 sm:p-2 rounded-full hover:bg-slate-100 transition"
                                    title="Ver historial"
                                >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>

                                {/* Botón Nuevo Chat (móvil) */}
                                <button 
                                    type="button" 
                                    onClick={handleNewChat}
                                    className="lg:hidden px-2 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold hover:from-purple-600 hover:to-pink-600 transition flex items-center gap-1"
                                    title="Nuevo Chat"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span className="hidden sm:inline">Nuevo</span>
                                </button>
                                
                                {/* Botón de voz en el header */}
                                <button 
                                    type="button" 
                                    onClick={toggleVoice}
                                    className={`p-1.5 sm:p-2 rounded-full transition ${voiceEnabled ? 'bg-blue-100' : 'bg-slate-100'} ${isSpeaking ? 'animate-pulse' : ''}`}
                                    aria-label={voiceEnabled ? "Voz activada" : "Voz desactivada"}
                                    title={voiceEnabled ? (isSpeaking ? "🔊 Hablando..." : "🔊 Voz activada") : "🔇 Voz desactivada"}
                                >
                                    <SpeakerIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${voiceEnabled ? 'text-blue-600' : 'text-slate-400'}`} />
                                </button>
                            </div>

                    <div ref={listRef} className="flex-1 overflow-y-auto p-3 sm:p-4 pb-20 space-y-2.5" aria-live="polite">
                                {messages.map((m, i) => {
                                    const bubbleCls = [
                                        "max-w-[72%] rounded-2xl shadow fun-pop-in",
                                        m.role === 'user' ? 'ml-auto rounded-br-md' : 'mr-auto',
                                        m.role !== 'user' ? 'border' : '',
                                    ].join(' ')
                                    if(m.type === 'image'){
                                        return (
                                            <div key={i} className="mr-auto max-w-[280px] sm:max-w-[320px] rounded-2xl shadow fun-pop-in border overflow-hidden" style={{ background: 'var(--bg-subtle)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}>
                                                <div className="relative group cursor-pointer" onClick={() => setImageModal(m)}>
                                                    <img 
                                                        src={m.url} 
                                                        alt={m.alt || 'Imagen generada'} 
                                                        className="block w-full h-auto rounded-t-xl object-cover hover:opacity-95 transition-opacity" 
                                                        style={{ aspectRatio: '1/1' }}
                                                    />
                                                    {/* Botones sobre la imagen - siempre visibles en móvil, hover en desktop */}
                                                    <div className="absolute top-2 right-2 flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                        {/* Botón de ampliar */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setImageModal(m)
                                                            }}
                                                            className="bg-white/95 hover:bg-white text-gray-700 rounded-full p-1.5 shadow-lg transition-all hover:scale-110"
                                                            title="Ver en tamaño completo"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                            </svg>
                                                        </button>
                                                        {/* Botón de descargar */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                const link = document.createElement('a')
                                                                link.href = m.url
                                                                link.download = `fauna-kids-${Date.now()}.png`
                                                                link.click()
                                                            }}
                                                            className="bg-white/95 hover:bg-white text-gray-700 rounded-full p-1.5 shadow-lg transition-all hover:scale-110"
                                                            title="Descargar imagen"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                                {m.alt && <p className="px-3 pb-2 text-xs opacity-90">{m.alt}</p>}
                                            </div>
                                        )
                                    }
                                    return (
                                        <div key={i} className={bubbleCls} style={{ background: m.role === 'user' ? 'var(--accent-start)' : 'var(--bg-subtle)', color: m.role === 'user' ? '#fff' : 'var(--text-color)', borderColor: 'var(--border-color)' }}>
                                            <p className="px-4 py-2.5 text-[13px] whitespace-pre-wrap">{m.text}</p>
                                        </div>
                                    )
                                })}
                                {isThinking && (
                                    <div className="mr-auto max-w-[72%] rounded-2xl shadow fun-pop-in px-4 py-2.5 border" style={{ background: 'var(--bg-subtle)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}>
                                        <div className="flex items-center gap-2 text-sm">
                                            <div className="flex gap-1">
                                                <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                            </div>
                                            <span>Pensando...</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Formulario mejorado y más compacto */}
            <form onSubmit={handleSend} className="p-3 sm:p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-1 px-2">
                                    <input
                                        className="flex-1 bg-transparent outline-none text-base placeholder:text-slate-500 px-2 py-2"
                                        style={{ color: 'var(--text-color)' }}
                                        placeholder={isListening ? "🎤 Escuchando..." : "Pregunta sobre animales..."}
                                        value={input}
                                        onChange={(e)=>setInput(e.target.value)}
                                        maxLength={300}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleVoiceInput}
                                        className={`p-1 hover:scale-110 transition bg-transparent border-0 ${isListening ? 'animate-pulse' : ''}`}
                                        style={{ background: 'transparent' }}
                                        aria-label={isListening ? "Detener" : "Usar micrófono"}
                                        title={isListening ? "Escuchando..." : "Hablar por voz"}
                                    >
                                        <MicIcon className={`w-5 h-5 ${isListening ? 'text-red-500' : 'text-slate-400'}`} />
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={!input.trim() && !isListening}
                                        className="p-1 hover:scale-110 transition disabled:opacity-30 disabled:cursor-not-allowed bg-transparent border-0"
                                        style={{ background: 'transparent' }}
                                        aria-label="Enviar mensaje"
                                        title="Enviar"
                                    >
                                        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>

                {/* Panel móvil de historial de chats */}
                {showChatList && (
                    <div 
                        className="lg:hidden fixed inset-0 z-[100] bg-black/50 animate-fadeIn"
                        onClick={() => setShowChatList(false)}
                    >
                        <div 
                            className="absolute right-0 top-0 h-full w-80 max-w-[85vw] shadow-2xl pt-20 px-4 pb-4 overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                            style={{ background: 'var(--bg-surface)', color: 'var(--text-color)' }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold" style={{ color: 'var(--text-color)' }}>Historial de Chats</h3>
                                <button
                                    onClick={() => setShowChatList(false)}
                                    className="p-2 rounded-full transition"
                                    style={{ color: 'var(--text-color)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {!chatList || chatList.length === 0 ? (
                                <div className="text-center py-8" style={{ color: 'var(--text-color)', opacity: 0.6 }}>
                                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <p className="text-sm">No hay chats guardados</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {chatList?.map(chat => (
                                        <div
                                            key={chat.id}
                                            onClick={() => loadChat(chat.id)}
                                            className="group relative w-full p-4 rounded-lg cursor-pointer transition block"
                                            style={{ 
                                                background: currentChatId === chat.id 
                                                    ? 'rgba(168, 85, 247, 0.15)' 
                                                    : 'var(--bg-subtle)'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (currentChatId !== chat.id) {
                                                    e.currentTarget.style.background = 'var(--border-color)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (currentChatId !== chat.id) {
                                                    e.currentTarget.style.background = 'var(--bg-subtle)';
                                                }
                                            }}
                                        >
                                            <div className="w-full pr-10">
                                                <p className="text-sm font-medium truncate w-full" style={{ color: 'var(--text-color)' }}>
                                                    {chat.title}
                                                </p>
                                                <p className="text-xs mt-1.5" style={{ color: 'var(--text-color)', opacity: 0.6 }}>
                                                    {new Date(chat.timestamp).toLocaleDateString('es-ES', { 
                                                        day: 'numeric', 
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => deleteChatFunc(chat.id, e)}
                                                className="absolute top-4 right-4 p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 transition z-10"
                                                title="Eliminar chat"
                                            >
                                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Modal para ver imagen en tamaño completo */}
                {imageModal && (
                    <div 
                        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fadeIn"
                        onClick={() => setImageModal(null)}
                    >
                        <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col">
                            {/* Botón cerrar */}
                            <button
                                onClick={() => setImageModal(null)}
                                className="absolute -top-12 right-0 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 shadow-lg transition-all hover:scale-110"
                                title="Cerrar"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Imagen */}
                            <div className="bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col">
                                <img 
                                    src={imageModal.url} 
                                    alt={imageModal.alt || 'Imagen generada'} 
                                    className="w-full h-auto max-h-[70vh] object-contain"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                
                                {/* Información y botones */}
                                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center justify-between">
                                    <div className="flex-1">
                                        {imageModal.alt && (
                                            <p className="text-sm text-gray-700 font-medium">{imageModal.alt}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            const link = document.createElement('a')
                                            link.href = imageModal.url
                                            link.download = `fauna-kids-${Date.now()}.png`
                                            link.click()
                                        }}
                                        className="ml-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-md transition-all hover:scale-105 flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Descargar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DashboardLayout>
    )
}

function MicIcon({ className = "w-5 h-5" }){
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <path d="M12 14a3 3 0 003-3V7a3 3 0 10-6 0v4a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2z" />
            <path d="M11 18h2v3h-2z" />
        </svg>
    )
}

function SpeakerIcon({ className = "w-5 h-5" }){
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
        </svg>
    )
}
