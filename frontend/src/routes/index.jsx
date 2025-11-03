import React, { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { PATHS } from './paths';
import ProtectedRoute from './ProtectedRoute';
import NotFound from './NotFound';

const Login = lazy(()=> import('../pages/Login.jsx'));
const Dashboard = lazy(()=> import('../pages/Dashboard.jsx'));
const Explorer = lazy(()=> import('../pages/Explorer.jsx'));
const Profile = lazy(()=> import('../pages/Profile.jsx'));
const Settings = lazy(()=> import('../pages/Settings.jsx'));

const suspense = (node) => (
  <Suspense fallback={<div className="p-8">Cargando...</div>}>
    {node}
  </Suspense>
);

export const router = createBrowserRouter([
  { path: PATHS.ROOT, element: suspense(<Login />) },
  { path: PATHS.LOGIN, element: suspense(<Login />) },
  {
    element: <ProtectedRoute />,
    children: [
      { path: PATHS.DASHBOARD, element: suspense(<Dashboard />) },
      { path: PATHS.EXPLORAR, element: suspense(<Explorer />) },
      { path: PATHS.PERFIL, element: suspense(<Profile />) },
      { path: PATHS.CONFIGURACION, element: suspense(<Settings />) },
    ],
  },
  { path: PATHS.NOT_FOUND, element: <NotFound /> },
]);

export default router;
