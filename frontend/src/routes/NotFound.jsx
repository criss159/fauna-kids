import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from './paths';

export default function NotFound(){
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-5xl font-bold mb-4">404</h1>
      <p className="text-gray-600 mb-6">Página no encontrada</p>
      <Link className="text-purple-600 underline" to={PATHS.LOGIN}>Volver al inicio</Link>
    </div>
  );
}
