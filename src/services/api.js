// 📁 services/api.js (version améliorée avec gestion des erreurs et retry)

import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 120000,
  
});

// Intercepteur pour ajouter le token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs 401
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Tentative de rafraîchissement du token
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(
            'https://pfe-backend-9eec.onrender.com/api/auth/refresh',
            { refresh_token: refreshToken }
          );
          
          const { token } = response.data;
          localStorage.setItem('token', token);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return API(originalRequest);
        }
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

export default API;