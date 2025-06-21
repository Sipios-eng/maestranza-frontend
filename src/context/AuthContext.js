// frontend/src/context/AuthContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [username, setUsername] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true); // <-- Nuevo estado: Indicador de carga de autenticación

  useEffect(() => {
    const checkAuth = async () => {
      console.log("[AuthContext] Iniciando verificación de autenticación...");
      const storedToken = localStorage.getItem('token');
      const storedRole = localStorage.getItem('userRole');
      const storedUsername = localStorage.getItem('username');

      if (storedToken && storedRole && storedUsername) {
        console.log("[AuthContext] Token y rol encontrados en localStorage.");
        setToken(storedToken);
        setUserRole(storedRole);
        setUsername(storedUsername);
        
        // Establecer el token para futuras peticiones de la API
        api.defaults.headers.common['Authorization'] = `Token ${storedToken}`;
        
        // Opcional: Validar el token con el backend aquí si es necesario
        // Por simplicidad, asumimos que si el token existe, es válido hasta que una API falle.
        setIsAuthenticated(true);
      } else {
        console.log("[AuthContext] No se encontraron token/rol en localStorage o están incompletos.");
        setIsAuthenticated(false);
        setToken(null);
        setUserRole(null);
        setUsername(null);
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        delete api.defaults.headers.common['Authorization'];
      }
      setIsAuthLoading(false); // <-- Termina la carga de autenticación
      console.log("[AuthContext] Verificación de autenticación finalizada.");
    };

    checkAuth();
  }, []); // Se ejecuta solo una vez al montar el componente

  const login = async (username, password) => {
    setIsAuthLoading(true); // <-- Inicia carga al intentar login
    try {
      const response = await api.post('api-token-auth/', { username, password });
      const { token: receivedToken } = response.data;
      
      api.defaults.headers.common['Authorization'] = `Token ${receivedToken}`;

      let userResponse;
      try {
        userResponse = await api.get(`api/users/?username=${username}`);
        const userData = userResponse.data.results && userResponse.data.results.length > 0
                         ? userResponse.data.results[0]
                         : null;

        if (userData && userData.role) {
            setUserRole(userData.role);
            localStorage.setItem('userRole', userData.role);
            console.log(`[AuthContext] Rol del usuario '${username}' establecido a: ${userData.role}`);
        } else {
            console.warn("[AuthContext] Rol del usuario no encontrado o datos de usuario vacíos. Asignando USUARIO_FINAL.");
            setUserRole('USUARIO_FINAL');
            localStorage.setItem('userRole', 'USUARIO_FINAL');
        }

      } catch (userFetchError) {
          console.error("[AuthContext] Error al obtener el rol del usuario:", userFetchError);
          setUserRole('USUARIO_FINAL');
          localStorage.setItem('userRole', 'USUARIO_FINAL');
      }

      setToken(receivedToken);
      setUsername(username);
      setIsAuthenticated(true);

      localStorage.setItem('token', receivedToken);
      localStorage.setItem('username', username);
      
      console.log("[AuthContext] Login exitoso.");
      return true;
    } catch (error) {
      console.error('[AuthContext] Error de inicio de sesión:', error);
      setIsAuthenticated(false);
      setToken(null);
      setUserRole(null);
      setUsername(null);
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('username');
      delete api.defaults.headers.common['Authorization'];
      return false;
    } finally {
        setIsAuthLoading(false); // <-- Termina carga después de login (éxito o fallo)
    }
  };

  const logout = () => {
    console.log("[AuthContext] Cerrando sesión.");
    setIsAuthenticated(false);
    setToken(null);
    setUserRole(null);
    setUsername(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    delete api.defaults.headers.common['Authorization'];
    // No necesitamos setIsAuthLoading aquí, ya que el usuario ya está saliendo.
  };

  const authContextValue = {
    isAuthenticated,
    token,
    userRole,
    username,
    login,
    logout,
    isAuthLoading, // <-- Exponemos el nuevo estado
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
