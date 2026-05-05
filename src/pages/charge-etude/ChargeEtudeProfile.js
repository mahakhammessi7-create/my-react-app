import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; }

  .cep-root { min-height: 100vh; background: linear-gradient(135deg, #0f1c2e 0%, #1a2a42 100%); color: #e5eff5; }
  .cep-root::before { content: ''; position: fixed; inset: 0; background-image: radial-gradient(circle at 15% 10%, rgba(99,210,190,.08), transparent 30%), radial-gradient(circle at 85% 90%, rgba(139,92,246,.08), transparent 28%); pointer-events: none; }
  .cep-nav { position: sticky; top: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 16px 24px; background: rgba(15,28,46,.96); border-bottom: 1px solid rgba(255,255,255,.08); backdrop-filter: blur(12px); }
  .cep-logo { font-size: 20px; font-weight: 700; background: linear-gradient(135deg, #8b5cf6, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .cep-nav-links { display: flex; gap: 10px; align-items: center; }
  .cep-btn { border: 1px solid rgba(139,92,246,.3); background: rgba(139,92,246,.08); color: #cbd5e1; padding: 10px 16px; border-radius: 10px; cursor: pointer; font-weight: 600; transition: all .18s ease; }
  .cep-btn:hover { background: rgba(139,92,246,.16); }
  .cep-container { max-width: 1150px; margin: 0 auto; padding: 32px 24px 60px; position: relative; z-index: 1; }
  .cep-hero { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  .cep-card { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 20px; padding: 28px; backdrop-filter: blur(8px); }
  .cep-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; margin-bottom: 10px; }
  .cep-subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 20px; }
  .cep-field { margin-bottom: 16px; }
  .cep-label { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: .12em; color: #8ba6c2; margin-bottom: 6px; font-weight: 700; }
  .cep-value { font-size: 16px; color: #f8fbff; font-weight: 600; }
  .cep-pill { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 999px; font-size: 12px; background: rgba(99,210,190,.12); color: #8ee3cc; border: 1px solid rgba(99,210,190,.18); }
  .cep-list { display: grid; gap: 14px; }
  .cep-report { border-radius: 16px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); padding: 18px; }
  .cep-report-title { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
  .cep-report-meta { font-size: 12px; color: #94a3b8; margin-bottom: 10px; }
  .cep-report-status { font-size: 12px; font-weight: 700; color: #e5eff5; padding: 6px 10px; border-radius: 999px; background: rgba(59,130,246,.16); display:inline-flex; }
  .cep-error { color: #fca5a5; margin-top: 18px; }
  @media (max-width: 900px) { .cep-hero { grid-template-columns: 1fr; } }
`;

const isChargeEtudeRole = (role) => {
  const r = String(role || '').toLowerCase().trim();
  return r.includes('charge d\'étude') || r.includes('charge_etude') || r.includes('charge-etude') || r.includes('technical_review');
};

const normalizeReport = (report) => ({
  ...report,
  status: String(report.status || report.validation_status || report.workflow_status || 'déposé').toLowerCase(),
  assigned_to: report.assigned_to || report.responsable || report.assigned_charge || report.charge || report.assignee || '',
});

export default function ChargeEtudeProfile() {
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('user');
      if (!saved) { navigate('/charge-etude-login'); return; }
      const parsed = JSON.parse(saved);
      if (!parsed || !isChargeEtudeRole(parsed.role)) { navigate('/charge-etude-login'); return; }
      setUser(parsed);

      API.get('/reports/all')
        .then(res => {
          const rows = res.data?.data || res.data?.reports || res.data || [];
          const normalized = Array.isArray(rows) ? rows.map(normalizeReport) : [];
          setReports(normalized.filter(r => r.assigned_to === parsed.username || r.assigned_to === parsed.email));
        })
        .catch(() => setError('Impossible de récupérer les rapports assignés.'))
        .finally(() => setLoading(false));
    } catch (err) {
      console.error('Charge d\'étude profile init error', err);
      localStorage.removeItem('user');
      navigate('/charge-etude-login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('extractedData');
    navigate('/charge-etude-login');
  };

  if (!user) {
    return null;
  }

  const assignedCount = reports.length;
  const readyForReview = reports.filter(r => r.status === 'assigned' || r.status === 'deposé' || r.status === 'déposé').length;
  const verifiedCount = reports.filter(r => r.status === 'verified').length;

  return (
    <div className="cep-root">
      <style>{CSS}</style>
      <nav className="cep-nav">
        <div className="cep-logo">📋 Profil Chargé d'Étude</div>
        <div className="cep-nav-links">
          <button className="cep-btn" onClick={() => navigate('/charge-etude/dashboard')}>Tableau de bord</button>
          <button className="cep-btn" onClick={handleLogout}>Déconnexion</button>
        </div>
      </nav>
      <div className="cep-container">
        <div className="cep-hero">
          <div className="cep-card">
            <div className="cep-title">Bonjour {user.username}</div>
            <div className="cep-subtitle">Voici votre espace personnel et les rapports qui vous sont attribués.</div>
            <div className="cep-field">
              <span className="cep-label">Rôle</span>
              <div className="cep-value">{user.role || 'Chargé d\'étude'}</div>
            </div>
            {user.email && (
              <div className="cep-field">
                <span className="cep-label">Email</span>
                <div className="cep-value">{user.email}</div>
              </div>
            )}
            {user.phone && (
              <div className="cep-field">
                <span className="cep-label">Téléphone</span>
                <div className="cep-value">{user.phone}</div>
              </div>
            )}
            <div className="cep-field">
              <span className="cep-label">Rapports assignés</span>
              <div className="cep-pill">{assignedCount} rapport{assignedCount !== 1 ? 's' : ''}</div>
            </div>
            <div className="cep-field">
              <span className="cep-label">Prêts pour révision</span>
              <div className="cep-pill">{readyForReview} rapport{readyForReview !== 1 ? 's' : ''}</div>
            </div>
            <div className="cep-field">
              <span className="cep-label">Vérifiés</span>
              <div className="cep-pill">{verifiedCount} rapport{verifiedCount !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <div className="cep-card">
            <div className="cep-title">Actions rapides</div>
            <div className="cep-subtitle">Accédez rapidement à vos tâches et à votre profil.</div>
            <div className="cep-field">
              <button className="cep-btn" onClick={() => navigate('/charge-etude/dashboard')}>Voir mes rapports</button>
            </div>
            <div className="cep-field">
              <button className="cep-btn" onClick={handleLogout}>Me déconnecter</button>
            </div>
          </div>
        </div>

        <div className="cep-card">
          <div className="cep-title">Rapports assignés</div>
          <div className="cep-subtitle">Liste des rapports qui vous sont attribués pour analyse technique.</div>
          {loading ? (
            <div style={{ marginTop: 18, color: '#94a3b8' }}>Chargement des rapports...</div>
          ) : error ? (
            <div className="cep-error">{error}</div>
          ) : assignedCount === 0 ? (
            <div style={{ marginTop: 18, color: '#94a3b8' }}>Aucun rapport assigné pour le moment.</div>
          ) : (
            <div className="cep-list">
              {reports.map((report) => (
                <div key={report.id} className="cep-report">
                  <div className="cep-report-title">{report.organism_name || report.company_name || 'Rapport #' + report.id}</div>
                  <div className="cep-report-meta">Secteur : {report.organism_sector || report.sector || '—'} · Téléversé le {report.upload_date ? new Date(report.upload_date).toLocaleDateString('fr-FR') : '—'}</div>
                  <div className="cep-report-status">{(report.status || 'en attente').toUpperCase()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
