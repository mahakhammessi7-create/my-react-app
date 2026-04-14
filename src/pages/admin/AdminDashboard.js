import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../../services/api';
import NationalDashboard from '../../components/Module3_Analytics/NationalDashboard';

/* ══════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  @keyframes adm-up   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes adm-spin { to{transform:rotate(360deg)} }
  @keyframes adm-glow { 0%,100%{opacity:.25} 50%{opacity:.65} }
  @keyframes adm-scan { 0%{top:0;opacity:.6} 100%{top:100%;opacity:0} }
  @keyframes adm-rotateSlow { from{transform:rotate(0)} to{transform:rotate(360deg)} }

  .adm-root * { box-sizing:border-box; margin:0; padding:0; }
  .adm-root   { font-family:'DM Sans',sans-serif; }
  .adm-anim   { animation:adm-up .5s ease both; }
  .adm-anim:nth-child(1){animation-delay:.04s}
  .adm-anim:nth-child(2){animation-delay:.09s}
  .adm-anim:nth-child(3){animation-delay:.14s}
  .adm-anim:nth-child(4){animation-delay:.19s}
  .adm-anim:nth-child(5){animation-delay:.24s}

  .adm-nav-btn {
    display:flex; align-items:center; gap:7px;
    padding:9px 16px; border-radius:11px; border:none;
    background:transparent; color:#4a6a88;
    font-size:13px; font-family:'DM Sans',sans-serif; font-weight:500;
    cursor:pointer; transition:all .2s; white-space:nowrap; position:relative;
  }
  .adm-nav-btn:hover  { background:rgba(255,255,255,.05); color:#8ab0c8; }
  .adm-nav-btn.active {
    background:rgba(248,113,113,.1); color:#f87171; font-weight:700;
    box-shadow:inset 0 0 0 1px rgba(248,113,113,.2);
  }
  .adm-nav-btn.active::after {
    content:''; position:absolute; bottom:-1px; left:50%; transform:translateX(-50%);
    width:24px; height:2px; border-radius:99px;
    background:#f87171; box-shadow:0 0 8px rgba(248,113,113,.5);
  }

  .adm-logout {
    padding:9px 18px; border-radius:11px;
    background:rgba(248,113,113,.1); color:#f87171;
    border:1px solid rgba(248,113,113,.2);
    font-size:13px; font-family:'DM Sans',sans-serif; font-weight:600;
    cursor:pointer; transition:all .2s;
  }
  .adm-logout:hover { background:rgba(248,113,113,.2); }

  .adm-stat { transition:transform .25s, box-shadow .25s; }
  .adm-stat:hover { transform:translateY(-5px); box-shadow:0 20px 48px rgba(0,0,0,.45) !important; }

  .adm-tr:hover td { background:rgba(248,113,113,.03) !important; }

  .adm-search {
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
    border-radius:11px; padding:10px 16px 10px 38px;
    color:#e2f0ff; font-size:13px; font-family:'DM Sans',sans-serif;
    outline:none; width:220px; transition:border-color .2s;
  }
  .adm-search::placeholder { color:#2a4a62; }
  .adm-search:focus { border-color:rgba(248,113,113,.35); }

  .adm-select {
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
    border-radius:11px; padding:10px 14px; color:#8ab0c8;
    font-size:13px; font-family:'DM Sans',sans-serif; outline:none; cursor:pointer;
  }
  .adm-select option { background:#0c1e34; }
  .adm-select:focus  { border-color:rgba(248,113,113,.3); }

  .adm-action-btn {
    padding:5px 12px; border-radius:8px; border:none;
    font-size:11px; font-family:'DM Sans',sans-serif; font-weight:700;
    cursor:pointer; transition:all .2s; letter-spacing:.3px; text-transform:uppercase;
  }
  .adm-action-btn:hover { filter:brightness(1.15); transform:scale(1.05); }

  .adm-modal-bg {
    position:fixed; inset:0; background:rgba(0,0,0,.7);
    backdrop-filter:blur(6px); z-index:200;
    display:flex; align-items:center; justify-content:center; padding:20px;
    animation:adm-up .2s ease;
  }

  .adm-sector-row { transition:background .2s, transform .2s; }
  .adm-sector-row:hover { background:rgba(248,113,113,.04) !important; transform:translateX(3px); }
`;

function injectStyles() {
  if (document.getElementById('adm-styles')) return;
  const el = document.createElement('style');
  el.id = 'adm-styles'; el.textContent = CSS;
  document.head.appendChild(el);
}

/* ══════════════════════════════════════════════
   THEME
══════════════════════════════════════════════ */
const BG     = '#07111e';
const CARD   = 'rgba(255,255,255,.028)';
const BORDER = 'rgba(255,255,255,.07)';
const RED    = '#f87171';
const TEAL   = '#63d2be';
const GREEN  = '#4ade80';
const AMBER  = '#fbbf24';
const BLUE   = '#38bdf8';
const PURPLE = '#818cf8';

