import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage      from './pages/LoginPage';
import RegisterPage   from './pages/RegisterPage';
import AdminLoginPage from './pages/AdminloginPage';
import AuditForm from './components/Module1_Conformity/AuditForm';
import AdminDashboard  from './pages/admin/AdminDashboard';

// ✅ Add these 4 imports (adjust paths to match where you saved the files)
import ClientDashboard   from './pages/client/ClientDashboard';
import NotificationsPage from './pages/client/NotificationsPage';
import GuidePage         from './pages/client/GuidePage';
import ContactPage       from './pages/client/ContactPage';
import UserManagement from './pages/admin/UserManagement';

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
        <Route path="/client/dashboard" element={<AuditForm />} />
        <Route path="/admin/dashboard"  element={<AdminDashboard />}  />
        {/* ── Admin ── */}
        <Route path="/admin/dashboard"  element={<AdminDashboard />}  />
        <Route path="/admin/users"      element={<UserManagement />}  />  {/* ← ajoute cette ligne */}

        {/* ── ✅ New client pages ── */}
        <Route path="/client/profile"        element={<ClientDashboard />}   />
        <Route path="/client/notifications"  element={<NotificationsPage />} />
        <Route path="/client/guide"          element={<GuidePage />}         />
        <Route path="/client/contact"        element={<ContactPage />}       />

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;