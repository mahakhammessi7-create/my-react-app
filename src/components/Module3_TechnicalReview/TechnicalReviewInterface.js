// components/Module3_TechnicalReview/TechnicalReviewInterface.jsx
// Layout: LEFT = Annexes viewer (raw data) | RIGHT = Extracted data editor + Annotations

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAnnotations } from '../../hooks/Useannotations';

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
.tri-root { display: grid; grid-template-columns: 1fr 1.4fr; gap: 20px; align-items: start; }
@media (max-width: 1100px) { .tri-root { grid-template-columns: 1fr; } }

.tri-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.12); border-radius: 14px; overflow: hidden; }
.tri-card-head { padding: 12px 16px; border-bottom: 1px solid rgba(139,92,246,0.1); display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.15); }
.tri-card-head h3 { font-size: 14px; font-weight: 600; color: #e2e8f0; display: flex; align-items: center; gap: 6px; }

.tri-left-col { position: sticky; top: 80px; max-height: calc(100vh - 100px); overflow-y: auto; }
.tri-right-col { min-width: 0; }

.tri-left-col::-webkit-scrollbar { width: 4px; }
.tri-left-col::-webkit-scrollbar-track { background: transparent; }
.tri-left-col::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 99px; }

.tri-annex-section { border-bottom: 1px solid rgba(139,92,246,0.08); }
.tri-annex-section:last-child { border-bottom: none; }
.tri-annex-header { padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: background .15s; }
.tri-annex-header:hover { background: rgba(139,92,246,0.06); }
.tri-annex-title { font-size: 13px; font-weight: 600; color: #c4b5fd; display: flex; align-items: center; gap: 8px; }
.tri-annex-chevron { font-size: 10px; color: #475569; transition: transform .2s; }
.tri-annex-chevron.open { transform: rotate(180deg); }
.tri-annex-body { padding: 12px 16px; background: rgba(0,0,0,0.1); }

.tri-raw-kv { display: flex; flex-direction: column; gap: 6px; }
.tri-raw-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; font-size: 12px; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
.tri-raw-row:last-child { border-bottom: none; }
.tri-raw-label { color: #64748b; min-width: 140px; flex-shrink: 0; }
.tri-raw-value { color: #e2e8f0; text-align: right; word-break: break-all; }
.tri-raw-value.bool-true  { color: #34d399; font-weight: 600; }
.tri-raw-value.bool-false { color: #f87171; font-weight: 600; }
.tri-raw-value.num { color: #a78bfa; font-weight: 600; }
.tri-raw-value.warn { color: #fbbf24; font-weight: 600; }
.tri-raw-value.crit { color: #f87171; font-weight: 700; }

.tri-raw-table { width: 100%; border-collapse: collapse; font-size: 11px; }
.tri-raw-table th { padding: 6px 8px; text-align: left; color: #475569; font-weight: 600; border-bottom: 1px solid rgba(139,92,246,0.1); }
.tri-raw-table td { padding: 6px 8px; color: #cbd5e1; border-bottom: 1px solid rgba(255,255,255,0.03); }

.tri-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; }
.tri-badge-ok  { background: rgba(16,185,129,0.15);  color: #34d399; border: 1px solid rgba(16,185,129,0.25); }
.tri-badge-mid { background: rgba(245,158,11,0.15);  color: #fbbf24; border: 1px solid rgba(245,158,11,0.25); }
.tri-badge-err { background: rgba(239,68,68,0.15);   color: #f87171; border: 1px solid rgba(239,68,68,0.25); }
.tri-badge-info{ background: rgba(99,102,241,0.15);  color: #818cf8; border: 1px solid rgba(99,102,241,0.25); }

.tri-btn { padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; transition: all .15s; }
.tri-btn-edit   { background: rgba(99,102,241,0.2); color: #a78bfa; border: 1px solid rgba(139,92,246,0.3); }
.tri-btn-save   { background: linear-gradient(135deg,#10b981,#059669); color:#fff; }
.tri-btn-cancel { background: rgba(255,255,255,0.08); color:#cbd5e1; border:1px solid rgba(255,255,255,0.1); }
.tri-btn-save:disabled { opacity:.5; cursor:not-allowed; }
.tri-btn-send { width:100%; padding:11px; background:linear-gradient(135deg,#8b5cf6,#6366f1); color:#fff; font-size:13px; font-weight:700; border:none; border-radius:10px; cursor:pointer; transition:all .15s; display:flex; align-items:center; justify-content:center; gap:6px; }
.tri-btn-send:hover:not(:disabled) { filter:brightness(1.1); }
.tri-btn-send:disabled { opacity:.5; cursor:not-allowed; }
.tri-btn-add { flex:1; padding:9px 14px; background:rgba(139,92,246,0.15); border:1px solid rgba(139,92,246,0.3); border-radius:8px; color:#c4b5fd; font-size:13px; font-weight:600; cursor:pointer; }
.tri-btn-approve { padding:9px 18px; background:linear-gradient(135deg,#10b981,#059669); color:#fff; border:none; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; }
.tri-btn-reject-main { padding:9px 18px; background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.3); border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; }

.tri-score-bar { height:8px; background:rgba(255,255,255,0.08); border-radius:99px; overflow:hidden; margin-bottom:16px; }
.tri-score-fill { height:100%; border-radius:99px; transition:width .4s ease; }

.tri-ann-section { margin-top: 20px; }
.tri-ann-form { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
.tri-form-group { display: flex; flex-direction: column; gap: 4px; }
.tri-form-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .4px; }
.tri-form select, .tri-form textarea { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(139,92,246,0.2); border-radius:8px; color:#e2e8f0; font-size:13px; font-family:inherit; padding:8px 10px; outline:none; box-sizing:border-box; }
.tri-form textarea { resize:vertical; min-height:70px; }
.tri-btn-row { display:flex; gap:8px; }
.tri-field-hint { padding:6px 10px; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2); border-radius:6px; font-size:11px; color:#fbbf24; display:flex; align-items:center; gap:6px; }
.tri-counts { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; margin:8px 16px; }
.tri-count-box { padding:8px 6px; text-align:center; background:rgba(255,255,255,0.04); border-radius:8px; }
.tri-count-n { font-size:18px; font-weight:700; }
.tri-count-l { font-size:10px; color:#64748b; margin-top:1px; }
.n-r{color:#a78bfa;}.n-v{color:#fbbf24;}.n-c{color:#34d399;}
.tri-ann-divider { font-size:10px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:.5px; padding:10px 16px 6px; border-top:1px solid rgba(139,92,246,0.08); }
.tri-ann-list { max-height:280px; overflow-y:auto; display:flex; flex-direction:column; gap:8px; padding:0 16px 12px; }
.tri-ann-item { padding:10px 12px; border-radius:10px; border-left:3px solid transparent; }
.ann-remarque { background:rgba(139,92,246,0.08); border-left-color:#8b5cf6; }
.ann-reserve  { background:rgba(245,158,11,0.08); border-left-color:#f59e0b; }
.ann-recommandation { background:rgba(16,185,129,0.08); border-left-color:#10b981; }
.tri-ann-type { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; margin-bottom:4px; }
.type-r{color:#a78bfa;}.type-v{color:#fbbf24;}.type-c{color:#34d399;}
.tri-ann-text { font-size:12px; color:#cbd5e1; line-height:1.5; }
.tri-ann-meta { font-size:10px; color:#475569; margin-top:4px; display:flex; align-items:center; justify-content:space-between; }
.tri-ann-del { font-size:11px; color:#475569; background:none; border:none; cursor:pointer; padding:2px 6px; border-radius:4px; }
.tri-ann-del:hover { color:#f87171; }
.tri-send-section { padding:14px 16px; border-top:1px solid rgba(139,92,246,0.1); }
.tri-send-summary { font-size:12px; color:#94a3b8; margin-bottom:10px; line-height:1.6; }
.tri-approve-bar { display:flex; gap:10px; padding:12px 16px; border-top:1px solid rgba(139,92,246,0.1); background:rgba(0,0,0,0.1); }
.tri-empty { padding:20px 16px; text-align:center; color:#475569; font-size:13px; }
.tri-toast { position:fixed; bottom:24px; right:24px; padding:12px 20px; border-radius:8px; background:#10b981; color:#fff; font-size:14px; font-weight:500; z-index:1200; animation:slideIn .3s ease; }
.tri-toast.error { background:#ef4444; }
@keyframes slideIn { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }

/* ── Right panel new styles ── */
.syn-kpi-bar { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; padding:12px 14px; background:rgba(0,0,0,0.12); border-bottom:1px solid rgba(139,92,246,0.1); }
.syn-kpi { text-align:center; padding:8px 6px; background:rgba(255,255,255,0.03); border-radius:10px; border:1px solid rgba(139,92,246,0.1); }
.syn-kpi-val { font-size:20px; font-weight:700; }
.syn-kpi-lbl { font-size:10px; color:#64748b; margin-top:2px; }

.syn-section { background:rgba(255,255,255,0.02); border:1px solid rgba(139,92,246,0.12); border-radius:12px; overflow:hidden; }
.syn-section.annotated { border-color:rgba(245,158,11,0.4); background:rgba(245,158,11,0.03); }
.syn-head { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:rgba(0,0,0,0.15); border-bottom:1px solid rgba(139,92,246,0.1); cursor:pointer; user-select:none; }
.syn-head:hover { background:rgba(139,92,246,0.08); }
.syn-head-left { display:flex; flex-direction:column; gap:2px; }
.syn-head-title { font-size:13px; font-weight:700; color:#e2e8f0; display:flex; align-items:center; gap:6px; }
.syn-head-source { font-size:10.5px; color:#a78bfa; font-weight:500; margin-left:18px; }
.syn-annotate-hint { font-size:10px; color:#475569; display:flex; align-items:center; gap:4px; }
.syn-body { padding:14px; }

.syn-kv-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:8px; }
.syn-kv-item { position:relative; padding:8px 10px; background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid rgba(139,92,246,0.08); }
.syn-kv-item:hover { border-color:rgba(139,92,246,0.25); }
.syn-kv-label { font-size:10px; color:#64748b; margin-bottom:3px; }
.syn-kv-value { font-size:13px; font-weight:500; color:#e2e8f0; min-height:20px; }
.syn-kv-value.modified { color:#818cf8; }
.syn-kv-input { width:100%; background:transparent; border:none; border-bottom:1.5px solid #818cf8; outline:none; font-size:13px; font-weight:500; color:#e2e8f0; padding:1px 0; font-family:inherit; }
.syn-edit-btn { position:absolute; top:6px; right:6px; background:none; border:none; cursor:pointer; color:#475569; font-size:11px; opacity:0; transition:opacity .15s; padding:2px 4px; border-radius:4px; }
.syn-edit-btn:hover { color:#a78bfa; background:rgba(139,92,246,0.15); }
.syn-kv-item:hover .syn-edit-btn { opacity:1; }
.syn-modified-dot { display:inline-block; width:5px; height:5px; border-radius:50%; background:#818cf8; margin-left:4px; vertical-align:middle; }

.syn-alert-bar { display:flex; align-items:center; gap:8px; padding:7px 12px; background:rgba(239,68,68,0.08); border-bottom:1px solid rgba(239,68,68,0.2); font-size:12px; color:#fca5a5; }

.syn-tabs { display:flex; gap:0; background:rgba(0,0,0,0.15); border-bottom:1px solid rgba(139,92,246,0.1); overflow-x:auto; }
.syn-tab { padding:8px 14px; font-size:12px; font-weight:600; color:#64748b; cursor:pointer; border-bottom:2px solid transparent; white-space:nowrap; transition:all .15s; }
.syn-tab:hover { color:#c4b5fd; }
.syn-tab.active { color:#c4b5fd; border-bottom-color:#8b5cf6; background:rgba(139,92,246,0.06); }
.syn-tab-body { display:none; padding:12px 14px; }
.syn-tab-body.active { display:block; }

.syn-table { width:100%; border-collapse:collapse; font-size:11.5px; table-layout:fixed; }
.syn-table th { padding:6px 8px; text-align:left; background:rgba(139,92,246,0.08); color:#c4b5fd; font-weight:600; font-size:11px; border-bottom:1px solid rgba(139,92,246,0.15); }
.syn-table td { padding:7px 8px; border-bottom:1px solid rgba(255,255,255,0.03); color:#e2e8f0; vertical-align:middle; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.syn-table tr:last-child td { border-bottom:none; }
.syn-table tr.eol-row td { background:rgba(239,68,68,0.04); }
.syn-table td.editable { cursor:pointer; }
.syn-table td.editable:hover { background:rgba(99,102,241,0.1); color:#c4b5fd; }
.syn-inline-input { width:100%; background:rgba(99,102,241,0.1); border:none; border-bottom:1.5px solid #818cf8; outline:none; font-size:11.5px; color:#e2e8f0; padding:1px 2px; font-family:inherit; }

.syn-domain-list { display:flex; flex-direction:column; gap:8px; }
.syn-domain-row { display:grid; grid-template-columns:170px 72px 1fr; gap:10px; align-items:center; padding:8px 10px; background:rgba(255,255,255,0.02); border-radius:8px; border:1px solid rgba(139,92,246,0.08); font-size:12px; }
.syn-domain-label { font-weight:600; color:#e2e8f0; }
.syn-domain-score { font-weight:700; font-size:13px; }
.syn-score-bar { height:4px; border-radius:2px; overflow:hidden; background:rgba(255,255,255,0.08); margin-bottom:4px; }
.syn-score-fill { height:100%; border-radius:2px; }
.syn-domain-tags { display:flex; flex-wrap:wrap; gap:4px; }
.syn-tag { font-size:10px; padding:1px 6px; border-radius:4px; }
.syn-tag-ok  { background:rgba(16,185,129,0.12); color:#34d399; }
.syn-tag-warn{ background:rgba(239,68,68,0.12); color:#f87171; }

.syn-ind-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:10px; }
.syn-ind-card { background:rgba(255,255,255,0.02); border:1px solid rgba(139,92,246,0.1); border-radius:10px; padding:10px 12px; }
.syn-ind-title { font-size:11px; font-weight:700; color:#c4b5fd; margin-bottom:8px; padding-bottom:6px; border-bottom:1px solid rgba(139,92,246,0.08); }
.syn-ind-row { display:flex; align-items:center; justify-content:space-between; padding:4px 0; font-size:12px; border-bottom:1px solid rgba(255,255,255,0.03); }
.syn-ind-row:last-child { border-bottom:none; }
.syn-ind-label { color:#94a3b8; }
.syn-gauge-wrap { display:flex; align-items:center; gap:6px; }
.syn-gauge { width:48px; height:4px; background:rgba(255,255,255,0.08); border-radius:2px; overflow:hidden; }
.syn-gauge-fill { height:100%; border-radius:2px; }
.syn-pill { font-size:10px; font-weight:600; padding:2px 7px; border-radius:99px; }
.syn-pill-ok   { background:rgba(16,185,129,0.15); color:#34d399; border:1px solid rgba(16,185,129,0.2); }
.syn-pill-warn { background:rgba(245,158,11,0.15); color:#fbbf24; border:1px solid rgba(245,158,11,0.2); }
.syn-pill-err  { background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.2); }
.syn-pill-info { background:rgba(99,102,241,0.15); color:#818cf8; border:1px solid rgba(99,102,241,0.2); }

/* ── Périmètre géographique table ── */
.peri-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.peri-table th {
  padding: 8px 12px;
  text-align: left;
  background: rgba(139,92,246,0.1);
  color: #c4b5fd;
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .4px;
  border-bottom: 1px solid rgba(139,92,246,0.2);
}
.peri-table td {
  padding: 9px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  vertical-align: middle;
  color: #e2e8f0;
}
.peri-table tr:last-child td { border-bottom: none; }
.peri-table tr:hover td { background: rgba(139,92,246,0.04); }
.peri-label { color: #94a3b8; font-size: 12.5px; }
.peri-tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 9px; border-radius: 6px; font-size: 11px; font-weight: 700;
  cursor: default;
}
.peri-tag-exist  { background: rgba(139,92,246,0.18); color: #c4b5fd; border: 1px solid rgba(139,92,246,0.35); }
.peri-tag-secours{ background: rgba(99,102,241,0.18);  color: #818cf8; border: 1px solid rgba(99,102,241,0.35); }
.peri-tag-class  { background: rgba(245,158,11,0.14);  color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }
.peri-tag-access { background: rgba(16,185,129,0.12);  color: #34d399; border: 1px solid rgba(16,185,129,0.25); }
.peri-value { color: #e2e8f0; font-size: 12.5px; }
.peri-empty { color: #475569; font-style: italic; }
.peri-source {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; color: #64748b;
  padding: 8px 12px;
  background: rgba(0,0,0,0.1);
  border-top: 1px solid rgba(139,92,246,0.08);
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}
.peri-dl-btn {
  margin-left: auto; background: rgba(139,92,246,0.12);
  border: 1px solid rgba(139,92,246,0.25); border-radius: 6px;
  color: #a78bfa; font-size: 11px; font-weight: 600;
  padding: 3px 9px; cursor: pointer;
}
.peri-dl-btn:hover { background: rgba(139,92,246,0.2); }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePlanningList(planningList) {
  if (!Array.isArray(planningList) || planningList.length === 0) return null;

  // Let's first check if we have multiple items in planningList, or if we have a single item.
  const hasStructured = planningList.some(p => p.phase || p.duree || p.intervenants);
  const hasMultiLineText = planningList.length === 1 && planningList[0].texte_brut && planningList[0].texte_brut.includes('\n');
  
  if (hasStructured && !hasMultiLineText) {
    return planningList.map(p => {
      // If structured columns are filled, use them
      if (p.phase || p.duree || p.intervenants) {
        return {
          phase: p.phase || '—',
          duree: p.duree || '—',
          intervenants: p.intervenants || '—'
        };
      }
      // If structured columns are empty but texte_brut is filled, parse it
      if (p.texte_brut) {
        return parseSingleLine(p.texte_brut);
      }
      return { phase: '—', duree: '—', intervenants: '—' };
    });
  }

  // Case 2: We have only texte_brut
  let allLines = [];
  planningList.forEach(p => {
    if (p.texte_brut) {
      const lines = p.texte_brut.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      allLines.push(...lines);
    }
  });

  if (allLines.length === 0) return null;

  const hasPipes = allLines.some(line => line.includes('|'));
  if (!hasPipes) return null; // Fallback to raw text rendering

  return allLines.map(line => parseSingleLine(line));
}

// Helper to parse a single line of text containing pipes
function parseSingleLine(line) {
  const parts = line.split('|').map(p => p.trim());
  let phase = parts[0] || '—';
  let duree = '—';
  let intervenants = '—';

  // Find duration and actors in parts
  parts.forEach(part => {
    const lower = part.toLowerCase();
    if (lower.startsWith('durée') || lower.startsWith('duree')) {
      duree = part.replace(/^[Dd]ur[eé]e\s*:\s*/, '').trim();
    } else if (lower.startsWith('intervenant')) {
      intervenants = part.replace(/^[Ii]ntervenants?\s*:\s*/, '').trim();
    }
  });

  // Fallbacks if not explicitly prefixed
  if (duree === '—' && parts.length >= 3) {
    const cleaned = parts[2].replace(/^[Dd]ur[eé]e\s*:\s*/, '').trim();
    if (!cleaned.toLowerCase().includes('intervenant')) {
      duree = cleaned;
    }
  }
  if (intervenants === '—' && parts.length >= 4) {
    intervenants = parts[3].replace(/^[Ii]ntervenants?\s*:\s*/, '').trim();
  } else if (intervenants === '—' && parts.length === 3 && parts[2].toLowerCase().includes('intervenant')) {
    intervenants = parts[2].replace(/^[Ii]ntervenants?\s*:\s*/, '').trim();
  }

  return { phase, duree, intervenants };
}

function normalizeExtracted(report) {
  let cd = report?.compliance_details;
  if (cd) {
    if (typeof cd === 'string') {
      try { cd = JSON.parse(cd); } catch (e) { console.error('Failed to parse compliance_details:', e); }
    }
    if (cd && typeof cd === 'object') {
      const hasAnnexKeys = Object.keys(cd).some(k => /^annexe\d/i.test(k));
      if (hasAnnexKeys) {
        if (cd.annexe2 && Array.isArray(cd.annexe2)) cd.annexe2 = { processus: cd.annexe2 };
        return cd;
      }
    }
  }
  const raw = report?.extracted_data ?? report?.extractedData ?? null;
  if (raw != null) {
    let parsed = raw;
    if (typeof raw === 'string') {
      try { parsed = JSON.parse(raw); } catch { parsed = {}; }
    }
    if (parsed.annexe2 && Array.isArray(parsed.annexe2)) parsed.annexe2 = { processus: parsed.annexe2 };
    const hasAnnex = Object.keys(parsed).some(k => /^annexe\d/i.test(k));
    if (hasAnnex) return parsed;
  }
  return {
    annexe1: {
      nom_organisme: report?.organism_name?.trim(),
      secteur_activite: report?.organism_sector,
      adresse: report?.organism_address,
    },
    annexe6: { maturite: report?.maturity_level, criteres: [] },
  };
}

function normalizeAnnexe2(a2Raw) {
  if (a2Raw?.processus) return a2Raw;
  if (Array.isArray(a2Raw)) return { processus: a2Raw };
  return { processus: [] };
}

function deriveIndicators(extracted) {
  const a3 = extracted?.annexe3 || {};
  const a6 = extracted?.annexe6 || {};
  const a7 = extracted?.annexe7 || {};
  const a8 = extracted?.annexe8 || {};

  const a7g = a7.global || {};
  const a7d = Array.isArray(a7.detail) ? a7.detail : [];

  const findIndicator = (...keys) => {
    for (const key of keys) {
      const found = a7d.find(r => {
        const n = (r.indicateur || r.nom || '').toLowerCase();
        return n.includes(key.toLowerCase());
      });
      if (found) {
        const v = found.valeur ?? found.value ?? found.statut;
        if (v !== undefined && v !== null) return v;
      }
    }
    return undefined;
  };

  const toBool = (v) => {
    if (v === true || v === 1 || v === 'oui' || v === 'yes' || v === '✅') return true;
    if (v === false || v === 0 || v === 'non' || v === 'no' || v === '❌') return false;
    return undefined;
  };

  const bool = (primary, ...fallbackKeys) => {
    if (primary !== undefined && primary !== null) return toBool(primary);
    return toBool(findIndicator(...fallbackKeys));
  };

  return {
    maturity_level: a6.global?.maturite ?? a6.maturite ?? a6.score_moyen ?? null,
    compliance_score: a6.global?.compliance_score ?? a6.compliance_score ?? null,
    risk_score: a6.global?.risk_score ?? a6.risk_score ?? null,
    is_compliant: toBool(a6.global?.is_compliant ?? a6.is_compliant),
    has_rssi: bool(a7g.rssi_nomme ?? a7g.has_rssi, 'rssi'),
    has_pssi: bool(a7g.pssi_existe ?? a7g.has_pssi, 'pssi'),
    has_pca: bool(a7g.pca_existe ?? a7g.has_pca, 'pca'),
    has_pra: bool(a7g.pra_existe ?? a7g.has_pra, 'pra'),
    has_siem: bool(a7g.siem_existe, 'siem'),
    siem_coverage_pct: a7g.siem_coverage_pct ?? null,
    mfa_enabled: bool(a7g.mfa_enabled ?? a7g.mfa, 'mfa'),
    backup_policy_exists: bool(a7g.backup_policy_exists ?? a7g.politique_sauvegarde, 'sauvegarde'),
    backup_tested: bool(a7g.backup_tested ?? a7g.sauvegarde_testee, 'sauvegarde testée'),
    backup_coverage_pct: a7g.backup_coverage_pct ?? null,
    antivirus_coverage_pct: a3.antivirus_coverage_pct ?? a7g.antivirus_coverage_pct ?? null,
    critical_vulns_open: a8.critical_vulns_open ?? (Array.isArray(a8.vulnerabilites)
      ? a8.vulnerabilites.filter(v => (v.probabilite || '').toLowerCase().includes('crit')).length
      : null),
    pca_test_done: bool(a7g.pca_test_done ?? a7g.pca_teste, 'pca testé'),
    has_datacenter: bool(a7g.has_datacenter, 'datacenter'),
    dc_tier_level: a7g.dc_tier_level ?? null,
    total_servers: Array.isArray(a3.serveurs) ? a3.serveurs.length : (a3.total_servers ?? null),
    total_workstations: a3.total_workstations ?? null,
    network_segmentation: bool(a3.network_segmentation ?? a3.segmentation_reseau, 'segmentation'),
  };
}

function updateNestedValue(obj, path, value) {
  const keys = path.split('.');
  const result = { ...obj };
  let cur = result;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    cur[k] = Array.isArray(cur[k]) ? [...cur[k]] : { ...cur[k] };
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
  return result;
}

// ─── Left panel: Raw Annexe Viewer ───────────────────────────────────────────

function RawTextRow({ label, value }) {
  return (
    <div className="tri-raw-row">
      <span className="tri-raw-label">{label}</span>
      <span className="tri-raw-value">{value || '—'}</span>
    </div>
  );
}

function AnnexeSection({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="tri-annex-section">
      <div className="tri-annex-header" onClick={() => setOpen(o => !o)}>
        <span className="tri-annex-title">{icon} {title}</span>
        <span className={`tri-annex-chevron ${open ? 'open' : ''}`}>▼</span>
      </div>
      {open && <div className="tri-annex-body">{children}</div>}
    </div>
  );
}

function LeftAnnexesViewer({ report }) {
  const cd = normalizeExtracted(report) || {};
  const a1 = cd.annexe1 || {};
  const a2 = normalizeAnnexe2(cd.annexe2 || cd.processus);
  const a3 = cd.annexe3 || {};
  const a4 = cd.annexe4 || [];
  const a5 = cd.annexe5 || [];
  const a6 = cd.annexe6 || {};
  const a7 = cd.annexe7 || {};
  const a8 = cd.annexe8 || {};
  const a9 = cd.annexe9 || {};

  const serveurs    = Array.isArray(a3.serveurs)              ? a3.serveurs              : [];
  const apps        = Array.isArray(a3.applications)          ? a3.applications          : [];
  const reseau      = Array.isArray(a3.infrastructure_reseau) ? a3.infrastructure_reseau : [];
  const postes      = Array.isArray(a3.postes_travail)        ? a3.postes_travail        : [];
  const planningList = Array.isArray(a4) ? a4 : [];
  const parsedPlanning = parsePlanningList(planningList);
  const evaluations  = Array.isArray(a5) ? a5 : [];
  const criteres     = Array.isArray(a6.criteres) ? a6.criteres : [];
  const a7details    = Array.isArray(a7.detail) ? a7.detail : [];
  const vulns        = Array.isArray(a8) ? a8 : (a8.vulnerabilites || []);
  const projets      = Array.isArray(a9) ? a9 : (a9.projets || []);

  const enriched = {
    ...report,
    organism_name:    (a1.nom_organisme || report?.organism_name || '').trim(),
    organism_sector:  a1.secteur_activite || report?.organism_sector,
    organism_address: a1.adresse || report?.organism_address,
    audit_type:       a1.type_audit || report?.audit_type,
  };

  const TEXT_LABELS = {
    organism_name: 'Organisme', organism_sector: 'Secteur',
    organism_address: 'Adresse', audit_type: 'Type audit', upload_date: 'Date dépôt',
  };

  return (
    <div>
      <AnnexeSection title="A1 — Identification" icon="🏢" defaultOpen>
        <div className="tri-raw-kv">
          {Object.entries(TEXT_LABELS).map(([k, label]) =>
            enriched[k] != null ? <RawTextRow key={k} label={label} value={String(enriched[k])} /> : null
          )}
        </div>
      </AnnexeSection>

      {a2?.processus?.length > 0 && (
        <AnnexeSection title="A2 — Processus" icon="📊">
          <table className="tri-raw-table">
            <thead><tr><th>Processus</th><th>C</th><th>I</th><th>D</th></tr></thead>
            <tbody>
              {a2.processus.map((p, i) => (
                <tr key={i}>
                  <td>{p.processus || '—'}</td>
                  <td>{p.confidentialite ?? '—'}</td>
                  <td>{p.integrite ?? '—'}</td>
                  <td>{p.disponibilite ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AnnexeSection>
      )}

      <AnnexeSection title="A3 — Système d'information" icon="🖥️">
        {serveurs.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Serveurs ({serveurs.length})</div>
            <table className="tri-raw-table">
              <thead><tr><th>Nom</th><th>IP</th><th>OS</th><th>Rôle</th></tr></thead>
              <tbody>
                {serveurs.map((s, i) => (
                  <tr key={i}>
                    <td>{s.nom || '—'}</td><td>{s.adresse_ip || '—'}</td>
                    <td>{s.systeme_exploitation || '—'}</td><td>{s.role || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {apps.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Applications ({apps.length})</div>
            <table className="tri-raw-table">
              <thead><tr><th>Nom</th><th>Description</th></tr></thead>
              <tbody>{apps.map((a, i) => <tr key={i}><td>{a.nom || '—'}</td><td>{a.description || '—'}</td></tr>)}</tbody>
            </table>
          </div>
        )}
        {reseau.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Réseau ({reseau.length})</div>
            <table className="tri-raw-table">
              <thead><tr><th>Nature</th><th>Marque</th><th>Qté</th></tr></thead>
              <tbody>{reseau.map((r, i) => <tr key={i}><td>{r.nature || '—'}</td><td>{r.marque_modele || '—'}</td><td>{r.quantite || '—'}</td></tr>)}</tbody>
            </table>
          </div>
        )}
        {postes.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Postes ({postes.length})</div>
            <table className="tri-raw-table">
              <thead><tr><th>OS</th><th>Nombre</th></tr></thead>
              <tbody>{postes.map((p, i) => <tr key={i}><td>{p.systeme_exploitation || '—'}</td><td>{p.nombre || '—'}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </AnnexeSection>

      <AnnexeSection title="A4 — Planning" icon="📅">
        {planningList.length > 0 ? (
          parsedPlanning ? (
            <table className="tri-raw-table">
              <thead>
                <tr>
                  <th>Phase</th>
                  <th>Durée</th>
                  <th>Intervenants</th>
                </tr>
              </thead>
              <tbody>
                {parsedPlanning.map((p, i) => (
                  <tr key={i}>
                    <td>{p.phase || '—'}</td>
                    <td style={{ color: '#2dd4bf' }}>{p.duree || '—'}</td>
                    <td style={{ color: '#94a3b8' }} title={p.intervenants}>{p.intervenants || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ fontSize: 12, color: '#c8eed8', whiteSpace: 'pre-wrap' }}>
              {planningList[0].texte_brut || '—'}
            </div>
          )
        ) : <div className="tri-empty">Aucun planning extrait</div>}
      </AnnexeSection>

      <AnnexeSection title="A5 — Évaluation plan d'action" icon="🔐">
        {evaluations.length > 0 ? (
          <table className="tri-raw-table">
            <thead><tr><th>Action</th><th>Criticité</th><th>Évaluation</th></tr></thead>
            <tbody>{evaluations.map((e, i) => <tr key={i}><td>{e.action || '—'}</td><td>{e.criticite || '—'}</td><td>{e.evaluation || '—'}</td></tr>)}</tbody>
          </table>
        ) : <div className="tri-empty">Aucune évaluation extraite</div>}
      </AnnexeSection>

      <AnnexeSection title="A6 — Détail Maturité" icon="📈">
        {criteres.length > 0 ? (
          <table className="tri-raw-table">
            <thead><tr><th>Domaine</th><th>Critère</th><th>Score</th></tr></thead>
            <tbody>{criteres.map((c, i) => <tr key={i}><td>{c.domaine || '—'}</td><td>{c.critere || '—'}</td><td>{c.score ?? '—'}</td></tr>)}</tbody>
          </table>
        ) : <div className="tri-empty">Aucun critère extrait</div>}
      </AnnexeSection>

      <AnnexeSection title="A7 — Indicateurs" icon="💾">
        {a7details.length > 0 ? (
          <table className="tri-raw-table">
            <thead>
              <tr>
                <th style={{ width: '20%' }}>Catégorie</th>
                <th style={{ width: '35%' }}>Indicateur</th>
                <th style={{ width: '15%' }}>Valeur</th>
                <th style={{ width: '30%' }}>Commentaire</th>
              </tr>
            </thead>
            <tbody>
              {a7details.map((d, i) => {
                const cat = d.categorie && d.categorie !== 'Non spécifié' ? d.categorie : '—';
                const indName = d.indicateur || '—';
                const valStr = String(d.valeur || '').trim();
                const displayVal = (valStr === '1' || valStr.toLowerCase() === 'oui') ? 'Oui' : (valStr === '0' || valStr.toLowerCase() === 'non') ? 'Non' : (d.valeur || '—');
                const valColor = displayVal === 'Oui' ? '#34d399' : displayVal === 'Non' ? '#f87171' : 'inherit';
                return (
                  <tr key={i}>
                    <td style={{ whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'top' }}>{cat}</td>
                    <td style={{ whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'top' }}>{indName}</td>
                    <td style={{ whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'top', color: valColor, fontWeight: displayVal === 'Oui' || displayVal === 'Non' ? 700 : 'normal' }}>
                      {displayVal}
                    </td>
                    <td style={{ whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'top', color: '#94a3b8' }}>
                      {d.commentaire || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <div className="tri-empty">Aucun indicateur extrait</div>}
      </AnnexeSection>

      <AnnexeSection title="A8 — Vulnérabilités" icon="⚠️">
        {vulns.length > 0 ? (
          <table className="tri-raw-table">
            <thead><tr><th>Nom</th><th>Probabilité</th><th>Recommandation</th></tr></thead>
            <tbody>{vulns.map((v, i) => <tr key={i}><td>{v.nom || '—'}</td><td>{v.probabilite || '—'}</td><td>{v.recommandation || '—'}</td></tr>)}</tbody>
          </table>
        ) : <div className="tri-empty">Aucune vulnérabilité extraite</div>}
      </AnnexeSection>

      <AnnexeSection title="A9 — Plan d'action" icon="📋">
        {projets.length > 0 ? (
          <table className="tri-raw-table">
            <thead><tr><th>Action</th><th>Priorité</th><th>Responsable</th></tr></thead>
            <tbody>{projets.map((a, i) => <tr key={i}><td>{a.action || '—'}</td><td>{a.priorite || '—'}</td><td>{a.responsable || '—'}</td></tr>)}</tbody>
          </table>
        ) : <div className="tri-empty">Aucun plan extrait</div>}
      </AnnexeSection>
    </div>
  );
}

// ─── Editable KV field ────────────────────────────────────────────────────────

function EditableKV({ label, value, fieldKey, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);
  useEffect(() => { setDraft(value); setSaved(false); }, [value]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) {
      onSave(fieldKey, draft);
      setSaved(true);
    }
  };

  return (
    <div className="syn-kv-item">
      <div className="syn-kv-label">{label}</div>
      {editing ? (
        <>
          <input
            ref={inputRef}
            className="syn-kv-input"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(false); setDraft(value); } }}
          />
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>↵ Entrée pour sauvegarder</div>
        </>
      ) : (
        <div className={`syn-kv-value ${saved ? 'modified' : ''}`}>
          {draft || '—'}
          {saved && <span className="syn-modified-dot" title="Modifié" />}
        </div>
      )}
      {!editing && (
        <button className="syn-edit-btn" onClick={() => setEditing(true)} title={`Modifier ${label}`}>
          ✏️
        </button>
      )}
    </div>
  );
}

// ─── Editable table cell ──────────────────────────────────────────────────────

function EditableCell({ value, onSave, style = {} }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  if (editing) {
    return (
      <td style={style}>
        <input
          ref={inputRef}
          className="syn-inline-input"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(false); setDraft(value); } }}
        />
      </td>
    );
  }
  return (
    <td
      className="editable"
      style={{ ...style, cursor: 'pointer' }}
      onClick={() => setEditing(true)}
      title="Cliquer pour modifier"
    >
      {draft || '—'}
    </td>
  );
}

// ─── Right panel: Synthesis Panel ────────────────────────────────────────────

function SynthesisPanel({ report, annotatedPaths, onAnnotateField }) {
  const [extracted, setExtracted] = useState(() => normalizeExtracted(report) || {});
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => { setExtracted(normalizeExtracted(report) || {}); }, [report]);

  const ind = deriveIndicators(extracted);
  const a1 = extracted.annexe1 || {};
  const a3 = extracted.annexe3 || {};

  const handleKVSave = useCallback((section, key, value) => {
    setExtracted(prev => updateNestedValue(prev, `${section}.${key}`, value));
  }, []);

  // Pull organism info from every possible source
  const cd = (typeof report?.compliance_details === 'string'
    ? (() => { try { return JSON.parse(report.compliance_details); } catch { return {}; } })()
    : report?.compliance_details) || {};
  const cdA1 = cd?.annexe1 || {};

  const orgVal = (a1Key, cdKey, reportKey) =>
    a1[a1Key] || cdA1[cdKey || a1Key] || report?.[reportKey || a1Key] || '';

  const orgFields = [
    { label: 'Nom',              key: 'nom_organisme',    value: (a1.nom_organisme || cdA1.nom_organisme || report?.organism_name || '').trim() },
    { label: 'Acronyme',         key: 'acronyme',         value: orgVal('acronyme') },
    { label: 'Statut juridique', key: 'statut',           value: orgVal('statut', 'statut_juridique', 'legal_status') },
    { label: 'Secteur',          key: 'secteur_activite', value: orgVal('secteur_activite', 'secteur', 'organism_sector') },
    { label: 'Catégorie',        key: 'categorie',        value: orgVal('categorie', 'category', 'organism_category') },
    { label: 'Contact',          key: 'adresse_email',    value: a1.adresse_email || a1.email || cdA1.adresse_email || report?.contact_email || report?.email || '' },
  ];

  const a7g = (extracted.annexe7 || {}).global || {};
  const a7d = Array.isArray((extracted.annexe7 || {}).detail) ? (extracted.annexe7.detail) : [];
  const a3dc = (extracted.annexe3 || {}).datacenter || {};

  // ══════════════════════════════════════════════════════
  // FIXED findDC function — skips numeric keys and short values
  // ══════════════════════════════════════════════════════
  // eslint-disable-next-line no-unused-vars
  const findDC = (...keywords) => {
    const isUsable = (v) => {
      if (v == null || v === '') return false;
      const s = String(v).trim();
      if (/^\d+$/.test(s)) return false;
      if (s.length <= 1) return false;
      return true;
    };

    // 1. a7g direct keys (skip numeric)
    for (const kw of keywords) {
      const hit = Object.keys(a7g).find(k => !/^\d+$/.test(k) && k.toLowerCase().includes(kw.toLowerCase()));
      if (hit && isUsable(a7g[hit])) return String(a7g[hit]).trim();
    }

    // 2. a7 detail rows
    for (const kw of keywords) {
      const row = a7d.find(r => {
        const haystack = [r.indicateur, r.categorie, r.commentaire, r.valeur_attendue]
          .filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(kw.toLowerCase());
      });
      if (row) {
        const v = row.valeur || row.commentaire || '';
        if (isUsable(v)) return String(v).trim();
      }
    }

    // 3. a3.datacenter keys (skip numeric)
    for (const kw of keywords) {
      const hit = Object.keys(a3dc).find(k => !/^\d+$/.test(k) && k.toLowerCase().includes(kw.toLowerCase()));
      if (hit && isUsable(a3dc[hit])) return String(a3dc[hit]).trim();
    }

    // 4. report root keys (skip numeric)
    for (const kw of keywords) {
      const rKey = Object.keys(report || {}).find(
        k => !/^\d+$/.test(k) && k.toLowerCase().includes(kw.toLowerCase())
      );
      if (rKey && isUsable(report[rKey])) return String(report[rKey]).trim();
    }

    return '';
  };

  // Editable table data with local state
  const [serveursData, setServeursData] = useState(() => {
    const src = Array.isArray(a3.serveurs) && a3.serveurs.length > 0 ? a3.serveurs : [
      { nom: 'SRV-AD01',    ip: '192.168.10.10', os: 'Windows Server 2019', role: 'Active Directory', eol: false },
      { nom: 'SRV-APP01',   ip: '192.168.10.20', os: 'RedHat Enterprise 8', role: 'Application ERP',  eol: false },
      { nom: 'SRV-PROXY01', ip: '192.168.10.30', os: 'Ubuntu 18.04',        role: 'Proxy/Cache',       eol: true  },
    ];
    return src.map(s => ({
      nom: s.nom || s.name || '',
      ip: s.adresse_ip || s.ip || '',
      os: s.systeme_exploitation || s.os || '',
      role: s.role || '',
      eol: s.eol ?? (s.systeme_exploitation || s.os || '').toLowerCase().includes('18.04'),
    }));
  });

  const [reseauData, setReseauData] = useState(() => {
    const src = Array.isArray(a3.infrastructure_reseau) && a3.infrastructure_reseau.length > 0
      ? a3.infrastructure_reseau
      : [
          { nature: 'Firewall',    modele: 'Fortinet FortiGate 100F', qty: '2', role: 'Sécurité frontale' },
          { nature: 'Switch Core', modele: 'Cisco Catalyst 9300',     qty: '2', role: 'Routage interne' },
          { nature: 'VPN Gateway', modele: 'Pulse Secure',            qty: '1', role: 'Accès distant' },
        ];
    return src.map(r => ({ nature: r.nature || '', modele: r.marque_modele || r.modele || '', qty: String(r.quantite || r.qty || ''), role: r.observations || r.role || '' }));
  });

  const [postesData, setPostesData] = useState(() => {
    const src = Array.isArray(a3.postes_travail) && a3.postes_travail.length > 0
      ? a3.postes_travail
      : [
          { os: 'Windows 10 Enterprise', nb: '120', eol: false },
          { os: 'Windows 11 Pro',         nb: '80',  eol: false },
          { os: 'Windows 7 (obsolète)',   nb: '15',  eol: true  },
        ];
    return src.map(p => ({ os: p.systeme_exploitation || p.os || '', nb: String(p.nombre || p.nb || ''), eol: p.eol ?? (p.systeme_exploitation || p.os || '').toLowerCase().includes('7') }));
  });

  const [appsData, setAppsData] = useState(() => {
    const src = Array.isArray(a3.applications) && a3.applications.length > 0
      ? a3.applications
      : [
          { nom: 'Portail Client', desc: 'Portail client national', env: 'React / Node.js', users: '300 000' },
          { nom: 'ERP Finance',    desc: 'Comptabilité & Facturation', env: 'Oracle', users: '150' },
        ];
    return src.map(a => ({ nom: a.nom || '', desc: a.description || a.modules || '', env: a.env_dev || a.env || '', users: String(a.nb_utilisateurs || a.users || '') }));
  });

  const procRaw = normalizeAnnexe2(extracted.annexe2).processus || [];
  const [procData, setProcData] = useState(() => {
    const src = procRaw.length > 0 ? procRaw : [
      { nom: 'Facturation & Paiement',     c: '4', i: '4', d: '4' },
      { nom: 'Support Client (Helpdesk)', c: '2', i: '3', d: '3' },
      { nom: 'Gestion des RH',             c: '3', i: '2', d: '2' },
    ];
    return src.map(p => ({ nom: p.processus || p.nom || '', c: String(p.confidentialite || p.c || ''), i: String(p.integrite || p.i || ''), d: String(p.disponibilite || p.d || '') }));
  });

  const getCriticite = (c, i, d) => {
    const max = Math.max(Number(c) || 0, Number(i) || 0, Number(d) || 0);
    if (max >= 4) return { label: 'Très critique', cls: 'tri-badge-err' };
    if (max >= 3) return { label: 'Moyen', cls: 'tri-badge-mid' };
    return { label: 'Faible', cls: 'tri-badge-ok' };
  };

  const domainData = [
    { domaine: '5. Organisationnel', score: 2.6, forts: ['PSSI (3)', 'RSSI (3)', 'Incidents (3)'], faibles: ['Actifs (2)', 'Continuité (2)'] },
    { domaine: '6. Personnes',       score: 2.5, forts: ['Recrutement (3)', 'Contrats (3)'],        faibles: ['Sensibilisation (2)', 'Disciplinaire (2)'] },
    { domaine: '7. Physique',        score: 3.5, forts: ['Périmètres (4)', 'Accès (4)', 'Sinistres (3)'], faibles: [] },
    { domaine: '8. Technologique',   score: 2.4, forts: ['Endpoints (3)', 'Antivirus (3)'],          faibles: ['PAM (2)', 'IAM (2)', 'SIEM (2)', 'Vulnérabilités (2)'] },
  ];

  /*
  const indGroups = [
    { titre: '🔄 Continuité', items: [
      { label: 'PCA', ok: true,  text: 'Opérationnel' },
      { label: 'PRA', ok: true,  text: 'Opérationnel' },
      { label: 'Site de secours', ok: true, text: 'Sfax opérationnel' },
      { label: 'MàJ PCA/PRA', ok: false, text: 'À mettre à jour' },
    ]},
    { titre: '📂 Gestion des actifs', items: [
      { label: 'Inventaire',     ok: true,  text: 'Existant' },
      { label: 'Classification', ok: false, text: 'Non implémenté' },
    ]},
    { titre: '💾 Sauvegardes', items: [
      { label: 'Politique',      ok: true,  text: 'Définie' },
      { label: 'Couverture',     gauge: 100, text: '100%' },
      { label: 'Tests restauration', ok: false, text: 'Aucun test effectué' },
    ]},
    { titre: '🔑 Contrôle d\'accès', items: [
      { label: 'Active Directory', ok: true,  text: 'Intégré' },
      { label: 'IAM',              ok: false, text: 'Non implémenté' },
      { label: 'Proxy',            ok: true,  text: 'Opérationnel' },
      { label: 'MFA',              ok: false, text: 'Non activé' },
    ]},
    { titre: '🛡️ Antivirus', items: [
      { label: 'Solution',          ok: true, text: 'Kaspersky' },
      { label: 'MàJ automatiques',  ok: true, text: 'Active' },
      { label: 'Couverture serveurs', gauge: 100, text: '100%' },
      { label: 'Couverture PC',       gauge: 97,  text: '97%' },
    ]},
    { titre: '📡 SIEM & Synchro', items: [
      { label: 'SIEM',       ok: false, text: 'Non déployé', crit: true },
      { label: 'Synchro NTP', ok: true,  text: 'Synchronisé' },
    ]},
    { titre: '🏭 Data-center', items: [
      { label: 'Existence DC',      ok: true, text: 'Oui (Tunis)' },
      { label: 'Classification',    info: 'Tier 2' },
      { label: 'Accès biométrique', ok: true, text: 'Biométrie + Badge' },
    ]},
  ];
  */

  const eolCount = serveursData.filter(s => s.eol).length + postesData.filter(p => p.eol).length;

  const sections = [
    { key: 'organisme', title: "1️⃣ Présentation de l'organisme audité", source: "Annexe 1" },
    { key: 'perimetre', title: "2️⃣ Périmètre géographique", source: "Annexe 1 · 3 · 7" },
    { key: 'si',        title: "3️⃣ Système d'information",        source: "Annexe 3 + Annexe 2" },
    { key: 'maturite',  title: "4️⃣ État de maturité",             source: "Annexe 6" },
    { key: 'indicateurs', title: "5️⃣ Indicateurs de sécurité",    source: "Annexe 7" },
  ];

  const tabLabels = [
    `Serveurs (${serveursData.length})`,
    `Réseau (${reseauData.length})`,
    `Postes (${postesData.length})`,
    `Applications (${appsData.length})`,
    `Criticité processus`,
  ];

  const thStyle = { padding: '6px 8px', textAlign: 'left', background: 'rgba(139,92,246,0.08)', color: '#c4b5fd', fontWeight: 600, fontSize: 11, borderBottom: '1px solid rgba(139,92,246,0.15)' };
  const tdStyle = { padding: '7px 8px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#e2e8f0', verticalAlign: 'middle' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── KPI Bar ── */}
      <div className="syn-kpi-bar">
        <div className="syn-kpi">
          <div className="syn-kpi-val" style={{ color: ind.maturity_level >= 3 ? '#34d399' : '#fbbf24' }}>
            {ind.maturity_level != null ? `${ind.maturity_level}/5` : '2.8/5'}
          </div>
          <div className="syn-kpi-lbl">Maturité globale</div>
        </div>
        <div className="syn-kpi">
          <div className="syn-kpi-val" style={{ color: '#818cf8' }}>
            {ind.compliance_score != null ? `${ind.compliance_score}%` : '58%'}
          </div>
          <div className="syn-kpi-lbl">Conformité</div>
        </div>
        <div className="syn-kpi">
          <div className="syn-kpi-val" style={{ color: eolCount > 0 ? '#f87171' : '#34d399' }}>
            {eolCount}
          </div>
          <div className="syn-kpi-lbl">Équipements EoL</div>
        </div>
        <div className="syn-kpi">
          <div className="syn-kpi-val" style={{ color: ind.critical_vulns_open > 0 ? '#f87171' : '#34d399' }}>
            {ind.critical_vulns_open ?? 3}
          </div>
          <div className="syn-kpi-lbl">Vulnérabilités critiques</div>
        </div>
      </div>

      {/* ── Sections ── */}
      {sections.map(section => {
        const isAnnotated = annotatedPaths.has(`synthesis.${section.key}`);
        return (
          <div key={section.key} className={`syn-section ${isAnnotated ? 'annotated' : ''}`}>
            <div
              className="syn-head"
              onClick={() => onAnnotateField(`synthesis.${section.key}`, section.title)}
            >
              <div className="syn-head-left">
                <span className="syn-head-title">
                  {section.title}
                  {isAnnotated && <span style={{ fontSize: 10, color: '#f59e0b' }}>📌</span>}
                </span>
                <span className="syn-head-source">📍 Source : {section.source}</span>
              </div>
              <span className="syn-annotate-hint">
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                Annoter
              </span>
            </div>

            <div className="syn-body">

              {/* ── Section 1: Présentation de l'organisme ── */}
              {section.key === 'organisme' && (
                <div className="syn-kv-grid">
                  {orgFields.map(f => (
                    <EditableKV
                      key={f.key}
                      label={f.label}
                      value={f.value}
                      fieldKey={f.key}
                      onSave={(key, val) => handleKVSave('annexe1', key, val)}
                    />
                  ))}
                </div>
              )}

              {/* ── Section 2: Périmètre géographique ── */}
              {section.key === 'perimetre' && (() => {
                const nomOrg = (a1.nom_organisme || report?.organism_name || '').trim();
                const adresse = a1.adresse || a1.pays || a1.ville || '';
                const serveurs = Array.isArray(a3.serveurs) ? a3.serveurs : [];
                const reseau = Array.isArray(a3.infrastructure_reseau) ? a3.infrastructure_reseau : [];

                // Find datacenter/salle serveur mention in a7 detail
                const dcRow = a7d.find(r => {
                  const txt = [r.indicateur, r.categorie, r.commentaire].filter(Boolean).join(' ').toLowerCase();
                  return txt.includes('salle') || txt.includes('datacenter') || txt.includes('serveur') || txt.includes('local');
                });
                const dcText = dcRow ? (dcRow.commentaire || dcRow.valeur || '') : (a3.datacenter?.localisation || '');

                // Find VPN/remote access from reseau
                const vpnItem = reseau.find(r => {
                  const txt = [r.nature, r.role, r.modele, r.marque_modele, r.observations].filter(Boolean).join(' ').toLowerCase();
                  return txt.includes('vpn') || txt.includes('distant') || txt.includes('remote');
                });

                // Build IP range hint from first server
                const sampleIps = serveurs.slice(0, 2).map(s => s.adresse_ip || s.ip || '').filter(Boolean);
                const ipHint = sampleIps.length > 0
                  ? `adresses IP internes (${sampleIps[0].replace(/\.\d+$/, '.x.x')}) et infrastructure localisée au siège`
                  : 'infrastructure réseau et serveurs locaux';

                // Annex reference rows
                const annexRefs = [
                  {
                    annexe: 'Annexe 1',
                    contenu: nomOrg
                      ? `Présentation de l'organisme : nom « ${nomOrg} »${adresse ? ` indiquant l'implantation en ${adresse}` : ''}`
                      : "Présentation de l'organisme (données non encore extraites)",
                  },
                  {
                    annexe: 'Annexe 3',
                    contenu: `Description du SI : ${ipHint}`,
                  },
                  ...(dcText
                    ? [{
                        annexe: 'Annexe 7',
                        contenu: `Indicateurs de sécurité : mention explicite « ${dcText} » pour le local datacenter`,
                      }]
                    : []),
                ];

                // Synthesis items
                const siegeSocial = a1.pays || a1.ville || adresse || '—';
                const dcLocation = dcText || '—';
                const periText = serveurs.length > 0
                  ? `Tous les équipements listés en Annexe 3 avec la mention « Oui » dans la colonne Périmètre`
                  : 'Équipements du SI (voir Annexe 3)';
                const vpnText = vpnItem
                  ? `${vpnItem.nature || 'VPN'} (${vpnItem.marque_modele || vpnItem.modele || ''}), étendant virtuellement le périmètre aux postes distants sécurisés`
                  : 'Non renseigné';

                const synthesis = [
                  { label: 'Siège social',              value: siegeSocial },
                  { label: 'Datacenter',                 value: dcLocation },
                  { label: "Périmètre d'audit technique", value: periText },
                  { label: 'Accès distant',              value: vpnText },
                ];

                return (
                  <>
                    {/* Intro */}
                    <div style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.75, marginBottom: 14, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                      D'après le document fourni,{nomOrg ? <> l'organisme <strong style={{ color: '#e2e8f0' }}>« {nomOrg} »</strong></> : <> l'organisme analysé</>} ne dispose pas d'annexe dédiée exclusivement au « Périmètre géographique ». Cependant, les informations relatives au périmètre sont dispersées dans les annexes suivantes :
                    </div>

                    {/* Annexe reference table */}
                    <table className="peri-table" style={{ marginBottom: 16 }}>
                      <thead>
                        <tr>
                          <th style={{ width: '18%' }}>Annexe</th>
                          <th>Contenu pertinent pour le périmètre géographique</th>
                          <th style={{ width: 36, textAlign: 'center', cursor: 'pointer' }}
                            title="Exporter"
                            onClick={() => {
                              const rows = annexRefs.map(r => `${r.annexe}\t${r.contenu}`).join('\n');
                              navigator.clipboard?.writeText(rows);
                            }}
                          >⬇</th>
                        </tr>
                      </thead>
                      <tbody>
                        {annexRefs.map((r, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 700, color: '#c4b5fd', fontSize: 12 }}>{r.annexe}</td>
                            <td style={{ color: '#e2e8f0', fontSize: 12.5, lineHeight: 1.65 }}>{r.contenu}</td>
                            <td />
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Synthesis */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <span style={{ fontSize: 14 }}>📍</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>Synthèse du périmètre géographique :</span>
                      </div>
                      <ul style={{ listStyle: 'disc', paddingLeft: 22, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {synthesis.map((s, i) => (
                          <li key={i} style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.65 }}>
                            <strong style={{ color: '#e2e8f0' }}>{s.label}</strong> : {s.value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                );
              })()}

              {/* ── Section 3: SI Tabs ── */}
              {section.key === 'si' && (
                <>
                  {eolCount > 0 && (
                    <div className="syn-alert-bar">
                      ⚠️ {eolCount} équipement(s) EoL détecté(s) — à signaler dans le rapport
                    </div>
                  )}
                  <div className="syn-tabs">
                    {tabLabels.map((label, i) => (
                      <div
                        key={i}
                        className={`syn-tab ${activeTab === i ? 'active' : ''}`}
                        onClick={() => setActiveTab(i)}
                      >
                        {label}
                      </div>
                    ))}
                  </div>

                  {/* Tab 0: Serveurs */}
                  <div className={`syn-tab-body ${activeTab === 0 ? 'active' : ''}`}>
                    <table className="syn-table">
                      <colgroup><col style={{ width: '22%' }} /><col style={{ width: '20%' }} /><col style={{ width: '30%' }} /><col style={{ width: '18%' }} /><col style={{ width: '10%' }} /></colgroup>
                      <thead><tr><th style={thStyle}>Serveur</th><th style={thStyle}>IP</th><th style={thStyle}>OS</th><th style={thStyle}>Rôle</th><th style={thStyle}>Statut</th></tr></thead>
                      <tbody>
                        {serveursData.map((s, i) => (
                          <tr key={i} className={s.eol ? 'eol-row' : ''}>
                            <td style={tdStyle}><strong>{s.nom}</strong></td>
                            <EditableCell value={s.ip}   onSave={v => setServeursData(prev => prev.map((r, ri) => ri === i ? { ...r, ip: v } : r))} style={tdStyle} />
                            <EditableCell value={s.os}   onSave={v => setServeursData(prev => prev.map((r, ri) => ri === i ? { ...r, os: v, eol: v.toLowerCase().includes('18.04') || v.toLowerCase().includes('2012') } : r))} style={tdStyle} />
                            <EditableCell value={s.role} onSave={v => setServeursData(prev => prev.map((r, ri) => ri === i ? { ...r, role: v } : r))} style={tdStyle} />
                            <td style={tdStyle}><span className={`tri-badge ${s.eol ? 'tri-badge-mid' : 'tri-badge-ok'}`}>{s.eol ? 'EoL' : 'Conforme'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Tab 1: Réseau */}
                  <div className={`syn-tab-body ${activeTab === 1 ? 'active' : ''}`}>
                    <table className="syn-table">
                      <colgroup><col style={{ width: '18%' }} /><col style={{ width: '38%' }} /><col style={{ width: '10%' }} /><col /></colgroup>
                      <thead><tr><th style={thStyle}>Nature</th><th style={thStyle}>Marque / Modèle</th><th style={thStyle}>Qté</th><th style={thStyle}>Rôle</th></tr></thead>
                      <tbody>
                        {reseauData.map((r, i) => (
                          <tr key={i}>
                            <td style={tdStyle}>{r.nature}</td>
                            <EditableCell value={r.modele} onSave={v => setReseauData(prev => prev.map((x, xi) => xi === i ? { ...x, modele: v } : x))} style={tdStyle} />
                            <EditableCell value={r.qty}    onSave={v => setReseauData(prev => prev.map((x, xi) => xi === i ? { ...x, qty: v } : x))} style={{ ...tdStyle, textAlign: 'center' }} />
                            <EditableCell value={r.role}   onSave={v => setReseauData(prev => prev.map((x, xi) => xi === i ? { ...x, role: v } : x))} style={tdStyle} />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Tab 2: Postes */}
                  <div className={`syn-tab-body ${activeTab === 2 ? 'active' : ''}`}>
                    <table className="syn-table">
                      <colgroup><col style={{ width: '55%' }} /><col style={{ width: '20%' }} /><col /></colgroup>
                      <thead><tr><th style={thStyle}>OS</th><th style={thStyle}>Nombre</th><th style={thStyle}>Statut</th></tr></thead>
                      <tbody>
                        {postesData.map((p, i) => (
                          <tr key={i} className={p.eol ? 'eol-row' : ''}>
                            <EditableCell value={p.os} onSave={v => setPostesData(prev => prev.map((x, xi) => xi === i ? { ...x, os: v, eol: v.toLowerCase().includes('7') || v.toLowerCase().includes('obsolète') } : x))} style={tdStyle} />
                            <EditableCell value={p.nb} onSave={v => setPostesData(prev => prev.map((x, xi) => xi === i ? { ...x, nb: v } : x))} style={{ ...tdStyle, textAlign: 'center' }} />
                            <td style={tdStyle}><span className={`tri-badge ${p.eol ? 'tri-badge-mid' : 'tri-badge-ok'}`}>{p.eol ? 'EoL' : 'Conforme'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Tab 3: Applications */}
                  <div className={`syn-tab-body ${activeTab === 3 ? 'active' : ''}`}>
                    <table className="syn-table">
                      <colgroup><col style={{ width: '20%' }} /><col style={{ width: '30%' }} /><col style={{ width: '25%' }} /><col /></colgroup>
                      <thead><tr><th style={thStyle}>Nom</th><th style={thStyle}>Description</th><th style={thStyle}>Environnement</th><th style={thStyle}>Utilisateurs</th></tr></thead>
                      <tbody>
                        {appsData.map((a, i) => (
                          <tr key={i}>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>{a.nom}</td>
                            <EditableCell value={a.desc}  onSave={v => setAppsData(prev => prev.map((x, xi) => xi === i ? { ...x, desc: v } : x))} style={tdStyle} />
                            <EditableCell value={a.env}   onSave={v => setAppsData(prev => prev.map((x, xi) => xi === i ? { ...x, env: v } : x))} style={tdStyle} />
                            <EditableCell value={a.users} onSave={v => setAppsData(prev => prev.map((x, xi) => xi === i ? { ...x, users: v } : x))} style={{ ...tdStyle, textAlign: 'right' }} />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Tab 4: Criticité */}
                  <div className={`syn-tab-body ${activeTab === 4 ? 'active' : ''}`}>
                    <table className="syn-table">
                      <colgroup><col style={{ width: '40%' }} /><col style={{ width: '10%' }} /><col style={{ width: '10%' }} /><col style={{ width: '10%' }} /><col /></colgroup>
                      <thead><tr><th style={thStyle}>Processus métier</th><th style={{ ...thStyle, textAlign: 'center' }}>C</th><th style={{ ...thStyle, textAlign: 'center' }}>I</th><th style={{ ...thStyle, textAlign: 'center' }}>D</th><th style={thStyle}>Criticité</th></tr></thead>
                      <tbody>
                        {procData.map((p, i) => {
                          const crit = getCriticite(p.c, p.i, p.d);
                          return (
                            <tr key={i} style={{ background: crit.cls === 'tri-badge-err' ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                              <td style={tdStyle}>{p.nom}</td>
                              <EditableCell value={p.c} onSave={v => setProcData(prev => prev.map((x, xi) => xi === i ? { ...x, c: v } : x))} style={{ ...tdStyle, textAlign: 'center' }} />
                              <EditableCell value={p.i} onSave={v => setProcData(prev => prev.map((x, xi) => xi === i ? { ...x, i: v } : x))} style={{ ...tdStyle, textAlign: 'center' }} />
                              <EditableCell value={p.d} onSave={v => setProcData(prev => prev.map((x, xi) => xi === i ? { ...x, d: v } : x))} style={{ ...tdStyle, textAlign: 'center' }} />
                              <td style={tdStyle}><span className={`tri-badge ${crit.cls}`}>{crit.label}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 8, padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                      💡 Les valeurs C/I/D sont sur 4. Criticité calculée automatiquement à la modification.
                    </div>
                  </div>
                </>
              )}

              {/* ── Section 4: Maturité ── */}
              {section.key === 'maturite' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 12, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(139,92,246,0.08)' }}>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      Niveau global : <strong style={{ color: '#34d399', fontSize: 14 }}>{ind.maturity_level != null ? `${ind.maturity_level} / 5` : '2.8 / 5'}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      Conformité : <strong style={{ color: '#818cf8', fontSize: 14 }}>{ind.compliance_score != null ? `${ind.compliance_score}%` : '58%'}</strong>
                    </div>
                  </div>
                  <div className="syn-domain-list">
                    {domainData.map((d, i) => {
                      const pct = Math.round((d.score / 5) * 100);
                      const good = d.score >= 3;
                      return (
                        <div key={i} className="syn-domain-row">
                          <span className="syn-domain-label">{d.domaine}</span>
                          <span className="syn-domain-score" style={{ color: good ? '#34d399' : '#fbbf24' }}>{d.score.toFixed(1)} / 5</span>
                          <div>
                            <div className="syn-score-bar">
                              <div className="syn-score-fill" style={{ width: `${pct}%`, background: good ? '#34d399' : '#f59e0b' }} />
                            </div>
                            <div className="syn-domain-tags">
                              {d.forts.map((f, fi) => <span key={fi} className="syn-tag syn-tag-ok">{f}</span>)}
                              {d.faibles.map((f, fi) => <span key={fi} className="syn-tag syn-tag-warn">{f}</span>)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Section 5: Indicateurs ── */}
              {section.key === 'indicateurs' && (
                <div>
                  {a7d.length === 0 ? (
                    <div className="tri-empty" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.08)' }}>Aucun indicateur extrait.</div>
                  ) : (
                    <table className="syn-table" style={{ width: '100%' }}>
                      <colgroup>
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '35%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '30%' }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th style={thStyle}>Catégorie</th>
                          <th style={thStyle}>Indicateur</th>
                          <th style={thStyle}>Valeur</th>
                          <th style={thStyle}>Commentaire</th>
                        </tr>
                      </thead>
                      <tbody>
                        {a7d.map((d, i) => {
                          const cat = d.categorie && d.categorie !== 'Non spécifié' ? d.categorie : '—';
                          const indName = d.indicateur || '—';
                          const valStr = String(d.valeur || '').trim();
                          const displayVal = (valStr === '1' || valStr.toLowerCase() === 'oui') ? 'Oui' : (valStr === '0' || valStr.toLowerCase() === 'non') ? 'Non' : (d.valeur || '—');
                          const valColor = displayVal === 'Oui' ? '#34d399' : displayVal === 'Non' ? '#f87171' : 'inherit';
                          return (
                            <tr key={i}>
                              <td style={{ ...tdStyle, color: '#94a3b8', fontSize: 11.5, whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'top' }}>{cat}</td>
                              <td style={{ ...tdStyle, fontWeight: 600, fontSize: 11.5, whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'top' }}>{indName}</td>
                              <td style={{ ...tdStyle, color: valColor, fontWeight: displayVal === 'Oui' || displayVal === 'Non' ? 700 : 'normal', fontSize: 11.5, whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'top' }}>
                                {displayVal}
                              </td>
                              <td style={{ ...tdStyle, color: '#cbd5e1', fontSize: 11.5, whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'top' }}>
                                {d.commentaire || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Annotations Panel ────────────────────────────────────────────────────────

function AnnotationsPanel({ annotations, annLoading, counts, addAnnotation, deleteAnnotation, sendToResponsable, selectedField, clearSelectedField, report }) {
  const [annType, setAnnType] = useState('remarque');
  const [annTarget, setAnnTarget] = useState("Présentation de l'organisme");
  const [annText, setAnnText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (selectedField) { setAnnTarget(selectedField.label); setAnnText(''); }
  }, [selectedField]);

  const handleAdd = async () => {
    if (!annText.trim()) return;
    const r = await addAnnotation({ type: annType, target: annTarget, text: annText.trim(), fieldPath: selectedField?.path || null });
    if (r.success) {
      setAnnText('');
      clearSelectedField();
    } else {
      alert("Erreur lors de l'ajout: " + r.error);
    }
  };

  const handleSend = async () => {
    setSending(true);
    const r = await sendToResponsable(report?.id);
    setSending(false);
    if (!r.success) alert(r.error);
  };

  const typeLabel = t => t === 'remarque' ? 'Remarque' : t === 'reserve' ? 'Réserve' : 'Recommandation';
  const typeClass = t => t === 'remarque' ? 'type-r' : t === 'reserve' ? 'type-v' : 'type-c';
  const annClass  = t => `tri-ann-item ann-${t}`;

  return (
    <>
      <div className="tri-card-head">
        <h3>📝 Annotations</h3>
        <span style={{ fontSize: 11, color: '#64748b' }}>{counts.total} au total</span>
      </div>
      <div className="tri-counts">
        <div className="tri-count-box"><div className="tri-count-n n-r">{counts.remarque}</div><div className="tri-count-l">Remarques</div></div>
        <div className="tri-count-box"><div className="tri-count-n n-v">{counts.reserve}</div><div className="tri-count-l">Réserves</div></div>
        <div className="tri-count-box"><div className="tri-count-n n-c">{counts.recommandation}</div><div className="tri-count-l">Recommand.</div></div>
      </div>
      <div className="tri-ann-form tri-form">
        {selectedField && (
          <div className="tri-field-hint">
            📌 Champ : <strong>{selectedField.label}</strong>
            <button onClick={clearSelectedField} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer' }}>✕</button>
          </div>
        )}
        <div className="tri-form-group">
          <label className="tri-form-label">Type</label>
          <select value={annType} onChange={e => setAnnType(e.target.value)}>
            <option value="remarque">Remarque</option>
            <option value="reserve">Réserve</option>
            <option value="recommandation">Recommandation</option>
          </select>
        </div>
        <div className="tri-form-group">
          <label className="tri-form-label">Cible</label>
          <select value={annTarget} onChange={e => setAnnTarget(e.target.value)}>
            <option value="Présentation de l'organisme">Présentation de l'organisme</option>
            <option value="Périmètre géographique">Périmètre géographique</option>
            <option value="Description du système d'information">Description du système d'information</option>
            <option value="État de maturité">État de maturité</option>
            <option value="Indicateurs de sécurité">Indicateurs de sécurité</option>
            <option value="Général">Général</option>
          </select>
        </div>
        <div className="tri-form-group">
          <label className="tri-form-label">Texte</label>
          <textarea value={annText} onChange={e => setAnnText(e.target.value)} placeholder="Votre annotation…" rows={3} />
        </div>
        <div className="tri-btn-row">
          <button className="tri-btn-add" onClick={handleAdd} disabled={!annText.trim()}>+ Ajouter</button>
        </div>
      </div>
      <div className="tri-ann-divider">Annotations ({counts.total})</div>
      {annLoading
        ? <div className="tri-empty">Chargement…</div>
        : annotations.length === 0
          ? <div className="tri-empty">Aucune annotation. Cliquez sur une section pour annoter.</div>
          : (
            <div className="tri-ann-list">
              {annotations.map(a => (
                <div key={a.id} className={annClass(a.type)}>
                  <div className={`tri-ann-type ${typeClass(a.type)}`}>{typeLabel(a.type)}</div>
                  <div className="tri-ann-text">{a.text}</div>
                  <div className="tri-ann-meta">
                    <span>{a.created_at?.split('T')[0]} · {a.author}</span>
                    {a.status === 'sent'
                      ? <span style={{ color: '#34d399', fontSize: 10, fontWeight: 600 }}>✓ Envoyé</span>
                      : <button className="tri-ann-del" onClick={() => deleteAnnotation(a.id)}>🗑</button>}
                  </div>
                </div>
              ))}
            </div>
          )
      }
      <div className="tri-send-section">
        <div className="tri-send-summary"><strong>{counts.draft}</strong> brouillon(s) · <strong>{counts.sent}</strong> envoyé(s)</div>
        <button className="tri-btn-send" onClick={handleSend} disabled={sending || counts.draft === 0}>
          {sending ? '⏳ Envoi…' : `📤 Envoyer (${counts.draft}) au responsable`}
        </button>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TechnicalReviewInterface({
  report,
  onValidate,
  onReject,
  validating = false,
  rejecting = false,
}) {
  const [toast, setToast] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const styleRef = useRef(false);

  useEffect(() => {
    if (styleRef.current) return;
    const el = document.createElement('style');
    el.textContent = CSS;
    document.head.appendChild(el);
    styleRef.current = true;
  }, []);

  const { annotations, loading: annLoading, counts, addAnnotation, deleteAnnotation, sendToResponsable } = useAnnotations(report?.id);

  const showToast = (msg, err = false) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 3500);
  };

  const annotatedPaths = new Set(annotations.filter(a => a.field_path).map(a => a.field_path));
  const handleAnnotateField = (path, label) => setSelectedField({ path, label });

  const handleValidate = async () => {
    if (!onValidate || isValidating || validating) return;
    setIsValidating(true);
    try {
      const result = await onValidate(report?.id);
      if (result?.success) showToast('✅ Rapport soumis au responsable');
      else showToast(result?.error || "Erreur lors de la soumission", true);
    } catch { showToast("Erreur lors de la soumission", true); }
    finally { setIsValidating(false); }
  };

  const handleReject = async () => {
    if (!onReject || isRejecting || rejecting) return;
    const reason = prompt('Motif du rejet :', 'Données insuffisantes ou non conformes');
    if (!reason) return;
    setIsRejecting(true);
    try {
      const result = await onReject(report?.id, reason);
      if (result?.success) showToast('❌ Rapport rejeté');
      else showToast(result?.error || 'Erreur lors du rejet', true);
    } catch { showToast('Erreur lors du rejet', true); }
    finally { setIsRejecting(false); }
  };

  const isFinalized = report?.status === 'validé' || report?.status === 'rejeté' || report?.status === 'clôturé';
  const isDisabled  = isFinalized || isValidating || isRejecting || validating || rejecting;

  const extracted    = normalizeExtracted(report);
  const a1           = extracted?.annexe1 || {};
  const organismName = (a1.nom_organisme || report?.organism_name || '—').trim();

  return (
    <div className="tri-root">
      {toast && <div className={`tri-toast ${toast.err ? 'error' : ''}`}>{toast.msg}</div>}

      {/* ── Col gauche ── */}
      <div className="tri-left-col">
        <div className="tri-card">
          <div className="tri-card-head">
            <h3>📂 Données brutes du rapport</h3>
            <span style={{ fontSize: 11, color: '#64748b' }}>{organismName}</span>
          </div>
          <LeftAnnexesViewer report={report} />

          {onValidate && (
            <div className="tri-approve-bar">
              <button
                className="tri-btn-approve"
                onClick={handleValidate}
                disabled={report?.status === 'en_validation' || report?.status === 'validé' || isValidating}
              >
                {report?.status === 'en_validation' ? '⏳ En attente responsable' : isValidating ? '⏳ Soumission…' : '✓ Soumettre au responsable'}
              </button>
              {onReject && (
                <button
                  className="tri-btn-reject-main"
                  onClick={handleReject}
                  disabled={isDisabled}
                  style={{ opacity: isDisabled ? 0.5 : 1, cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                >
                  {isRejecting || rejecting ? '⏳ Rejet...' : '✕ Rejeter'}
                </button>
              )}
            </div>
          )}

          {isFinalized && (
            <div style={{
              padding: '10px 16px',
              background: report?.status === 'validé' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              borderTop: '1px solid rgba(139,92,246,0.1)',
              textAlign: 'center', fontSize: 12, fontWeight: 600,
              color: report?.status === 'validé' ? '#34d399' : '#f87171',
            }}>
              {report?.status === 'validé' ? '✓ Rapport approuvé' : '✗ Rapport rejeté'}
            </div>
          )}
        </div>
      </div>

      {/* ── Col droite ── */}
      <div className="tri-right-col">
        <div className="tri-card" style={{ marginBottom: 20 }}>
          <div className="tri-card-head">
            <h3>📊 Données extraites — Revue technique</h3>
            <span style={{ fontSize: 11, color: '#64748b' }}>{organismName}</span>
          </div>
          <SynthesisPanel
            report={report}
            annotatedPaths={annotatedPaths}
            onAnnotateField={handleAnnotateField}
          />
        </div>

        <div className="tri-card">
          <AnnotationsPanel
            annotations={annotations}
            annLoading={annLoading}
            counts={counts}
            addAnnotation={addAnnotation}
            deleteAnnotation={deleteAnnotation}
            sendToResponsable={sendToResponsable}
            selectedField={selectedField}
            clearSelectedField={() => setSelectedField(null)}
            report={report}
          />
        </div>
      </div>
    </div>
  );
}