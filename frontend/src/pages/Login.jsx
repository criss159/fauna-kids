import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import '../styles/Login.css';
import PublicLayout from '../components/layout/PublicLayout.jsx';
import JaggyAvatar from '../components/JaggyAvatar';
import FloatingParticles from '../components/layout/FloatingParticles';
import { loginWithGoogle, createGuestSession } from '../services/auth.service';

/*
  Archivo: src/pages/login/index.jsx
  Propósito: componente de la página de Login para Fauna Kids.
  - Permite al usuario ingresar un "apodo" o usar Google Sign-In.
  - Incluye un botón "Entrar sin correo (modo invitado)" que es
    interactivo pero exige que el usuario escriba un apodo antes
    de permitir la navegación al dashboard.
  Notas sobre accesibilidad y comportamiento:
  - Se usan atributos ARIA (aria-invalid, aria-describedby) para
    comunicar errores del campo nombre/apodo.
  - La integración con Google usa @react-oauth/google para el botón.
*/

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function LoginContent() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // guestEntry: handler para el botón "modo invitado".
  // Comportamiento: el botón puede ser pulsado siempre, pero
  // solo navega a /dashboard si el usuario ha escrito un apodo.
  // Si no hay apodo, muestra una advertencia y marca el input en rojo.
  const guestEntry = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    // Validar que el usuario haya escrito un apodo
    if (!name || !name.trim()) {
      setError('Por favor ingresa un apodo o nombre');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Crear sesión de invitado en el backend
      await createGuestSession(name.trim());
      
      // Guardar el apodo también en localStorage para compatibilidad
      localStorage.setItem('fauna_nick', name.trim());
      
      // Redirigir al dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Error al crear sesión de invitado:', err);
      setError('Hubo un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // submit: handler del formulario principal (envío con apodo)
  // - valida que exista un nombre/apodo
  // - lo guarda en localStorage bajo la clave 'fauna_nick'
  // - redirige al dashboard
  const submit = (e) => {
    e.preventDefault();
    guestEntry(e);
  };

  // handleGoogleSuccess: callback cuando el login con Google es exitoso
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      
      // Decodificar el JWT de Google para obtener la información del usuario
      const credential = credentialResponse.credential;
      const decoded = JSON.parse(atob(credential.split('.')[1]));
      
      // Enviar al backend para autenticación
      const response = await loginWithGoogle(decoded);
      
      // Guardar el nick para compatibilidad
      if (response.user && response.user.display_name) {
        localStorage.setItem('fauna_nick', response.user.display_name);
      }
      
      // Forzar actualización completa de la página para que todos los componentes se actualicen
      window.location.href = '/dashboard';
    } catch (err) {
      setError(`Error: ${err.message || 'No se pudo iniciar sesión con Google'}`);
    } finally {
      setLoading(false);
    }
  };

  // handleGoogleError: callback cuando falla el login con Google
  const handleGoogleError = () => {
    console.error('Google Login falló');
    setError('⚠️ Error de configuración de Google. Por favor, usa el modo invitado mientras se soluciona.');
  };


  return (
    <PublicLayout>
      <FloatingParticles />
      
      {/* Botón Volver */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-30 flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        style={{ 
          background: 'var(--bg-surface)',
          color: 'var(--text-color)',
          border: '1px solid var(--border-color)'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        <span className="font-medium">Volver</span>
      </button>

      <div className="min-h-screen flex items-center justify-center px-4 login-page" style={{ position: 'relative', zIndex: 10 }}>
        <div className="shadow-2xl rounded-3xl max-w-5xl w-full flex flex-col md:flex-row overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
          <div className="md:w-1/2 flex items-center justify-center p-8 md:p-12 bg-gradient-to-br from-purple-400 via-pink-300 to-yellow-200">
            <div className="flex flex-col items-center gap-4">
              <JaggyAvatar emotion="happy" width={220} height={220} />
              <p className="text-purple-900 font-bold text-2xl">¡Hola! Soy Jaggy</p>
            </div>
          </div>

        <form onSubmit={submit} className="md:w-1/2 p-8 md:p-10 space-y-6">
          <h2 className="text-3xl font-bold text-center" style={{ color: '#9333ea' }}>¡Bienvenido a Fauna Kids!</h2>
          <p className="text-center" style={{ color: 'var(--text-color)', opacity: 0.7 }}>Explora la naturaleza con tu nuevo amigo</p>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>Tu nombre o apodo</label>
            <input
              id="nickname"
              value={name}
              onChange={e => { setName(e.target.value); if(error) setError(''); }}
              type="text"
              placeholder="Ej. DinoFan, Sofi, Leo"
              aria-invalid={!!error}
              aria-describedby={error ? 'login-error' : undefined}
              className={`mt-1 w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition ${error ? 'input-error' : ''}`}
              style={{
                background: 'var(--bg-page)',
                color: 'var(--text-color)',
                border: `1px solid ${error ? '#ef4444' : 'var(--border-color)'}`
              }}
            />
            {error && <p id="login-error" className="text-sm text-red-500 mt-2">{error}</p>}
          </div>

          <div className="flex justify-center py-2">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
            />
          </div>

          <div className="text-center" style={{ color: 'var(--text-color)', opacity: 0.5 }}>— o —</div>
          <div className="flex justify-center">
            <button 
              type="button" 
              onClick={guestEntry} 
              className="mt-2 guest-btn"
              disabled={loading}
            >
              <span className="guest-icon" aria-hidden>🐾</span>
              <span className="guest-label">
                {loading ? 'Cargando...' : 'Entrar sin correo'}
              </span>
              <small className="guest-sub">(modo invitado)</small>
            </button>
          </div>
          {/* Región accesible para errores/advertencias courteously announced */}
          <div aria-live="polite" className="sr-only" />

          <p className="text-xs text-center pt-4" style={{ color: 'var(--text-color)', opacity: 0.4 }}>Fauna Kids © 2025</p>
        </form>
      </div>
      </div>
    </PublicLayout>
  );
}

export default function Login() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LoginContent />
    </GoogleOAuthProvider>
  );
}
