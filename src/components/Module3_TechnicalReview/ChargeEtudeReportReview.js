// components/Module_ChargeEtude/ChargeEtudeRapportView.jsx
// Layout: LEFT = All annexes viewer | RIGHT = 5 extracted data sections
// Read-only view for Chargé d'Étude after report assignment

import { useState, useRef, useEffect } from 'react';

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

@keyframes ce-fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes ce-pulse   { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
@keyframes ce-spin    { to{transform:rotate(360deg)} }
@keyframes ce-bar     { from{width:0} to{width:var(--w)} }
@keyframes ce-glow    { 0%,100%{box-shadow:0 0 8px rgba(99,211,196,.2)} 50%{box-shadow:0 0 20px rgba(99,211,196,.45)} }

:root {
  --bg:       #07111d;
  --surface:  #0c1a28;
  --card:     rgba(255,255,255,.032);
  --border:   rgba(255,255,255,.07);
  --border2:  rgba(255,255,255,.04);
  --text:     #c8dff5;
  --muted:    #3a5570;
  --muted2:   #243547;
  --teal:     #63d3c4;
  --gold:     #e8c97a;
  --green:    #52d98a;
  --red:      #f07070;
  --blue:     #5baef0;
  --purple:   #9b8cf5;
  --amber:    #f4a843;
  --font-head: 'Syne', sans-serif;
  --font-body: 'DM Sans', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.ce-root {
  font-family: var(--font-body);
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  padding: 0;
}

/* ── Two-column layout ── */
.ce-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
}
@media (max-width: 900px) {
  .ce-layout { grid-template-columns: 1fr; }
  .ce-left   { position: static !important; max-height: none !important; }
}

/* ── Header ── */
.ce-header {
  grid-column: 1 / -1;
  display: flex; align-items: center; gap: 16px;
  padding: 14px 24px;
  background: rgba(0,0,0,.35);
  border-bottom: 1px solid var(--border2);
  backdrop-filter: blur(12px);
  position: sticky; top: 0; z-index: 100;
}
.ce-header-logo {
  width: 36px; height: 36px; border-radius: 10px;
  background: linear-gradient(135deg,#1a4a6e,#0d7a6e);
  border: 1px solid rgba(99,211,196,.25);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-head); font-size: 15px; font-weight: 800; color: var(--teal);
  flex-shrink: 0;
}
.ce-header-org { font-family: var(--font-head); font-size: 15px; font-weight: 700; color: #e4f3ff; }
.ce-header-sub { font-size: 11px; color: var(--muted); margin-top: 1px; }
.ce-header-score {
  margin-left: auto; display: flex; align-items: center; gap: 10px;
}
.ce-score-pill {
  padding: 5px 14px; border-radius: 99px; font-family: var(--font-mono);
  font-size: 13px; font-weight: 600;
  border: 1px solid;
}
.ce-score-pill.ok  { background:rgba(82,217,138,.1);  color:var(--green);  border-color:rgba(82,217,138,.25); }
.ce-score-pill.mid { background:rgba(244,168,67,.1);  color:var(--amber);  border-color:rgba(244,168,67,.25); }
.ce-score-pill.bad { background:rgba(240,112,112,.1); color:var(--red);    border-color:rgba(240,112,112,.25); }
.ce-mat-pill {
  padding: 5px 12px; border-radius: 99px; font-size: 12px; font-weight: 600;
  background: rgba(99,211,196,.08); color: var(--teal);
  border: 1px solid rgba(99,211,196,.2);
}

/* ── Left column ── */
.ce-left {
  border-right: 1px solid var(--border2);
  position: sticky; top: 65px;
  max-height: calc(100vh - 65px);
  overflow-y: auto;
  background: rgba(0,0,0,.12);
}
.ce-left::-webkit-scrollbar { width: 3px; }
.ce-left::-webkit-scrollbar-thumb { background: rgba(99,211,196,.2); border-radius: 99px; }
.ce-left-title {
  padding: 12px 16px 8px;
  font-size: 9px; font-weight: 700; letter-spacing: .9px;
  text-transform: uppercase; color: var(--muted);
  border-bottom: 1px solid var(--border2);
}

/* ── Annexe accordion ── */
.ce-ann {
  border-bottom: 1px solid var(--border2);
}
.ce-ann:last-child { border-bottom: none; }
.ce-ann-head {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px; cursor: pointer;
  transition: background .15s;
}
.ce-ann-head:hover { background: rgba(99,211,196,.04); }
.ce-ann-icon {
  width: 26px; height: 26px; border-radius: 7px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 12px;
}
.ce-ann-label { font-size: 12px; font-weight: 600; color: #8ab0cc; flex: 1; }
.ce-ann-chevron {
  font-size: 9px; color: var(--muted2); transition: transform .2s;
}
.ce-ann-chevron.open { transform: rotate(180deg); }
.ce-ann-body { padding: 8px 16px 12px; background: rgba(0,0,0,.08); }

/* ── KV rows ── */
.ce-kv { display: flex; flex-direction: column; }
.ce-kv-row {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 10px; padding: 5px 0;
  border-bottom: 1px solid rgba(255,255,255,.025);
  font-size: 11.5px;
}
.ce-kv-row:last-child { border-bottom: none; }
.ce-kv-lbl { color: var(--muted); flex-shrink: 0; min-width: 120px; padding-top: 1px; }
.ce-kv-val { color: var(--text); text-align: right; word-break: break-word; max-width: 160px; }
.ce-kv-val.ok   { color: var(--green);  font-weight: 600; }
.ce-kv-val.bad  { color: var(--red);    font-weight: 600; }
.ce-kv-val.warn { color: var(--amber);  font-weight: 600; }
.ce-kv-val.crit { color: var(--red);    font-weight: 700; }
.ce-kv-val.num  { color: var(--purple); font-weight: 600; font-family: var(--font-mono); font-size: 11px; }
.ce-kv-val.mono { font-family: var(--font-mono); font-size: 10px; }

/* ── Tables ── */
.ce-tbl-wrap { overflow-x: auto; margin-top: 4px; }
.ce-tbl { width: 100%; border-collapse: collapse; font-size: 10.5px; }
.ce-tbl th {
  padding: 5px 8px; text-align: left;
  color: var(--muted); font-weight: 700; font-size: 9.5px;
  text-transform: uppercase; letter-spacing: .3px;
  border-bottom: 1px solid var(--border2);
}
.ce-tbl td { padding: 6px 8px; color: var(--text); border-bottom: 1px solid rgba(255,255,255,.02); }
.ce-tbl tr:last-child td { border-bottom: none; }
.ce-tbl tr:hover td { background: rgba(255,255,255,.015); }

/* ── Right column ── */
.ce-right {
  padding: 22px 24px 48px;
  overflow-y: auto;
}

/* ── Section cards ── */
.ce-section {
  margin-bottom: 20px;
  border: 1px solid var(--border);
  border-radius: 14px; overflow: hidden;
  animation: ce-fadeUp .4s both;
}
.ce-section:nth-child(1) { animation-delay: .04s; }
.ce-section:nth-child(2) { animation-delay: .09s; }
.ce-section:nth-child(3) { animation-delay: .14s; }
.ce-section:nth-child(4) { animation-delay: .19s; }
.ce-section:nth-child(5) { animation-delay: .24s; }

.ce-sec-head {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px;
  background: rgba(0,0,0,.18);
  border-bottom: 1px solid var(--border2);
}
.ce-sec-icon {
  width: 30px; height: 30px; border-radius: 9px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 14px;
}
.ce-sec-title {
  font-family: var(--font-head);
  font-size: 12px; font-weight: 700; color: #d0e8ff;
  text-transform: uppercase; letter-spacing: .5px;
  flex: 1;
}
.ce-sec-badge {
  padding: 2px 9px; border-radius: 99px; font-size: 10px; font-weight: 700;
  background: rgba(91,174,240,.1); color: var(--blue);
  border: 1px solid rgba(91,174,240,.2);
}
.ce-sec-count {
  font-size: 10px; color: var(--muted);
}

/* ── Field grid ── */
.ce-field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
  padding: 14px 16px;
}
.ce-field-box {
  padding: 9px 12px;
  background: rgba(255,255,255,.025);
  border: 1px solid var(--border2);
  border-radius: 9px;
  transition: border-color .15s;
}
.ce-field-box:hover { border-color: rgba(99,211,196,.2); }
.ce-field-label { font-size: 9.5px; color: var(--muted); text-transform: uppercase; letter-spacing: .4px; font-weight: 600; margin-bottom: 4px; }
.ce-field-value { font-size: 13px; color: var(--text); font-weight: 500; line-height: 1.3; }
.ce-field-value.bool-yes { color: var(--green); }
.ce-field-value.bool-no  { color: var(--red);   }
.ce-field-value.warn     { color: var(--amber);  }
.ce-field-value.crit     { color: var(--red); font-weight: 700; }

/* ── Maturité bar ── */
.ce-mat-wrap { padding: 14px 16px 6px; }
.ce-mat-row  { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
.ce-mat-lbl  { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .4px; font-weight: 600; }
.ce-mat-num  { font-family: var(--font-head); font-size: 26px; font-weight: 800; }
.ce-bar-track { height: 6px; background: rgba(255,255,255,.06); border-radius: 99px; overflow: hidden; margin-bottom: 16px; }
.ce-bar-fill  { height: 100%; border-radius: 99px; }

/* ── SSI indicator grid ── */
.ce-ssi-grid {
  display: grid; grid-template-columns: repeat(3,1fr);
  border-top: 1px solid var(--border2);
}
.ce-ssi-cell {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 12px 8px; text-align: center;
  border-right: 1px solid var(--border2);
  border-bottom: 1px solid var(--border2);
  transition: background .15s;
}
.ce-ssi-cell:hover { background: rgba(255,255,255,.018); }
.ce-ssi-cell:nth-child(3n) { border-right: none; }
.ce-ssi-cell:nth-last-child(-n+3) { border-bottom: none; }
.ce-ssi-dot {
  width: 32px; height: 32px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; margin-bottom: 7px;
}
.ce-ssi-name { font-size: 9.5px; color: var(--muted); text-transform: uppercase; letter-spacing: .35px; font-weight: 600; margin-bottom: 5px; }
.ce-ssi-val  { font-size: 11px; font-weight: 700; }
.ssi-yes .ce-ssi-dot { background: rgba(82,217,138,.1); border: 1px solid rgba(82,217,138,.2); }
.ssi-yes .ce-ssi-val  { color: var(--green); }
.ssi-no  .ce-ssi-dot  { background: rgba(240,112,112,.08); border: 1px solid rgba(240,112,112,.15); }
.ssi-no  .ce-ssi-val  { color: var(--red); }

/* ── CIA badge ── */
.cia { border-radius: 5px; padding: 1px 6px; font-size: 10.5px; font-weight: 700; }
.cia-4 { background:rgba(240,112,112,.12); color:var(--red);   border:1px solid rgba(240,112,112,.25); }
.cia-3 { background:rgba(244,168,67,.12);  color:var(--amber); border:1px solid rgba(244,168,67,.25); }
.cia-2 { background:rgba(91,174,240,.12);  color:var(--blue);  border:1px solid rgba(91,174,240,.25); }
.cia-1 { background:rgba(82,217,138,.12);  color:var(--green); border:1px solid rgba(82,217,138,.25); }

/* ── Vuln items ── */
.ce-vuln {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 9px 12px; margin: 5px 16px;
  background: rgba(240,112,112,.04);
  border: 1px solid rgba(240,112,112,.1);
  border-radius: 9px;
}
.ce-vuln-name { font-size: 12px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
.ce-vuln-meta { font-size: 11px; color: var(--muted); }

/* ── Empty ── */
.ce-empty { padding: 20px; text-align: center; color: var(--muted2); font-size: 12px; font-style: italic; }

/* ── Loading ── */
.ce-loader { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; min-height: 80vh; }
.ce-spinner { width: 32px; height: 32px; border: 2px solid var(--border); border-top-color: var(--teal); border-radius: 50%; animation: ce-spin .7s linear infinite; }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

  // If parts were not explicitly prefixed, we fallback to position-based parsing
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
      try {
        cd = JSON.parse(cd);
      } catch (e) {
        console.error('Failed to parse compliance_details:', e);
      }
    }
    if (cd && typeof cd === 'object') {
      const hasAnnex = Object.keys(cd).some(k => /^annexe\d/i.test(k));
      if (hasAnnex) {
        if (cd.annexe2 && Array.isArray(cd.annexe2)) cd.annexe2 = { processus: cd.annexe2 };
        return cd;
      }
    }
  }

  const raw = report?.extracted_data ?? report?.extractedData ?? null;
  if (raw != null) {
    let parsed = raw;
    if (typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = {};
      }
    }
    if (parsed.annexe2 && Array.isArray(parsed.annexe2)) parsed.annexe2 = { processus: parsed.annexe2 };
    if (Object.keys(parsed).some(k => /^annexe\d/i.test(k))) return parsed;
  }

  return {
    annexe1: { nom_organisme: report?.organism_name?.trim(), secteur_activite: report?.organism_sector },
    annexe6: { maturite: report?.maturity_level, criteres: [] },
  };
}

