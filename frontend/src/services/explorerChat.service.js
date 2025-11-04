/**
 * Servicio para el manejo de chats del Explorer con persistencia en BD
 */

import { api } from '../utils/api';

/**
 * Lista todos los chats del usuario
 * @returns {Promise<Array>} Array de chats sin mensajes
 */
export const listChats = async () => {
  const response = await api.get('/explorer/chats');
  return response; // api.get() devuelve directamente el JSON, no tiene .data
};

/**
 * Obtiene un chat específico con todos sus mensajes
 * @param {string} chatId - ID del chat
 * @returns {Promise<Object>} Chat con sus mensajes
 */
export const getChat = async (chatId) => {
  const response = await api.get(`/explorer/chats/${chatId}`);
  return response; // api.get() devuelve directamente el JSON, no tiene .data
};

/**
 * Crea o actualiza un chat
 * @param {Object} chatData - Datos del chat
 * @param {string} chatData.chat_id - ID del chat (opcional para actualizar)
 * @param {string} chatData.title - Título del chat
 * @param {Array} chatData.messages - Array de mensajes
 * @returns {Promise<Object>} Chat creado o actualizado
 */
export const saveChat = async (chatData) => {
  const response = await api.post('/explorer/chats/save', chatData);
  return response; // api.post() devuelve directamente el JSON, no tiene .data
};

/**
 * Elimina un chat
 * @param {string} chatId - ID del chat a eliminar
 * @returns {Promise<Object>} Mensaje de confirmación
 */
export const deleteChat = async (chatId) => {
  try {
    const response = await api.del(`/explorer/chats/${chatId}/delete`);
    return response; // api.del() devuelve directamente el JSON, no tiene .data
  } catch (error) {
    console.error('Error al eliminar chat:', error);
    throw error;
  }
};

/**
 * Obtiene las configuraciones del usuario
 * @returns {Promise<Object>} Configuraciones del usuario
 */
export const getUserSettings = async () => {
  try {
    const response = await api.get('/user/settings');
    return response.data;
  } catch (error) {
    console.error('Error al obtener configuraciones:', error);
    throw error;
  }
};

/**
 * Actualiza las configuraciones del usuario
 * @param {Object} settings - Configuraciones a actualizar
 * @param {boolean} settings.voice_enabled - Si la voz está habilitada
 * @param {string} settings.theme - Tema seleccionado
 * @returns {Promise<Object>} Configuraciones actualizadas
 */
export const updateUserSettings = async (settings) => {
  try {
    const response = await api.put('/user/settings', settings);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar configuraciones:', error);
    throw error;
  }
};

/**
 * Verifica si el usuario es invitado
 * @returns {boolean} True si es invitado
 */
export const isGuestUser = () => {
  // Primero verificar si hay un objeto user guardado
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.is_guest === true;
    } catch {
      // Error silencioso
    }
  }
  
  // Fallback: verificar el token JWT
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  if (!token) {
    return true;
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.is_guest === true;
  } catch {
    return true;
  }
};

/**
 * Genera un título automático basado en el primer mensaje del usuario
 * @param {Array} messages - Array de mensajes
 * @returns {string} Título generado
 */
export const generateChatTitle = (messages) => {
  const firstUserMessage = messages.find(m => m.role === 'user');
  
  if (!firstUserMessage) {
    return 'Nueva conversación';
  }
  
  let text = firstUserMessage.text || '';
  
  // Limitar a 50 caracteres
  if (text.length > 50) {
    text = text.substring(0, 50) + '...';
  }
  
  return text || 'Nueva conversación';
};

/**
 * Obtiene la lista de animales explorados por el usuario
 * @returns {Promise<Array>} Array de animales explorados
 */
export const getAnimalsExplored = async () => {
  try {
    const response = await api.get('/explorer/animals');
    return response.data;
  } catch (error) {
    console.error('Error al obtener animales explorados:', error);
    throw error;
  }
};

export default {
  listChats,
  getChat,
  saveChat,
  deleteChat,
  getUserSettings,
  updateUserSettings,
  isGuestUser,
  generateChatTitle,
  getAnimalsExplored
};
