import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  .rd-brand-role  { font-size:10.5px; letter-spacing:.18em; text-transform:uppercase; color:var(--txt3); font-weight:600; margin-bottom:2px; }
  .rd-brand-title { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; color:#e8fff6; letter-spacing:-.3px; }
  .rd-top-actions { display:flex; gap:10px; align-items:center; }
  .rd-logout-btn { border:1px solid rgba(16,185,129,.2); background:rgba(16,185,129,.06); color:var(--g); border-radius:12px; padding:10px 18px; font-size:13px; font-weight:600; cursor:pointer; transition:all .2s; font-family:'DM Sans',sans-serif; }
  .rd-logout-btn:hover { background:rgba(16,185,129,.12); border-color:rgba(16,185,129,.35); }
  .rd-date-pill { background:rgba(255,255,255,.04); border:1px solid var(--border); border-radius:10px; padding:7px 14px; font-size:12px; color:var(--txt2); }

  /* ── NEW REPORT TOAST ── */
  .rd-toast {
    position:fixed; top:24px; right:28px; z-index:2000;
    background:linear-gradient(135deg,#0c2a1e,#0a1f18);
    border:1px solid rgba(16,185,129,.45);
    border-radius:16px; padding:14px 18px;
    display:flex; align-items:center; gap:12px;
    box-shadow: 0 12px 40px rgba(0,0,0,.5), 0 0 0 1px rgba(16,185,129,.15);
    animation: toastIn .35s cubic-bezier(.2,.8,.3,1) both;
    max-width:340px;
  }
  .rd-toast.out { animation: toastOut .3s ease forwards; }
  .rd-toast-dot { width:10px; height:10px; border-radius:50%; background:var(--g); flex-shrink:0; box-shadow:0 0 10px rgba(16,185,129,.6); animation:pulse 1.5s infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(1.3)} }
  @keyframes toastIn  { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
  @keyframes toastOut { from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(40px)} }

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
  .rd-stat-new { position:absolute; top:10px; right:12px; background:rgba(16,185,129,.18); border:1px solid rgba(16,185,129,.35); border-radius:99px; padding:2px 8px; font-size:10px; font-weight:700; color:var(--g); animation:pulse 1.5s infinite; }

  /* ── TABS ── */
  .rd-tabs { display:flex; gap:2px; margin-bottom:26px; border-bottom:1px solid rgba(255,255,255,.06); }
  .rd-tab { border:none; background:none; color:var(--txt3); font-size:13px; font-weight:600; padding:12px 22px; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; transition:all .2s; font-family:'DM Sans',sans-serif; letter-spacing:.02em; display:flex; align-items:center; gap:7px; }
  .rd-tab:hover { color:var(--txt2); }
  .rd-tab.active { color:var(--g); border-bottom-color:var(--g); }
  .rd-tab-badge { background:rgba(16,185,129,.15); color:var(--g); border-radius:999px; padding:1px 7px; font-size:10px; font-weight:700; }
  .rd-tab-badge.new { background:rgba(245,158,11,.2); color:var(--amb); animation:pulse 1.5s infinite; }

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

  /* ── TABLE ── */
  .rd-table { width:100%; border-collapse:collapse; text-align:left; }
  .rd-table th { font-size:11px; text-transform:uppercase; letter-spacing:.13em; color:var(--txt3); padding:14px 20px; border-bottom:1px solid rgba(255,255,255,.06); font-weight:700; white-space:nowrap; }
  .rd-table td { padding:16px 20px; font-size:13px; border-bottom:1px solid rgba(255,255,255,.04); vertical-align:middle; }
  .rd-table tr { transition:background .12s; }
  .rd-table tr:hover td { background:rgba(16,185,129,.05); }
  .rd-table tr.selected td { background:rgba(16,185,129,.09); }
  .rd-table tr:last-child td { border-bottom:none; }
  /* NEW row highlight */
  .rd-table tr.is-new td { background:rgba(16,185,129,.07); }
  .rd-table tr.is-new:hover td { background:rgba(16,185,129,.11); }

  /* ── BADGES ── */
  .rd-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; font-size:11px; font-weight:700; letter-spacing:.04em; white-space:nowrap; }
  .rd-badge-dot { width:5px; height:5px; border-radius:50%; }
  .rd-badge.depose  { background:rgba(59,130,246,.12); color:#60a5fa; }
  .rd-badge.depose .rd-badge-dot { background:#60a5fa; box-shadow:0 0 5px #60a5fa; }
  .rd-badge.affecte { background:rgba(139,92,246,.12); color:#a78bfa; }
  .rd-badge.affecte .rd-badge-dot { background:#a78bfa; box-shadow:0 0 5px #a78bfa; }
  .rd-badge.valide  { background:rgba(16,185,129,.14); color:var(--g); }
  .rd-badge.valide .rd-badge-dot { background:var(--g); box-shadow:0 0 5px var(--g); }
  .rd-badge.rejete  { background:rgba(239,68,68,.12); color:#f87171; }
  .rd-badge.rejete .rd-badge-dot { background:#f87171; box-shadow:0 0 5px #f87171; }
  .rd-badge.new-pill { background:rgba(16,185,129,.2); color:var(--g2); border:1px solid rgba(16,185,129,.3); font-size:9px; padding:2px 7px; }

  /* ── AFFECTER BUTTON ── */
  .rd-btn-affecter {
    display:inline-flex; align-items:center; gap:6px;
    padding:7px 14px; border-radius:9px; font-size:12px; font-weight:700;
    cursor:pointer; transition:all .18s; white-space:nowrap; font-family:'DM Sans',sans-serif;
    border:1px solid rgba(16,185,129,.4); background:rgba(16,185,129,.08); color:var(--g);
  }
  .rd-btn-affecter:hover { background:rgba(16,185,129,.18); border-color:rgba(16,185,129,.7); }
  .rd-btn-affecter.assigned {
    border-color:rgba(139,92,246,.4); background:rgba(139,92,246,.08); color:#c4b5fd;
  }
  .rd-btn-affecter.assigned:hover { background:rgba(139,92,246,.18); border-color:rgba(139,92,246,.7); }
  .rd-btn-affecter-avatar {
    width:18px; height:18px; border-radius:50%; background:rgba(196,181,253,.2);
    display:inline-flex; align-items:center; justify-content:center; font-size:9px; font-weight:700;
  }
  .rd-btn-affecter:disabled { opacity:.4; cursor:not-allowed; }

  /* ── MODAL ── */
  .rd-modal-overlay {
    position:fixed; inset:0; background:rgba(0,0,0,.78); display:flex;
    align-items:center; justify-content:center; z-index:1000;
    backdrop-filter:blur(4px); animation:fadeIn .18s ease;
  }
  .rd-modal {
    background:#0c1f1a; border:1px solid rgba(16,185,129,.22); border-radius:18px;
    width:100%; max-width:480px; max-height:82vh; display:flex; flex-direction:column;
    overflow:hidden; animation:slideUp .22s cubic-bezier(.2,.8,.3,1);
    box-shadow: 0 24px 64px rgba(0,0,0,.6), 0 0 0 1px rgba(16,185,129,.08);
  }
  .rd-modal-hd {
    display:flex; justify-content:space-between; align-items:flex-start;
    padding:22px 26px 18px; border-bottom:1px solid rgba(255,255,255,.07);
  }
  .rd-modal-label { font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--g); margin:0 0 4px; }
  .rd-modal-title { font-size:18px; font-weight:700; color:#e8fff6; margin:0 0 3px; }
  .rd-modal-ref   { font-size:12px; color:var(--txt3); margin:0; }
  .rd-modal-close { background:none; border:none; color:var(--txt3); cursor:pointer; font-size:16px; padding:2px 6px; border-radius:6px; transition:color .15s; }
  .rd-modal-close:hover { color:#e8fff6; background:rgba(255,255,255,.08); }
  .rd-modal-body  { padding:20px 26px; overflow-y:auto; flex:1; }
  .rd-modal-footer{ display:flex; justify-content:flex-end; gap:9px; padding:14px 26px; border-top:1px solid rgba(255,255,255,.07); }

  /* Charge option items */
  .rd-charge-option-item {
    display:flex; align-items:center; gap:12px; padding:12px 14px;
    border-radius:12px; border:1px solid rgba(255,255,255,.07);
    cursor:pointer; transition:all .15s; margin-bottom:8px;
  }
  .rd-charge-option-item:last-child { margin-bottom:0; }
  .rd-charge-option-item:hover { border-color:rgba(16,185,129,.35); background:rgba(16,185,129,.05); }
  .rd-charge-option-item.selected { border-color:rgba(16,185,129,.6); background:rgba(16,185,129,.1); box-shadow:0 0 0 1px rgba(16,185,129,.2); }
  .rd-charge-option-avatar { width:38px; height:38px; border-radius:50%; background:rgba(16,185,129,.12); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:var(--g); flex-shrink:0; }
  .rd-charge-option-name { font-size:14px; font-weight:600; color:#e8fff6; margin:0 0 2px; }
  .rd-charge-option-meta { font-size:11px; color:var(--txt3); margin:0; }
  .rd-charge-option-check { color:var(--g); font-weight:700; font-size:15px; }

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

  /* ── SEARCH & FILTER ── */
  .rd-search-wrap { position:relative; }
  .rd-search-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); font-size:13px; pointer-events:none; }
  .rd-search { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:11px; padding:9px 14px 9px 36px; color:var(--txt); font-size:13px; font-family:'DM Sans',sans-serif; outline:none; width:220px; transition:border-color .2s; }
  .rd-search::placeholder { color:var(--txt3); }
  .rd-search:focus { border-color:rgba(16,185,129,.35); }
  .rd-filter-select { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:11px; padding:9px 14px; color:var(--txt2); font-size:13px; font-family:'DM Sans',sans-serif; outline:none; cursor:pointer; }
  .rd-filter-select option { background:#0c1f1a; }

  /* ── DETAIL PANEL ── */
  .rd-detail-section { background:rgba(16,185,129,.04); border:1px solid rgba(16,185,129,.1); border-radius:14px; padding:14px 16px; margin-bottom:12px; }
  .rd-detail-section h3 { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:#4d9e82; margin-bottom:10px; }
  .rd-detail-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:7px; }
  .rd-detail-key { font-size:12px; color:var(--txt3); }
  .rd-detail-val { font-size:13px; font-weight:600; color:#c8eed8; }

  /* ── CHECKLIST ── */
  .rd-check-item { display:flex; align-items:flex-start; gap:12px; padding:13px 0; border-bottom:1px solid rgba(255,255,255,.05); cursor:pointer; transition:padding .12s; }
  .rd-check-item:last-child { border-bottom:none; }
  .rd-check-item:hover { padding-left:4px; }
  .rd-check-box { width:20px; height:20px; border-radius:6px; border:1.5px solid rgba(16,185,129,.3); display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .2s; margin-top:1px; }
  .rd-check-box.checked { background:var(--g); border-color:var(--g); box-shadow:0 0 10px rgba(16,185,129,.3); }
  .rd-check-box svg { width:11px; height:11px; fill:none; stroke:#f0fff8; stroke-width:2.5; stroke-linecap:round; stroke-linejoin:round; opacity:0; transition:opacity .15s; }
  .rd-check-box.checked svg { opacity:1; }
  .rd-check-label { font-size:13px; color:#c8eed8; font-weight:500; }
  .rd-check-label.done { text-decoration:line-through; opacity:.5; }
  .rd-check-desc  { font-size:11.5px; color:var(--txt3); margin-top:3px; line-height:1.5; }

  /* ── PROGRESS ── */
  .rd-progress-wrap { background:rgba(255,255,255,.07); border-radius:999px; height:5px; overflow:hidden; }
  .rd-progress-fill { height:100%; border-radius:999px; background:linear-gradient(90deg,var(--g),var(--g2)); transition:width .5s cubic-bezier(.4,0,.2,1); }

  /* ── KPI ── */
  .rd-kpi-card { background:rgba(16,185,129,.05); border:1px solid rgba(16,185,129,.13); border-radius:14px; padding:14px 16px; margin-bottom:12px; }
  .rd-kpi-header { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:8px; }
  .rd-kpi-name { font-size:13px; font-weight:700; color:#b0f0d8; }
  .rd-kpi-formula { font-size:11px; color:var(--txt3); font-family:monospace; background:rgba(0,0,0,.2); padding:5px 8px; border-radius:6px; margin-top:4px; word-break:break-all; }
  .rd-kpi-value { font-size:22px; font-weight:800; font-family:'Syne',sans-serif; color:var(--g); margin-top:8px; }
  .rd-kpi-del { background:none; border:none; color:var(--txt3); cursor:pointer; font-size:18px; padding:0; transition:color .15s; line-height:1; }
  .rd-kpi-del:hover { color:#f87171; }

  /* ── CHARGE ROWS ── */
  .rd-charge-row { display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid rgba(255,255,255,.05); }
  .rd-charge-row:last-child { border-bottom:none; }
  .rd-charge-avatar { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:#f0fff8; flex-shrink:0; }
  .rd-charge-info  { flex:1; }
  .rd-charge-name  { font-size:13px; font-weight:600; color:#c8eed8; margin-bottom:4px; }
  .rd-charge-count { font-size:14px; font-weight:800; color:var(--g); min-width:30px; text-align:right; }

  /* ── MISC ── */
  .rd-empty { text-align:center; padding:40px 20px; color:var(--txt3); font-size:13px; }
  .rd-score-green { font-family:'Syne',sans-serif; font-weight:800; color:#4ade80; }
  .rd-score-amber { font-family:'Syne',sans-serif; font-weight:800; color:#fbbf24; }
  .rd-score-red   { font-family:'Syne',sans-serif; font-weight:800; color:#f87171; }

  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
`;

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════ */
const PRIORITIES = ['Normale', 'Moyenne', 'Haute'];
const KPI_TYPES  = ['Taux (%)', 'Ratio', 'Nombre', 'Score pondéré'];

const VALIDATION_CRITERIA = [
  { id:'integrite',  label:'Intégrité des données',          desc:'Les données sources sont complètes et sans anomalie.',      severity:'critique' },
  { id:'biais',      label:'Absence de biais méthodologique', desc:'La méthodologie est libre de biais identifiables.',         severity:'critique' },
  { id:'coherence',  label:'Cohérence des analyses',          desc:'Les analyses sont logiquement cohérentes entre elles.',     severity:'majeur'   },
  { id:'pertinence', label:'Pertinence aux objectifs',        desc:'Les livrables répondent aux objectifs définis.',            severity:'majeur'   },
  { id:'rigueur',    label:'Rigueur méthodologique',          desc:'La méthodologie est rigoureuse et reproductible.',          severity:'majeur'   },
  { id:'sources',    label:'Sources vérifiées',               desc:'Toutes les sources citées sont vérifiables.',               severity:'mineur'   },
  { id:'qualite',    label:'Qualité des recommandations',     desc:'Les recommandations sont actionnables et fondées.',         severity:'mineur'   },
];

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════ */
const isResponsable = r => { const s = String(r||'').toLowerCase(); return s.includes('responsable')||s.includes('suivi')||s.includes('resp_suivi'); };
const formatDate    = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
const now           = () => new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
const initials      = name => name ? name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() : '??';
const scoreColor    = s => s >= 75 ? 'rd-score-green' : s >= 55 ? 'rd-score-amber' : 'rd-score-red';

const normalizeReport = (r) => ({
  ...r,
  status:           String(r.status || 'déposé').toLowerCase(),
  assigned_to:      r.assigned_to || r.assigned_charge_name || '',
  assigned_charge:  r.assigned_charge || r.charge_id || null,
  priority:         r.priority || 'Normale',
  deadline:         r.deadline || r.due_date || '',
  company_name:     r.company_name || r.organism_name || '—',
  sector:           r.sector || r.organism_sector || '—',
  compliance_score: r.compliance_score || 0,
  upload_date:      r.upload_date || r.created_at || '',
});

const CheckIcon = () => (
  <svg viewBox="0 0 12 12" style={{width:11,height:11,fill:'none',stroke:'#f0fff8',strokeWidth:2.5,strokeLinecap:'round',strokeLinejoin:'round'}}>
    <polyline points="2,6 5,9 10,3"/>
  </svg>
);

/* SVG Gauge */
const Gauge = ({ value, max=100, color='#10b981', size=120 }) => {
  const pct=Math.min(value/max,1), r=44, cx=60, cy=60, startAngle=-210, totalAngle=240;
  const toRad=d=>d*Math.PI/180;
  const arc  =a=>({ x:cx+r*Math.cos(toRad(startAngle+a)), y:cy+r*Math.sin(toRad(startAngle+a)) });
  const bg1=arc(0), bg2=arc(totalAngle), fg2=arc(totalAngle*pct);
  const lBg=totalAngle>180?1:0, lFg=totalAngle*pct>180?1:0;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <path d={`M${bg1.x} ${bg1.y}A${r} ${r} 0 ${lBg} 1 ${bg2.x} ${bg2.y}`} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="8" strokeLinecap="round"/>
      {pct>0&&<path d={`M${bg1.x} ${bg1.y}A${r} ${r} 0 ${lFg} 1 ${fg2.x} ${fg2.y}`} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" style={{filter:`drop-shadow(0 0 6px ${color}60)`}}/>}
      <text x="60" y="66" textAnchor="middle" fill={color} fontSize="18" fontWeight="800" fontFamily="Syne,sans-serif">{value}{max===100?'%':''}</text>
    </svg>
  );
};

/* ── Status Badge ── */
function StatusBadge({ status }) {
  const map = {
    déposé:{cls:'depose',label:'Déposé'}, depose:{cls:'depose',label:'Déposé'},
    assigné:{cls:'affecte',label:'Assigné'}, assigned:{cls:'affecte',label:'Assigné'},
    affecte:{cls:'affecte',label:'Affecté'},
    valide:{cls:'valide',label:'Validé'}, validated:{cls:'valide',label:'Validé'},
    rejeté:{cls:'rejete',label:'Rejeté'}, rejected:{cls:'rejete',label:'Rejeté'},
  };
  const cfg = map[status] || { cls:'depose', label: status };
  return <span className={`rd-badge ${cfg.cls}`}><span className="rd-badge-dot"/>{cfg.label}</span>;
}

/* ── Affecter Button ── */
function BoutonAffecter({ rapport, chargesEtude, onAffecter, loading }) {
  const charge = chargesEtude.find(c => c.id === rapport.assigned_charge || c.full_name === rapport.assigned_to);
  const isAssigned = !!charge;
  return (
    <button
      className={`rd-btn-affecter ${isAssigned ? 'assigned' : ''}`}
      disabled={loading}
      onClick={(e) => { e.stopPropagation(); onAffecter(rapport); }}
      title={isAssigned ? 'Réaffecter' : 'Affecter à un chargé d\'étude'}
    >
      {isAssigned ? (
        <><span className="rd-btn-affecter-avatar">{initials(charge.full_name)}</span><span>{charge.full_name}</span><span style={{opacity:.55,fontSize:11}}>↺</span></>
      ) : (
        <><span style={{fontSize:14,lineHeight:1}}>+</span><span>Affecter</span></>
      )}
    </button>
  );
}

/* ── Modal Affectation ── */
function ModalAffectation({ rapport, chargesEtude, isOpen, onClose, onConfirm, loading }) {
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    if (isOpen) setSelectedId(rapport?.assigned_charge || '');
  }, [isOpen, rapport]);

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  if (!isOpen || !rapport) return null;

  return (
    <div className="rd-modal-overlay" onClick={onClose}>
      <div className="rd-modal" onClick={e => e.stopPropagation()}>
        <div className="rd-modal-hd">
          <div>
            <p className="rd-modal-label">Affectation du rapport</p>
            <h2 className="rd-modal-title">{rapport.company_name}</h2>
            <p className="rd-modal-ref">Réf. #RPT-{String(rapport.id).padStart(4,'0')} · {rapport.sector} · Score {rapport.compliance_score}%</p>
          </div>
          <button className="rd-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="rd-modal-body">
          <p className="rd-label" style={{marginBottom:14}}>Choisir un chargé d'étude</p>

          {chargesEtude.length === 0 ? (
            <div className="rd-empty">Aucun chargé d'étude disponible.</div>
          ) : (
            chargesEtude.map(c => {
              const isSelected = String(selectedId) === String(c.id);
              const isCurrent  = String(rapport.assigned_charge) === String(c.id);
              return (
                <div key={c.id} className={`rd-charge-option-item ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedId(c.id)}>
                  <div className="rd-charge-option-avatar">{initials(c.full_name)}</div>
                  <div style={{flex:1}}>
                    <p className="rd-charge-option-name">
                      {c.full_name}
                      {isCurrent && <span style={{fontSize:10,color:'var(--g)',marginLeft:6,fontWeight:700}}>ACTUEL</span>}
                    </p>
                    <p className="rd-charge-option-meta">{c.active_count ?? 0} rapport(s) actif(s) · {c.email}</p>
                  </div>
                  {isSelected && <span className="rd-charge-option-check">✓</span>}
                </div>
              );
            })
          )}
        </div>

        <div className="rd-modal-footer">
          <button className="rd-btn ghost" style={{padding:'8px 18px',fontSize:13}} onClick={onClose}>Annuler</button>
          <button
            className="rd-btn primary"
            style={{padding:'8px 22px',fontSize:13}}
            disabled={!selectedId || loading}
            onClick={() => onConfirm(rapport.id, selectedId)}
          >
            {loading ? 'Affectation…' : '✓ Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── New Report Toast ── */
function NewReportToast({ count, onDismiss, onView }) {
  const [out, setOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setOut(true); setTimeout(onDismiss, 350); }, 7000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className={`rd-toast ${out ? 'out' : ''}`}>
      <div className="rd-toast-dot"/>
      <div style={{flex:1}}>
        <div style={{fontSize:13,fontWeight:700,color:'#e8fff6',marginBottom:2}}>
          {count} nouveau{count>1?'x':''} rapport{count>1?'s':''}
        </div>
        <div style={{fontSize:11,color:'var(--txt2)'}}>
          {count>1?'Ils sont':'Il est'} en attente d'affectation
        </div>
      </div>
      <button onClick={onView} style={{background:'rgba(16,185,129,.18)',border:'1px solid rgba(16,185,129,.35)',borderRadius:8,color:'#e8fff6',fontSize:11,fontWeight:700,padding:'5px 10px',cursor:'pointer',whiteSpace:'nowrap'}}>
        Voir
      </button>
      <button onClick={() => { setOut(true); setTimeout(onDismiss, 350); }} style={{background:'none',border:'none',color:'var(--txt3)',cursor:'pointer',fontSize:15,padding:'0 4px',lineHeight:1}}>✕</button>
    </div>
  );
}
export default function ResponsableDashboard() {
  const navigate = useNavigate();

  const { reports: realtimeReports, loading: realtimeLoading, newCount, refresh } = useReportsRealtime(null);
  const { assignReport, fetchChargesEtude, chargesEtude, assigning } = useAssignReport();

  const [reports,   setReports]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [section,   setSection]   = useState('rapports'); // default to rapports tab
  const [selectedId, setSelectedId] = useState(null);

  /* ── Toast state ── */
  const [showToast, setShowToast]   = useState(false);
  const [toastCount, setToastCount] = useState(0);
  // Track ids seen to highlight NEW rows
  const seenIdsRef = useRef(new Set());

  /* ── Affectation modal ── */
  const [modalRapport, setModalRapport] = useState(null);
  const [modalOpen,    setModalOpen]    = useState(false);

  /* ── Filters ── */
  const [query,     setQuery]     = useState('');
  const [filterSec, setFilterSec] = useState('All');
  const [filterStat, setFilterStat] = useState('All');

  /* ── Validation state ── */
  const [validated,        setValidated]        = useState({});
  const [validationChecks, setValidationChecks] = useState({});

  /* ── KPI state ── */
  const [kpis, setKpis] = useState([
    { id:1, name:'Taux de validation',  formula:'(validés / total) × 100',  type:'Taux (%)' },
    { id:2, name:'Taux d\'affectation', formula:'(affectés / total) × 100', type:'Taux (%)' },
  ]);
  const [kpiForm, setKpiForm] = useState({ name:'', formula:'', type:KPI_TYPES[0] });
  const [formulaTokens, setFormulaTokens] = useState([]);
  const [weightItems, setWeightItems] = useState(VALIDATION_CRITERIA.map(c=>({ id:c.id, label:c.label, weight:20 })));

  /* ── Auth ── */
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/responsable-login'); return; }
    try {
      const u = JSON.parse(stored);
      if (!isResponsable(u.role)) { navigate('/responsable-login'); return; }
    } catch { localStorage.clear(); navigate('/responsable-login'); return; }
    fetchChargesEtude();
  }, [navigate, fetchChargesEtude]);

  /* ── Sync reports from realtime hook ── */
  useEffect(() => {
    if (!realtimeReports) return;
    const normalized = realtimeReports.map(normalizeReport);

    // Detect new ids
    const currentIds = new Set(normalized.map(r => r.id));
    const brandNewIds = [...currentIds].filter(id => !seenIdsRef.current.has(id));

    if (seenIdsRef.current.size > 0 && brandNewIds.length > 0) {
      // Some ids are genuinely new (arrived after initial load)
      setToastCount(brandNewIds.length);
      setShowToast(true);
    }

    brandNewIds.forEach(id => seenIdsRef.current.add(id));
    if (seenIdsRef.current.size === 0) {
      currentIds.forEach(id => seenIdsRef.current.add(id));
    }

    setReports(prev => {
      // Merge: keep local assignment updates, patch with new data
      return normalized.map(r => {
        const existing = prev.find(p => p.id === r.id);
        if (existing) {
          // Keep locally updated assignment if not yet reflected in server
          return { ...r, assigned_to: existing.assigned_to || r.assigned_to, assigned_charge: existing.assigned_charge || r.assigned_charge };
        }
        return r;
      });
    });

    setLoading(realtimeLoading);
  }, [realtimeReports, realtimeLoading]);

  /* ── Derived stats ── */
  const total          = reports.length;
  const assignedCount  = reports.filter(r => r.assigned_charge || r.assigned_to).length;
  const unassignedCount= total - assignedCount;
  const validatedCount = reports.filter(r => r.status === 'validated' || r.status === 'valide' || validated[r.id]).length;
  const pendingCount   = total - validatedCount;
  const assignRate     = total ? Math.round((assignedCount/total)*100) : 0;
  const validationRate = total ? Math.round((validatedCount/total)*100) : 0;

  const sectors  = ['All', ...new Set(reports.map(r=>r.sector).filter(Boolean))];
  const statuses = ['All', 'déposé', 'assigné', 'validé', 'rejeté'];

  const filtered = useMemo(() => reports.filter(r => {
    const name = (r.company_name||'').toLowerCase();
    const matchQ    = name.includes(query.toLowerCase());
    const matchSec  = filterSec  === 'All' || r.sector === filterSec;
    const matchStat = filterStat === 'All' || r.status === filterStat || r.status === filterStat.replace('é','e');
    return matchQ && matchSec && matchStat;
  }), [reports, query, filterSec, filterStat]);

  const selectedReport = useMemo(() => reports.find(r=>r.id===selectedId)||null, [reports, selectedId]);

  /* ── Validation helpers ── */
  const checksFor    = rId => validationChecks[rId] || {};
  const critChecks   = rId => VALIDATION_CRITERIA.filter(c=>c.severity==='critique').every(c=>checksFor(rId)[c.id]);
  const checksDone   = rId => VALIDATION_CRITERIA.filter(c=>checksFor(rId)[c.id]).length;
  const toggleCheck  = (rId, cId) => {
    if (validated[rId]) return;
    setValidationChecks(prev => ({ ...prev, [rId]: { ...prev[rId], [cId]: !prev[rId]?.[cId] } }));
  };
  const validateReport = rId => {
    if (!critChecks(rId)) return;
    setValidated(prev => ({ ...prev, [rId]: true }));
    setReports(prev => prev.map(r => r.id===rId ? {...r, status:'validated'} : r));
  };

  /* ── Affectation ── */
  const openModal  = (rapport) => { setModalRapport(rapport); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setModalRapport(null); };

  const handleConfirmAffectation = async (rapportId, chargeId) => {
    const charge = chargesEtude.find(c => String(c.id) === String(chargeId));
    if (!charge) return;
    try {
      await assignReport(rapportId, chargeId);
    } catch (e) {
      console.error('Assign failed:', e);
    }
    // Optimistic local update
    setReports(prev => prev.map(r =>
      r.id === rapportId
        ? { ...r, assigned_to: charge.full_name, assigned_charge: chargeId,
            status: r.status === 'déposé' || r.status === 'depose' ? 'assigné' : r.status }
        : r
    ));
    closeModal();
    // Refresh to sync server state
    setTimeout(refresh, 1200);
  };

  /* ── KPI helpers ── */
  const evalKpi = f => {
    try {
      const expr = f.replace(/validés/g,validatedCount).replace(/affectés/g,assignedCount)
        .replace(/en_attente/g,pendingCount).replace(/total/g,total||1)
        .replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
      const v = Function('"use strict"; return ('+expr+')')();
      return isFinite(v) ? Math.round(v*100)/100 : '—';
    } catch { return '—'; }
  };
  const addKpi = () => {
    if (!kpiForm.name.trim() || !kpiForm.formula.trim()) return;
    setKpis(prev => [...prev, { id:Date.now(), ...kpiForm }]);
    setKpiForm({ name:'', formula:'', type:KPI_TYPES[0] });
    setFormulaTokens([]);
  };
  const appendToken = tok => {
    const next = [...formulaTokens, tok];
    setFormulaTokens(next);
    setKpiForm(p => ({ ...p, formula: next.join(' ') }));
  };

  const weightedScore = useMemo(() => {
    const totalW = weightItems.reduce((s,w)=>s+Number(w.weight),0);
    if (!totalW||!total) return 0;
    const completedW = VALIDATION_CRITERIA.reduce((s,c) => {
      const w = weightItems.find(x=>x.id===c.id);
      const done = Object.values(validationChecks).filter(v=>v[c.id]).length;
      return s + (done/total)*Number(w?.weight||0);
    },0);
    return Math.round((completedW/totalW)*100);
  }, [weightItems, validationChecks, total]);

  /* ── Charge data ── */
  const chargeData = chargesEtude.map((ch,idx) => ({
    ...ch,
    count: reports.filter(r=>String(r.assigned_charge)===String(ch.id)||r.assigned_to===ch.full_name).length,
    color: ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ec4899','#06b6d4'][idx%6],
  }));
  const maxCharge = Math.max(...chargeData.map(c=>c.count),1);

  const handleLogout = () => { localStorage.clear(); navigate('/responsable-login'); };

  // ─────────────────────────────────────────────────────────────────
  // TAB: RAPPORTS (main table)
  // ─────────────────────────────────────────────────────────────────
  const TabRapports = () => {
    // Track which report ids are "new" this session
    const newIds = realtimeReports
      ? new Set(realtimeReports.slice(0, newCount).map(r=>r.id))
      : new Set();

    return (
      <div style={{display:'flex',flexDirection:'column',gap:20}}>
        {/* Toolbar */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:16,flexWrap:'wrap'}}>
          <div>
            <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:'#e8fff6',marginBottom:4}}>
              Rapports déposés
            </h1>
            <p style={{fontSize:13,color:'var(--txt3)'}}>
              {loading ? 'Chargement…' : `${filtered.length} rapport${filtered.length!==1?'s':''}`}
              {unassignedCount > 0 && (
                <span style={{marginLeft:8,color:'var(--amb)',fontWeight:600}}>
                  · {unassignedCount} non affecté{unassignedCount>1?'s':''}
                </span>
              )}
            </p>
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <div className="rd-search-wrap">
              <span className="rd-search-icon">🔍</span>
              <input className="rd-search" placeholder="Rechercher…" value={query} onChange={e=>setQuery(e.target.value)}/>
            </div>
            <select className="rd-filter-select" value={filterSec} onChange={e=>setFilterSec(e.target.value)}>
              {sectors.map(s=><option key={s} value={s}>{s==='All'?'Tous les secteurs':s}</option>)}
            </select>
            <select className="rd-filter-select" value={filterStat} onChange={e=>setFilterStat(e.target.value)}>
              {statuses.map(s=><option key={s} value={s}>{s==='All'?'Tous les statuts':s}</option>)}
            </select>
            <button className="rd-btn ghost" style={{padding:'8px 14px',fontSize:12}} onClick={refresh}>↻ Actualiser</button>
          </div>
        </div>

        <div className="rd-grid-2">
          {/* Table */}
          <div className="rd-panel">
            <div className="rd-panel-hd">
              <h2>Liste des rapports</h2>
              <div style={{display:'flex',gap:10,alignItems:'center'}}>
                <span style={{fontSize:11,color:'var(--txt3)'}}>{filtered.length} total</span>
                {unassignedCount>0&&<span style={{fontSize:10,background:'rgba(245,158,11,.15)',color:'var(--amb)',padding:'2px 8px',borderRadius:99,fontWeight:700}}>{unassignedCount} à affecter</span>}
              </div>
            </div>
            <div style={{overflowX:'auto'}}>
              {filtered.length===0 ? (
                <div className="rd-empty"><div style={{fontSize:28,marginBottom:12}}>📂</div>Aucun rapport trouvé</div>
              ) : (
                <table className="rd-table">
                  <thead>
                    <tr>
                      <th>Organisme</th>
                      <th>Secteur</th>
                      <th>Déposé le</th>
                      <th>Score</th>
                      <th>Statut</th>
                      <th>Chargé d'étude</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => {
                      const isNew = newIds.has(r.id);
                      return (
                        <tr
                          key={r.id}
                          className={`${selectedId===r.id?'selected':''} ${isNew?'is-new':''}`}
                          onClick={() => setSelectedId(r.id)}
                          style={{cursor:'pointer'}}
                        >
                          <td>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              <div>
                                <div style={{fontSize:13,fontWeight:600,color:'#e8fff6'}}>
                                  {r.company_name}
                                  {isNew&&<span className="rd-badge new-pill" style={{marginLeft:6}}>NEW</span>}
                                </div>
                                <div style={{fontSize:11,color:'var(--txt3)',marginTop:2}}>#RPT-{String(r.id).padStart(4,'0')}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{color:'var(--txt2)'}}>{r.sector}</td>
                          <td style={{color:'var(--txt2)'}}>{formatDate(r.upload_date)}</td>
                          <td>
                            <span className={scoreColor(r.compliance_score)} style={{fontSize:15}}>
                              {r.compliance_score}%
                            </span>
                          </td>
                          <td><StatusBadge status={r.status}/></td>
                          <td onClick={e=>e.stopPropagation()}>
                            <BoutonAffecter rapport={r} chargesEtude={chargesEtude} onAffecter={openModal} loading={assigning}/>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Detail panel */}
          <div className="rd-panel">
            <div className="rd-panel-hd"><h2>Détail & Affectation</h2></div>
            <div className="rd-panel-bd">
              {!selectedReport ? (
                <div className="rd-empty">Sélectionnez un rapport pour voir ses détails et l'affecter.</div>
              ) : (
                <>
                  <div className="rd-detail-section">
                    <h3>Informations du rapport</h3>
                    {[
                      ['Organisme', selectedReport.company_name],
                      ['Secteur', selectedReport.sector],
                      ['Dépôt', formatDate(selectedReport.upload_date)],
                    ].map(([k,v]) => (
                      <div key={k} className="rd-detail-row">
                        <span className="rd-detail-key">{k}</span>
                        <span className="rd-detail-val">{v}</span>
                      </div>
                    ))}
                    <div className="rd-detail-row">
                      <span className="rd-detail-key">Score conformité</span>
                      <span className={scoreColor(selectedReport.compliance_score)} style={{fontSize:16}}>
                        {selectedReport.compliance_score}%
                      </span>
                    </div>
                    <div className="rd-detail-row">
                      <span className="rd-detail-key">Statut</span>
                      <StatusBadge status={selectedReport.status}/>
                    </div>
                    {selectedReport.maturity_level && (
                      <div className="rd-detail-row">
                        <span className="rd-detail-key">Niveau maturité</span>
                        <span className="rd-detail-val">Niveau {selectedReport.maturity_level}</span>
                      </div>
                    )}
                  </div>

                  <div className="rd-detail-section">
                    <h3>Affectation</h3>
                    <p style={{fontSize:12,color:'var(--txt3)',marginBottom:10}}>
                      Assignez ce rapport à un chargé d'étude pour traitement.
                    </p>
                    <BoutonAffecter
                      rapport={selectedReport}
                      chargesEtude={chargesEtude}
                      onAffecter={openModal}
                      loading={assigning}
                    />
                    {selectedReport.assigned_to && (
                      <div style={{marginTop:10,padding:'9px 12px',background:'rgba(16,185,129,.07)',border:'1px solid rgba(16,185,129,.15)',borderRadius:9,fontSize:12,color:'var(--g)'}}>
                        ✓ Assigné à <strong>{selectedReport.assigned_to}</strong>
                        {selectedReport.assigned_at && (
                          <span style={{color:'var(--txt3)',marginLeft:8}}>le {formatDate(selectedReport.assigned_at)}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="rd-detail-section">
                    <h3>Priorité & délai</h3>
                    <div className="rd-field">
                      <label className="rd-label">Priorité</label>
                      <select className="rd-select" defaultValue={selectedReport.priority}>
                        {PRIORITIES.map(p=><option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="rd-field" style={{marginBottom:0}}>
                      <label className="rd-label">Date limite</label>
                      <input type="date" className="rd-input" defaultValue={selectedReport.deadline||''}/>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────
  // TAB: MACRO
  // ─────────────────────────────────────────────────────────────────
  const TabMacro = () => (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div className="rd-grid-4">
        {[
          { label:'Taux de validation',  val:validationRate, color:'#10b981', sub:`${validatedCount} validés · ${pendingCount} en attente` },
          { label:'Taux d\'affectation', val:assignRate,     color:'#3b82f6', sub:`${assignedCount} affectés · ${unassignedCount} non affectés` },
          { label:'Score qualité',       val:weightedScore,  color:'#8b5cf6', sub:`${weightItems.length} critères pondérés` },
          { label:'KPIs actifs',         val:kpis.length,    color:'#f59e0b', sub:'indicateurs configurés', isCount:true },
        ].map((item,idx) => (
          <div key={idx} className="rd-panel">
            <div className="rd-panel-hd"><h2>{item.label}</h2></div>
            <div className="rd-panel-bd" style={{display:'flex',flexDirection:'column',alignItems:'center',paddingTop:8}}>
              {item.isCount
                ? <div style={{fontSize:48,fontWeight:800,fontFamily:"'Syne',sans-serif",color:item.color,margin:'16px 0'}}>{item.val}</div>
                : <Gauge value={item.val} color={item.color} size={130}/>
              }
              <div style={{fontSize:11,color:'var(--txt3)',textAlign:'center',marginTop:4}}>{item.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rd-grid-2eq">
        <div className="rd-panel">
          <div className="rd-panel-hd"><h2>Charge par chargé d'étude</h2></div>
          <div className="rd-panel-bd">
            {chargeData.length===0
              ? <div className="rd-empty">Aucun chargé d'étude.</div>
              : chargeData.map(ch => (
                <div key={ch.id} className="rd-charge-row">
                  <div className="rd-charge-avatar" style={{background:`linear-gradient(135deg,${ch.color}88,${ch.color})`}}>{initials(ch.full_name)}</div>
                  <div className="rd-charge-info">
                    <div className="rd-charge-name">{ch.full_name}</div>
                    <div className="rd-progress-wrap" style={{marginTop:6}}>
                      <div className="rd-progress-fill" style={{width:`${Math.round(ch.count/maxCharge*100)}%`,background:`linear-gradient(90deg,${ch.color},${ch.color}aa)`}}/>
                    </div>
                  </div>
                  <div className="rd-charge-count" style={{color:ch.color}}>{ch.count}</div>
                </div>
              ))
            }
          </div>
        </div>
        <div className="rd-panel">
          <div className="rd-panel-hd"><h2>KPIs en direct</h2></div>
          <div className="rd-panel-bd">
            {kpis.slice(0,4).map(k => (
              <div key={k.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 10px',background:'rgba(16,185,129,.05)',borderRadius:10,marginBottom:8}}>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:'#b0f0d8'}}>{k.name}</div>
                  <div style={{fontSize:10,color:'var(--txt3)'}}>{k.type}</div>
                </div>
                <div style={{fontSize:20,fontWeight:800,color:'#10b981'}}>{evalKpi(k.formula)}{k.type==='Taux (%)'?'%':''}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────
  // TAB: AFFECTATION RH
  // ─────────────────────────────────────────────────────────────────
  const TabAffectation = () => {
    const totalAssigned = chargeData.reduce((s,c)=>s+c.count,0);
    return (
      <div style={{display:'flex',flexDirection:'column',gap:20}}>
        <div className="rd-panel">
          <div className="rd-panel-hd">
            <h2>Répartition de la charge</h2>
            <span style={{fontSize:12,color:'var(--txt3)'}}>{totalAssigned} / {total} affectés</span>
          </div>
          <div className="rd-panel-bd">
            {chargeData.length===0
              ? <div className="rd-empty">Aucun chargé d'étude disponible.</div>
              : <>
                  {chargeData.map(ch => (
                    <div key={ch.id} className="rd-charge-row">
                      <div className="rd-charge-avatar" style={{background:`linear-gradient(135deg,${ch.color}88,${ch.color})`}}>{initials(ch.full_name)}</div>
                      <div className="rd-charge-info">
                        <div className="rd-charge-name">{ch.full_name} <span style={{fontSize:10,color:'var(--txt3)'}}>{ch.email}</span></div>
                        <div className="rd-progress-wrap" style={{marginTop:6}}>
                          <div className="rd-progress-fill" style={{width:`${Math.round(ch.count/maxCharge*100)}%`,background:`linear-gradient(90deg,${ch.color},${ch.color}aa)`}}/>
                        </div>
                      </div>
                      <div className="rd-charge-count" style={{color:ch.color}}>{ch.count} rpt</div>
                    </div>
                  ))}
                  <div style={{marginTop:16,paddingTop:12,borderTop:'1px solid rgba(255,255,255,.05)',display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--txt3)'}}>
                    <span>Moy: {chargeData.length ? Math.round(totalAssigned/chargeData.length*10)/10 : 0} rpt/personne</span>
                    <span>{unassignedCount} non affecté{unassignedCount!==1?'s':''}</span>
                  </div>
                </>
            }
          </div>
        </div>

        {/* Cards for unassigned reports first */}
        {unassignedCount > 0 && (
          <div>
            <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,color:'var(--amb)',marginBottom:12}}>
              ⚠️ En attente d'affectation ({unassignedCount})
            </h3>
            <div className="rd-grid-3">
              {reports.filter(r=>!r.assigned_charge&&!r.assigned_to).map(r => (
                <div key={r.id} style={{background:'rgba(245,158,11,.05)',border:'1px solid rgba(245,158,11,.2)',borderRadius:16,padding:'16px 18px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <span style={{fontSize:11,color:'var(--txt3)'}}>#RPT-{String(r.id).padStart(4,'0')}</span>
                    <StatusBadge status={r.status}/>
                  </div>
                  <div style={{fontSize:13,fontWeight:600,color:'#c8eed8',marginBottom:4}}>{r.company_name}</div>
                  <div style={{fontSize:11,color:'var(--txt3)',marginBottom:12}}>{r.sector} · {formatDate(r.upload_date)}</div>
                  <BoutonAffecter rapport={r} chargesEtude={chargesEtude} onAffecter={openModal} loading={assigning}/>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All reports grid */}
        <div>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,color:'var(--txt2)',marginBottom:12}}>
            Tous les rapports ({total})
          </h3>
          <div className="rd-grid-3">
            {reports.map(r => (
              <div key={r.id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:'16px 18px',transition:'all .2s'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                  <span style={{fontSize:11,color:'var(--txt3)'}}>#RPT-{String(r.id).padStart(4,'0')}</span>
                  <StatusBadge status={r.status}/>
                </div>
                <div style={{fontSize:13,fontWeight:600,color:'#c8eed8',marginBottom:12}}>{r.company_name}</div>
                <BoutonAffecter rapport={r} chargesEtude={chargesEtude} onAffecter={openModal} loading={assigning}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────
  // TAB: VALIDATION QA
  // ─────────────────────────────────────────────────────────────────
  const TabValidation = () => (
    <div className="rd-grid-2">
      <div className="rd-panel">
        <div className="rd-panel-hd"><h2>Rapports à valider</h2></div>
        <div style={{overflowX:'auto'}}>
          <table className="rd-table">
            <thead><tr><th>Réf.</th><th>Organisme</th><th>Checklist</th><th>Action</th></tr></thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id} className={selectedId===r.id?'selected':''} onClick={()=>setSelectedId(r.id)} style={{cursor:'pointer'}}>
                  <td>#RPT-{String(r.id).padStart(4,'0')}</td>
                  <td>{r.company_name}</td>
                  <td style={{color:'var(--txt3)'}}>{checksDone(r.id)}/{VALIDATION_CRITERIA.length}</td>
                  <td onClick={e=>e.stopPropagation()}>
                    <button className="rd-btn primary sm"
                      disabled={!critChecks(r.id)||validated[r.id]}
                      onClick={()=>validateReport(r.id)}>
                      {validated[r.id]?'✓ Validé':'Valider'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rd-panel">
        <div className="rd-panel-hd"><h2>Checklist QA</h2></div>
        <div className="rd-panel-bd">
          {!selectedReport
            ? <div className="rd-empty">Sélectionnez un rapport.</div>
            : VALIDATION_CRITERIA.map(c => {
                const checked = !!checksFor(selectedReport.id)[c.id];
                return (
                  <div key={c.id} className="rd-check-item" onClick={()=>toggleCheck(selectedReport.id,c.id)}>
                    <div className={`rd-check-box ${checked?'checked':''}`}><CheckIcon/></div>
                    <div>
                      <div className={`rd-check-label ${checked?'done':''}`}>{c.label}</div>
                      <div className="rd-check-desc">{c.desc}</div>
                    </div>
                  </div>
                );
              })
          }
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────
  // TAB: INDICATEURS
  // ─────────────────────────────────────────────────────────────────
  const TabIndicateurs = () => (
    <div className="rd-grid-2eq">
      <div className="rd-panel">
        <div className="rd-panel-hd"><h2>KPIs actifs</h2><span style={{fontSize:11,color:'var(--txt3)'}}>{kpis.length}</span></div>
        <div className="rd-panel-bd">
          {kpis.map(k => (
            <div key={k.id} className="rd-kpi-card">
              <div className="rd-kpi-header">
                <span className="rd-kpi-name">{k.name}</span>
                <button className="rd-kpi-del" onClick={()=>setKpis(p=>p.filter(x=>x.id!==k.id))}>×</button>
              </div>
              <div className="rd-kpi-formula">{k.formula}</div>
              <div className="rd-kpi-value">{evalKpi(k.formula)}{k.type==='Taux (%)'?'%':''}</div>
            </div>
          ))}
          <div style={{marginTop:16,paddingTop:16,borderTop:'1px solid rgba(255,255,255,.07)'}}>
            <p className="rd-label" style={{marginBottom:8}}>Nouveau KPI</p>
            <input className="rd-input" style={{marginBottom:8}} placeholder="Nom du KPI" value={kpiForm.name} onChange={e=>setKpiForm(p=>({...p,name:e.target.value}))}/>
            <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:8}}>
              {['total','validés','affectés','en_attente','+','−','×','÷','(',')','/','100'].map(tok=>(
                <button key={tok} onClick={()=>appendToken(tok)} style={{padding:'3px 8px',background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.2)',borderRadius:6,color:'#7eefc6',fontSize:11,cursor:'pointer',fontFamily:'monospace'}}>{tok}</button>
              ))}
              <button onClick={()=>{setFormulaTokens([]);setKpiForm(p=>({...p,formula:''}));}} style={{padding:'3px 8px',background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)',borderRadius:6,color:'#f87171',fontSize:11,cursor:'pointer'}}>✕</button>
            </div>
            <input className="rd-input" style={{marginBottom:8}} placeholder="Formule" value={kpiForm.formula} onChange={e=>setKpiForm(p=>({...p,formula:e.target.value}))}/>
            <select className="rd-select" style={{marginBottom:10}} value={kpiForm.type} onChange={e=>setKpiForm(p=>({...p,type:e.target.value}))}>
              {KPI_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
            <button className="rd-btn primary" style={{width:'100%'}} onClick={addKpi}>Ajouter</button>
          </div>
        </div>
      </div>
      <div className="rd-panel">
        <div className="rd-panel-hd"><h2>Pondération des critères</h2></div>
        <div className="rd-panel-bd">
          <div style={{marginBottom:12,fontSize:12,color:'var(--txt3)'}}>
            Score qualité : <strong style={{color:'#a78bfa'}}>{weightedScore}%</strong>
          </div>
          {weightItems.map(w => (
            <div key={w.id} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
              <span style={{flex:1,fontSize:12,color:'#c8eed8'}}>{w.label}</span>
              <input type="number" min="0" max="100" value={w.weight}
                onChange={e=>setWeightItems(p=>p.map(x=>x.id===w.id?{...x,weight:Number(e.target.value)}:x))}
                style={{width:55,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:8,padding:'5px 8px',color:'var(--txt)',fontSize:12,outline:'none'}}
              />
              <span style={{fontSize:11,color:'var(--txt3)',width:20}}>%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════
     TABS CONFIG
  ═══════════════════════════════════════════════════════════════ */
  const TABS = [
    { key:'rapports',    label:'Rapports',       icon:'≡',  badge:total,         badgeNew: unassignedCount > 0 },
    { key:'affectation', label:'Affectation RH', icon:'⊕',  badge:unassignedCount, badgeNew: unassignedCount > 0 },
    { key:'macro',       label:'Vue Macro',      icon:'◈' },
    { key:'validation',  label:'Validation QA',  icon:'✓',  badge:pendingCount },
    { key:'indicateurs', label:'Indicateurs',    icon:'∿',  badge:kpis.length },
  ];

  /* ═══════════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="rd-root">
      <style>{CSS}</style>

      {/* New report toast */}
      {showToast && (
        <NewReportToast
          count={toastCount}
          onDismiss={() => setShowToast(false)}
          onView={() => { setSection('rapports'); setShowToast(false); }}
        />
      )}

      {/* Affectation modal */}
      <ModalAffectation
        rapport={modalRapport}
        chargesEtude={chargesEtude}
        isOpen={modalOpen}
        onClose={closeModal}
        onConfirm={handleConfirmAffectation}
        loading={assigning}
      />

      <div className="rd-wrap">
        {/* Topbar */}
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
            <button className="rd-btn ghost" style={{padding:'8px 14px',fontSize:12}} onClick={refresh}>
              ↻ Actualiser
            </button>
            <button className="rd-logout-btn" onClick={handleLogout}>Déconnexion</button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="rd-stats">
          <div className="rd-stat green">
            <div className="rd-stat-label">Total rapports</div>
            <div className="rd-stat-val">{total}</div>
            {newCount > 0 && <div className="rd-stat-new">+{newCount} nouveaux</div>}
          </div>
          <div className="rd-stat blue">
            <div className="rd-stat-label">Affectés</div>
            <div className="rd-stat-val">{assignedCount}</div>
            <div className="rd-stat-note">{assignRate}%</div>
          </div>
          <div className="rd-stat amber">
            <div className="rd-stat-label">Non affectés</div>
            <div className="rd-stat-val">{unassignedCount}</div>
            <div className="rd-stat-note">à traiter</div>
          </div>
          <div className="rd-stat green">
            <div className="rd-stat-label">Validés</div>
            <div className="rd-stat-val">{validatedCount}</div>
            <div className="rd-stat-note">{validationRate}%</div>
          </div>
          <div className="rd-stat purple">
            <div className="rd-stat-label">Score qualité</div>
            <div className="rd-stat-val">{weightedScore}%</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="rd-tabs">
          {TABS.map(t => (
            <button key={t.key} className={`rd-tab ${section===t.key?'active':''}`} onClick={()=>setSection(t.key)}>
              <span>{t.icon}</span>
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span className={`rd-tab-badge ${t.badgeNew?'new':''}`}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {section === 'rapports'    && <TabRapports/>}
        {section === 'affectation' && <TabAffectation/>}
        {section === 'macro'       && <TabMacro/>}
        {section === 'validation'  && <TabValidation/>}
        {section === 'indicateurs' && <TabIndicateurs/>}
      </div>
    </div>
  );
}