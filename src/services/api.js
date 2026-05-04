import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
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
    const status = error.response?.status;
    const currentPath = window.location.pathname;
   if (status === 401 && currentPath !== '/charge-etude/login' && currentPath !== '/') {
      localStorage.clear(); // Cleaner than removing items one by one
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('extractedData');
      if (currentPath.includes('charge-etude')) {
        window.location.href = '/charge-etude/login';
      } else {
        window.location.href = '/';
      }
    
    }
    return Promise.reject(error);
  }
);

export default API;