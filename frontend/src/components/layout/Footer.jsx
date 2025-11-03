import React from 'react'

export default function Footer(){
  const year = new Date().getFullYear()
  return (
    <footer
      className="fk-footer relative z-40 border-t"
      style={{
    // Franja que toma el color del tema seleccionado
    // 1) Usa --footer-bg si existe; 2) si no, usa gradiente del fondo del tema (bg-start→bg-end); 3) si no, usa bg-surface
    background: 'var(--footer-bg, linear-gradient(180deg, var(--bg-start, var(--bg-surface)), var(--bg-end, var(--bg-surface))))',
    color: 'var(--footer-color, var(--text-color))',
        borderColor: 'transparent'
      }}
    >
  {/* Ola decorativa que recorta visualmente el borde superior del footer */}
  <div aria-hidden className="absolute -top-16 left-0 w-full overflow-hidden leading-none select-none pointer-events-none z-50">
        <svg
          className="block h-48 sm:h-56"
          viewBox="0 0 1200 180"
          preserveAspectRatio="none"
          style={{ marginLeft: '-36rem', width: 'calc(100% + 36rem)' }}
          shapeRendering="geometricPrecision"
        >
          {/* Ola con amplitud marcada y varias crestas visibles */}
          <path
            d="M0,-120
               C 180,-50 360,-150 540,-70
               C 720,10 900,-110 1080,-40
               C 1140,-20 1180,0 1200,20
               L1200,0 L0,0 Z"
            fill="var(--bg-page)"
          />
        </svg>
      </div>

      <div className="w-full px-0">
  <div className="mx-auto max-w-7xl px-3 sm:px-4 py-16 sm:py-20">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Fauna Kids" className="w-6 h-6 rounded" />
      <span className="font-semibold" style={{ color: 'inherit' }}>Fauna Kids</span>
      <span className="text-sm opacity-80" style={{ color: 'inherit' }}>© {year}</span>
          </div>
          <nav className="md:ml-auto">
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm" style={{ color: 'inherit' }}>
              <li><a className="footer-link hover:underline" href="#" onClick={e=>e.preventDefault()}>Sobre</a></li>
              <li><a className="footer-link hover:underline" href="#" onClick={e=>e.preventDefault()}>Contacto</a></li>
              <li><a className="footer-link hover:underline" href="#" onClick={e=>e.preventDefault()}>Privacidad</a></li>
              <li className="opacity-80">Hecho para niños 🐾</li>
            </ul>
          </nav>
        </div>
        </div>
      </div>
    </footer>
  )
}
