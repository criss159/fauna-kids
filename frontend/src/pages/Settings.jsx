import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import { getUserPreferences, updateUserPreferences } from '../services/user.service';

export default function SettingsPage() {
  const [preferences, setPreferences] = useState({ theme: 'auto', notifications: false, voiceEnabled: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      const prefs = await getUserPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Error cargando preferencias:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleThemeChange(theme) {
    setSaving(true);
    const newPrefs = { ...preferences, theme };
    setPreferences(newPrefs);
    await updateUserPreferences(newPrefs);
    
    // Aplicar tema inmediatamente
    document.documentElement.setAttribute('data-theme', theme);
    
    showSaveMessage('Tema actualizado');
    setSaving(false);
  }

  async function handleVoiceToggle() {
    setSaving(true);
    const newPrefs = { ...preferences, voiceEnabled: !preferences.voiceEnabled };
    setPreferences(newPrefs);
    await updateUserPreferences(newPrefs);
    
    showSaveMessage('Configuración de voz actualizada');
    setSaving(false);
  }

  function showSaveMessage(message) {
    setSaveMessage(message);
    setTimeout(() => setSaveMessage(''), 3000);
  }

  return (
    <DashboardLayout>
      <section className="mx-auto max-w-4xl px-3 sm:px-4">
        <div className="rounded-2xl border p-6 sm:p-8" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">⚙️ Configuración</h1>
            <p className="text-slate-600">Personaliza tu experiencia en Fauna Kids</p>
          </div>

          {/* Mensaje de guardado */}
          {saveMessage && (
            <div className="mb-4 p-3 rounded-lg bg-green-100 text-green-800 border border-green-200">
              ✓ {saveMessage}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-slate-500">
              <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              Cargando configuración...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Apariencia */}
              <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                <h2 className="font-semibold text-xl mb-4 flex items-center gap-2">
                  🎨 Apariencia
                </h2>
                
                <div className="space-y-4">
                  {/* Tema */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Modo de color</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'auto', icon: '🌓', label: 'Auto' },
                        { value: 'light', icon: '☀️', label: 'Claro' },
                        { value: 'dark', icon: '🌙', label: 'Oscuro' }
                      ].map(theme => (
                        <button
                          key={theme.value}
                          onClick={() => handleThemeChange(theme.value)}
                          disabled={saving}
                          className={`px-4 py-3 rounded-xl border-2 transition-all font-medium ${
                            preferences.theme === theme.value 
                              ? 'ring-2 ring-purple-500 ring-offset-2' 
                              : 'hover:border-purple-300'
                          }`}
                          style={{ 
                            background: preferences.theme === theme.value 
                              ? 'linear-gradient(135deg, var(--accent-start), var(--accent-end))' 
                              : 'var(--bg-surface)', 
                            borderColor: preferences.theme === theme.value 
                              ? 'transparent' 
                              : 'var(--border-color)',
                            color: preferences.theme === theme.value 
                              ? 'white' 
                              : 'var(--text-color)'
                          }}
                        >
                          <div className="text-2xl mb-1">{theme.icon}</div>
                          <div className="text-sm">{theme.label}</div>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {preferences.theme === 'auto' 
                        ? 'El modo se ajustará según las preferencias de tu sistema' 
                        : preferences.theme === 'light'
                        ? 'Interfaz con colores claros'
                        : 'Interfaz con colores oscuros'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Audio */}
              <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                <h2 className="font-semibold text-xl mb-4 flex items-center gap-2">
                  🔊 Audio
                </h2>
                
                <div className="space-y-4">
                  {/* Voz de Jaggy */}
                  <div className="flex items-start justify-between py-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">🎤 Voz de Jaggy</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          preferences.voiceEnabled 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {preferences.voiceEnabled ? 'Activada' : 'Desactivada'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">
                        Jaggy te hablará usando Google Cloud Text-to-Speech
                      </p>
                    </div>
                    <button
                      onClick={handleVoiceToggle}
                      disabled={saving}
                      className={`relative w-14 h-7 rounded-full transition-colors ml-4 flex-shrink-0 ${
                        preferences.voiceEnabled ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span 
                        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${
                          preferences.voiceEnabled ? 'translate-x-7' : 'translate-x-0'
                        }`} 
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Notificaciones (próximamente) */}
              <div className="rounded-xl border p-5 opacity-60" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                <h2 className="font-semibold text-xl mb-4 flex items-center gap-2">
                  🔔 Notificaciones
                </h2>
                
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🚧</div>
                  <p className="text-slate-500">Próximamente disponible</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Podrás configurar recordatorios y alertas
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}
