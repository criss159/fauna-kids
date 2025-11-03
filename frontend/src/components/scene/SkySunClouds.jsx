import React from 'react';

export default function SkySunClouds({ variant = 'sunset' }) {
  const isNight = variant === 'night';
  return (
    <svg viewBox="0 0 1440 900" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        {/* Día/Tarde */}
        <linearGradient id="skySunset_m" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffcc6f"/>
          <stop offset="55%" stopColor="#ffe39e"/>
          <stop offset="100%" stopColor="#fff7ed"/>
        </linearGradient>
        {/* Noche */}
        <linearGradient id="skyNight_m" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b1025"/>
          <stop offset="60%" stopColor="#141a3a"/>
          <stop offset="100%" stopColor="#1d254e"/>
        </linearGradient>
        <radialGradient id="moonGlow_m" cx="50%" cy="66%" r="12%">
          <stop offset="0%" stopColor="#fffdf4" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#fff8d6" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fff3b0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="1440" height="900" fill={isNight ? 'url(#skyNight_m)' : 'url(#skySunset_m)'} />

    {isNight ? (
        <>
          {/* Luna y halo */}
      <circle cx="1260" cy="140" r="110" fill="url(#moonGlow_m)" />
      <circle cx="1260" cy="140" r="36" fill="#fff7cc" />
          {/* Estrellas (más, con brillo y algunos destellos aleatorios) */}
          <g fill="#ffffff" opacity="1">
            {Array.from({ length: 280 }).map((_, i) => {
              const cx = (i * 97) % 1440;
              const cy = 30 + ((i * 53) % 540);
              const r = (i % 9 === 0) ? 2.1 : (i % 3 === 0 ? 1.4 : 1);
              const baseOpacity = 0.76 + ((i % 5) * 0.06);
              const twinkle = i % 13 === 0; // algunas estrellas parpadean
              return (
                <circle key={i} cx={cx} cy={cy} r={r} opacity={baseOpacity}>
                  {twinkle && (
                    <animate
                      attributeName="opacity"
                      values={`${baseOpacity};1;${baseOpacity}`}
                      dur={`${2 + (i % 7)}s`}
                      begin={`${(i % 11) * 0.6}s`}
                      repeatCount="indefinite"
                    />
                  )}
                </circle>
              );
            })}
          </g>
          {/* Neblina sutil */}
          <g fill="#9aa7ff" opacity="0.06">
            <path d="M80 220 q160 24 300 -6 q160 -34 340 6 q160 36 320 6" />
            <path d="M140 300 q120 20 240 -10 q120 -30 260 10 q120 32 260 -4" />
          </g>
        </>
      ) : (
        <>
          {/* Sol */}
          <circle cx="720" cy="600" r="40" fill="#ffe8b0" opacity="0.9" />
          {/* Nubes pinceladas */}
          <g fill="#ffffff" opacity="0.25">
            <path d="M100 140 q120 30 260 0 q140 -30 280 0 q140 30 300 0 q140 -30 320 10" />
            <path d="M80 220 q160 24 300 -6 q160 -34 340 6 q160 36 320 6" opacity="0.22" />
            <path d="M140 300 q120 20 240 -10 q120 -30 260 10 q120 32 260 -4" opacity="0.18" />
          </g>
        </>
      )}
    </svg>
  );
}
