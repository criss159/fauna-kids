import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { PATHS } from './paths';

export default function ProtectedRoute() {
  if (typeof window === 'undefined') return null;
  const isAuthed = Boolean(localStorage.getItem('fauna_nick'));
  return isAuthed ? <Outlet /> : <Navigate to={PATHS.LOGIN} replace />;
}