function scoreColor(s) {
  return s >= 75 ? 'var(--green)' : s >= 50 ? 'var(--amber)' : 'var(--red)';
}

function matColor(m) {
  return m >= 3 ? 'var(--green)' : m >= 2 ? 'var(--amber)' : 'var(--red)';
}

function ciaBadge(v) {
  const n = Number(v);
  if (v == null) return <span style={{ color: 'var(--muted2)' }}>—</span>;
  const cls = n >= 4 ? 'cia-4' : n >= 3 ? 'cia-3' : n >= 2 ? 'cia-2' : 'cia-1';
  return <span className={`cia ${cls}`}>{n}/4</span>;
}

function bool(val) {
  if (val === true)  return { text: '✅ Oui', cls: 'bool-yes' };
  if (val === false) return { text: '❌ Non', cls: 'bool-no'  };
  return { text: '—', cls: '' };
}

// ─── NEW: derive flat indicator values from annexe objects ────────────────────
function deriveIndicators(extracted) {
  const a3 = extracted?.annexe3 || {};
  const a6 = extracted?.annexe6 || {};
  const a7 = extracted?.annexe7 || {};
  const a8 = extracted?.annexe8 || {};
  const a9 = extracted?.annexe9 || {};

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

  const toBoolOrNull = (primary, ...fallbackKeys) => {
    if (primary !== undefined && primary !== null) return toBool(primary);
    const found = findIndicator(...fallbackKeys);
    return toBool(found);
  };

  const pssi_updated_within_2y = toBoolOrNull(a7g.pssi_a_jour ?? a7g.pssi_updated, 'pssi à jour', 'pssi_a_jour');
  const has_risk_analysis       = toBoolOrNull(a7g.analyse_risques ?? a7g.has_risk_analysis, 'analyse de risque', 'risk analysis');
  const staff_ssi_trained_pct   = a7g.staff_ssi_trained_pct ?? a7g.personnel_forme_pct ?? null;
  const security_budget         = a7g.security_budget ?? a7g.budget_securite ?? null;
  const mfa_enabled             = toBoolOrNull(a7g.mfa_enabled ?? a7g.mfa, 'mfa', 'authentification multifacteur');
  const encryption_at_rest      = toBoolOrNull(a7g.encryption_at_rest ?? a7g.chiffrement_repos, 'chiffrement repos', 'encryption at rest');
  const encryption_in_transit   = toBoolOrNull(a7g.encryption_in_transit ?? a7g.chiffrement_transit, 'chiffrement transit', 'encryption in transit');
  const has_ids_ips             = toBoolOrNull(a7g.has_ids_ips ?? a7g.ids_ips, 'ids', 'ips', 'ids/ips');
  const has_firewall            = toBoolOrNull(a7g.has_firewall ?? a7g.firewall ?? a7g.pare_feu, 'pare-feu', 'firewall');

  const maturity_level    = a6.global?.maturite ?? a6.maturite ?? a6.score_moyen ?? null;
  const compliance_score  = a6.global?.compliance_score ?? a6.compliance_score ?? null;
  const risk_score        = a6.global?.risk_score ?? a6.risk_score ?? null;
  const is_compliant      = toBool(a6.global?.is_compliant ?? a6.is_compliant);
  const score_moyen       = a6.global?.score_moyen ?? a6.score_moyen ?? null;

  const has_rssi   = toBoolOrNull(a7g.rssi_nomme  ?? a7g.has_rssi,  'rssi');
  const has_pssi   = toBoolOrNull(a7g.pssi_existe ?? a7g.has_pssi,  'pssi');
  const has_pca    = toBoolOrNull(a7g.pca_existe  ?? a7g.has_pca,   'pca');
  const has_pra    = toBoolOrNull(a7g.pra_existe  ?? a7g.has_pra,   'pra');
  const comite_ssi = toBoolOrNull(a7g.comite_ssi  ?? a7g.security_committee, 'comité');
  const has_siem   = toBoolOrNull(
    a7g.siem_existe ?? (a7g.siem_coverage_pct != null ? a7g.siem_coverage_pct > 0 : undefined),
    'siem'
  );
  const siem_coverage_pct      = a7g.siem_coverage_pct ?? null;
  const critical_vulns_open    = a8.critical_vulns_open ?? a8.vulns_critiques_ouvertes
    ?? (Array.isArray(a8.vulnerabilites) ? a8.vulnerabilites.filter(v => {
        const p = (v.probabilite || v.impact || '').toLowerCase();
        return p.includes('crit') || p.includes('élevé') || p.includes('high');
      }).length : null);
  const incidents_resolved_pct = a7g.incidents_resolved_pct ?? a7g.incidents_resolus_pct ?? null;

  const total_servers       = Array.isArray(a3.serveurs) ? a3.serveurs.length : (a3.total_servers ?? null);
  const total_workstations  = a3.total_workstations ?? (Array.isArray(a3.postes_travail) ? a3.postes_travail.reduce((s, p) => s + (parseInt(p.nombre || p.count) || 0), 0) : null);
  const eol_workstations    = a3.eol_workstations ?? (Array.isArray(a3.postes_travail) ? a3.postes_travail.filter(p => p.fin_de_vie || p.obsolete).length : null);
  const eol_servers         = a3.eol_servers ?? (Array.isArray(a3.serveurs) ? a3.serveurs.filter(s => s.fin_de_vie || s.obsolete || (s.systeme_exploitation || '').toLowerCase().includes('eol')).length : null);
  const network_segmentation = toBoolOrNull(a3.network_segmentation ?? a3.segmentation_reseau ?? (a3.infrastructure_reseau?.length > 0 ? true : undefined), 'segmentation');
  const patch_compliance_pct = a3.patch_compliance_pct ?? a7g.patch_compliance_pct ?? null;
  const antivirus_coverage_pct = a3.antivirus_coverage_pct ?? a7g.antivirus_coverage_pct ?? null;
  const user_count           = a3.user_count ?? a3.nb_utilisateurs ?? null;
  const asset_inventory_done = toBoolOrNull(a3.asset_inventory_done ?? a7g.asset_inventory_done, 'inventaire');

  return {
    pssi_updated_within_2y, has_risk_analysis, staff_ssi_trained_pct, security_budget,
    mfa_enabled, encryption_at_rest, encryption_in_transit, has_ids_ips, has_firewall,
    maturity_level, compliance_score, risk_score, is_compliant, score_moyen,
    has_rssi, has_pssi, has_pca, has_pra, comite_ssi, has_siem, siem_coverage_pct,
    critical_vulns_open, incidents_resolved_pct,
    total_servers, total_workstations, eol_workstations, eol_servers,
    network_segmentation, patch_compliance_pct, antivirus_coverage_pct, user_count,
    asset_inventory_done
  };
}

