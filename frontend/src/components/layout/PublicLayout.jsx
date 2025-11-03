import React from 'react';
import { SceneLayers } from '../';
import AnimatedBackground from './AnimatedBackground.jsx';

// Layout público para pantallas como Login: siempre usa el fondo en modo claro
export default function PublicLayout({ children }){
  return (
    <div className="app-bg relative min-h-screen">
      <SceneLayers variantOverride="sunset" />
      <AnimatedBackground forceMode="light" />
      <main className="relative z-10 min-h-screen">{children}</main>
    </div>
  );
}
