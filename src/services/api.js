// frontend/src/services/api.js

import axios from 'axios';

// Crea una instancia de Axios con la URL base de tu API de Django
// CAMBIO CLAVE AQUÍ: La baseURL ahora apunta a la raíz del servidor Django
// Esto hace que 'api-token-auth/' sea accesible directamente desde la raíz
// y 'api/' sea el prefijo para el resto de tus endpoints DRF.
const api = axios.create({
  baseURL: 'https://sipios.pythonanywhere.com/', // La raíz de tu servidor Django
});

// Interceptor para añadir el token de autenticación a cada solicitud
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Obtiene el token del almacenamiento local
    if (token) {
      // Asegúrate de que el token se añade correctamente al encabezado de autorización
      // Esto es crucial para las solicitudes a los endpoints protegidos por DRF.
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Exporta la instancia de Axios para usarla en tus servicios
export default api;
