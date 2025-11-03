// src/utils/api.js
// Cliente HTTP ligero para comunicar con Django

const API_BASE = import.meta?.env?.VITE_API_URL || '/api';

// Variable para evitar múltiples renovaciones simultáneas
let isRefreshing = false;
let refreshSubscribers = [];

// Agregar suscriptores que esperan el nuevo token
function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

// Notificar a todos los suscriptores cuando el token se renueva
function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
}

// Renovar el access token usando el refresh token
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (!refreshToken) {
    console.error('❌ No hay refresh token disponible');
    // Redirigir al login
    localStorage.clear();
    window.location.href = '/login';
    throw new Error('No refresh token available');
  }
  
  try {
    const response = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken })
    });
    
    if (!response.ok) {
      throw new Error('Refresh token inválido o expirado');
    }
    
    const data = await response.json();
    
    // Guardar el nuevo access token
    localStorage.setItem('access_token', data.access);
    
    return data.access;
  } catch (error) {
    // Si el refresh token también expiró, limpiar y redirigir al login
    localStorage.clear();
    window.location.href = '/login';
    throw error;
  }
}

async function request(path, { method = 'GET', headers = {}, body } = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  
  // Obtener token de acceso del localStorage
  let token = localStorage.getItem('access_token');
  
  const init = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include', // útil si usas sesiones/cookies en Django
  };
  
  // Agregar token de autorización si existe
  if (token) {
    init.headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (body !== undefined) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  
  const res = await fetch(url, init);
  
  // Si el token expiró (401), intentar renovarlo
  if (res.status === 401 && !path.includes('/auth/')) {
    const errorText = await res.text().catch(() => '');
    
    // Verificar si es un error de token expirado
    if (errorText.includes('expired') || errorText.includes('token_not_valid')) {
      
      // Si ya hay una renovación en proceso, esperar
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            // Reintentar la petición original con el nuevo token
            init.headers['Authorization'] = `Bearer ${newToken}`;
            fetch(url, init)
              .then(response => {
                if (response.ok) {
                  const contentType = response.headers.get('content-type') || '';
                  if (contentType.includes('application/json')) {
                    return response.json();
                  }
                  return response.text();
                }
                throw new Error(`API ${response.status}: ${response.statusText}`);
              })
              .then(resolve)
              .catch(resolve);
          });
        });
      }
      
      // Marcar que estamos renovando
      isRefreshing = true;
      
      try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        onTokenRefreshed(newToken);
        
        // Reintentar la petición original con el nuevo token
        init.headers['Authorization'] = `Bearer ${newToken}`;
        const retryRes = await fetch(url, init);
        
        if (!retryRes.ok) {
          const text = await retryRes.text().catch(() => '');
          throw new Error(`API ${retryRes.status}: ${text || retryRes.statusText}`);
        }
        
        const contentType = retryRes.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return retryRes.json();
        }
        return retryRes.text();
      } catch (refreshError) {
        isRefreshing = false;
        throw refreshError;
      }
    }
  }
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return res.text();
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};

export default api;
