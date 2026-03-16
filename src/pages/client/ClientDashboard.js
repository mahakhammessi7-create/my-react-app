import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuditForm         from '../../components/Module1_Conformity/AuditForm';
import AnalysisDashboard from '../../components/Module2_Extraction/AnalysisDashboard';
import ClientProfile     from './ClientProfile';

/* ══════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  @keyframes cd-fadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes cd-glow   { 0%,100%{opacity:.25} 50%{opacity:.6} }

  .cd-root * { box-sizing:border-box; margin:0; padding:0; }
  .cd-root { font-family:'DM Sans',sans-serif; }

  .cd-nav-btn {
    display:flex; align-items:center; gap:7px;
    padding:9px 16px; border-radius:11px; border:none;
    background:transparent; color:#4a6a88;
    font-size:13px; font-family:'DM Sans',sans-serif; font-weight:500;
    cursor:pointer; transition:all .2s; white-space:nowrap;
    position:relative;
  }
  .cd-nav-btn:hover { background:rgba(255,255,255,.05); color:#8ab0c8; }
  .cd-nav-btn.active {
    background:rgba(99,210,190,.1);
    color:#63d2be; font-weight:700;
    box-shadow:inset 0 0 0 1px rgba(99,210,190,.2);
  }
  .cd-nav-btn.active::after {
    content:'';
    position:absolute; bottom:-1px; left:50%; transform:translateX(-50%);
    width:24px; height:2px; border-radius:99px;
    background:#63d2be; box-shadow:0 0 8px rgba(99,210,190,.5);
  }

  .cd-logout {
    padding:9px 18px; border-radius:11px;
    background:rgba(248,113,113,.1);
    color:#f87171; border:1px solid rgba(248,113,113,.2);
    font-size:13px; font-family:'DM Sans',sans-serif; font-weight:600;
    cursor:pointer; transition:all .2s;
  }
  .cd-logout:hover { background:rgba(248,113,113,.18); }
`;

function injectCdStyles() {
  if (document.getElementById('cd-styles')) return;
  const el = document.createElement('style');
  el.id = 'cd-styles'; el.textContent = CSS;
  document.head.appendChild(el);
}

/* ══════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════ */
export default function ClientDashboard() {
  const navigate = useNavigate();

  // ✅ FIX : useSearchParams → se re-synchronise AUTOMATIQUEMENT
  // quand navigate('/client/dashboard?tab=analyse') est appelé depuis un enfant
  // Avant : useEffect([], []) ne lisait l'URL qu'une seule fois au montage
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'upload';

  const [user, setUser] = useState(null);

  useEffect(() => {
    injectCdStyles();

    const userStr = localStorage.getItem('user');
    if (userStr) {
      try { setUser(JSON.parse(userStr)); }
      catch { navigate('/'); }
    } else {
      navigate('/');
    }

    return () => document.getElementById('cd-styles')?.remove();
  }, []);

  const goTo = (tab) => setSearchParams({ tab });

  const handleLogout = () => {
    localStorage.removeItem('extractedData');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const TABS = [
    { id:'upload',  icon:'📤', label:'Formulaire' },
    { id:'analyse', icon:'📊', label:'Analyse'    },
    { id:'profil',  icon:'👤', label:'Profil'     },
  ];

  const initials = user
    ? (user.username || user.company_name || 'U').charAt(0).toUpperCase()
    : 'U';

  /* ── render ── */
  return (
    <div className="cd-root" style={{ minHeight:'100vh', background:'#07111e', color:'#e2f0ff' }}>

      {/* ══ NAVBAR ══ */}
      <nav style={{
        background:'rgba(8,20,36,.92)',
        backdropFilter:'blur(16px)',
        borderBottom:'1px solid rgba(255,255,255,.06)',
        padding:'0 28px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        height:60, position:'sticky', top:0, zIndex:100,
        boxShadow:'0 4px 24px rgba(0,0,0,.35)',
      }}>

        {/* Brand */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, background:'linear-gradient(135deg,#0d5580,#1a7a6e)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, boxShadow:'0 0 0 1px rgba(99,210,190,.2)' }}>
            🏢
          </div>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color:'#d4e8ff', letterSpacing:'-.2px' }}>
            Espace Entreprise
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.05)', borderRadius:14, padding:'4px' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              className={`cd-nav-btn${activeTab === t.id ? ' active' : ''}`}
              onClick={() => goTo(t.id)}
            >
              <span style={{ fontSize:14 }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {/* User avatar */}
          {user && (
            <div style={{ display:'flex', alignItems:'center', gap:9, padding:'5px 12px', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:99 }}>
              <div style={{ width:26, height:26, background:'linear-gradient(135deg,#0d5580,#1a7a6e)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#e4f2ff', fontFamily:"'Syne',sans-serif" }}>
                {initials}
              </div>
              <span style={{ fontSize:12, color:'#4a6a88', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {user.company_name || user.username || user.email}
              </span>
            </div>
          )}
          <button className="cd-logout" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </nav>

      {/* ══ CONTENT ══ */}
      <div style={{ minHeight:'calc(100vh - 60px)' }}>
        {activeTab === 'upload'  && <AuditForm />}
        {activeTab === 'analyse' && <AnalysisDashboard />}
        {activeTab === 'profil'  && <ClientProfile />}
        {/* Fallback */}
        {!['upload','analyse','profil'].includes(activeTab) && <AuditForm />}
      </div>
    </div>
  );
}