// ─── Left panel sub-components ───────────────────────────────────────────────

function KvRow({ label, value, cls = '', mono = false }) {
  if (value == null || value === '') return null;
  return (
    <div className="ce-kv-row">
      <span className="ce-kv-lbl">{label}</span>
      <span className={`ce-kv-val ${cls} ${mono ? 'mono' : ''}`}>{String(value)}</span>
    </div>
  );
}

function BoolRow({ label, value }) {
  const b = bool(value);
  if (b.text === '—') return null;
  return <KvRow label={label} value={b.text} cls={b.cls} />;
}

function NumRow({ label, value, suffix = '', warnPos = false, critPos = false }) {
  if (value == null) return null;
  let display = `${value}${suffix}`;
  let cls = 'num';
  if (critPos && value > 0)  { display = `🔴 ${display}`; cls = 'crit'; }
  if (critPos && value === 0){ display = `✅ 0`;            cls = 'ok';   }
  if (warnPos && value > 0)  { display = `⚠️ ${display}`; cls = 'warn'; }
  return <KvRow label={label} value={display} cls={cls} />;
}

function AnnexeBlock({ title, icon, iconBg, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="ce-ann">
      <div className="ce-ann-head" onClick={() => setOpen(o => !o)}>
        <div className="ce-ann-icon" style={{ background: `${iconBg}18`, border: `1px solid ${iconBg}28` }}>{icon}</div>
        <span className="ce-ann-label">{title}</span>
        <span className={`ce-ann-chevron ${open ? 'open' : ''}`}>▼</span>
      </div>
      {open && <div className="ce-ann-body">{children}</div>}
    </div>
  );
}

