// components/Module_ChargeEtude/ChargeEtudeRapportView.jsx
//
// Affiche les données extraites du rapport pour le chargé d'étude,
// après affectation du responsable de suivi.
// Vue lecture seule — organisée par annexes, avec synthèse et timeline.

import { useState, useEffect, useRef } from 'react';

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;1,9..144,300&family=DM+Sans:wght@300;400;500;600&display=swap');

@keyframes ce-fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
@keyframes ce-pulse    { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:.9;transform:scale(1.08)} }
@keyframes ce-shimmer  { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes ce-spin     { to{transform:rotate(360deg)} }
@keyframes ce-bar      { from{width:0} }
@keyframes ce-tick     { 0%{stroke-dashoffset:40} 100%{stroke-dashoffset:0} }

:root {
  --ce-bg:       #060d16;
  --ce-surface:  #0b1623;
  --ce-card:     rgba(255,255,255,.028);
  --ce-border:   rgba(255,255,255,.065);
  --ce-border2:  rgba(255,255,255,.04);
  --ce-text:     #c9dff5;
  --ce-muted:    #3a5570;
  --ce-teal:     #4ecdc4;
  --ce-gold:     #e8c97a;
  --ce-green:    #56d986;
  --ce-red:      #f07070;
  --ce-blue:     #5badf0;
  --ce-purple:   #9b8cf5;
  --ce-amber:    #f4a843;
}

.ce-root {
  font-family: 'DM Sans', sans-serif;
  background: var(--ce-bg);
  color: var(--ce-text);
  min-height: 100vh;
  padding: 28px 20px 60px;
}
.ce-root * { box-sizing: border-box; margin: 0; padding: 0; }

.ce-wrap { max-width: 1060px; margin: 0 auto; }

/* Anim stagger */
.ce-s1{animation:ce-fadeUp .45s .04s both}
.ce-s2{animation:ce-fadeUp .45s .10s both}
.ce-s3{animation:ce-fadeUp .45s .16s both}
.ce-s4{animation:ce-fadeUp .45s .22s both}
.ce-s5{animation:ce-fadeUp .45s .28s both}
.ce-s6{animation:ce-fadeUp .45s .34s both}
.ce-s7{animation:ce-fadeUp .45s .40s both}
.ce-s8{animation:ce-fadeUp .45s .46s both}
.ce-s9{animation:ce-fadeUp .45s .52s both}

/* ─ Hero banner ─ */
.ce-hero {
  position: relative; overflow: hidden;
  background: linear-gradient(135deg, #0b1e35 0%, #0e2540 50%, #091829 100%);
  border: 1px solid rgba(78,205,196,.15);
  border-radius: 20px;
  padding: 26px 30px;
  margin-bottom: 18px;
  display: flex; align-items: flex-start; gap: 20px;
}
.ce-hero-deco {
  position: absolute; border-radius: 50%;
  border: 1px solid rgba(78,205,196,.08);
  animation: ce-spin linear infinite;
}
.ce-hero-avatar {
  width: 58px; height: 58px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #0d5580, #1a7a6e);
  border: 2px solid rgba(78,205,196,.3);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Fraunces', serif;
  font-size: 22px; font-weight: 700; color: #fff;
  box-shadow: 0 0 0 4px rgba(78,205,196,.08), 0 6px 20px rgba(0,0,0,.4);
  position: relative; z-index: 1;
}
.ce-hero-body { flex: 1; position: relative; z-index: 1; }
.ce-hero-title {
  font-family: 'Fraunces', serif;
  font-size: 20px; font-weight: 700; color: #e4f3ff;
  margin-bottom: 6px; line-height: 1.2;
}
.ce-hero-sub { font-size: 12px; color: var(--ce-muted); display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.ce-hero-sub span { display: flex; align-items: center; gap: 4px; }
.ce-hero-score {
  position: relative; z-index: 1; flex-shrink: 0; text-align: right;
}
.ce-score-ring {
  display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
  width: 72px; height: 72px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,.08);
  background: rgba(0,0,0,.25); position: relative;
}
.ce-score-ring svg { position: absolute; inset: -3px; }
.ce-score-val { font-family:'IBM Plex Mono',monospace; font-size: 18px; font-weight: 600; }
.ce-score-lbl { font-size: 9px; color: var(--ce-muted); text-transform: uppercase; letter-spacing: .5px; }

/* ─ Responsable card ─ */
.ce-resp-card {
  background: linear-gradient(135deg, rgba(78,205,196,.06), rgba(91,173,240,.04));
  border: 1px solid rgba(78,205,196,.18);
  border-radius: 14px;
  padding: 14px 18px;
  margin-bottom: 18px;
  display: flex; align-items: center; gap: 16px;
}
.ce-resp-icon {
  width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
  background: rgba(78,205,196,.12);
  border: 1px solid rgba(78,205,196,.25);
  display: flex; align-items: center; justify-content: center; font-size: 16px;
}
.ce-resp-label { font-size: 10px; color: var(--ce-muted); text-transform: uppercase; letter-spacing: .5px; font-weight: 600; margin-bottom: 3px; }
.ce-resp-name  { font-size: 14px; font-weight: 600; color: var(--ce-teal); }
.ce-resp-meta  { font-size: 11px; color: var(--ce-muted); margin-top: 2px; }
.ce-resp-badge {
  margin-left: auto; display: flex; align-items: center; gap: 6px;
  padding: 5px 12px; border-radius: 99px;
  background: rgba(86,217,134,.1); border: 1px solid rgba(86,217,134,.25);
  font-size: 11px; font-weight: 700; color: var(--ce-green);
}
.ce-resp-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--ce-green); animation: ce-pulse 2s ease-in-out infinite; }

