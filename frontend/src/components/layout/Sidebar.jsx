import React from "react";
import { NavLink } from "react-router-dom";
import { PATHS } from "../../routes/paths";

const items = [
  { to: PATHS.DASHBOARD, label: "Inicio", icon: HomeIcon },
  { to: PATHS.EXPLORAR, label: "Explorar", icon: SearchIcon },
  { to: PATHS.PERFIL, label: "Perfil", icon: UserIcon },
];

export default function Sidebar() {
  return (
    <aside
  className="peer group fixed left-0 top-0 z-30 h-screen w-16 hover:w-64 md:w-16 md:hover:w-64 backdrop-blur-md border-r transition-[width] duration-300 overflow-visible hidden sm:block"
      aria-label="Menú lateral"
      style={{ background: 'var(--bg-surface)', borderRightColor: 'var(--border-color)' }}
    >
  {/* Encabezado removido; offset interno para la Navbar fija (h-16) */}
  <div className="pt-16 pb-20">

  <nav className="py-3">
        <ul className="space-y-1">
          {items.map(({ to, label, icon }) => (
            <li key={to}>
    <NavLink
                to={to}
                className={({ isActive }) =>
                  [
          "mx-2 flex items-center rounded-xl px-3 py-3 transition-all relative overflow-visible",
          "hover:bg-slate-100 hover:scale-[1.03] active:scale-95 fun-pop-in",
                    isActive
                      ? "bg-slate-100 text-accent-start border border-accent-start"
                      : "text-slate-700",
                  ].join(" ")
                }
              >
                <div className="text-slate-700 group-hover:text-accent-start transition-colors">
                  {React.createElement(icon, { className: "w-6 h-6" })}
                </div>
                <span className="ml-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {label}
                </span>
        {/* sparkle en hover */}
        <span aria-hidden className="absolute -right-1 top-1 opacity-0 group-hover:opacity-100 fun-sparkles" style={{ color: 'var(--accent-start)' }}>✦</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
  {/* remate inferior: fundido con el color de la página + tira de 2px para ocultar borde al tocar el footer */}
  <div aria-hidden className="absolute bottom-0 left-0 w-full h-6" style={{ pointerEvents: 'none', background: 'var(--bg-page)' }} />
  <div aria-hidden className="absolute -bottom-1 left-0 w-full h-2" style={{ pointerEvents: 'none', background: 'var(--bg-page)', borderBottomLeftRadius: '12px', boxShadow: '0 -2px 6px rgba(0,0,0,0.18)' }} />
  <div aria-hidden className="absolute -bottom-0.5 right-0 w-0.5 h-6" style={{ pointerEvents: 'none', background: 'var(--bg-page)' }} />
      </div>
    </aside>
  );
}

function LogoIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 3l2.4 4.86 5.37.78-3.88 3.78.92 5.36L12 15.9l-4.81 2.88.92-5.36L4.23 8.64l5.37-.78L12 3z" />
    </svg>
  );
}
function HomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3l9-8z" />
    </svg>
  );
}
function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M10 2a8 8 0 105.3 14l4.4 4.4 1.4-1.4-4.4-4.4A8 8 0 0010 2zm0 2a6 6 0 110 12A6 6 0 0110 4z" />
    </svg>
  );
}
function FoxIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 3l3 3 4-1-1 4 3 3-4 1-1 4-3-3-3 3-1-4-4-1 3-3-1-4 4 1 3-3z" />
    </svg>
  );
}
function GamepadIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6 8h12a4 4 0 014 4 6 6 0 01-6 6h-8a6 6 0 01-6-6 4 4 0 014-4zm2 3H6v2h2v2h2v-2h2v-2h-2V9H8v2zm8 1a1 1 0 100 2 1 1 0 000-2zm2-2a1 1 0 100 2 1 1 0 000-2z" />
    </svg>
  );
}
function UserIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5.33 0-8 2.67-8 6v2h16v-2c0-3.33-2.67-6-8-6z" />
    </svg>
  );
}

function SettingsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
    </svg>
  );
}

function PaletteIcon(props){
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2C6.48 2 2 6.03 2 10.8c0 3.02 2.03 4.7 4.03 4.7H8c.55 0 1 .45 1 1 0 1.1.9 2 2 2h1c2.76 0 5-2.01 5-4.5 0-1.38-.56-2.18-1.52-3.12-.37-.37-.48-.94-.27-1.42.33-.72.52-1.52.52-2.36C15.73 4.2 14.05 2 12 2zM6.5 9C5.67 9 5 8.33 5 7.5S5.67 6 6.5 6 8 6.67 8 7.5 7.33 9 6.5 9zm4-2C9.67 7 9 6.33 9 5.5S9.67 4 10.5 4 12 4.67 12 5.5 11.33 7 10.5 7zm5 3c-.83 0-1.5-.67-1.5-1.5S14.67 7 15.5 7 17 7.67 17 8.5 16.33 12 15.5 12z"/>
    </svg>
  );
}

function SunIcon(props){
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zM1 13h3v-2H1v2zm10-9h-2v3h2V4zm7.04 2.46l1.79-1.8-1.41-1.41-1.8 1.79 1.42 1.42zM20 11v2h3v-2h-3zm-8 9h2v-3h-2v3zm4.24-2.84l1.8 1.79 1.41-1.41-1.79-1.8-1.42 1.42zM4.22 18.36l1.79-1.8-1.41-1.41-1.8 1.79 1.42 1.42zM12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  );
}

function MoonIcon(props){
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M9.37 5.51A7 7 0 1018.49 14.6 8 8 0 019.37 5.5z" />
    </svg>
  );
}
