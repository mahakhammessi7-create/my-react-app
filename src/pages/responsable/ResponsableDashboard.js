import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';

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
  .rd-stat-spark { position:absolute; bottom:0; right:0; opacity:.15; }

  /* ── TABS ── */
  .rd-tabs { display:flex; gap:2px; margin-bottom:26px; border-bottom:1px solid rgba(255,255,255,.06); }
  .rd-tab { border:none; background:none; color:var(--txt3); font-size:13px; font-weight:600; padding:12px 22px; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; transition:all .2s; font-family:'DM Sans',sans-serif; letter-spacing:.02em; display:flex; align-items:center; gap:7px; }
  .rd-tab:hover { color:var(--txt2); }
  .rd-tab.active { color:var(--g); border-bottom-color:var(--g); }
  .rd-tab-icon { width:16px; height:16px; opacity:.8; }
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
  .rd-btn.danger { background:rgba(239,68,68,.1); color:#f87171; border:1px solid rgba(239,68,68,.2); }
  .rd-btn.amber-btn { background:rgba(245,158,11,.12); color:var(--amb); border:1px solid rgba(245,158,11,.2); }
  .rd-btn.sm { padding:6px 12px; font-size:11px; border-radius:8px; }
  .rd-btn.icon-btn { padding:7px; display:flex; align-items:center; justify-content:center; }

  /* ── FORM ── */
  .rd-select, .rd-input, .rd-textarea { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); color:var(--txt); border-radius:10px; padding:9px 12px; font-size:13px; font-family:'DM Sans',sans-serif; outline:none; transition:border .2s; width:100%; }
  .rd-select:focus, .rd-input:focus, .rd-textarea:focus { border-color:rgba(16,185,129,.4); background:rgba(16,185,129,.04); }
  .rd-select option { background:#0c1f1a; }
  .rd-textarea { resize:vertical; min-height:72px; }
  .rd-label { font-size:10.5px; text-transform:uppercase; letter-spacing:.13em; color:var(--txt3); font-weight:700; margin-bottom:6px; display:block; }
  .rd-field { margin-bottom:14px; }
  .rd-field:last-child { margin-bottom:0; }

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
  .rd-check-severity { font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; margin-top:4px; }

  /* ── PROGRESS ── */
  .rd-progress-wrap { background:rgba(255,255,255,.07); border-radius:999px; height:5px; overflow:hidden; }
  .rd-progress-fill { height:100%; border-radius:999px; background:linear-gradient(90deg,var(--g),var(--g2)); transition:width .5s cubic-bezier(.4,0,.2,1); }
  .rd-progress-wrap.thick { height:8px; }
  .rd-progress-fill.amber { background:linear-gradient(90deg,var(--amb),#fcd34d); }
  .rd-progress-fill.blue  { background:linear-gradient(90deg,var(--blu),#93c5fd); }
  .rd-progress-fill.red   { background:linear-gradient(90deg,var(--red),#fca5a5); }

  /* ── KPI CARDS ── */
  .rd-kpi-card { background:rgba(16,185,129,.05); border:1px solid rgba(16,185,129,.13); border-radius:14px; padding:14px 16px; transition:border-color .2s; }
  .rd-kpi-card:hover { border-color:rgba(16,185,129,.25); }
  .rd-kpi-header { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:8px; }
  .rd-kpi-name { font-size:13px; font-weight:700; color:#b0f0d8; }
  .rd-kpi-formula { font-size:11px; color:var(--txt3); font-family:monospace; background:rgba(0,0,0,.2); padding:5px 8px; border-radius:6px; margin-top:4px; word-break:break-all; }
  .rd-kpi-value { font-size:22px; font-weight:800; font-family:'Syne',sans-serif; color:var(--g); margin-top:8px; }
  .rd-kpi-type { font-size:10px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; }
  .rd-kpi-del { background:none; border:none; color:var(--txt3); cursor:pointer; font-size:18px; padding:0; transition:color .15s; line-height:1; }
  .rd-kpi-del:hover { color:#f87171; }

  /* ── ASSIGN CARD ── */
  .rd-assign-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:16px 18px; transition:all .2s; }
  .rd-assign-card:hover { border-color:var(--border2); transform:translateY(-1px); }
  .rd-assign-card.overloaded { border-color:rgba(245,158,11,.25); }
  .rd-assign-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
  .rd-assign-id { font-size:11px; color:var(--txt3); font-weight:700; }
  .rd-assign-org { font-size:13px; font-weight:600; color:#c8eed8; margin-bottom:4px; }
  .rd-assign-skills { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:12px; }
  .rd-skill-tag { background:rgba(59,130,246,.1); border:1px solid rgba(59,130,246,.18); color:#93c5fd; border-radius:6px; padding:2px 8px; font-size:10.5px; font-weight:600; }

  /* ── CHARGE ROW ── */
  .rd-charge-row { display:flex; align-items:center; gap:14px; padding:12px 0; border-bottom:1px solid rgba(255,255,255,.05); }
  .rd-charge-row:last-child { border-bottom:none; }
  .rd-charge-avatar { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,var(--g3),var(--g)); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; color:#f0fff8; flex-shrink:0; }
  .rd-charge-info { flex:1; min-width:0; }
  .rd-charge-name { font-size:13px; font-weight:600; color:#c8eed8; }
  .rd-charge-meta { font-size:11px; color:var(--txt3); margin-top:2px; }
  .rd-charge-count { font-size:22px; font-weight:800; font-family:'Syne',sans-serif; color:var(--g); }

  /* ── DETAIL SECTION ── */
  .rd-detail-section { background:rgba(16,185,129,.04); border:1px solid rgba(16,185,129,.1); border-radius:14px; padding:14px 16px; margin-bottom:12px; }
  .rd-detail-section h3 { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:#4d9e82; margin-bottom:10px; }
  .rd-detail-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:7px; }
  .rd-detail-row:last-child { margin-bottom:0; }
  .rd-detail-key { font-size:12px; color:var(--txt3); }
  .rd-detail-val { font-size:13px; font-weight:600; color:#c8eed8; }

  /* ── METRIC ── */
  .rd-metric-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
  .rd-metric-card { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:16px; text-align:center; }
  .rd-metric-val { font-size:26px; font-weight:800; font-family:'Syne',sans-serif; color:var(--g); line-height:1; margin-bottom:5px; }
  .rd-metric-label { font-size:10.5px; text-transform:uppercase; letter-spacing:.1em; color:var(--txt3); font-weight:600; }

  /* ── GAUGE ── */
  .rd-gauge-wrap { display:flex; flex-direction:column; align-items:center; padding:16px 0 8px; }
  .rd-gauge-val { font-size:32px; font-weight:800; font-family:'Syne',sans-serif; color:var(--g); line-height:1; margin-top:8px; }
  .rd-gauge-label { font-size:11px; color:var(--txt3); text-transform:uppercase; letter-spacing:.1em; margin-top:4px; }

  /* ── SECTION TITLE ── */
  .rd-section-title { font-size:11.5px; font-weight:700; color:#6abf99; text-transform:uppercase; letter-spacing:.13em; margin-bottom:14px; }

  /* ── ALERT BOX ── */
  .rd-alert { border-radius:12px; padding:12px 14px; font-size:12.5px; margin-bottom:12px; display:flex; align-items:flex-start; gap:10px; }
  .rd-alert.warn { background:rgba(245,158,11,.08); border:1px solid rgba(245,158,11,.2); color:#fcd34d; }
  .rd-alert.info { background:rgba(59,130,246,.08); border:1px solid rgba(59,130,246,.2); color:#93c5fd; }
  .rd-alert.success { background:rgba(16,185,129,.08); border:1px solid rgba(16,185,129,.2); color:var(--g2); }
  .rd-alert-icon { font-size:16px; flex-shrink:0; margin-top:-1px; }

  /* ── TIMELINE ── */
  .rd-timeline { position:relative; padding-left:24px; }
  .rd-timeline::before { content:''; position:absolute; left:7px; top:6px; bottom:6px; width:1.5px; background:linear-gradient(to bottom,var(--g),transparent); }
  .rd-tl-item { position:relative; margin-bottom:16px; }
  .rd-tl-dot { position:absolute; left:-21px; top:4px; width:10px; height:10px; border-radius:50%; background:var(--g); box-shadow:0 0 8px rgba(16,185,129,.4); }
  .rd-tl-dot.amber { background:var(--amb); box-shadow:0 0 8px rgba(245,158,11,.4); }
  .rd-tl-dot.blue { background:var(--blu); box-shadow:0 0 8px rgba(59,130,246,.4); }
  .rd-tl-label { font-size:12px; font-weight:600; color:#c8eed8; }
  .rd-tl-meta { font-size:11px; color:var(--txt3); margin-top:2px; }

  /* ── FORMULA BUILDER ── */
  .rd-formula-chips { display:flex; flex-wrap:wrap; gap:6px; margin:10px 0; }
  .rd-chip { background:rgba(16,185,129,.08); border:1px solid rgba(16,185,129,.2); color:var(--g2); border-radius:8px; padding:5px 10px; font-size:12px; font-weight:600; cursor:pointer; transition:all .15s; }
  .rd-chip:hover { background:rgba(16,185,129,.16); transform:scale(1.04); }
  .rd-chip.op { background:rgba(245,158,11,.08); border-color:rgba(245,158,11,.2); color:var(--amb); }

  /* ── BAR CHART (CSS) ── */
  .rd-bar-chart { display:flex; flex-direction:column; gap:10px; }
  .rd-bar-row { display:flex; align-items:center; gap:10px; }
  .rd-bar-name { font-size:12px; color:var(--txt2); width:110px; flex-shrink:0; }
  .rd-bar-track { flex:1; background:rgba(255,255,255,.06); border-radius:999px; height:6px; overflow:hidden; }
  .rd-bar-fill { height:100%; border-radius:999px; transition:width .6s cubic-bezier(.4,0,.2,1); }
  .rd-bar-count { font-size:12px; font-weight:700; color:var(--txt2); width:28px; text-align:right; flex-shrink:0; }

  /* ── PIE CHART ── */
  .rd-pie-legend { display:flex; flex-direction:column; gap:8px; }
  .rd-pie-legend-item { display:flex; align-items:center; gap:8px; font-size:12px; }
  .rd-pie-dot { width:10px; height:10px; border-radius:3px; flex-shrink:0; }

  .rd-empty { text-align:center; padding:36px 20px; color:var(--txt3); font-size:13px; }

  /* ── VAL PROGRESS ── */
  .rd-val-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
  .rd-val-row-label { font-size:12px; color:var(--txt3); }
  .rd-val-row-count { font-size:12px; font-weight:700; color:var(--g); }

  /* ── SCORE CARD ── */
  .rd-score-card { background:linear-gradient(135deg,rgba(16,185,129,.08),rgba(16,185,129,.03)); border:1px solid rgba(16,185,129,.18); border-radius:16px; padding:16px; text-align:center; }
  .rd-score-num { font-size:40px; font-weight:800; font-family:'Syne',sans-serif; color:var(--g); line-height:1; }
  .rd-score-sub { font-size:11px; color:var(--txt3); text-transform:uppercase; letter-spacing:.12em; margin-top:4px; }

  /* ── WEIGHTED ITEM ── */
  .rd-weight-item { display:flex; align-items:center; gap:12px; padding:10px 12px; background:rgba(255,255,255,.025); border-radius:10px; margin-bottom:8px; border:1px solid var(--border); }
  .rd-weight-name { flex:1; font-size:13px; color:#c8eed8; }
  .rd-weight-pct { font-size:12px; font-weight:700; color:var(--amb); width:40px; text-align:right; }
  .rd-weight-input { width:64px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); color:var(--txt); border-radius:7px; padding:5px 8px; font-size:12px; font-family:'DM Sans',sans-serif; outline:none; }
  .rd-weight-input:focus { border-color:rgba(16,185,129,.35); }
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
const initials      = name => name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
const getSeverityColor = s => s==='critique' ? '#f87171' : s==='majeur' ? '#f59e0b' : '#60a5fa';

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

/* Simple Bar Chart SVG */
const BarChart = ({ data, height=120 }) => {
  const max = Math.max(...data.map(d=>d.value),1);
  const w = 100 / data.length;
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width:'100%', height }}>
      {data.map((d,i) => {
        const h = (d.value/max) * (height-20);
        const x = i * w + w*0.15;
        return (
          <g key={i}>
            <rect x={x} y={height-20-h} width={w*0.7} height={h}
              fill={d.color||'#10b981'} rx="2" opacity=".75"/>
            <text x={x+w*0.35} y={height-4} textAnchor="middle" fontSize="5" fill="#5a8e78">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function ResponsableDashboard() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [section, setSection] = useState('macro');
  const [selectedId, setSelectedId] = useState(null);

  /* ── STATE: Pilier 1 – RH ── */
  const [assignments, setAssignments] = useState({}); // { reportId: { charge, priority, deadline, competences[] } }

  /* ── STATE: Pilier 2 – Validation ── */
  const [validationChecks, setValidationChecks] = useState({}); // { reportId: { criteriaId: bool } }
  const [validated, setValidated] = useState({});
  const [comments, setComments] = useState({});

  /* ── STATE: Pilier 3 – KPI ── */
  const [kpis, setKpis] = useState([
    { id: 1, name: 'Taux de validation', formula: '(validés / total) × 100', type: 'Taux (%)', weights: {} },
    { id: 2, name: 'Taux d\'affectation', formula: '(affectés / total) × 100', type: 'Taux (%)', weights: {} },
  ]);
  const [kpiForm, setKpiForm] = useState({ name:'', formula:'', type: KPI_TYPES[0], weights:{} });
  const [formulaTokens, setFormulaTokens] = useState([]);
  const [weightItems, setWeightItems] = useState(
    VALIDATION_CRITERIA.map(c => ({ id:c.id, label:c.label, weight:20 }))
  );

  /* ── AUTH GUARD + LOAD ── */
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/responsable-login'); return; }
    try {
      const u = JSON.parse(stored);
      if (!isResponsable(u.role)) { navigate('/responsable-login'); return; }
    } catch { localStorage.clear(); navigate('/responsable-login'); return; }

    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await API.get('/reports/all');
        const raw = res.data?.data || res.data || [];
        setReports(raw.map(r => ({ ...r, validation_status: r.validation_status||'pending' })));
      } catch { setError('Impossible de charger les rapports.'); setReports([]); }
      finally { setLoading(false); }
    })();
  }, [navigate]);

  /* ── DERIVED ── */
  const total          = reports.length;
  const assignedCount  = reports.filter(r => assignments[r.id]?.charge || r.assigned_to).length;
  const validatedCount = Object.values(validated).filter(Boolean).length;
  const pendingCount   = total - validatedCount;
  const highPrioCount  = reports.filter(r => assignments[r.id]?.priority === 'Haute').length;
  const validationRate = total ? Math.round((validatedCount/total)*100) : 0;
  const assignRate     = total ? Math.round((assignedCount/total)*100) : 0;

  const selectedReport = useMemo(() => reports.find(r => r.id === selectedId)||null, [reports, selectedId]);

  /* ── HANDLERS ── */
  const setAssign = (rId, field, value) =>
    setAssignments(prev => ({ ...prev, [rId]: { ...prev[rId], [field]: value } }));

  const toggleCompetence = (rId, skill) => {
    const cur = assignments[rId]?.competences || [];
    const next = cur.includes(skill) ? cur.filter(s=>s!==skill) : [...cur, skill];
    setAssign(rId, 'competences', next);
  };

  const toggleCheck = (rId, cId) => {
    if (validated[rId]) return;
    setValidationChecks(prev => ({ ...prev, [rId]: { ...prev[rId], [cId]: !prev[rId]?.[cId] } }));
  };

  const checksFor    = (rId) => validationChecks[rId] || {};
  const critChecks   = (rId) => VALIDATION_CRITERIA.filter(c=>c.severity==='critique').every(c=>checksFor(rId)[c.id]);
  const allChecks    = (rId) => VALIDATION_CRITERIA.every(c=>checksFor(rId)[c.id]);
  const checksDone   = (rId) => VALIDATION_CRITERIA.filter(c=>checksFor(rId)[c.id]).length;

  const validateReport = (rId) => { if(critChecks(rId)) setValidated(prev=>({...prev,[rId]:true})); };
  const validateAll    = () => { const a={}; reports.forEach(r=>{a[r.id]=true;}); setValidated(a); };

  const getAssignment  = (r) => assignments[r.id] || { charge:r.assigned_to||'', priority:'Normale', deadline:'', competences:[] };

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

  /* Compute KPI live values */
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

  /* Weighted score */
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

  /* charge bar data */
  const chargeData = CHARGES.map(ch => ({
    name: ch.name,
    count: reports.filter(r=>(assignments[r.id]?.charge||r.assigned_to)===ch.name).length,
    color: ch.color,
  }));
  const maxCharge = Math.max(...chargeData.map(c=>c.count),1);

  /* ══════════════════════════════════════════
     TAB: MACRO DASHBOARD
  ══════════════════════════════════════════ */
  const TabMacro = () => (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Row 1: gauges + bar chart */}
      <div className="rd-grid-4">
        {/* Gauge: Validation */}
        <div className="rd-panel">
          <div className="rd-panel-hd"><h2>Taux de validation</h2></div>
          <div className="rd-panel-bd" style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{ position:'relative', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
              <Gauge value={validationRate} color="#10b981" size={130}/>
              <div style={{ position:'absolute', textAlign:'center' }}>
                <div style={{ fontSize:24, fontWeight:800, fontFamily:'Syne,sans-serif', color:'#10b981' }}>{validationRate}%</div>
                <div style={{ fontSize:10, color:'#4d8870', textTransform:'uppercase', letterSpacing:'.1em' }}>Validés</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:16, marginTop:8 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:16, fontWeight:800, fontFamily:'Syne,sans-serif', color:'#10b981' }}>{validatedCount}</div>
                <div style={{ fontSize:10, color:'#4d8870' }}>Validés</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:16, fontWeight:800, fontFamily:'Syne,sans-serif', color:'#f59e0b' }}>{pendingCount}</div>
                <div style={{ fontSize:10, color:'#4d8870' }}>En attente</div>
              </div>
            </div>
          </div>
        </div>

        {/* Gauge: Affectation */}
        <div className="rd-panel">
          <div className="rd-panel-hd"><h2>Taux d'affectation</h2></div>
          <div className="rd-panel-bd" style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{ position:'relative', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
              <Gauge value={assignRate} color="#3b82f6" size={130}/>
              <div style={{ position:'absolute', textAlign:'center' }}>
                <div style={{ fontSize:24, fontWeight:800, fontFamily:'Syne,sans-serif', color:'#3b82f6' }}>{assignRate}%</div>
                <div style={{ fontSize:10, color:'#4d8870', textTransform:'uppercase', letterSpacing:'.1em' }}>Affectés</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:16, marginTop:8 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:16, fontWeight:800, fontFamily:'Syne,sans-serif', color:'#3b82f6' }}>{assignedCount}</div>
                <div style={{ fontSize:10, color:'#4d8870' }}>Affectés</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:16, fontWeight:800, fontFamily:'Syne,sans-serif', color:'#f59e0b' }}>{total-assignedCount}</div>
                <div style={{ fontSize:10, color:'#4d8870' }}>Non affectés</div>
              </div>
            </div>
          </div>
        </div>

        {/* Score qualité */}
        <div className="rd-panel">
          <div className="rd-panel-hd"><h2>Score qualité pondéré</h2></div>
          <div className="rd-panel-bd" style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{ position:'relative', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
              <Gauge value={weightedScore} color="#8b5cf6" size={130}/>
              <div style={{ position:'absolute', textAlign:'center' }}>
                <div style={{ fontSize:24, fontWeight:800, fontFamily:'Syne,sans-serif', color:'#8b5cf6' }}>{weightedScore}%</div>
                <div style={{ fontSize:10, color:'#4d8870', textTransform:'uppercase', letterSpacing:'.1em' }}>Qualité</div>
              </div>
            </div>
            <div style={{ marginTop:8, fontSize:11, color:'#4d8870', textAlign:'center' }}>
              Basé sur {weightItems.length} critères pondérés
            </div>
          </div>
        </div>

        {/* KPI rapides */}
        <div className="rd-panel">
          <div className="rd-panel-hd"><h2>KPIs actifs</h2><span style={{fontSize:11,color:'#4d8870'}}>{kpis.length} indicateurs</span></div>
          <div className="rd-panel-bd" style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {kpis.slice(0,3).map(k => (
              <div key={k.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', background:'rgba(16,185,129,.05)', borderRadius:10, border:'1px solid rgba(16,185,129,.1)' }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:'#b0f0d8' }}>{k.name}</div>
                  <div style={{ fontSize:10, color:'#4d8870', marginTop:2 }}>{k.type}</div>
                </div>
                <div style={{ fontSize:20, fontWeight:800, fontFamily:'Syne,sans-serif', color:'#10b981' }}>
                  {evalKpi(k.formula)}{k.type==='Taux (%)' ? '%' : ''}
                </div>
              </div>
            ))}
            {kpis.length === 0 && <div className="rd-empty" style={{padding:'16px 0'}}>Aucun KPI défini</div>}
          </div>
        </div>
      </div>

      {/* Row 2: charge repartition + timeline + priority */}
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
                  <div style={{ marginTop:6 }}>
                    <div className="rd-progress-wrap">
                      <div className="rd-progress-fill" style={{ width:`${maxCharge?Math.round(ch.count/maxCharge*100):0}%`, background:`linear-gradient(90deg,${ch.color},${ch.color}aa)` }}/>
                    </div>
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
                  <span className="rd-val-row-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ width:8, height:8, borderRadius:'50%', background:p.color, display:'inline-block' }}/>
                    {p.label}
                  </span>
                  <span className="rd-val-row-count" style={{ color:p.color }}>{p.count}</span>
                </div>
                <div className="rd-progress-wrap">
                  <div className="rd-progress-fill" style={{ width:`${total?Math.round(p.count/total*100):0}%`, background:`linear-gradient(90deg,${p.color},${p.color}aa)` }}/>
                </div>
              </div>
            ))}

            <div style={{ marginTop:20, padding:'12px 14px', background:'rgba(16,185,129,.05)', borderRadius:12, border:'1px solid rgba(16,185,129,.1)' }}>
              <div style={{ fontSize:11, color:'#4d8870', marginBottom:6, textTransform:'uppercase', letterSpacing:'.1em' }}>Statut global</div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <span className="rd-badge green">{validatedCount} validés</span>
                <span className="rd-badge amber">{pendingCount} en attente</span>
                <span className="rd-badge red">{highPrioCount} haute priorité</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: validation progress per criteria */}
      <div className="rd-panel">
        <div className="rd-panel-hd"><h2>Taux de complétion par critère de validation</h2></div>
        <div className="rd-panel-bd">
          <div className="rd-bar-chart">
            {VALIDATION_CRITERIA.map(c => {
              const done = Object.values(validationChecks).filter(v=>v[c.id]).length;
              const pct  = total ? Math.round((done/total)*100) : 0;
              const col  = getSeverityColor(c.severity);
              return (
                <div key={c.id} className="rd-bar-row">
                  <div className="rd-bar-name">{c.label}</div>
                  <div className="rd-bar-track" style={{ flex:1 }}>
                    <div className="rd-bar-fill" style={{ width:`${pct}%`, background:`linear-gradient(90deg,${col},${col}88)` }}/>
                  </div>
                  <div className="rd-bar-count" style={{ color:col }}>{pct}%</div>
                  <span className="rd-badge" style={{ background:`${col}18`, color:col, marginLeft:6 }}>{c.severity}</span>
                </div>
              );
            })}
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
        <div className="rd-panel-hd">
          <h2>Liste des rapports</h2>
          <span style={{fontSize:12,color:'#4d8870'}}>{loading?'Chargement…':`${total} rapports`}</span>
        </div>
        <div style={{overflowX:'auto'}}>
          {error && <div className="rd-empty">{error}</div>}
          {!error && !loading && total===0 && <div className="rd-empty">Aucun rapport disponible.</div>}
          {!error && total>0 && (
            <table className="rd-table">
              <thead>
                <tr><th>Réf.</th><th>Organisme</th><th>Chargé</th><th>Compétences</th><th>Priorité</th><th>Échéance</th><th>Statut</th></tr>
              </thead>
              <tbody>
                {reports.map(r => {
                  const a = getAssignment(r);
                  const isVal = validated[r.id];
                  return (
                    <tr key={r.id} className={selectedId===r.id?'selected':''} onClick={()=>setSelectedId(r.id)}>
                      <td style={{color:'#4d8870',fontWeight:700}}>#{r.id}</td>
                      <td style={{color:'#c8eed8'}}>{r.company_name||r.organism_name||'—'}</td>
                      <td style={{color:'#6a9e88'}}>{a.charge||<em style={{color:'#3a6650'}}>Non affecté</em>}</td>
                      <td>
                        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                          {(a.competences||[]).slice(0,2).map(s=><span key={s} className="rd-skill-tag">{s}</span>)}
                          {(a.competences||[]).length>2 && <span style={{fontSize:10,color:'#4d8870'}}>+{a.competences.length-2}</span>}
                        </div>
                      </td>
                      <td><PriorityDot priority={a.priority}/><span style={{fontSize:12}}>{a.priority}</span></td>
                      <td style={{fontSize:12,color:'#4d8870'}}>{a.deadline?formatDate(a.deadline):'—'}</td>
                      <td><span className={`rd-badge ${isVal?'validated':'pending'}`}>{isVal?'Validé':'En attente'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="rd-panel">
        <div className="rd-panel-hd"><h2>Détails & Affectation rapide</h2></div>
        <div className="rd-panel-bd">
          {!selectedReport
            ? <div className="rd-empty">Sélectionnez un rapport.</div>
            : (() => {
              const a = getAssignment(selectedReport);
              const done = checksDone(selectedReport.id);
              return (
                <>
                  <div className="rd-detail-section">
                    <h3>Informations</h3>
                    <div className="rd-detail-row"><span className="rd-detail-key">Organisme</span><span className="rd-detail-val">{selectedReport.company_name||'—'}</span></div>
                    <div className="rd-detail-row"><span className="rd-detail-key">Dépôt</span><span className="rd-detail-val">{formatDate(selectedReport.upload_date||selectedReport.created_at)}</span></div>
                    <div className="rd-detail-row">
                      <span className="rd-detail-key">Checklist</span>
                      <span style={{display:'flex',alignItems:'center',gap:8}}>
                        <div className="rd-progress-wrap" style={{width:60}}><div className="rd-progress-fill" style={{width:`${(done/VALIDATION_CRITERIA.length)*100}%`}}/></div>
                        <span style={{fontSize:12,fontWeight:700,color:'#10b981'}}>{done}/{VALIDATION_CRITERIA.length}</span>
                      </span>
                    </div>
                    <div className="rd-detail-row"><span className="rd-detail-key">Statut</span><span className={`rd-badge ${validated[selectedReport.id]?'validated':'pending'}`}>{validated[selectedReport.id]?'Validé':'En attente'}</span></div>
                  </div>

                  <div className="rd-detail-section">
                    <h3>Affectation</h3>
                    <div className="rd-field">
                      <label className="rd-label">Chargé d'étude</label>
                      <select className="rd-select" value={a.charge} onChange={e=>setAssign(selectedReport.id,'charge',e.target.value)}>
                        <option value="">— Sélectionner —</option>
                        {CHARGES.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="rd-grid-2eq">
                      <div className="rd-field">
                        <label className="rd-label">Priorité</label>
                        <select className="rd-select" value={a.priority||'Normale'} onChange={e=>setAssign(selectedReport.id,'priority',e.target.value)}>
                          {PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="rd-field">
                        <label className="rd-label">Échéance</label>
                        <input type="date" className="rd-input" value={a.deadline||''} onChange={e=>setAssign(selectedReport.id,'deadline',e.target.value)}/>
                      </div>
                    </div>
                    <div className="rd-field">
                      <label className="rd-label">Compétences requises</label>
                      <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
                        {COMPETENCES.map(s=>(
                          <button key={s} onClick={()=>toggleCompetence(selectedReport.id,s)}
                            style={{border:`1px solid ${(a.competences||[]).includes(s)?'#3b82f6':'rgba(255,255,255,.1)'}`,
                              background:(a.competences||[]).includes(s)?'rgba(59,130,246,.14)':'rgba(255,255,255,.04)',
                              color:(a.competences||[]).includes(s)?'#93c5fd':'#5a8e78',
                              borderRadius:7,padding:'4px 9px',fontSize:11.5,fontWeight:600,cursor:'pointer',transition:'all .15s'}}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button className="rd-btn primary" style={{width:'100%',marginTop:4}}
                      onClick={()=>validateReport(selectedReport.id)}
                      disabled={validated[selectedReport.id]||!critChecks(selectedReport.id)}>
                      {validated[selectedReport.id] ? '✓ Rapport validé' : !critChecks(selectedReport.id) ? 'Critères critiques requis' : 'Valider ce rapport'}
                    </button>
                  </div>
                </>
              );
            })()
          }
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════
     TAB: AFFECTATION (Pilier 1 – RH)
  ══════════════════════════════════════════ */
  const TabAffectation = () => (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* Summary row */}
      <div className="rd-grid-4">
        {CHARGES.map(ch => {
          const count = reports.filter(r=>(assignments[r.id]?.charge||r.assigned_to)===ch.name).length;
          const overload = count > 3;
          return (
            <div key={ch.id} className="rd-panel" style={{borderColor:overload?'rgba(245,158,11,.25)':'var(--border)'}}>
              <div className="rd-panel-hd">
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:30,height:30,borderRadius:8,background:`linear-gradient(135deg,${ch.color}88,${ch.color})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#f0fff8'}}>
                    {initials(ch.name)}
                  </div>
                  <span style={{fontSize:13,fontWeight:600,color:'#c8eed8'}}>{ch.name}</span>
                </div>
                {overload && <span className="rd-badge amber">Surchargé</span>}
              </div>
              <div className="rd-panel-bd" style={{textAlign:'center',padding:'12px 22px 16px'}}>
                <div style={{fontSize:36,fontWeight:800,fontFamily:'Syne,sans-serif',color:ch.color,lineHeight:1}}>{count}</div>
                <div style={{fontSize:11,color:'#4d8870',marginTop:4}}>rapports assignés</div>
                <div style={{marginTop:10}}>
                  <div className="rd-progress-wrap"><div className="rd-progress-fill" style={{width:`${maxCharge?Math.round(count/maxCharge*100):0}%`,background:`linear-gradient(90deg,${ch.color},${ch.color}aa)`}}/></div>
                </div>
                <div style={{marginTop:8,display:'flex',flexWrap:'wrap',gap:4,justifyContent:'center'}}>
                  {ch.skills.map(s=><span key={s} className="rd-skill-tag">{s}</span>)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assignment cards */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
        <p className="rd-section-title">Orchestration des affectations</p>
        <button className="rd-btn ghost" onClick={validateAll}>Valider tous les rapports</button>
      </div>

      {total===0
        ? <div className="rd-empty">Aucun rapport à affecter.</div>
        : <div className="rd-grid-3">
          {reports.map(r => {
            const a = getAssignment(r);
            const ch = CHARGES.find(c=>c.name===a.charge);
            return (
              <div key={r.id} className={`rd-assign-card ${validated[r.id]?'':''}${!a.charge&&!validated[r.id]?'':''}`}>
                <div className="rd-assign-header">
                  <span className="rd-assign-id">#{r.id}</span>
                  <span className={`rd-badge ${validated[r.id]?'green':a.charge?'blue':'amber'}`}>
                    {validated[r.id]?'Validé':a.charge?'Affecté':'Non affecté'}
                  </span>
                </div>
                <p className="rd-assign-org">{r.company_name||r.organism_name||'—'}</p>

                {(a.competences||[]).length>0 && (
                  <div className="rd-assign-skills">
                    {(a.competences||[]).map(s=><span key={s} className="rd-skill-tag">{s}</span>)}
                  </div>
                )}

                <div className="rd-field" style={{marginTop:10}}>
                  <label className="rd-label">Chargé d'étude</label>
                  <select className="rd-select" value={a.charge} onChange={e=>setAssign(r.id,'charge',e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    {CHARGES.map(c=>(
                      <option key={c.id} value={c.name}>
                        {c.name} ({reports.filter(x=>(assignments[x.id]?.charge||x.assigned_to)===c.name).length} rap.)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rd-grid-2eq" style={{gap:10}}>
                  <div className="rd-field" style={{marginBottom:0}}>
                    <label className="rd-label">Priorité</label>
                    <select className="rd-select" value={a.priority||'Normale'} onChange={e=>setAssign(r.id,'priority',e.target.value)}>
                      {PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="rd-field" style={{marginBottom:0}}>
                    <label className="rd-label">Échéance</label>
                    <input type="date" className="rd-input" value={a.deadline||''} onChange={e=>setAssign(r.id,'deadline',e.target.value)}/>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      }
    </div>
  );

  /* ══════════════════════════════════════════
     TAB: VALIDATION (Pilier 2)
  ══════════════════════════════════════════ */
  const TabValidation = () => (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* Alerts */}
      {pendingCount > 0 && (
        <div className="rd-alert warn">
          <span className="rd-alert-icon">⚠️</span>
          <span><strong>{pendingCount}</strong> rapport(s) en attente de validation. Les critères <strong>critiques</strong> doivent être complétés avant validation.</span>
        </div>
      )}
      {validatedCount === total && total > 0 && (
        <div className="rd-alert success">
          <span className="rd-alert-icon">✓</span>
          <span>Tous les rapports ont été validés avec succès.</span>
        </div>
      )}

      <div className="rd-grid-2">
        <div className="rd-panel">
          <div className="rd-panel-hd">
            <h2>Rapports à valider</h2>
            <span style={{fontSize:12,color:'#4d8870'}}>{pendingCount} en attente</span>
          </div>
          <div style={{overflowX:'auto'}}>
            <table className="rd-table">
              <thead>
                <tr><th>Réf.</th><th>Organisme</th><th>Critiques</th><th>Checklist</th><th>Action</th></tr>
              </thead>
              <tbody>
                {reports.map(r => {
                  const done  = checksDone(r.id);
                  const crits = VALIDATION_CRITERIA.filter(c=>c.severity==='critique').every(c=>checksFor(r.id)[c.id]);
                  return (
                    <tr key={r.id} className={selectedId===r.id?'selected':''} onClick={()=>setSelectedId(r.id)}>
                      <td style={{color:'#4d8870',fontWeight:700}}>#{r.id}</td>
                      <td style={{color:'#c8eed8'}}>{r.company_name||'—'}</td>
                      <td>
                        <span className={`rd-badge ${crits?'green':'red'}`}>{crits?'✓ OK':'Requis'}</span>
                      </td>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div className="rd-progress-wrap" style={{width:60}}>
                            <div className="rd-progress-fill" style={{width:`${(done/VALIDATION_CRITERIA.length)*100}%`}}/>
                          </div>
                          <span style={{fontSize:11,color:'#5a8e78'}}>{done}/{VALIDATION_CRITERIA.length}</span>
                        </div>
                      </td>
                      <td>
                        {validated[r.id]
                          ? <span className="rd-badge validated">Validé</span>
                          : <button className="rd-btn primary sm" disabled={!crits} onClick={e=>{e.stopPropagation();validateReport(r.id);}}>
                            Valider
                          </button>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rd-panel">
          <div className="rd-panel-hd">
            <h2>Checklist qualité</h2>
            {selectedReport && (() => {
              const done = checksDone(selectedReport.id);
              return (
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div className="rd-progress-wrap" style={{width:60}}>
                    <div className="rd-progress-fill" style={{width:`${(done/VALIDATION_CRITERIA.length)*100}%`}}/>
                  </div>
                  <span style={{fontSize:12,color:'#10b981',fontWeight:700}}>{done}/{VALIDATION_CRITERIA.length}</span>
                </div>
              );
            })()}
          </div>
          <div className="rd-panel-bd">
            {!selectedReport
              ? <div className="rd-empty">Sélectionnez un rapport pour voir la checklist.</div>
              : (
                <>
                  <div style={{marginBottom:14,padding:'10px 12px',background:'rgba(16,185,129,.05)',borderRadius:10,border:'1px solid rgba(16,185,129,.1)'}}>
                    <p style={{fontSize:12,color:'#5a8e78'}}>
                      Rapport <strong style={{color:'#10b981'}}>#{selectedReport.id}</strong> — {selectedReport.company_name||'—'}
                    </p>
                    {validated[selectedReport.id] && <span className="rd-badge validated" style={{marginTop:6,display:'inline-flex'}}>✓ Validé</span>}
                  </div>

                  {['critique','majeur','mineur'].map(sev => (
                    <div key={sev} style={{marginBottom:16}}>
                      <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:getSeverityColor(sev),marginBottom:4}}>
                        — {sev}
                      </div>
                      {VALIDATION_CRITERIA.filter(c=>c.severity===sev).map(c => {
                        const checked = !!checksFor(selectedReport.id)[c.id];
                        return (
                          <div key={c.id} className="rd-check-item"
                            onClick={()=>toggleCheck(selectedReport.id,c.id)}
                            style={{cursor:validated[selectedReport.id]?'default':'pointer'}}>
                            <div className={`rd-check-box ${checked?'checked':''}`}><CheckIcon/></div>
                            <div>
                              <div className={`rd-check-label ${checked?'done':''}`}>{c.label}</div>
                              <div className="rd-check-desc">{c.desc}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  <div className="rd-field" style={{marginTop:4}}>
                    <label className="rd-label">Commentaire de validation</label>
                    <textarea className="rd-textarea" placeholder="Notes, réserves, observations…"
                      value={comments[selectedReport.id]||''}
                      onChange={e=>setComments(prev=>({...prev,[selectedReport.id]:e.target.value}))}
                      disabled={validated[selectedReport.id]}/>
                  </div>

                  <button className="rd-btn primary" style={{width:'100%',marginTop:4}}
                    disabled={!critChecks(selectedReport.id)||validated[selectedReport.id]}
                    onClick={()=>validateReport(selectedReport.id)}>
                    {validated[selectedReport.id] ? '✓ Rapport validé'
                      : !critChecks(selectedReport.id) ? `Critiques manquants — ${checksDone(selectedReport.id)}/${VALIDATION_CRITERIA.length}`
                      : 'Marquer comme validé'}
                  </button>
                </>
              )
            }
          </div>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════
     TAB: INDICATEURS (Pilier 3)
  ══════════════════════════════════════════ */
  const TabIndicateurs = () => (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div className="rd-grid-2eq">
        {/* KPI Builder */}
        <div className="rd-col-gap">
          <div className="rd-panel">
            <div className="rd-panel-hd"><h2>Constructeur de KPIs</h2></div>
            <div className="rd-panel-bd">
              <div className="rd-field">
                <label className="rd-label">Nom de l'indicateur</label>
                <input className="rd-input" placeholder="ex: Taux de conformité"
                  value={kpiForm.name} onChange={e=>setKpiForm(p=>({...p,name:e.target.value}))}/>
              </div>
              <div className="rd-field">
                <label className="rd-label">Type</label>
                <select className="rd-select" value={kpiForm.type} onChange={e=>setKpiForm(p=>({...p,type:e.target.value}))}>
                  {KPI_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="rd-field">
                <label className="rd-label">Constructeur de formule</label>
                <div className="rd-formula-chips">
                  {FORMULA_VARS.map(v=><button key={v} className="rd-chip" onClick={()=>appendToken(v)}>{v}</button>)}
                </div>
                <div className="rd-formula-chips">
                  {FORMULA_OPS.map(o=><button key={o} className="rd-chip op" onClick={()=>appendToken(o)}>{o}</button>)}
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center',marginTop:8}}>
                  <input className="rd-input" readOnly value={kpiForm.formula||'Tapez ou construisez la formule…'}
                    style={{fontFamily:'monospace',fontSize:12,color:kpiForm.formula?'var(--txt)':'#3a6650'}}/>
                  <button className="rd-btn ghost sm" onClick={clearFormula}>✕</button>
                </div>
                <div style={{fontSize:11,color:'#4d8870',marginTop:6}}>
                  Variables : {FORMULA_VARS.map(v=><code key={v} style={{marginRight:6,color:'#10b981'}}>{v}</code>)}
                </div>
              </div>
              <button className="rd-btn primary" style={{width:'100%'}} onClick={addKpi}
                disabled={!kpiForm.name.trim()||!kpiForm.formula.trim()}>
                Ajouter l'indicateur
              </button>
            </div>
          </div>

          {/* Weights */}
          <div className="rd-panel">
            <div className="rd-panel-hd"><h2>Pondération des critères</h2><span style={{fontSize:11,color:'#4d8870'}}>Score qualité</span></div>
            <div className="rd-panel-bd">
              <div className="rd-alert info" style={{marginBottom:14}}>
                <span className="rd-alert-icon">ℹ</span>
                <span>Ajustez le poids de chaque critère. La somme définit la base du score qualité pondéré.</span>
              </div>
              {weightItems.map(w=>(
                <div key={w.id} className="rd-weight-item">
                  <div className="rd-weight-name">{w.label}</div>
                  <input type="number" className="rd-weight-input" min={0} max={100}
                    value={w.weight}
                    onChange={e=>setWeightItems(prev=>prev.map(x=>x.id===w.id?{...x,weight:Number(e.target.value)}:x))}/>
                  <div className="rd-weight-pct">{w.weight}%</div>
                </div>
              ))}
              <div style={{marginTop:12,padding:'10px 12px',background:'rgba(139,92,246,.07)',border:'1px solid rgba(139,92,246,.18)',borderRadius:10,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:12,color:'#a78bfa'}}>Score qualité pondéré actuel</span>
                <span style={{fontSize:20,fontWeight:800,fontFamily:'Syne,sans-serif',color:'#8b5cf6'}}>{weightedScore}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI List + live values */}
        <div className="rd-col-gap">
          <div className="rd-panel">
            <div className="rd-panel-hd">
              <h2>Indicateurs définis</h2>
              <span style={{fontSize:11,color:'#4d8870'}}>{kpis.length} actifs</span>
            </div>
            <div className="rd-panel-bd">
              {kpis.length===0
                ? <div className="rd-empty">Aucun indicateur défini.</div>
                : <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {kpis.map(k=>{
                    const val = evalKpi(k.formula);
                    return (
                      <div key={k.id} className="rd-kpi-card">
                        <div className="rd-kpi-header">
                          <div>
                            <div className="rd-kpi-name">{k.name}</div>
                            <span style={{fontSize:10,color:'#4d8870',fontWeight:600,textTransform:'uppercase',letterSpacing:'.08em'}}>{k.type}</span>
                          </div>
                          <button className="rd-kpi-del" onClick={()=>removeKpi(k.id)}>×</button>
                        </div>
                        <div className="rd-kpi-formula">{k.formula}</div>
                        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginTop:10}}>
                          <div className="rd-kpi-value">{val}{k.type==='Taux (%)'?'%':''}</div>
                          {typeof val === 'number' && k.type==='Taux (%)' && (
                            <div style={{flex:1,marginLeft:12,marginBottom:4}}>
                              <div className="rd-progress-wrap"><div className="rd-progress-fill" style={{width:`${Math.min(val,100)}%`}}/></div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              }
            </div>
          </div>

          {/* Aggregate metrics */}
          <div className="rd-panel">
            <div className="rd-panel-hd"><h2>Métriques agrégées</h2></div>
            <div className="rd-panel-bd">
              <div className="rd-metric-grid">
                <div className="rd-metric-card">
                  <div className="rd-metric-val" style={{color:'#f59e0b'}}>{pendingCount}</div>
                  <div className="rd-metric-label">En attente</div>
                </div>
                <div className="rd-metric-card">
                  <div className="rd-metric-val">{assignedCount}</div>
                  <div className="rd-metric-label">Affectés</div>
                </div>
                <div className="rd-metric-card">
                  <div className="rd-metric-val" style={{color:'#60a5fa'}}>{validationRate}%</div>
                  <div className="rd-metric-label">Taux validation</div>
                </div>
                <div className="rd-metric-card">
                  <div className="rd-metric-val" style={{color:'#a78bfa'}}>{weightedScore}%</div>
                  <div className="rd-metric-label">Score qualité</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════
     TABS CONFIG
  ══════════════════════════════════════════ */
  const TABS = [
    { key:'macro',       label:'Vue Macro',     icon:'◈', badge: null },
    { key:'rapports',    label:'Rapports',      icon:'≡',  badge: total||null },
    { key:'affectation', label:'Affectation RH',icon:'⊕',  badge: (total-assignedCount)||null },
    { key:'validation',  label:'Validation QA', icon:'✓',  badge: pendingCount||null },
    { key:'indicateurs', label:'Indicateurs',   icon:'∿',  badge: kpis.length||null },
  ];

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  return (
    <div className="rd-root">
      <style>{CSS}</style>
      <div className="rd-wrap">

        {/* Topbar */}
        <div className="rd-top">
          <div className="rd-brand">
            <div className="rd-brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#f0fff8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

        {/* Stat cards */}
        <div className="rd-stats">
          <div className="rd-stat green">
            <div className="rd-stat-label">Total rapports</div>
            <div className="rd-stat-val">{total}</div>
            <div className="rd-stat-note">Disponibles</div>
          </div>
          <div className="rd-stat blue">
            <div className="rd-stat-label">Affectés</div>
            <div className="rd-stat-val">{assignedCount}</div>
            <div className="rd-stat-note">{assignRate}% affectés</div>
          </div>
          <div className="rd-stat green">
            <div className="rd-stat-label">Validés</div>
            <div className="rd-stat-val">{validatedCount}</div>
            <div className="rd-stat-note">Taux : {validationRate}%</div>
          </div>
          <div className="rd-stat amber">
            <div className="rd-stat-label">En attente</div>
            <div className="rd-stat-val">{pendingCount}</div>
            <div className="rd-stat-note">À traiter</div>
          </div>
          <div className="rd-stat purple">
            <div className="rd-stat-label">Score qualité</div>
            <div className="rd-stat-val">{weightedScore}%</div>
            <div className="rd-stat-note">{kpis.length} KPIs actifs</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="rd-tabs">
          {TABS.map(t=>(
            <button key={t.key} className={`rd-tab ${section===t.key?'active':''}`} onClick={()=>setSection(t.key)}>
              <span>{t.icon}</span>
              {t.label}
              {t.badge ? <span className="rd-tab-badge">{t.badge}</span> : null}
            </button>
          ))}
        </div>

        {/* Content */}
        {section==='macro'       && <TabMacro/>}
        {section==='rapports'    && <TabRapports/>}
        {section==='affectation' && <TabAffectation/>}
        {section==='validation'  && <TabValidation/>}
        {section==='indicateurs' && <TabIndicateurs/>}
      </div>
    </div>
  );
}