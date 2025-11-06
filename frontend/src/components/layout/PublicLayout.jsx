import React from 'react';
import AnimatedBackground from './AnimatedBackground.jsx';
import Footer from './Footer.jsx';

// Layout público para pantallas como Login: fondo limpio y footer incluido
export default function PublicLayout({ children }){
  return (
    <div className="app-bg relative min-h-screen">
      {/* Fondo decorativo deshabilitado para una apariencia limpia */}
      <main className="relative z-10 min-h-screen">{children}</main>
      <Footer />
    </div>
  );
}
