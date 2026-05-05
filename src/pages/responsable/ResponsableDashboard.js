import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { useReportsRealtime } from "../../hooks/useReportsRealtime";
import { useAssignReport } from "../../hooks/useAssignReport";

/* ═══════════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:      #060e0d;
    --surface: rgba(255,255,255,.028);
    --border:  rgba(255,255,255,.07);
    --border2: rgba(16,185,129,.18);
    --g:   #10b981;
    --g2:  #34d399;
    --g3:  #059669;
    --amb: #f59e0b;
    --blu: #3b82f6;
    --pur: #8b5cf6;
    --red: #ef4444;
    --txt: #d8f8ef;
    --txt2: #7ab89e;
    --txt3: #3e7060;
  }

  .rd-root { min-height:100vh; background:var(--bg); color:var(--txt); font-family:'DM Sans',sans-serif; position:relative; }
  .rd-root::before {
    content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
    background-image:
      radial-gradient(ellipse 80% 50% at 10% -10%, rgba(16,185,129,.07) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 90% 100%, rgba(59,130,246,.05) 0%, transparent 60%),
      linear-gradient(rgba(16,185,129,.015) 1px,transparent 1px),
      linear-gradient(90deg,rgba(16,185,129,.015) 1px,transparent 1px);
    background-size: 100% 100%, 100% 100%, 52px 52px, 52px 52px;
  }

  .rd-wrap { position:relative; z-index:1; max-width:1520px; margin:0 auto; padding:28px 32px 80px; }

  /* ── TOPBAR ── */
  .rd-top { display:flex; align-items:center; justify-content:space-between; gap:20px; flex-wrap:wrap; margin-bottom:36px; }
  .rd-brand { display:flex; align-items:center; gap:14px; }
  .rd-brand-icon { width:48px; height:48px; border-radius:14px; background:linear-gradient(135deg,var(--g3),var(--g)); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 0 24px rgba(16,185,129,.25); }
  .rd-brand-icon svg { width:24px; height:24px; }
  .rd-brand-role { font-size:10.5px; letter-spacing:.18em; text-transform:uppercase; color:var(--txt3); font-weight:600; margin-bottom:2px; }
  .rd-brand-title { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; color:#e8fff6; letter-spacing:-.3px; }
  .rd-top-actions { display:flex; gap:10px; align-items:center; }
  .rd-logout-btn { border:1px solid rgba(16,185,129,.2); background:rgba(16,185,129,.06); color:var(--g); border-radius:12px; padding:10px 18px; font-size:13px; font-weight:600; cursor:pointer; transition:all .2s; font-family:'DM Sans',sans-serif; }
  .rd-logout-btn:hover { background:rgba(16,185,129,.12); border-color:rgba(16,185,129,.35); }
  .rd-date-pill { background:rgba(255,255,255,.04); border:1px solid var(--border); border-radius:10px; padding:7px 14px; font-size:12px; color:var(--txt2); }

  /* ── STAT CARDS ── */
  .rd-stats { display:grid; grid-template-columns:repeat(5,1fr); gap:14px; margin-bottom:28px; }
  .rd-stat { background:var(--surface); border:1px solid var(--border); border-radius:18px; padding:18px 20px; position:relative; overflow:hidden; transition:border-color .2s, transform .2s; cursor:default; }
  .rd-stat::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; border-radius:2px 2px 0 0; }
  .rd-stat:hover { border-color:rgba(16,185,129,.2); transform:translateY(-1px); }
  .rd-stat.green::before  { background:linear-gradient(90deg,var(--g),transparent); }
  .rd-stat.amber::before  { background:linear-gradient(90deg,var(--amb),transparent); }
  .rd-stat.blue::before   { background:linear-gradient(90deg,var(--blu),transparent); }
  .rd-stat.purple::before { background:linear-gradient(90deg,var(--pur),transparent); }
  .rd-stat.red::before    { background:linear-gradient(90deg,var(--red),transparent); }
  .rd-stat-label { font-size:10px; text-transform:uppercase; letter-spacing:.15em; color:var(--txt3); font-weight:600; margin-bottom:10px; }
  .rd-stat-val { font-size:30px; font-weight:800; font-family:'Syne',sans-serif; line-height:1; margin-bottom:5px; }
  .rd-stat.green  .rd-stat-val { color:var(--g); }
  .rd-stat.amber  .rd-stat-val { color:var(--amb); }
  .rd-stat.blue   .rd-stat-val { color:#60a5fa; }
  .rd-stat.purple .rd-stat-val { color:#a78bfa; }
  .rd-stat.red    .rd-stat-val { color:#f87171; }
  .rd-stat-note { font-size:11px; color:var(--txt3); }

  /* ── TABS ── */
  .rd-tabs { display:flex; gap:2px; margin-bottom:26px; border-bottom:1px solid rgba(255,255,255,.06); }
  .rd-tab { border:none; background:none; color:var(--txt3); font-size:13px; font-weight:600; padding:12px 22px; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; transition:all .2s; font-family:'DM Sans',sans-serif; letter-spacing:.02em; display:flex; align-items:center; gap:7px; }
  .rd-tab:hover { color:var(--txt2); }
  .rd-tab.active { color:var(--g); border-bottom-color:var(--g); }
  .rd-tab-badge { background:rgba(16,185,129,.15); color:var(--g); border-radius:999px; padding:1px 7px; font-size:10px; font-weight:700; }

  /* ── PANELS ── */
  .rd-panel { background:var(--surface); border:1px solid var(--border); border-radius:20px; overflow:hidden; }
  .rd-panel-hd { display:flex; align-items:center; justify-content:space-between; padding:16px 22px; border-bottom:1px solid rgba(255,255,255,.05); }
  .rd-panel-hd h2 { font-size:14px; font-weight:700; color:#dff8ee; letter-spacing:.01em; }
  .rd-panel-bd { padding:18px 22px; }

  /* ── GRID ── */
  .rd-grid-2   { display:grid; grid-template-columns:1.7fr 1fr; gap:20px; }
  .rd-grid-3   { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
  .rd-grid-2eq { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .rd-grid-4   { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
  .rd-col-gap  { display:flex; flex-direction:column; gap:20px; }

  /* ── TABLE ── */
  .rd-table { width:100%; border-collapse:collapse; }
  .rd-table th { font-size:10.5px; text-transform:uppercase; letter-spacing:.13em; color:var(--txt3); padding:10px 14px; border-bottom:1px solid rgba(255,255,255,.06); text-align:left; font-weight:700; white-space:nowrap; }
  .rd-table td { padding:12px 14px; font-size:13px; border-bottom:1px solid rgba(255,255,255,.04); }
  .rd-table tr { cursor:pointer; transition:background .12s; }
  .rd-table tr:hover td { background:rgba(16,185,129,.05); }
  .rd-table tr.selected td { background:rgba(16,185,129,.09); }
  .rd-table tr:last-child td { border-bottom:none; }

  /* ── BADGES ── */
  .rd-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 9px; border-radius:999px; font-size:11px; font-weight:700; letter-spacing:.04em; white-space:nowrap; }
  .rd-badge.validated { background:rgba(16,185,129,.14); color:var(--g); }
  .rd-badge.pending   { background:rgba(245,158,11,.11); color:var(--amb); }
  .rd-badge.rejected  { background:rgba(239,68,68,.12); color:#f87171; }
  .rd-badge.green  { background:rgba(16,185,129,.14); color:var(--g); }
  .rd-badge.amber  { background:rgba(245,158,11,.11); color:var(--amb); }
  .rd-badge.red    { background:rgba(239,68,68,.12); color:#f87171; }
  .rd-badge.blue   { background:rgba(59,130,246,.12); color:#60a5fa; }
  .rd-badge.purple { background:rgba(139,92,246,.12); color:#a78bfa; }

  /* ── PRIORITY DOT ── */
  .rd-dot { width:7px; height:7px; border-radius:50%; display:inline-block; margin-right:5px; }
  .rd-dot.green { background:var(--g); }
  .rd-dot.amber { background:var(--amb); }
  .rd-dot.red   { background:var(--red); }

  /* ── BUTTONS ── */
  .rd-btn { border:none; border-radius:11px; padding:9px 16px; font-size:13px; font-weight:700; cursor:pointer; transition:all .2s; font-family:'DM Sans',sans-serif; }
  .rd-btn.primary { background:linear-gradient(135deg,var(--g),var(--g3)); color:#f0fff8; }
  .rd-btn.primary:hover { filter:brightness(1.1); transform:translateY(-1px); }
  .rd-btn.primary:disabled { opacity:.4; cursor:not-allowed; transform:none; filter:none; }
  .rd-btn.ghost  { background:rgba(255,255,255,.05); color:var(--txt2); border:1px solid rgba(255,255,255,.09); }
  .rd-btn.ghost:hover { background:rgba(255,255,255,.09); }
  .rd-btn.sm { padding:6px 12px; font-size:11px; border-radius:8px; }

  /* ── FORM ── */
  .rd-select, .rd-input, .rd-textarea { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); color:var(--txt); border-radius:10px; padding:9px 12px; font-size:13px; font-family:'DM Sans',sans-serif; outline:none; transition:border .2s; width:100%; }
  .rd-select:focus, .rd-input:focus, .rd-textarea:focus { border-color:rgba(16,185,129,.4); background:rgba(16,185,129,.04); }
  .rd-select option { background:#0c1f1a; }
  .rd-textarea { resize:vertical; min-height:72px; }
  .rd-label { font-size:10.5px; text-transform:uppercase; letter-spacing:.13em; color:var(--txt3); font-weight:700; margin-bottom:6px; display:block; }
  .rd-field { margin-bottom:14px; }

  /* ── CHECKLIST ── */
  .rd-check-item { display:flex; align-items:flex-start; gap:12px; padding:13px 0; border-bottom:1px solid rgba(255,255,255,.05); cursor:pointer; transition:background .12s; }
  .rd-check-item:last-child { border-bottom:none; }
  .rd-check-item:hover { padding-left:4px; }
  .rd-check-box { width:20px; height:20px; border-radius:6px; border:1.5px solid rgba(16,185,129,.3); display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .2s; margin-top:1px; }
  .rd-check-box.checked { background:var(--g); border-color:var(--g); box-shadow:0 0 10px rgba(16,185,129,.3); }
  .rd-check-box svg { width:11px; height:11px; fill:none; stroke:#f0fff8; stroke-width:2.5; stroke-linecap:round; stroke-linejoin:round; opacity:0; transition:opacity .15s; }
  .rd-check-box.checked svg { opacity:1; }
  .rd-check-label { font-size:13px; color:#c8eed8; font-weight:500; transition:all .2s; }
  .rd-check-label.done { text-decoration:line-through; opacity:.5; }
  .rd-check-desc { font-size:11.5px; color:var(--txt3); margin-top:3px; line-height:1.5; }

  /* ── PROGRESS ── */
  .rd-progress-wrap { background:rgba(255,255,255,.07); border-radius:999px; height:5px; overflow:hidden; }
  .rd-progress-fill { height:100%; border-radius:999px; background:linear-gradient(90deg,var(--g),var(--g2)); transition:width .5s cubic-bezier(.4,0,.2,1); }

  /* ── KPI CARDS ── */
  .rd-kpi-card { background:rgba(16,185,129,.05); border:1px solid rgba(16,185,129,.13); border-radius:14px; padding:14px 16px; transition:border-color .2s; }
  .rd-kpi-header { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:8px; }
  .rd-kpi-name { font-size:13px; font-weight:700; color:#b0f0d8; }
  .rd-kpi-formula { font-size:11px; color:var(--txt3); font-family:monospace; background:rgba(0,0,0,.2); padding:5px 8px; border-radius:6px; margin-top:4px; word-break:break-all; }
  .rd-kpi-value { font-size:22px; font-weight:800; font-family:'Syne',sans-serif; color:var(--g); margin-top:8px; }
  .rd-kpi-del { background:none; border:none; color:var(--txt3); cursor:pointer; font-size:18px; padding:0; transition:color .15s; line-height:1; }
  .rd-kpi-del:hover { color:#f87171; }

  /* ── ASSIGN CARD ── */
  .rd-assign-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:16px 18px; transition:all .2s; }
  .rd-assign-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
  .rd-assign-id { font-size:11px; color:var(--txt3); font-weight:700; }
  .rd-assign-org { font-size:13px; font-weight:600; color:#c8eed8; margin-bottom:4px; }
  .rd-skill-tag { background:rgba(59,130,246,.1); border:1px solid rgba(59,130,246,.18); color:#93c5fd; border-radius:6px; padding:2px 8px; font-size:10.5px; font-weight:600; }

  /* ── DETAIL SECTION ── */
  .rd-detail-section { background:rgba(16,185,129,.04); border:1px solid rgba(16,185,129,.1); border-radius:14px; padding:14px 16px; margin-bottom:12px; }
  .rd-detail-section h3 { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:#4d9e82; margin-bottom:10px; }
  .rd-detail-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:7px; }
  .rd-detail-key { font-size:12px; color:var(--txt3); }
  .rd-detail-val { font-size:13px; font-weight:600; color:#c8eed8; }

  .rd-empty { text-align:center; padding:36px 20px; color:var(--txt3); font-size:13px; }
  .rd-alert { border-radius:12px; padding:12px 14px; font-size:12.5px; margin-bottom:12px; display:flex; align-items:flex-start; gap:10px; }
  .rd-alert.warn { background:rgba(245,158,11,.08); border:1px solid rgba(245,158,11,.2); color:#fcd34d; }
  .rd-alert.success { background:rgba(16,185,129,.08); border:1px solid rgba(16,185,129,.2); color:var(--g2); }
  .rd-alert-icon { font-size:16px; flex-shrink:0; margin-top:-1px; }
`;

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════ */
const CHARGES = [
  { id: 'A', name: 'Chargé Étude A', skills: ['Finance', 'Audit'], color: '#10b981' },
  { id: 'B', name: 'Chargé Étude B', skills: ['RH', 'Stratégie'], color: '#3b82f6' },
  { id: 'C', name: 'Chargé Étude C', skills: ['IT', 'Process'], color: '#8b5cf6' },
  { id: 'D', name: 'Chargé Étude D', skills: ['Marketing', 'Finance'], color: '#f59e0b' },
];
const PRIORITIES = ['Normale', 'Moyenne', 'Haute'];
const COMPETENCES = ['Finance', 'Audit', 'RH', 'Stratégie', 'IT', 'Process', 'Marketing', 'Juridique', 'Qualité'];

const VALIDATION_CRITERIA = [
  { id: 'integrite',   label: 'Intégrité des données',       desc: 'Les données sources sont complètes, cohérentes et sans anomalie.', severity: 'critique' },
  { id: 'biais',       label: 'Absence de biais méthodologique', desc: 'La méthodologie appliquée est libre de biais identifiables.', severity: 'critique' },
  { id: 'coherence',   label: 'Cohérence des analyses',      desc: 'Les analyses produites sont logiquement cohérentes entre elles.', severity: 'majeur' },
  { id: 'pertinence',  label: 'Pertinence aux objectifs',    desc: 'Les livrables répondent aux objectifs définis en amont.', severity: 'majeur' },
  { id: 'rigueur',     label: 'Rigueur méthodologique',      desc: 'La méthodologie appliquée est rigoureuse et reproductible.', severity: 'majeur' },
  { id: 'sources',     label: 'Sources vérifiées',           desc: 'Toutes les sources citées sont vérifiées et accessibles.', severity: 'mineur' },
  { id: 'qualite',     label: 'Qualité des recommandations', desc: 'Les recommandations formulées sont actionnables et fondées.', severity: 'mineur' },
];

const FORMULA_VARS  = ['total', 'validés', 'affectés', 'en_attente', 'haute_priorité'];
const FORMULA_OPS   = ['+', '−', '×', '÷', '(', ')', '%', '100'];
const KPI_TYPES     = ['Taux (%)', 'Ratio', 'Nombre', 'Score pondéré'];

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════ */
const isResponsable = r => { const s = String(r||'').toLowerCase(); return s.includes('responsable')||s.includes('suivi')||s.includes('resp_suivi'); };
const formatDate    = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
const now           = () => new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
const initials      = name => name ? name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() : 'CE';
const getSeverityColor = s => s==='critique' ? '#f87171' : s==='majeur' ? '#f59e0b' : '#60a5fa';

const normalizeReport = (report) => {
  const status = String(report.status || report.validation_status || report.workflow_status || report.report_status || 'déposé').toLowerCase();
  const assigned_to = report.assigned_to || report.assigned_charge || report.charge || report.assignee || '';
  return {
    ...report,
    status,
    assigned_to,
    priority: report.priority || report.report_priority || 'Normale',
    deadline: report.deadline || report.due_date || report.due_date_at || '',
  };
};

const CheckIcon = () => <svg viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3"/></svg>;

const PriorityDot = ({ priority }) => (
  <span className={`rd-dot ${priority==='Haute'?'red':priority==='Moyenne'?'amber':'green'}`} />
);

/* SVG Gauge */
const Gauge = ({ value, max=100, color='#10b981', size=120 }) => {
  const pct = Math.min(value/max,1);
  const r = 44; const cx = 60; const cy = 60;
  const startAngle = -210; const totalAngle = 240;
  const toRad = d => d * Math.PI / 180;
  const arc = (angle) => {
    const a = toRad(startAngle + angle);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };
  const bg1 = arc(0); const bg2 = arc(totalAngle);
  const fg2 = arc(totalAngle * pct);
  const largeArcBg = totalAngle > 180 ? 1 : 0;
  const largeArcFg = totalAngle * pct > 180 ? 1 : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <path d={`M ${bg1.x} ${bg1.y} A ${r} ${r} 0 ${largeArcBg} 1 ${bg2.x} ${bg2.y}`}
        fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="8" strokeLinecap="round"/>
      {pct > 0 && <path d={`M ${bg1.x} ${bg1.y} A ${r} ${r} 0 ${largeArcFg} 1 ${fg2.x} ${fg2.y}`}
        fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        style={{filter:`drop-shadow(0 0 6px ${color}60)`}}/>}
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function ResponsableDashboard() {
  const navigate = useNavigate();
  
  // Use the real-time hooks
  const { reports: realtimeReports, loading: realtimeLoading } = useReportsRealtime(null);
  const { assignReport: assignReportViaHook, fetchChargesEtude, chargesEtude } = useAssignReport();
  
  // DEBUG LOGS
  console.log("=== DEBUG: Realtime Reports Data ===");
  console.log("Realtime reports:", realtimeReports);
  console.log("Loading:", realtimeLoading);
  console.log("Charges étude:", chargesEtude);
  console.log("===================================");
  
  // Local state for additional data not covered by hooks
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [section, setSection] = useState('macro');
  const [selectedId, setSelectedId] = useState(null);

  /* ── STATE: Pilier 1 – RH ── */
  const [assignments, setAssignments] = useState({});
  const [validationChecks, setValidationChecks] = useState({});
  const [validated, setValidated] = useState({});
  const [comments, setComments] = useState({});

  /* ── STATE: Pilier 3 – KPI ── */
  const [kpis, setKpis] = useState([
    { id: 1, name: 'Taux de validation', formula: '(validés / total) × 100', type: 'Taux (%)', weights: {} },
    { id: 2, name: 'Taux d\'affectation', formula: '(affectés / total) × 100', type: 'Taux (%)', weights: {} },
  ]);
  const [kpiForm, setKpiForm] = useState({ name:'', formula:'', type: KPI_TYPES[0], weights:{} });
  const [formulaTokens, setFormulaTokens] = useState([]);
  const [weightItems, setWeightItems] = useState(VALIDATION_CRITERIA.map(c => ({ id:c.id, label:c.label, weight:20 })));

  /* ── AUTH GUARD + LOAD FROM HOOKS ── */
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/responsable-login'); return; }
    try {
      const u = JSON.parse(stored);
      if (!isResponsable(u.role)) { navigate('/responsable-login'); return; }
    } catch { localStorage.clear(); navigate('/responsable-login'); return; }

    fetchChargesEtude();
  }, [navigate, fetchChargesEtude]);

  // Sync realtime reports with local state
  useEffect(() => {
    console.log("Syncing reports - realtimeReports changed:", realtimeReports);
    if (realtimeReports) {
      const normalized = realtimeReports.map(normalizeReport);
      console.log("Normalized reports:", normalized);
      setReports(normalized);
    }
    setLoading(realtimeLoading);
  }, [realtimeReports, realtimeLoading]);

  useEffect(() => {
    if (realtimeReports === null && !realtimeLoading) {
      setError('Impossible de charger les rapports.');
    } else {
      setError(null);
    }
  }, [realtimeReports, realtimeLoading]);

  useEffect(() => {
    console.log("Current reports state:", reports);
    console.log("Total reports:", reports.length);
  }, [reports]);

  /* ── DERIVED ── */
  const total = reports.length;
  const assignedCount = reports.filter(r => assignments[r.id]?.charge || r.assigned_to).length;
  const verifiedCount = reports.filter(r => r.status === 'verified').length;
  const closedCount = reports.filter(r => r.status === 'validated').length;
  const validatedCount = reports.filter(r => r.status === 'validated' || validated[r.id]).length;
  const pendingCount = total - validatedCount;
  const highPrioCount = reports.filter(r => assignments[r.id]?.priority === 'Haute').length;
  const validationRate = total ? Math.round((validatedCount/total)*100) : 0;
  const assignRate = total ? Math.round((assignedCount/total)*100) : 0;

  const selectedReport = useMemo(() => reports.find(r => r.id === selectedId)||null, [reports, selectedId]);
  const isReportValidated = (report) => report && (validated[report.id] || report.status === 'validated');

  /* ── HANDLERS ── */
  const setAssign = (rId, field, value) => setAssignments(prev => ({ ...prev, [rId]: { ...prev[rId], [field]: value } }));

  const toggleCompetence = (rId, skill) => {
    const cur = assignments[rId]?.competences || [];
    const next = cur.includes(skill) ? cur.filter(s=>s!==skill) : [...cur, skill];
    setAssign(rId, 'competences', next);
  };

  const toggleCheck = (rId, cId) => {
    if (validated[rId]) return;
    setValidationChecks(prev => ({ ...prev, [rId]: { ...prev[rId], [cId]: !prev[rId]?.[cId] } }));
  };

  const checksFor = (rId) => validationChecks[rId] || {};
  const critChecks = (rId) => VALIDATION_CRITERIA.filter(c=>c.severity==='critique').every(c=>checksFor(rId)[c.id]);
  const checksDone = (rId) => VALIDATION_CRITERIA.filter(c=>checksFor(rId)[c.id]).length;

  const validateReport = (rId) => {
    const report = reports.find(r => r.id === rId);
    if (!report || report.status !== 'verified' || !critChecks(rId)) return;
    setValidated(prev => ({ ...prev, [rId]: true }));
    setReports(prev => prev.map(r => r.id === rId ? { ...r, status: 'validated' } : r));
  };
  
  const validateAll = () => {
    const a = {};
    setReports(prev => prev.map(r => ({ ...r, status: r.status === 'verified' ? 'validated' : r.status })));
    reports.forEach(r => { if (r.status === 'verified') a[r.id] = true; });
    setValidated(a);
  };

  const updateReport = async (reportId, patch) => {
    try {
      const res = await API.patch(`/reports/${reportId}`, patch);
      const updated = res.data?.data || res.data || null;
      setReports(prev => prev.map(r => r.id === reportId ? normalizeReport({ ...r, ...(updated || patch) }) : r));
    } catch (err) {
      console.warn('Mise à jour du rapport impossible', err);
      setReports(prev => prev.map(r => r.id === reportId ? normalizeReport({ ...r, ...patch }) : r));
    }
  };

  const handleAssignChange = async (rId, field, value) => {
    setAssignments(prev => ({ ...prev, [rId]: { ...prev[rId], [field]: value } }));
    
    if (field === 'charge') {
      const selectedCharge = chargesEtude.find(c => c.full_name === value);
      if (selectedCharge) {
        const { success } = await assignReportViaHook(rId, selectedCharge.id);
        if (success) {
          await updateReport(rId, { assigned_to: value, charge: value, status: 'assigned' });
        }
      } else {
        await updateReport(rId, { assigned_to: value, charge: value, status: 'assigned' });
      }
    } else if (field === 'priority') {
      await updateReport(rId, { priority: value });
    } else if (field === 'deadline') {
      await updateReport(rId, { deadline: value });
    }
  };

  const getAssignment = (r) => assignments[r.id] || { charge:r.assigned_to||'', priority:r.priority||'Normale', deadline:r.deadline||'', competences:[] };

  /* KPI formula builder */
  const appendToken = (tok) => {
    setFormulaTokens(prev => [...prev, tok]);
    setKpiForm(p => ({ ...p, formula: [...formulaTokens, tok].join(' ') }));
  };
  const clearFormula = () => { setFormulaTokens([]); setKpiForm(p=>({...p,formula:''})); };

  const addKpi = () => {
    if (!kpiForm.name.trim() || !kpiForm.formula.trim()) return;
    setKpis(prev => [...prev, { id:Date.now(), ...kpiForm }]);
    setKpiForm({ name:'', formula:'', type:KPI_TYPES[0], weights:{} });
    clearFormula();
  };

  const removeKpi = (id) => setKpis(prev=>prev.filter(k=>k.id!==id));

  const evalKpi = (formula) => {
    try {
      const expr = formula
        .replace(/validés/g, validatedCount)
        .replace(/affectés/g, assignedCount)
        .replace(/en_attente/g, pendingCount)
        .replace(/haute_priorité/g, highPrioCount)
        .replace(/total/g, total||1)
        .replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
      const val = Function('"use strict"; return (' + expr + ')')();
      return isFinite(val) ? Math.round(val*100)/100 : '—';
    } catch { return '—'; }
  };

  const weightedScore = useMemo(() => {
    const totalW = weightItems.reduce((s,w)=>s+Number(w.weight),0);
    if (!totalW || !validatedCount) return 0;
    const completedWeight = VALIDATION_CRITERIA.reduce((s,c) => {
      const w = weightItems.find(w=>w.id===c.id);
      const done = Object.values(validationChecks).filter(v=>v[c.id]).length;
      return s + (done/Math.max(total,1)) * Number(w?.weight||0);
    },0);
    return Math.round((completedWeight/totalW)*100);
  }, [weightItems, validationChecks, validatedCount, total]);

  const handleLogout = () => { localStorage.clear(); navigate('/responsable-login'); };

  const chargeData = CHARGES.map(ch => ({
    name: ch.name,
    count: reports.filter(r=>(assignments[r.id]?.charge||r.assigned_to)===ch.name).length,
    color: ch.color,
  }));
  const maxCharge = Math.max(...chargeData.map(c=>c.count),1);

  console.log("Charge data:", chargeData);
  console.log("Max charge:", maxCharge);

  /* ══════════════════════════════════════════
     TAB: MACRO DASHBOARD
  ══════════════════════════════════════════ */
  const TabMacro = () => (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div className="rd-grid-4">
        <div className="rd-panel">
          <div className="rd-panel-hd"><h2>Taux de validation</h2></div>
          <div className="rd-panel-bd" style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
            <Gauge value={validationRate} color="#10b981" size={130}/>
            <div style={{ display:'flex', gap:16, marginTop:8 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:16, fontWeight:800, color:'#10b981' }}>{validatedCount}</div>
                <div style={{ fontSize:10, color:'#4d8870' }}>Validés</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:16, fontWeight:800, color:'#f59e0b' }}>{pendingCount}</div>
                <div style={{ fontSize:10, color:'#4d8870' }}>En attente</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rd-panel">
          <div className="rd-panel-hd"><h2>Taux d'affectation</h2></div>
          <div className="rd-panel-bd" style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
            <Gauge value={assignRate} color="#3b82f6" size={130}/>
            <div style={{ display:'flex', gap:16, marginTop:8 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:16, fontWeight:800, color:'#3b82f6' }}>{assignedCount}</div>
                <div style={{ fontSize:10, color:'#4d8870' }}>Affectés</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:16, fontWeight:800, color:'#f59e0b' }}>{total-assignedCount}</div>
                <div style={{ fontSize:10, color:'#4d8870' }}>Non affectés</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rd-panel">
          <div className="rd-panel-hd"><h2>Score qualité</h2></div>
          <div className="rd-panel-bd" style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
            <Gauge value={weightedScore} color="#8b5cf6" size={130}/>
            <div style={{ marginTop:8, fontSize:11, color:'#4d8870', textAlign:'center' }}>
              Basé sur {weightItems.length} critères pondérés
            </div>
          </div>
        </div>

        <div className="rd-panel">
          <div className="rd-panel-hd"><h2>KPIs actifs</h2><span style={{fontSize:11,color:'#4d8870'}}>{kpis.length} indicateurs</span></div>
          <div className="rd-panel-bd" style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {kpis.slice(0,3).map(k => (
              <div key={k.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', background:'rgba(16,185,129,.05)', borderRadius:10 }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:'#b0f0d8' }}>{k.name}</div>
                  <div style={{ fontSize:10, color:'#4d8870' }}>{k.type}</div>
                </div>
                <div style={{ fontSize:20, fontWeight:800, color:'#10b981' }}>
                  {evalKpi(k.formula)}{k.type==='Taux (%)' ? '%' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rd-grid-2eq">
        <div className="rd-panel">
          <div className="rd-panel-hd"><h2>Charge par chargé d'étude</h2></div>
          <div className="rd-panel-bd">
            {chargeData.map(ch => (
              <div key={ch.name} className="rd-charge-row">
                <div className="rd-charge-avatar" style={{ background:`linear-gradient(135deg,${ch.color}88,${ch.color})` }}>
                  {initials(ch.name)}
                </div>
                <div className="rd-charge-info">
                  <div className="rd-charge-name">{ch.name}</div>
                  <div className="rd-progress-wrap" style={{marginTop:6}}>
                    <div className="rd-progress-fill" style={{ width:`${maxCharge?Math.round(ch.count/maxCharge*100):0}%`, background:`linear-gradient(90deg,${ch.color},${ch.color}aa)` }}/>
                  </div>
                </div>
                <div className="rd-charge-count" style={{ color:ch.color }}>{ch.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rd-panel">
          <div className="rd-panel-hd"><h2>Répartition des priorités</h2></div>
          <div className="rd-panel-bd">
            {[
              { label:'Haute', color:'#ef4444', count:highPrioCount },
              { label:'Moyenne', color:'#f59e0b', count:reports.filter(r=>assignments[r.id]?.priority==='Moyenne').length },
              { label:'Normale', color:'#10b981', count:reports.filter(r=>!assignments[r.id]||assignments[r.id].priority==='Normale').length },
            ].map(p => (
              <div key={p.label} style={{ marginBottom:16 }}>
                <div className="rd-val-row">
                  <span><span style={{ width:8, height:8, borderRadius:'50%', background:p.color, display:'inline-block', marginRight:6 }}/>{p.label}</span>
                  <span style={{ color:p.color }}>{p.count}</span>
                </div>
                <div className="rd-progress-wrap">
                  <div className="rd-progress-fill" style={{ width:`${total?Math.round(p.count/total*100):0}%`, background:`linear-gradient(90deg,${p.color},${p.color}aa)` }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════
     TAB: RAPPORTS
  ══════════════════════════════════════════ */
  const TabRapports = () => (
    <div className="rd-grid-2">
      <div className="rd-panel">
        <div className="rd-panel-hd"><h2>Liste des rapports</h2><span>{loading?'Chargement…':`${total} rapports`}</span></div>
        <div style={{overflowX:'auto'}}>
          {error && <div className="rd-empty">{error}</div>}
          {!error && !loading && total===0 && <div className="rd-empty">Aucun rapport disponible.</div>}
          {!error && total>0 && (
            <table className="rd-table">
              <thead><tr><th>Réf.</th><th>Organisme</th><th>Chargé</th><th>Priorité</th><th>Statut</th></tr></thead>
              <tbody>
                {reports.map(r => {
                  const a = getAssignment(r);
                  return (
                    <tr key={r.id} className={selectedId===r.id?'selected':''} onClick={()=>setSelectedId(r.id)}>
                      <td>#{r.id}</td>
                      <td>{r.company_name||r.organism_name||'—'}</td>
                      <td>{a.charge||<em>Non affecté</em>}</td>
                      <td><PriorityDot priority={a.priority}/>{a.priority}</td>
                      <td><span className={`rd-badge ${r.status==='validated'?'validated':r.status==='verified'?'green':'pending'}`}>
                        {r.status === 'validated' ? '✅ Validé' : r.status === 'verified' ? '✓ Vérifié' : '📤 Assigné'}
                      </span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="rd-panel">
        <div className="rd-panel-hd"><h2>Détails & Affectation</h2></div>
        <div className="rd-panel-bd">
          {!selectedReport ? <div className="rd-empty">Sélectionnez un rapport.</div> : (() => {
            const a = getAssignment(selectedReport);
            return (
              <>
                <div className="rd-detail-section">
                  <h3>Informations</h3>
                  <div className="rd-detail-row"><span>Organisme</span><span>{selectedReport.company_name||'—'}</span></div>
                  <div className="rd-detail-row"><span>Dépôt</span><span>{formatDate(selectedReport.upload_date||selectedReport.created_at)}</span></div>
                </div>
                <div className="rd-detail-section">
                  <h3>Affectation</h3>
                  <select className="rd-select" value={a.charge} onChange={e=>handleAssignChange(selectedReport.id,'charge',e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    {chargesEtude.map(c=><option key={c.id} value={c.full_name}>{c.full_name}</option>)}
                  </select>
                  <div className="rd-grid-2eq" style={{marginTop:10}}>
                    <select className="rd-select" value={a.priority} onChange={e=>handleAssignChange(selectedReport.id,'priority',e.target.value)}>
                      {PRIORITIES.map(p=><option key={p}>{p}</option>)}
                    </select>
                    <input type="date" className="rd-input" value={a.deadline||''} onChange={e=>handleAssignChange(selectedReport.id,'deadline',e.target.value)}/>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════
     TAB: AFFECTATION
  ══════════════════════════════════════════ */
  const TabAffectation = () => (
    <div>
      <div className="rd-grid-4">
        {chargesEtude.map(ch => {
          const count = reports.filter(r=>(assignments[r.id]?.charge||r.assigned_to)===ch.full_name).length;
          return (
            <div key={ch.id} className="rd-panel">
              <div className="rd-panel-hd"><h2>{ch.full_name}</h2></div>
              <div className="rd-panel-bd" style={{textAlign:'center'}}>
                <div style={{fontSize:36,fontWeight:800,color:'#10b981'}}>{count}</div>
                <div>rapports assignés</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="rd-grid-3" style={{marginTop:20}}>
        {reports.map(r => {
          const a = getAssignment(r);
          return (
            <div key={r.id} className="rd-assign-card">
              <div className="rd-assign-header"><span>#{r.id}</span><span>{r.company_name}</span></div>
              <select className="rd-select" value={a.charge} onChange={e=>handleAssignChange(r.id,'charge',e.target.value)}>
                <option value="">— Assigner —</option>
                {chargesEtude.map(c=><option key={c.id} value={c.full_name}>{c.full_name}</option>)}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ══════════════════════════════════════════
     TAB: VALIDATION
  ══════════════════════════════════════════ */
  const TabValidation = () => (
    <div className="rd-grid-2">
      <div className="rd-panel">
        <div className="rd-panel-hd"><h2>Rapports à valider</h2></div>
        <div style={{overflowX:'auto'}}>
          <table className="rd-table">
            <thead><tr><th>Réf.</th><th>Organisme</th><th>Checklist</th><th>Action</th></tr></thead>
            <tbody>
              {reports.map(r => {
                const done = checksDone(r.id);
                return (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td>{r.company_name}</td>
                    <td>{done}/{VALIDATION_CRITERIA.length}</td>
                    <td>
                      <button className="rd-btn primary sm" disabled={r.status!=='verified'||!critChecks(r.id)} onClick={()=>validateReport(r.id)}>
                        Valider
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rd-panel">
        <div className="rd-panel-hd"><h2>Checklist</h2></div>
        <div className="rd-panel-bd">
          {!selectedReport ? <div className="rd-empty">Sélectionnez un rapport</div> : (
            VALIDATION_CRITERIA.map(c => {
              const checked = !!checksFor(selectedReport.id)[c.id];
              return (
                <div key={c.id} className="rd-check-item" onClick={()=>toggleCheck(selectedReport.id,c.id)}>
                  <div className={`rd-check-box ${checked?'checked':''}`}><CheckIcon/></div>
                  <div><div className={checked?'done':''}>{c.label}</div><div className="rd-check-desc">{c.desc}</div></div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════
     TAB: INDICATEURS
  ══════════════════════════════════════════ */
  const TabIndicateurs = () => (
    <div className="rd-grid-2eq">
      <div className="rd-panel">
        <div className="rd-panel-hd"><h2>KPIs</h2></div>
        <div className="rd-panel-bd">
          {kpis.map(k => (
            <div key={k.id} className="rd-kpi-card">
              <div className="rd-kpi-header"><span>{k.name}</span><button className="rd-kpi-del" onClick={()=>removeKpi(k.id)}>×</button></div>
              <div className="rd-kpi-formula">{k.formula}</div>
              <div className="rd-kpi-value">{evalKpi(k.formula)}{k.type==='Taux (%)'?'%':''}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="rd-panel">
        <div className="rd-panel-hd"><h2>Pondération</h2></div>
        <div className="rd-panel-bd">
          {weightItems.map(w => (
            <div key={w.id} className="rd-weight-item">
              <span>{w.label}</span>
              <input type="number" className="rd-weight-input" value={w.weight} onChange={e=>setWeightItems(prev=>prev.map(x=>x.id===w.id?{...x,weight:Number(e.target.value)}:x))}/>
              <span>{w.weight}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════
     TABS CONFIG
  ══════════════════════════════════════════ */
  const TABS = [
    { key:'macro', label:'Vue Macro', icon:'◈' },
    { key:'rapports', label:'Rapports', icon:'≡', badge: total },
    { key:'affectation', label:'Affectation RH', icon:'⊕', badge: total-assignedCount },
    { key:'validation', label:'Validation QA', icon:'✓', badge: pendingCount },
    { key:'indicateurs', label:'Indicateurs', icon:'∿', badge: kpis.length },
  ];

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  return (
    <div className="rd-root">
      <style>{CSS}</style>
      <div className="rd-wrap">
        <div className="rd-top">
          <div className="rd-brand">
            <div className="rd-brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#f0fff8" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <div className="rd-brand-role">Interface de supervision</div>
              <div className="rd-brand-title">Responsable de suivi</div>
            </div>
          </div>
          <div className="rd-top-actions">
            <div className="rd-date-pill">{now()}</div>
            <button className="rd-logout-btn" onClick={handleLogout}>Déconnexion</button>
          </div>
        </div>

        <div className="rd-stats">
          <div className="rd-stat green"><div className="rd-stat-label">Total rapports</div><div className="rd-stat-val">{total}</div></div>
          <div className="rd-stat blue"><div className="rd-stat-label">Affectés</div><div className="rd-stat-val">{assignedCount}</div><div className="rd-stat-note">{assignRate}%</div></div>
          <div className="rd-stat green"><div className="rd-stat-label">Validés</div><div className="rd-stat-val">{validatedCount}</div><div className="rd-stat-note">{validationRate}%</div></div>
          <div className="rd-stat amber"><div className="rd-stat-label">En attente</div><div className="rd-stat-val">{pendingCount}</div></div>
          <div className="rd-stat purple"><div className="rd-stat-label">Score qualité</div><div className="rd-stat-val">{weightedScore}%</div></div>
        </div>

        <div className="rd-tabs">
          {TABS.map(t=>(
            <button key={t.key} className={`rd-tab ${section===t.key?'active':''}`} onClick={()=>setSection(t.key)}>
              <span>{t.icon}</span> {t.label}
              {t.badge ? <span className="rd-tab-badge">{t.badge}</span> : null}
            </button>
          ))}
        </div>

        {section==='macro' && <TabMacro/>}
        {section==='rapports' && <TabRapports/>}
        {section==='affectation' && <TabAffectation/>}
        {section==='validation' && <TabValidation/>}
        {section==='indicateurs' && <TabIndicateurs/>}
      </div>
    </div>
  );
}