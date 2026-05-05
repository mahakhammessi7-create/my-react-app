import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import TechnicalReviewInterface from '../../components/Module3_TechnicalReview/TechnicalReviewInterface';
import { useMyAssignedReports } from '../../hooks/useMyAssignedReports';
import { useReportsRealtime } from '../../hooks/useReportsRealtime';
import { useAssignReport } from '../../hooks/useAssignReport';

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
    margin-bottom: 24px;
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

  /* Assignment List Styles */
  .ce-assignment-list {
    display: grid;
    gap: 16px;
    margin-top: 16px;
  }

  .ce-assignment-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(139, 92, 246, 0.15);
    border-radius: 12px;
    padding: 16px;
    transition: all 0.2s;
  }

  .ce-assignment-card:hover {
    border-color: rgba(139, 92, 246, 0.3);
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
  }

  .ce-assignment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .ce-assignment-id {
    font-size: 12px;
    color: #94a3b8;
    font-weight: 600;
  }

  .ce-assignment-status {
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .ce-status-pending {
    background: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  .ce-status-verified {
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .ce-status-rejected {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .ce-assignment-org {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 8px;
  }

  .ce-assignment-meta {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: #94a3b8;
    margin-bottom: 12px;
  }

  .ce-assignment-actions {
    display: flex;
    gap: 12px;
    margin-top: 12px;
  }

  .ce-validate-btn {
    padding: 8px 20px;
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ce-validate-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .ce-validate-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .ce-reject-btn {
    padding: 8px 20px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    color: #f87171;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ce-reject-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.5);
  }

  .ce-empty-state {
    text-align: center;
    padding: 48px;
    color: #94a3b8;
  }

  .ce-loading {
    text-align: center;
    padding: 48px;
    color: #a5b4fc;
  }

  .ce-toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    padding: 12px 20px;
    border-radius: 8px;
    background: #10b981;
    color: white;
    font-size: 14px;
    font-weight: 500;
    z-index: 1100;
    animation: slideIn 0.3s ease;
  }

  .ce-toast.error {
    background: #ef4444;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

export default function ChargeEtudeDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  // Hook pour les rapports assignés à ce chargé d'étude
  const { 
    reports: assignedReports, 
    loading: reportsLoading, 
    validateReport: validateReportHook,
    rejectReport: rejectReportHook,
    refetch 
  } = useMyAssignedReports(user?.id);

  // Hook pour les rapports en temps réel
  const { reports: realtimeReports, loading: realtimeLoading } = useReportsRealtime("assigné");

  // Hook pour l'assignation (pour le responsable)
  const { assignReport, fetchChargesEtude, chargesEtude } = useAssignReport();

  // Récupérer les infos utilisateur
  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        navigate('/charge-etude-login');
        return;
      }

      const u = JSON.parse(userData);
      const isChargeEtude = (role) => {
        const r = String(role || '').toLowerCase().trim();
        return r.includes('charge d\'étude') || r.includes('charge_etude') || r.includes('charge-etude') || r.includes('technical_review');
      };

      if (!isChargeEtude(u.role)) {
        navigate('/');
        return;
      }

      setUser(u);
      
      // Charger la liste des chargés d'étude (pour le responsable)
      fetchChargesEtude();
    } catch (err) {
      console.error("Dashboard init error:", err);
      localStorage.removeItem('user');
      navigate('/charge-etude-login');
    } finally {
      setLoading(false);
    }
  }, [navigate, fetchChargesEtude]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('extractedData');
    navigate('/charge-etude-login');
  };

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const handleValidateReport = async (reportId) => {
    const result = await validateReportHook(reportId);
    if (result.success) {
      showToast('Rapport validé avec succès !');
      refetch();
    } else {
      showToast(result.error || 'Erreur lors de la validation', true);
    }
  };

  const handleRejectReport = async (reportId) => {
    const result = await rejectReportHook(reportId);
    if (result.success) {
      showToast('Rapport rejeté', false);
      refetch();
    } else {
      showToast(result.error || 'Erreur lors du rejet', true);
    }
  };

  // Fonction d'assignation (pour la vue responsable)
  const handleAssign = async (reportId, chargeId) => {
    const { success, error } = await assignReport(reportId, chargeId);
    if (success) {
      showToast('Rapport assigné avec succès !');
      refetch();
    } else {
      showToast(error || 'Erreur lors de l\'assignation', true);
    }
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

      {/* Toast Notification */}
      {toast && (
        <div className={`ce-toast ${toast.isError ? 'error' : ''}`}>
          {toast.message}
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="ce-nav">
        <div className="ce-nav-left">
          <div className="ce-logo">📋 Charge d'Étude</div>
          <div className="ce-title-nav">Analyse Technique des Audits</div>
        </div>
        <div className="ce-nav-right">
          <div className="ce-user-info">
            <span>👤 {user?.username || user?.full_name || user?.email}</span>
          </div>
          <button className="ce-logout-btn" onClick={() => navigate('/charge-etude/profile')}>
            Mon profil
          </button>
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

        {/* Rapports assignés à moi */}
        <div className="ce-section">
          <h2 className="ce-section-title">📋 Mes Rapports Assignés</h2>
          
          {reportsLoading ? (
            <div className="ce-loading">Chargement des rapports...</div>
          ) : assignedReports && assignedReports.length > 0 ? (
            <div className="ce-assignment-list">
              {assignedReports.map(report => (
                <div key={report.id} className="ce-assignment-card">
                  <div className="ce-assignment-header">
                    <span className="ce-assignment-id">#{report.id}</span>
                    <span className={`ce-assignment-status ${
                      report.status === 'verified' ? 'ce-status-verified' :
                      report.status === 'rejected' ? 'ce-status-rejected' : 
                      'ce-status-pending'
                    }`}>
                      {report.status === 'verified' ? '✓ Vérifié' :
                       report.status === 'rejected' ? '✕ Rejeté' : 
                       '⏳ En attente'}
                    </span>
                  </div>
                  <div className="ce-assignment-org">
                    {report.organism_name || report.company_name || 'Organisme'}
                  </div>
                  <div className="ce-assignment-meta">
                    <span>📅 {new Date(report.created_at || report.upload_date).toLocaleDateString('fr-FR')}</span>
                    <span>🎯 Priorité: {report.priority || 'Normale'}</span>
                  </div>
                  <div className="ce-assignment-actions">
                    <button 
                      className="ce-validate-btn"
                      onClick={() => handleValidateReport(report.id)}
                      disabled={report.status === 'verified' || report.status === 'rejected'}
                    >
                      {report.status === 'verified' ? '✓ Déjà validé' : '✓ Valider le rapport'}
                    </button>
                    <button 
                      className="ce-reject-btn"
                      onClick={() => handleRejectReport(report.id)}
                      disabled={report.status === 'verified' || report.status === 'rejected'}
                    >
                      {report.status === 'rejected' ? '✕ Rejeté' : '✕ Rejeter'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ce-empty-state">
              <p>Aucun rapport assigné pour le moment.</p>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>Les rapports vous seront assignés par le responsable.</p>
            </div>
          )}
        </div>

        {/* Section d'examen technique */}
        <div className="ce-section">
          <h2 className="ce-section-title">🔬 Examen Technique Détaillé</h2>
          <TechnicalReviewInterface 
            reports={assignedReports}
            onValidate={handleValidateReport}
            onReject={handleRejectReport}
          />
        </div>

        {/* Section des rapports en temps réel (optionnel - pour le responsable) */}
        {user?.role === 'responsable' && (
          <div className="ce-section">
            <h2 className="ce-section-title">🔄 Rapports en temps réel</h2>
            <div className="ce-assignment-list">
              {realtimeReports.map(report => (
                <div key={report.id} className="ce-assignment-card">
                  <div className="ce-assignment-header">
                    <span className="ce-assignment-id">#{report.id}</span>
                  </div>
                  <div className="ce-assignment-org">
                    {report.organism_name || report.company_name}
                  </div>
                  <div className="ce-assignment-actions">
                    <select 
                      onChange={(e) => handleAssign(report.id, e.target.value)}
                      defaultValue=""
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(139,92,246,0.3)',
                        color: '#fff',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Assigner à...</option>
                      {chargesEtude.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}