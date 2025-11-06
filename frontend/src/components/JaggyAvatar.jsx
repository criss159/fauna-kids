import React, { useEffect, useRef, useState } from 'react';
import jaggyaSrc from '../assets/avatars/jaggya.png';
import jaggybSrc from '../assets/avatars/jaggyb.png';

/**
 * JaggyAvatar - Avatar animado que cambia de expresión según el contexto
 * 
 * Expresiones disponibles:
 * jaggya.png (3 frames): [0] hablando (boca abierta), [1] neutral, [2] riendo
 * jaggyb.png (3 frames): [0] sorprendido, [1] enojado, [2] triste
 * 
 * Props:
 * - emotion: 'talking' | 'neutral' | 'happy' | 'surprised' | 'angry' | 'sad'
 * - width, height: tamaño en px
 * - className, style: estilos adicionales
 */

const EMOTION_MAP = {
  talking: { src: 'a', frame: 0 },
  neutral: { src: 'a', frame: 1 },
  happy: { src: 'a', frame: 2 },
  surprised: { src: 'b', frame: 0 },
  angry: { src: 'b', frame: 1 },
  sad: { src: 'b', frame: 2 },
};

export default function JaggyAvatar({ 
  emotion = 'neutral', 
  isSpeaking = false,
  width = 80, 
  height = 80, 
  className = '', 
  style = {} 
}) {
  const [, setFrameTrigger] = useState(null);
  const [talkCycle, setTalkCycle] = useState(0); // 0 = talking (boca abierta), 1 = neutral
  const [isLoaded, setIsLoaded] = useState(false); // Estado de carga
  const mounted = useRef(true);
  const canvasRef = useRef({});

  // Efecto de "hablar": alterna entre frame 0 (boca abierta) y frame 1 (neutral) de jaggya
  useEffect(() => {
    if (!isSpeaking) {
      setTalkCycle(0);
      return;
    }
    const interval = setInterval(() => {
      setTalkCycle(c => (c + 1) % 2);
    }, 300); // alterna cada 300ms
    return () => clearInterval(interval);
  }, [isSpeaking]);

  // Cargar y extraer frames de las sprites
  useEffect(() => {
    mounted.current = true;
    const sources = [
      { key: 'a', src: jaggyaSrc, cols: 3 },
      { key: 'b', src: jaggybSrc, cols: 3 },
    ];

    async function loadFrames() {
      const loaded = {};
      for (const { key, src, cols } of sources) {
        try {
          const img = await new Promise((res, rej) => {
            const i = new Image();
            i.crossOrigin = 'anonymous';
            i.onload = () => res(i);
            i.onerror = rej;
            i.src = src;
          });
          const fw = Math.floor(img.width / cols);
          const fh = img.height;
          const frames = [];
          for (let c = 0; c < cols; c++) {
            const canvas = document.createElement('canvas');
            canvas.width = fw;
            canvas.height = fh;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, c * fw, 0, fw, fh, 0, 0, fw, fh);
            frames.push(canvas.toDataURL('image/png'));
          }
          loaded[key] = frames;
        } catch (err) {
          console.warn(`JaggyAvatar: failed to load ${key}`, err);
        }
      }
      if (mounted.current) {
        canvasRef.current = loaded;
        setIsLoaded(true); // Marcar como cargado
        // force initial render
        setFrameTrigger(Date.now());
      }
    }

    loadFrames();
    return () => {
      mounted.current = false;
    };
  }, []);

  // Determinar qué frame mostrar
  let displayEmotion = emotion;
  if (isSpeaking) {
    displayEmotion = talkCycle === 0 ? 'talking' : 'neutral';
  }

  const emotionData = EMOTION_MAP[displayEmotion] || EMOTION_MAP.neutral;
  const frameSrc = canvasRef.current[emotionData.src]?.[emotionData.frame];

  const imgStyle = {
    width: `${width}px`,
    height: `${height}px`,
    imageRendering: 'auto',
    display: 'block',
    opacity: isLoaded ? 1 : 0, // Ocultar hasta que cargue
    transition: 'opacity 0.2s ease',
    ...style,
  };

  // Mostrar placeholder mientras carga
  if (!isLoaded) {
    return (
      <div
        className={className}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: `${width * 0.4}px`,
          fontWeight: 'bold',
          ...style,
        }}
      >
        J
      </div>
    );
  }

  return (
    <img
      src={frameSrc}
      alt="Jaggy"
      className={className}
      style={imgStyle}
      draggable={false}
    />
  );
}
