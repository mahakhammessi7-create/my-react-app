import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
 import API from '../../services/api';

/* ══════════════════════════════════════════════
  THEME
══════════════════════════════════════════════ */
const T = {
  bg:      '#07111e',
  surface: 'rgba(255,255,255,.028)',
  border:  'rgba(255,255,255,.07)',
  teal:    '#63d2be',
  green:   '#4ade80',
  amber:   '#fbbf24',
  red:     '#f87171',
  purple:  '#818cf8',
  blue:    '#38bdf8',
  muted:   '#3d607a',
  text:    '#c8dff4',
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

@keyframes tri-fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
@keyframes tri-pulse    { 0%,100%{opacity:.4} 50%{opacity:1} }
@keyframes tri-spin     { to{transform:rotate(360deg)} }
@keyframes tri-barFill  { from{width:0} }
@keyframes tri-shimmer  {
  0%   { background-position: -400px 0 }
  100% { background-position:  400px 0 }
}

.tri-root { font-family:'DM Sans',sans-serif; color:${T.text}; }
.tri-root * { box-sizing:border-box; margin:0; padding:0; }

/* staggered children */
.tri-stagger > *:nth-child(1){animation:tri-fadeUp .45s .04s both}
.tri-stagger > *:nth-child(2){animation:tri-fadeUp .45s .10s both}
.tri-stagger > *:nth-child(3){animation:tri-fadeUp .45s .16s both}
.tri-stagger > *:nth-child(4){animation:tri-fadeUp .45s .22s both}
.tri-stagger > *:nth-child(5){animation:tri-fadeUp .45s .28s both}
.tri-stagger > *:nth-child(6){animation:tri-fadeUp .45s .34s both}

/* scrollbar */
.tri-root ::-webkit-scrollbar        { width:5px; height:5px }
.tri-root ::-webkit-scrollbar-track  { background:transparent }
.tri-root ::-webkit-scrollbar-thumb  { background:rgba(99,210,190,.25); border-radius:99px }

/* report list */
.tri-report-row {
  display:flex; align-items:center; gap:14px;
  padding:14px 18px;
  border:1px solid ${T.border};
  border-radius:14px;
  background:${T.surface};
  cursor:pointer;
  transition:border-color .2s, background .2s, transform .2s;
}
.tri-report-row:hover, .tri-report-row.active {
  border-color:rgba(99,210,190,.3);
  background:rgba(99,210,190,.04);
  transform:translateX(4px);
}
.tri-report-row.active { border-color:${T.teal}; }

/* field card */
.tri-field-card {
  border:1px solid ${T.border};
  border-radius:14px;
  background:${T.surface};
  overflow:hidden;
  transition:border-color .2s, transform .2s;
  cursor:pointer;
}
.tri-field-card:hover  { border-color:rgba(99,210,190,.2); transform:translateX(3px); }
.tri-field-card.open   { border-color:rgba(99,210,190,.35); }

/* annotation panel */
.tri-ann-panel {
  border-top:1px solid ${T.border};
  background:rgba(0,0,0,.18);
  padding:16px 20px;
  animation:tri-fadeUp .3s both;
}

/* inputs */
.tri-input, .tri-textarea {
  width:100%;
  background:rgba(255,255,255,.04);
  border:1px solid rgba(99,210,190,.2);
  border-radius:10px;
  color:${T.text};
  font-family:'DM Sans',sans-serif;
  font-size:13px;
  padding:10px 14px;
  outline:none;
  transition:border-color .2s;
  resize:vertical;
}
.tri-input:focus, .tri-textarea:focus { border-color:${T.teal}; }

/* buttons */
.tri-btn {
  display:inline-flex; align-items:center; gap:7px;
  padding:9px 18px;
  border-radius:10px;
  font-family:'DM Sans',sans-serif;
  font-size:13px;
  font-weight:600;
  cursor:pointer;
  border:none;
  transition:filter .2s, transform .15s;
}
.tri-btn:hover:not(:disabled) { filter:brightness(1.15); transform:translateY(-1px); }
.tri-btn:disabled { opacity:.45; cursor:not-allowed; }
.tri-btn-primary   { background:linear-gradient(135deg,${T.teal},#2eb8a0); color:#071520; }
.tri-btn-ghost     { background:rgba(99,210,190,.1); border:1px solid rgba(99,210,190,.2); color:${T.teal}; }
.tri-btn-danger    { background:rgba(248,113,113,.1); border:1px solid rgba(248,113,113,.2); color:${T.red}; }
.tri-btn-save      { background:rgba(74,222,128,.12); border:1px solid rgba(74,222,128,.25); color:${T.green}; }
.tri-btn-sm        { padding:6px 12px; font-size:12px; border-radius:8px; }

/* skeleton shimmer */
.tri-skeleton {
  background: linear-gradient(90deg, rgba(255,255,255,.04) 25%, rgba(99,210,190,.07) 50%, rgba(255,255,255,.04) 75%);
  background-size: 400px 100%;
  animation: tri-shimmer 1.4s infinite;
  border-radius: 8px;
}

/* progress bar */
.tri-bar-track { width:100%; height:7px; background:rgba(255,255,255,.06); border-radius:99px; overflow:hidden; }
.tri-bar-fill  { height:100%; border-radius:99px; animation:tri-barFill 1.2s cubic-bezier(.22,1,.36,1) both; }

/* status badge */
.tri-badge {
  display:inline-flex; align-items:center; gap:5px;
  padding:3px 10px; border-radius:99px;
  font-size:10px; font-weight:700; letter-spacing:.4px; text-transform:uppercase; white-space:nowrap;
}
`;

/* ── helpers ── */
const STATUS_META = {
  verified:     { label:'Vérifié',   color:T.green,  icon:'✓' },
  'needs-review':{ label:'À réviser', color:T.amber,  icon:'⚠' },
  corrected:    { label:'Corrigé',   color:T.blue,   icon:'✎' },
  flagged:      { label:'Signalé',   color:T.red,    icon:'🚩' },
};

const NIVEAUX = [
  { max:40, label:'Critique',     color:T.red   },
  { max:60, label:'Partiel',      color:T.amber },
  { max:80, label:'Satisfaisant', color:T.amber },
  { max:100,label:'Optimisé',     color:T.green },
];
const getNiveau = (v) => NIVEAUX.find(n => v <= n.max) || NIVEAUX[3];

function injectStyles() {
  if (document.getElementById('tri-styles')) return;
  const el = document.createElement('style');
  el.id = 'tri-styles';
  el.textContent = CSS;
  document.head.appendChild(el);
}

/* ══════════════════════════════════════════════
  BUILD FIELDS FROM A REPORT ROW (VERSION AMÉLIORÉE)
══════════════════════════════════════════════ */
function buildFields(report) {
  const details = (() => {
    try { return JSON.parse(report.compliance_details || '{}'); } catch { return {}; }
  })();

  const a3 = details.annexe3 || {};
  const a7 = details.annexe7 || {};
  const annexeStatus = details.annexe_status || {};

  const fields = [
    // ── Général (Annexe 1) ──
    { id:'f-name',     label:"Nom de l'organisme",     value: report.organism_name || details.annexe1?.nom_organisme || '—',     category:'Général',        confidence:95 },
    { id:'f-sector',   label:"Secteur d'activité",     value: report.organism_sector || details.annexe1?.secteur_activite || '—', category:'Général',        confidence:90 },
    { id:'f-acronym',  label:'Acronyme',               value: details.annexe1?.acronyme || '—',                                   category:'Général',        confidence:80 },
    { id:'f-statut',   label:'Statut juridique',       value: details.annexe1?.statut || '—',                                     category:'Général',        confidence:80 },
    { id:'f-email',    label:'Email contact',          value: details.annexe1?.adresse_email || '—',                               category:'Général',        confidence:80 },
    { id:'f-web',      label:'Site web',               value: details.annexe1?.site_web || '—',                                   category:'Général',        confidence:75 },

    // ── Gouvernance ──
    { id:'f-rssi',     label:'RSSI nommé',             value: report.has_rssi ?? details.has_rssi,   category:'Gouvernance', confidence:88 },
    { id:'f-pssi',     label:'PSSI documentée',        value: report.has_pssi ?? details.has_pssi,   category:'Gouvernance', confidence:85 },
    { id:'f-pca',      label:'PCA existant',           value: report.has_pca  ?? details.has_pca,    category:'Gouvernance', confidence:82 },
    { id:'f-pra',      label:'PRA existant',           value: report.has_pra  ?? details.has_pra,    category:'Gouvernance', confidence:82 },
    { id:'f-siem',     label:'SIEM déployé',           value: a7.indicateurs?.find(i => i.nom === 'SIEM')?.present ?? false,      category:'Gouvernance', confidence:78 },
    { id:'f-comite',   label:'Comité SSI',             value: a7.indicateurs?.find(i => i.nom === 'Comité SSI')?.present ?? false, category:'Gouvernance', confidence:78 },

    // ── Évaluation ──
    { id:'f-score',    label:'Score de conformité',    value: `${report.compliance_score ?? 0}%`,    category:'Évaluation',  confidence:92 },
    { id:'f-risk',     label:'Niveau de risque',       value: report.risk_score ?? details.risk_score ?? '—', category:'Évaluation', confidence:85 },
    { id:'f-maturity', label:'Niveau de maturité',     value: `${report.maturity_level ?? details.maturity_level ?? '—'} / 5`,   category:'Évaluation',  confidence:75 },

    // ── Infrastructure (Annexe 3) ──
    { id:'f-servers',  label:'Nombre de serveurs',     value: report.total_servers ?? a3.serveurs?.length ?? '—',                 category:'Infrastructure', confidence:88 },
    { id:'f-users',    label:"Nombre d'utilisateurs",  value: report.user_count ?? details.user_count ?? '—',                     category:'Infrastructure', confidence:80 },
    { id:'f-fw',       label:'Firewall',               value: report.has_firewall ?? details.has_firewall,                        category:'Infrastructure', confidence:85 },
    { id:'f-ids',      label:'IDS / IPS',              value: report.has_ids_ips ?? details.has_ids_ips,                          category:'Infrastructure', confidence:82 },
    { id:'f-mfa',      label:'MFA activé',             value: report.mfa_enabled ?? details.mfa_enabled,                         category:'Infrastructure', confidence:80 },
    { id:'f-vlan',     label:'Segmentation réseau',    value: report.network_segmentation ?? details.network_segmentation,        category:'Infrastructure', confidence:78 },
    { id:'f-av',       label:'Antivirus (%)',          value: `${report.antivirus_coverage_pct ?? details.antivirus_coverage_pct ?? 0}%`, category:'Infrastructure', confidence:80 },
    { id:'f-patch',    label:'Conformité patches (%)', value: `${report.patch_compliance_pct ?? details.patch_compliance_pct ?? 0}%`,    category:'Infrastructure', confidence:78 },

    // ── Sauvegarde ──
    { id:'f-backup',   label:'Politique de sauvegarde', value: report.backup_policy_exists ?? details.backup_policy_exists,        category:'Sauvegarde',  confidence:82 },
    { id:'f-bktest',   label:'Sauvegardes testées',    value: report.backup_tested ?? details.backup_tested,                      category:'Sauvegarde',  confidence:78 },
    { id:'f-bkoffsite',label:'Sauvegarde hors-site',   value: report.backup_offsite ?? details.backup_offsite,                    category:'Sauvegarde',  confidence:75 },
    { id:'f-bkfreq',   label:'Fréquence sauvegarde',   value: details.backup_frequency || '—',                                    category:'Sauvegarde',  confidence:70 },

    // ── Sécurité / Incidents ──
    { id:'f-incidents',label:'Incidents déclarés',     value: report.incidents_count ?? details.incidents_count ?? '—',           category:'Incidents',   confidence:70 },
    { id:'f-vulns',    label:'Vulnérabilités critiques',value: report.critical_vulns_open ?? details.critical_vulns_open ?? '—',  category:'Incidents',   confidence:70 },

    // ── Annexes — statut ──
    ...Object.entries(annexeStatus).map(([key, val]) => ({
      id: `f-${key}`,
      label: `${key.replace('annexe', 'Annexe ')} — ${val.title || 'Sans titre'}`,
      value: val.status === 'filled' ? 'Conforme' : val.status === 'partial' ? 'Partiel' : 'Vide',
      category: 'Statut des annexes',
      confidence: val.status === 'filled' ? 90 : val.status === 'partial' ? 60 : 30,
    })),
  ];

  // Filter out blanks and attach initial review status
  return fields
    .filter(f => f.value !== '—' && f.value !== undefined && f.value !== null)
    .map(f => ({ ...f, status: 'needs-review', annotations: [] }));
}

/* ══════════════════════════════════════════════
  SUB-COMPONENTS
══════════════════════════════════════════════ */
function Badge({ status }) {
  const m = STATUS_META[status] || STATUS_META['needs-review'];
  return (
    <span className="tri-badge" style={{ background:`${m.color}14`, color:m.color, border:`1px solid ${m.color}28` }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:m.color }} />
      {m.icon} {m.label}
    </span>
  );
}

function BarTrack({ value, color }) {
  return (
    <div className="tri-bar-track">
      <div className="tri-bar-fill" style={{ width:`${value}%`, background:`linear-gradient(90deg,${color}55,${color})`, boxShadow:`0 0 8px ${color}44` }} />
    </div>
  );
}

function Skeleton({ h = 18, w = '100%', style }) {
  return <div className="tri-skeleton" style={{ height:h, width:w, ...style }} />;
}

/* ══════════════════════════════════════════════
  REPORT SELECTOR PANEL
══════════════════════════════════════════════ */
function ReportSelector({ reports, selectedId, onSelect }) {
  const [search, setSearch] = useState('');
  const filtered = reports.filter(r =>
    (r.organism_name || r.company_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.organism_sector || r.sector || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <input
        className="tri-input"
        placeholder="🔍 Rechercher un organisme..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:380, overflowY:'auto', paddingRight:4 }}>
        {filtered.length === 0 && (
          <div style={{ padding:'20px', textAlign:'center', color:T.muted, fontSize:13 }}>Aucun rapport trouvé</div>
        )}
        {filtered.map(r => {
          const score = r.compliance_score || 0;
          const niv   = getNiveau(score);
          const name  = r.organism_name || r.company_name || 'Inconnu';
          const sector= r.organism_sector || r.sector || '—';
          const date  = r.upload_date ? new Date(r.upload_date).toLocaleDateString('fr-FR') : '—';
          return (
            <div key={r.id}
              className={`tri-report-row ${selectedId === r.id ? 'active' : ''}`}
              onClick={() => onSelect(r)}
            >
              <div style={{ width:40, height:40, borderRadius:12, background:`linear-gradient(135deg,#0d5580,#1a7a6e)`, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:15, fontFamily:"'Syne',sans-serif", flexShrink:0 }}>
                {name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#e2f0ff', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
                <div style={{ fontSize:11, color:T.muted }}>{sector} · {date}</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:14, fontWeight:800, color:niv.color, fontFamily:"'Syne',sans-serif" }}>{score}%</div>
                <div style={{ fontSize:10, color:T.muted }}>{r.status || 'pending'}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
  FIELD CARD
══════════════════════════════════════════════ */
function FieldCard({ field, onStatusChange, onSaveEdit, onAddAnnotation }) {
  const [open,   setOpen]   = useState(false);
  const [editing,setEditing]= useState(false);
  const [val,    setVal]    = useState(String(field.value ?? ''));
  const [annText,setAnnText]= useState('');

  const displayVal = typeof field.value === 'boolean'
    ? (field.value ? '✓ Oui' : '✗ Non')
    : String(field.value ?? '—');

  return (
    <div className={`tri-field-card ${open ? 'open' : ''}`}>
      {/* Header row */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 18px' }} onClick={() => setOpen(o => !o)}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:11, color:T.muted, textTransform:'uppercase', letterSpacing:'.5px', fontWeight:600, marginBottom:3 }}>{field.label}</div>
          {editing ? (
            <input className="tri-input" value={val} onChange={e => setVal(e.target.value)}
              onClick={e => e.stopPropagation()} autoFocus />
          ) : (
            <div style={{ fontSize:13, fontWeight:600, color:'#e2f0ff' }}>{displayVal}</div>
          )}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }} onClick={e => e.stopPropagation()}>
          {/* confidence bar */}
          {field.confidence && (
            <div style={{ width:60, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3 }}>
              <span style={{ fontSize:10, color:T.muted }}>{field.confidence}%</span>
              <BarTrack value={field.confidence} color={field.confidence >= 85 ? T.green : field.confidence >= 70 ? T.amber : T.red} />
            </div>
          )}
          <Badge status={field.status} />
          {editing ? (
            <>
              <button className="tri-btn tri-btn-save tri-btn-sm" onClick={() => { onSaveEdit(field.id, val); setEditing(false); }}>💾</button>
              <button className="tri-btn tri-btn-ghost tri-btn-sm" onClick={() => setEditing(false)}>✕</button>
            </>
          ) : (
            <button className="tri-btn tri-btn-ghost tri-btn-sm" onClick={() => setEditing(true)} title="Modifier">✎</button>
          )}
          <span style={{ color:T.muted, fontSize:12, transition:'transform .2s', display:'inline-block', transform: open ? 'rotate(90deg)':'rotate(0)' }}>›</span>
        </div>
      </div>

      {/* Expanded panel */}
      {open && (
        <div className="tri-ann-panel" onClick={e => e.stopPropagation()}>
          {/* Status controls */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
            {Object.entries(STATUS_META).map(([key, m]) => (
              <button key={key}
                className="tri-btn tri-btn-sm"
                style={{ background:`${m.color}12`, border:`1px solid ${m.color}28`, color:m.color,
                        opacity: field.status === key ? 1 : 0.55,
                        outline: field.status === key ? `1px solid ${m.color}` : 'none' }}
                onClick={() => onStatusChange(field.id, key)}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {/* Existing annotations */}
          {field.annotations?.length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:T.muted, textTransform:'uppercase', letterSpacing:'.5px', fontWeight:600, marginBottom:8 }}>Annotations</div>
              {field.annotations.map((a, i) => (
                <div key={i} style={{ background:'rgba(255,255,255,.03)', border:`1px solid ${T.border}`, borderRadius:10, padding:'10px 14px', marginBottom:6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:11, color:T.teal, fontWeight:600 }}>{a.author}</span>
                    <span style={{ fontSize:10, color:T.muted }}>{new Date(a.timestamp).toLocaleString('fr-FR', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit' })}</span>
                  </div>
                  <p style={{ fontSize:12, color:'#c8dff4', lineHeight:1.5 }}>{a.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add annotation */}
          <div style={{ fontSize:11, color:T.muted, textTransform:'uppercase', letterSpacing:'.5px', fontWeight:600, marginBottom:6 }}>💬 Ajouter une remarque / réserve</div>
          <textarea className="tri-textarea" rows={3}
            placeholder="Entrez votre commentaire, correction ou observation..."
            value={annText} onChange={e => setAnnText(e.target.value)}
          />
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
            <button className="tri-btn tri-btn-primary tri-btn-sm"
              disabled={!annText.trim()}
              onClick={() => { onAddAnnotation(field.id, annText); setAnnText(''); }}
            >
              Ajouter l'annotation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
  ANNEXES DISPLAY COMPONENT (Serveurs, Vulnérabilités, Plan d'action)
══════════════════════════════════════════════ */
function AnnexesDetails({ report }) {
  const details = (() => {
    try { return JSON.parse(report.compliance_details || '{}'); } catch { return {}; }
  })();
  
  const servers = details.annexe3?.serveurs || [];
  const vulns   = details.annexe8?.vulnerabilites || [];
  const actions = details.annexe9?.projets?.[0]?.actions || [];

  return (
    <>
      {servers.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:T.teal, textTransform:'uppercase', letterSpacing:'.6px' }}>Serveurs (Annexe 3)</h3>
            <div style={{ flex:1, height:1, background:T.border }} />
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, color:T.text }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                  {['Nom','IP','OS','Rôle','Type'].map(h => (
                    <th key={h} style={{ padding:'8px 12px', textAlign:'left', color:T.muted, fontWeight:600, fontSize:11, textTransform:'uppercase', letterSpacing:'.4px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {servers.map((s, i) => (
                  <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surface }}>
                    <td style={{ padding:'8px 12px' }}>{s.nom || '—'}</td>
                    <td style={{ padding:'8px 12px', fontFamily:'monospace', color:T.blue }}>{s.ip || '—'}</td>
                    <td style={{ padding:'8px 12px' }}>{s.os || '—'}</td>
                    <td style={{ padding:'8px 12px' }}>{s.role || '—'}</td>
                    <td style={{ padding:'8px 12px' }}>{s.type || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {vulns.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:T.red, textTransform:'uppercase', letterSpacing:'.6px' }}>Vulnérabilités critiques (Annexe 8)</h3>
            <div style={{ flex:1, height:1, background:T.border }} />
          </div>
          {vulns.map((v, i) => (
            <div key={i} style={{ background:T.surface, border:`1px solid rgba(248,113,113,.15)`, borderRadius:12, padding:'12px 16px', marginBottom:8 }}>
              <div style={{ fontWeight:600, fontSize:13, color:'#e2f0ff', marginBottom:4 }}>{v.nom}</div>
              <div style={{ display:'flex', gap:16, fontSize:11, color:T.muted }}>
                <span>Réf : {v.reference || '—'}</span>
                <span>Probabilité : {v.probabilite || '—'}</span>
              </div>
              {v.recommandation && <div style={{ marginTop:6, fontSize:12, color:T.text }}>{v.recommandation}</div>}
            </div>
          ))}
        </div>
      )}

      {actions.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:T.purple, textTransform:'uppercase', letterSpacing:'.6px' }}>Plan d'action (Annexe 9)</h3>
            <div style={{ flex:1, height:1, background:T.border }} />
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, color:T.text }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                  {['Action','Priorité','Responsable','Charge (H/J)','Date prévue'].map(h => (
                    <th key={h} style={{ padding:'8px 12px', textAlign:'left', color:T.muted, fontWeight:600, fontSize:11, textTransform:'uppercase', letterSpacing:'.4px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {actions.map((a, i) => {
                  const pColor = a.priorite?.toLowerCase().includes('haute') ? T.red : a.priorite?.toLowerCase().includes('moyenne') ? T.amber : T.green;
                  return (
                    <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.surface }}>
                      <td style={{ padding:'8px 12px' }}>{a.action || '—'}</td>
                      <td style={{ padding:'8px 12px' }}>
                        <span style={{ color: pColor, fontWeight:600 }}>{a.priorite || '—'}</span>
                      </td>
                      <td style={{ padding:'8px 12px' }}>{a.responsable || '—'}</td>
                      <td style={{ padding:'8px 12px', textAlign:'center' }}>{a.charge_hj || '—'}</td>
                      <td style={{ padding:'8px 12px' }}>{a.date_prevue || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════
  MAIN COMPONENT
══════════════════════════════════════════════ */
export default function TechnicalReviewInterface() {
  const navigate = useNavigate();
  const [reports,       setReports]       = useState([]);
  const [loadingList,   setLoadingList]   = useState(true);
  const [errorList,     setErrorList]     = useState(null);
  const [selectedReport,setSelectedReport]= useState(null);
  const [fields,        setFields]        = useState([]);
  const [filter,        setFilter]        = useState('all');
  const [saving,        setSaving]        = useState(false);
  const [toast,         setToast]         = useState(null);
  const [sidebarOpen,   setSidebarOpen]   = useState(true);

  useEffect(() => { injectStyles(); return () => document.getElementById('tri-styles')?.remove(); }, []);

  /* ── fetch all reports ── */
  useEffect(() => {
    API.get('/reports/all')
      .then(res => {
        const rows = res.data?.data || res.data?.reports || res.data || [];
        setReports(Array.isArray(rows) ? rows : []);
      })
      .catch(err => setErrorList(err.message))
      .finally(() => setLoadingList(false));
  }, []);

  /* ── select a report ── */
  const handleSelect = useCallback((report) => {
    setSelectedReport(report);
    setFields(buildFields(report));
    setFilter('all');
  }, []);

  /* ── field operations ── */
  const handleStatusChange = useCallback((fieldId, newStatus) => {
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, status:newStatus } : f));
    showToast(`Statut mis à jour : ${STATUS_META[newStatus]?.label}`);
  }, []);

  const handleSaveEdit = useCallback((fieldId, newVal) => {
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, value:newVal, status:'corrected' } : f));
    showToast('Valeur corrigée ✓');
  }, []);

  const handleAddAnnotation = useCallback((fieldId, text) => {
    const ann = { author:'Chargé d\'étude', text, timestamp:new Date().toISOString(), type:'comment' };
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, annotations:[...(f.annotations||[]), ann] } : f));
    showToast('Annotation ajoutée ✓');
  }, []);

  /* ── submit validation ── */
  const handleValidate = async () => {
    if (!selectedReport) return;
    setSaving(true);
    try {
      await API.patch(`/reports/${selectedReport.id}/status`, { status: 'validated' });

      await API.post(`/reports/${selectedReport.id}/review`, {
        report_id: selectedReport.id,
        fields: fields.map(f => ({ id:f.id, label:f.label, value:f.value, status:f.status, annotations:f.annotations })),
        validated_at: new Date().toISOString(),
      }).catch(() => {});

      setReports(prev => prev.map(r =>
        r.id === selectedReport.id ? { ...r, status:'validated' } : r
      ));
      showToast('✅ Rapport validé avec succès !', 'green');
    } catch(e) {
      showToast('Erreur lors de la validation', 'red');
    } finally {
      setSaving(false);
    }
  };

  /* ── export handler ── */
  const handleExport = () => {
    if (!selectedReport) return;
    const exportData = {
      report: selectedReport,
      review_fields: fields,
      exported_at: new Date().toISOString(),
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `rapport_${selectedReport.id}_review.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showToast('Export JSON effectué ✓', 'green');
  };

  /* ── toast ── */
  const showToast = (msg, type = 'teal') => {
    const color = type === 'green' ? T.green : type === 'red' ? T.red : T.teal;
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── stats ── */
  const stats = useMemo(() => {
    const total      = fields.length;
    const verified   = fields.filter(f => f.status === 'verified').length;
    const needsRev   = fields.filter(f => f.status === 'needs-review').length;
    const corrected  = fields.filter(f => f.status === 'corrected').length;
    const flagged    = fields.filter(f => f.status === 'flagged').length;
    const avgConf    = total ? Math.round(fields.reduce((s,f) => s+(f.confidence||0), 0) / total) : 0;
    return { total, verified, needsRev, corrected, flagged, avgConf };
  }, [fields]);

  /* ── filtered fields by category ── */
  const grouped = useMemo(() => {
    const shown = filter === 'all' ? fields : fields.filter(f => f.status === filter);
    const g = {};
    shown.forEach(f => { (g[f.category] = g[f.category] || []).push(f); });
    return g;
  }, [fields, filter]);

  /* ── RENDER ── */
  return (
    <div className="tri-root" style={{ minHeight:'100vh', background:T.bg, display:'flex', flexDirection:'column' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:20, right:24, zIndex:9999, background:`${toast.color}18`, border:`1px solid ${toast.color}40`, borderRadius:12, padding:'12px 20px', color:toast.color, fontWeight:600, fontSize:13, boxShadow:'0 8px 24px rgba(0,0,0,.4)', animation:'tri-fadeUp .3s both' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display:'flex', flex:1, overflow:'hidden', minHeight:'calc(100vh - 64px)' }}>

        {/* ── SIDEBAR ── */}
        <aside style={{ width: sidebarOpen ? 320 : 0, minWidth: sidebarOpen ? 320 : 0, borderRight:`1px solid ${T.border}`, background:'rgba(0,0,0,.2)', display:'flex', flexDirection:'column', transition:'all .3s', overflow:'hidden' }}>
          <div style={{ padding:'20px 20px 14px', borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:'#e2f0ff' }}>Rapports à réviser</div>
              <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{reports.length} rapport{reports.length !== 1 ? 's' : ''} disponible{reports.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:14 }}>
            {loadingList && (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[1,2,3,4].map(i => <Skeleton key={i} h={62} />)}
              </div>
            )}
            {errorList && (
              <div style={{ padding:16, textAlign:'center', color:T.red, fontSize:12 }}>
                ⚠ Erreur : {errorList}
              </div>
            )}
            {!loadingList && !errorList && (
              <ReportSelector reports={reports} selectedId={selectedReport?.id} onSelect={handleSelect} />
            )}
          </div>
        </aside>

        {/* ── MAIN PANEL ── */}
        <main style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>

          {/* Top bar */}
          <div style={{ padding:'16px 24px', borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', gap:12, background:'rgba(0,0,0,.15)', position:'sticky', top:0, zIndex:100, backdropFilter:'blur(8px)' }}>
            <button className="tri-btn tri-btn-ghost tri-btn-sm" onClick={() => setSidebarOpen(o => !o)}>
              {sidebarOpen ? '◀ Masquer' : '▶ Rapports'}
            </button>
            {selectedReport && (
              <>
                <div style={{ width:1, height:20, background:T.border }} />
                <div style={{ flex:1 }}>
                  <span style={{ fontSize:14, fontWeight:600, color:'#e2f0ff' }}>
                    {selectedReport.organism_name || selectedReport.company_name}
                  </span>
                  <span style={{ fontSize:11, color:T.muted, marginLeft:10 }}>
                    {selectedReport.organism_sector || selectedReport.sector}
                  </span>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="tri-btn tri-btn-ghost tri-btn-sm" onClick={handleExport}>
                    📄 Exporter
                  </button>

                  <button
                    className="tri-btn tri-btn-ghost tri-btn-sm"
                    onClick={() => navigate(`/rapports/${selectedReport.id}`)}
                    title="Ouvrir le rapport final"
                  >
                    📋 Voir le rapport
                  </button>

                  <button className="tri-btn tri-btn-primary tri-btn-sm" onClick={handleValidate} disabled={saving}>
                    {saving ? '⏳ Enregistrement...' : '✓ Valider le rapport'}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Content */}
          {!selectedReport ? (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, color:T.muted }}>
              <div style={{ fontSize:48, opacity:.3 }}>📋</div>
              <p style={{ fontSize:15, fontWeight:600 }}>Sélectionnez un rapport à réviser</p>
              <p style={{ fontSize:12 }}>Choisissez un rapport dans le panneau de gauche</p>
            </div>
          ) : (
            <div style={{ padding:'24px', flex:1 }}>

              {/* Stats row */}
              <div className="tri-stagger" style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:24 }}>
                {[
                  { label:'Champs totaux',   val:stats.total,    color:T.text  },
                  { label:'Vérifiés',        val:stats.verified,  color:T.green },
                  { label:'À réviser',       val:stats.needsRev,  color:T.amber },
                  { label:'Corrigés',        val:stats.corrected, color:T.blue  },
                  { label:'Confiance moy.',  val:`${stats.avgConf}%`, color:T.teal },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:'14px 16px', textAlign:'center' }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:900, color, marginBottom:4 }}>{val}</div>
                    <div style={{ fontSize:10, color:T.muted, textTransform:'uppercase', letterSpacing:'.4px', fontWeight:600 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Score banner */}
              {(() => {
                const sc = selectedReport.compliance_score || 0;
                const niv = getNiveau(sc);
                return (
                  <div style={{ background:`${niv.color}0c`, border:`1px solid ${niv.color}25`, borderRadius:16, padding:'16px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:16 }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:32, fontWeight:900, color:niv.color, lineHeight:1 }}>{sc}%</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:'#e2f0ff', fontWeight:600, marginBottom:6 }}>Score de conformité — <span style={{ color:niv.color }}>{niv.label}</span></div>
                      <BarTrack value={sc} color={niv.color} />
                    </div>
                    <div style={{ fontSize:11, color:T.muted, textAlign:'right' }}>
                      <div>Rapport : {selectedReport.file_name || '—'}</div>
                      <div style={{ marginTop:3, color: selectedReport.status === 'validated' ? T.green : T.amber }}>
                        {selectedReport.status || 'pending'}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Filter tabs */}
              <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
                {[
                  { key:'all',          label:'Tous',       count:stats.total    },
                  { key:'needs-review', label:'À réviser',  count:stats.needsRev },
                  { key:'verified',     label:'Vérifiés',   count:stats.verified },
                  { key:'corrected',    label:'Corrigés',   count:stats.corrected},
                  { key:'flagged',      label:'Signalés',   count:stats.flagged  },
                ].map(({ key, label, count }) => (
                  <button key={key}
                    className="tri-btn tri-btn-sm"
                    style={{ background: filter===key ? `${T.teal}18`:'transparent', border:`1px solid ${filter===key ? T.teal : T.border}`, color: filter===key ? T.teal : T.muted }}
                    onClick={() => setFilter(key)}
                  >
                    {label} <span style={{ opacity:.6 }}>({count})</span>
                  </button>
                ))}
              </div>

              {/* Fields by category */}
              {Object.entries(grouped).map(([cat, catFields]) => (
                <div key={cat} style={{ marginBottom:24 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:T.teal, textTransform:'uppercase', letterSpacing:'.6px' }}>{cat}</h3>
                    <div style={{ flex:1, height:1, background:T.border }} />
                    <span style={{ fontSize:11, color:T.muted }}>{catFields.length} champ{catFields.length > 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {catFields.map(f => (
                      <FieldCard key={f.id} field={f}
                        onStatusChange={handleStatusChange}
                        onSaveEdit={handleSaveEdit}
                        onAddAnnotation={handleAddAnnotation}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {Object.keys(grouped).length === 0 && (
                <div style={{ textAlign:'center', padding:'40px', color:T.muted, fontSize:13 }}>
                  Aucun champ correspondant au filtre sélectionné
                </div>
              )}

              {/* Annexes details (Serveurs, Vulnérabilités, Plan d'action) */}
              <AnnexesDetails report={selectedReport} />

              {/* Bottom actions */}
              <div style={{ display:'flex', gap:12, justifyContent:'flex-end', marginTop:24, paddingTop:20, borderTop:`1px solid ${T.border}` }}>
                <button className="tri-btn tri-btn-ghost" onClick={handleExport}>📄 Exporter en JSON</button>
                <button className="tri-btn tri-btn-primary" onClick={handleValidate} disabled={saving}>
                  {saving ? '⏳...' : '✓ Valider et soumettre'}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}