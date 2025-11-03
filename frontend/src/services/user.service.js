import { api } from '../utils/api'

/**
 * Obtener estadísticas del usuario
 */
export async function getUserStats() {
  try {
    const token = localStorage.getItem('access_token');
    const guestSession = localStorage.getItem('guest_session_id');
    
    if (!token && !guestSession) {
      return {
        totalAnimals: 0,
        totalMessages: 0,
        totalChats: 0,
        currentStreak: 0,
        achievements: []
      };
    }

    const data = await api.get('/user/stats');
    
    return {
      totalAnimals: data.total_animals || 0,
      totalMessages: data.total_messages || 0,
      totalChats: data.total_chats || 0,
      currentStreak: data.current_streak || 0,
      achievements: data.achievements || []
    };
  } catch {
    return {
      totalAnimals: 0,
      totalMessages: 0,
      totalSessions: 0,
      currentStreak: 0,
      achievements: []
    };
  }
}

/**
 * Obtener perfil del usuario
 */
export async function getUserProfile() {
  try {
    const token = localStorage.getItem('access_token');
    
    // Si hay token, obtener datos actualizados del backend
    if (token) {
      try {
        const response = await api.get('/auth/me');
        if (response && response.user) {
          // Actualizar localStorage con los datos más recientes
          localStorage.setItem('user', JSON.stringify(response.user));
          
          return {
            nick: response.user.display_name || response.user.username || 'Explorador',
            email: response.user.email || null,
            photoUrl: response.user.avatar_url || null,
            initial: ((response.user.display_name || response.user.username || 'E').trim()[0]).toUpperCase()
          };
        }
      } catch {
        // Fallback silencioso a localStorage
      }
    }
    
    // Fallback: obtener del localStorage
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      return {
        nick: user.display_name || user.username || 'Explorador',
        email: user.email || null,
        photoUrl: user.avatar_url || null,
        initial: ((user.display_name || user.username || 'E').trim()[0]).toUpperCase()
      }
    }
    
    // Fallback adicional a los valores individuales (para compatibilidad)
    const nick = localStorage.getItem('fauna_nick')
    const photoUrl = localStorage.getItem('fauna_photo_url')
    const email = localStorage.getItem('fauna_email')
    
    return {
      nick: nick || 'Explorador',
      email: email || null,
      photoUrl: photoUrl || null,
      initial: (nick?.trim?.()[0] || 'E').toUpperCase()
    }
  } catch {
    return {
      nick: 'Explorador',
      email: null,
      photoUrl: null,
      initial: 'E'
    }
  }
}

/**
 * Actualizar preferencias del usuario
 */
export async function updateUserPreferences(preferences) {
  try {
    // Guardar preferencias en localStorage
    if (preferences.theme) {
      localStorage.setItem('fauna_theme', preferences.theme)
    }
    if (preferences.notifications !== undefined) {
      localStorage.setItem('fauna_notifications', String(preferences.notifications))
    }
    if (preferences.voiceEnabled !== undefined) {
      localStorage.setItem('fauna_voice_enabled', String(preferences.voiceEnabled))
    }
    
    return true
  } catch {
    return false
  }
}

/**
 * Actualizar perfil del usuario (apodo/display_name)
 */
export async function updateUserProfile(displayName) {
  try {
    const data = await api.put('/user/profile', {
      display_name: displayName
    });
    
    // Actualizar localStorage con el nuevo display_name
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      user.display_name = displayName;
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    // Actualizar también fauna_nick por compatibilidad
    localStorage.setItem('fauna_nick', displayName);
    
    // Disparar evento para actualizar la UI
    window.dispatchEvent(new Event('user-updated'));
    
    return data;
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    throw error;
  }
}

/**
 * Obtener preferencias del usuario
 */
export async function getUserPreferences() {
  try {
    const theme = localStorage.getItem('fauna_theme') || 'auto'
    const notifications = localStorage.getItem('fauna_notifications') === 'true'
    const voiceEnabled = localStorage.getItem('fauna_voice_enabled') === 'true'
    
    return {
      theme,
      notifications,
      voiceEnabled
    }
  } catch {
    return {
      theme: 'auto',
      notifications: false,
      voiceEnabled: false
    }
  }
}

/**
 * Cerrar sesión
 */
export async function logout() {
  try {
    // Limpiar localStorage
    localStorage.removeItem('fauna_nick')
    localStorage.removeItem('fauna_email')
    localStorage.removeItem('fauna_photo_url')
    localStorage.removeItem('fauna_session_id')
    
    // Si hay token JWT, hacer logout en el backend
    const token = localStorage.getItem('fauna_token')
    if (token) {
      await api.post('/auth/logout')
      localStorage.removeItem('fauna_token')
    }
    
    return true
  } catch {
    // Limpiar de todas formas
    localStorage.clear()
    return true
  }
}
