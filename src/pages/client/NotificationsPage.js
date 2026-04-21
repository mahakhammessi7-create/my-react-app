import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  @keyframes fadeUp    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulseRing { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(1.5);opacity:0} }
  @keyframes floatDot  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes rotateSlow{ from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes notifPulse{ 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }

  .notif-root { font-family:'DM Sans',sans-serif; }
  .notif-root * { box-sizing:border-box; margin:0; padding:0; }

  .cp-hex-bg {
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zm0-6l22-13V19L28 6 6 19v28L28 60z' fill='%23ffffff' fill-opacity='0.022'/%3E%3C/svg%3E");
  }

  .notif-item {
    display:flex; gap:16px; align-items:flex-start;
    padding:18px 22px; border-radius:18px; position:relative;
    border:1px solid rgba(255,255,255,.065);
    background:rgba(255,255,255,.025);
    cursor:pointer; transition:background .2s, border-color .2s, transform .2s;
    backdrop-filter:blur(12px);
  }
  .notif-item:hover { background:rgba(99,210,190,.06); border-color:rgba(99,210,190,.25); transform:translateX(4px); }
  .notif-item.unread { background:rgba(99,210,190,.04); border-color:rgba(99,210,190,.18); }

  .notif-filter-btn {
    padding:8px 16px; border-radius:11px;
    border:1px solid rgba(255,255,255,.1); background:transparent;
    color:#3d607a; font-size:12px; font-family:'DM Sans',sans-serif; font-weight:500;
    cursor:pointer; transition:all .2s; white-space:nowrap;
  }
  .notif-filter-btn:hover { background:rgba(255,255,255,.06); color:#8ab0c8; }
  .notif-filter-btn.active { background:rgba(99,210,190,.1); color:#63d2be; border-color:rgba(99,210,190,.28); }

  .notif-mark-btn {
    padding:10px 20px; border-radius:12px;
    background:rgba(99,210,190,.09); color:#63d2be;
    border:1px solid rgba(99,210,190,.22);
    font-size:13px; font-family:'DM Sans',sans-serif; font-weight:700;
    cursor:pointer; transition:all .2s;
  }
  .notif-mark-btn:hover { background:rgba(99,210,190,.17); }

  .cp-nav-link {
    display:flex; align-items:center; gap:6px;
    padding:7px 13px; border-radius:10px; text-decoration:none;
    font-size:13px; font-weight:500; transition:all .2s; white-space:nowrap;
  }
  .cp-nav-link:hover { background:rgba(255,255,255,.06); color:#8ab0c8 !important; }

  .notif-a1{animation:fadeUp .5s ease both .05s}
  .notif-a2{animation:fadeUp .5s ease both .10s}
  .notif-a3{animation:fadeUp .5s ease both .15s}
`;

function injectStyles() {
  if (document.getElementById('notif-page-styles')) return;
  const el = document.createElement('style');
  el.id = 'notif-page-styles'; el.textContent = CSS;
  document.head.appendChild(el);
}

const MOCK = [
  { id:1, type:'validated', title:'Rapport validé',               message:'Votre rapport d\'audit SSI déposé le 15/04/2026 a été validé par l\'équipe ANCS.',                                                                   date:'2026-04-17T10:32:00', read:false, reportId:'RPT-0042', score:84 },
  { id:2, type:'pending',   title:'Rapport en cours de révision', message:'Votre rapport RPT-0041 est en cours d\'examen par un auditeur ANCS. Vous serez notifié dès la fin.',                                                   date:'2026-04-14T09:10:00', read:false, reportId:'RPT-0041', score:null },
  { id:3, type:'rejected',  title:'Rapport rejeté',               message:'Votre rapport RPT-0039 a été rejeté. Motif : données manquantes dans la section "Continuité d\'activité". Merci de soumettre une version corrigée.',   date:'2026-04-10T14:55:00', read:true,  reportId:'RPT-0039', score:41 },
  { id:4, type:'system',    title:'Nouveau cycle d\'audit ouvert', message:'Le cycle d\'audit SSI 2026 est officiellement ouvert. La date limite de dépôt est fixée au 30 juin 2026.',                                             date:'2026-04-01T08:00:00', read:true,  reportId:null,       score:null },
  { id:5, type:'validated', title:'Rapport validé',               message:'Votre rapport RPT-0035 a été validé avec un score de conformité de 79%. Félicitations !',                                                              date:'2026-03-22T16:20:00', read:true,  reportId:'RPT-0035', score:79 },
  { id:6, type:'comment',   title:'Commentaire de l\'auditeur',   message:'Un auditeur a laissé une remarque sur RPT-0035 : "Merci de mettre à jour le plan de continuité pour le prochain cycle."',                              date:'2026-03-20T11:05:00', read:true,  reportId:'RPT-0035', score:null },
];

const TYPE_CFG = {
  validated:{ color:'#4ade80', bg:'rgba(74,222,128,.1)',   icon:'✅', label:'Validé'    },
  rejected: { color:'#f87171', bg:'rgba(248,113,113,.1)', icon:'❌', label:'Rejeté'    },
  pending:  { color:'#fbbf24', bg:'rgba(251,191,36,.1)',  icon:'⏳', label:'En attente' },
  system:   { color:'#63d2be', bg:'rgba(99,210,190,.1)',  icon:'📢', label:'Système'   },
  comment:  { color:'#818cf8', bg:'rgba(129,140,248,.1)', icon:'💬', label:'Remarque'  },
};

function fmtDate(iso) {
  const d = new Date(iso), now = new Date(), diff = Math.floor((now - d) / 1000);
  if (diff < 3600)  return `Il y a ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff/3600)}h`;
  return d.toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
}

function NotifItem({ n, onRead }) {
  const cfg = TYPE_CFG[n.type] || TYPE_CFG.system;
  return (
    <div className={`notif-item ${n.read?'':'unread'}`} onClick={() => onRead(n.id)}>
      {!n.read && <div style={{ position:'absolute', top:14, right:16, width:8, height:8, borderRadius:'50%', background:'#63d2be', boxShadow:'0 0 8px #63d2be88', animation:'notifPulse 2s ease-in-out infinite' }} />}
      <div style={{ width:44, height:44, borderRadius:13, background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0, marginTop:2 }}>{cfg.icon}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, flexWrap:'wrap' }}>
          <span style={{ fontSize:14, fontWeight:600, color:'#c8dff4', fontFamily:"'Syne',sans-serif" }}>{n.title}</span>
          {n.reportId && <span style={{ fontSize:10, color:cfg.color, background:cfg.bg, padding:'2px 8px', borderRadius:20, fontWeight:700 }}>{n.reportId}</span>}
          {n.score !== null && <span style={{ fontSize:10, color: n.score>=75?'#4ade80':n.score>=55?'#fbbf24':'#f87171', background:'rgba(255,255,255,.04)', padding:'2px 8px', borderRadius:20, fontWeight:700 }}>Score : {n.score}%</span>}
        </div>
        <p style={{ fontSize:13, color:'#3d607a', lineHeight:1.6, marginBottom:6 }}>{n.message}</p>
        <span style={{ fontSize:11, color:'#1e3a52' }}>{fmtDate(n.date)}</span>
      </div>
    </div>
  );
}

const sectionCard = { background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.065)', borderRadius:22, padding:28, backdropFilter:'blur(12px)' };

const NAV_LINKS = [
  { to:'/client/dashboard',     label:'Déposer un rapport', icon:'📤' },
  { to:'/client/profile',       label:'Mon profil',         icon:'🏢' },
  { to:'/client/notifications', label:'Notifications',      icon:'🔔' },
  { to:'/client/guide',         label:'Guide de dépôt',     icon:'📖' },
  { to:'/client/contact',       label:'Contacter ANCS',     icon:'💬' },
];

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(MOCK);
  const [filter, setFilter] = useState('all');
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => { injectStyles(); return () => document.getElementById('notif-page-styles')?.remove(); }, []);

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
  const initials = user ? (user.username || user.company_name || 'U').charAt(0).toUpperCase() : 'U';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('extractedData');
    navigate('/');
  };

  const unread = notifs.filter(n => !n.read).length;
  const filtered = notifs.filter(n => {
    if (filter === 'unread')    return !n.read;
    if (filter === 'validated') return n.type === 'validated';
    if (filter === 'rejected')  return n.type === 'rejected';
    return true;
  });

  return (
    <div className="notif-root" style={{ minHeight:'100vh', background:'#07111e', color:'#e2f0ff' }}>

      {/* ══ NAVBAR ══ */}
      <nav style={{
        background:'rgba(8,20,36,.92)', backdropFilter:'blur(16px)',
        borderBottom:'1px solid rgba(255,255,255,.06)',
        padding:'0 28px', display:'flex', alignItems:'center', justifyContent:'space-between',
        height:60, position:'sticky', top:0, zIndex:100,
        boxShadow:'0 4px 24px rgba(0,0,0,.35)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, background:'linear-gradient(135deg,#0d5580,#1a7a6e)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🏢</div>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color:'#d4e8ff' }}>Espace Entreprise</span>
          </div>
          <div style={{ display:'flex', gap:4 }}>
            {NAV_LINKS.map(nl => {
              const isActive = location.pathname === nl.to;
              return (
                <Link key={nl.to} to={nl.to} className="cp-nav-link" style={{
                  background: isActive ? 'rgba(99,210,190,.1)' : 'transparent',
                  color:      isActive ? '#63d2be' : '#3d607a',
                  border:     isActive ? '1px solid rgba(99,210,190,.2)' : '1px solid transparent',
                }}>
                  <span style={{ fontSize:13 }}>{nl.icon}</span>{nl.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {user && (
            <div style={{ display:'flex', alignItems:'center', gap:9, padding:'5px 12px', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:99 }}>
              <div style={{ width:26, height:26, background:'linear-gradient(135deg,#0d5580,#1a7a6e)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800 }}>{initials}</div>
              <span style={{ fontSize:12, color:'#4a6a88' }}>{user.company_name || user.username || user.email}</span>
            </div>
          )}
          <button onClick={handleLogout} style={{ padding:'8px 16px', borderRadius:10, background:'rgba(248,113,113,.1)', color:'#f87171', border:'1px solid rgba(248,113,113,.2)', fontSize:12, fontWeight:600, cursor:'pointer' }}>Déconnexion</button>
        </div>
      </nav>

      {/* HERO */}
      <div className="cp-hex-bg" style={{ position:'relative', height:200, overflow:'hidden', background:'linear-gradient(155deg,#0c1f3a 0%,#0a2540 45%,#061520 100%)' }}>
        {[{w:360,h:360,t:-120,r:-80,d:22},{w:200,h:200,t:30,r:200,d:16},{w:480,h:480,t:-200,r:280,d:40}].map((s,i) => (
          <div key={i} style={{ position:'absolute', top:s.t, right:s.r, width:s.w, height:s.h, borderRadius:'50%', border:'1px solid rgba(99,210,190,.18)', opacity:.5, animation:`rotateSlow ${s.d}s linear infinite` }} />
        ))}
        {[[28,70,0],[72,280,.6],[48,520,.2],[130,420,1]].map(([t,l,d],i) => (
          <div key={i} style={{ position:'absolute', top:t, left:l, width:4, height:4, borderRadius:'50%', background:'rgba(99,210,190,.35)', animation:`floatDot ${2.8+i*.35}s ease-in-out infinite`, animationDelay:`${d}s` }} />
        ))}
        <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,.01) 3px,rgba(255,255,255,.01) 4px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:100, background:'linear-gradient(to top,#07111e,transparent)' }} />
        <div style={{ position:'absolute', top:22, right:26, display:'flex', alignItems:'center', gap:8, background:'rgba(99,210,190,.07)', border:'1px solid rgba(99,210,190,.18)', borderRadius:12, padding:'8px 16px' }}>
          <span style={{ fontSize:14 }}>🔔</span>
          <span style={{ fontSize:11, fontWeight:700, color:'#63d2be', letterSpacing:'1.2px', fontFamily:"'Syne',sans-serif" }}>NOTIFICATIONS</span>
        </div>
        <div style={{ position:'absolute', bottom:36, left:28 }}>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, color:'#e4f2ff' }}>Notifications <span style={{ color:'#63d2be' }}>& Statut</span></h1>
          <p style={{ fontSize:13, color:'#3d607a', marginTop:4 }}>Suivez en temps réel l'état de vos rapports soumis à l'ANCS.</p>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 28px 64px' }}>

        {/* Summary + actions */}
        <div className="notif-a1" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16, marginBottom:24 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {[
              { label:'Non lues', val:unread,                                        color:'#63d2be' },
              { label:'Validés',  val:notifs.filter(n=>n.type==='validated').length, color:'#4ade80' },
              { label:'Rejetés',  val:notifs.filter(n=>n.type==='rejected').length,  color:'#f87171' },
            ].map(s => (
              <div key={s.label} style={{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.065)', borderRadius:16, padding:'14px 20px', backdropFilter:'blur(12px)' }}>
                <div style={{ fontSize:10, color:'#3d607a', textTransform:'uppercase', letterSpacing:'1px', fontWeight:600, marginBottom:6 }}>{s.label}</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
          {unread > 0 && <button className="notif-mark-btn" onClick={() => setNotifs(p => p.map(n=>({...n,read:true})))}>Tout marquer comme lu</button>}
        </div>

        {/* Filters */}
        <div className="notif-a2" style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
          {[{k:'all',l:'Toutes'},{k:'unread',l:`Non lues${unread>0?` (${unread})`:''}`},{k:'validated',l:'Validés'},{k:'rejected',l:'Rejetés'}].map(f => (
            <button key={f.k} className={`notif-filter-btn ${filter===f.k?'active':''}`} onClick={()=>setFilter(f.k)}>{f.l}</button>
          ))}
        </div>

        {/* List */}
        <div className="notif-a3" style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.length === 0
            ? <div style={{ ...sectionCard, padding:60, textAlign:'center', color:'#1e3a52' }}><div style={{ fontSize:32, marginBottom:12 }}>🔔</div><div style={{ fontSize:15 }}>Aucune notification</div></div>
            : filtered.map(n => <NotifItem key={n.id} n={n} onRead={id => setNotifs(p => p.map(x => x.id===id?{...x,read:true}:x))} />)
          }
        </div>

        <div style={{ marginTop:40, textAlign:'center', fontSize:11, color:'#1e3a52', letterSpacing:'.3px' }}>
          ANCS Platform · Audit de Sécurité des Systèmes d'Information © 2026
        </div>
      </div>
    </div>
  );
}