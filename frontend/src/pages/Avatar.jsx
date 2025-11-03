import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';

export default function AvatarPage(){
  return (
  <DashboardLayout>
        <section className="mx-auto max-w-7xl px-3 sm:px-4">
          <div className="rounded-2xl border p-4 sm:p-6 md:p-8" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
            <h2 className="text-2xl sm:text-3xl font-bold">Mi Avatar</h2>
            <p className="mt-1 text-slate-600">Próximamente: personaliza tu compañero 3D.</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border h-64 flex items-center justify-center" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-color)', color: 'var(--text-color)', opacity: 0.8 }}>Visor 3D (placeholder)</div>
              <div className="rounded-xl border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                <h3 className="font-semibold">Opciones</h3>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button className="rounded-lg border py-2 text-sm hover:opacity-90" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>Color</button>
                  <button className="rounded-lg border py-2 text-sm hover:opacity-90" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>Accesorios</button>
                  <button className="rounded-lg border py-2 text-sm hover:opacity-90" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>Expresiones</button>
                  <button className="rounded-lg border py-2 text-sm hover:opacity-90" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>Guardar</button>
                </div>
              </div>
            </div>
          </div>
    </section>
  </DashboardLayout>
  );
}
