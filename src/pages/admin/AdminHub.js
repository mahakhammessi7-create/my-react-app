import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  @keyframes hub-fade   { from{opacity:0} to{opacity:1} }
  @keyframes hub-up     { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes hub-scale  { from{transform:scale(.95);opacity:0} to{transform:scale(1);opacity:1} }
  @keyframes hub-glow   { 0%,100%{box-shadow:0 0 20px rgba(248,113,113,.2)} 50%{box-shadow:0 0 40px rgba(248,113,113,.4)} }

  .hub-root * { box-sizing:border-box; margin:0; padding:0; }
  .hub-root {
    font-family:'DM Sans',sans-serif;
    min-height:100vh; background:#070d16;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    position:relative; overflow:hidden; animation:hub-fade .4s ease;
    padding:20px;
  }

  .hub-root::before {
    content:''; position:absolute; inset:0;
    background-image:
      linear-gradient(rgba(248,113,113,.015) 1px, transparent 1px),
      linear-gradient(90deg, rgba(248,113,113,.015) 1px, transparent 1px);
    background-size:50px 50px; pointer-events:none;
  }

  .hub-container {
    position:relative; z-index:10;
    max-width:900px; width:100%;
  }

  .hub-header {
    text-align:center; margin-bottom:60px; animation:hub-up .5s ease;
  }

  .hub-title {
    font-family:'Syne',sans-serif;
    font-size:42px; font-weight:800; color:#e4f2ff;
    margin-bottom:12px; letter-spacing:-.5px;
  }

  .hub-subtitle {
    font-size:15px; color:#4a6a88; font-weight:500;
    letter-spacing:.3px;
  }

  .hub-grid {
    display:grid; grid-template-columns:1fr 1fr; gap:32px;
    margin-bottom:40px;
  }

  @media(max-width:768px) {
    .hub-grid { grid-template-columns:1fr; gap:24px; }
    .hub-title { font-size:32px; }
  }

  .hub-card {
    position:relative;
    background:rgba(255,255,255,.022);
    border:1px solid rgba(248,113,113,.12);
    border-radius:20px; padding:40px 32px;
    cursor:pointer; transition:all .3s cubic-bezier(.22,1,.36,1);
    animation:hub-scale .5s ease;
    overflow:hidden;
    display:flex; flex-direction:column; gap:20px;
    backdrop-filter:blur(14px);
    box-shadow:0 8px 32px rgba(0,0,0,.3);
  }

  .hub-card::before {
    content:''; position:absolute; inset:0;
    background:linear-gradient(135deg,rgba(248,113,113,.05),transparent);
    opacity:0; transition:opacity .3s;
    pointer-events:none;
  }

  .hub-card:hover {
    border-color:rgba(248,113,113,.25);
    background:rgba(255,255,255,.035);
    transform:translateY(-8px);
    box-shadow:0 20px 60px rgba(248,113,113,.15), 0 0 0 1px rgba(248,113,113,.1);
  }

  .hub-card:hover::before { opacity:1; }

  .hub-icon {
    font-size:48px; line-height:1;
    animation:hub-scale .6s ease;
  }

  .hub-card-title {
    font-family:'Syne',sans-serif;
    font-size:24px; font-weight:700; color:#e4f2ff;
    letter-spacing:-.3px;
  }

  .hub-card-desc {
    font-size:14px; color:#3d607a; line-height:1.6;
    font-weight:500;
  }

  .hub-card-stats {
    display:flex; gap:16px; margin-top:8px;
    padding-top:16px; border-top:1px solid rgba(255,255,255,.05);
  }

  .hub-stat-item {
    flex:1;
  }

  .hub-stat-label {
    font-size:11px; color:#2a4a62; text-transform:uppercase;
    letter-spacing:.4px; font-weight:600; margin-bottom:4px;
  }

  .hub-stat-value {
    font-size:20px; font-weight:700; color:#f87171;
    font-family:'Syne',sans-serif;
  }

  .hub-footer {
    display:flex; align-items:center; justify-content:space-between;
    padding-top:20px; border-top:1px solid rgba(255,255,255,.05);
    animation:hub-up .6s ease;
  }

  .hub-user-info {
    display:flex; align-items:center; gap:12px;
  }

  .hub-avatar {
    width:40px; height:40px; border-radius:50%;
    background:linear-gradient(135deg,#f87171,#ef4444);
    display:flex; align-items:center; justify-content:center;
    color:#fff; font-weight:700; font-size:16px;
  }

  .hub-user-text {
    display:flex; flex-direction:column;
  }

  .hub-user-name {
    font-size:14px; font-weight:600; color:#e4f2ff;
  }

  .hub-user-role {
    font-size:12px; color:#3d607a; font-weight:500;
  }

  .hub-logout {
    padding:10px 20px; border-radius:10px;
    background:rgba(248,113,113,.1); color:#f87171;
    border:1px solid rgba(248,113,113,.2);
    font-size:13px; font-family:'DM Sans',sans-serif; font-weight:600;
    cursor:pointer; transition:all .2s;
  }

  .hub-logout:hover {
    background:rgba(248,113,113,.2);
    box-shadow:0 4px 12px rgba(248,113,113,.15);
  }

  .hub-loading {
    display:flex; align-items:center; justify-content:center;
    gap:12px; color:#4a6a88; font-size:14px;
  }

  .hub-spinner {
    width:20px; height:20px; border:2px solid rgba(248,113,113,.2);
    border-top-color:#f87171; border-radius:50%;
    animation:hub-spin .8s linear infinite;
  }

  @keyframes hub-spin { to{transform:rotate(360deg)} }
`;

function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('hub-styles')) return;
  const el = document.createElement('style');
  el.id = 'hub-styles';
  el.textContent = CSS;
  document.head.appendChild(el);
}

export default function AdminHub() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ users: 0, experts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    injectStyles();
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/secure-access');
      return;
    }

    try {
      const u = JSON.parse(userData);
      const isAdminUser = (role) => {
        const r = String(role || '').toLowerCase().trim();
        return r === 'admin' || r === 'administrateur';
      };
      if (!isAdminUser(u.role)) {
        navigate('/');
        return;
      }
      setUser(u);
    } catch {
      navigate('/secure-access');
      return;
    }

    // Fetch stats
    const fetchStats = async () => {
      try {
        const res = await API.get('/users');
        const allUsers = res.data?.data || res.data || [];
        const experts = allUsers.filter(u => u.role === 'expert_auditeur').length;
        const adminUsers = allUsers.filter(
          u => u.role !== 'expert_auditeur'
        ).length;
        setStats({ users: adminUsers, experts });
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/secure-access');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="hub-root">
      <style>{CSS}</style>

      <div className="hub-container">
        <div className="hub-header">
          <h1 className="hub-title">Centre d'Administration</h1>
          <p className="hub-subtitle">Gérez les utilisateurs et les experts de la plateforme ANCS</p>
        </div>

        {loading ? (
          <div className="hub-loading">
            <div className="hub-spinner" />
            Chargement des données...
          </div>
        ) : (
          <div className="hub-grid">
            {/* Gestion des Utilisateurs Admin */}
            <div
              className="hub-card"
              onClick={() => navigate('/admin/users')}
              style={{ animationDelay: '0.1s' }}
            >
              <div className="hub-icon">👥</div>
              <div>
                <h2 className="hub-card-title">Gestion du Personnel ANCS</h2>
                <p className="hub-card-desc">
                  Gérez les administrateurs, responsables, décideurs et chargés d'étude de la plateforme.
                </p>
              </div>
              <div className="hub-card-stats">
                <div className="hub-stat-item">
                  <div className="hub-stat-label">Utilisateurs</div>
                  <div className="hub-stat-value">{stats.users}</div>
                </div>
                <div className="hub-stat-item">
                  <div className="hub-stat-label">Statut</div>
                  <div className="hub-stat-value" style={{ color: '#4ade80' }}>Actif</div>
                </div>
              </div>
            </div>

            {/* Gestion des Experts */}
            <div
              className="hub-card"
              onClick={() => navigate('/admin/experts')}
              style={{ animationDelay: '0.2s' }}
            >
              <div className="hub-icon">🎓</div>
              <div>
                <h2 className="hub-card-title">Gestion des Auditeurs Externes</h2>
                <p className="hub-card-desc">
                  Gérez les experts auditeurs habilités à effectuer les audits de conformité.
                </p>
              </div>
              <div className="hub-card-stats">
                <div className="hub-stat-item">
                  <div className="hub-stat-label">Experts</div>
                  <div className="hub-stat-value">{stats.experts}</div>
                </div>
                <div className="hub-stat-item">
                  <div className="hub-stat-label">Statut</div>
                  <div className="hub-stat-value" style={{ color: '#4ade80' }}>Actif</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="hub-footer">
          <div className="hub-user-info">
            <div className="hub-avatar">{getInitials(user?.full_name || user?.username)}</div>
            <div className="hub-user-text">
              <div className="hub-user-name">{user?.full_name || user?.username || 'Administrateur'}</div>
              <div className="hub-user-role">Administrateur</div>
            </div>
          </div>
          <button className="hub-logout" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}
