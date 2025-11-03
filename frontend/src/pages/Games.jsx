import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';

const GAME_CARDS = [
  { id: 'memoria', title: 'Memoria Animal', desc: 'Encuentra pares de animales.', emoji: '🧠' },
  { id: 'habitat', title: '¿Dónde vive?', desc: 'Asocia animal con su hábitat.', emoji: '🏞️' },
  { id: 'sonidos', title: 'Sonidos', desc: 'Adivina el animal por su sonido.', emoji: '🔊' },
];

export default function GamesPage(){
  return (
  <DashboardLayout>
    <section className="mx-auto max-w-7xl px-3 sm:px-4">
          <div className="rounded-2xl border p-4 sm:p-6 md:p-8" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
            <h2 className="text-2xl sm:text-3xl font-bold">Jugar</h2>
            <p className="mt-1 text-slate-600">Mini-juegos para reforzar lo aprendido.</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {GAME_CARDS.map(g => (
                <button key={g.id} className="text-left rounded-2xl border p-4 hover:-translate-y-0.5 hover:shadow-sm transition" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                  <div className="text-3xl">{g.emoji}</div>
                  <h3 className="mt-2 font-semibold">{g.title}</h3>
                  <p className="text-sm text-slate-600">{g.desc}</p>
                </button>
              ))}
            </div>
          </div>
    </section>
  </DashboardLayout>
  );
}
