import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import JaggyAnimator from '../components/JaggyAnimator';
import jaggyaSrc from '../assets/avatars/jaggya.png';
import jaggybSrc from '../assets/avatars/jaggyb.png';

export default function Welcome(){
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-200 text-slate-900">
      <Navbar />

      <main className="flex-1 w-full flex items-center justify-center py-6 sm:py-12 px-4 sm:px-6">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
          {/* Hero izquierdo: texto grande y llamado a la acción */}
          <section className="p-4 sm:p-6 bg-white/70 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-xl border border-white/40">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-3 sm:mb-4" style={{ textShadow: '0 6px 18px rgba(124,58,237,0.15)' }}>
              ¡Hola explorador!
            </h1>
            <p className="text-base sm:text-lg md:text-xl mb-4 sm:mb-6 opacity-95">Descubre animales, juega y crea historias mágicas con ayuda de la IA. Seguro y pensado para niños.</p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 rounded-full font-semibold text-white shadow-lg transform hover:-translate-y-0.5 transition-all text-center"
                style={{ background: 'linear-gradient(90deg,#ff6ec7,#7c3aed)' }}
              >
                Iniciar sesión
              </button>

              <button
                onClick={() => navigate('/explorar')}
                className="px-5 py-3 rounded-full font-semibold bg-white/90 border border-indigo-200 shadow-sm hover:scale-[1.02] transition-transform text-center"
              >
                Explorar sin registro
              </button>
            </div>

            <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div className="relative p-3 bg-gradient-to-r from-yellow-200 to-rose-100 rounded-xl flex items-start gap-2 sm:gap-3">
                <div className="text-xl sm:text-2xl flex-shrink-0">🦁</div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm sm:text-base">Juegos y misiones <span className="ml-1 sm:ml-2 text-xs px-2 py-0.5 rounded-full bg-white/80 font-medium">Próximamente</span></div>
                  <div className="text-xs sm:text-sm opacity-80">Próximamente añadiremos retos cortos y misiones. (En esta versión todavía no están disponibles).</div>
                </div>
              </div>
              <div className="relative p-3 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-xl flex items-start gap-2 sm:gap-3">
                <div className="text-xl sm:text-2xl flex-shrink-0">🎨</div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm sm:text-base">Crea y comparte <span className="ml-1 sm:ml-2 text-xs px-2 py-0.5 rounded-full bg-white/80 font-medium">Próximamente</span></div>
                  <div className="text-xs sm:text-sm opacity-80">Próximamente podrás personalizar tu avatar y compartir colecciones. Actualmente la edición de avatar no está habilitada.</div>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-lime-100 to-green-100 rounded-xl flex items-start gap-2 sm:gap-3">
                <div className="text-xl sm:text-2xl flex-shrink-0">📚</div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm sm:text-base">Cuentos con voz</div>
                  <div className="text-xs sm:text-sm opacity-80">Escucha historias narradas en voz natural.</div>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl flex items-start gap-2 sm:gap-3">
                <div className="text-xl sm:text-2xl flex-shrink-0">🤖</div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm sm:text-base">Asistente divertido</div>
                  <div className="text-xs sm:text-sm opacity-80">Pregunta sobre animales y recibe respuestas amigables.</div>
                </div>
              </div>
            </div>
          </section>

          {/* Hero derecho: ilustración grande y animada (Jaggy animator) */}
          <aside className="p-4 sm:p-6 flex items-center justify-center order-first lg:order-last">
            <div className="relative w-full max-w-xs sm:max-w-md">
              {/* Colorful blob + smiling animal SVG */}
              <div className="absolute -left-8 sm:-left-12 -top-6 sm:-top-10 w-56 sm:w-72 h-56 sm:h-72 rounded-full bg-gradient-to-tr from-purple-400 to-pink-300 opacity-90 blur-3xl transform rotate-12 animate-blob" style={{ filter: 'saturate(120%)' }} />

              <div className="relative z-10 flex items-center justify-center">
                <JaggyAnimator
                  srcList={[{ src: jaggyaSrc, cols: 3, rows: 1 }, { src: jaggybSrc, cols: 3, rows: 1 }]}
                  interval={550}
                  width={200}
                  height={200}
                  className="sm:w-64 sm:h-64"
                  alignFrames={true}
                  padding={12}
                />
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="py-4 sm:py-6 text-center text-xs sm:text-sm text-slate-700/80">
        <div className="max-w-4xl mx-auto px-4">Creado con cariño — Contenido supervisado para niños. <span className="ml-2">🧡</span></div>
      </footer>

      <style>{`
        .animate-blob { animation: blob 8s infinite; }
        @keyframes blob { 0% { transform: translate(0,0) scale(1) rotate(12deg); } 33% { transform: translate(8px,-6px) scale(1.03) rotate(14deg); } 66% { transform: translate(-6px,6px) scale(.99) rotate(10deg); } 100% { transform: translate(0,0) scale(1) rotate(12deg);} }
        .animate-bounce-slow { animation: bounce 3s infinite; }
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      `}</style>
    </div>
  );
}
