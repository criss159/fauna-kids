import React from 'react';

export default function Loading(){
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-200" style={{ backdropFilter: 'blur(4px)' }}>
      {/* decorative colorful blob similar to Welcome */}
      <div className="absolute -left-8 -top-12 w-56 h-56 rounded-full bg-gradient-to-tr from-purple-400 to-pink-300 opacity-90 blur-3xl transform rotate-12" style={{ filter: 'saturate(120%)' }} />

      <div className="relative bg-white/80 dark:bg-black/50 rounded-2xl p-6 flex flex-col items-center gap-4 shadow-2xl border border-white/30 backdrop-blur-md" style={{ minWidth: 220 }}>
        <div className="w-36 h-36 flex items-center justify-center rounded-full overflow-hidden spin-slow bg-transparent">
          <img src="/logo.png" alt="Fauna Kids" className="w-32 h-32 object-contain" style={{ display: 'block' }} />
        </div>
        <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">Cargando…</div>
      </div>
    </div>
  );
}
