import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../../services/api';
import UserManagement from './UserManagement';

/* ══════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  @keyframes adm-up   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes adm-spin { to{transform:rotate(360deg)} }
  @keyframes adm-glow { 0%,100%{opacity:.25} 50%{opacity:.65} }
  @keyframes adm-scan { 0%{top:0;opacity:.6} 100%{top:100%;opacity:0} }

  .adm-root * { box-sizing:border-box; margin:0; padding:0; }
  .adm-root   { font-family:'DM Sans',sans-serif; }
  .adm-anim   { animation:adm-up .5s ease both; }

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
  if (typeof document === 'undefined') return;
  if (document.getElementById('adm-styles')) return;
  const el = document.createElement('style');
  el.id = 'adm-styles'; el.textContent = CSS;
  document.head.appendChild(el);
}

/* ══════════════════════════════════════════════
   THEME
══════════════════════════════════════════════ */
const RED    = '#f87171';
const GREEN  = '#4ade80';
const AMBER  = '#fbbf24';
const BLUE   = '#38bdf8';
const CARD   = 'rgba(255,255,255,.028)';
const BORDER = 'rgba(255,255,255,.07)';

/* ══════════════════════════════════════════════
   PRIMITIVES
══════════════════════════════════════════════ */
function StatusBadge({ status }) {
  const cfg = {
    valid:     { color: GREEN, label: 'Validé'     },
    validated: { color: GREEN, label: 'Validé'     },
    pending:   { color: AMBER, label: 'En attente' },
    rejected:  { color: RED,   label: 'Rejeté'     },
  }[status] || { color: BLUE, label: status };
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:`${cfg.color}14`, color:cfg.color, border:`1px solid ${cfg.color}28`, padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700, letterSpacing:'.4px', textTransform:'uppercase', whiteSpace:'nowrap' }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:cfg.color, boxShadow:`0 0 5px ${cfg.color}` }} />
      {cfg.label}
    </span>
  );
}

