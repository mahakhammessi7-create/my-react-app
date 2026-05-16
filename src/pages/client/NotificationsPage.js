import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

/* ─── STYLES ────────────────────────────────────────────────────────────────── */

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  @keyframes fadeUp    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes floatDot  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes rotateSlow{ from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes notifPulse{ 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
  @keyframes spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

  .ea-root { font-family:'DM Sans',sans-serif; }
  .ea-root * { box-sizing:border-box; margin:0; padding:0; }

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

  .filter-btn {
    padding:8px 16px; border-radius:11px;
    border:1px solid rgba(255,255,255,.1); background:transparent;
    color:#3d607a; font-size:12px; font-family:'DM Sans',sans-serif; font-weight:500;
    cursor:pointer; transition:all .2s; white-space:nowrap;
  }
  .filter-btn:hover  { background:rgba(255,255,255,.06); color:#8ab0c8; }
  .filter-btn.active { background:rgba(99,210,190,.1); color:#63d2be; border-color:rgba(99,210,190,.28); }

  .mark-btn {
    padding:10px 20px; border-radius:12px;
    background:rgba(99,210,190,.09); color:#63d2be;
    border:1px solid rgba(99,210,190,.22);
    font-size:13px; font-family:'DM Sans',sans-serif; font-weight:700;
    cursor:pointer; transition:all .2s;
  }
  .mark-btn:hover { background:rgba(99,210,190,.17); }
  .mark-btn:disabled { opacity:.45; cursor:not-allowed; }

  .cp-nav-link {
    display:flex; align-items:center; gap:6px;
    padding:7px 13px; border-radius:10px; text-decoration:none;
    font-size:13px; font-weight:500; transition:all .2s; white-space:nowrap;
  }
  .cp-nav-link:hover { background:rgba(255,255,255,.06); color:#8ab0c8 !important; }

  .spinner {
    display:inline-block; width:16px; height:16px;
    border:2px solid rgba(99,210,190,.25);
    border-top-color:#63d2be; border-radius:50%;
    animation:spin .7s linear infinite;
  }

  .a1{animation:fadeUp .5s ease both .05s}
  .a2{animation:fadeUp .5s ease both .10s}
  .a3{animation:fadeUp .5s ease both .15s}
`;

function injectStyles() {
  if (document.getElementById('ea-notif-styles')) return;
  const el = document.createElement('style');
  el.id = 'ea-notif-styles';
  el.textContent = CSS;
  document.head.appendChild(el);
}

/* ─── CONFIG PAR TYPE ───────────────────────────────────────────────────────── */

const TYPE_CFG = {
  depose:      { color:'#818cf8', bg:'rgba(129,140,248,.1)', icon:'📤', label:'Étape 1 — Déposé'              },
  valide_tech: { color:'#63d2be', bg:'rgba(99,210,190,.1)',  icon:'🔎', label:'Étape 2 — Validé techniquement' },
  rejete_tech: { color:'#f87171', bg:'rgba(248,113,113,.1)', icon:'❌', label:'Étape 2 — Rejeté (technique)'   },
  valide_final:{ color:'#4ade80', bg:'rgba(74,222,128,.1)',  icon:'✅', label:'Étape 3 — Validé définitivement' },
};

const NAV_LINKS = [
  { to:'/expert/dashboard',     label:'Mes dossiers',   icon:'📁' },
  { to:'/expert/profile',       label:'Mon profil',     icon:'👤' },
  { to:'/expert/notifications', label:'Notifications',  icon:'🔔' },
  { to:'/expert/guide',         label:'Guide',          icon:'📖' },
  { to:'/expert/contact',       label:'Contacter ANCS', icon:'💬' },
];

/* ─── API CLIENT ─────────────────────────────────────────────────────────────
 *
 * Toutes les requêtes vers /api/notifications.
 * Le token JWT est lu depuis localStorage et injecté dans Authorization.
 *
 * Endpoints utilisés :
 *   GET    /api/notifications         → liste complète (triée created_at DESC)
 *   PATCH  /api/notifications/:id/read → marquer un élément comme lu
 *   PATCH  /api/notifications/read-all → tout marquer comme lu
 * ─────────────────────────────────────────────────────────────────────────── */

const API_BASE = '/api/notifications';

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/* Normalise les champs de la BDD vers le format attendu par les composants.
 *
 * Champs BDD attendus (d'après le schéma SQL du backend) :
 *   id, dossier_id, organisme, type, etape, title, message,
 *   created_at, is_read, score
 */
function normalizeNotif(row) {
  return {
    id:         row.id,
    dossierId:  row.dossier_id   ?? row.dossierId   ?? '',
    organisme:  row.organisme    ?? '',
    type:       row.type         ?? 'depose',
    etape:      row.etape        ?? 1,
    title:      row.title        ?? '',
    message:    row.message      ?? '',
    date:       row.created_at   ?? row.date        ?? null,
    read:       row.is_read      ?? row.read        ?? false,
    score:      row.score        ?? null,
  };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: authHeaders(),
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

/* ─── HELPERS ────────────────────────────────────────────────────────────────── */

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso), now = new Date(), diff = Math.floor((now - d) / 1000);
  if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
}

/* ─── COMPOSANT : ITEM NOTIFICATION ─────────────────────────────────────────── */

function NotifItem({ n, onRead }) {
  const cfg = TYPE_CFG[n.type] || TYPE_CFG.depose;
  const scoreColor = n.score >= 75 ? '#4ade80' : n.score >= 55 ? '#fbbf24' : '#f87171';

  return (
    <div
      className={`notif-item ${n.read ? '' : 'unread'}`}
      onClick={() => !n.read && onRead(n.id)}
    >
      {/* Point non-lu */}
      {!n.read && (
        <div style={{
          position:'absolute', top:14, right:16,
          width:8, height:8, borderRadius:'50%',
          background:'#63d2be', boxShadow:'0 0 8px #63d2be88',
          animation:'notifPulse 2s ease-in-out infinite',
        }} />
      )}

      {/* Icône type */}
      <div style={{
        width:46, height:46, borderRadius:14,
        background:cfg.bg,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:20, flexShrink:0, marginTop:2,
      }}>
        {cfg.icon}
      </div>

      {/* Contenu */}
      <div style={{ flex:1, minWidth:0 }}>
        {/* Ligne titre + badges */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
          <span style={{ fontSize:14, fontWeight:700, color:'#c8dff4', fontFamily:"'Syne',sans-serif" }}>
            {n.title}
          </span>
          <span style={{ fontSize:10, color:'#63d2be', background:'rgba(99,210,190,.08)', padding:'2px 8px', borderRadius:20, fontWeight:700 }}>
            {n.dossierId}
          </span>
          <span style={{ fontSize:10, color:cfg.color, background:cfg.bg, padding:'2px 8px', borderRadius:20, fontWeight:600 }}>
            {cfg.label}
          </span>
          {n.score !== null && (
            <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, color:scoreColor, background:`rgba(${n.score>=75?'74,222,128':n.score>=55?'251,191,36':'248,113,113'},.08)` }}>
              Score : {n.score} %
            </span>
          )}
        </div>

        <p style={{ fontSize:13, color:'#3d607a', lineHeight:1.65, marginBottom:7 }}>
          {n.message}
        </p>

        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:11, color:'#2a4a66', fontWeight:500 }}>{n.organisme}</span>
          <span style={{ fontSize:11, color:'#1e3a52' }}>·</span>
          <span style={{ fontSize:11, color:'#1e3a52' }}>{fmtDate(n.date)}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── ÉTAT DE CHARGEMENT / ERREUR ────────────────────────────────────────────── */

function LoadingState() {
  return (
    <div style={{ textAlign:'center', padding:'60px 0', color:'#3d607a' }}>
      <div className="spinner" style={{ margin:'0 auto 16px', width:28, height:28, borderWidth:3 }} />
      <div style={{ fontSize:13 }}>Chargement des notifications…</div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div style={{
      background:'rgba(248,113,113,.05)', border:'1px solid rgba(248,113,113,.18)',
      borderRadius:18, padding:'32px 28px', textAlign:'center', backdropFilter:'blur(12px)',
    }}>
      <div style={{ fontSize:28, marginBottom:10 }}>⚠️</div>
      <div style={{ fontSize:14, color:'#f87171', fontWeight:600, marginBottom:6 }}>
        Erreur de chargement
      </div>
      <div style={{ fontSize:12, color:'#3d607a', marginBottom:18 }}>{message}</div>
      <button
        onClick={onRetry}
        style={{ padding:'9px 20px', borderRadius:12, background:'rgba(248,113,113,.1)', color:'#f87171', border:'1px solid rgba(248,113,113,.22)', fontSize:13, fontWeight:600, cursor:'pointer' }}
      >
        Réessayer
      </button>
    </div>
  );
}

/* ─── PAGE PRINCIPALE ────────────────────────────────────────────────────────── */

const emptyCard = {
  background:'rgba(255,255,255,.025)',
  border:'1px solid rgba(255,255,255,.065)',
  borderRadius:22, padding:60, backdropFilter:'blur(12px)',
  textAlign:'center', color:'#1e3a52',
};

export default function ExpertAuditeurNotifications() {
  /* ── State ── */
  const [notifs,         setNotifs]         = useState([]);
  const [filter,         setFilter]         = useState('all');
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [markingAll,     setMarkingAll]     = useState(false);

  /* Référence pour éviter les double-fetch en StrictMode */
  const fetchedRef = useRef(false);

  const location = useLocation();
  const navigate = useNavigate();

  /* ── Styles ── */
  useEffect(() => {
    injectStyles();
    return () => document.getElementById('ea-notif-styles')?.remove();
  }, []);

  /* ── Utilisateur connecté ── */
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user')); }
    catch { return null; }
  })();
  const initials = user
    ? (user.full_name || user.username || 'EA').slice(0, 2).toUpperCase()
    : 'EA';

  /* ── Fetch notifications ─────────────────────────────────────────────────────
   *
   * GET /api/notifications
   * Réponse : tableau de rows PostgreSQL (snake_case)
   * ──────────────────────────────────────────────────────────────────────────── */
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await apiFetch('/');
      setNotifs(rows.map(normalizeNotif));
    } catch (err) {
      setError(err.message || 'Impossible de charger les notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchNotifications();
  }, [fetchNotifications]);

  /* ── Déconnexion ── */
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  /* ── Marquer un élément comme lu ─────────────────────────────────────────────
   *
   * PATCH /api/notifications/:id/read
   * Mise à jour optimiste : l'UI est mise à jour immédiatement,
   * et rollback en cas d'erreur réseau.
   * ──────────────────────────────────────────────────────────────────────────── */
  const markRead = useCallback(async (id) => {
    /* Optimistic update */
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

    try {
      await apiFetch(`/${id}/read`, { method: 'PATCH' });
    } catch {
      /* Rollback */
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: false } : n));
    }
  }, []);

  /* ── Tout marquer comme lu ───────────────────────────────────────────────────
   *
   * PATCH /api/notifications/read-all
   * ──────────────────────────────────────────────────────────────────────────── */
  const markAllRead = useCallback(async () => {
    if (markingAll) return;
    const previous = notifs.map(n => ({ ...n }));

    /* Optimistic update */
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    setMarkingAll(true);

    try {
      await apiFetch('/read-all', { method: 'PATCH' });
    } catch {
      /* Rollback */
      setNotifs(previous);
    } finally {
      setMarkingAll(false);
    }
  }, [notifs, markingAll]);

  /* ── Dérivés ── */
  const unread = notifs.filter(n => !n.read).length;

  const filtered = notifs.filter(n => {
    if (filter === 'unread')       return !n.read;
    if (filter === 'depose')       return n.type === 'depose';
    if (filter === 'valide_tech')  return n.type === 'valide_tech';
    if (filter === 'rejete_tech')  return n.type === 'rejete_tech';
    if (filter === 'valide_final') return n.type === 'valide_final';
    return true;
  });

  const stats = [
    { label:'Non lues',          val: unread,                                               color:'#63d2be' },
    { label:'Validations fin.',  val: notifs.filter(n => n.type === 'valide_final').length,  color:'#4ade80' },
    { label:'Valid. techniques', val: notifs.filter(n => n.type === 'valide_tech').length,   color:'#818cf8' },
    { label:'Rejets',            val: notifs.filter(n => n.type === 'rejete_tech').length,   color:'#f87171' },
  ];

  /* ── Rendu ── */
  return (
    <div className="ea-root" style={{ minHeight:'100vh', background:'#07111e', color:'#e2f0ff' }}>

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
            <div style={{ width:34, height:34, background:'linear-gradient(135deg,#0d5580,#1a7a6e)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
              🔍
            </div>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color:'#d4e8ff' }}>
              Espace Expert Auditeur
            </span>
          </div>
          <div style={{ display:'flex', gap:4 }}>
            {NAV_LINKS.map(nl => {
              const isActive = location.pathname === nl.to;
              return (
                <Link
                  key={nl.to}
                  to={nl.to}
                  className="cp-nav-link"
                  style={{
                    background: isActive ? 'rgba(99,210,190,.1)'          : 'transparent',
                    color:      isActive ? '#63d2be'                       : '#3d607a',
                    border:     isActive ? '1px solid rgba(99,210,190,.2)' : '1px solid transparent',
                  }}
                >
                  <span style={{ fontSize:13 }}>{nl.icon}</span>{nl.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {unread > 0 && (
            <div style={{ position:'relative' }}>
              <span style={{ fontSize:18 }}>🔔</span>
              <span style={{ position:'absolute', top:-4, right:-4, width:16, height:16, borderRadius:'50%', background:'#f87171', fontSize:9, fontWeight:800, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {unread}
              </span>
            </div>
          )}
          {user && (
            <div style={{ display:'flex', alignItems:'center', gap:9, padding:'5px 12px', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:99 }}>
              <div style={{ width:26, height:26, background:'linear-gradient(135deg,#0d5580,#1a7a6e)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800 }}>
                {initials}
              </div>
              <span style={{ fontSize:12, color:'#4a6a88' }}>
                {user.full_name || user.username || user.email}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{ padding:'8px 16px', borderRadius:10, background:'rgba(248,113,113,.1)', color:'#f87171', border:'1px solid rgba(248,113,113,.2)', fontSize:12, fontWeight:600, cursor:'pointer' }}
          >
            Déconnexion
          </button>
        </div>
      </nav>

      {/* ══ HERO ══ */}
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
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, color:'#e4f2ff' }}>
            Notifications <span style={{ color:'#63d2be' }}>d'avancement</span>
          </h1>
          <p style={{ fontSize:13, color:'#3d607a', marginTop:4 }}>
            Suivez en temps réel chaque étape de validation de vos rapports soumis à l'ANCS.
          </p>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 28px 64px' }}>

        {/* ══ GESTION DES ÉTATS : CHARGEMENT / ERREUR ══ */}
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchNotifications} />
        ) : (
          <>
            {/* ══ STATS ══ */}
            <div className="a1" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:28 }}>
              {stats.map(s => (
                <div key={s.label} style={{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.065)', borderRadius:16, padding:'14px 20px', backdropFilter:'blur(12px)' }}>
                  <div style={{ fontSize:10, color:'#3d607a', textTransform:'uppercase', letterSpacing:'1px', fontWeight:600, marginBottom:6 }}>
                    {s.label}
                  </div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:s.color }}>
                    {s.val}
                  </div>
                </div>
              ))}
            </div>

            {/* ══ LÉGENDE WORKFLOW ══ */}
            <div className="a2" style={{ display:'flex', alignItems:'center', gap:6, marginBottom:24, padding:'12px 18px', background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.055)', borderRadius:14, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, color:'#3d607a', fontWeight:600, marginRight:6 }}>Circuit :</span>
              {[
                { icon:'📤', label:'Étape 1 — Dépôt',                                          color:'#818cf8' },
                { icon:'→',  label:null,                                                        color:'#1e3a52' },
                { icon:'🔎', label:"Étape 2 — Validation technique (Chargé d'étude)",           color:'#63d2be' },
                { icon:'→',  label:null,                                                        color:'#1e3a52' },
                { icon:'✅', label:'Étape 3 — Validation finale (Responsable)',                 color:'#4ade80' },
              ].map((step, i) => (
                <span key={i} style={{ fontSize:11, color:step.color, fontWeight:500, display:'flex', alignItems:'center', gap:4 }}>
                  {step.icon}{step.label}
                </span>
              ))}
            </div>

            {/* ══ FILTRES + ACTION ══ */}
            <div className="a2" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12, marginBottom:20 }}>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {[
                  { k:'all',          l:'Toutes'                                       },
                  { k:'unread',       l:`Non lues${unread > 0 ? ` (${unread})` : ''}` },
                  { k:'depose',       l:'Dépôts'                                       },
                  { k:'valide_tech',  l:'Valid. techniques'                            },
                  { k:'rejete_tech',  l:'Rejets'                                       },
                  { k:'valide_final', l:'Validations finales'                          },
                ].map(f => (
                  <button
                    key={f.k}
                    className={`filter-btn ${filter === f.k ? 'active' : ''}`}
                    onClick={() => setFilter(f.k)}
                  >
                    {f.l}
                  </button>
                ))}
              </div>

              {unread > 0 && (
                <button
                  className="mark-btn"
                  onClick={markAllRead}
                  disabled={markingAll}
                >
                  {markingAll
                    ? <><span className="spinner" style={{ width:12, height:12, borderWidth:2, verticalAlign:'middle', marginRight:6 }} />En cours…</>
                    : 'Tout marquer comme lu'
                  }
                </button>
              )}
            </div>

            {/* ══ LISTE NOTIFICATIONS ══ */}
            <div className="a3" style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {filtered.length === 0 ? (
                <div style={emptyCard}>
                  <div style={{ fontSize:32, marginBottom:12 }}>🔔</div>
                  <div style={{ fontSize:15 }}>Aucune notification</div>
                </div>
              ) : (
                filtered.map(n => (
                  <NotifItem key={n.id} n={n} onRead={markRead} />
                ))
              )}
            </div>
          </>
        )}

        <div style={{ marginTop:40, textAlign:'center', fontSize:11, color:'#1e3a52', letterSpacing:'.3px' }}>
          ANCS Platform · Audit de Sécurité des Systèmes d'Information © 2026
        </div>
      </div>
    </div>
  );
}