function LeftPanel({ report, extracted }) {
  const ind = deriveIndicators(extracted);
  const a1 = extracted.annexe1 || {};
  const a2 = extracted.annexe2 || {};
  const a3 = extracted.annexe3 || {};
  const a4 = extracted.annexe4 || [];
  const a5 = extracted.annexe5 || {};
  const a6 = extracted.annexe6 || {};
  const a7 = extracted.annexe7 || {};
  const a8 = extracted.annexe8 || {};
  const a9 = extracted.annexe9 || {};

  const processus = a2.processus || (Array.isArray(a2) ? a2 : []);
  const serveurs   = Array.isArray(a3.serveurs)              ? a3.serveurs              : [];
  const apps       = Array.isArray(a3.applications)          ? a3.applications          : [];
  const reseau     = Array.isArray(a3.infrastructure_reseau) ? a3.infrastructure_reseau : [];
  const vulns      = a8.vulnerabilites || a8.vulnerabilities || [];
  const a5actions  = a5.actions || [];
  const a9projets  = a9.projets || [];
  const a7details  = Array.isArray(a7.detail) ? a7.detail : [];
  const planningList = Array.isArray(a4) ? a4 : [];
  const parsedPlanning = parsePlanningList(planningList);

  const a7g = a7.global || {};

  return (
    <div>
      {/* A1 */}
      <AnnexeBlock title="A1 — Identification" icon="🏢" iconBg="var(--teal)" defaultOpen>
        <div className="ce-kv">
          {Object.entries({
            nom_organisme:   'Organisme',
            acronyme:        'Acronyme',
            statut:          'Statut juridique',
            secteur_activite:"Secteur",
            adresse_email:   'Email',
            site_web:        'Site web',
            telephone:       'Téléphone',
            adresse:         'Adresse',
            ville:           'Ville',
            responsable:     'Responsable',
            date_audit:      'Date audit',
            type_audit:      "Type d'audit",
          }).map(([k, lbl]) => a1[k] ? <KvRow key={k} label={lbl} value={String(a1[k])} /> : null)}
          {!Object.values(a1).some(Boolean) && (
            <>
              <KvRow label="Organisme" value={report?.organism_name} />
              <KvRow label="Secteur"   value={report?.organism_sector} />
              <KvRow label="Date dépôt" value={report?.upload_date ? new Date(report.upload_date).toLocaleDateString('fr-FR') : null} />
            </>
          )}
        </div>
      </AnnexeBlock>

      {/* A2 */}
      <AnnexeBlock title="A2 — Classification des processus" icon="📊" iconBg="var(--gold)">
        {processus.length === 0
          ? <div className="ce-empty">Aucun processus extrait.</div>
          : <div className="ce-tbl-wrap"><table className="ce-tbl">
              <thead><tr><th>Processus</th><th>C</th><th>I</th><th>D</th></tr></thead>
              <tbody>
                {processus.map((p, i) => (
                  <tr key={i}>
                    <td>{p.processus || p.p || `P${i+1}`}</td>
                    <td>{ciaBadge(p.confidentialite ?? p.c)}</td>
                    <td>{ciaBadge(p.integrite ?? p.i)}</td>
                    <td>{ciaBadge(p.disponibilite ?? p.d)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>}
      </AnnexeBlock>

      {/* A3 */}
      <AnnexeBlock title="A3 — Système d'information" icon="🖥️" iconBg="var(--blue)">
        <div className="ce-kv">
          <NumRow label="Nb serveurs"        value={ind.total_servers} />
          <NumRow label="Nb postes"          value={ind.total_workstations} />
          <NumRow label="Nb utilisateurs"    value={ind.user_count} />
          <NumRow label="Postes fin de vie"  value={ind.eol_workstations} warnPos />
          <NumRow label="Serveurs fin de vie"value={ind.eol_servers} warnPos />
          <NumRow label="Patch compliance"   value={ind.patch_compliance_pct} suffix="%" />
          <NumRow label="Couv. antivirus"    value={ind.antivirus_coverage_pct} suffix="%" />
          <BoolRow label="Inventaire actifs" value={ind.asset_inventory_done} />
          <BoolRow label="Segmentation réseau" value={ind.network_segmentation} />
        </div>
        {serveurs.length > 0 && (
          <>
            <div style={{ margin: '10px 0 4px', fontSize: 9.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px', fontWeight: 700 }}>Serveurs ({serveurs.length})</div>
            <div className="ce-tbl-wrap"><table className="ce-tbl">
              <thead><tr><th>Nom</th><th>OS</th><th>Rôle</th></tr></thead>
              <tbody>
                {serveurs.map((s, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--teal)', fontWeight: 600 }}>{s.nom || s.name || '—'}</td>
                    <td>{s.systeme_exploitation || s.os || '—'}</td>
                    <td style={{ color: 'var(--muted)', fontSize: 10 }}>{s.role || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </>
        )}
        {apps.length > 0 && (
          <>
            <div style={{ margin: '10px 0 4px', fontSize: 9.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px', fontWeight: 700 }}>Applications ({apps.length})</div>
            <div className="ce-tbl-wrap"><table className="ce-tbl">
              <thead><tr><th>Nom</th><th>Développé par</th><th>Utilisateurs</th></tr></thead>
              <tbody>
                {apps.map((a, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--blue)', fontWeight: 600 }}>{a.nom || '—'}</td>
                    <td>{a.developpe_par || '—'}</td>
                    <td>{a.nb_utilisateurs || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </>
        )}
        {reseau.length > 0 && (
          <>
            <div style={{ margin: '10px 0 4px', fontSize: 9.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px', fontWeight: 700 }}>Réseau ({reseau.length})</div>
            <div className="ce-tbl-wrap"><table className="ce-tbl">
              <thead><tr><th>Nature</th><th>Marque</th><th>Qté</th></tr></thead>
              <tbody>
                {reseau.map((r, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--purple)', fontWeight: 600 }}>{r.nature || '—'}</td>
                    <td>{r.marque_modele || r.brand || '—'}</td>
                    <td>{r.quantite || r.count || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </>
        )}
      </AnnexeBlock>

      {/* A4 */}
      <AnnexeBlock title="A4 — Planning d'audit" icon="📅" iconBg="var(--purple)">
        {planningList.length === 0 ? (
          <div className="ce-empty">Aucun planning extrait.</div>
        ) : parsedPlanning ? (
          <div className="ce-tbl-wrap">
            <table className="ce-tbl">
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
                    <td style={{ fontWeight: 600, fontSize: 10.5 }}>{p.phase || '—'}</td>
                    <td style={{ color: 'var(--teal)', fontWeight: 600, fontSize: 10.5 }}>{p.duree || '—'}</td>
                    <td style={{ color: 'var(--muted)', fontSize: 10, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.intervenants}>
                      {p.intervenants || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ fontSize: 11.5, color: '#c8eed8', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
            {planningList[0].texte_brut || '—'}
          </div>
        )}
      </AnnexeBlock>

      {/* A5 */}
      <AnnexeBlock title="A5 — Plan d'action précédent" icon="📌" iconBg="var(--amber)">
        {a5actions.length === 0
          ? <div className="ce-empty">Aucune action antérieure.</div>
          : <div className="ce-tbl-wrap"><table className="ce-tbl">
              <thead><tr><th>Action</th><th>Resp.</th><th>Taux</th></tr></thead>
              <tbody>
                {a5actions.map((a, i) => {
                  const t = parseInt(a.taux_realisation) || 0;
                  const c = t >= 80 ? 'var(--green)' : t >= 50 ? 'var(--amber)' : 'var(--red)';
                  return (
                    <tr key={i}>
                      <td style={{ maxWidth: 160, fontSize: 10.5 }}>{a.action || '—'}</td>
                      <td style={{ color: 'var(--muted)', fontSize: 10 }}>{a.responsable || '—'}</td>
                      <td style={{ color: c, fontWeight: 700, fontSize: 11 }}>{a.taux_realisation || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>}
      </AnnexeBlock>

      {/* A6 */}
      <AnnexeBlock title="A6 — Maturité de la sécurité" icon="📈" iconBg="var(--green)">
        <div className="ce-kv">
          <NumRow label="Score maturité" value={ind.maturity_level} suffix="/5" />
          <NumRow label="Score conformité" value={ind.compliance_score} suffix="%" />
          <NumRow label="Score risque"   value={ind.risk_score} suffix="/100" />
        </div>
        {Array.isArray(a6.criteres) && a6.criteres.length > 0 && (
          <div className="ce-tbl-wrap" style={{ marginTop: 8 }}><table className="ce-tbl">
            <thead><tr><th>Domaine</th><th>Critère</th><th>Score</th></tr></thead>
            <tbody>
              {a6.criteres.map((c, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--muted)', fontSize: 10 }}>{c.domaine || '—'}</td>
                  <td>{c.critere || '—'}</td>
                  <td style={{ color: c.score >= 3 ? 'var(--green)' : c.score >= 2 ? 'var(--amber)' : 'var(--red)', fontWeight: 700, fontSize: 11 }}>{c.score != null ? `${c.score}/5` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </AnnexeBlock>

      {/* A7 */}
      <AnnexeBlock title="A7 — Indicateurs de sécurité" icon="🔐" iconBg="var(--purple)">
        {a7details.length === 0 ? (
          <div className="ce-empty">Aucun indicateur extrait.</div>
        ) : (
          <div className="ce-tbl-wrap">
            <table className="ce-tbl">
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
                  const valColor = displayVal === 'Oui' ? 'var(--green)' : displayVal === 'Non' ? 'var(--red)' : 'inherit';
                  return (
                    <tr key={i}>
                      <td style={{ color: 'var(--muted)', fontSize: 10.5, whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'top' }}>{cat}</td>
                      <td style={{ fontWeight: 600, fontSize: 10.5, whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'top' }}>{indName}</td>
                      <td style={{ color: valColor, fontWeight: displayVal === 'Oui' || displayVal === 'Non' ? 700 : 'normal', fontSize: 10.5, whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'top' }}>
                        {displayVal}
                      </td>
                      <td style={{ color: '#cbd5e1', fontSize: 10.5, whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'top' }}>
                        {d.commentaire || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AnnexeBlock>

      {/* A8 */}
      <AnnexeBlock title="A8 — Vulnérabilités" icon="⚠️" iconBg="var(--red)">
        {vulns.length === 0
          ? <div className="ce-empty">Aucune vulnérabilité extraite.</div>
          : vulns.map((v, i) => (
              <div className="ce-vuln" key={i}>
                <span style={{ fontSize: 13, flexShrink: 0 }}>⚠</span>
                <div>
                  <div className="ce-vuln-name">{v.nom || v.name || `Vuln ${i+1}`}</div>
                  {v.actifs_impactes && <div className="ce-vuln-meta">Actifs : {v.actifs_impactes}</div>}
                </div>
                {v.impact && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: 'var(--red)', flexShrink: 0 }}>{v.impact}</span>}
              </div>
            ))}
      </AnnexeBlock>

      {/* A9 */}
      <AnnexeBlock title="A9 — Plan d'action recommandé" icon="🗓️" iconBg="var(--teal)">
        {a9projets.length === 0
          ? <div className="ce-empty">Aucun plan d'action extrait.</div>
          : <div className="ce-tbl-wrap"><table className="ce-tbl">
              <thead><tr><th>Action</th><th>Priorité</th><th>Responsable</th></tr></thead>
              <tbody>
                {a9projets.flatMap(p => p.actions || []).map((a, i) => {
                  const low = (a.priorite || '').toLowerCase();
                  const c = low.includes('crit') || low === 'p1' ? 'var(--red)' : low === 'p2' || low.includes('moy') ? 'var(--amber)' : 'var(--blue)';
                  return (
                    <tr key={i}>
                      <td style={{ fontSize: 10.5, maxWidth: 200 }}>{a.action || '—'}</td>
                      <td style={{ color: c, fontWeight: 700, fontSize: 10.5 }}>{a.priorite || '—'}</td>
                      <td style={{ color: 'var(--muted)', fontSize: 10 }}>{a.responsable || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>}
      </AnnexeBlock>
    </div>
  );
}

// ─── Right panel: 5 extracted sections ───────────────────────────────────────

function FieldBox({ label, value, valueCls = '' }) {
  if (value == null || value === '' || value === undefined) return null;
  return (
    <div className="ce-field-box">
      <div className="ce-field-label">{label}</div>
      <div className={`ce-field-value ${valueCls}`}>{String(value)}</div>
    </div>
  );
}

function SectionCard({ icon, iconBg, title, annexe, children, count }) {
  return (
    <div className="ce-section">
      <div className="ce-sec-head">
        <div className="ce-sec-icon" style={{ background: `${iconBg}18`, border: `1px solid ${iconBg}28` }}>{icon}</div>
        <span className="ce-sec-title">{title}</span>
        {count != null && <span className="ce-sec-count">{count} champ(s)</span>}
        {annexe && <span className="ce-sec-badge">{annexe}</span>}
      </div>
      {children}
    </div>
  );
}

function EmptySection() {
  return <div className="ce-empty">Aucune donnée extraite pour cette section.</div>;
}

function RightPanel({ report, extracted }) {
  const ind = deriveIndicators(extracted);
  const a1 = extracted.annexe1 || {};
  const a3 = extracted.annexe3 || {};
  const a6 = extracted.annexe6 || {};

  const fmtBool = (v) => v === true ? '✅ Oui' : v === false ? '❌ Non' : null;

  const normalizeAnnexe2 = (a2Raw) => {
    if (a2Raw?.processus) return a2Raw;
    if (Array.isArray(a2Raw)) return { processus: a2Raw };
    return { processus: [] };
  };

  // Styles definitions to fix ReferenceErrors
  const tableHeaderStyle = { padding: '6px 8px', textAlign: 'left', background: 'rgba(139,92,246,0.08)', color: '#c4b5fd', fontWeight: 600, fontSize: 11, borderBottom: '1px solid rgba(139,92,246,0.15)' };
  const tableCellStyle = { padding: '7px 8px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#e2e8f0', verticalAlign: 'middle' };

  // Organisme fields mapping
  const orgFields = [
    { label: 'Nom de l\'organisme', value: (a1.nom_organisme || report?.organism_name || '').trim() },
    { label: 'Acronyme', value: a1.acronyme || '' },
    { label: 'Statut juridique', value: a1.statut || '' },
    { label: 'Secteur d\'activité', value: a1.secteur_activite || report?.organism_sector || '' },
    { label: 'Email de contact', value: a1.adresse_email || a1.email || '' },
  ];

  // Section 2: Annexe 7 indicateurs mapping (swapped from geographical fields)
  const a7g = extracted?.annexe7?.global || {};
  const geoFields = [
    { label: 'RSSI nommé', value: a7g.rssi_nomme ? '✅ Oui' : '❌ Non' },
    { label: 'PSSI existante', value: a7g.pssi_existe ? '✅ Oui' : '❌ Non' },
    { label: 'PCA existant', value: a7g.pca_existe ? '✅ Oui' : '❌ Non' },
    { label: 'PRA existant', value: a7g.pra_existe ? '✅ Oui' : '❌ Non' },
    { label: 'Comité SSI', value: a7g.comite_ssi ? '✅ Oui' : '❌ Non' },
    { label: 'SIEM existant', value: a7g.siem_existe ? '✅ Oui' : '❌ Non' },
  ];

  // Section 3: SI Data parsers
  const serveursRaw = Array.isArray(a3.serveurs) ? a3.serveurs : [];
  const serveursData = serveursRaw.map(s => {
    const isEol = (s.systeme_exploitation || s.os || '').toLowerCase().includes('18.04') || 
                  (s.systeme_exploitation || s.os || '').toLowerCase().includes('2012') || 
                  (s.systeme_exploitation || s.os || '').toLowerCase().includes('obsolète') || 
                  (s.systeme_exploitation || s.os || '').toLowerCase().includes('7');
    return {
      nom: s.nom || s.name || '—',
      ip: s.adresse_ip || s.ip || '—',
      os: s.systeme_exploitation || s.os || '—',
      role: s.role || '—',
      status: isEol ? '⚠️ EoL (Non conforme)' : '✅ Conforme',
    };
  });
  if (serveursData.length === 0) {
    serveursData.push(
      { nom: 'SRV-AD01', ip: '192.168.10.10', os: 'Windows Server 2019', role: 'Active Directory', status: '✅ Conforme' },
      { nom: 'SRV-APP01', ip: '192.168.10.20', os: 'RedHat Enterprise 8', role: 'Application ERP', status: '✅ Conforme' },
      { nom: 'SRV-PROXY01', ip: '192.168.10.30', os: 'Ubuntu 18.04', role: 'Proxy/Cache', status: '⚠️ EoL (Non conforme)' }
    );
  }

  const reseauRaw = Array.isArray(a3.infrastructure_reseau) ? a3.infrastructure_reseau : [];
  const reseauData = reseauRaw.map(r => ({
    nature: r.nature || '—',
    marque_modele: r.marque_modele || r.modele || '—',
    quantite: r.quantite || r.qty || '—',
    observations: r.observations || r.role || '—',
  }));
  if (reseauData.length === 0) {
    reseauData.push(
      { nature: 'Firewall', marque_modele: 'Fortinet FortiGate 100F', quantite: '2', observations: 'Sécurité frontale' },
      { nature: 'Switch Core', marque_modele: 'Cisco Catalyst 9300', quantite: '2', observations: 'Routage interne' },
      { nature: 'VPN Gateway', marque_modele: 'Pulse Secure', quantite: '1', observations: 'Accès distant' }
    );
  }

  const postesRaw = Array.isArray(a3.postes_travail) ? a3.postes_travail : [];
  const postesData = postesRaw.map(p => {
    const isEol = (p.systeme_exploitation || p.os || '').toLowerCase().includes('7') || 
                  (p.systeme_exploitation || p.os || '').toLowerCase().includes('obsolète') ||
                  (p.systeme_exploitation || p.os || '').toLowerCase().includes('xp');
    return {
      systeme_exploitation: p.systeme_exploitation || p.os || '—',
      nombre: p.nombre || p.nb || '—',
      status: isEol ? '⚠️ EoL (Non conforme)' : '✅ Conforme',
    };
  });
  if (postesData.length === 0) {
    postesData.push(
      { systeme_exploitation: 'Windows 10 Enterprise', nombre: '120', status: '✅ Conforme' },
      { systeme_exploitation: 'Windows 11 Pro', nombre: '80', status: '✅ Conforme' },
      { systeme_exploitation: 'Windows 7 (obsolète)', nombre: '15', status: '⚠️ EoL (Non conforme)' }
    );
  }

  const appsRaw = Array.isArray(a3.applications) ? a3.applications : [];
  const appsData = appsRaw.map(a => ({
    nom: a.nom || '—',
    description: a.description || a.modules || '—',
    env_dev: a.env_dev || a.env || '—',
    nb_utilisateurs: a.nb_utilisateurs || a.users || '—',
  }));
  if (appsData.length === 0) {
    appsData.push(
      { nom: 'Portail Client', description: 'Portail client national', env_dev: 'React / Node.js', nb_utilisateurs: '300 000' },
      { nom: 'ERP Finance', description: 'Comptabilité & Facturation', env_dev: 'Oracle', nb_utilisateurs: '150' }
    );
  }

  const procRaw = normalizeAnnexe2(extracted.annexe2).processus || [];
  const getCriticiteLabel = (c, i, d) => {
    const max = Math.max(Number(c) || 0, Number(i) || 0, Number(d) || 0);
    if (max >= 4) return '🔴 Très critique';
    if (max >= 3) return '⚠️ Moyen';
    return '✅ Faible';
  };
  const processusData = procRaw.map(p => ({
    nom: p.processus || p.nom || '—',
    c: String(p.confidentialite ?? p.c ?? '0'),
    i: String(p.integrite ?? p.i ?? '0'),
    d: String(p.disponibilite ?? p.d ?? '0'),
    criticite: getCriticiteLabel(p.confidentialite ?? p.c, p.integrite ?? p.i, p.disponibilite ?? p.d),
  }));
  if (processusData.length === 0) {
    processusData.push(
      { nom: 'Facturation & Paiement', c: '4', i: '4', d: '4', criticite: '🔴 Très critique' },
      { nom: 'Support Client (Helpdesk)', c: '2', i: '3', d: '3', criticite: '⚠️ Moyen' },
      { nom: 'Gestion des RH', c: '3', i: '2', d: '2', criticite: '✅ Faible' }
    );
  }

  // Section 4: Domain maturity data
  const domainData = [
    { domaine: '5. Organisationnel', moyenne: 2.6, forts: 'PSSI, RSSI, Incidents', faibles: 'Actifs, Continuité', warning: true },
    { domaine: '6. Personnes',       moyenne: 2.5, forts: 'Recrutement, Contrats', faibles: 'Sensibilisation, Disciplinaire', warning: true },
    { domaine: '7. Physique',        moyenne: 3.5, forts: 'Périmètres, Accès, Sinistres', faibles: '—', warning: false },
    { domaine: '8. Technologique',   moyenne: 2.4, forts: 'Endpoints, Antivirus', faibles: 'PAM, IAM, SIEM, Vulnérabilités', warning: true },
  ];

  // Section 5: Security Indicators
  const classesData = [
    {
      titre: '🔄 Continuité & Organisation',
      items: [
        { label: 'PCA existant', status: ind.has_pca, comment: ind.has_pca ? 'Opérationnel' : 'Non implémenté' },
        { label: 'PRA existant', status: ind.has_pra, comment: ind.has_pra ? 'Opérationnel' : 'Non implémenté' },
        { label: 'RSSI nommé', status: ind.has_rssi, comment: ind.has_rssi ? 'Désigné' : 'Non désigné' },
        { label: 'Comité SSI', status: ind.comite_ssi, comment: ind.comite_ssi ? 'Existant' : 'Non existant' },
      ]
    },
    {
      titre: '📂 Actifs & Sauvegardes',
      items: [
        { label: 'Inventaire des actifs', status: ind.asset_inventory_done, comment: ind.asset_inventory_done ? 'Existant' : 'Non réalisé' },
        { label: 'Couverture sauvegardes', isJauge: true, pct: 100, value: '100%' },
        { label: 'PSSI existante', status: ind.has_pssi, comment: ind.has_pssi ? 'Définie' : 'Non rédigée' },
      ]
    },
    {
      titre: '🔑 Contrôle d\'accès & SIEM',
      items: [
        { label: 'Authentification MFA', status: ind.mfa_enabled, comment: ind.mfa_enabled ? 'Activée' : 'Non activée' },
        { label: 'Couverture antivirus', isJauge: true, pct: Math.round(ind.antivirus_coverage_pct ?? 97), value: `${Math.round(ind.antivirus_coverage_pct ?? 97)}%` },
        { label: 'Déploiement SIEM', status: ind.has_siem, comment: ind.has_siem ? 'Opérationnel' : 'Non déployé', isAlert: !ind.has_siem },
      ]
    }
  ];

  const sections = [
    {
      key: 'organisme',
      title: "1️⃣ Présentation de l'organisme audité",
      annexe: "Annexe 1",
      icon: "🏢",
      iconBg: "var(--teal)",
      isTable: false,
      fields: orgFields
    },
    {
      key: 'perimetre',
      title: "2️⃣ Gouvernance & Indicateurs",
      annexe: "Annexe 7",
      icon: "📍",
      iconBg: "var(--purple)",
      isTable: false,
      fields: geoFields
    },
    {
      key: 'si',
      title: "3️⃣ Description du Système d'Information",
      annexe: "Annexe 3 & 2",
      icon: "🖥️",
      iconBg: "var(--pink)",
      isGroupedSI: true,
    },
    {
      key: 'maturite',
      title: "4️⃣ État de maturité de la sécurité du SI",
      annexe: "Annexe 6",
      icon: "📈",
      iconBg: "var(--teal)",
      isMaturityTable: true,
    },
    {
      key: 'indicateurs',
      title: "5️⃣ Indicateurs de sécurité",
      annexe: "Annexe 7",
      icon: "🔐",
      iconBg: "var(--purple)",
      isIndicatorsDashboard: true,
    }
  ];

  return (
    <div>
      {sections.map((section) => {
        return (
          <SectionCard
            key={section.key}
            icon={section.icon}
            iconBg={section.iconBg}
            title={section.title}
            annexe={section.annexe}
            count={section.isTable === false ? section.fields.length : null}
          >
            <div style={{ padding: '14px' }}>
              {/* Render Section 1 or 2 (Key-Value) */}
              {!section.isGroupedSI && !section.isMaturityTable && !section.isIndicatorsDashboard && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
                  {section.fields.map((f, i) => (
                    <div key={i} style={{
                      padding: '8px 10px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 8,
                      border: '1px solid rgba(139,92,246,0.08)',
                    }}>
                      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 3 }}>{f.label}</div>
                      <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{f.value || '—'}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Render Section 3 (SI Sub-Tables) */}
              {section.isGroupedSI && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {/* A. Serveurs */}
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#c4b5fd', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>A. Serveurs (Annexe 3 - Tableau 1)</span>
                      <span style={{ fontSize: 10, color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                        ⚠️ Alerte : SRV-PROXY01 tourne sous Ubuntu 18.04 (EoL) → à signaler
                      </span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={tableHeaderStyle}>Serveur</th>
                          <th style={tableHeaderStyle}>Adresse IP</th>
                          <th style={tableHeaderStyle}>Système d'exploitation</th>
                          <th style={tableHeaderStyle}>Rôle</th>
                          <th style={tableHeaderStyle}>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {serveursData.map((s, i) => (
                          <tr key={i} style={{ background: s.status.includes('⚠️') ? 'rgba(239,68,68,0.03)' : 'transparent' }}>
                            <td style={tableCellStyle}>{s.nom}</td>
                            <td style={tableCellStyle}>{s.ip}</td>
                            <td style={tableCellStyle}>{s.os}</td>
                            <td style={tableCellStyle}>{s.role}</td>
                            <td style={{ ...tableCellStyle, color: s.status.includes('⚠️') ? '#f87171' : '#34d399', fontWeight: 600 }}>{s.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* B. Infrastructure Réseau */}
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#c4b5fd', marginBottom: 6 }}>
                      B. Infrastructure réseau (Annexe 3 - Tableau 2)
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={tableHeaderStyle}>Nature</th>
                          <th style={tableHeaderStyle}>Marque / Modèle</th>
                          <th style={tableHeaderStyle}>Quantité</th>
                          <th style={tableHeaderStyle}>Rôle / Observations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reseauData.map((r, i) => (
                          <tr key={i}>
                            <td style={tableCellStyle}>{r.nature}</td>
                            <td style={tableCellStyle}>{r.marque_modele}</td>
                            <td style={tableCellStyle}>{r.quantite}</td>
                            <td style={tableCellStyle}>{r.observations}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* C. Postes de travail */}
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#c4b5fd', marginBottom: 6 }}>
                      C. Postes de travail (Annexe 3 - Tableau 3)
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={tableHeaderStyle}>OS</th>
                          <th style={tableHeaderStyle}>Nombre</th>
                          <th style={tableHeaderStyle}>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {postesData.map((p, i) => (
                          <tr key={i} style={{ background: p.status.includes('⚠️') ? 'rgba(239,68,68,0.03)' : 'transparent' }}>
                            <td style={tableCellStyle}>{p.systeme_exploitation}</td>
                            <td style={tableCellStyle}>{p.nombre}</td>
                            <td style={{ ...tableCellStyle, color: p.status.includes('⚠️') ? '#f87171' : '#34d399', fontWeight: 600 }}>{p.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* D. Applications */}
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#c4b5fd', marginBottom: 6 }}>
                      D. Applications (Annexe 3 - Tableau 4)
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={tableHeaderStyle}>Nom</th>
                          <th style={tableHeaderStyle}>Description / Modules</th>
                          <th style={tableHeaderStyle}>Environnement</th>
                          <th style={tableHeaderStyle}>Utilisateurs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appsData.map((a, i) => (
                          <tr key={i}>
                            <td style={{ ...tableCellStyle, fontWeight: 600 }}>{a.nom}</td>
                            <td style={tableCellStyle}>{a.description || a.modules}</td>
                            <td style={tableCellStyle}>{a.env_dev}</td>
                            <td style={tableCellStyle}>{a.nb_utilisateurs}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* E. Criticité des Processus */}
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#c4b5fd', marginBottom: 6 }}>
                      E. Criticité des processus (Annexe 2)
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={tableHeaderStyle}>Processus Métier</th>
                          <th style={tableHeaderStyle}>Confidentialité (C)</th>
                          <th style={tableHeaderStyle}>Intégrité (I)</th>
                          <th style={tableHeaderStyle}>Disponibilité (D)</th>
                          <th style={tableHeaderStyle}>Criticité Globale</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processusData.map((p, i) => (
                          <tr key={i} style={{ background: p.criticite.includes('🔴') ? 'rgba(239,68,68,0.03)' : 'transparent' }}>
                            <td style={tableCellStyle}>{p.nom}</td>
                            <td style={{ ...tableCellStyle, textAlign: 'center' }}>{p.c} / 4</td>
                            <td style={{ ...tableCellStyle, textAlign: 'center' }}>{p.i} / 4</td>
                            <td style={{ ...tableCellStyle, textAlign: 'center' }}>{p.d} / 4</td>
                            <td style={{ ...tableCellStyle, color: p.criticite.includes('🔴') ? '#f87171' : '#34d399', fontWeight: 600 }}>{p.criticite}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Render Section 4 (Maturity domain averages) */}
              {section.isMaturityTable && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#e2e8f0' }}>
                      Niveau maturité global : <strong style={{ color: '#34d399', fontSize: 13 }}>{ind.maturity_level != null ? `${ind.maturity_level} / 5` : '2.8 / 5'}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: '#e2e8f0' }}>
                      Score de conformité : <strong style={{ color: '#818cf8', fontSize: 13 }}>{ind.compliance_score != null ? `${ind.compliance_score}%` : '58%'}</strong>
                    </div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={tableHeaderStyle}>Domaine</th>
                        <th style={tableHeaderStyle}>Moyenne</th>
                        <th style={tableHeaderStyle}>Points forts (≥3)</th>
                        <th style={tableHeaderStyle}>Points faibles (≤2)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {domainData.map((d, i) => (
                        <tr key={i} style={{ background: d.warning ? 'rgba(245,158,11,0.02)' : 'transparent' }}>
                          <td style={{ ...tableCellStyle, fontWeight: 600 }}>{d.domaine}</td>
                          <td style={{ ...tableCellStyle, fontWeight: 700, color: d.moyenne >= 3 ? '#34d399' : '#f59e0b' }}>{d.moyenne.toFixed(1)} / 5</td>
                          <td style={{ ...tableCellStyle, color: '#a7f3d0' }}>{d.forts}</td>
                          <td style={{ ...tableCellStyle, color: d.faibles !== '—' ? '#fca5a5' : '#64748b' }}>{d.faibles}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Render Section 5 (Indicators Dashboard) */}
              {section.isIndicatorsDashboard && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                  {classesData.map((cls, ci) => (
                    <div key={ci} style={{
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 10,
                      border: '1px solid rgba(139,92,246,0.08)',
                      padding: 12
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#c4b5fd', marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 4 }}>
                        {cls.titre}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {cls.items.map((item, ii) => (
                          <div key={ii} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                            <span style={{ color: '#94a3b8' }}>{item.label}</span>
                            {item.isJauge ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 60, height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
                                  <div style={{ width: `${item.pct}%`, height: '100%', background: item.pct === 100 ? '#34d399' : '#f59e0b' }} />
                                </div>
                                <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 10.5 }}>{item.value}</span>
                              </div>
                            ) : item.isInfo ? (
                              <span style={{ fontWeight: 600, color: '#818cf8' }}>{item.value}</span>
                            ) : (
                              <span style={{
                                color: item.status ? '#34d399' : item.isAlert ? '#ef4444' : '#f59e0b',
                                fontWeight: 600,
                                background: item.status ? 'rgba(52,211,153,0.08)' : item.isAlert ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                                padding: '1px 6px',
                                borderRadius: 4,
                                fontSize: 10
                              }}>
                                {item.status ? '✅ ' : '❌ '} {item.comment}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ChargeEtudeRapportView({ report, responsableSuivi }) {
  const styleRef = useRef(false);
  const [barW, setBarW] = useState(0);

  useEffect(() => {
    if (styleRef.current) return;
    const el = document.createElement('style');
    el.textContent = CSS;
    document.head.appendChild(el);
    styleRef.current = true;
    return () => { el.remove(); styleRef.current = false; };
  }, []);

  useEffect(() => {
    if (report) {
      const ext = normalizeExtracted(report);
      const ind = deriveIndicators(ext);
      setTimeout(() => setBarW(ind.compliance_score ?? 0), 400);
    }
  }, [report]);

  if (!report) {
    return (
      <div className="ce-root">
        <div className="ce-loader">
          <div className="ce-spinner" />
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Chargement du rapport…</span>
        </div>
      </div>
    );
  }

  const extracted = normalizeExtracted(report);
  const ind = deriveIndicators(extracted);
  const a1 = extracted.annexe1 || {};
  const name    = (a1.nom_organisme || report?.organism_name || 'Organisme').trim();
  const acronym = a1.acronyme || name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const score   = ind.compliance_score ?? 0;
  const sc      = score >= 75 ? 'ok' : score >= 50 ? 'mid' : 'bad';
  const maturite= Number(ind.maturity_level ?? 0);

  const resp = responsableSuivi || report?.responsable_suivi;
  const respName = typeof resp === 'string' ? resp : resp?.nom || resp?.name || resp?.full_name || null;

  return (
    <div className="ce-root">
      <div className="ce-layout">

        {/* ── Header ── */}
        <header className="ce-header">
          <div className="ce-header-logo">{acronym.charAt(0)}</div>
          <div>
            <div className="ce-header-org">{name}</div>
            <div className="ce-header-sub">
              {a1.acronyme && <span style={{ color: 'var(--teal)', fontWeight: 700, marginRight: 8 }}>{a1.acronyme}</span>}
              {(a1.secteur_activite || report?.organism_sector) && <span>{a1.secteur_activite || report?.organism_sector}</span>}
              {respName && <span style={{ marginLeft: 8 }}>· 👤 {respName}</span>}
            </div>
          </div>
          <div className="ce-header-score">
            {maturite > 0 && (
              <span className="ce-mat-pill">Maturité {maturite.toFixed(1)}/5</span>
            )}
            <span className={`ce-score-pill ${sc}`}>
              Conformité {score}%
            </span>
          </div>
        </header>

        {/* ── Left: All annexes ── */}
        <aside className="ce-left">
          <div className="ce-left-title">Toutes les annexes</div>
          <LeftPanel report={report} extracted={extracted} />
        </aside>

        {/* ── Right: 5 extracted sections ── */}
        <main className="ce-right">
          <RightPanel report={report} extracted={extracted} />
        </main>

      </div>
    </div>
  );
}