function SectionHeader({ icon, title, iconBg = RED }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'17px 22px', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
      <div style={{ width:34, height:34, borderRadius:10, background:`${iconBg}18`, border:`1px solid ${iconBg}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>{icon}</div>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:'#b0cce0', letterSpacing:'.4px', textTransform:'uppercase' }}>{title}</h2>
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
        <div style={{ background:'linear-gradient(135deg,#0c1f3a,#0a2540)', padding:'22px 24px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
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
        <div style={{ padding:'20px 24px' }}>
          <div style={{ background:`${scoreColor}0d`, border:`1px solid ${scoreColor}22`, borderRadius:14, padding:'16px 20px', marginBottom:18, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:10, color:'#3d607a', textTransform:'uppercase', letterSpacing:'.5px', fontWeight:600, marginBottom:4 }}>Score de conformité</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:32, fontWeight:900, color:scoreColor, lineHeight:1 }}>{report.compliance_score}%</div>
            </div>
            <div style={{ fontSize:24 }}>📊</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
            <div style={{ background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.05)', borderRadius:12, padding:'12px 14px' }}>
              <div style={{ fontSize:10, color:'#3d607a', textTransform:'uppercase', fontWeight:600, marginBottom:5 }}>ID Rapport</div>
              <div style={{ fontSize:13, color:'#8ab0c8', fontWeight:500 }}>#RPT-{String(report.id).padStart(4,'0')}</div>
            </div>
            <div style={{ background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.05)', borderRadius:12, padding:'12px 14px' }}>
              <div style={{ fontSize:10, color:'#3d607a', textTransform:'uppercase', fontWeight:600, marginBottom:5 }}>Date de dépôt</div>
              <div style={{ fontSize:13, color:'#8ab0c8', fontWeight:500 }}>
                {report.upload_date ? new Date(report.upload_date).toLocaleDateString('fr-FR') : '—'}
              </div>
            </div>
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,.05)', paddingTop:20, display:'flex', gap:12 }}>
            <button className="adm-action-btn" onClick={()=>changeStatus('validated')} style={{ flex:1, padding:12, background:GREEN, color:'#07111e' }}>Valider</button>
            <button className="adm-action-btn" onClick={()=>changeStatus('rejected')}  style={{ flex:1, padding:12, background:'rgba(248,113,113,.15)', color:RED, border:`1px solid ${RED}33` }}>Rejeter</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   DASHBOARD PRINCIPAL
══════════════════════════════════════════════ */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [reports,   setReports]   = useState([]);
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [query,     setQuery]     = useState('');
  const [filterSec, setFilterSec] = useState('All');
  const [selected,  setSelected]  = useState(null);

  useEffect(() => {
    injectStyles();
    const user = localStorage.getItem('user');
    if (!user) { navigate('/secure-access'); return; }
    try {
      const u = JSON.parse(user);
      const isAdminUser = (role) => {
        const r = String(role || '').toLowerCase().trim();
        return r === 'admin' || r === 'administrateur';
      };
      if (!isAdminUser(u.role)) navigate('/');
    } catch { navigate('/secure-access'); }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [rRes, sRes] = await Promise.all([
          API.get('/reports/all'),
          API.get('/stats/national'),
        ]);

        const reportsData = rRes.data?.data || rRes.data || [];
        setReports(reportsData);

        const globalStats = sRes.data?.global || {};
        setStats({
          total_users:     parseInt(globalStats.total_organisms)  || 0,
          valid_reports:   parseInt(globalStats.validated_count)  || 0,
          pending_reports: parseInt(globalStats.pending_count)    || 0,
          avg_score:       parseFloat(globalStats.avg_score)      || 0,
          sector_stats:    sRes.data?.sectors?.map(s => ({
            sector: s.sector,
            count:  parseInt(s.total) || 0,
          })) || [],
        });
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Impossible de charger les données. Vérifiez que le backend est démarré.');
        setReports([]);
        setStats({ total_users:0, valid_reports:0, pending_reports:0, avg_score:0, sector_stats:[] });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const updateStatus = async (id, status) => {
    try {
      await API.patch(`/reports/${id}/status`, { status });
      setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch {
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const handleLogout = () => { localStorage.clear(); navigate('/secure-access'); };

  const filtered = reports.filter(r => {
    const name   = (r.company_name || r.organism_name || '').toLowerCase();
    const sector = r.sector || r.organism_sector || '';
    return name.includes(query.toLowerCase()) && (filterSec === 'All' || sector === filterSec);
  });

  const sectors = ['All', ...new Set(reports.map(r => r.sector || r.organism_sector).filter(Boolean))];

  if (loading) return (
    <div style={{ height:'100vh', background:'#07111e', display:'flex', alignItems:'center', justifyContent:'center', color:RED }}>
      <div style={{ width:40, height:40, border:'3px solid rgba(248,113,113,.2)', borderTopColor:RED, borderRadius:'50%', animation:'adm-spin .8s linear infinite' }} />
    </div>
  );

  return (
    <div className="adm-root" style={{ background:'#07111e', minHeight:'100vh', color:'#e2f0ff' }}>

      {/* ── TOP NAV ── */}
      <nav style={{ height:70, borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', background:'rgba(7,17,30,.8)', backdropFilter:'blur(12px)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:40 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, background:'linear-gradient(135deg,#f87171,#991b1b)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, boxShadow:'0 8px 16px rgba(248,113,113,.2)' }}>🛡️</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:17, letterSpacing:'-.5px' }}>ANCS <span style={{ color:RED }}>Admin</span></div>
          </div>
          {/* ── 3 tabs only — Analyses Nationales moved to Décideur ── */}
          <div style={{ display:'flex', gap:6 }}>
            <button className={`adm-nav-btn ${activeTab==='overview'?'active':''}`} onClick={()=>setSearchParams({tab:'overview'})}>Vue d'ensemble</button>
            <button className={`adm-nav-btn ${activeTab==='reports'?'active':''}`}  onClick={()=>setSearchParams({tab:'reports'})}>Rapports reçus</button>
            <button className={`adm-nav-btn ${activeTab==='users'?'active':''}`}    onClick={()=>setSearchParams({tab:'users'})}>Gestion utilisateurs</button>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <div style={{ textAlign:'right', lineHeight:1.2 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#f87171' }}>Administrateur</div>
            <div style={{ fontSize:11, color:'#4a6a88' }}>Session active</div>
          </div>
          <button className="adm-logout" onClick={handleLogout}>Déconnexion</button>
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <main style={{ padding:32, maxWidth:1400, margin:'0 auto' }}>

        {error && (
          <div style={{ background:'rgba(248,113,113,.08)', border:'1px solid rgba(248,113,113,.2)', borderRadius:14, padding:'12px 20px', marginBottom:24, color:RED, fontSize:13 }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── USERS ── */}
        {activeTab === 'users' ? (
          <UserManagement />

        /* ── REPORTS ── */
        ) : activeTab === 'reports' ? (
          <div className="adm-anim">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24 }}>
              <div>
                <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, marginBottom:6 }}>Gestion des Rapports</h1>
                <p style={{ fontSize:13, color:'#4a6a88' }}>Validez ou rejetez les audits de conformité déposés par les organismes.</p>
              </div>
              <div style={{ display:'flex', gap:12 }}>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:14, top:11, fontSize:14 }}>🔍</span>
                  <input className="adm-search" placeholder="Rechercher un organisme..." value={query} onChange={e=>setQuery(e.target.value)} />
                </div>
                <select className="adm-select" value={filterSec} onChange={e=>setFilterSec(e.target.value)}>
                  {sectors.map(s => <option key={s} value={s}>{s === 'All' ? 'Tous les secteurs' : s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.06)', borderRadius:20, overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', textAlign:'left' }}>
                <thead>
                  <tr style={{ background:'rgba(255,255,255,.03)', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
                    {['Organisme','Secteur','Date dépôt','Score','Statut','Action'].map(h => (
                      <th key={h} style={{ padding:'16px 22px', fontSize:11, fontWeight:700, color:'#4a6a88', textTransform:'uppercase', letterSpacing:'.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => {
                    const name   = r.company_name || r.organism_name || '—';
                    const sector = r.sector       || r.organism_sector || '—';
                    const score  = r.compliance_score || 0;
                    const date   = r.upload_date ? new Date(r.upload_date).toLocaleDateString('fr-FR') : '—';
                    return (
                      <tr key={r.id} className="adm-tr" style={{ borderBottom:'1px solid rgba(255,255,255,.03)' }}>
                        <td style={{ padding:'18px 22px' }}>
                          <div style={{ fontSize:14, fontWeight:600, color:'#e2f0ff' }}>{name}</div>
                          <div style={{ fontSize:11, color:'#3d607a', marginTop:2 }}>ID: #RPT-{String(r.id).padStart(4,'0')}</div>
                        </td>
                        <td style={{ padding:'18px 22px', fontSize:13, color:'#8ab0c8' }}>{sector}</td>
                        <td style={{ padding:'18px 22px', fontSize:13, color:'#8ab0c8' }}>{date}</td>
                        <td style={{ padding:'18px 22px' }}>
                          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color: score>=75?GREEN:score>=55?AMBER:RED }}>{score}%</span>
                        </td>
                        <td style={{ padding:'18px 22px' }}><StatusBadge status={r.status} /></td>
                        <td style={{ padding:'18px 22px' }}>
                          <button className="adm-action-btn" onClick={()=>setSelected({...r, company_name:name, sector})} style={{ background:'rgba(255,255,255,.06)', color:'#8ab0c8', border:'1px solid rgba(255,255,255,.1)' }}>Détails</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div style={{ padding:60, textAlign:'center', color:'#3d607a' }}>
                  <div style={{ fontSize:32, marginBottom:16 }}>📂</div>
                  <div style={{ fontSize:15, fontWeight:500 }}>Aucun rapport trouvé</div>
                </div>
              )}
            </div>
          </div>

        /* ── VUE D'ENSEMBLE ── */
        ) : (
          <div className="adm-anim">
            <div style={{ marginBottom:32 }}>
              <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, marginBottom:8 }}>Dashboard <span style={{ color:RED }}>Overview</span></h1>
              <p style={{ color:'#4a6a88' }}>Indicateurs de performance et statistiques globales du parc.</p>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:24, marginBottom:32 }}>
              {[
                { label:'Organismes inscrits', val: stats?.total_users     || 0,    color:BLUE,  icon:'🏢' },
                { label:'Rapports validés',    val: stats?.valid_reports   || 0,    color:GREEN, icon:'✅' },
                { label:'En attente',          val: stats?.pending_reports || 0,    color:AMBER, icon:'⏳' },
                { label:'Score Moyen',         val: `${Math.round(stats?.avg_score || 0)}%`, color:RED, icon:'📈' },
              ].map((s,i) => (
                <div key={i} className="adm-stat" style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:24, padding:28, position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:-20, right:-20, fontSize:80, opacity:.03 }}>{s.icon}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#4a6a88', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:16 }}>{s.label}</div>
                  <div style={{ fontSize:36, fontWeight:800, fontFamily:"'Syne',sans-serif" }}>{s.val}</div>
                  <div style={{ height:4, width:40, background:s.color, borderRadius:99, marginTop:16 }} />
                </div>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:24 }}>
              <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:24, overflow:'hidden' }}>
                <SectionHeader icon="📊" title="Répartition par secteur" iconBg={BLUE} />
                <div style={{ padding:24 }}>
                  {stats?.sector_stats?.length > 0 ? stats.sector_stats.map((s,i) => (
                    <div key={i} className="adm-sector-row" style={{ marginBottom:18 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:13 }}>
                        <span style={{ fontWeight:600 }}>{s.sector}</span>
                        <span style={{ color:'#4a6a88' }}>{s.count} rapport{s.count>1?'s':''}</span>
                      </div>
                      <div style={{ height:8, background:'rgba(255,255,255,.05)', borderRadius:99, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${stats.total_users ? (s.count/stats.total_users)*100 : 0}%`, background:BLUE, borderRadius:99 }} />
                      </div>
                    </div>
                  )) : (
                    <div style={{ color:'#3d607a', fontSize:13, textAlign:'center', padding:20 }}>Aucune donnée disponible</div>
                  )}
                </div>
              </div>

              <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:24, overflow:'hidden' }}>
                <SectionHeader icon="⚡" title="Dernières Activités" iconBg={AMBER} />
                <div style={{ padding:24 }}>
                  {reports.slice(0,5).map((r,i) => {
                    const name = r.company_name || r.organism_name || 'Organisme inconnu';
                    const date = r.upload_date ? new Date(r.upload_date).toLocaleDateString('fr-FR') : '—';
                    return (
                      <div key={i} style={{ display:'flex', gap:14, marginBottom:20, paddingBottom:16, borderBottom:i===4?'none':'1px solid rgba(255,255,255,.03)' }}>
                        <div style={{ width:40, height:40, borderRadius:12, background:'rgba(255,255,255,.03)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>📄</div>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:'#e2f0ff' }}>Nouveau rapport : {name}</div>
                          <div style={{ fontSize:11, color:'#3d607a', marginTop:3 }}>Déposé le {date}</div>
                        </div>
                      </div>
                    );
                  })}
                  {reports.length === 0 && (
                    <div style={{ color:'#3d607a', fontSize:13, textAlign:'center', padding:20 }}>Aucune activité récente</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {selected && <ReportModal report={selected} onClose={()=>setSelected(null)} onStatusChange={updateStatus} />}
    </div>
  );
}