/* ─────────────────────────────────────────────
   ClientDashboard.jsx  — drop-in replacement
   Adds nav links: Notifications, Guide, Contacter
   keeping 100% original style
───────────────────────────────────────────── */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const SECTEURS = ["Finance", "Santé", "Administration", "Énergie", "Industrie", "Télécoms"];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  @keyframes fadeUp     { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulseRing  { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(1.5);opacity:0} }
  @keyframes floatDot   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes rotateSlow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes glowPulse  { 0%,100%{opacity:.4} 50%{opacity:.8} }

  .cp-root { font-family:'DM Sans',sans-serif; box-sizing:border-box; }
  .cp-root * { box-sizing:border-box; margin:0; padding:0; }

  .cp-anim { animation:fadeUp .55s ease both; }
  .cp-anim:nth-child(1){animation-delay:.05s}
  .cp-anim:nth-child(2){animation-delay:.12s}
  .cp-anim:nth-child(3){animation-delay:.19s}
  .cp-anim:nth-child(4){animation-delay:.26s}
  .cp-anim:nth-child(5){animation-delay:.33s}

  /* ── NAV LINK ── */
  .cp-nav-link {
    display:flex; align-items:center; gap:6px;
    padding:8px 14px; border-radius:10px; border:none;
    background:transparent; color:#3d607a;
    font-size:13px; font-family:'DM Sans',sans-serif; font-weight:500;
    cursor:pointer; transition:all .2s; white-space:nowrap;
    text-decoration:none; position:relative;
  }
  .cp-nav-link:hover { background:rgba(255,255,255,.05); color:#8ab0c8; }
  .cp-nav-link.active {
    background:rgba(99,210,190,.1); color:#63d2be;
    box-shadow:inset 0 0 0 1px rgba(99,210,190,.2);
  }
  .cp-nav-link.active::after {
    content:''; position:absolute; bottom:-1px; left:50%; transform:translateX(-50%);
    width:20px; height:2px; border-radius:99px;
    background:#63d2be; box-shadow:0 0 8px rgba(99,210,190,.5);
  }

  /* ── NOTIF BADGE ── */
  .cp-notif-badge {
    min-width:16px; height:16px; border-radius:99px; padding:0 4px;
    background:#f87171; color:#fff; font-size:9px; font-weight:800;
    display:flex; align-items:center; justify-content:center;
  }

  .cp-stat-card { transition:transform .25s ease, box-shadow .25s ease; }
  .cp-stat-card:hover { transform:translateY(-6px) scale(1.03); box-shadow:0 24px 56px rgba(0,0,0,.5) !important; }

  .cp-rapport-row { transition:background .2s, transform .2s; }
  .cp-rapport-row:hover { background:rgba(255,255,255,.05) !important; transform:translateX(4px); }

  .cp-edit-input {
    width:100%; background:rgba(255,255,255,.055);
    border:1px solid rgba(99,210,190,.3); border-radius:10px;
    padding:10px 14px; font-size:14px; font-family:'DM Sans',sans-serif;
    color:#d4e8ff; outline:none; transition:border-color .2s,box-shadow .2s;
  }
  .cp-edit-input:focus { border-color:#63d2be; box-shadow:0 0 0 3px rgba(99,210,190,.15); }

  .cp-edit-select {
    width:100%; background:rgba(10,22,40,.95);
    border:1px solid rgba(99,210,190,.3); border-radius:10px;
    padding:10px 14px; font-size:14px; font-family:'DM Sans',sans-serif;
    color:#d4e8ff; outline:none; cursor:pointer;
  }

  .cp-btn-primary {
    background:linear-gradient(135deg,#63d2be,#2eb8a0);
    color:#071520; border:none; padding:11px 26px; border-radius:12px;
    font-size:14px; font-family:'DM Sans',sans-serif; font-weight:700;
    cursor:pointer; transition:filter .2s,transform .15s; letter-spacing:.3px;
  }
  .cp-btn-primary:hover { filter:brightness(1.1); transform:translateY(-2px); }

  .cp-btn-ghost {
    background:rgba(255,255,255,.07); color:#a0b4cc;
    border:1px solid rgba(255,255,255,.12); padding:11px 20px;
    border-radius:12px; font-size:14px; font-family:'DM Sans',sans-serif;
    cursor:pointer; transition:background .2s;
  }
  .cp-btn-ghost:hover { background:rgba(255,255,255,.13); }

  .cp-btn-modify {
    background:rgba(255,255,255,.07); color:#d4e8ff;
    border:1px solid rgba(255,255,255,.13); padding:10px 22px;
    border-radius:12px; font-size:14px; font-family:'DM Sans',sans-serif;
    font-weight:600; cursor:pointer; transition:background .2s,border-color .2s;
    display:flex; align-items:center; gap:8px;
  }
  .cp-btn-modify:hover { background:rgba(99,210,190,.1); border-color:rgba(99,210,190,.35); }

  .cp-btn-danger {
    background:rgba(239,68,68,.1); color:#f87171;
    border:1px solid rgba(239,68,68,.22); padding:11px 24px;
    border-radius:12px; font-size:14px; font-family:'DM Sans',sans-serif;
    font-weight:600; cursor:pointer; transition:background .2s;
  }
  .cp-btn-danger:hover { background:rgba(239,68,68,.2); }

  .cp-avatar-ring::after {
    content:''; position:absolute; inset:-7px; border-radius:50%;
    border:2px solid rgba(99,210,190,.45);
    animation:pulseRing 2.4s ease-out infinite;
  }

  .cp-hex-bg {
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zm0-6l22-13V19L28 6 6 19v28L28 60z' fill='%23ffffff' fill-opacity='0.022'/%3E%3C/svg%3E");
  }
`;

function injectStyles() {
  if (document.getElementById('cp-profile-styles')) return;
  const el = document.createElement('style');
  el.id = 'cp-profile-styles'; el.textContent = CSS;
  document.head.appendChild(el);
}

function ScoreBar({ value, color = '#63d2be' }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), 400); return () => clearTimeout(t); }, [value]);
  return (
    <div style={{ height:5, background:'rgba(255,255,255,.07)', borderRadius:99, overflow:'hidden', marginTop:10 }}>
      <div style={{ height:'100%', width:`${w}%`, background:`linear-gradient(90deg,${color}66,${color})`, borderRadius:99, transition:'width 1.3s cubic-bezier(.22,1,.36,1)', boxShadow:`0 0 10px ${color}55` }} />
    </div>
  );
}

export default function ClientDashboard() {
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => {
    injectStyles();
    return () => { document.getElementById('cp-profile-styles')?.remove(); };
  }, []);

  const [user, setUser] = useState(() => {
    try { const s = localStorage.getItem('user'); return s ? JSON.parse(s) : null; }
    catch { return null; }
  });

  const defaults  = { username:'', email:'', company_name:'', sector:'', role:'client' };
  const userData  = user || defaults;
  const [form, setForm]         = useState(userData);
  const [editMode, setEditMode] = useState(false);
  const [saved, setSaved]       = useState(false);

  const initial = (userData.company_name || userData.username || 'E').charAt(0).toUpperCase();

  const handleSave = () => {
    setUser(form);
    localStorage.setItem('user', JSON.stringify(form));
    setEditMode(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  const Field = ({ label, fieldKey, type = 'text' }) => (
    <div style={{ marginBottom:22 }}>
      <div style={{ fontSize:10, color:'#3d607a', textTransform:'uppercase', letterSpacing:'1.2px', marginBottom:8, fontWeight:600 }}>{label}</div>
      {editMode
        ? <input className="cp-edit-input" type={type} value={form[fieldKey]||''} onChange={e=>setForm({...form,[fieldKey]:e.target.value})} />
        : <div style={{ fontSize:15, fontWeight:600, color:'#c8dff4', letterSpacing:'.1px' }}>{userData[fieldKey]||'—'}</div>
      }
    </div>
  );

  const sectionCard = { background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.065)', borderRadius:22, padding:28, backdropFilter:'blur(12px)' };

  // Nav links config
 const NAV_LINKS = [
  { to:'/client/profile',        label:'Mon profil',      icon:'🏢' },  // ✅ changed
  { to:'/client/notifications',  label:'Notifications',   icon:'🔔', badge:2 },
  { to:'/client/guide',          label:'Guide de dépôt',  icon:'📖' },
  { to:'/client/contact',        label:'Contacter ANCS',  icon:'💬' },
];

  return (
    <div className="cp-root" style={{ minHeight:'100vh', background:'#07111e', color:'#e2f0ff' }}>

      {/* ══ TOP NAVBAR ══ */}
      <nav style={{ height:64, borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px', background:'rgba(7,17,30,.85)', backdropFilter:'blur(14px)', position:'sticky', top:0, zIndex:100 }}>

        {/* Left: logo + nav */}
        <div style={{ display:'flex', alignItems:'center', gap:32 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#0d5580,#1a7a6e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🛡️</div>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, letterSpacing:'-.3px', color:'#e4f2ff' }}>Espace <span style={{ color:'#63d2be' }}>Entreprise</span></span>
          </div>

          {/* Nav links */}
          <div style={{ display:'flex', gap:4 }}>
            {NAV_LINKS.map(nl => {
              const isActive = location.pathname === nl.to;
              return (
                <Link key={nl.to} to={nl.to} className={`cp-nav-link ${isActive?'active':''}`}>
                  <span style={{ fontSize:14 }}>{nl.icon}</span>
                  {nl.label}
                  {nl.badge && <span className="cp-notif-badge">{nl.badge}</span>}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: user + logout */}
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(140deg,#0d5580,#1a7a6e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'white', fontFamily:"'Syne',sans-serif" }}>{initial}</div>
            <span style={{ fontSize:13, color:'#8ab0c8', fontWeight:500 }}>{userData.company_name || userData.username || 'Entreprise'}</span>
          </div>
          <button className="cp-btn-danger" style={{ padding:'8px 16px', fontSize:13 }} onClick={() => { localStorage.clear(); navigate('/'); }}>
            Déconnexion
          </button>
        </div>
      </nav>

      {/* ══ HERO BANNER ══ */}
      <div className="cp-hex-bg" style={{ position:'relative', height:250, overflow:'hidden', background:'linear-gradient(155deg,#0c1f3a 0%,#0a2540 45%,#061520 100%)' }}>
        {[{w:360,h:360,t:-120,r:-80,d:22},{w:200,h:200,t:30,r:200,d:16},{w:140,h:140,t:90,r:90,d:30},{w:480,h:480,t:-200,r:280,d:40}].map((s,i) => (
          <div key={i} style={{ position:'absolute', top:s.t, right:s.r, width:s.w, height:s.h, borderRadius:'50%', border:'1px solid rgba(99,210,190,.18)', opacity:.5, animation:`rotateSlow ${s.d}s linear infinite` }} />
        ))}
        {[[28,70,0],[72,280,.6],[160,140,1.3],[48,520,.2],[130,420,1]].map(([t,l,d],i) => (
          <div key={i} style={{ position:'absolute', top:t, left:l, width:4, height:4, borderRadius:'50%', background:'rgba(99,210,190,.35)', animation:`floatDot ${2.8+i*.35}s ease-in-out infinite`, animationDelay:`${d}s` }} />
        ))}
        <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,.01) 3px,rgba(255,255,255,.01) 4px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:120, background:'linear-gradient(to top,#07111e,transparent)' }} />
        <div style={{ position:'absolute', top:22, right:26, display:'flex', alignItems:'center', gap:8, background:'rgba(99,210,190,.07)', border:'1px solid rgba(99,210,190,.18)', borderRadius:12, padding:'8px 16px' }}>
          <span style={{ fontSize:15 }}>🔐</span>
          <span style={{ fontSize:11, fontWeight:700, color:'#63d2be', letterSpacing:'1.2px', fontFamily:"'Syne',sans-serif" }}>ANCS PLATFORM</span>
        </div>
        <div style={{ position:'absolute', bottom:90, left:28, opacity:.35 }}>
          <div style={{ fontSize:10, color:'#63d2be', letterSpacing:'2px', textTransform:'uppercase', fontWeight:700 }}>Espace Entreprise</div>
        </div>
      </div>

      {/* ══ MAIN CONTENT ══ */}
      <div style={{ maxWidth:1080, margin:'0 auto', padding:'0 28px 64px' }}>

        {/* Profile header */}
        <div style={{ display:'flex', alignItems:'flex-end', gap:26, marginTop:-76, marginBottom:38, flexWrap:'wrap' }}>
          <div className="cp-avatar-ring" style={{ position:'relative', flexShrink:0, animation:'fadeUp .5s ease both' }}>
            <div style={{ width:118, height:118, borderRadius:'50%', background:'linear-gradient(140deg,#0d5580,#1a7a6e)', border:'4px solid #07111e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:42, fontWeight:900, color:'white', fontFamily:"'Syne',sans-serif", boxShadow:'0 0 0 2px rgba(99,210,190,.3), 0 14px 44px rgba(0,0,0,.65)' }}>
              {initial}
            </div>
            <div style={{ position:'absolute', bottom:5, right:5, width:18, height:18, borderRadius:'50%', background:'#4ade80', border:'3px solid #07111e', boxShadow:'0 0 10px #4ade8088' }} />
          </div>

          <div style={{ flex:1, paddingBottom:4, animation:'fadeUp .5s ease .1s both' }}>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:29, fontWeight:800, color:'#e4f2ff', letterSpacing:'-.4px', lineHeight:1, marginBottom:10 }}>
              {userData.company_name || 'Mon Entreprise'}
            </h1>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
              {userData.username && <span style={{ fontSize:13, color:'#3d748e', fontWeight:500 }}>@{userData.username}</span>}
              {userData.username && <span style={{ color:'#1a3248', fontSize:16 }}>·</span>}
              <span style={{ fontSize:13, color:'#3d607a' }}>{userData.sector || 'Secteur non renseigné'}</span>
              <span style={{ color:'#1a3248', fontSize:16 }}>·</span>
              <span style={{ fontSize:13, color:'#63d2be', fontWeight:600 }}>{userData.email}</span>
              <span style={{ background:'rgba(99,210,190,.09)', color:'#63d2be', border:'1px solid rgba(99,210,190,.22)', padding:'3px 12px', borderRadius:99, fontWeight:700, fontSize:10, letterSpacing:'.7px', textTransform:'uppercase' }}>
                🏢 Entreprise
              </span>
            </div>
          </div>

          <div style={{ paddingBottom:4, display:'flex', gap:10, animation:'fadeUp .5s ease .2s both' }}>
            {!editMode
              ? <button className="cp-btn-modify" onClick={() => { setForm(userData); setEditMode(true); }}>✏️ Modifier le profil</button>
              : <>
                  <button className="cp-btn-primary" onClick={handleSave}>✓ Sauvegarder</button>
                  <button className="cp-btn-ghost"   onClick={() => { setEditMode(false); setForm(userData); }}>Annuler</button>
                </>
            }
          </div>
        </div>

        {/* Toast */}
        {saved && (
          <div style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(74,222,128,.07)', border:'1px solid rgba(74,222,128,.22)', borderRadius:14, padding:'14px 22px', marginBottom:26, color:'#4ade80', fontSize:14, fontWeight:600, animation:'fadeUp .4s ease' }}>
            <span style={{ fontSize:20 }}>✓</span> Profil mis à jour avec succès
          </div>
        )}

        {/* Info cards grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:28 }}>
          <div className="cp-anim" style={sectionCard}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(99,210,190,.1)', border:'1px solid rgba(99,210,190,.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>👤</div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color:'#b0cce0', letterSpacing:'.3px', textTransform:'uppercase' }}>Informations personnelles</h2>
            </div>
            <Field label="Nom d'utilisateur" fieldKey="username" />
            <Field label="Adresse email"     fieldKey="email" type="email" />
          </div>

          <div className="cp-anim" style={sectionCard}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(99,210,190,.1)', border:'1px solid rgba(99,210,190,.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🏢</div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color:'#b0cce0', letterSpacing:'.3px', textTransform:'uppercase' }}>Informations entreprise</h2>
            </div>
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:10, color:'#3d607a', textTransform:'uppercase', letterSpacing:'1.2px', marginBottom:8, fontWeight:600 }}>Nom de l'entreprise</div>
              {editMode
                ? <input className="cp-edit-input" value={form.company_name||''} onChange={e=>setForm({...form,company_name:e.target.value})} />
                : <div style={{ fontSize:15, fontWeight:600, color:'#c8dff4' }}>{userData.company_name||'—'}</div>
              }
            </div>
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:10, color:'#3d607a', textTransform:'uppercase', letterSpacing:'1.2px', marginBottom:8, fontWeight:600 }}>Secteur d'activité</div>
              {editMode
                ? <select className="cp-edit-select" value={form.sector||''} onChange={e=>setForm({...form,sector:e.target.value})}>
                    <option value=''>— Sélectionner —</option>
                    {SECTEURS.map(s=><option key={s}>{s}</option>)}
                  </select>
                : <div style={{ fontSize:15, fontWeight:600, color:'#c8dff4' }}>{userData.sector||'—'}</div>
              }
            </div>
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <div style={{ fontSize:10, color:'#3d607a', textTransform:'uppercase', letterSpacing:'1.2px', fontWeight:600 }}>Score de maturité SSI</div>
                <span style={{ fontSize:17, fontWeight:800, color:'#818cf8', fontFamily:"'Syne',sans-serif" }}>78%</span>
              </div>
              <ScoreBar value={78} color="#818cf8" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:11, color:'#1e3a52', letterSpacing:'.3px' }}>
            ANCS Platform · Audit de Sécurité des Systèmes d'Information © 2026
          </div>
          <button className="cp-btn-danger" onClick={() => { localStorage.clear(); navigate('/'); }}>
            🚪 Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}