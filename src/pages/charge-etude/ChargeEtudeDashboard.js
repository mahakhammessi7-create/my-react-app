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

  .ce-user-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: rgba(139, 92, 246, 0.15);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 20px;
    font-size: 12px;
  }

  .ce-user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #8b5cf6, #6366f1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 14px;
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
    cursor: pointer;
  }

  .ce-assignment-card:hover {
    border-color: rgba(139, 92, 246, 0.3);
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
  }

  .ce-assignment-card.selected {
    border-color: rgba(139, 92, 246, 0.5);
    background: rgba(139, 92, 246, 0.1);
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.2);
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

  .ce-status-in-progress {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.3);
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
    flex-wrap: wrap;
  }

  .ce-assignment-meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .ce-assignment-description {
    font-size: 13px;
    color: #cbd5e1;
    margin-bottom: 12px;
    line-height: 1.5;
  }

  .ce-assignment-actions {
    display: flex;
    gap: 12px;
    margin-top: 12px;
    flex-wrap: wrap;
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

  .ce-start-analysis-btn {
    padding: 8px 20px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ce-start-analysis-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }

  .ce-start-analysis-btn:disabled {
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

  .ce-toast.info {
    background: #3b82f6;
  }

  .ce-filter-tabs {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .ce-filter-tab {
    padding: 8px 16px;
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 8px;
    color: #c4b5fd;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ce-filter-tab:hover {
    background: rgba(139, 92, 246, 0.2);
  }

  .ce-filter-tab.active {
    background: linear-gradient(135deg, #8b5cf6, #6366f1);
    border-color: rgba(139, 92, 246, 0.8);
    color: white;
  }

  .ce-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .ce-stat-card {
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(139, 92, 246, 0.2);
    border-radius: 12px;
    padding: 16px;
    text-align: center;
  }

  .ce-stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #8b5cf6;
    margin-bottom: 4px;
  }

  .ce-stat-label {
    font-size: 12px;
    color: #94a3b8;
    font-weight: 500;
  }

  .ce-profile-section {
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(139, 92, 246, 0.2);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
  }

  .ce-profile-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
  }

  .ce-profile-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #8b5cf6, #6366f1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 18px;
  }

  .ce-profile-info h3 {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 4px;
  }

  .ce-profile-info p {
    font-size: 13px;
    color: #94a3b8;
  }

  .ce-security-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 6px;
    font-size: 11px;
    color: #34d399;
    font-weight: 600;
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

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  .ce-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;

export default function ChargeEtudeDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [notification, setNotification] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [analysisInProgress, setAnalysisInProgress] = useState(null);
  const navigate = useNavigate();

  // Callback pour les nouvelles assignations
  const handleNewAssignment = (report) => {
    setNotification({
      reportId: report.id,
      company: report.organism_name || report.company_name || 'Nouveau rapport',
      priority: report.priority || 'Normale'
    });
    
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==');
      audio.play().catch(() => {});
    } catch (e) {}
    
    setTimeout(() => setNotification(null), 5000);
  };

  // Hook pour les rapports assignés à ce chargé d'étude (filtré par user.id)
  const { 
    reports: assignedReports, 
    loading: reportsLoading, 
    validateReport: validateReportHook,
    rejectReport: rejectReportHook,
    refetch 
  } = useMyAssignedReports(user?.id, handleNewAssignment);

  // Hook pour les rapports en temps réel
  const { reports: realtimeReports, loading: realtimeLoading } = useReportsRealtime("assigné");

  // Hook pour l'assignation (pour le responsable)
  const { assignReport, fetchChargesEtude, chargesEtude } = useAssignReport();

  // Récupérer et valider les infos utilisateur
  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        navigate('/charge-etude-login');
        return;
      }

      const u = JSON.parse(userData);
      
      // Vérifier que c'est un chargé d'étude
      const isChargeEtude = (role) => {
        const r = String(role || '').toLowerCase().trim();
        return r.includes('charge d\'étude') || r.includes('charge_etude') || r.includes('charge-etude') || r.includes('technical_review');
      };

      if (!isChargeEtude(u.role)) {
        navigate('/');
        return;
      }

      // Vérifier que l'utilisateur a un ID valide
      if (!u.id) {
        console.error("User ID is missing");
        localStorage.removeItem('user');
        navigate('/charge-etude-login');
        return;
      }

      setUser(u);
