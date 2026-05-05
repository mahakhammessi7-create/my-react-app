import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage      from './pages/LoginPage';
import RegisterPage   from './pages/RegisterPage';
import AdminLoginPage from './pages/AdminloginPage';
import ChargeEtudeLoginPage from './pages/ChargeEtudeLoginPage';
import ResponsableLoginPage from './pages/ResponsableLoginPage';
import AuditForm from './components/Module1_Conformity/AuditForm';
import AdminDashboard  from './pages/admin/AdminDashboard';
import ResponsableDashboard from './pages/responsable/ResponsableDashboard';
import ClientDashboard   from './pages/client/ClientDashboard';
import NotificationsPage from './pages/client/NotificationsPage';
import GuidePage         from './pages/client/GuidePage';
import ContactPage       from './pages/client/ContactPage';
import UserManagement from './pages/admin/UserManagement';
import TechnicalReviewInterface from './components/Module3_TechnicalReview/TechnicalReviewInterface';
import ChargeEtudeDashboard from './pages/charge-etude/ChargeEtudeDashboard';
import ChargeEtudeProfile from './pages/charge-etude/ChargeEtudeProfile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public ── */}
        <Route path="/"               element={<LoginPage />}       />
        <Route path="/register"       element={<RegisterPage />}    />
        {/* ── Admin login caché — URL secrète, non linkée ── */}
        <Route path="/secure-access"  element={<AdminLoginPage />}  />
        {/* ── Charge d'Étude login ── */}
        <Route path="/charge-etude-login"  element={<ChargeEtudeLoginPage />}  />
        <Route path="/responsable-login"   element={<ResponsableLoginPage />}   />
        {/* ── Dashboards ── */}
        <Route path="/client/dashboard" element={<AuditForm />} />
        <Route path="/admin/dashboard"  element={<AdminDashboard />}  />
        <Route path="/responsable/dashboard" element={<ResponsableDashboard />} />
        {/* ── Admin ── */}
        <Route path="/admin/users"      element={<UserManagement />}  />
        {/* ── ✅ New client pages ── */}
        <Route path="/client/profile"        element={<ClientDashboard />}   />
        <Route path="/client/notifications"  element={<NotificationsPage />} />
        <Route path="/client/guide"          element={<GuidePage />}         />
        <Route path="/client/contact"        element={<ContactPage />}       />
        {/* ── Charge d'Étude Dashboard ── */}
        <Route path="/charge-etude/dashboard"  element={<ChargeEtudeDashboard />} />
        <Route path="/charge-etude/profile"    element={<ChargeEtudeProfile />} />
        {/* ── Technical Review Interface ── */}
        <Route path="/technical-review"      element={<TechnicalReviewInterface />} />
        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
