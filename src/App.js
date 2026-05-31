import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage      from './pages/LoginPage';
import RegisterPage   from './pages/RegisterPage';
import UnifiedLoginPage from './pages/UnifiedLoginPage';


import AuditForm from './components/Module1_Conformity/AuditForm';
import AdminHub  from './pages/admin/AdminHub';
import ResponsableDashboard from './pages/responsable/ResponsableDashboard';
import ClientDashboard   from './pages/client/ClientDashboard';
import NotificationsPage from './pages/client/NotificationsPage';
import GuidePage         from './pages/client/GuidePage';
import ContactPage       from './pages/client/ContactPage';
import UserManagement from './pages/admin/UserManagement';
import ExpertManagement from './pages/admin/ExpertManagement';
import TechnicalReviewInterface from './components/Module3_TechnicalReview/TechnicalReviewInterface';
import ChargeEtudeDashboard from './pages/charge-etude/ChargeEtudeDashboard';
import ChargeEtudeProfile from './pages/charge-etude/ChargeEtudeProfile';

import DecideurDashboard  from './pages/decideur/DecideurDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public ── */}
        <Route path="/"        element={<LoginPage />}       />  {/* clients */}
        <Route path="/login"   element={<UnifiedLoginPage />} /> {/* membres ANCS */}
        <Route path="/register" element={<RegisterPage />}   />

        {/* ── Admin ── */}
        <Route path="/admin/dashboard"  element={<AdminHub />}         />
        <Route path="/admin/experts"    element={<ExpertManagement />} />
        <Route path="/admin/users"      element={<UserManagement />}   />

        {/* ── Responsable ── */}
        <Route path="/responsable/dashboard" element={<ResponsableDashboard />} />

        {/* ── Chargé d'Étude ── */}
        <Route path="/charge-etude/dashboard" element={<ChargeEtudeDashboard />} />
        <Route path="/charge-etude/profile"   element={<ChargeEtudeProfile />}   />

        {/* ── Décideur ── */}
        <Route path="/decideur/dashboard" element={<DecideurDashboard />} />

        {/* ── Client ── */}
        <Route path="/client/dashboard"     element={<AuditForm />}         />
        <Route path="/client/profile"       element={<ClientDashboard />}   />
        <Route path="/client/notifications" element={<NotificationsPage />} />
        <Route path="/client/guide"         element={<GuidePage />}         />
        <Route path="/client/contact"       element={<ContactPage />}       />

        {/* ── Autres ── */}
        <Route path="/technical-review" element={<TechnicalReviewInterface />} />

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