/* ─ Stat bar ─ */
.ce-stat-row {
  display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 18px;
}
.ce-stat-box {
  background: var(--ce-card);
  border: 1px solid var(--ce-border);
  border-radius: 14px; padding: 14px 16px;
  position: relative; overflow: hidden;
  transition: transform .2s, border-color .2s;
}
.ce-stat-box:hover { transform: translateY(-3px); border-color: rgba(78,205,196,.25); }
.ce-stat-box-glow {
  position: absolute; top: -12px; right: -12px; width: 48px; height: 48px;
  border-radius: 50%; opacity: .15; filter: blur(12px);
  animation: ce-pulse 3.5s ease-in-out infinite;
}
.ce-stat-icon { font-size: 16px; margin-bottom: 8px; }
.ce-stat-val  { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 700; line-height: 1; margin-bottom: 4px; }
.ce-stat-lbl  { font-size: 10px; color: var(--ce-muted); text-transform: uppercase; letter-spacing: .4px; font-weight: 600; }

/* ─ Main grid ─ */
.ce-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
@media (max-width: 720px) { .ce-grid { grid-template-columns: 1fr; } .ce-stat-row { grid-template-columns: 1fr 1fr; } }

/* ─ Section card ─ */
.ce-card {
  background: var(--ce-card);
  border: 1px solid var(--ce-border);
  border-radius: 16px; overflow: hidden;
  transition: border-color .2s;
}
.ce-card:hover { border-color: rgba(255,255,255,.1); }
.ce-card-full { grid-column: 1 / -1; }

.ce-card-head {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--ce-border2);
  background: rgba(0,0,0,.15);
}
.ce-card-head-icon {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; font-size: 12px;
  border: 1px solid transparent;
}
.ce-card-head-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 10px; font-weight: 600; color: #7a9ab5;
  text-transform: uppercase; letter-spacing: .6px;
}
.ce-card-head-badge {
  margin-left: auto; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 700;
}

/* ─ KV rows ─ */
.ce-kv-item {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 9px 16px;
  border-bottom: 1px solid var(--ce-border2);
  transition: background .15s;
}
.ce-kv-item:hover { background: rgba(255,255,255,.02); }
.ce-kv-item:last-child { border-bottom: none; }
.ce-kv-label { font-size: 11px; color: var(--ce-muted); text-transform: uppercase; letter-spacing: .4px; font-weight: 600; padding-top: 1px; }
.ce-kv-value { font-size: 12px; font-weight: 600; color: var(--ce-text); text-align: right; max-width: 60%; word-break: break-word; }
.ce-kv-value.mono { font-family: 'IBM Plex Mono', monospace; font-size: 11px; }

/* ─ Tables ─ */
.ce-table-wrap { overflow-x: auto; }
.ce-table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
.ce-table th {
  padding: 7px 14px; text-align: left;
  color: var(--ce-muted); font-weight: 700; font-size: 10px;
  text-transform: uppercase; letter-spacing: .4px;
  border-bottom: 1px solid var(--ce-border2);
  background: rgba(0,0,0,.1);
}
.ce-table td { padding: 8px 14px; border-bottom: 1px solid var(--ce-border2); color: var(--ce-text); }
.ce-table tr:last-child td { border-bottom: none; }
.ce-table tr:hover td { background: rgba(255,255,255,.02); }

