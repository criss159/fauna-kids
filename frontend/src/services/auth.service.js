// src/services/auth.service.js
// Servicio de autenticación para Fauna Kids

import { api } from '../utils/api';

/**
 * Registra un nuevo usuario
 * @param {Object} userData - Datos del usuario (username, email, password, display_name)
 * @returns {Promise<Object>} - Respuesta con user y tokens
 */
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  if (response.tokens) {
    localStorage.setItem('access_token', response.tokens.access);
    localStorage.setItem('refresh_token', response.tokens.refresh);
    localStorage.setItem('user', JSON.stringify(response.user));
  }
  return response;
};

/**
 * Inicia sesión con credenciales
 * @param {string} username - Nombre de usuario o email
 * @param {string} password - Contraseña
 * @returns {Promise<Object>} - Respuesta con user y tokens
 */
export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  if (response.tokens) {
    localStorage.setItem('access_token', response.tokens.access);
    localStorage.setItem('refresh_token', response.tokens.refresh);
    localStorage.setItem('user', JSON.stringify(response.user));
  }
  return response;
};

/**
 * Inicia sesión con Google OAuth
 * @param {Object} googleUser - Datos del usuario de Google
 * @returns {Promise<Object>} - Respuesta con user y tokens
 */
export const loginWithGoogle = async (googleUser) => {
  const response = await api.post('/auth/google', {
    google_id: googleUser.sub,
    email: googleUser.email,
    name: googleUser.name,
    picture: googleUser.picture,
  });
  
  if (response.tokens) {
    localStorage.setItem('access_token', response.tokens.access);
    localStorage.setItem('refresh_token', response.tokens.refresh);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    // Disparar evento personalizado para notificar a otros componentes
    window.dispatchEvent(new Event('user-updated'));
  }
  
  return response;
};

/**
 * Crea una sesión de invitado
 * @param {string} nickname - Apodo del invitado
 * @returns {Promise<Object>} - Respuesta con user y session_id
 */
export const createGuestSession = async (nickname) => {
  const response = await api.post('/auth/guest', { nickname });
  if (response.session_id) {
    localStorage.setItem('guest_session_id', response.session_id);
    localStorage.setItem('user', JSON.stringify(response.user));
  }
  return response;
};

/**
 * Cierra sesión del usuario actual
 * @returns {Promise<void>}
 */
export const logout = async () => {
  const token = localStorage.getItem('access_token');
  if (token) {
    try {
      await api.post('/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {
      // Error silencioso en logout
    }
  }
  
  // Limpiar localStorage
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('guest_session_id');
  localStorage.removeItem('user');
  localStorage.removeItem('fauna_nick');
};

/**
 * Obtiene el usuario actual
 * @returns {Object|null} - Usuario actual o null
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!(localStorage.getItem('access_token') || localStorage.getItem('guest_session_id'));
};

/**
 * Obtiene el token de acceso
 * @returns {string|null}
 */
export const getAccessToken = () => {
  return localStorage.getItem('access_token');
};

/**
 * Refresca el token de acceso
 * @returns {Promise<Object>}
 */
export const refreshToken = async () => {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) {
    throw new Error('No refresh token available');
  }
  
  const response = await api.post('/auth/token/refresh', { refresh });
  if (response.access) {
    localStorage.setItem('access_token', response.access);
  }
  return response;
};

export default {
  register,
  login,
  loginWithGoogle,
  createGuestSession,
  logout,
  getCurrentUser,
  isAuthenticated,
  getAccessToken,
  refreshToken,
};
