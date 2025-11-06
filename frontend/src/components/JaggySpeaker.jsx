import React, { useEffect, useRef, useState } from 'react';
import jaggyaSrc from '../assets/avatars/jaggya.png';
import jaggybSrc from '../assets/avatars/jaggyb.png';

// Heurística simple para detectar emoción a partir del texto
function detectEmotionFromText(text){
  if(!text) return 'neutral';
  const t = text.toLowerCase();
  if(/jaj|ja\b|😂|🤣|😂/.test(t)) return 'laugh';
  if(/wow|guau|¡wow|sorpresa|sorprend|oh|oh!|¡oh!|¡qué|qué sorpresa/.test(t)) return 'surprised';
  if(/triste|llor|lament|lo siento|pena|tristesa/.test(t)) return 'sad';
  if(/enoj|molest|asco|odiar|no me gusta|malo|malísimo/.test(t)) return 'angry';
  return 'neutral';
}

// Extrae frames de un spritesheet (cols x rows) y retorna array de dataURLs
async function extractFrames(src, cols=3, rows=1){
  return new Promise((resolve)=>{
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = ()=>{
      const fw = Math.floor(img.width / cols);
      const fh = Math.floor(img.height / rows);
      const canvas = document.createElement('canvas');
      canvas.width = fw; canvas.height = fh;
      const ctx = canvas.getContext('2d');
      const out = [];
      for(let r=0;r<rows;r++){
        for(let c=0;c<cols;c++){
          ctx.clearRect(0,0,fw,fh);
          ctx.drawImage(img, c*fw, r*fh, fw, fh, 0, 0, fw, fh);
          out.push(canvas.toDataURL('image/png'));
        }
      }
      resolve(out);
    };
    img.onerror = ()=> resolve([]);
    img.src = src;
  });
}

export default function JaggySpeaker({ messages = [], isSpeaking = false, size = 80 }){
  const [framesA, setFramesA] = useState([]); // jaggya: [talkOpen, neutral, laugh]
  const [framesB, setFramesB] = useState([]); // jaggyb: [surprised, angry, sad]
  const [currentSrc, setCurrentSrc] = useState(null);
  const talkTimer = useRef(null);

  // Load frames once
  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      const a = await extractFrames(jaggyaSrc, 3, 1);
      const b = await extractFrames(jaggybSrc, 3, 1);
      if(!mounted) return;
      setFramesA(a);
      setFramesB(b);
      // default neutral
      setCurrentSrc(a[1] || a[0] || b[0] || null);
    })();
    return ()=>{ mounted = false; if(talkTimer.current){ clearInterval(talkTimer.current); talkTimer.current = null; } };
  }, []);

  // Determine desired emotion from latest assistant message
  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
  const detected = detectEmotionFromText(lastAssistant?.text || '');

  useEffect(()=>{
    // If speaking, alternate between framesA[0] (open) and framesA[1] (neutral)
    if(isSpeaking && framesA.length >= 2){
      if(talkTimer.current) clearInterval(talkTimer.current);
      let toggle = false;
      // start with open mouth
      setCurrentSrc(framesA[0]);
      talkTimer.current = setInterval(()=>{
        toggle = !toggle;
        setCurrentSrc(toggle ? framesA[1] : framesA[0]);
      }, 220);
      return ()=>{ if(talkTimer.current){ clearInterval(talkTimer.current); talkTimer.current = null; } };
    } else {
      // not speaking: decide based on detected emotion
      if(talkTimer.current){ clearInterval(talkTimer.current); talkTimer.current = null; }
      if(detected === 'laugh' && framesA[2]){
        setCurrentSrc(framesA[2]);
      } else if(detected === 'surprised' && framesB[0]){
        setCurrentSrc(framesB[0]);
      } else if(detected === 'angry' && framesB[1]){
        setCurrentSrc(framesB[1]);
      } else if(detected === 'sad' && framesB[2]){
        setCurrentSrc(framesB[2]);
      } else {
        // default neutral
        setCurrentSrc(framesA[1] || framesA[0] || framesB[0] || null);
      }
    }
  }, [isSpeaking, detected, framesA, framesB]);

  return (
    <div style={{ width: size, height: size }} className="relative">
      {currentSrc ? (
        <img src={currentSrc} alt="Jaggy" style={{ width: size, height: size, objectFit: 'contain' }} draggable={false} />
      ) : (
        <div style={{ width: size, height: size, background: 'linear-gradient(90deg,#ffe7f6,#e6f5ff)', borderRadius: '9999px' }} />
      )}
    </div>
  );
}
