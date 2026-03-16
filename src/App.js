import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage      from './pages/LoginPage';
import RegisterPage   from './pages/RegisterPage';
import AdminLoginPage from './pages/AdminloginPage';
import ClientDashboard from './pages/client/ClientDashboard';
import AdminDashboard  from './pages/admin/AdminDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public ── */}
        <Route path="/"               element={<LoginPage />}       />
        <Route path="/register"       element={<RegisterPage />}    />

        {/* ── Admin login caché — URL secrète, non linkée ── */}
        <Route path="/secure-access"  element={<AdminLoginPage />}  />

        {/* ── Dashboards ── */}
        <Route path="/client/dashboard" element={<ClientDashboard />} />
        <Route path="/admin/dashboard"  element={<AdminDashboard />}  />

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;