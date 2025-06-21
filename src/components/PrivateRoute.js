// frontend/src/components/PrivateRoute.js

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Importa el hook de autenticación

const PrivateRoute = () => {
  const { isAuthenticated } = useAuth(); // Obtiene el estado de autenticación

  // Si el usuario está autenticado, renderiza los componentes hijos de la ruta.
  // De lo contrario, redirige a la página de login.
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
