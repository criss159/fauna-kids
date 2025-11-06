import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import JaggyAvatar from '../components/JaggyAvatar';
import { getUserStats, getUserProfile } from '../services/user.service';
import { getAnimalsExplored, isGuestUser } from '../services';

const cards = [
  { id: 'explorar', to: '/explorar', title: 'Explorar', desc: 'Haz preguntas sobre animales y descubre curiosidades.', accent: 'from-emerald-500/20 to-teal-500/10', icon: '🔎' },
  { id: 'perfil', to: '/perfil', title: 'Perfil', desc: 'Progreso, logros y preferencias.', accent: 'from-pink-500/20 to-rose-500/10', icon: '👤' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ nick: 'Explorador' });
  const [stats, setStats] = useState({
    totalAnimals: 0,
    totalMessages: 0,
    totalChats: 0,
    currentStreak: 0,
    achievements: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Verificar autenticación
      const token = localStorage.getItem('access_token');
      const guestSession = localStorage.getItem('guest_session_id');
      const nick = localStorage.getItem('fauna_nick');
      
      if (!token && !guestSession && !nick) {
        navigate('/login');
        return;
      }
      
      // Obtener datos del usuario de localStorage
      const userStr = localStorage.getItem('user');
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setProfile({
            nick: user.display_name || user.username || nick || 'Explorador',
            email: user.email,
            avatar_url: user.avatar_url,
            account_type: user.account_type
          });
        } catch {
          // Error silencioso, usar nick
        }
      } else if (nick) {
        setProfile({ nick });
      }
      
      // Cargar datos del usuario del servidor
      loadUserData();
    }
  }, [navigate]);

  async function loadUserData() {
    try {
      const promises = [
        getUserProfile().catch(() => null),
        getUserStats().catch(() => null)
      ];

      // Solo cargar animales si no es invitado
      if (!isGuestUser()) {
        promises.push(
          getAnimalsExplored().catch(() => [])
        );
      }

      const [profileData, statsData, animalsData] = await Promise.all(promises);
      
      if (profileData) {
        setProfile(prev => ({ ...prev, ...profileData }));
      }
      if (statsData) {
        setStats(statsData);
      }
      // Actualizar conteo de animales con datos reales de la API
      if (animalsData && animalsData.length > 0) {
        setStats(prev => ({ ...prev, totalAnimals: animalsData.length }));
      }
    } catch {
      // Error silencioso
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <section className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6">
        <div className="rounded-2xl border p-4 sm:p-6 md:p-8" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                {profile.nick}, continúa aprendiendo sobre fauna
              </h2>
              <p className="mt-2 text-slate-600 text-xs sm:text-sm md:text-base">
                {stats.totalMessages > 0 
                  ? `Has explorado ${stats.totalAnimales} animales en ${stats.totalSessions} conversaciones` 
                  : 'Explora animales y descubre datos fascinantes de la fauna'}
              </p>
            </div>
            <div className="self-center sm:self-auto">
              <JaggyAvatar 
                emotion="happy" 
                width={96} 
                height={96}
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24"
              />
            </div>
          </div>
        </div>

      <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto gap-3 sm:gap-4">
            {cards.map((c) => (
              <Link
                key={c.id}
                to={c.to}
                className={['group rounded-2xl border p-5 transition-transform hover:-translate-y-0.5 hover:scale-[1.01]'].join(' ')}
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="text-3xl">{c.icon}</div>
                  <div className="w-10 h-10 rounded-lg border bg-accent-gradient opacity-90 shadow-sm" style={{ borderColor: 'var(--border-color)' }} />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{c.title}</h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-color)', opacity: 0.8 }}>{c.desc}</p>
              </Link>
            ))}
          </div>

          <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <Stat 
              title="Animales Explorados" 
              value={loading ? '...' : stats.totalAnimals} 
              icon="🐾"
            />
            <Stat 
              title="Conversaciones" 
              value={loading ? '...' : stats.totalChats} 
              icon="💬"
            />
            <Stat 
              title="Racha de Estudio" 
              value={loading ? '...' : `${stats.currentStreak} día${stats.currentStreak !== 1 ? 's' : ''}`} 
              icon="🔥"
            />
          </div>

          {/* Sección de logros */}
          {!loading && stats.achievements && stats.achievements.length > 0 && (
            <div className="mt-6 rounded-2xl border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
              <h3 className="text-xl font-bold mb-4">🏆 Logros Recientes</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {stats.achievements.slice(0, 4).map((achievement, idx) => (
                  <div 
                    key={idx} 
                    className="rounded-xl border p-4 text-center hover:scale-105 transition-transform"
                    style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}
                  >
                    <div className="text-3xl mb-2">{achievement.icon || '🏅'}</div>
                    <p className="text-sm font-semibold">{achievement.name || `Logro ${idx + 1}`}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mensaje de bienvenida si es primera vez */}
          {!loading && stats.totalMessages === 0 && (
            <div className="mt-6 rounded-2xl border p-6 text-center" style={{ background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))', borderColor: 'var(--border-color)' }}>
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="text-xl font-bold text-white mb-2">¡Bienvenido a Fauna Kids!</h3>
              <p className="text-white/90 mb-4">
                Comienza tu aventura explorando el fascinante mundo de los animales con Jaggy
              </p>
              <Link 
                to="/explorar" 
                className="inline-block px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:scale-105 transition-transform"
              >
                Comenzar a Explorar →
              </Link>
            </div>
          )}
      </section>
    </DashboardLayout>
  );
}

function Stat({ title, value, icon }) {
  return (
    <div className="rounded-2xl border p-5 hover:scale-105 transition-transform" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium" style={{ color: 'var(--text-color)', opacity: 0.7 }}>{title}</p>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <p className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>{value}</p>
    </div>
  );
}
