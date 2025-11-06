import React, { useEffect, useRef, useState } from 'react';

/**
 * JaggyAnimator
 * - Accepts either `src` (string) with `cols`/`rows` OR `srcList` array of { src, cols, rows }
 * - If multiple sources are provided, frames are concatenated in order.
 * - If `alignFrames` is true, the component recenters each frame by centroid of alpha
 *   so the face doesn't 'saltar' entre emociones.
 */
export default function JaggyAnimator({
  src,
  srcList,
  cols = 3,
  rows = 1,
  interval = 600,
  width,
  height,
  className,
  style,
  alignFrames = true,
  padding = 12,
}){
  const [frames, setFrames] = useState([]);
  const [index, setIndex] = useState(0);
  const mounted = useRef(true);

  useEffect(()=>{
    mounted.current = true;
    const sources = [];
    if(srcList && Array.isArray(srcList) && srcList.length) {
      for(const s of srcList){
        sources.push({ src: s.src, cols: s.cols || cols, rows: s.rows || rows });
      }
    } else if(src){
      sources.push({ src, cols, rows });
    }

    let cancelled = false;

    async function loadAll(){
      try{
        // load images
        const imgs = await Promise.all(sources.map(o => {
          return new Promise((res, rej)=>{
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = ()=> res({ img, cols: o.cols, rows: o.rows });
            img.onerror = (e)=> rej(e);
            img.src = o.src;
          });
        }));

        // slice frames per source
        const rawFrameCanvases = [];
        for(const item of imgs){
          const { img, cols: c, rows: r } = item;
          const fw = Math.floor(img.width / c);
          const fh = Math.floor(img.height / r);
          const canvas = document.createElement('canvas');
          canvas.width = fw;
          canvas.height = fh;
          const ctx = canvas.getContext('2d');
          for(let rr=0; rr<r; rr++){
            for(let cc=0; cc<c; cc++){
              ctx.clearRect(0,0,fw,fh);
              ctx.drawImage(img, cc*fw, rr*fh, fw, fh, 0, 0, fw, fh);
              // clone canvas
              const clone = document.createElement('canvas');
              clone.width = fw; clone.height = fh;
              clone.getContext('2d').drawImage(canvas,0,0);
              rawFrameCanvases.push(clone);
            }
          }
        }

        if(cancelled || !mounted.current) return;

        // if no alignment requested, just export dataURLs
        if(!alignFrames){
          const data = rawFrameCanvases.map(c => c.toDataURL('image/png'));
          setFrames(data);
          setIndex(0);
          return;
        }

        // Compute centroid and bbox for each frame
        const meta = rawFrameCanvases.map(canvas => {
          const ctx = canvas.getContext('2d');
          const { width: w, height: h } = canvas;
          const imgd = ctx.getImageData(0,0,w,h);
          const data = imgd.data;
          let sumA = 0, sumX = 0, sumY = 0;
          let minX = w, minY = h, maxX = 0, maxY = 0;
          for(let y=0;y<h;y++){
            for(let x=0;x<w;x++){
              const idx = (y*w + x)*4 + 3; // alpha
              const a = data[idx];
              if(a>16){ // threshold small alpha noise
                sumA += a;
                sumX += x * a;
                sumY += y * a;
                if(x < minX) minX = x;
                if(y < minY) minY = y;
                if(x > maxX) maxX = x;
                if(y > maxY) maxY = y;
              }
            }
          }
          const centroid = sumA ? { x: sumX/sumA, y: sumY/sumA } : { x: w/2, y: h/2 };
          const bbox = (maxX >= minX && maxY >= minY) ? { left: minX, top: minY, right: maxX+1, bottom: maxY+1, width: (maxX-minX+1), height: (maxY-minY+1) } : { left:0, top:0, right:w, bottom:h, width:w, height:h };
          return { canvas, centroid, bbox };
        });

        // Compute global center (average centroid)
        const avg = meta.reduce((acc,m)=>{ acc.x += m.centroid.x; acc.y += m.centroid.y; return acc; }, {x:0,y:0});
        avg.x /= meta.length; avg.y /= meta.length;

        // Determine target canvas size: max bbox width/height plus padding
        const maxW = Math.max(...meta.map(m => m.bbox.width)) + padding*2;
        const maxH = Math.max(...meta.map(m => m.bbox.height)) + padding*2;
        const targetW = Math.max(...rawFrameCanvases.map(c=>c.width), maxW);
        const targetH = Math.max(...rawFrameCanvases.map(c=>c.height), maxH);

        const targetCenter = { x: Math.floor(targetW/2), y: Math.floor(targetH/2) };

        // For each frame, draw into target canvas so its centroid aligns to targetCenter
        const normalized = meta.map(m => {
          const t = document.createElement('canvas');
          t.width = targetW; t.height = targetH;
          const tx = t.getContext('2d');
          tx.clearRect(0,0,targetW,targetH);
          // compute offset so that m.centroid maps to targetCenter
          const offsetX = Math.round(targetCenter.x - m.centroid.x);
          const offsetY = Math.round(targetCenter.y - m.centroid.y);
          tx.drawImage(m.canvas, offsetX, offsetY);
          return t.toDataURL('image/png');
        });

        if(!mounted.current) return;
        setFrames(normalized);
        setIndex(0);
      }catch(err){
        console.warn('JaggyAnimator failed to prepare frames', err);
      }
    }

    loadAll();

    return ()=>{ cancelled = true; mounted.current = false; };
  }, [src, srcList, cols, rows, alignFrames, padding]);

  // animation timer
  useEffect(()=>{
    if(!frames || frames.length <= 1) return;
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(prefersReduced) return; // do not animate
    const t = setInterval(()=>{
      setIndex(i => (i+1) % frames.length);
    }, interval);
    return ()=> clearInterval(t);
  }, [frames, interval]);

  const imgSrc = frames && frames.length ? frames[index] : (src || (srcList && srcList[0] && srcList[0].src));

  const styleObj = { width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined, imageRendering: 'auto', display: 'block', ...style };

  return (
    <img
      src={imgSrc}
      alt="Jaggy"
      className={className}
      style={styleObj}
      draggable={false}
    />
  );
}
