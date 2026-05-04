import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import TechnicalReviewInterface from '../../components/Module3_TechnicalReview/TechnicalReviewInterface';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .ce-dashboard {
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    background: linear-gradient(135deg, #0f1c2e 0%, #1a2a42 100%);
    position: relative;
    overflow-x: hidden;
  }

  .ce-dashboard::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px);
    background-size: 50px 50px;
    pointer-events: none;
    z-index: 0;
  }

  .ce-nav {
    position: sticky;
    top: 0;
    z-index: 1000;
    background: rgba(15, 28, 46, 0.95);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(139, 92, 246, 0.1);
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  }

  .ce-nav-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .ce-logo {
    font-size: 20px;
    font-weight: 700;
    background: linear-gradient(135deg, #8b5cf6, #6366f1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ce-title-nav {
    font-size: 14px;
    color: #a5b4fc;
    border-left: 2px solid rgba(139, 92, 246, 0.3);
    padding-left: 12px;
  }

  .ce-nav-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .ce-user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #cbd5e1;
  }

  .ce-logout-btn {
    padding: 8px 16px;
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 8px;
    color: #c4b5fd;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ce-logout-btn:hover {
    background: rgba(139, 92, 246, 0.2);
    border-color: rgba(139, 92, 246, 0.5);
  }

  .ce-container {
    position: relative;
    z-index: 1;
    max-width: 1400px;
    margin: 0 auto;
    padding: 32px 24px;
  }

  .ce-header {
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(139, 92, 246, 0.1);
  }

  .ce-header-title {
    font-size: 32px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .ce-header-subtitle {
    font-size: 14px;
    color: #94a3b8;
  }

  .ce-section {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(139, 92, 246, 0.1);
    border-radius: 16px;
    padding: 24px;
    backdrop-filter: blur(10px);
  }

  .ce-section-title {
    font-size: 18px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

export default function ChargeEtudeDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/charge-etude-login');
      return;
    }

    const u = JSON.parse(userData);
    const isChargeEtude = (role) =>
      String(role || '').toLowerCase().includes('charge d\'étude');

    if (!isChargeEtude(u.role)) {
      navigate('/');
      return;
    }

    setUser(u);
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('extractedData');
    navigate('/charge-etude-login');
  };

  if (loading) {
    return (
      <div className="ce-dashboard">
        <style>{CSS}</style>
        <div className="ce-nav">
          <div className="ce-logo">📋 Charge d'Étude</div>
        </div>
        <div className="ce-container" style={{ textAlign: 'center', paddingTop: '100px' }}>
          <p style={{ color: '#a5b4fc' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ce-dashboard">
      <style>{CSS}</style>

      {/* Navigation Bar */}
      <nav className="ce-nav">
        <div className="ce-nav-left">
          <div className="ce-logo">📋 Charge d'Étude</div>
          <div className="ce-title-nav">Analyse Technique des Audits</div>
        </div>
        <div className="ce-nav-right">
          <div className="ce-user-info">
            <span>👤 {user?.username}</span>
          </div>
          <button className="ce-logout-btn" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="ce-container">
        <div className="ce-header">
          <h1 className="ce-header-title">🔍 Analyse Technique des Audits</h1>
          <p className="ce-header-subtitle">
            Vérifiez et validez les données extraites des audits de conformité
          </p>
        </div>

        {/* Technical Review Section */}
        <div className="ce-section">
          <h2 className="ce-section-title">📊 Examen Technique</h2>
          <TechnicalReviewInterface />
        </div>
      </div>
    </div>
  );
}
