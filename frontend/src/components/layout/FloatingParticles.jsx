import React, { useEffect, useState } from 'react';
import { useTheme } from '../../theme';
import fondoImg from '../../assets/avatars/fondo.png';

// Sistema de capas de fondo completo: cielo + imagen + partículas
export default function FloatingParticles() {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generar partículas con posiciones y velocidades aleatorias
    const count = isDark ? 60 : 35;
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: isDark ? Math.random() * 100 : -20, // Estrellas fijas, pétalos caen
      animationDuration: isDark 
        ? 2 + Math.random() * 3 // Estrellas titilan
        : 10 + Math.random() * 10, // Pétalos caen lento
      animationDelay: Math.random() * 5,
      size: isDark
        ? 1.5 + Math.random() * 2.5 // Estrellas pequeñas
        : 6 + Math.random() * 6, // Pétalos más grandes
      opacity: isDark ? 0.4 + Math.random() * 0.6 : 0.5 + Math.random() * 0.4,
    }));
    setParticles(newParticles);
  }, [isDark]);

  return (
    <>
      {/* Capa 1: Cielo de fondo (más atrás, z-index 0) */}
      <div 
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{ 
          zIndex: 0,
          background: isDark 
            ? 'linear-gradient(to bottom, #000000 0%, #0a0a1a 40%, #1a1a2e 100%)' // Cielo nocturno
            : 'linear-gradient(to bottom, #ffb347 0%, #ffcc99 40%, #ffe5cc 70%, #fff5e6 100%)' // Atardecer
        }}
      >
        {/* Estrellas de fondo en modo oscuro (integradas en el cielo) */}
        {isDark && (
          <div className="stars-background" style={{ width: '100%', height: '100%' }}>
            {Array.from({ length: 100 }).map((_, i) => (
              <div
                key={`star-bg-${i}`}
                className="star-bg"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${1 + Math.random() * 2}px`,
                  height: `${1 + Math.random() * 2}px`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Capa 2: Imagen de fondo (z-index 1) */}
      <div 
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none bg-cover bg-center bg-no-repeat"
        style={{ 
          zIndex: 1,
          backgroundImage: `url(${fondoImg})`,
          opacity: isDark ? 0.3 : 0.85, // Más tenue en modo oscuro
        }}
      />

      {/* Capa 3: Partículas flotantes adelante (z-index 2) */}
      <div 
        aria-hidden="true" 
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 2 }}
      >
        {particles.map(particle => (
          <div
            key={particle.id}
            className={isDark ? 'star-particle' : 'petal-particle'}
            style={{
              left: `${particle.left}%`,
              top: isDark ? `${particle.top}%` : undefined,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDuration: `${particle.animationDuration}s`,
              animationDelay: `${particle.animationDelay}s`,
              opacity: particle.opacity,
            }}
          />
        ))}
      </div>

      <style>{`
        /* Estrellas de fondo (parte del cielo) */
        .star-bg {
          position: absolute;
          background: #ffffff;
          border-radius: 50%;
          animation: twinkle-bg ease-in-out infinite;
        }

        @keyframes twinkle-bg {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.9; }
        }

        /* Pétalos cayendo (adelante) */
        .petal-particle {
          position: absolute;
          top: -20px;
          background: linear-gradient(135deg, #ffb6d9 0%, #ffa3c7 50%, #ff91b5 100%);
          border-radius: 50% 0% 50% 0%;
          animation: fall-petal linear infinite;
          transform-origin: center;
          box-shadow: 0 2px 4px rgba(255, 145, 181, 0.3);
        }

        @keyframes fall-petal {
          0% {
            transform: translateY(0) rotate(0deg) translateX(0);
          }
          25% {
            transform: translateY(25vh) rotate(90deg) translateX(20px);
          }
          50% {
            transform: translateY(50vh) rotate(180deg) translateX(-10px);
          }
          75% {
            transform: translateY(75vh) rotate(270deg) translateX(15px);
          }
          100% {
            transform: translateY(100vh) rotate(360deg) translateX(-5px);
          }
        }

        /* Estrellas brillantes (adelante) */
        .star-particle {
          position: absolute;
          background: #ffffff;
          border-radius: 50%;
          animation: twinkle-star ease-in-out infinite;
          box-shadow: 0 0 6px rgba(255, 255, 255, 0.9), 0 0 3px rgba(255, 255, 255, 0.6);
        }

        @keyframes twinkle-star {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
          }
        }

        /* Respetar preferencia de movimiento reducido */
        @media (prefers-reduced-motion: reduce) {
          .petal-particle,
          .star-particle,
          .star-bg {
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
}
