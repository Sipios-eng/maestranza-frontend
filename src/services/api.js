// frontend/src/services/api.js

import axios from 'axios';

const api = axios.create({
  baseURL: 'https://Sipios.pythonanywhere.com/', // pa online
  //baseURL: 'http://127.0.0.1:8000/', // pa local
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;