console.log('👤 User connecté:', u);
console.log('🆔 user.id:', u.id, '| type:', typeof u.id);
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

  const showToast = (message, isError = false, isInfo = false) => {
    setToast({ message, isError, isInfo });
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
      showToast('Rapport rejeté avec succès !');
      refetch();
    } else {
      showToast(result.error || 'Erreur lors du rejet', true);
    }
  };

  // Fonction pour démarrer l'analyse
  const handleStartAnalysis = async (reportId) => {
    try {
      setAnalysisInProgress(reportId);
      showToast('Démarrage de l\'analyse...', false, true);
      
      // Appel API pour marquer le rapport comme "en cours d'analyse"
      const response = await API.put(`/reports/${reportId}/status`, {
        status: 'in_progress',
        assigned_to: user?.id // Vérifier que le rapport appartient à cet utilisateur
      });

      if (response.status === 200 || response.status === 204) {
        showToast('Analyse démarrée avec succès ! 🚀');
        
        setTimeout(() => {
          navigate(`/charge-etude/analyse/${reportId}`, {
            state: {
              report: assignedReports.find(r => r.id === reportId)
            }
          });
        }, 500);
      }
    } catch (err) {
      console.error("Erreur au démarrage de l'analyse:", err);
      showToast('Impossible de démarrer l\'analyse. Veuillez réessayer.', true);
    } finally {
      setAnalysisInProgress(null);
    }
  };

  // Filtrer les rapports selon le statut
  const filteredReports = assignedReports?.filter(report => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return report.status === 'pending' || !report.status;
    if (filterStatus === 'in_progress') return report.status === 'in_progress';
    if (filterStatus === 'verified') return report.status === 'verified';
    if (filterStatus === 'rejected') return report.status === 'rejected';
    return true;
  }) || [];

  // Calculer les statistiques
  const stats = {
    total: assignedReports?.length || 0,
    pending: assignedReports?.filter(r => r.status === 'pending' || !r.status).length || 0,
    inProgress: assignedReports?.filter(r => r.status === 'in_progress').length || 0,
    verified: assignedReports?.filter(r => r.status === 'verified').length || 0,
    rejected: assignedReports?.filter(r => r.status === 'rejected').length || 0
  };

  // Extraire les initiales du nom pour l'avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="ce-dashboard">
        <style>{CSS}</style>
        <div className="ce-loading">Chargement du tableau de bord...</div>
      </div>
    );
  }

  return (
    <div className="ce-dashboard">
      <style>{CSS}</style>

      {/* Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
          color: 'white',
          padding: '16px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
          zIndex: 1100,
          animation: 'slideIn 0.3s ease'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>📬 Nouveau rapport assigné</div>
          <div style={{ fontSize: '13px' }}>{notification.company}</div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`ce-toast ${toast.isError ? 'error' : toast.isInfo ? 'info' : ''}`}>
          {toast.message}
        </div>
      )}

      {/* Navigation */}
      <nav className="ce-nav">
        <div className="ce-nav-left">
          <div className="ce-logo">📋 Charge d'Étude</div>
          <div className="ce-title-nav">Analyse Technique des Audits</div>
        </div>
        <div className="ce-nav-right">
          <div className="ce-user-badge">
            <div className="ce-user-avatar">{getInitials(user?.full_name)}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{user?.full_name || user?.username}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{user?.email}</div>
            </div>
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
            Consultez vos rapports assignés et démarrez l'analyse de conformité
          </p>
        </div>

        {/* Profil utilisateur sécurisé */}
        <div className="ce-profile-section">
          <div className="ce-profile-header">
            <div className="ce-profile-avatar">{getInitials(user?.full_name)}</div>
            <div className="ce-profile-info">
              <h3>{user?.full_name || user?.username}</h3>
              <p>Email: {user?.email}</p>
              <p>Rôle: Chargé d'Étude</p>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span className="ce-security-badge">🔒 Profil sécurisé</span>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        {assignedReports && assignedReports.length > 0 && (
          <div className="ce-stats">
            <div className="ce-stat-card">
              <div className="ce-stat-value">{stats.total}</div>
              <div className="ce-stat-label">Rapports Total</div>
            </div>
            <div className="ce-stat-card">
              <div className="ce-stat-value">{stats.pending}</div>
              <div className="ce-stat-label">En Attente</div>
            </div>
            <div className="ce-stat-card">
              <div className="ce-stat-value">{stats.inProgress}</div>
              <div className="ce-stat-label">En Analyse</div>
            </div>
            <div className="ce-stat-card">
              <div className="ce-stat-value">{stats.verified}</div>
              <div className="ce-stat-label">Vérifiés</div>
            </div>
            <div className="ce-stat-card">
              <div className="ce-stat-value">{stats.rejected}</div>
              <div className="ce-stat-label">Rejetés</div>
            </div>
          </div>
        )}

        {/* Rapports assignés à moi */}
        <div className="ce-section">
          <h2 className="ce-section-title">📋 Mes Rapports Assignés</h2>
          
          {/* Filtres */}
          {assignedReports && assignedReports.length > 0 && (
            <div className="ce-filter-tabs">
              <button 
                className={`ce-filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                Tous ({stats.total})
              </button>
              <button 
                className={`ce-filter-tab ${filterStatus === 'pending' ? 'active' : ''}`}
                onClick={() => setFilterStatus('pending')}
              >
                En Attente ({stats.pending})
              </button>
              <button 
                className={`ce-filter-tab ${filterStatus === 'in_progress' ? 'active' : ''}`}
                onClick={() => setFilterStatus('in_progress')}
              >
                En Analyse ({stats.inProgress})
              </button>
              <button 
                className={`ce-filter-tab ${filterStatus === 'verified' ? 'active' : ''}`}
                onClick={() => setFilterStatus('verified')}
              >
                Vérifiés ({stats.verified})
              </button>
              <button 
                className={`ce-filter-tab ${filterStatus === 'rejected' ? 'active' : ''}`}
                onClick={() => setFilterStatus('rejected')}
              >
                Rejetés ({stats.rejected})
              </button>
            </div>
          )}
          
          {reportsLoading ? (
            <div className="ce-loading">Chargement de vos rapports assignés...</div>
          ) : filteredReports && filteredReports.length > 0 ? (
            <div className="ce-assignment-list">
              {filteredReports.map(report => (
                <div 
                  key={report.id} 
                  className={`ce-assignment-card ${selectedReport?.id === report.id ? 'selected' : ''}`}
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="ce-assignment-header">
                    <span className="ce-assignment-id">#{report.id}</span>
                    <span className={`ce-assignment-status ${
                      report.status === 'verified' ? 'ce-status-verified' :
                      report.status === 'rejected' ? 'ce-status-rejected' :
                      report.status === 'in_progress' ? 'ce-status-in-progress' :
                      'ce-status-pending'
                    }`}>
                      {report.status === 'verified' ? '✓ Vérifié' :
                       report.status === 'rejected' ? '✕ Rejeté' :
                       report.status === 'in_progress' ? '⚙ En Analyse' :
                       '⏳ En attente'}
                    </span>
                  </div>
                  <div className="ce-assignment-org">
                    {report.organism_name || report.company_name || 'Organisme'}
                  </div>
                  
                  {report.description && (
                    <div className="ce-assignment-description">
                      {report.description}
                    </div>
                  )}
                  
                  <div className="ce-assignment-meta">
                    <div className="ce-assignment-meta-item">
                      <span>📅</span>
                      <span>{new Date(report.created_at || report.upload_date).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="ce-assignment-meta-item">
                      <span>🎯</span>
                      <span>Priorité: {report.priority || 'Normale'}</span>
                    </div>
                    {report.audit_type && (
                      <div className="ce-assignment-meta-item">
                        <span>📊</span>
                        <span>Type: {report.audit_type}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="ce-assignment-actions">
                    {report.status !== 'verified' && report.status !== 'rejected' && report.status !== 'in_progress' && (
                      <button 
                        className="ce-start-analysis-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartAnalysis(report.id);
                        }}
                        disabled={analysisInProgress === report.id}
                      >
                        {analysisInProgress === report.id ? '⏳ Démarrage...' : '🚀 Démarrer l\'analyse'}
                      </button>
                    )}
                    
                    <button 
                      className="ce-validate-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleValidateReport(report.id);
                      }}
                      disabled={report.status === 'verified' || report.status === 'rejected'}
                    >
                      {report.status === 'verified' ? '✓ Déjà validé' : '✓ Valider le rapport'}
                    </button>
                    
                    <button 
                      className="ce-reject-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRejectReport(report.id);
                      }}
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
              <p>
                {filterStatus === 'all' 
                  ? 'Aucun rapport assigné pour le moment.' 
                  : `Aucun rapport avec le statut "${filterStatus}".`}
              </p>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>
                {filterStatus === 'all' && 'Les rapports vous seront assignés par le responsable.'}
              </p>
            </div>
          )}
        </div>

        {/* Section d'examen technique */}
        {selectedReport && (
          <div className="ce-section">
            <h2 className="ce-section-title">🔬 Examen Technique Détaillé - {selectedReport.organism_name || selectedReport.company_name}</h2>
            <TechnicalReviewInterface 
              report={selectedReport}
              onValidate={handleValidateReport}
              onReject={handleRejectReport}
              onStartAnalysis={handleStartAnalysis}
            />
          </div>
        )}
      </div>
    </div>
  );
}
