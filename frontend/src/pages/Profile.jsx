import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import { getUserProfile, getUserStats, updateUserProfile, logout } from '../services/user.service';
import { useTheme } from '../theme';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

export default function ProfilePage(){
  const navigate = useNavigate();
  const { themeId, setThemeId, themes, mode, toggleMode } = useTheme();
  const [profile, setProfile] = useState({ nick: 'Explorador', initial: 'E' });
  const [stats, setStats] = useState({ totalAnimals: 0, totalMessages: 0, currentStreak: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingNick, setEditingNick] = useState(false);
  const [newNick, setNewNick] = useState('');
  
  // Estados para notificaciones
  const [toast, setToast] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const [profileData, statsData] = await Promise.all([
        getUserProfile(),
        getUserStats()
      ]);
      
      setProfile(profileData);
      if (statsData) setStats(statsData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleNickChange() {
    if (!newNick.trim()) {
      setToast({ message: 'El apodo no puede estar vacío', type: 'warning' });
      return;
    }
    
    setSaving(true);
    try {
      // Guardar el nuevo apodo en la base de datos
      await updateUserProfile(newNick.trim());
      
      // Actualizar el estado local
      setProfile(prev => ({
        ...prev,
        nick: newNick.trim(),
        initial: newNick.trim()[0].toUpperCase()
      }));
      
      setEditingNick(false);
      setNewNick('');
      
      setToast({ message: 'Apodo actualizado correctamente', type: 'success' });
    } catch (error) {
      console.error('Error actualizando apodo:', error);
      setToast({ message: 'Error al actualizar el apodo. Intenta de nuevo.', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setShowLogoutConfirm(true);
  }
  
  async function confirmLogout() {
    setShowLogoutConfirm(false);
    await logout();
    navigate('/login');
  }

  return (
  <DashboardLayout>
        <section className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6">
          <div className="rounded-2xl border p-4 sm:p-6 md:p-8" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex items-center justify-center text-white text-xl sm:text-2xl font-bold flex-shrink-0" style={{ background: profile.photoUrl ? undefined : 'linear-gradient(135deg, var(--accent-start), var(--accent-end))' }}>
                  {profile.photoUrl ? (
                    <img 
                      src={profile.photoUrl} 
                      alt="Perfil" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : profile.initial}
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Perfil</h2>
                  <p className="text-sm sm:text-base text-slate-600">Hola, {profile.nick}</p>
                  {profile.email && <p className="text-xs sm:text-sm text-slate-500 truncate max-w-[200px] sm:max-w-none">{profile.email}</p>}
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full sm:w-auto px-4 py-2 rounded-lg border hover:bg-red-50 text-red-600 transition-colors text-sm sm:text-base"
                style={{ borderColor: 'var(--border-color)' }}
              >
                Cerrar Sesión
              </button>
            </div>

            <div className="mt-4 sm:mt-6 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {/* Información Personal */}
              <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                <h3 className="font-semibold text-lg mb-4">👤 Información Personal</h3>
                <div className="space-y-4">
                  {/* Apodo */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Apodo</label>
                    {editingNick ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newNick}
                          onChange={(e) => setNewNick(e.target.value)}
                          placeholder={profile.nick}
                          maxLength={30}
                          className="flex-1 px-3 py-2 rounded-lg border"
                          style={{ 
                            background: 'var(--bg-surface)', 
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-color)'
                          }}
                          autoFocus
                        />
                        <button
                          onClick={handleNickChange}
                          disabled={saving}
                          className="px-4 py-2 rounded-lg text-white"
                          style={{ background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))' }}
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => {
                            setEditingNick(false);
                            setNewNick('');
                          }}
                          className="px-4 py-2 rounded-lg border"
                          style={{ borderColor: 'var(--border-color)' }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
                        <span className="font-medium">{profile.nick}</span>
                        <button
                          onClick={() => {
                            setEditingNick(true);
                            setNewNick(profile.nick);
                          }}
                          className="text-sm text-purple-600 hover:underline"
                        >
                          Editar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  {profile.email && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Correo Electrónico</label>
                      <div className="py-2 px-3 rounded-lg border bg-gray-50" style={{ borderColor: 'var(--border-color)' }}>
                        <span className="text-sm text-slate-600">{profile.email}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Vinculado con Google</p>
                    </div>
                  )}

                  {/* Tipo de cuenta */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Tipo de Cuenta</label>
                    <div className="py-2 px-3 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
                      <span className="text-sm">
                        {profile.email ? '🔐 Google OAuth' : '👤 Invitado'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferencias de Apariencia */}
              <div className="rounded-xl border p-4 sm:p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                <h3 className="font-semibold text-base sm:text-lg mb-4">🎨 Apariencia</h3>
                <div className="space-y-4">
                  {/* Temas */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Selecciona tu tema favorito</label>
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                      {themes.map(t => (
                        <button 
                          key={t.id} 
                          onClick={() => setThemeId(t.id)}
                          className={`flex items-center gap-2 rounded-lg border-2 px-2 sm:px-3 py-2 text-left transition-all hover:scale-[1.02] active:scale-95 ${
                            t.id === themeId ? 'ring-2 ring-purple-500' : ''
                          }`}
                          style={{ 
                            background: 'var(--bg-surface)', 
                            borderColor: t.id === themeId ? t.vars['--accent-start'] : 'var(--border-color)'
                          }}
                        >
                          <span 
                            className="inline-flex w-6 h-6 sm:w-8 sm:h-8 rounded-lg border flex-shrink-0" 
                            style={{
                              background: `linear-gradient(135deg, ${t.vars['--accent-start']}, ${t.vars['--accent-end']})`,
                              borderColor: t.vars['--accent-start']
                            }} 
                          />
                          <span className="text-xs sm:text-sm font-medium truncate" style={{ color: 'var(--text-color)' }}>{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Modo claro/oscuro */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Modo de visualización</label>
                    <button
                      onClick={toggleMode}
                      className="flex items-center justify-between w-full px-4 py-3 rounded-lg border-2 transition-all hover:scale-[1.02]"
                      style={{ 
                        background: 'var(--bg-surface)', 
                        borderColor: 'var(--border-color)' 
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {mode === 'dark' ? '🌙' : '☀️'}
                        </span>
                        <div className="text-left">
                          <div className="font-medium" style={{ color: 'var(--text-color)' }}>
                            {mode === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}
                          </div>
                          <div className="text-xs text-slate-500">
                            Toca para cambiar
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-purple-600 font-medium">Cambiar</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Progreso */}
              <div className="rounded-xl border p-4 sm:p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                <h3 className="font-semibold text-base sm:text-lg mb-4">📊 Progreso</h3>
                {loading ? (
                  <div className="text-center py-8 text-slate-500 text-sm">Cargando...</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col items-center justify-center p-3 rounded-lg border" style={{ borderColor: 'var(--border-color)', background: 'rgba(139, 92, 246, 0.05)' }}>
                      <span className="text-2xl mb-1">🐾</span>
                      <span className="font-bold text-lg sm:text-xl">{stats.totalAnimals}</span>
                      <span className="text-xs text-slate-600 text-center">Animales</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 rounded-lg border" style={{ borderColor: 'var(--border-color)', background: 'rgba(59, 130, 246, 0.05)' }}>
                      <span className="text-2xl mb-1">💬</span>
                      <span className="font-bold text-lg sm:text-xl">{stats.totalMessages}</span>
                      <span className="text-xs text-slate-600 text-center">Chats</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 rounded-lg border" style={{ borderColor: 'var(--border-color)', background: 'rgba(251, 146, 60, 0.05)' }}>
                      <span className="text-2xl mb-1">🔥</span>
                      <span className="font-bold text-lg sm:text-xl">{stats.currentStreak}</span>
                      <span className="text-xs text-slate-600 text-center">Días</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 rounded-lg border" style={{ borderColor: 'var(--border-color)', background: 'rgba(234, 179, 8, 0.05)' }}>
                      <span className="text-2xl mb-1">🏆</span>
                      <span className="font-bold text-lg sm:text-xl">{stats.achievements?.length || 0}</span>
                      <span className="text-xs text-slate-600 text-center">Logros</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Historial de Chat */}
            <div className="mt-4 sm:mt-6 rounded-xl border p-4 sm:p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4">
                <h3 className="font-semibold text-base sm:text-lg">💾 Historial de Chat</h3>
                <button 
                  onClick={() => navigate('/explorar')}
                  className="text-sm text-purple-600 hover:underline self-start sm:self-auto"
                >
                  Ver todo →
                </button>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">
                Tus conversaciones con Jaggy se guardan automáticamente. 
                Puedes acceder a ellas desde el Explorer.
              </p>
            </div>
          </div>
    </section>
    
    {/* Toast de notificación */}
    {toast && (
      <Toast
        message={toast.message}
        type={toast.type}
        duration={3000}
        onClose={() => setToast(null)}
      />
    )}
    
    {/* Modal de confirmación de cierre de sesión */}
    <ConfirmModal
      isOpen={showLogoutConfirm}
      title="¿Cerrar sesión?"
      message="¿Estás seguro que quieres salir? Tus datos están guardados."
      confirmText="Sí, cerrar sesión"
      cancelText="Cancelar"
      type="danger"
      onConfirm={confirmLogout}
      onCancel={() => setShowLogoutConfirm(false)}
    />
  </DashboardLayout>
  );
}