/* ─ Badge ─ */
.ce-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 700; }
.ce-badge-dot { width: 5px; height: 5px; border-radius: 50%; }
.ce-ok   { background: rgba(86,217,134,.1);  color: var(--ce-green);  border: 1px solid rgba(86,217,134,.25); }
.ce-mid  { background: rgba(244,168,67,.1);  color: var(--ce-amber);  border: 1px solid rgba(244,168,67,.25); }
.ce-err  { background: rgba(240,112,112,.1); color: var(--ce-red);    border: 1px solid rgba(240,112,112,.25); }
.ce-info { background: rgba(91,173,240,.1);  color: var(--ce-blue);   border: 1px solid rgba(91,173,240,.25);  }
.ce-pur  { background: rgba(155,140,245,.1); color: var(--ce-purple); border: 1px solid rgba(155,140,245,.25); }

/* ─ CIA badge ─ */
.cia-4 { background:rgba(240,112,112,.12); color:var(--ce-red);    border:1px solid rgba(240,112,112,.3); border-radius:6px; padding:1px 7px; font-size:11px; font-weight:700; }
.cia-3 { background:rgba(244,168,67,.12);  color:var(--ce-amber);  border:1px solid rgba(244,168,67,.3);  border-radius:6px; padding:1px 7px; font-size:11px; font-weight:700; }
.cia-2 { background:rgba(91,173,240,.12);  color:var(--ce-blue);   border:1px solid rgba(91,173,240,.3);  border-radius:6px; padding:1px 7px; font-size:11px; font-weight:700; }
.cia-1 { background:rgba(86,217,134,.12);  color:var(--ce-green);  border:1px solid rgba(86,217,134,.3);  border-radius:6px; padding:1px 7px; font-size:11px; font-weight:700; }

/* ─ Score bar ─ */
.ce-maturite-wrap { padding: 14px 16px; }
.ce-maturite-top  { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
.ce-maturite-lbl  { font-size: 11px; color: var(--ce-muted); text-transform: uppercase; letter-spacing: .5px; font-weight: 600; }
.ce-maturite-num  { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 700; }
.ce-bar-track { height: 7px; background: rgba(255,255,255,.06); border-radius: 99px; overflow: hidden; }
.ce-bar-fill  { height: 100%; border-radius: 99px; animation: ce-bar .9s .4s ease both; }

/* ─ Vuln items ─ */
.ce-vuln-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 14px; margin: 6px 10px;
  background: rgba(240,112,112,.05);
  border: 1px solid rgba(240,112,112,.1);
  border-radius: 10px;
}
.ce-vuln-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
.ce-vuln-name { font-size: 12px; font-weight: 600; color: var(--ce-text); margin-bottom: 3px; }
.ce-vuln-meta { font-size: 11px; color: var(--ce-muted); }

/* ─ SSI summary ─ */
.ce-ssi-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 0; }
.ce-ssi-item {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 14px 10px; border-right: 1px solid var(--ce-border2);
  border-bottom: 1px solid var(--ce-border2);
  text-align: center; transition: background .15s;
}
.ce-ssi-item:hover { background: rgba(255,255,255,.02); }
.ce-ssi-item:nth-child(3n) { border-right: none; }
.ce-ssi-item:nth-last-child(-n+3) { border-bottom: none; }
.ce-ssi-icon-wrap {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; margin-bottom: 8px;
}
.ce-ssi-name { font-size: 10px; color: var(--ce-muted); text-transform: uppercase; letter-spacing: .4px; font-weight: 600; margin-bottom: 6px; }
.ce-ssi-status { font-size: 11px; font-weight: 700; }

/* ─ Action plan ─ */
.ce-action-row-p1 td:first-child { border-left: 2px solid var(--ce-red); }
.ce-action-row-p2 td:first-child { border-left: 2px solid var(--ce-amber); }
.ce-action-row-p3 td:first-child { border-left: 2px solid var(--ce-blue); }

/* ─ Empty ─ */
.ce-empty { padding: 24px 16px; text-align: center; color: var(--ce-muted); font-size: 12px; }

/* ─ Section title ─ */
.ce-section-divider {
  display: flex; align-items: center; gap: 10px;
  margin: 22px 0 12px;
  font-size: 10px; font-weight: 700; color: var(--ce-muted);
  text-transform: uppercase; letter-spacing: .8px;
}
.ce-section-divider::after { content: ''; flex: 1; height: 1px; background: var(--ce-border2); }

/* ─ Footer ─ */
.ce-footer { text-align: center; margin-top: 28px; font-size: 10px; color: #1e3a52; letter-spacing: .3px; }

/* ─ Loading ─ */
.ce-loader { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; min-height: 60vh; }
.ce-spinner { width: 36px; height: 36px; border: 2px solid var(--ce-border); border-top-color: var(--ce-teal); border-radius: 50%; animation: ce-spin .7s linear infinite; }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeExtracted(report) {
  const raw =
    report?.extracted_data ??
    report?.extractedData ??
    report?.compliance_details ??
    {};
  let parsed = raw;
  if (typeof raw === 'string') {
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }
  }
  const hasAnnexKeys = Object.keys(parsed).some(k => /^annexe\d/i.test(k));
  if (!hasAnnexKeys && Object.keys(parsed).length > 0) return { annexe1: parsed };
  if (parsed.annexe2 && Array.isArray(parsed.annexe2))
    parsed.annexe2 = { processus: parsed.annexe2 };
  return parsed;
}

