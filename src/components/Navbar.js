import { useState, useEffect, useRef } from 'react';
import { useNavigate }                 from 'react-router-dom';
import AuditForm                       from '../../components/Module1_Conformity/AuditForm';
import AnalysisDashboard               from '../../components/Module2_Extraction/AnalysisDashboard';
import ClientProfile                   from './ClientProfile';

/* ══════════════════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap');

  :root {
    --bg:        #060d18;
    --surface:   rgba(255,255,255,.032);
    --border:    rgba(255,255,255,.07);
    --teal:      #63d2be;
    --teal-dim:  rgba(99,210,190,.12);
    --red:       #f87171;
    --text:      #e2f0ff;
    --muted:     #3d607a;
    --nav-h:     68px;
  }

  /* ── Base ── */
  .cd-root { font-family:'DM Sans',sans-serif; color:var(--text); }
  .cd-root * { box-sizing:border-box; margin:0; padding:0; }

  /* ── Navbar ── */
  .cd-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    height: var(--nav-h);
    display: flex; align-items: center;
    padding: 0 32px;
    gap: 0;
  }

  /* Frosted glass background */
  .cd-nav::before {
    content: '';
    position: absolute; inset: 0;
    background: rgba(6,13,24,.78);
    backdrop-filter: blur(28px) saturate(1.4);
    -webkit-backdrop-filter: blur(28px) saturate(1.4);
    border-bottom: 1px solid rgba(99,210,190,.08);
    z-index: -1;
  }

  /* Subtle top accent line */
  .cd-nav::after {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent 0%, rgba(99,210,190,.5) 30%, rgba(99,210,190,.5) 70%, transparent 100%);
  }

  /* ── Logo zone ── */
  .cd-logo {
    display: flex; align-items: center; gap: 11px;
    margin-right: 40px; flex-shrink: 0; cursor: pointer;
    text-decoration: none;
  }

  .cd-logo-icon {
    width: 38px; height: 38px; border-radius: 11px;
    background: linear-gradient(145deg, #0e4d6e, #1a7a6e);
    display: flex; align-items: center; justify-content: center;
    font-size: 17px;
    box-shadow: 0 0 0 1px rgba(99,210,190,.25),
                0 4px 16px rgba(0,0,0,.5),
                inset 0 1px 0 rgba(255,255,255,.08);
    transition: transform .2s, box-shadow .2s;
  }
  .cd-logo:hover .cd-logo-icon {
    transform: rotate(-6deg) scale(1.05);
    box-shadow: 0 0 0 1px rgba(99,210,190,.4),
                0 6px 24px rgba(99,210,190,.15),
                inset 0 1px 0 rgba(255,255,255,.1);
  }

  .cd-logo-text { line-height: 1; }
  .cd-logo-name {
    font-family: 'Syne', sans-serif; font-weight: 800;
    font-size: 15px; color: #e4f2ff; letter-spacing: -.3px;
    display: block;
  }
  .cd-logo-sub {
    font-size: 9.5px; color: var(--muted); letter-spacing: 1.4px;
    text-transform: uppercase; display: block; margin-top: 2px;
  }

  /* ── Divider ── */
  .cd-divider {
    width: 1px; height: 24px;
    background: linear-gradient(to bottom, transparent, rgba(255,255,255,.1), transparent);
    margin: 0 24px; flex-shrink: 0;
  }

  /* ── Tabs container ── */
  .cd-tabs {
    display: flex; align-items: center; gap: 2px;
    flex: 1;
    background: rgba(255,255,255,.03);
    border: 1px solid rgba(255,255,255,.06);
    border-radius: 13px;
    padding: 4px;
    max-width: 340px;
  }

  /* ── Tab button ── */
  .cd-tab {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 8px 14px; border-radius: 10px;
    background: transparent; border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    color: var(--muted);
    transition: color .18s, background .18s;
    white-space: nowrap; position: relative;
  }
  .cd-tab:hover { color: #8ab0c8; background: rgba(255,255,255,.04); }

  .cd-tab.active {
    background: linear-gradient(135deg, rgba(99,210,190,.16), rgba(99,210,190,.08));
    color: var(--teal);
    font-weight: 700;
    box-shadow: 0 0 0 1px rgba(99,210,190,.2),
                0 2px 12px rgba(99,210,190,.08),
                inset 0 1px 0 rgba(99,210,190,.1);
  }

  .cd-tab-icon { font-size: 15px; transition: transform .2s; }
  .cd-tab:hover .cd-tab-icon { transform: translateY(-1px); }
  .cd-tab.active .cd-tab-icon { filter: drop-shadow(0 0 4px rgba(99,210,190,.5)); }

  /* ── Right side ── */
  .cd-right {
    display: flex; align-items: center; gap: 10px;
    margin-left: auto; flex-shrink: 0;
  }

  /* ── User badge ── */
  .cd-user {
    display: flex; align-items: center; gap: 10px;
    padding: 6px 14px 6px 8px;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 40px;
    cursor: default; transition: border-color .2s;
  }
  .cd-user:hover { border-color: rgba(99,210,190,.2); }

  .cd-avatar {
    width: 30px; height: 30px; border-radius: 50%;
    background: linear-gradient(145deg, #0e4d6e, #1a7a6e);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-weight: 800;
    font-size: 12px; color: white; flex-shrink: 0;
    box-shadow: 0 0 0 2px rgba(99,210,190,.25);
    position: relative;
  }
  .cd-avatar-dot {
    position: absolute; bottom: 0; right: 0;
    width: 8px; height: 8px; border-radius: 50%;
    background: #4ade80;
    border: 2px solid var(--bg);
    box-shadow: 0 0 6px #4ade8077;
  }

  .cd-user-info { line-height: 1; }
  .cd-user-name {
    font-size: 12px; font-weight: 600; color: #c8dff4; display: block;
    max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .cd-user-role {
    font-size: 10px; color: var(--muted); display: block; margin-top: 2px;
    letter-spacing: .3px;
  }

  /* ── Notification dot ── */
  .cd-notif {
    width: 36px; height: 36px; border-radius: 10px;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.07);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 16px; position: relative;
    transition: background .2s, border-color .2s;
  }
  .cd-notif:hover { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.12); }
  .cd-notif-badge {
    position: absolute; top: 6px; right: 6px;
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--teal); border: 1.5px solid var(--bg);
    animation: cd-pulse 2s ease-in-out infinite;
  }

  /* ── Logout ── */
  .cd-logout {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 10px;
    background: rgba(248,113,113,.07);
    border: 1px solid rgba(248,113,113,.15);
    color: #f87171; font-family: 'DM Sans', sans-serif;
    font-size: 12px; font-weight: 600; cursor: pointer;
    transition: background .2s, border-color .2s, transform .15s;
    letter-spacing: .2px;
  }
  .cd-logout:hover {
    background: rgba(248,113,113,.15);
    border-color: rgba(248,113,113,.3);
    transform: translateY(-1px);
  }

  /* ── Page content offset ── */
  .cd-content { padding-top: var(--nav-h); min-height: 100vh; background: var(--bg); }

  /* ── Active tab indicator pill (bottom of nav) ── */
  .cd-indicator {
    position: absolute; bottom: -1px;
    height: 2px; border-radius: 99px;
    background: linear-gradient(90deg, transparent, var(--teal), transparent);
    transition: left .3s cubic-bezier(.22,1,.36,1), width .3s cubic-bezier(.22,1,.36,1);
    pointer-events: none;
  }

  @keyframes cd-pulse {
    0%,100% { opacity: 1; transform: scale(1); }
    50%      { opacity: .5; transform: scale(.8); }
  }

  @keyframes cd-slideIn {
    from { opacity:0; transform:translateY(-8px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .cd-nav { animation: cd-slideIn .4s cubic-bezier(.22,1,.36,1) both; }
`;

function injectStyles() {
  if (document.getElementById('cd-styles')) return;
  const el = document.createElement('style');
  el.id = 'cd-styles';
  el.textContent = CSS;
  document.head.appendChild(el);
}

const TABS = [
  { key: 'upload',  icon: '📤', label: 'Formulaire' },
  { key: 'analyse', icon: '📊', label: 'Analyse'    },
  { key: 'profil',  icon: '👤', label: 'Profil'     },
];

/* ══════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════ */
export default function ClientDashboard() {
  const [activeSection, setActiveSection] = useState(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    return tab || 'upload';
  });
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    injectStyles();
    return () => document.getElementById('cd-styles')?.remove();
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) { navigate('/'); return; }
    setUser(JSON.parse(userStr));
  }, [navigate]);

  useEffect(() => {
    const onPop = () => {
      const tab = new URLSearchParams(window.location.search).get('tab');
      setActiveSection(tab || 'upload');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigateTo = (section) => {
    setActiveSection(section);
    window.history.pushState({}, '', `/client/dashboard?tab=${section}`);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'analyse': return <AnalysisDashboard />;
      case 'profil':  return <ClientProfile />;
      default:        return <AuditForm />;
    }
  };

  const initial  = (user?.company_name || user?.username || 'E').charAt(0).toUpperCase();
  const userName = user?.company_name || user?.username || 'Entreprise';
  const userSub  = user?.sector || user?.email || 'Client';

  return (
    <div className="cd-root" style={{ background: '#060d18' }}>

      {/* ══ NAVBAR ══ */}
      <nav className="cd-nav">

        {/* Logo */}
        <div className="cd-logo" onClick={() => navigateTo('upload')}>
          <div className="cd-logo-icon">🏛️</div>
          <div className="cd-logo-text">
            <span className="cd-logo-name">ANCS</span>
            <span className="cd-logo-sub">Espace Entreprise</span>
          </div>
        </div>

        <div className="cd-divider" />

        {/* Tabs */}
        <div className="cd-tabs">
          {TABS.map(({ key, icon, label }) => (
            <button
              key={key}
              className={`cd-tab${activeSection === key ? ' active' : ''}`}
              onClick={() => navigateTo(key)}
            >
              <span className="cd-tab-icon">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Right */}
        <div className="cd-right">

          {/* Notification */}
          <div className="cd-notif" title="Notifications">
            🔔
            <div className="cd-notif-badge" />
          </div>

          {/* User badge */}
          {user && (
            <div className="cd-user">
              <div className="cd-avatar">
                {initial}
                <div className="cd-avatar-dot" />
              </div>
              <div className="cd-user-info">
                <span className="cd-user-name">{userName}</span>
                <span className="cd-user-role">{userSub}</span>
              </div>
            </div>
          )}

          {/* Logout */}
          <button className="cd-logout" onClick={handleLogout}>
            <span style={{ fontSize: 13 }}>🚪</span>
            Déconnexion
          </button>
        </div>
      </nav>

      {/* ══ CONTENT ══ */}
      <div className="cd-content">
        {renderContent()}
      </div>
    </div>
  );
}