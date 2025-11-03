import React from 'react';
import { NavLink } from 'react-router-dom';
import { PATHS } from '../../routes/paths';

export default function MobileNav() {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-lg shadow-2xl safe-bottom" 
         style={{ background: 'rgba(255, 255, 255, 0.95)', borderColor: 'var(--border-color)' }}>
      <div className="flex items-center justify-around px-4 py-3">
        <NavLink
          to={PATHS.DASHBOARD}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all active:scale-95 ${
              isActive
                ? 'scale-105'
                : 'scale-100'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform`}>
                <HomeIcon className={`w-7 h-7 mb-1 ${isActive ? '' : 'text-slate-600'}`} 
                          style={isActive ? { color: 'var(--accent-start)' } : {}} />
                {isActive && (
                  <div className="absolute -inset-2 rounded-full opacity-20" 
                       style={{ background: 'var(--accent-start)' }} />
                )}
              </div>
              <span className={`text-xs font-bold ${isActive ? '' : 'text-slate-600'}`}
                    style={isActive ? { color: 'var(--accent-start)' } : {}}>
                Inicio
              </span>
            </>
          )}
        </NavLink>

        <NavLink
          to={PATHS.EXPLORAR}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all active:scale-95 ${
              isActive
                ? 'scale-105'
                : 'scale-100'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform`}>
                <SearchIcon className={`w-7 h-7 mb-1 ${isActive ? '' : 'text-slate-600'}`}
                            style={isActive ? { color: 'var(--accent-start)' } : {}} />
                {isActive && (
                  <div className="absolute -inset-2 rounded-full opacity-20" 
                       style={{ background: 'var(--accent-start)' }} />
                )}
              </div>
              <span className={`text-xs font-bold ${isActive ? '' : 'text-slate-600'}`}
                    style={isActive ? { color: 'var(--accent-start)' } : {}}>
                Explorar
              </span>
            </>
          )}
        </NavLink>

        <NavLink
          to={PATHS.PERFIL}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all active:scale-95 ${
              isActive
                ? 'scale-105'
                : 'scale-100'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform`}>
                <UserIcon className={`w-7 h-7 mb-1 ${isActive ? '' : 'text-slate-600'}`}
                          style={isActive ? { color: 'var(--accent-start)' } : {}} />
                {isActive && (
                  <div className="absolute -inset-2 rounded-full opacity-20" 
                       style={{ background: 'var(--accent-start)' }} />
                )}
              </div>
              <span className={`text-xs font-bold ${isActive ? '' : 'text-slate-600'}`}
                    style={isActive ? { color: 'var(--accent-start)' } : {}}>
                Perfil
              </span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
}

// Iconos SVG
function HomeIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3l9-8z" />
    </svg>
  );
}

function SearchIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M10 2a8 8 0 105.3 14l4.4 4.4 1.4-1.4-4.4-4.4A8 8 0 0010 2zm0 2a6 6 0 110 12A6 6 0 0110 4z" />
    </svg>
  );
}

function UserIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5.33 0-8 2.67-8 6v2h16v-2c0-3.33-2.67-6-8-6z" />
    </svg>
  );
}