function ciaBadge(v) {
  const n = Number(v);
  if (!v && v !== 0) return <span style={{ color: '#2a4a64' }}>—</span>;
  const cls = n >= 4 ? 'cia-4' : n >= 3 ? 'cia-3' : n >= 2 ? 'cia-2' : 'cia-1';
  return <span className={cls}>{n}/4</span>;
}

function scoreColor(score) {
  return score >= 75 ? 'var(--ce-green)' : score >= 50 ? 'var(--ce-amber)' : 'var(--ce-red)';
}

function matColor(m) {
  return m >= 3 ? 'var(--ce-green)' : m >= 2 ? 'var(--ce-amber)' : 'var(--ce-red)';
}

function prioriteBadge(p) {
  if (!p) return <span style={{ color: '#2a4a64' }}>—</span>;
  const lower = p.toLowerCase();
  if (lower === 'p1' || lower === 'haute' || lower === 'critique')
    return <span className="ce-badge ce-err"><span className="ce-badge-dot" style={{ background: 'var(--ce-red)' }} />{p}</span>;
  if (lower === 'p2' || lower === 'moyenne')
    return <span className="ce-badge ce-mid"><span className="ce-badge-dot" style={{ background: 'var(--ce-amber)' }} />{p}</span>;
  return <span className="ce-badge ce-info"><span className="ce-badge-dot" style={{ background: 'var(--ce-blue)' }} />{p}</span>;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CardHead({ icon, title, iconBg, badge, badgeCls }) {
  return (
    <div className="ce-card-head">
      <div className="ce-card-head-icon" style={{ background: `${iconBg}18`, border: `1px solid ${iconBg}30` }}>{icon}</div>
      <span className="ce-card-head-title">{title}</span>
      {badge && <span className={`ce-card-head-badge ${badgeCls}`}>{badge}</span>}
    </div>
  );
}

function KV({ label, value, accent, mono }) {
  return (
    <div className="ce-kv-item">
      <span className="ce-kv-label">{label}</span>
      <span className={`ce-kv-value ${mono ? 'mono' : ''}`} style={accent ? { color: accent } : {}}>{value || '—'}</span>
    </div>
  );
}

function AnimBar({ value, color }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), 600); return () => clearTimeout(t); }, [value]);
  return (
    <div className="ce-bar-track">
      <div className="ce-bar-fill" style={{ width: `${w}%`, background: `linear-gradient(90deg,${color}66,${color})`, transition: 'width 1.2s cubic-bezier(.22,1,.36,1)', boxShadow: `0 0 8px ${color}44` }} />
    </div>
  );
}

// ─── Annexe panels ────────────────────────────────────────────────────────────

function PanelA1({ data = {} }) {
  const LABELS = {
    nom_organisme: 'Organisme', acronyme: 'Acronyme', statut: 'Statut juridique',
    secteur_activite: "Secteur d'activité", adresse_email: 'Email', site_web: 'Site web',
    telephone: 'Téléphone', adresse: 'Adresse', responsable: 'Responsable',
    date_audit: 'Date audit', type_audit: "Type d'audit", ville: 'Ville',
  };
  const entries = Object.entries(data).filter(([, v]) => typeof v === 'string' || typeof v === 'number');
  if (!entries.length) return <div className="ce-empty">Aucune donnée d'identification.</div>;
  return entries.map(([k, v]) => (
    <KV key={k} label={LABELS[k] || k.replace(/_/g, ' ')} value={String(v)}
      accent={k === 'adresse_email' || k === 'site_web' ? 'var(--ce-blue)' : k === 'acronyme' ? 'var(--ce-teal)' : null} />
  ));
}

