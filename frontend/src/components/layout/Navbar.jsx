import React, { useMemo, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { PATHS } from "../../routes/paths";

export default function Navbar() {
  const { pathname } = useLocation();
  const title = useMemo(() => {
    if (pathname.startsWith("/explorar")) return "Explorar";
    if (pathname.startsWith("/avatar")) return "Mi Avatar";
    if (pathname.startsWith("/jugar")) return "Jugar";
    if (pathname.startsWith("/perfil")) return "Perfil";
    return "Inicio";
  }, [pathname]);

  const [menuOpen, setMenuOpen] = useState(false);
  
  // Inicializar estado con datos de localStorage si existen
  const [userData, setUserData] = useState(() => {
    if (typeof window === 'undefined') return { nick: 'Explorador', photoUrl: null };
    
    const userStr = localStorage.getItem('user');
    const nick = localStorage.getItem('fauna_nick');
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return {
          nick: user.display_name || user.username || nick || 'Explorador',
          photoUrl: user.avatar_url || null
        };
      } catch {
        return { nick: nick || 'Explorador', photoUrl: null };
      }
    }
    
    return { nick: nick || 'Explorador', photoUrl: null };
  });
  
  // Obtener datos del usuario de localStorage
  useEffect(() => {
    const getUserData = () => {
      if (typeof window === 'undefined') return { nick: 'Explorador', photoUrl: null };
      
      const userStr = localStorage.getItem('user');
      const nick = localStorage.getItem('fauna_nick');
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          
          const data = {
            nick: user.display_name || user.username || nick || 'Explorador',
            photoUrl: user.avatar_url || null
          };
          
          return data;
        } catch {
          return { nick: nick || 'Explorador', photoUrl: null };
        }
      }
      
      return { nick: nick || 'Explorador', photoUrl: null };
    };
    
    const data = getUserData();
    setUserData(data);
    
    // Listener para cambios en localStorage (cuando otro componente actualiza los datos)
    const handleStorageChange = () => {
      const newData = getUserData();
      setUserData(newData);
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // También escuchar eventos personalizados de la app
    window.addEventListener('user-updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('user-updated', handleStorageChange);
    };
  }, []); // Solo se ejecuta una vez al montar
  
  // Efecto separado para actualizar cuando cambia la ruta
  useEffect(() => {
    const getUserData = () => {
      if (typeof window === 'undefined') return { nick: 'Explorador', photoUrl: null };
      
      const userStr = localStorage.getItem('user');
      const nick = localStorage.getItem('fauna_nick');
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          return {
            nick: user.display_name || user.username || nick || 'Explorador',
            photoUrl: user.avatar_url || null
          };
        } catch {
          return { nick: nick || 'Explorador', photoUrl: null };
        }
      }
      
      return { nick: nick || 'Explorador', photoUrl: null };
    };
    
    const data = getUserData();
    setUserData(data);
  }, [pathname]); // Se actualiza cuando cambia la ruta
  
  const { nick, photoUrl } = userData;
  const initial = (nick?.trim?.()[0] || 'E').toUpperCase();
  
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function handleLogout() {
    try {
      if (typeof window !== 'undefined') {
        // Limpiar todos los datos de autenticación
        localStorage.removeItem('fauna_nick');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('guest_session_id');
        localStorage.removeItem('user');
      }
    } catch {
      // noop
    }
    navigate('/login');
  }

  return (
  <header className="fixed top-0 left-0 right-0 z-30 h-16 bg-accent-gradient border-b border-slate-200 relative">
  <div className="flex h-16 w-full items-center px-3 sm:px-4 gap-2 sm:gap-4 bg-transparent sm:pl-16 md:peer-hover:pl-64 transition-[padding] duration-300">
    {/* Marca → enlace a Inicio */}
    <Link to={PATHS.DASHBOARD} aria-label="Ir a Inicio" className="flex items-center gap-2 sm:gap-3 select-none shrink-0 group outline-none focus:outline-none focus-visible:outline-none">
      <img src="/logo.png" alt="Fauna Kids" className="w-10 h-10 sm:w-14 sm:h-14 object-contain rounded-xl group-hover:scale-[1.05] transition-transform fun-bounce-once outline-none ring-0" style={{ border: 'none' }} />
      <span className="hidden md:block text-white font-extrabold text-2xl sm:text-3xl leading-none fun-float" style={{ fontFamily: 'Trebuchet MS, Segoe UI, system-ui, -apple-system, sans-serif' }}>Fauna Kids</span>
    </Link>
    {/* Título centrado absoluto */}
    <h1
  className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none text-white text-base sm:text-xl md:text-2xl lg:text-3xl font-extrabold tracking-wide leading-none fun-pop-in"
      style={{ fontFamily: 'Trebuchet MS, Segoe UI, system-ui, -apple-system, sans-serif' }}
    >
      {title}
    </h1>
    <div className="ml-auto relative flex items-center gap-2 sm:gap-3" ref={menuRef}>
          <span className="hidden md:block text-white dark:text-white text-sm sm:text-base lg:text-xl font-semibold select-none drop-shadow-md">Hola, {nick} <span aria-hidden className="inline-block align-middle">👋</span></span>
          <button
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full text-white font-bold overflow-hidden p-0 m-0"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Abrir menú de usuario"
            style={photoUrl ? { 
              position: 'relative', 
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
              background: 'transparent'
            } : { 
              background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))',
              border: 'none',
              outline: 'none',
              boxShadow: 'none'
            }}
          >
            {photoUrl ? (
              <>
                <img 
                  src={photoUrl} 
                  alt="Perfil" 
                  className="w-full h-full object-cover rounded-full"
                  style={{ 
                    display: 'block', 
                    position: 'absolute', 
                    inset: 0,
                    border: 'none',
                    outline: 'none'
                  }}
                  onError={(e) => {
                    // Mostrar la inicial si la imagen falla
                    e.target.style.display = 'none';
                    const parent = e.target.parentElement;
                    if (parent) {
                      parent.style.background = 'linear-gradient(135deg, var(--accent-start), var(--accent-end))';
                      const span = document.createElement('span');
                      span.className = 'text-base select-none text-white';
                      span.textContent = initial;
                      parent.appendChild(span);
                    }
                  }}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
                <span 
                  className="text-base select-none text-white" 
                  style={{ 
                    position: 'absolute', 
                    inset: 0, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    opacity: 0,
                    pointerEvents: 'none'
                  }}
                >
                  {initial}
                </span>
              </>
            ) : (
              <span className="text-base select-none text-white">{initial}</span>
            )}
          </button>
          
          {menuOpen && (
            <div role="menu" className="absolute right-0 top-full mt-2 w-48 shadow-lg border overflow-hidden z-50 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <button onClick={() => { setMenuOpen(false); navigate('/perfil'); }} className="w-full text-left px-4 py-3 text-sm font-medium text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                Perfil
              </button>
              <div className="h-px bg-slate-200 dark:bg-slate-700" />
              <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
