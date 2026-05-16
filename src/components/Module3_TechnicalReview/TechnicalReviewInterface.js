// components/Module3_TechnicalReview/TechnicalReviewInterface.jsx
// Layout: LEFT = Annexes viewer (raw data) | RIGHT = Extracted data editor + Annotations

import { useState, useRef, useEffect } from 'react';
import { useAnnotations } from '../../hooks/Useannotations';

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
/* Root layout: 2 cols */
.tri-root { display: grid; grid-template-columns: 1fr 1.4fr; gap: 20px; align-items: start; }
@media (max-width: 1100px) { .tri-root { grid-template-columns: 1fr; } }

/* Cards */
.tri-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(139,92,246,0.12); border-radius: 14px; overflow: hidden; }
.tri-card-head { padding: 12px 16px; border-bottom: 1px solid rgba(139,92,246,0.1); display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.15); }
.tri-card-head h3 { font-size: 14px; font-weight: 600; color: #e2e8f0; display: flex; align-items: center; gap: 6px; }

/* Sticky columns */
.tri-left-col { position: sticky; top: 80px; max-height: calc(100vh - 100px); overflow-y: auto; }
.tri-right-col { min-width: 0; }

/* Scrollbar */
.tri-left-col::-webkit-scrollbar { width: 4px; }
.tri-left-col::-webkit-scrollbar-track { background: transparent; }
.tri-left-col::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 99px; }

