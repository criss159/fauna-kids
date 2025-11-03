import React, { useCallback, useMemo } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import { useTheme } from '../../theme';

const AnimatedBackground = ({ forceMode }) => {
  const { mode } = useTheme();
  const isDark = forceMode ? (forceMode === 'dark') : (mode === 'dark');
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const particlesOptions = useMemo(() => {
    if (!isDark) {
      // Modo claro: pétalos
      return {
        autoPlay: true,
        background: { color: { value: 'transparent' } },
        fullScreen: { enable: true, zIndex: 0 },
        particles: {
          number: { value: 36, density: { enable: true, value_area: 900 } },
          shape: {
            type: 'image',
            image: { src: '/petals/sakura.svg', width: 500, height: 500 },
          },
          opacity: { value: { min: 0.25, max: 0.65 }, animation: { enable: true, speed: 0.25, sync: false } },
          size: { value: { min: 12, max: 28 }, animation: { enable: true, speed: 1.8, sync: false } },
          move: {
            enable: true,
            speed: 0.8,
            direction: 'bottom',
            straight: false,
            outModes: { default: 'out' },
            gravity: { enable: false, acceleration: 0 },
            drift: { enable: true, value: 0.6 },
            wobble: { enable: true, distance: 12, speed: 3 },
          },
          rotate: { value: { min: 0, max: 360 }, direction: 'random', animation: { enable: true, speed: 2 } },
        },
        interactivity: { detectsOn: 'canvas', events: { resize: true, onHover: { enable: false }, onClick: { enable: false } } },
        detectRetina: true,
      };
    }

    // Modo oscuro: luciérnagas/estrellas con constelaciones
    return {
      autoPlay: true,
      background: { color: { value: 'transparent' } },
      fullScreen: { enable: true, zIndex: 0 },
      particles: {
        number: { value: 150, density: { enable: true, value_area: 1000 } },
        color: { value: ['#fff7cc', '#e9f1ff', '#c7d6ff'] },
        shape: { type: 'circle' },
        opacity: { value: { min: 0.4, max: 1 }, animation: { enable: true, speed: 1.1, sync: false } },
        size: { value: { min: 1, max: 3 }, animation: { enable: true, speed: 0.55, sync: false } },
        links: { enable: true, distance: 130, color: '#b8c5ff', opacity: 0.24, width: 0.8 },
        move: {
          enable: true,
          speed: 0.2,
          direction: 'none',
          straight: false,
          outModes: { default: 'out' },
          random: true,
          drift: { enable: false, value: 0 },
          wobble: { enable: true, distance: 4, speed: 0.95 },
        },
      },
      emitters: [
        // ráfagas muy suaves de “twinklers” más brillantes
        {
          position: { x: 50, y: 30 },
          rate: { delay: 5, quantity: 2 },
          size: 0,
          particles: {
            move: { speed: 0.1, random: true },
            size: { value: { min: 1.5, max: 3.2 } },
            opacity: { value: 1, animation: { enable: true, speed: 1.6, minimumValue: 0.5 } },
            color: { value: '#fffbd1' },
            life: { duration: { sync: false, value: { min: 2, max: 6 } }, count: 0 },
          },
        },
        {
          position: { x: 80, y: 20 },
          rate: { delay: 6, quantity: 1 },
          size: 0,
          particles: {
            move: { speed: 0.12, random: true },
            size: { value: { min: 1.2, max: 2.6 } },
            opacity: { value: 1, animation: { enable: true, speed: 1.8, minimumValue: 0.4 } },
            color: { value: '#eaf4ff' },
            life: { duration: { sync: false, value: { min: 2, max: 6 } }, count: 0 },
          },
        },
      ],
      interactivity: { detectsOn: 'canvas', events: { resize: true, onHover: { enable: false }, onClick: { enable: false } } },
      detectRetina: true,
    };
  }, [isDark]);

  return <Particles id="tsparticles" init={particlesInit} options={particlesOptions} style={{ pointerEvents: 'none' }} />;
};

export default AnimatedBackground;