function PanelA2({ data = {} }) {
  const processus = data.processus || (Array.isArray(data) ? data : []);
  if (!processus.length) return <div className="ce-empty">Aucun processus extrait.</div>;
  return (
    <div className="ce-table-wrap">
      <table className="ce-table">
        <thead>
          <tr>
            <th>Processus</th>
            <th style={{ textAlign: 'center' }}>Confid.</th>
            <th style={{ textAlign: 'center' }}>Intégr.</th>
            <th style={{ textAlign: 'center' }}>Dispon.</th>
          </tr>
        </thead>
        <tbody>
          {processus.map((p, i) => (
            <tr key={i}>
              <td style={{ fontWeight: 500 }}>{p.processus || p.p || `Processus ${i + 1}`}</td>
              <td style={{ textAlign: 'center' }}>{ciaBadge(p.confidentialite ?? p.c)}</td>
              <td style={{ textAlign: 'center' }}>{ciaBadge(p.integrite ?? p.i)}</td>
              <td style={{ textAlign: 'center' }}>{ciaBadge(p.disponibilite ?? p.d)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PanelA3({ data = {} }) {
  const serveurs  = Array.isArray(data.serveurs)              ? data.serveurs              : [];
  const apps      = Array.isArray(data.applications)          ? data.applications          : [];
  const reseau    = Array.isArray(data.infrastructure_reseau) ? data.infrastructure_reseau : [];

  return (
    <div>
      {/* Serveurs */}
      {serveurs.length > 0 && (
        <>
          <div style={{ padding: '8px 14px 4px', fontSize: 10, color: 'var(--ce-muted)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 700 }}>Serveurs ({serveurs.length})</div>
          <div className="ce-table-wrap">
            <table className="ce-table">
              <thead><tr><th>Nom</th><th>OS</th><th>Rôle</th><th>IP</th></tr></thead>
              <tbody>
                {serveurs.map((s, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--ce-teal)', fontWeight: 600 }}>{s.nom || s.name || '—'}</td>
                    <td>{s.systeme_exploitation || s.os || '—'}</td>
                    <td style={{ color: '#6a8aa5' }}>{s.role || '—'}</td>
                    <td className="mono" style={{ fontSize: 10, color: '#4a6880' }}>{s.adresse_ip || s.ip || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {/* Applications */}
      {apps.length > 0 && (
        <>
          <div style={{ padding: '8px 14px 4px', fontSize: 10, color: 'var(--ce-muted)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 700 }}>Applications ({apps.length})</div>
          <div className="ce-table-wrap">
            <table className="ce-table">
              <thead><tr><th>Nom</th><th>Développé par</th><th>Utilisateurs</th></tr></thead>
              <tbody>
                {apps.map((a, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--ce-blue)', fontWeight: 600 }}>{a.nom || '—'}</td>
                    <td>{a.developpe_par || '—'}</td>
                    <td>{a.nb_utilisateurs || a.user_count || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {/* Réseau */}
      {reseau.length > 0 && (
        <>
          <div style={{ padding: '8px 14px 4px', fontSize: 10, color: 'var(--ce-muted)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 700 }}>Réseau ({reseau.length})</div>
          <div className="ce-table-wrap">
            <table className="ce-table">
              <thead><tr><th>Nature</th><th>Marque</th><th>Qté</th><th>Géré par</th></tr></thead>
              <tbody>
                {reseau.map((r, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--ce-purple)', fontWeight: 600 }}>{r.nature || '—'}</td>
                    <td>{r.marque_modele || r.brand || '—'}</td>
                    <td>{r.quantite || r.count || '—'}</td>
                    <td style={{ color: '#5a7a90' }}>{r.gere_par || r.managed_by || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {!serveurs.length && !apps.length && !reseau.length && (
        <div className="ce-empty">Aucune donnée infrastructure extraite.</div>
      )}
    </div>
  );
}

function PanelA5({ data = {} }) {
  const actions = data.actions || [];
  if (!actions.length) return <div className="ce-empty">Aucune action du plan précédent.</div>;
  return (
    <div className="ce-table-wrap">
      <table className="ce-table">
        <thead><tr><th>Action</th><th>Responsable</th><th>Taux</th><th>Éval.</th></tr></thead>
        <tbody>
          {actions.map((a, i) => {
            const taux = parseInt(a.taux_realisation) || 0;
            const color = taux >= 80 ? 'var(--ce-green)' : taux >= 50 ? 'var(--ce-amber)' : 'var(--ce-red)';
            return (
              <tr key={i}>
                <td style={{ maxWidth: 220, fontSize: 11 }}>{a.action || '—'}</td>
                <td style={{ color: '#6a8aa5', fontSize: 11 }}>{a.responsable || '—'}</td>
                <td>
                  {a.taux_realisation
                    ? <span style={{ color, fontWeight: 700, fontSize: 11 }}>{a.taux_realisation}</span>
                    : '—'}
                </td>
                <td style={{ fontSize: 11, color: '#4a6880' }}>{a.evaluation || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PanelA6({ data = {} }) {
  const maturite = data.maturite ?? data.score_moyen ?? data.global?.score_moyen ?? null;
  const criteres = Array.isArray(data.criteres) ? data.criteres : [];
  const m = Number(maturite) || 0;
  const color = matColor(m);
  return (
    <div>
      <div className="ce-maturite-wrap">
        <div className="ce-maturite-top">
          <span className="ce-maturite-lbl">Score de maturité global</span>
          <span className="ce-maturite-num" style={{ color }}>{m.toFixed(1)}<span style={{ fontSize: 14, color: 'var(--ce-muted)', fontWeight: 300 }}> /5</span></span>
        </div>
        <AnimBar value={(m / 5) * 100} color={color} />
      </div>
      {criteres.length > 0 && (
        <div className="ce-table-wrap">
          <table className="ce-table">
            <thead><tr><th>Domaine</th><th>Critère</th><th style={{ textAlign: 'center' }}>Score</th></tr></thead>
            <tbody>
              {criteres.map((c, i) => {
                const sc = c.score ?? 0;
                const cls = sc >= 4 ? 'ce-ok' : sc >= 3 ? 'ce-info' : sc >= 2 ? 'ce-mid' : 'ce-err';
                return (
                  <tr key={i}>
                    <td style={{ color: '#5a7a90', fontSize: 11 }}>{c.domaine || '—'}</td>
                    <td>{c.critere || '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      {c.score != null
                        ? <span className={`ce-badge ${cls}`}>{c.score}/5</span>
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PanelA8({ data = {} }) {
  const vulns = data.vulnerabilites || data.vulnerabilities || [];
  if (!vulns.length) return <div className="ce-empty">Aucune vulnérabilité extraite.</div>;
  return (
    <div style={{ padding: '8px 0' }}>
      {vulns.map((v, i) => (
        <div className="ce-vuln-item" key={i}>
          <span className="ce-vuln-icon">⚠</span>
          <div style={{ flex: 1 }}>
            <div className="ce-vuln-name">{v.nom || v.name || `Vulnérabilité ${i + 1}`}</div>
            {v.actifs_impactes && <div className="ce-vuln-meta">Actifs : {v.actifs_impactes}</div>}
            {v.recommandation  && <div style={{ fontSize: 11, color: '#4a6880', marginTop: 3 }}>{v.recommandation}</div>}
          </div>
          {v.impact && <span className="ce-badge ce-err">{v.impact}</span>}
        </div>
      ))}
    </div>
  );
}

function PanelA9({ data = {} }) {
  const actions = (data.projets || []).flatMap(p => p.actions || []);
  if (!actions.length) return <div className="ce-empty">Aucune action planifiée extraite.</div>;
  return (
    <div className="ce-table-wrap">
      <table className="ce-table">
        <thead><tr><th>Action</th><th>Priorité</th><th>Responsable</th><th>Date prévue</th></tr></thead>
        <tbody>
          {actions.map((a, i) => {
            const lower = (a.priorite || '').toLowerCase();
            const rowCls = lower === 'p1' || lower === 'haute' || lower === 'critique' ? 'ce-action-row-p1'
              : lower === 'p2' || lower === 'moyenne' ? 'ce-action-row-p2' : 'ce-action-row-p3';
            return (
              <tr key={i} className={rowCls}>
                <td style={{ fontSize: 11, maxWidth: 240 }}>{a.action || '—'}</td>
                <td>{prioriteBadge(a.priorite)}</td>
                <td style={{ fontSize: 11, color: '#5a7a90' }}>{a.responsable || '—'}</td>
                <td style={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}>{a.date_prevue || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ChargeEtudeRapportView({ report, responsableSuivi }) {
  const styleRef = useRef(false);

  useEffect(() => {
    if (styleRef.current) return;
    const el = document.createElement('style');
    el.textContent = CSS;
    document.head.appendChild(el);
    styleRef.current = true;
    return () => { el.remove(); styleRef.current = false; };
  }, []);

  if (!report) {
    return (
      <div className="ce-root">
        <div className="ce-loader">
          <div className="ce-spinner" />
          <span style={{ fontSize: 13, color: 'var(--ce-muted)' }}>Chargement du rapport…</span>
        </div>
      </div>
    );
  }

  const extracted = normalizeExtracted(report);
  const a1 = extracted.annexe1 || {};
  const a2 = extracted.annexe2 || {};
  const a3 = extracted.annexe3 || {};
  const a5 = extracted.annexe5 || {};
  const a6 = extracted.annexe6 || {};
  const a8 = extracted.annexe8 || {};
  const a9 = extracted.annexe9 || {};
  const a7 = extracted.annexe7 || {};

  const name    = a1.nom_organisme || report.organism_name || report.company_name || 'Organisme';
  const acronym = a1.acronyme || name.charAt(0).toUpperCase();
  const sector  = a1.secteur_activite || report.sector || '—';
  const score   = report.compliance_score ?? 0;
  const sc      = scoreColor(score);

  const serveurs  = Array.isArray(a3.serveurs)              ? a3.serveurs              : [];
  const apps      = Array.isArray(a3.applications)          ? a3.applications          : [];
  const reseau    = Array.isArray(a3.infrastructure_reseau) ? a3.infrastructure_reseau : [];
  const vulns     = a8.vulnerabilites || a8.vulnerabilities || [];
  const processus = a2.processus || (Array.isArray(a2) ? a2 : []);

  // Indicateurs A7
  const a7g    = a7.global || {};
  const indics = [
    { key: 'rssi',   label: 'RSSI nommé',     icon: '👤', val: a7g.rssi_nomme   ?? report.has_rssi ?? false },
    { key: 'pssi',   label: 'PSSI approuvée', icon: '📋', val: a7g.pssi_existe  ?? report.has_pssi ?? false },
    { key: 'pca',    label: 'PCA en place',   icon: '🔄', val: a7g.pca_existe   ?? report.has_pca  ?? false },
    { key: 'pra',    label: 'PRA en place',   icon: '🛡️', val: a7g.pra_existe   ?? report.has_pra  ?? false },
    { key: 'siem',   label: 'SIEM / IDS',     icon: '📡', val: a7g.siem_existe  ?? false },
    { key: 'comite', label: 'Comité SSI',      icon: '🏛️', val: a7g.comite_ssi  ?? false },
  ];

  // Maturité
  const maturite = a6.maturite ?? a6.score_moyen ?? a6.global?.score_moyen ?? 0;
  const m = Number(maturite) || 0;

  // Score ring SVG
  const r = 30, cx = 36, cy = 36, circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);

  // Responsable info
  const resp = responsableSuivi || report.responsable_suivi || null;
  const respName = typeof resp === 'string' ? resp : resp?.nom || resp?.name || resp?.full_name || 'Responsable assigné';
  const respRole = resp?.role || resp?.fonction || 'Responsable de suivi';
  const affectDate = report.assigned_at || report.affectation_date;
  const affectDateStr = affectDate
    ? new Date(affectDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Date non précisée';

  return (
    <div className="ce-root">
      <div className="ce-wrap">

        {/* ── Hero ── */}
        <div className="ce-hero ce-s1">
          {[160, 110, 65].map((s, i) => (
            <div key={i} className="ce-hero-deco" style={{ width: s, height: s, right: -s / 4, top: '50%', marginTop: -s / 2, animationDuration: `${18 + i * 7}s` }} />
          ))}
          <div className="ce-hero-avatar">{acronym.charAt(0)}</div>
          <div className="ce-hero-body">
            <div className="ce-hero-title">{name}</div>
            <div className="ce-hero-sub">
              {a1.acronyme && a1.acronyme !== name && <span style={{ color: 'var(--ce-teal)', fontWeight: 700 }}>{a1.acronyme}</span>}
              {a1.acronyme && a1.acronyme !== name && <span style={{ color: '#1a3248' }}>·</span>}
              <span>🏢 {sector}</span>
              {(a1.type_audit || report.audit_type) && (
                <><span style={{ color: '#1a3248' }}>·</span><span>📋 {a1.type_audit || report.audit_type}</span></>
              )}
              {(a1.date_audit || report.audit_date) && (
                <><span style={{ color: '#1a3248' }}>·</span>
                <span>📅 {new Date(a1.date_audit || report.audit_date).toLocaleDateString('fr-FR')}</span></>
              )}
            </div>
          </div>
          <div className="ce-hero-score">
            <div className="ce-score-ring">
              <svg width="78" height="78" viewBox="0 0 72 72">
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="3" />
                <circle cx={cx} cy={cy} r={r} fill="none" stroke={sc} strokeWidth="3"
                  strokeDasharray={circ} strokeDashoffset={offset}
                  strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
                  style={{ filter: `drop-shadow(0 0 4px ${sc})` }} />
              </svg>
              <span className="ce-score-val" style={{ color: sc }}>{score}<span style={{ fontSize: 10, color: 'var(--ce-muted)' }}>%</span></span>
              <span className="ce-score-lbl">conformité</span>
            </div>
          </div>
        </div>

        {/* ── Responsable de suivi card ── */}
        <div className="ce-resp-card ce-s2">
          <div className="ce-resp-icon">👤</div>
          <div style={{ flex: 1 }}>
            <div className="ce-resp-label">Responsable de suivi assigné</div>
            <div className="ce-resp-name">{respName}</div>
            <div className="ce-resp-meta">{respRole} · Affecté le {affectDateStr}</div>
          </div>
          <div className="ce-resp-badge">
            <div className="ce-resp-badge-dot" />
            Affecté
          </div>
        </div>

        {/* ── Stat boxes ── */}
        <div className="ce-stat-row ce-s3">
          {[
            { icon: '🖥️', val: serveurs.length || 0,  label: 'Serveurs',    color: 'var(--ce-teal)'   },
            { icon: '📦', val: apps.length     || 0,  label: 'Applications', color: 'var(--ce-blue)'   },
            { icon: '🔗', val: reseau.length   || 0,  label: 'Équip. réseau',color: 'var(--ce-purple)' },
            { icon: '⚠',  val: vulns.length    || 0,  label: 'Vulnérabilités',color: vulns.length ? 'var(--ce-red)' : 'var(--ce-muted)' },
          ].map(({ icon, val, label, color }) => (
            <div key={label} className="ce-stat-box">
              <div className="ce-stat-box-glow" style={{ background: color }} />
              <div className="ce-stat-icon">{icon}</div>
              <div className="ce-stat-val" style={{ color }}>{val}</div>
              <div className="ce-stat-lbl">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Section: Identification & Indicateurs ── */}
        <div className="ce-section-divider ce-s4">Données extraites</div>

        <div className="ce-grid ce-s4">
          {/* A1 */}
          <div className="ce-card">
            <CardHead icon="🏢" title="A1 — Présentation de l'organisme" iconBg="var(--ce-teal)" />
            <PanelA1 data={a1} />
          </div>

          {/* SSI / A7 */}
          <div className="ce-card">
            <CardHead icon="🔐" title="A7 — Indicateurs de sécurité" iconBg="var(--ce-purple)" />
            <div className="ce-ssi-grid">
              {indics.map(({ label, icon, val }) => (
                <div key={label} className="ce-ssi-item">
                  <div className="ce-ssi-icon-wrap" style={{ background: val ? 'rgba(86,217,134,.1)' : 'rgba(240,112,112,.08)', border: `1px solid ${val ? 'rgba(86,217,134,.2)' : 'rgba(240,112,112,.15)'}` }}>
                    {icon}
                  </div>
                  <div className="ce-ssi-name">{label}</div>
                  <div className="ce-ssi-status" style={{ color: val ? 'var(--ce-green)' : 'var(--ce-red)' }}>
                    {val ? '✓ Oui' : '✗ Non'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* A6 maturité */}
        <div className="ce-card ce-s5" style={{ marginBottom: 16 }}>
          <CardHead icon="📈" title="A6 — Maturité de la sécurité du SI" iconBg="var(--ce-green)"
            badge={`${m.toFixed(1)}/5`}
            badgeCls={m >= 3 ? 'ce-ok' : m >= 2 ? 'ce-mid' : 'ce-err'} />
          <PanelA6 data={a6} />
        </div>

        {/* A2 Classification */}
        {processus.length > 0 && (
          <div className="ce-card ce-s5" style={{ marginBottom: 16 }}>
            <CardHead icon="🗂️" title="A2 — Classification des processus" iconBg="var(--ce-gold)"
              badge={`${processus.length} processus`} badgeCls="ce-mid" />
            <PanelA2 data={a2} />
          </div>
        )}

        {/* A3 SI */}
        {(serveurs.length > 0 || apps.length > 0 || reseau.length > 0) && (
          <div className="ce-card ce-s6" style={{ marginBottom: 16 }}>
            <CardHead icon="🖥️" title="A3 — Description du système d'information" iconBg="var(--ce-blue)"
              badge={`${serveurs.length + apps.length + reseau.length} éléments`} badgeCls="ce-info" />
            <PanelA3 data={a3} />
          </div>
        )}

        {/* A5 + A8 côte-à-côte */}
        <div className="ce-grid ce-s7">
          {(a5.actions?.length > 0 || Object.keys(a5).length > 0) && (
            <div className="ce-card">
              <CardHead icon="📌" title="A5 — Plan d'action précédent" iconBg="var(--ce-amber)" />
              <PanelA5 data={a5} />
            </div>
          )}
          {(vulns.length > 0 || Object.keys(a8).length > 0) && (
            <div className="ce-card">
              <CardHead icon="⚠" title="A8 — Vulnérabilités identifiées" iconBg="var(--ce-red)"
                badge={vulns.length ? `${vulns.length} vulnérab.` : null} badgeCls="ce-err" />
              <PanelA8 data={a8} />
            </div>
          )}
        </div>

        {/* A9 Plan d'action */}
        {a9.projets?.length > 0 && (
          <div className="ce-card ce-s8" style={{ marginTop: 16 }}>
            <CardHead icon="🗓️" title="A9 — Plan d'action recommandé" iconBg="var(--ce-purple)" />
            <PanelA9 data={a9} />
          </div>
        )}

        {/* ── Footer ── */}
        <div className="ce-footer ce-s9">
          ANCS Platform · Audit de Sécurité des Systèmes d'Information © 2026
        </div>
      </div>
    </div>
  );
}