/* Annexe sections in left panel */
.tri-annex-section { border-bottom: 1px solid rgba(139,92,246,0.08); }
.tri-annex-section:last-child { border-bottom: none; }
.tri-annex-header { padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: background .15s; }
.tri-annex-header:hover { background: rgba(139,92,246,0.06); }
.tri-annex-title { font-size: 13px; font-weight: 600; color: #c4b5fd; display: flex; align-items: center; gap: 8px; }
.tri-annex-chevron { font-size: 10px; color: #475569; transition: transform .2s; }
.tri-annex-chevron.open { transform: rotate(180deg); }
.tri-annex-body { padding: 12px 16px; background: rgba(0,0,0,0.1); }

/* Raw data KV */
.tri-raw-kv { display: flex; flex-direction: column; gap: 6px; }
.tri-raw-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; font-size: 12px; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
.tri-raw-row:last-child { border-bottom: none; }
.tri-raw-label { color: #64748b; min-width: 140px; flex-shrink: 0; }
.tri-raw-value { color: #e2e8f0; text-align: right; word-break: break-all; }
.tri-raw-value.bool-true  { color: #34d399; font-weight: 600; }
.tri-raw-value.bool-false { color: #f87171; font-weight: 600; }
.tri-raw-value.num { color: #a78bfa; font-weight: 600; }

/* Table in annexe */
.tri-raw-table { width: 100%; border-collapse: collapse; font-size: 11px; }
.tri-raw-table th { padding: 6px 8px; text-align: left; color: #475569; font-weight: 600; border-bottom: 1px solid rgba(139,92,246,0.1); }
.tri-raw-table td { padding: 6px 8px; color: #cbd5e1; border-bottom: 1px solid rgba(255,255,255,0.03); }

/* Badges */
.tri-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; }
.tri-badge-ok  { background: rgba(16,185,129,0.15);  color: #34d399; border: 1px solid rgba(16,185,129,0.25); }
.tri-badge-mid { background: rgba(245,158,11,0.15);  color: #fbbf24; border: 1px solid rgba(245,158,11,0.25); }
.tri-badge-err { background: rgba(239,68,68,0.15);   color: #f87171; border: 1px solid rgba(239,68,68,0.25); }
.tri-badge-info{ background: rgba(99,102,241,0.15);  color: #818cf8; border: 1px solid rgba(99,102,241,0.25); }

/* Buttons */
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

/* Score bar */
.tri-score-bar { height:8px; background:rgba(255,255,255,0.08); border-radius:99px; overflow:hidden; margin-bottom:16px; }
.tri-score-fill { height:100%; border-radius:99px; transition:width .4s ease; }

/* Annotation section inside right col */
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
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeExtracted(report, annexesOverride = null) {
  if (annexesOverride && Object.keys(annexesOverride).length > 0) {
    const parsed = { ...annexesOverride };
    if (parsed.annexe2) parsed.annexe2 = normalizeAnnexe2(parsed.annexe2);
    return parsed;
  }

  const raw = report?.extracted_data ?? report?.extractedData ?? null;
  if (raw != null) {
    let parsed = raw;
    if (typeof raw === 'string') { try { parsed = JSON.parse(raw); } catch { parsed = {}; } }
    if (parsed.annexe2) parsed.annexe2 = normalizeAnnexe2(parsed.annexe2);
    const hasAnnex = Object.keys(parsed).some(k => /^annexe\d/i.test(k));
    if (!hasAnnex && Object.keys(parsed).length > 0) return { annexe1: parsed };
    return parsed;
  }

  const cd = report?.compliance_details;
  let cdP = cd;
  if (typeof cd === 'string') { try { cdP = JSON.parse(cd); } catch { cdP = {}; } }

  if (cdP?.company) {
    return {
      annexe1: cdP.company,
      annexe_kpis: cdP.kpis || {},
    };
  }

  // Fallback: build from flat report fields
  const annexe1 = {};
  const ROOT_A1 = ['organism_name','company_name','organism_sector','organism_address',
    'audit_type','maturity_level','compliance_score','is_compliant','risk_score',
    'upload_date','validation_date','status','security_committee'];
  for (const k of ROOT_A1) { if (report?.[k] != null) annexe1[k] = report[k]; }

  const annexe3 = {
    serveurs: report?.total_servers ? [{ nom: `${report.total_servers} serveur(s)`, os: '—', role: '—' }] : [],
    applications: report?.total_workstations || 0,
    infrastructure_reseau: [],
    eol_workstations: report?.eol_workstations,
    eol_servers: report?.eol_servers,
    patch_compliance: report?.patch_compliance_pct,
  };

  const annexe6 = {
    maturite: report?.maturity_level,
    criteres: [
      { domaine: 'Conformité', critere: 'Score global', score: report?.compliance_score ? Math.round(report.compliance_score / 20) : null },
      { domaine: 'Risque',     critere: 'Score risque',  score: report?.risk_score ? Math.round((100 - report.risk_score) / 20) : null },
      { domaine: 'Sécurité',   critere: 'Comité sécu',   score: report?.security_committee ? 4 : 1 },
      { domaine: 'Formation',  critere: 'Personnel SSI', score: report?.staff_ssi_trained_pct ? Math.round(report.staff_ssi_trained_pct / 25) : null },
    ].filter(c => c.score != null),
  };

  const annexe8 = {
    vulnerabilites: [
      report?.vuln_scan_done === false && { nom: 'Scan de vulnérabilités non effectué', impact: 'Élevé', recommandation: 'Planifier un scan' },
      report?.critical_vulns_open > 0 && { nom: `${report.critical_vulns_open} vulnérabilité(s) critique(s)`, impact: 'Critique', recommandation: 'Corriger en priorité' },
      report?.eol_workstations > 0 && { nom: `${report.eol_workstations} poste(s) en fin de vie`, impact: 'Moyen', recommandation: 'Planifier remplacement' },
      report?.eol_servers > 0 && { nom: `${report.eol_servers} serveur(s) en fin de vie`, impact: 'Élevé', recommandation: 'Migration urgente' },
    ].filter(Boolean),
  };

  const annexe9 = {
    projets: [{ actions: [
      report?.vuln_scan_done === false && { action: 'Réaliser un scan de vulnérabilités', priorite: 'P1', responsable: 'RSSI', date_prevue: '—' },
      report?.pca_test_done === false && { action: 'Tester le PCA/PRA', priorite: 'P1', responsable: 'DSI', date_prevue: '—' },
      report?.has_rssi === false && { action: 'Nommer un RSSI', priorite: 'P1', responsable: 'Direction', date_prevue: '—' },
      report?.mfa_enabled === false && { action: 'Déployer MFA', priorite: 'P2', responsable: 'DSI', date_prevue: '—' },
      report?.encryption_at_rest === false && { action: 'Chiffrement au repos', priorite: 'P2', responsable: 'DSI', date_prevue: '—' },
    ].filter(Boolean) }],
  };

  return { annexe1, annexe3, annexe6, annexe8, annexe9 };
}

function normalizeAnnexe2(a2Raw) {
  if (a2Raw?.processus) return a2Raw;
  if (Array.isArray(a2Raw)) return { processus: a2Raw };
  return { processus: [] };
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

const BOOL_LABELS = {
  has_rssi: 'RSSI nommé', has_pssi: 'PSSI en place', has_pca: 'PCA existe',
  has_pra: 'PRA existe', pca_test_done: 'PCA testé', pentest_done: 'Pentest effectué',
  vuln_scan_done: 'Scan vuln. effectué', asset_inventory_done: 'Inventaire actifs',
  has_ids_ips: 'IDS/IPS', has_firewall: 'Pare-feu', siem_coverage_pct: 'SIEM couverture',
  mfa_enabled: 'MFA activé', encryption_at_rest: 'Chiffrement repos',
  encryption_in_transit: 'Chiffrement transit', network_segmentation: 'Segmentation réseau',
  backup_policy_exists: 'Politique sauvegarde', backup_tested: 'Sauvegarde testée',
  backup_offsite: 'Sauvegarde hors-site', backup_encrypted: 'Sauvegarde chiffrée',
  has_datacenter: 'Datacenter propre', dc_access_control: 'Contrôle accès DC',
  dc_fire_suppression: 'Anti-incendie DC', dc_ups_redundancy: 'UPS redondant',
  dc_cooling_redundancy: 'Refroidissement redondant', dc_cctv: 'CCTV datacenter',
  iso27001_certified: 'Certifié ISO 27001', regulatory_compliant: 'Conforme réglementaire',
  data_classification: 'Classification données', gdpr_dpo_appointed: 'DPO nommé (RGPD)',
  audit_internal_done: 'Audit interne effectué', is_compliant: 'Conforme global',
  pssi_updated_within_2y: 'PSSI à jour (2 ans)', has_risk_analysis: 'Analyse risques',
};

const PCT_LABELS = {
  compliance_score: 'Score conformité', maturity_level: 'Niveau maturité',
  risk_score: 'Score risque', staff_ssi_trained_pct: '% Personnel SSI formé',
  patch_compliance_pct: '% Patch compliance', antivirus_coverage_pct: '% Antivirus',
  backup_coverage_pct: '% Couverture sauvegarde', rto_hours: 'RTO (h)', rpo_hours: 'RPO (h)',
  backup_retention_days: 'Rétention sauvegarde (j)', user_count: 'Nb utilisateurs',
  total_workstations: 'Nb postes', eol_workstations: 'Postes fin de vie',
  eol_servers: 'Serveurs fin de vie', total_servers: 'Nb serveurs',
  critical_vulns_open: 'Vulns critiques ouvertes', incidents_count: 'Nb incidents',
  incidents_resolved_pct: '% Incidents résolus', critical_systems_covered: 'Systèmes critiques couverts',
  restore_test_success_pct: '% Tests restauration', pca_last_test_date: 'Dernier test PCA',
  pentest_date: 'Date dernier pentest', dc_tier_level: 'Tier datacenter',
};

const TEXT_LABELS = {
  organism_name: 'Organisme', company_name: 'Organisme', organism_sector: 'Secteur',
  organism_address: 'Adresse', headquarters: 'Siège social', audit_type: 'Type audit',
  upload_date: 'Date dépôt', validation_date: 'Date validation', status: 'Statut',
  last_audit_date: 'Dernier audit', next_audit_date: 'Prochain audit',
  risk_analysis_date: 'Date analyse risques', audit_internal_date: 'Dernier audit interne',
  iso27001_date: 'Date certification ISO', vuln_scan_date: 'Date scan vulns',
};

function RawBoolRow({ label, value }) {
  const cls = value === true ? 'bool-true' : value === false ? 'bool-false' : '';
  const display = value === true ? '✅ Oui' : value === false ? '❌ Non' : '—';
  return (
    <div className="tri-raw-row">
      <span className="tri-raw-label">{label}</span>
      <span className={`tri-raw-value ${cls}`}>{display}</span>
    </div>
  );
}

function RawNumRow({ label, value, suffix = '' }) {
  return (
    <div className="tri-raw-row">
      <span className="tri-raw-label">{label}</span>
      <span className="tri-raw-value num">{value != null ? `${value}${suffix}` : '—'}</span>
    </div>
  );
}

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
  if (!report) return <div className="tri-empty">Aucun rapport sélectionné.</div>;

  return (
    <div>
      {/* A1 — Identification */}
      <AnnexeSection title="A1 — Identification de l'organisme" icon="🏢" defaultOpen={true}>
        <div className="tri-raw-kv">
          {Object.entries(TEXT_LABELS).map(([k, label]) =>
            report[k] != null ? <RawTextRow key={k} label={label} value={String(report[k])} /> : null
          )}
          {report?.compliance_details?.company && Object.entries(report.compliance_details.company).map(([k, v]) =>
            typeof v === 'string' || typeof v === 'number'
              ? <RawTextRow key={k} label={k.replace(/_/g, ' ')} value={String(v)} />
              : null
          )}
        </div>
      </AnnexeSection>

      {/* A2 — Classification (if present in compliance_details) */}
      {report?.compliance_details?.processus?.length > 0 && (
        <AnnexeSection title="A2 — Classification des processus" icon="📊">
          <table className="tri-raw-table">
            <thead>
              <tr>
                <th>Processus</th>
                <th>C</th>
                <th>I</th>
                <th>D</th>
              </tr>
            </thead>
            <tbody>
              {report.compliance_details.processus.map((p, i) => (
                <tr key={i}>
                  <td>{p.processus || p.p || '—'}</td>
                  <td>{p.confidentialite ?? p.c ?? '—'}</td>
                  <td>{p.integrite ?? p.i ?? '—'}</td>
                  <td>{p.disponibilite ?? p.d ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AnnexeSection>
      )}

      {/* A3 — Infrastructure */}
      <AnnexeSection title="A3 — Système d'information" icon="🖥️">
        <div className="tri-raw-kv">
          <RawNumRow label="Nb total serveurs"    value={report?.total_servers} />
          <RawNumRow label="Nb postes de travail" value={report?.total_workstations} />
          <RawNumRow label="Postes fin de vie"    value={report?.eol_workstations} />
          <RawNumRow label="Serveurs fin de vie"  value={report?.eol_servers} />
          <RawNumRow label="Nb utilisateurs"      value={report?.user_count} />
          <RawNumRow label="Systèmes critiques"   value={report?.critical_systems_covered} />
          <RawNumRow label="Patch compliance"     value={report?.patch_compliance_pct} suffix="%" />
          <RawNumRow label="Couverture antivirus" value={report?.antivirus_coverage_pct} suffix="%" />
          <RawBoolRow label="Inventaire actifs"   value={report?.asset_inventory_done} />
          <RawBoolRow label="Segmentation réseau" value={report?.network_segmentation} />
        </div>
      </AnnexeSection>

      {/* A5 — Sécurité opérationnelle */}
      <AnnexeSection title="A5 — Sécurité opérationnelle" icon="🔐">
        <div className="tri-raw-kv">
          <RawBoolRow label="RSSI nommé"          value={report?.has_rssi} />
          <RawBoolRow label="PSSI en place"       value={report?.has_pssi} />
          <RawBoolRow label="PSSI à jour (2 ans)" value={report?.pssi_updated_within_2y} />
          <RawBoolRow label="Analyse de risques"  value={report?.has_risk_analysis} />
          <RawBoolRow label="Comité de sécurité"  value={report?.security_committee} />
          <RawNumRow  label="Budget sécurité"     value={report?.security_budget} />
          <RawNumRow  label="% Personnel SSI formé" value={report?.staff_ssi_trained_pct} suffix="%" />
          <RawBoolRow label="MFA activé"          value={report?.mfa_enabled} />
          <RawBoolRow label="Chiffrement repos"   value={report?.encryption_at_rest} />
          <RawBoolRow label="Chiffrement transit" value={report?.encryption_in_transit} />
          <RawBoolRow label="IDS/IPS"             value={report?.has_ids_ips} />
          <RawBoolRow label="Pare-feu"            value={report?.has_firewall} />
          <RawNumRow  label="Couverture SIEM"     value={report?.siem_coverage_pct} suffix="%" />
        </div>
      </AnnexeSection>

      {/* A6 — Maturité */}
      <AnnexeSection title="A6 — Maturité de la sécurité" icon="📈">
        <div className="tri-raw-kv">
          <RawNumRow label="Niveau maturité"    value={report?.maturity_level} suffix="/5" />
          <RawNumRow label="Score conformité"   value={report?.compliance_score} suffix="%" />
          <RawNumRow label="Score risque"       value={report?.risk_score} suffix="/100" />
          <RawTextRow label="Statut conformité" value={report?.is_compliant ? 'Conforme' : 'Non conforme'} />
          {report?.compliance_details?.kpis && (
            <>
              <RawNumRow label="KPIs total"    value={report.compliance_details.kpis.total} />
              <RawNumRow label="KPIs conformes" value={report.compliance_details.kpis.conformes} />
            </>
          )}
        </div>
      </AnnexeSection>

      {/* A7 — Continuité */}
      <AnnexeSection title="A7 — Continuité & Sauvegarde" icon="💾">
        <div className="tri-raw-kv">
          <RawBoolRow label="PCA existe"            value={report?.has_pca} />
          <RawBoolRow label="PRA existe"            value={report?.has_pra} />
          <RawBoolRow label="PCA testé"             value={report?.pca_test_done} />
          <RawTextRow label="Dernier test PCA"      value={report?.pca_last_test_date} />
          <RawNumRow  label="RTO (heures)"          value={report?.rto_hours} />
          <RawNumRow  label="RPO (heures)"          value={report?.rpo_hours} />
          <RawBoolRow label="Politique sauvegarde"  value={report?.backup_policy_exists} />
          <RawBoolRow label="Sauvegarde testée"     value={report?.backup_tested} />
          <RawBoolRow label="Sauvegarde hors-site"  value={report?.backup_offsite} />
          <RawBoolRow label="Sauvegarde chiffrée"   value={report?.backup_encrypted} />
          <RawNumRow  label="Rétention (jours)"     value={report?.backup_retention_days} />
          <RawNumRow  label="Couverture sauvegarde" value={report?.backup_coverage_pct} suffix="%" />
          <RawNumRow  label="% Tests restauration"  value={report?.restore_test_success_pct} suffix="%" />
        </div>
      </AnnexeSection>

      {/* A8 — Vulnérabilités */}
      <AnnexeSection title="A8 — Vulnérabilités & Incidents" icon="⚠️">
        <div className="tri-raw-kv">
          <RawBoolRow label="Scan vulns effectué"   value={report?.vuln_scan_done} />
          <RawTextRow label="Date scan vulns"       value={report?.vuln_scan_date} />
          <RawNumRow  label="Vulns critiques ouvertes" value={report?.critical_vulns_open} />
          <RawBoolRow label="Pentest effectué"      value={report?.pentest_done} />
          <RawTextRow label="Date dernier pentest"  value={report?.pentest_date} />
          <RawNumRow  label="Nb incidents"          value={report?.incidents_count} />
          <RawNumRow  label="% Incidents résolus"   value={report?.incidents_resolved_pct} suffix="%" />
        </div>
      </AnnexeSection>

      {/* A9 — Conformité réglementaire */}
      <AnnexeSection title="A9 — Conformité & Gouvernance" icon="📋">
        <div className="tri-raw-kv">
          <RawBoolRow label="ISO 27001 certifié"    value={report?.iso27001_certified} />
          <RawTextRow label="Date certification"    value={report?.iso27001_date} />
          <RawBoolRow label="Conforme réglementaire" value={report?.regulatory_compliant} />
          <RawBoolRow label="Classification données" value={report?.data_classification} />
          <RawBoolRow label="DPO nommé (RGPD)"      value={report?.gdpr_dpo_appointed} />
          <RawBoolRow label="Audit interne effectué" value={report?.audit_internal_done} />
          <RawTextRow label="Date audit interne"    value={report?.audit_internal_date} />
          <RawTextRow label="Dernier audit"         value={report?.last_audit_date} />
          <RawTextRow label="Prochain audit"        value={report?.next_audit_date} />
          <RawTextRow label="Historique corrections" value={report?.correction_history} />
        </div>
      </AnnexeSection>

      {/* Datacenter */}
      <AnnexeSection title="Datacenter" icon="🏭">
        <div className="tri-raw-kv">
          <RawBoolRow label="Datacenter propre"       value={report?.has_datacenter} />
          <RawNumRow  label="Tier datacenter"         value={report?.dc_tier_level} />
          <RawBoolRow label="Contrôle accès"          value={report?.dc_access_control} />
          <RawBoolRow label="Anti-incendie"           value={report?.dc_fire_suppression} />
          <RawBoolRow label="UPS redondant"           value={report?.dc_ups_redundancy} />
          <RawBoolRow label="Refroidissement redondant" value={report?.dc_cooling_redundancy} />
          <RawBoolRow label="CCTV"                    value={report?.dc_cctv} />
        </div>
      </AnnexeSection>
    </div>
  );
}

// ─── Right panel: Synthesis Panel (replaces all tab panels) ──────────────────────────────────────

function SynthesisPanel({ report, annotatedPaths, onAnnotateField }) {
  const cd = report?.compliance_details || {};
  const company = cd.company || {};

  const sections = [
    {
      key: 'organisme',
      title: "Présentation de l'organisme audité",
      annexe: "Annexe 1",
      icon: "🏢",
      fields: [
        { label: "Nom",             value: report?.organism_name || company.nom_organisme || company.name },
        { label: "Acronyme",        value: company.acronyme },
        { label: "Secteur",         value: report?.organism_sector || company.sector || company.secteur_activite },
        { label: "Statut juridique",value: company.statut },
        { label: "Email",           value: company.adresse_email || company.email },
        { label: "Site web",        value: company.site_web },
        { label: "Responsable",     value: company.responsable },
        { label: "Type d'audit",    value: report?.audit_type },
        { label: "Date dépôt",      value: report?.upload_date },
      ],
    },
    {
      key: 'perimetre',
      title: "Périmètre géographique",
      annexe: "Annexe 1 / Annexe 3",
      icon: "📍",
      fields: [
        { label: "Adresse",               value: report?.organism_address || company.adresse },
        { label: "Ville",                 value: company.ville },
        { label: "Siège social",          value: company.headquarters },
        { label: "Nombre de sites",       value: company.nombre_sites },
        { label: "Répartition géo.",      value: company.repartition_geo },
      ],
    },
    {
      key: 'si',
      title: "Description du système d'information",
      annexe: "Annexe 3",
      icon: "🖥️",
      fields: [
        { label: "Nb serveurs",           value: report?.total_servers },
        { label: "Nb postes de travail",  value: report?.total_workstations },
        { label: "Nb utilisateurs",       value: report?.user_count },
        { label: "Postes fin de vie",     value: report?.eol_workstations },
        { label: "Serveurs fin de vie",   value: report?.eol_servers },
        { label: "Patch compliance",      value: report?.patch_compliance_pct != null ? `${report.patch_compliance_pct}%` : null },
        { label: "Couverture antivirus",  value: report?.antivirus_coverage_pct != null ? `${report.antivirus_coverage_pct}%` : null },
        { label: "Segmentation réseau",   value: report?.network_segmentation === true ? "✅ Oui" : report?.network_segmentation === false ? "❌ Non" : null },
        { label: "Inventaire actifs",     value: report?.asset_inventory_done === true ? "✅ Oui" : report?.asset_inventory_done === false ? "❌ Non" : null },
      ],
    },
    {
      key: 'maturite',
      title: "État de maturité de la sécurité du SI",
      annexe: "Annexe 6",
      icon: "📈",
      fields: [
        { label: "Niveau maturité global",  value: report?.maturity_level != null ? `${report.maturity_level} / 5` : null },
        { label: "Score conformité",        value: report?.compliance_score != null ? `${report.compliance_score}%` : null },
        { label: "Score risque",            value: report?.risk_score != null ? `${report.risk_score} / 100` : null },
        { label: "Statut conformité",       value: report?.is_compliant === true ? "✅ Conforme" : report?.is_compliant === false ? "❌ Non conforme" : null },
        { label: "Score Organisationnel",   value: cd.annexe6?.score_organisationnel },
        { label: "Score Personnes",         value: cd.annexe6?.score_personnes },
        { label: "Score Physique",          value: cd.annexe6?.score_physique },
        { label: "Score Technologique",     value: cd.annexe6?.score_technologique },
        { label: "KPIs conformes",          value: cd.kpis ? `${cd.kpis.conformes} / ${cd.kpis.total}` : null },
      ],
    },
    {
      key: 'indicateurs',
      title: "Indicateurs de sécurité",
      annexe: "Annexe 7",
      icon: "🔐",
      fields: [
        { label: "RSSI nommé",           value: report?.has_rssi === true ? "✅ Oui" : report?.has_rssi === false ? "❌ Non" : null },
        { label: "PSSI en place",        value: report?.has_pssi === true ? "✅ Oui" : report?.has_pssi === false ? "❌ Non" : null },
        { label: "PSSI à jour",          value: report?.pssi_updated_within_2y === true ? "✅ Oui" : report?.pssi_updated_within_2y === false ? "❌ Non" : null },
        { label: "PCA",                  value: report?.has_pca === true ? "✅ Oui" : report?.has_pca === false ? "❌ Non" : null },
        { label: "PRA",                  value: report?.has_pra === true ? "✅ Oui" : report?.has_pra === false ? "❌ Non" : null },
        { label: "PCA testé",            value: report?.pca_test_done === true ? "✅ Oui" : report?.pca_test_done === false ? "❌ Non" : null },
        { label: "Sauvegardes testées",  value: report?.backup_tested === true ? "✅ Oui" : report?.backup_tested === false ? "❌ Non" : null },
        { label: "Sauvegarde hors-site", value: report?.backup_offsite === true ? "✅ Oui" : report?.backup_offsite === false ? "❌ Non" : null },
        { label: "Sauvegarde chiffrée",  value: report?.backup_encrypted === true ? "✅ Oui" : report?.backup_encrypted === false ? "❌ Non" : null },
        { label: "Antivirus",            value: report?.antivirus_coverage_pct != null ? `${report.antivirus_coverage_pct}%` : null },
        { label: "SIEM / IDS-IPS",       value: report?.has_ids_ips === true ? "✅ Oui" : report?.has_ids_ips === false ? "❌ Non" : null },
        { label: "Pare-feu",             value: report?.has_firewall === true ? "✅ Oui" : report?.has_firewall === false ? "❌ Non" : null },
        { label: "MFA activé",           value: report?.mfa_enabled === true ? "✅ Oui" : report?.mfa_enabled === false ? "❌ Non" : null },
        { label: "Chiffrement repos",    value: report?.encryption_at_rest === true ? "✅ Oui" : report?.encryption_at_rest === false ? "❌ Non" : null },
        { label: "Contrôle accès DC",    value: report?.dc_access_control === true ? "✅ Oui" : report?.dc_access_control === false ? "❌ Non" : null },
        { label: "% Personnel SSI formé",value: report?.staff_ssi_trained_pct != null ? `${report.staff_ssi_trained_pct}%` : null },
        { label: "Vulns critiques",      value: report?.critical_vulns_open != null ? `${report.critical_vulns_open}` : null },
      ],
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {sections.map((section) => {
        const filled = section.fields.filter(f => f.value != null && f.value !== '');
        const isAnnotated = annotatedPaths.has(`synthesis.${section.key}`);
        return (
          <div key={section.key} style={{
            background: isAnnotated ? 'rgba(245,158,11,0.05)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${isAnnotated ? 'rgba(245,158,11,0.35)' : 'rgba(139,92,246,0.12)'}`,
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(0,0,0,0.15)',
                borderBottom: '1px solid rgba(139,92,246,0.1)',
                cursor: 'pointer',
              }}
              onClick={() => onAnnotateField(`synthesis.${section.key}`, section.title)}
              title="Cliquer pour annoter cette section"
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 7 }}>
                {section.icon} {section.title}
                {isAnnotated && <span style={{ fontSize: 10, color: '#f59e0b' }}>📌</span>}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: '#64748b' }}>{filled.length} champ(s)</span>
                <span className="tri-badge tri-badge-info" style={{ fontSize: 10 }}>{section.annexe}</span>
              </div>
            </div>

            {/* Fields */}
            <div style={{ padding: '12px 14px' }}>
              {filled.length === 0 ? (
                <div style={{ fontSize: 12, color: '#475569', fontStyle: 'italic' }}>
                  Aucune donnée extraite pour cette section.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8 }}>
                  {filled.map((f, i) => (
                    <div key={i} style={{
                      padding: '8px 10px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 8,
                      border: '1px solid rgba(139,92,246,0.08)',
                    }}>
                      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 3 }}>{f.label}</div>
                      <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{String(f.value)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Annotations ─────────────────────────────────────────────────────────────

function AnnotationsPanel({ annotations, annLoading, counts, addAnnotation, deleteAnnotation, sendToResponsable, selectedField, clearSelectedField, report }) {
  const [annType, setAnnType] = useState('remarque');
  const [annTarget, setAnnTarget] = useState('Annexe 1');
  const [annText, setAnnText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { if (selectedField) { setAnnTarget(selectedField.label); setAnnText(''); } }, [selectedField]);

  const handleAdd = async () => {
    if (!annText.trim()) return;
    const r = await addAnnotation({ type: annType, target: annTarget, text: annText.trim(), fieldPath: selectedField?.path || null });
    if (r.success) { setAnnText(''); clearSelectedField(); }
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
      {annLoading ? <div className="tri-empty">Chargement…</div> : annotations.length === 0 ? (
        <div className="tri-empty">Aucune annotation. Cliquez sur un champ pour annoter.</div>
      ) : (
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
      )}
      <div className="tri-send-section">
        <div className="tri-send-summary"><strong>{counts.draft}</strong> brouillon(s) · <strong>{counts.sent}</strong> envoyé(s)</div>
        <button className="tri-btn-send" onClick={handleSend} disabled={sending || counts.draft === 0}>
          {sending ? '⏳ Envoi…' : `📤 Envoyer (${counts.draft}) au responsable`}
        </button>
      </div>
    </>
  );
}

// ─── Main Component MODIFIÉ avec gestion onValidate/onReject ─────────────────────────────────────

export default function TechnicalReviewInterface({ 
  report, 
  onValidate, 
  onReject, 
  validating = false, 
  rejecting = false 
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

  const { annotations, loading: annLoading, error: annError, counts, addAnnotation, deleteAnnotation, sendToResponsable } = useAnnotations(report?.id);

  const showToast = (msg, err = false) => { 
    setToast({ msg, err }); 
    setTimeout(() => setToast(null), 3500); 
  };

  const annotatedPaths = new Set(annotations.filter(a => a.field_path).map(a => a.field_path));
  const handleAnnotateField = (path, label) => setSelectedField({ path, label });

  // Gestionnaire pour l'approbation du rapport
  const handleValidate = async () => {
    if (!onValidate || isValidating || validating) return;
    setIsValidating(true);
    try {
      const result = await onValidate(report?.id);
      if (result?.success) {
        showToast('✅ Rapport approuvé avec succès');
      } else {
        showToast(result?.error || 'Erreur lors de l\'approbation', true);
      }
    } catch (error) {
      showToast('Erreur lors de l\'approbation', true);
      console.error(error);
    } finally {
      setIsValidating(false);
    }
  };

  // Gestionnaire pour le rejet du rapport avec demande de motif
  const handleReject = async () => {
    if (!onReject || isRejecting || rejecting) return;
    
    // Demander un motif avant de rejeter
    const reason = prompt('Motif du rejet :', 'Données insuffisantes ou non conformes');
    if (!reason) return;
    
    setIsRejecting(true);
    try {
      const result = await onReject(report?.id, reason);
      if (result?.success) {
        showToast('❌ Rapport rejeté');
      } else {
        showToast(result?.error || 'Erreur lors du rejet', true);
      }
    } catch (error) {
      showToast('Erreur lors du rejet', true);
      console.error(error);
    } finally {
      setIsRejecting(false);
    }
  };

  // Vérifier si le rapport est déjà dans un état final
  const isFinalized = report?.status === 'validé' || report?.status === 'rejeté' || report?.status === 'clôturé';
  const isDisabled = isFinalized || isValidating || isRejecting || validating || rejecting;

  return (
    <div className="tri-root">
      {toast && <div className={`tri-toast ${toast.err ? 'error' : ''}`}>{toast.msg}</div>}

      {/* ── Col gauche: Toutes les annexes (données brutes) ── */}
      <div className="tri-left-col">
        <div className="tri-card">
          <div className="tri-card-head">
            <h3>📂 Données brutes du rapport</h3>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              {report?.organism_name || report?.compliance_details?.company?.name || '—'}
            </span>
          </div>
          <LeftAnnexesViewer report={report} />
          
          {/* Barre d'actions - Conditionnelle selon les props */}
          {onValidate && onReject && (
            <div className="tri-approve-bar">
              <button
  className="tri-btn-approve"
  onClick={() => {
    onValidate(report.id);
    showToast('📤 Rapport soumis au responsable pour validation finale.');
  }}
  disabled={report?.status === 'en_validation' || report?.status === 'validé'}
>
  {report?.status === 'en_validation' ? '⏳ En attente responsable' : '✓ Soumettre au responsable'}
</button>
              <button 
                className="tri-btn-reject-main"
                onClick={handleReject}
                disabled={isDisabled}
                style={{ opacity: isDisabled ? 0.5 : 1, cursor: isDisabled ? 'not-allowed' : 'pointer' }}
              >
                {isRejecting || rejecting ? '⏳ Rejet...' : '✕ Rejeter'}
              </button>
            </div>
          )}
          
          {/* Indicateur de statut si le rapport est finalisé */}
          {isFinalized && (
            <div style={{ 
              padding: '10px 16px', 
              background: report?.status === 'validé' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              borderTop: '1px solid rgba(139,92,246,0.1)',
              textAlign: 'center',
              fontSize: 12,
              fontWeight: 600,
              color: report?.status === 'validé' ? '#34d399' : '#f87171'
            }}>
              {report?.status === 'validé' ? '✓ Rapport approuvé' : '✗ Rapport rejeté'}
            </div>
          )}
        </div>
      </div>

      {/* ── Col droite: Synthèse extraite ── */}
      <div className="tri-right-col">
        <div className="tri-card" style={{ marginBottom: 20 }}>
          <div className="tri-card-head">
            <h3>📊 Données extraites du rapport</h3>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              {report?.organism_name || report?.compliance_details?.company?.name || '—'}
            </span>
          </div>
          <div className="tri-panel">
            <SynthesisPanel 
              report={report} 
              annotatedPaths={annotatedPaths} 
              onAnnotateField={handleAnnotateField} 
            />
          </div>
        </div>

        {/* Annotations */}
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