/* ══════════════════════════════════════════════
   MOCK DATA (fallback si API indisponible)
══════════════════════════════════════════════ */
const MOCK_REPORTS = [
  { id:1, company_name:'Société Nationale de Développement Financier', sector:'Finance',        upload_date:'2024-03-15', status:'valid',    compliance_score:85 },
  { id:2, company_name:'Clinique El Manar',                            sector:'Santé',          upload_date:'2024-03-12', status:'pending',  compliance_score:61 },
  { id:3, company_name:'Office National des Postes',                   sector:'Administration', upload_date:'2024-03-10', status:'valid',    compliance_score:74 },
  { id:4, company_name:"Société Tunisienne de l'Électricité",          sector:'Énergie',        upload_date:'2024-03-08', status:'pending',  compliance_score:55 },
  { id:5, company_name:'Tunisie Telecom',                              sector:'Télécoms',       upload_date:'2024-03-05', status:'valid',    compliance_score:79 },
  { id:6, company_name:'Groupe Poulina',                               sector:'Industrie',      upload_date:'2024-03-01', status:'rejected', compliance_score:42 },
  { id:7, company_name:"Banque de l'Habitat",                          sector:'Finance',        upload_date:'2024-02-28', status:'valid',    compliance_score:88 },
  { id:8, company_name:'Hôpital Charles Nicolle',                      sector:'Santé',          upload_date:'2024-02-25', status:'pending',  compliance_score:63 },
];

/* ══════════════════════════════════════════════
   PRIMITIVES
══════════════════════════════════════════════ */
function StatusBadge({ status }) {
  const cfg = {
    valid:    { color:GREEN,  label:'Validé'     },
    pending:  { color:AMBER,  label:'En attente' },
    rejected: { color:RED,    label:'Rejeté'     },
  }[status] || { color:BLUE, label:status };
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:`${cfg.color}14`, color:cfg.color, border:`1px solid ${cfg.color}28`, padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700, letterSpacing:'.4px', textTransform:'uppercase', whiteSpace:'nowrap' }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:cfg.color, boxShadow:`0 0 5px ${cfg.color}` }} />
      {cfg.label}
    </span>
  );
}

