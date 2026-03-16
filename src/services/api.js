import axios from 'axios';

const API = axios.create({
  baseURL: 'https://pfe-backend-9eec.onrender.com/api',
  timeout: 15000,
});

// ✅ Intercepteur — ajoute le token JWT à CHAQUE requête automatiquement
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur réponse — déconnexion auto si token expiré
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('extractedData');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default API;