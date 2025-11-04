
/* eslint-env node */
/* global process */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno prefijadas con VITE_
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_API_URL || 'http://localhost:8000/api'
  // Extraer origen para proxy (sin sufijo /api)
  let proxyTarget
  try {
    const u = new URL(backendUrl)
    proxyTarget = `${u.protocol}//${u.host}`
  } catch {
    proxyTarget = 'http://localhost:8000'
  }
  return {
    plugins: [react(), tailwindcss()],
    build: {
      // Configuración para evitar problemas de chunking en producción
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['react', 'react-dom', 'react-router-dom'],
          }
        }
      },
      // Aumentar el límite de advertencia de tamaño de chunk
      chunkSizeWarningLimit: 1000,
    },
    server: {
      proxy: {
        // Redirigir llamadas a /api durante desarrollo al backend Django
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          // Mantener el prefijo /api en la solicitud al backend
          // Si tu backend no usa /api en la raíz, ajusta rewrite
          // rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
