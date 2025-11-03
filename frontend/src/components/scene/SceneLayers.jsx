import React from 'react';
import SkySunClouds from './SkySunClouds.jsx';
import HillsAndFlowers from './HillsAndFlowers.jsx';
import { useTheme } from '../../theme';
// Árbol eliminado temporalmente

export default function SceneLayers({ variantOverride }) {
  const { mode } = useTheme();
  const isDark = variantOverride ? (variantOverride === 'night') : (mode === 'dark');
  return (
    <div
      aria-hidden
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    >
      {/* Cielo a pantalla completa */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <SkySunClouds variant={isDark ? 'night' : 'sunset'} />
      </div>

  {/* Colinas y pradera más bajas */}
  <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '20vh' }} className="parallax-med">
  {isDark ? (
          <HillsAndFlowers hillA="#2a2f5e" hillB="#1d2347" dot1="#c1d2ff" dot2="#8fa2ff" />
        ) : (
          <HillsAndFlowers hillA="#fbd3e7" hillB="#f7a6c9" dot1="#ffffff" dot2="#ffd1e8" />
        )}
      </div>

  {/* Árbol retirado a solicitud: escena queda con cielo, montañas, colinas */}
    </div>
  );
}
