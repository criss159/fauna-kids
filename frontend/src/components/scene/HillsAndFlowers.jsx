import React from 'react';

export default function HillsAndFlowers({ hillA = '#fbcfe8', hillB = '#f5a2c7', dot1 = '#ffffff', dot2 = '#ffd1e8' }) {
  return (
  <svg viewBox="-100 0 1640 300" width="100%" height="100%" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="hillGrad_a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={hillA} />
          <stop offset="100%" stopColor={hillB} />
        </linearGradient>
        <linearGradient id="hillGrad_fg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={hillA} />
          <stop offset="100%" stopColor={hillB} />
        </linearGradient>
      </defs>
      {/* Colina posterior (ondulada) */}
  <path d="M-100 120 Q100 60 260 120 T620 120 T980 120 T1340 120 T1640 120 L1640 300 L-100 300 Z" fill="url(#hillGrad_a)" />

      {/* Colina/pradera en primer plano, con borde superior curvo (sin franja recta) */}
  <path d="M-100 160 Q80 200 260 170 T620 180 T980 170 T1640 150 L1640 300 L-100 300 Z" fill="url(#hillGrad_fg)" />

      {/* Luz suave en el lomo para dar volumen */}
  <path d="M-100 160 Q80 200 260 170 T620 180 T980 170 T1640 150" fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="6" />

      {/* Flores/hojas pequeñas dispersas */}
      {Array.from({ length: 120 }).map((_, i) => (
        <circle key={i} cx={(i * 71) % 1440} cy={170 + ((i * 37) % 120)} r={i % 7 === 0 ? 2.2 : 1.4} fill={i % 3 === 0 ? dot1 : dot2} opacity="0.85" />
      ))}
    </svg>
  );
}