function SectionHeader({ icon, title, iconBg = RED }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'17px 22px', borderBottom:`1px solid ${BORDER}` }}>
      <div style={{ width:34, height:34, borderRadius:10, background:`${iconBg}18`, border:`1px solid ${iconBg}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>{icon}</div>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:'#b0cce0', letterSpacing:'.4px', textTransform:'uppercase' }}>{title}</h2>
    </div>
  );
}

function MiniBar({ value, color }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), 500); return () => clearTimeout(t); }, [value]);
  return (
    <div style={{ flex:1, height:6, background:'rgba(255,255,255,.06)', borderRadius:99, overflow:'hidden' }}>
      <div style={{ width:`${w}%`, height:'100%', background:`linear-gradient(90deg,${color}55,${color})`, borderRadius:99, transition:'width 1.2s cubic-bezier(.22,1,.36,1)', boxShadow:`0 0 8px ${color}44` }} />
    </div>
  );
}

/* ══════════════════════════════════════════════
   MODAL DÉTAIL RAPPORT
══════════════════════════════════════════════ */
function ReportModal({ report, onClose, onStatusChange }) {
  if (!report) return null;
  const scoreColor = report.compliance_score >= 75 ? GREEN : report.compliance_score >= 55 ? AMBER : RED;

  const changeStatus = (newStatus) => {
    onStatusChange(report.id, newStatus);
    onClose();
  };

  return (
    <div className="adm-modal-bg" onClick={onClose}>
      <div style={{ background:'#0c1e34', border:'1px solid rgba(255,255,255,.08)', borderRadius:22, width:'100%', maxWidth:500, boxShadow:'0 32px 80px rgba(0,0,0,.7)', overflow:'hidden' }}
        onClick={e => e.stopPropagation()}>

        {/* Header modal */}
        <div style={{ background:'linear-gradient(135deg,#0c1f3a,#0a2540)', padding:'22px 24px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,rgba(248,113,113,.3),transparent)', animation:'adm-scan 3s linear infinite' }} />
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'relative' }}>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:'#e4f2ff', marginBottom:6 }}>{report.company_name}</div>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <span style={{ fontSize:12, color:'#3d607a' }}>{report.sector}</span>
                <span style={{ color:'#1a3248' }}>·</span>
                <StatusBadge status={report.status} />
              </div>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.09)', borderRadius:'50%', width:32, height:32, color:'#4a6a88', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:'20px 24px' }}>
          {/* Score */}
          <div style={{ background:`${scoreColor}0d`, border:`1px solid ${scoreColor}22`, borderRadius:14, padding:'16px 20px', marginBottom:18, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:10, color:'#3d607a', textTransform:'uppercase', letterSpacing:'.5px', fontWeight:600, marginBottom:4 }}>Score de conformité</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:32, fontWeight:900, color:scoreColor, lineHeight:1 }}>{report.compliance_score}%</div>
            </div>
            <div style={{ width:70, height:70, borderRadius:'50%', background:`${scoreColor}10`, border:`2px solid ${scoreColor}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>
              {report.compliance_score >= 75 ? '✅' : report.compliance_score >= 55 ? '⚠️' : '❌'}
            </div>
          </div>

          {/* Details */}
          {[
            { label:'Entreprise',      value:report.company_name    },
            { label:'Secteur',         value:report.sector          },
            { label:'Date de dépôt',   value:new Date(report.upload_date).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' }) },
            { label:'Statut actuel',   value:<StatusBadge status={report.status} /> },
          ].map(({label,value}) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid rgba(255,255,255,.04)` }}>
              <span style={{ fontSize:11, color:'#3d607a', textTransform:'uppercase', letterSpacing:'.4px', fontWeight:600 }}>{label}</span>
              <span style={{ fontSize:13, color:'#c8dff4', fontWeight:500 }}>{value}</span>
            </div>
          ))}

          {/* Actions */}
          <div style={{ display:'flex', gap:10, marginTop:20 }}>
            {report.status !== 'valid' && (
              <button onClick={() => changeStatus('valid')} style={{ flex:1, padding:'12px', background:`${GREEN}18`, color:GREEN, border:`1px solid ${GREEN}28`, borderRadius:12, fontSize:13, fontFamily:"'DM Sans',sans-serif", fontWeight:700, cursor:'pointer', transition:'all .2s' }}>
                ✅ Valider
              </button>
            )}
            {report.status !== 'rejected' && (
              <button onClick={() => changeStatus('rejected')} style={{ flex:1, padding:'12px', background:`${RED}18`, color:RED, border:`1px solid ${RED}28`, borderRadius:12, fontSize:13, fontFamily:"'DM Sans',sans-serif", fontWeight:700, cursor:'pointer', transition:'all .2s' }}>
                ❌ Rejeter
              </button>
            )}
            {report.status !== 'pending' && (
              <button onClick={() => changeStatus('pending')} style={{ flex:1, padding:'12px', background:`${AMBER}18`, color:AMBER, border:`1px solid ${AMBER}28`, borderRadius:12, fontSize:13, fontFamily:"'DM Sans',sans-serif", fontWeight:700, cursor:'pointer', transition:'all .2s' }}>
                ⏳ En attente
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   TAB: RAPPORTS
══════════════════════════════════════════════ */
function TabReports() {
  const [reports,    setReports]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState('');
  const [filterStat, setFilterStat] = useState('all');
  const [filterSect, setFilterSect] = useState('all');
  const [selected,   setSelected]   = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get('/reports/all');
        setReports(res.data?.data || res.data || []);
      } catch {
        // ✅ Plus de données mock — affiche état vide avec instructions
        setError("backend_offline");
        setReports([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const sectors = [...new Set(reports.map(r => r.sector).filter(Boolean))];

  const filtered = reports.filter(r => {
    const matchSearch = r.company_name?.toLowerCase().includes(search.toLowerCase());
    const matchStat   = filterStat === 'all' || r.status === filterStat;
    const matchSect   = filterSect === 'all' || r.sector === filterSect;
    return matchSearch && matchStat && matchSect;
  });

  const handleStatusChange = (id, newStatus) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status:newStatus } : r));
  };

  const thTd = { padding:'11px 16px', textAlign:'left', fontSize:12 };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'50vh', flexDirection:'column', gap:14 }}>
      <div style={{ width:40, height:40, border:`3px solid rgba(248,113,113,.15)`, borderTop:`3px solid ${RED}`, borderRadius:'50%', animation:'adm-spin 1s linear infinite' }} />
      <p style={{ color:'#3d607a', fontSize:13 }}>Chargement des rapports...</p>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Error banner — backend offline */}
      {error === 'backend_offline' && (
        <div style={{ background:'rgba(251,191,36,.06)', border:'1px solid rgba(251,191,36,.18)', borderRadius:16, padding:'20px 24px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <span style={{ fontSize:20 }}>⚠️</span>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:AMBER, fontSize:14 }}>Backend indisponible — aucun rapport chargé</span>
          </div>
          <div style={{ fontSize:13, color:'#4a6a88', lineHeight:1.8 }}>
            Pour voir les vrais rapports des entreprises, suivez ces étapes :
          </div>
          <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { n:'1', text:'Ouvrez un terminal dans le dossier pfe-backend', code:'cd C:\\Users\\mahak\\pfe-backend' },
              { n:'2', text:'Démarrez le serveur', code:'npm run dev' },
              { n:'3', text:'Vérifiez que PostgreSQL est lancé et que la base ancs_db existe', code:null },
            ].map(({n, text, code}) => (
              <div key={n} style={{ display:'flex', gap:12, alignItems:'flex-start', background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)', borderRadius:10, padding:'10px 14px' }}>
                <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(251,191,36,.15)', border:'1px solid rgba(251,191,36,.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:AMBER, flexShrink:0 }}>{n}</div>
                <div>
                  <div style={{ fontSize:12, color:'#8ab0c8', marginBottom: code ? 4 : 0 }}>{text}</div>
                  {code && <code style={{ fontSize:11, color:'#63d2be', background:'rgba(99,210,190,.08)', padding:'2px 8px', borderRadius:6 }}>{code}</code>}
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => { setError(null); setLoading(true); API.get('/reports/all').then(res => { setReports(res.data?.data || res.data || []); setLoading(false); }).catch(() => { setError('backend_offline'); setLoading(false); }); }}
            style={{ marginTop:14, padding:'9px 20px', background:'rgba(251,191,36,.12)', color:AMBER, border:'1px solid rgba(251,191,36,.25)', borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", fontWeight:600, cursor:'pointer' }}>
            🔄 Réessayer
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="adm-anim" style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:18, padding:'16px 20px', display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:180 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:14, color:'#2a4a62' }}>🔍</span>
          <input className="adm-search" placeholder="Rechercher une entreprise..." value={search} onChange={e => setSearch(e.target.value)} style={{ width:'100%' }} />
        </div>
        <select className="adm-select" value={filterStat} onChange={e => setFilterStat(e.target.value)}>
          <option value="all">Tous les statuts</option>
          <option value="valid">Validé</option>
          <option value="pending">En attente</option>
          <option value="rejected">Rejeté</option>
        </select>
        <select className="adm-select" value={filterSect} onChange={e => setFilterSect(e.target.value)}>
          <option value="all">Tous les secteurs</option>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ fontSize:12, color:'#3d607a', marginLeft:'auto', whiteSpace:'nowrap' }}>
          {filtered.length} rapport{filtered.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="adm-anim" style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:20, overflow:'hidden' }}>
        <SectionHeader icon="📋" title="Liste des rapports d'audit" iconBg={RED} />
        <div style={{ overflowX:'auto' }}>
          <table className="adm-tr" style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'rgba(248,113,113,.07)', borderBottom:`1px solid rgba(248,113,113,.12)` }}>
                {['Entreprise', 'Secteur', 'Date de dépôt', 'Score', 'Statut', 'Action'].map(h => (
                  <th key={h} style={{ ...thTd, color:RED, fontWeight:700, fontFamily:"'Syne',sans-serif", fontSize:11, letterSpacing:'.5px', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:'40px', color:'#2a4a62', fontSize:13 }}>Aucun rapport trouvé</td></tr>
              ) : filtered.map(r => {
                const scoreColor = r.compliance_score >= 75 ? GREEN : r.compliance_score >= 55 ? AMBER : RED;
                return (
                  <tr key={r.id} style={{ borderBottom:`1px solid rgba(255,255,255,.03)` }}>
                    <td style={{ ...thTd }}>
                      <div style={{ fontWeight:600, color:'#c8dff4', fontSize:13 }}>{r.company_name}</div>
                    </td>
                    <td style={{ ...thTd, color:'#4a6a88', fontSize:12 }}>{r.sector}</td>
                    <td style={{ ...thTd, color:'#3d607a', fontSize:12 }}>
                      {new Date(r.upload_date).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' })}
                    </td>
                    <td style={{ ...thTd }}>
                      <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, color:scoreColor, fontSize:14 }}>{r.compliance_score}%</span>
                    </td>
                    <td style={{ ...thTd }}><StatusBadge status={r.status} /></td>
                    <td style={{ ...thTd }}>
                      <button className="adm-action-btn" onClick={() => setSelected(r)}
                        style={{ background:'rgba(99,210,190,.1)', color:TEAL, border:`1px solid rgba(99,210,190,.2)` }}>
                        Détails →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <ReportModal
          report={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN ADMIN DASHBOARD
══════════════════════════════════════════════ */
export default function AdminDashboard() {
  const navigate = useNavigate();

  // ✅ FIX : useSearchParams au lieu de useEffect([navigate])
  // Avant : useEffect avec [navigate] dans les deps → risque de boucle
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    injectStyles();

    const userStr = localStorage.getItem('user');
    if (!userStr) { navigate('/'); return; }

    const user = JSON.parse(userStr);

    // ✅ FIX : vérification du rôle admin
    // Avant : n'importe quel utilisateur connecté pouvait accéder à /admin/dashboard
    if (user.role !== 'admin') {
      navigate('/client/dashboard');
      return;
    }

    setAdmin(user);
    return () => document.getElementById('adm-styles')?.remove();
  }, []);

  const goTo = (tab) => setSearchParams({ tab });

  const handleLogout = () => {
    localStorage.removeItem('extractedData');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const TABS = [
    { id:'dashboard', icon:'📊', label:'Dashboard national' },
    { id:'reports',   icon:'📋', label:'Gestion des Rapports' },
    { id:'stats',     icon:'📈', label:'Analyses Avancées'   },
  ];

  const initials = admin ? (admin.username || 'A').charAt(0).toUpperCase() : 'A';

  return (
    <div className="adm-root" style={{ minHeight:'100vh', background:BG, color:'#e2f0ff' }}>

      {/* ══ NAVBAR ══ */}
      <nav style={{
        background:'rgba(8,20,36,.93)', backdropFilter:'blur(16px)',
        borderBottom:'1px solid rgba(255,255,255,.06)',
        padding:'0 28px', display:'flex', alignItems:'center',
        justifyContent:'space-between', height:60,
        position:'sticky', top:0, zIndex:100,
        boxShadow:'0 4px 24px rgba(0,0,0,.4)',
      }}>
        {/* Brand */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, background:'linear-gradient(135deg,#5c0d0d,#8b1a1a)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, boxShadow:'0 0 0 1px rgba(248,113,113,.25)' }}>
            🛡️
          </div>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:14, color:'#e4f2ff', lineHeight:1 }}>ANCS</div>
            <div style={{ fontSize:10, color:'#3d607a', letterSpacing:'.5px', textTransform:'uppercase', marginTop:1 }}>Administration</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.05)', borderRadius:14, padding:'4px' }}>
          {TABS.map(t => (
            <button key={t.id} className={`adm-nav-btn${activeTab === t.id ? ' active' : ''}`} onClick={() => goTo(t.id)}>
              <span style={{ fontSize:14 }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Right */}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {admin && (
            <div style={{ display:'flex', alignItems:'center', gap:9, padding:'5px 12px', background:'rgba(248,113,113,.06)', border:'1px solid rgba(248,113,113,.12)', borderRadius:99 }}>
              <div style={{ width:26, height:26, background:'linear-gradient(135deg,#5c0d0d,#8b1a1a)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#fca5a5', fontFamily:"'Syne',sans-serif" }}>
                {initials}
              </div>
              <span style={{ fontSize:12, color:'#4a6a88' }}>{admin.username || admin.email}</span>
              <span style={{ fontSize:10, background:'rgba(248,113,113,.12)', color:RED, padding:'2px 7px', borderRadius:99, fontWeight:700, letterSpacing:'.3px', textTransform:'uppercase' }}>Admin</span>
            </div>
          )}
          <button className="adm-logout" onClick={handleLogout}>Déconnexion</button>
        </div>
      </nav>

      {/* ══ CONTENT ══ */}
      <div style={{ padding:'28px 24px', minHeight:'calc(100vh - 60px)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          {activeTab === 'dashboard' && <NationalDashboard />}
          {activeTab === 'reports'   && <TabReports />}
          {activeTab === 'stats'     && (
            <div className="adm-anim" style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:20, padding:'32px' }}>
              <SectionHeader icon="📈" title="Analyses Avancées par Secteur" iconBg={BLUE} />
              <div style={{ marginTop:24, display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
                <div style={{ background:'rgba(255,255,255,.02)', padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,.05)' }}>
                  <h3 style={{ fontSize:14, color:TEAL, marginBottom:16, fontFamily:"'Syne',sans-serif" }}>Répartition des Risques</h3>
                  <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'#3d607a', fontSize:12 }}>
                    [Graphique d'évolution des risques en cours de chargement...]
                  </div>
                </div>
                <div style={{ background:'rgba(255,255,255,.02)', padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,.05)' }}>
                  <h3 style={{ fontSize:14, color:BLUE, marginBottom:16, fontFamily:"'Syne',sans-serif" }}>Maturité Moyenne (ANCS)</h3>
                  <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'#3d607a', fontSize:12 }}>
                    [Graphique de maturité par secteur en cours de chargement...]
                  </div>
                </div>
              </div>
              <div style={{ marginTop:24, padding:20, background:'rgba(248,113,113,.05)', borderRadius:16, border:'1px solid rgba(248,113,113,.1)' }}>
                <h3 style={{ fontSize:13, color:RED, marginBottom:12, fontWeight:700 }}>Alertes Critiques Nationales</h3>
                <ul style={{ listStyle:'none', padding:0, fontSize:12, color:'#8ab0c8', display:'flex', flexDirection:'column', gap:10 }}>
                  <li style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:RED }} />
                    Secteur Finance : 3 organismes sans PSSI mise à jour depuis 2 ans.
                  </li>
                  <li style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:AMBER }} />
                    Secteur Santé : Augmentation de 15% des risques liés à la sauvegarde.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}