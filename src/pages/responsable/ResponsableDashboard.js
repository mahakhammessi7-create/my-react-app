import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReportsRealtime } from "../../hooks/useReportsRealtime";
import { useAssignReport } from "../../hooks/useAssignReport";
import supabase from '../../lib/supabaseClient';
import { ResponsableOperationnelView, ResponsableDecideurView } from './ResponsableComplexDashboard';
import { useSharedDashboard } from "../../hooks/useSharedDashboard";

/* ═══════════════════════════════════════════════════════════════════
   GÉNÉRATEUR D'ANNOTATIONS CONTEXTUELLES (Auto-QA)
   → Garantit la fiabilité des données avant affichage
═══════════════════════════════════════════════════════════════════ */
function generateAutoAnnotations(report) {
  if (!report) return [];
  const anns = [];
  let id = 1;

  const add = (type, target, text) =>
    anns.push({ 
      id: `auto_${id++}`, 
      type, 
      target, 
      text, 
      author: report.assigned_to || report.charge_name || "Chargé d'étude", 
      sent_at: report.sent_to_resp_at || report.upload_date, 
      created_at: report.upload_date,
      status: 'sent', 
      isAuto: true 
    });

  if (report.compliance_score != null) {
    const s = report.compliance_score;
    add('remarque', 'État de maturité',
      s >= 75 ? `Score de conformité satisfaisant (${s}%). L'organisme présente un bon niveau de maturité globale.`
      : s >= 55 ? `Score de conformité moyen (${s}%). Des axes d'amélioration significatifs ont été identifiés.`
      : `Score de conformité insuffisant (${s}%). L'organisme présente des lacunes importantes en matière de sécurité.`
    );
  }

  if (report.maturity_level != null) {
    add('remarque', 'État de maturité',
      `Niveau de maturité ${report.maturity_level}/5 atteint. ${
        report.maturity_level >= 4 ? 'Les processus de sécurité sont bien maîtrisés et documentés.'
        : report.maturity_level >= 3 ? 'Les processus existent mais nécessitent une meilleure formalisation.'
        : 'Les processus de sécurité sont peu formalisés et insuffisamment documentés.'
      }`
    );
  }

  if (report.total_servers != null || report.total_workstations != null) {
    add('remarque', 'Description du SI',
      `Le système d'information comprend ${report.total_servers ?? '?'} serveur(s) et ${report.total_workstations ?? '?'} poste(s) de travail pour ${report.user_count ?? '?'} utilisateur(s).`
    );
  }

  if (report.patch_compliance_pct != null) {
    add('remarque', 'Description du SI',
      `Taux de conformité des correctifs : ${report.patch_compliance_pct}%. ${
        report.patch_compliance_pct >= 90 ? 'La politique de mise à jour est bien appliquée.'
        : report.patch_compliance_pct >= 70 ? 'Des efforts de mise à jour restent à accomplir.'
        : 'La gestion des correctifs est insuffisante et représente un risque élevé.'
      }`
    );
  }

  if (report.has_datacenter != null) {
    add('remarque', 'Infrastructure',
      report.has_datacenter
        ? `L'organisme dispose de son propre datacenter${report.dc_tier_level ? ` (Tier ${report.dc_tier_level})` : ''}.`
        : "L'organisme n'a pas de datacenter propre. L'hébergement est externalisé."
    );
  }

  if (report.has_rssi === false) {
    add('reserve', 'Gouvernance',
      "Absence de RSSI nommé. L'organisme ne dispose pas d'un responsable de la sécurité des systèmes d'information, ce qui fragilise la gouvernance sécurité."
    );
  }

  if (report.has_pssi === false) {
    add('reserve', 'Gouvernance',
      "Absence de Politique de Sécurité des Systèmes d'Information (PSSI). Aucun cadre formel de sécurité n'a été établi."
    );
  } else if (report.pssi_updated_within_2y === false) {
    add('reserve', 'Gouvernance',
      "La PSSI existe mais n'a pas été mise à jour depuis plus de 2 ans. Sa pertinence face aux menaces actuelles est à réévaluer."
    );
  }

  if (report.pca_test_done === false && report.has_pca === true) {
    add('reserve', 'Continuité & Sauvegarde',
      "Un Plan de Continuité d'Activité (PCA) est en place mais n'a jamais été testé. Son efficacité réelle ne peut être garantie."
    );
  }

  if (report.has_pca === false) {
    add('reserve', 'Continuité & Sauvegarde',
      "Absence de Plan de Continuité d'Activité (PCA) et/ou de Plan de Reprise d'Activité (PRA). L'organisme est vulnérable en cas d'incident majeur."
    );
  }

  if (report.vuln_scan_done === false) {
    add('reserve', 'Vulnérabilités & Incidents',
      "Aucun scan de vulnérabilités n'a été réalisé. L'exposition aux menaces techniques n'a pas été évaluée."
    );
  }

  if (report.critical_vulns_open != null && report.critical_vulns_open > 0) {
    add('reserve', 'Vulnérabilités & Incidents',
      `${report.critical_vulns_open} vulnérabilité(s) critique(s) non corrigée(s) détectée(s). Ces failles représentent un risque immédiat pour la sécurité du SI.`
    );
  }

  if (report.eol_workstations != null && report.eol_workstations > 0) {
    add('reserve', 'Infrastructure',
      `${report.eol_workstations} poste(s) de travail en fin de vie (EOL) toujours en production. Ces équipements ne reçoivent plus de mises à jour de sécurité.`
    );
  }

  if (report.eol_servers != null && report.eol_servers > 0) {
    add('reserve', 'Infrastructure',
      `${report.eol_servers} serveur(s) en fin de vie (EOL). Une migration urgente est nécessaire pour éviter une exposition aux vulnérabilités non corrigées.`
    );
  }

  if (report.mfa_enabled === false) {
    add('reserve', 'Sécurité des accès',
      "L'authentification multi-facteurs (MFA) n'est pas activée. Les accès aux systèmes sensibles ne sont protégés que par un simple mot de passe."
    );
  }

  if (report.backup_tested === false) {
    add('reserve', 'Continuité & Sauvegarde',
      "Les sauvegardes ne sont pas testées régulièrement. La capacité réelle de restauration des données n'est pas garantie."
    );
  }

  if (report.network_segmentation === false) {
    add('reserve', 'Infrastructure',
      "Absence de segmentation réseau. En cas de compromission, la propagation latérale d'une menace n'est pas limitée."
    );
  }

  if (report.has_rssi === false) {
    add('recommandation', 'Gouvernance',
      "Nommer un RSSI (Responsable de la Sécurité des Systèmes d'Information) ou désigner un référent sécurité avec des attributions clairement définies. Priorité : P1."
    );
  }

  if (report.has_pssi === false || report.pssi_updated_within_2y === false) {
    add('recommandation', 'Gouvernance',
      "Élaborer ou mettre à jour la PSSI en impliquant la direction. La politique doit couvrir la classification des données, la gestion des accès et la réponse aux incidents. Priorité : P1."
    );
  }

  if (report.vuln_scan_done === false || (report.critical_vulns_open != null && report.critical_vulns_open > 0)) {
    add('recommandation', 'Vulnérabilités',
      `Planifier un scan de vulnérabilités complet du SI${report.critical_vulns_open > 0 ? ` et corriger en priorité les ${report.critical_vulns_open} vulnérabilité(s) critique(s) identifiée(s)` : ''}. Priorité : P1.`
    );
  }

  if (report.mfa_enabled === false) {
    add('recommandation', 'Sécurité des accès',
      "Déployer l'authentification multi-facteurs (MFA) sur l'ensemble des accès distants et comptes privilégiés dans un délai de 3 mois. Priorité : P1."
    );
  }

  if (!report.has_pca || report.pca_test_done === false) {
    add('recommandation', "Continuité d'activité",
      `${!report.has_pca ? "Mettre en place un PCA/PRA documenté et validé par la direction." : "Programmer un exercice de test du PCA avec simulation de sinistre."} Fréquence recommandée : annuelle. Priorité : P2.`
    );
  }

  if (report.backup_tested === false || report.backup_offsite === false) {
    add('recommandation', 'Sauvegarde',
      `${report.backup_offsite === false ? "Mettre en place des sauvegardes hors-site pour se prémunir des sinistres locaux. " : ''}${report.backup_tested === false ? "Tester les procédures de restauration au moins une fois par an." : ''} Priorité : P2.`
    );
  }

  if (report.eol_workstations > 0 || report.eol_servers > 0) {
    add('recommandation', 'Infrastructure',
      `Établir un plan de remplacement des équipements en fin de vie (${[
        report.eol_workstations > 0 ? `${report.eol_workstations} poste(s)` : '',
        report.eol_servers > 0 ? `${report.eol_servers} serveur(s)` : '',
      ].filter(Boolean).join(', ')}). Priorité selon criticité des systèmes concernés.`
    );
  }

  if (report.staff_ssi_trained_pct != null && report.staff_ssi_trained_pct < 50) {
    add('recommandation', 'Formation',
      `Seuls ${report.staff_ssi_trained_pct}% du personnel est formé à la SSI. Mettre en place un plan de sensibilisation annuel pour atteindre au moins 80% du personnel formé. Priorité : P2.`
    );
  }

  if (report.pentest_done === false) {
    add('recommandation', 'Sécurité offensive',
      "Réaliser un test d'intrusion (pentest) par un prestataire externe qualifié pour évaluer la résistance réelle du SI aux attaques. Fréquence recommandée : tous les 2 ans. Priorité : P3."
    );
  }

  if (report.encryption_at_rest === false) {
    add('recommandation', 'Protection des données',
      "Mettre en place le chiffrement des données au repos, en particulier pour les données sensibles et les sauvegardes. Priorité : P2."
    );
  }

  return anns.sort((a, b) => {
    const order = { recommandation: 1, reserve: 2, remarque: 3 };
    return (order[a.type] || 4) - (order[b.type] || 4);
  });
}

function useReportAnnotations(reportId, report) {
  const [realAnnotations, setRealAnnotations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!reportId) return;
    setLoading(true);
    supabase
      .from('report_annotations')
      .select('*')
      .eq('report_id', reportId)
      .eq('status', 'sent')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => { 
        if (!error) setRealAnnotations(data || []); 
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [reportId]);

  const hasRealAnnotations = realAnnotations.length > 0;
  const annotations = hasRealAnnotations
    ? realAnnotations
    : generateAutoAnnotations(report);

  return { 
    annotations, 
    loading, 
    isAuto: !hasRealAnnotations && annotations.length > 0,
    hasRealAnnotations
  };
}

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
      radial-gradient(ellipse 80% 50% at 10% -10%, rgba(16,185,129,.08) 0%, transparent 55%),
      radial-gradient(ellipse 60% 40% at 90% 100%, rgba(59,130,246,.06) 0%, transparent 55%),
      radial-gradient(circle at 50% 50%, rgba(16,185,129,.02) 0%, transparent 70%),
      linear-gradient(rgba(16,185,129,.012) 1px,transparent 1px),
      linear-gradient(90deg,rgba(16,185,129,.012) 1px,transparent 1px);
    background-size: 100% 100%, 100% 100%, 100% 100%, 48px 48px, 48px 48px;
  }

  .rd-wrap { position:relative; z-index:1; max-width:1520px; margin:0 auto; padding:28px 32px 80px; }
  .rd-top { display:flex; align-items:center; justify-content:space-between; gap:20px; flex-wrap:wrap; margin-bottom:32px; padding-bottom:20px; border-bottom:1px solid rgba(255,255,255,.05); }
  .rd-brand { display:flex; align-items:center; gap:16px; }
  .rd-brand-icon { width:52px; height:52px; border-radius:16px; background:linear-gradient(135deg,var(--g3),var(--g)); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 0 32px rgba(16,185,129,.3), 0 4px 12px rgba(0,0,0,.2); }
  .rd-brand-icon svg { width:24px; height:24px; }
  .rd-brand-role  { font-size:10.5px; letter-spacing:.18em; text-transform:uppercase; color:var(--txt3); font-weight:600; margin-bottom:2px; }
  .rd-brand-title { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; color:#e8fff6; letter-spacing:-.3px; }
  .rd-top-actions { display:flex; gap:10px; align-items:center; }
  .rd-logout-btn { border:1px solid rgba(16,185,129,.2); background:rgba(16,185,129,.06); color:var(--g); border-radius:12px; padding:10px 18px; font-size:13px; font-weight:600; cursor:pointer; transition:all .2s; font-family:'DM Sans',sans-serif; }
  .rd-logout-btn:hover { background:rgba(16,185,129,.12); border-color:rgba(16,185,129,.35); }
  .rd-date-pill { background:rgba(255,255,255,.04); border:1px solid var(--border); border-radius:10px; padding:7px 14px; font-size:12px; color:var(--txt2); }

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

  .rd-stats { display:grid; grid-template-columns:repeat(5,1fr); gap:14px; margin-bottom:28px; }
  .rd-stat { background:linear-gradient(145deg, rgba(255,255,255,.035) 0%, rgba(255,255,255,.015) 100%); border:1px solid var(--border); border-radius:20px; padding:20px 22px; position:relative; overflow:hidden; transition:all .3s ease; cursor:default; box-shadow:0 4px 20px rgba(0,0,0,.12); }
  .rd-stat::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; border-radius:3px 3px 0 0; opacity:.8; }
  .rd-stat:hover { border-color:rgba(16,185,129,.25); transform:translateY(-2px); box-shadow:0 8px 32px rgba(0,0,0,.2); }
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

  .rd-tabs { display:flex; gap:4px; margin-bottom:28px; border-bottom:1px solid rgba(255,255,255,.06); padding-bottom:2px; }
  .rd-tab { border:none; background:none; color:var(--txt3); font-size:13px; font-weight:600; padding:12px 20px; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-2px; transition:all .25s ease; font-family:'DM Sans',sans-serif; letter-spacing:.02em; display:flex; align-items:center; gap:8px; border-radius:8px 8px 0 0; }
  .rd-tab:hover { color:var(--txt2); background:rgba(255,255,255,.03); }
  .rd-tab.active { color:var(--g); border-bottom-color:var(--g); background:rgba(16,185,129,.04); }
  .rd-tab-badge { background:rgba(16,185,129,.15); color:var(--g); border-radius:999px; padding:1px 7px; font-size:10px; font-weight:700; }
  .rd-tab-badge.new { background:rgba(245,158,11,.2); color:var(--amb); animation:pulse 1.5s infinite; }

  .rd-panel { background:linear-gradient(145deg, rgba(255,255,255,.03) 0%, rgba(255,255,255,.01) 100%); border:1px solid var(--border); border-radius:20px; overflow:hidden; transition:border-color .3s ease; box-shadow:0 4px 24px rgba(0,0,0,.1); }
  .rd-panel:hover { border-color:rgba(255,255,255,.1); }
  .rd-panel-hd { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; border-bottom:1px solid rgba(255,255,255,.06); }
  .rd-panel-hd h2 { font-size:14px; font-weight:700; color:#dff8ee; letter-spacing:.02em; }
  .rd-panel-bd { padding:20px 24px; }

  .rd-grid-2   { display:grid; grid-template-columns:1.7fr 1fr; gap:20px; }
  .rd-grid-3   { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
  .rd-grid-2eq { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .rd-grid-4   { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }

  .rd-table { width:100%; border-collapse:collapse; text-align:left; }
  .rd-table th { font-size:11px; text-transform:uppercase; letter-spacing:.13em; color:var(--txt3); padding:14px 20px; border-bottom:1px solid rgba(255,255,255,.06); font-weight:700; white-space:nowrap; }
  .rd-table td { padding:16px 20px; font-size:13px; border-bottom:1px solid rgba(255,255,255,.04); vertical-align:middle; }
  .rd-table tr { transition:background .12s; }
  .rd-table tr:hover td { background:rgba(16,185,129,.05); }
  .rd-table tr.selected td { background:rgba(16,185,129,.09); }
  .rd-table tr:last-child td { border-bottom:none; }
  .rd-table tr.is-new td { background:rgba(16,185,129,.07); }
  .rd-table tr.is-new:hover td { background:rgba(16,185,129,.11); }

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
  .rd-badge.pending { background:rgba(99,102,241,.12); color:#818cf8; }
  .rd-badge.pending .rd-badge-dot { background:#818cf8; box-shadow:0 0 5px #818cf8; }
  .rd-badge.cloture { background:rgba(16,185,129,.2); color:#6ee7b7; border:1px solid rgba(16,185,129,.4); }
  .rd-badge.cloture .rd-badge-dot { background:#6ee7b7; box-shadow:0 0 8px #6ee7b7; }
  .rd-badge.new-pill { background:rgba(16,185,129,.2); color:var(--g2); border:1px solid rgba(16,185,129,.3); font-size:9px; padding:2px 7px; }

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

  .rd-btn { border:none; border-radius:12px; padding:10px 18px; font-size:13px; font-weight:700; cursor:pointer; transition:all .25s ease; font-family:'DM Sans',sans-serif; letter-spacing:.01em; }
  .rd-btn.primary { background:linear-gradient(135deg,var(--g),var(--g3)); color:#f0fff8; box-shadow:0 4px 16px rgba(16,185,129,.25); }
  .rd-btn.primary:hover { filter:brightness(1.15); transform:translateY(-2px); box-shadow:0 6px 24px rgba(16,185,129,.35); }
  .rd-btn.primary:disabled { opacity:.4; cursor:not-allowed; transform:none; filter:none; box-shadow:none; }
  .rd-btn.ghost  { background:rgba(255,255,255,.05); color:var(--txt2); border:1px solid rgba(255,255,255,.1); }
  .rd-btn.ghost:hover { background:rgba(255,255,255,.1); border-color:rgba(255,255,255,.15); transform:translateY(-1px); }
  .rd-btn.sm { padding:6px 12px; font-size:11px; border-radius:8px; }

  .rd-select, .rd-input, .rd-textarea { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); color:var(--txt); border-radius:10px; padding:9px 12px; font-size:13px; font-family:'DM Sans',sans-serif; outline:none; transition:border .2s; width:100%; }
  .rd-select:focus, .rd-input:focus, .rd-textarea:focus { border-color:rgba(16,185,129,.4); background:rgba(16,185,129,.04); }
  .rd-select option { background:#0c1f1a; }
  .rd-textarea { resize:vertical; min-height:72px; }
  .rd-label { font-size:10.5px; text-transform:uppercase; letter-spacing:.13em; color:var(--txt3); font-weight:700; margin-bottom:6px; display:block; }
  .rd-field { margin-bottom:14px; }

  .rd-search-wrap { position:relative; }
  .rd-search-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); font-size:13px; pointer-events:none; }
  .rd-search { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:11px; padding:9px 14px 9px 36px; color:var(--txt); font-size:13px; font-family:'DM Sans',sans-serif; outline:none; width:220px; transition:border-color .2s; }
  .rd-search::placeholder { color:var(--txt3); }
  .rd-search:focus { border-color:rgba(16,185,129,.35); }
  .rd-filter-select { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:11px; padding:9px 14px; color:var(--txt2); font-size:13px; font-family:'DM Sans',sans-serif; outline:none; cursor:pointer; }
  .rd-filter-select option { background:#0c1f1a; }

  .rd-detail-section { background:rgba(16,185,129,.04); border:1px solid rgba(16,185,129,.1); border-radius:14px; padding:14px 16px; margin-bottom:12px; }
  .rd-detail-section h3 { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:#4d9e82; margin-bottom:10px; }
  .rd-detail-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:7px; }
  .rd-detail-key { font-size:12px; color:var(--txt3); }
  .rd-detail-val { font-size:13px; font-weight:600; color:#c8eed8; }

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

  .rd-progress-wrap { background:rgba(255,255,255,.07); border-radius:999px; height:5px; overflow:hidden; }
  .rd-progress-fill { height:100%; border-radius:999px; background:linear-gradient(90deg,var(--g),var(--g2)); transition:width .5s cubic-bezier(.4,0,.2,1); }

  .rd-kpi-card { background:rgba(16,185,129,.05); border:1px solid rgba(16,185,129,.13); border-radius:14px; padding:14px 16px; margin-bottom:12px; }
  .rd-kpi-header { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:8px; }
  .rd-kpi-name { font-size:13px; font-weight:700; color:#b0f0d8; }
  .rd-kpi-formula { font-size:11px; color:var(--txt3); font-family:monospace; background:rgba(0,0,0,.2); padding:5px 8px; border-radius:6px; margin-top:4px; word-break:break-all; }
  .rd-kpi-value { font-size:22px; font-weight:800; font-family:'Syne',sans-serif; color:var(--g); margin-top:8px; }
  .rd-kpi-del { background:none; border:none; color:var(--txt3); cursor:pointer; font-size:18px; padding:0; transition:color .15s; line-height:1; }
  .rd-kpi-del:hover { color:#f87171; }

  .rd-charge-row { display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid rgba(255,255,255,.05); }
  .rd-charge-row:last-child { border-bottom:none; }
  .rd-charge-avatar { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:#f0fff8; flex-shrink:0; }
  .rd-charge-info  { flex:1; }
  .rd-charge-name  { font-size:13px; font-weight:600; color:#c8eed8; margin-bottom:4px; }
  .rd-charge-count { font-size:14px; font-weight:800; color:var(--g); min-width:30px; text-align:right; }

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

const initials = name => {
  if (!name) return '??';
  const str = String(name);
  if (/^\d+$/.test(str)) return '??';
  return str.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
};

const scoreColor    = s => s >= 75 ? 'rd-score-green' : s >= 55 ? 'rd-score-amber' : 'rd-score-red';

const STATUS_MAP = {
  'déposé': 'déposé', 'depose': 'déposé',
  'assigné': 'assigné', 'assigne': 'assigné', 'assigned': 'assigné', 'affecte': 'assigné',
  'en_validation': 'en_validation', 'en validation': 'en_validation', 'envalidation': 'en_validation',
  'validé': 'validé', 'valide': 'validé', 'validated': 'validé',
  'clôturé': 'clôturé', 'cloturé': 'clôturé', 'cloture': 'clôturé',
  'rejeté': 'rejeté', 'rejete': 'rejeté', 'rejected': 'rejeté',
};

const normalizeReport = (r) => {
  const rawStatus = String(r.status || 'déposé').toLowerCase();
  return {
    ...r,
    status: STATUS_MAP[rawStatus] || rawStatus,
    assigned_to: r.assigned_charge_name || 
      (r.assigned_to && isNaN(Number(r.assigned_to)) ? r.assigned_to : ''),
    assigned_charge: r.assigned_charge || r.charge_id || null,
    priority: r.priority || 'Normale',
    deadline: r.deadline || r.due_date || '',
    company_name: r.company_name || r.organism_name || '—',
    sector: r.sector || r.organism_sector || '—',
    compliance_score: r.compliance_score || 0,
    upload_date: r.upload_date || r.created_at || '',
  };
};

const CheckIcon = () => (
  <svg viewBox="0 0 12 12" style={{width:11,height:11,fill:'none',stroke:'#f0fff8',strokeWidth:2.5,strokeLinecap:'round',strokeLinejoin:'round'}}>
    <polyline points="2,6 5,9 10,3"/>
  </svg>
);


function StatusBadge({ status }) {
  const map = {
    déposé: { cls: 'depose', label: 'Déposé' },
    depose: { cls: 'depose', label: 'Déposé' },
    assigné: { cls: 'affecte', label: 'Assigné' },
    assigned: { cls: 'affecte', label: 'Assigné' },
    affecte: { cls: 'affecte', label: 'Affecté' },
    en_validation: { cls: 'pending', label: 'En validation' },
    'en validation': { cls: 'pending', label: 'En validation' },
    validé: { cls: 'valide', label: 'Validé' },
    valide: { cls: 'valide', label: 'Validé' },
    clôturé: { cls: 'cloture', label: 'Clôturé ✓' },
    cloture: { cls: 'cloture', label: 'Clôturé ✓' },
    rejeté: { cls: 'rejete', label: 'Rejeté' },
    rejected: { cls: 'rejete', label: 'Rejeté' },
  };
  const cfg = map[status] || { cls: 'depose', label: status };
  return (
    <span className={`rd-badge ${cfg.cls}`}>
      <span className="rd-badge-dot"/>
      {cfg.label}
    </span>
  );
}

function BoutonAffecter({ rapport, chargesEtude, onAffecter, loading }) {
  const charge = chargesEtude.find(c => String(c.id) === String(rapport.assigned_charge) || c.full_name === rapport.assigned_to);
  const isAssigned = !!charge;
  return (
    <button
      className={`rd-btn-affecter ${isAssigned ? 'assigned' : ''}`}
      disabled={loading}
      onClick={(e) => { e.stopPropagation(); onAffecter(rapport); }}
      title={isAssigned ? 'Réaffecter' : "Affecter à un chargé d'étude"}
    >
      {isAssigned ? (
        <><span className="rd-btn-affecter-avatar">{initials(charge.full_name)}</span><span>{charge.full_name}</span><span style={{opacity:.55,fontSize:11}}>↺</span></>
      ) : (
        <><span style={{fontSize:14,lineHeight:1}}>+</span><span>Affecter</span></>
      )}
    </button>
  );
}

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
                    <p className="rd-charge-option-name">{c.full_name}{isCurrent && <span style={{fontSize:10,color:'var(--g)',marginLeft:6,fontWeight:700}}>ACTUEL</span>}</p>
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
          <button className="rd-btn primary" style={{padding:'8px 22px',fontSize:13}} disabled={!selectedId || loading} onClick={() => onConfirm(rapport.id, selectedId)}>
            {loading ? 'Affectation…' : '✓ Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}

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
        <div style={{fontSize:13,fontWeight:700,color:'#e8fff6',marginBottom:2}}>{count} nouveau{count>1?'x':''} rapport{count>1?'s':''}</div>
        <div style={{fontSize:11,color:'var(--txt2)'}}>{count>1?'Ils sont':'Il est'} en attente d'affectation</div>
      </div>
      <button onClick={onView} style={{background:'rgba(16,185,129,.18)',border:'1px solid rgba(16,185,129,.35)',borderRadius:8,color:'#e8fff6',fontSize:11,fontWeight:700,padding:'5px 10px',cursor:'pointer',whiteSpace:'nowrap'}}>Voir</button>
      <button onClick={() => { setOut(true); setTimeout(onDismiss, 350); }} style={{background:'none',border:'none',color:'var(--txt3)',cursor:'pointer',fontSize:15,padding:'0 4px',lineHeight:1}}>✕</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL - RESPONSABLE DASHBOARD
   Architecture: 4 onglets fonctionnels
═══════════════════════════════════════════════════════════════════ */
export default function ResponsableDashboard() {
  const navigate = useNavigate();

  const { reports: realtimeReports, loading: realtimeLoading, newCount, refresh } = useReportsRealtime(null);
  const { assignReport, rejectReport, fetchChargesEtude, chargesEtude, assigning } = useAssignReport();
  const { published, publishKpi, unpublish } = useSharedDashboard();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState('rapports');
  const [selectedId, setSelectedId] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastCount, setToastCount] = useState(0);
  const [modalRapport, setModalRapport] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filterSec, setFilterSec] = useState('All');
  const [filterStat, setFilterStat] = useState('All');
  const [validated, setValidated] = useState({});
  const [validationChecks, setValidationChecks] = useState({});
  const seenIdsRef = useRef(new Set());

  const [kpis, setKpis] = useState([
    { id: 1, name: 'Taux de validation', formula: '(validés / total) × 100', type: 'Taux (%)' },
    { id: 2, name: "Taux d'affectation", formula: '(affectés / total) × 100', type: 'Taux (%)' },
  ]);
  const [kpiForm, setKpiForm] = useState({ name: '', formula: '', type: KPI_TYPES[0] });
  const [formulaTokens, setFormulaTokens] = useState([]);
  const [publishStatus, setPublishStatus] = useState({});
  const [weightItems, setWeightItems] = useState(VALIDATION_CRITERIA.map(c => ({ id: c.id, label: c.label, weight: 20 })));

  // ── AUTH ──
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/responsable-login'); return; }
    try {
      const u = JSON.parse(stored);
      if (!isResponsable(u.role)) { navigate('/responsable-login'); return; }
    } catch { localStorage.clear(); navigate('/responsable-login'); return; }
    fetchChargesEtude();
  }, [navigate, fetchChargesEtude]);

  // ── SYNC REPORTS ──
  useEffect(() => {
    if (!realtimeReports) return;
    const normalized = realtimeReports.map(normalizeReport);
    const currentIds = new Set(normalized.map(r => r.id));
    const brandNewIds = [...currentIds].filter(id => !seenIdsRef.current.has(id));
    if (seenIdsRef.current.size > 0 && brandNewIds.length > 0) {
      setToastCount(brandNewIds.length);
      setShowToast(true);
    }
    brandNewIds.forEach(id => seenIdsRef.current.add(id));
    if (seenIdsRef.current.size === 0) currentIds.forEach(id => seenIdsRef.current.add(id));
    setReports(prev => normalized.map(r => {
      const existing = prev.find(p => String(p.id) === String(r.id));
      return existing ? { ...r, assigned_to: existing.assigned_to || r.assigned_to, assigned_charge: existing.assigned_charge || r.assigned_charge } : r;
    }));
    setLoading(realtimeLoading);
  }, [realtimeReports, realtimeLoading]);

  // ── STATS GLOBALES ──
  const total = reports.length;
  const STATUTS_TRAITES = new Set(['assigné', 'en_validation', 'validé', 'clôturé', 'rejeté']);
  const assignedCount = reports.filter(r => r.assigned_charge || r.assigned_to || STATUTS_TRAITES.has(r.status)).length;
  const unassignedCount = reports.filter(r => !r.assigned_charge && !r.assigned_to && !STATUTS_TRAITES.has(r.status)).length;
  const clotures = reports.filter(r => r.status === 'clôturé').length;
  const validatedCount = clotures + Object.values(validated).filter(Boolean).length;
  const enValidationCount = reports.filter(r => r.status === 'en_validation' || r.status === 'validé').length;
  const pendingCount = total - validatedCount;
  const validationRate = total ? Math.round(validatedCount / total * 100) : 0;
  const assignRate = total ? Math.round(assignedCount / total * 100) : 0;

  const enAttenteCount = useMemo(() => 
    reports.filter(r => ['en_validation', 'validé', 'clôturé'].includes(r.status)).length
  , [reports]);

  const sectors = ['All', ...new Set(reports.map(r => r.sector).filter(Boolean))];
  const statuses = ['All', 'déposé', 'assigné', 'en_validation', 'validé', 'rejeté', 'clôturé'];

  const filtered = useMemo(() => reports.filter(r => {
    const name = (r.company_name || '').toLowerCase();
    return name.includes(query.toLowerCase()) && (filterSec === 'All' || r.sector === filterSec) && (filterStat === 'All' || r.status === filterStat);
  }), [reports, query, filterSec, filterStat]);

  const selectedReport = useMemo(() => reports.find(r => String(r.id) === String(selectedId)) || null, [reports, selectedId]);

  // ── VALIDATION HANDLERS ──
  const handleValidate = async (reportId) => {
    try {
      const report = reports.find(r => String(r.id) === String(reportId));
      if (!report) throw new Error('Rapport non trouvé');
      const stored = localStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;
      // ✅ FIX: Cast reportId to Number for PostgREST compatibility
      // ✅ FIX: Set status to 'validé' instead of 'clôturé'
      const { error } = await supabase.from('reports').update({
        status: 'validé',
        cloture_at: new Date().toISOString(),
        cloture_by: user?.id ? Number(user.id) : null,
        cloture_name: user?.full_name || user?.name || null,
      }).eq('id', Number(reportId));
      if (!error) {
        setReports(prev => prev.map(r => String(r.id) === String(reportId) ? { ...r, status: 'validé' } : r));
        setValidated(prev => ({ ...prev, [reportId]: true }));
        if (report.assigned_charge) {
          await supabase.from('notifications').insert({
            user_id: Number(report.assigned_charge),
            type: 'rapport_valide',
            title: 'Rapport validé',
            message: `Le rapport "${report.company_name}" a été validé par le responsable QA.`,
            related_report_id: Number(reportId),
            is_read: false,
          });
        }
      }
    } catch (err) { console.error('Erreur lors de la validation:', err); }
  };

  const handleReject = async (reportId, reason = '') => {
    // ✅ FIX: Cast reportId to Number
    const { success, error } = await rejectReport(Number(reportId), reason);
    if (success) setReports(prev => prev.map(r => String(r.id) === String(reportId) ? { ...r, status: 'rejeté' } : r));
    else console.error('Rejet échoué:', error);
  };

  // ── AFFECTATION HANDLERS ──
  const openModal = (rapport) => { setModalRapport(rapport); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setModalRapport(null); };
  
  // ✅ FIX PRINCIPAL: handleConfirmAffectation avec casting explicite des IDs
  const handleConfirmAffectation = async (rapportId, chargeId) => {
    // Trouver le chargé en comparant les IDs en string (tolérant aux types)
    const charge = chargesEtude.find(c => String(c.id) === String(chargeId));
    if (!charge) {
      console.error('Chargé non trouvé pour ID:', chargeId);
      return;
    }

    try {
      // ✅ CAST EXPLICITE : PostgREST exige des nombres pour les colonnes integer
      const result = await assignReport(Number(rapportId), Number(chargeId));
      console.log('assignReport result:', result);
    } catch (e) {
      console.error('Assign failed:', e);
      return; // ← stop ici si ça plante, ne pas mettre à jour l'UI
    }

    // Mise à jour locale de l'UI (comparaison tolérante pour l'affichage)
    setReports(prev => prev.map(r => 
      String(r.id) === String(rapportId)
        ? { 
            ...r, 
            assigned_to: charge.full_name, 
            assigned_charge: chargeId, 
            status: r.status === 'déposé' ? 'assigné' : r.status 
          }
        : r
    ));
    
    closeModal();
    // ❌ REMOVED: setTimeout(refresh, 1200) ← il écrasait l'état local avec des données potentiellement obsolètes
  };

  // ── KPI HELPERS ──
  const evalKpi = (f) => {
    try {
      if (!f || typeof f !== 'string') return 0;
      const expr = f.replace(/validés/g, String(validatedCount)).replace(/affectés/g, String(assignedCount)).replace(/en_attente/g, String(pendingCount)).replace(/total/g, String(total || 1)).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
      const sanitized = expr.replace(/[^0-9+\-*/().\s]/g, '');
      if (!sanitized.trim()) return 0;
      // eslint-disable-next-line no-new-func
      const result = Function('"use strict";return (' + sanitized + ')')();
      if (!isFinite(result) || Number.isNaN(result)) return 0;
      return Math.round(result * 100) / 100;
    } catch { return 0; }
  };

  const addKpi = () => {
    if (!kpiForm.name.trim() || !kpiForm.formula.trim()) return;
    setKpis(prev => [...prev, { id: Date.now(), ...kpiForm }]);
    setKpiForm({ name: '', formula: '', type: KPI_TYPES[0] });
    setFormulaTokens([]);
  };

  const appendToken = tok => { setFormulaTokens(prev => [...prev, tok]); setKpiForm(p => ({ ...p, formula: [...formulaTokens, tok].join(' ') })); };

  const weightedScore = useMemo(() => {
    const totalW = weightItems.reduce((s, w) => s + Number(w.weight), 0);
    if (!totalW || !total) return 0;
    const completedW = VALIDATION_CRITERIA.reduce((s, c) => {
      const w = weightItems.find(x => x.id === c.id);
      const done = Object.values(validationChecks).filter(v => v[c.id]).length;
      return s + (done / total) * Number(w?.weight || 0);
    }, 0);
    return Math.round((completedW / totalW) * 100);
  }, [weightItems, validationChecks, total]);

  // ── PUBLISH KPI ──
  const publishKpiToDecideur = async (kpi) => {
    setPublishStatus(prev => ({ ...prev, [kpi.id]: 'publishing' }));
    const result = await publishKpi({ ...kpi, value: evalKpi(kpi.formula) });
    setPublishStatus(prev => ({ ...prev, [kpi.id]: result.success ? 'done' : 'error' }));
    setTimeout(() => setPublishStatus(prev => { const next = { ...prev }; delete next[kpi.id]; return next; }), 3000);
  };

  const handleLogout = () => { localStorage.clear(); navigate('/responsable-login'); };

  // ═════════════════════════════════════════════════════════════════
  //  ONGLET 1: RAPPORTS (Gestion + Affectation)
  // ═════════════════════════════════════════════════════════════════
  const TabRapports = () => {
    const newIds = realtimeReports ? new Set(realtimeReports.slice(0, newCount).map(r => r.id)) : new Set();
    return (
      <div style={{display:'flex',flexDirection:'column',gap:20}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:16,flexWrap:'wrap'}}>
          <div>
            <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:'#e8fff6',marginBottom:4}}>Rapports déposés</h1>
            <p style={{fontSize:13,color:'var(--txt3)'}}>{loading ? 'Chargement…' : `${filtered.length} rapport${filtered.length!==1?'s':''}`}{unassignedCount > 0 && (<span style={{marginLeft:8,color:'var(--amb)',fontWeight:600}}>· {unassignedCount} non affecté{unassignedCount>1?'s':''}</span>)}</p>
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <div className="rd-search-wrap"><span className="rd-search-icon">🔍</span><input className="rd-search" placeholder="Rechercher…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
            <select className="rd-filter-select" value={filterSec} onChange={e=>setFilterSec(e.target.value)}>{sectors.map(s=><option key={s} value={s}>{s==='All'?'Tous les secteurs':s}</option>)}</select>
            <select className="rd-filter-select" value={filterStat} onChange={e=>setFilterStat(e.target.value)}>{statuses.map(s=><option key={s} value={s}>{s==='All'?'Tous les statuts':s}</option>)}</select>
            <button className="rd-btn ghost" style={{padding:'8px 14px',fontSize:12}} onClick={refresh}>↻ Actualiser</button>
          </div>
        </div>
        <div className="rd-grid-2">
          <div className="rd-panel">
            <div className="rd-panel-hd"><h2>Liste des rapports</h2><div style={{display:'flex',gap:10,alignItems:'center'}}><span style={{fontSize:11,color:'var(--txt3)'}}>{filtered.length} total</span>{unassignedCount>0&&<span style={{fontSize:10,background:'rgba(245,158,11,.15)',color:'var(--amb)',padding:'2px 8px',borderRadius:99,fontWeight:700}}>{unassignedCount} à affecter</span>}</div></div>
            <div style={{overflowX:'auto'}}>
              {filtered.length===0 ? (<div className="rd-empty"><div style={{fontSize:28,marginBottom:12}}>📂</div>Aucun rapport trouvé</div>) : (
                <table className="rd-table">
                  <thead><tr><th>Organisme</th><th>Secteur</th><th>Déposé le</th><th>Score</th><th>Statut</th><th>Chargé d'étude</th></tr></thead>
                  <tbody>{filtered.map(r => { const isNew = newIds.has(r.id); return (<tr key={r.id} className={`${String(selectedId)===String(r.id)?'selected':''} ${isNew?'is-new':''}`} onClick={() => setSelectedId(r.id)} style={{cursor:'pointer'}}><td><div style={{display:'flex',alignItems:'center',gap:8}}><div><div style={{fontSize:13,fontWeight:600,color:'#e8fff6'}}>{r.company_name}{isNew&&<span className="rd-badge new-pill" style={{marginLeft:6}}>NEW</span>}</div><div style={{fontSize:11,color:'var(--txt3)',marginTop:2}}>#RPT-{String(r.id).padStart(4,'0')}</div></div></div></td><td style={{color:'var(--txt2)'}}>{r.sector}</td><td style={{color:'var(--txt2)'}}>{formatDate(r.upload_date)}</td><td><span className={scoreColor(r.compliance_score)} style={{fontSize:15}}>{r.compliance_score}%</span></td><td><StatusBadge status={r.status}/></td><td onClick={e=>e.stopPropagation()}><BoutonAffecter rapport={r} chargesEtude={chargesEtude} onAffecter={openModal} loading={assigning}/></td></tr>);})}</tbody>
                </table>
              )}
            </div>
          </div>
          <div className="rd-panel">
            <div className="rd-panel-hd"><h2>Détail & Affectation</h2></div>
            <div className="rd-panel-bd">{!selectedReport ? (<div className="rd-empty">Sélectionnez un rapport pour voir ses détails et l'affecter.</div>) : (<><div className="rd-detail-section"><h3>Informations du rapport</h3>{[['Organisme', selectedReport.company_name],['Secteur', selectedReport.sector],['Dépôt', formatDate(selectedReport.upload_date)]].map(([k,v]) => (<div key={k} className="rd-detail-row"><span className="rd-detail-key">{k}</span><span className="rd-detail-val">{v}</span></div>))}<div className="rd-detail-row"><span className="rd-detail-key">Score conformité</span><span className={scoreColor(selectedReport.compliance_score)} style={{fontSize:16}}>{selectedReport.compliance_score}%</span></div><div className="rd-detail-row"><span className="rd-detail-key">Statut</span><StatusBadge status={selectedReport.status}/></div>{selectedReport.maturity_level && (<div className="rd-detail-row"><span className="rd-detail-key">Niveau maturité</span><span className="rd-detail-val">Niveau {selectedReport.maturity_level}</span></div>)}</div><div className="rd-detail-section"><h3>Affectation</h3><p style={{fontSize:12,color:'var(--txt3)',marginBottom:10}}>Assignez ce rapport à un chargé d'étude pour traitement.</p><BoutonAffecter rapport={selectedReport} chargesEtude={chargesEtude} onAffecter={openModal} loading={assigning}/>{selectedReport.assigned_to && (<div style={{marginTop:10,padding:'9px 12px',background:'rgba(16,185,129,.07)',border:'1px solid rgba(16,185,129,.15)',borderRadius:9,fontSize:12,color:'var(--g)'}}>✓ Assigné à <strong>{selectedReport.assigned_to}</strong>{selectedReport.assigned_at && (<span style={{color:'var(--txt3)',marginLeft:8}}>le {formatDate(selectedReport.assigned_at)}</span>)}</div>)}</div><div className="rd-detail-section"><h3>Priorité & délai</h3><div className="rd-field"><label className="rd-label">Priorité</label><select className="rd-select" defaultValue={selectedReport.priority}>{PRIORITIES.map(p=><option key={p}>{p}</option>)}</select></div><div className="rd-field" style={{marginBottom:0}}><label className="rd-label">Date limite</label><input type="date" className="rd-input" defaultValue={selectedReport.deadline||''}/></div></div></>)}</div>
          </div>
        </div>
      </div>
    );
  };

  // ═════════════════════════════════════════════════════════════════
  //  ONGLET 2: VALIDATION QA (Garantie de fiabilité)
  // ═════════════════════════════════════════════════════════════════
  const TabValidation = () => {
    const enAttente = reports.filter(r => ['en_validation', 'validé', 'clôturé'].includes(r.status));
    const { annotations, loading: annLoading, isAuto, hasRealAnnotations } = useReportAnnotations(selectedId, selectedReport);
    const autoChecks = useMemo(() => {
      if (!selectedReport) return {};
      return { 
        integrite: annotations.length > 0, 
        biais: selectedReport.compliance_score != null, 
        coherence: selectedReport.maturity_level != null, 
        pertinence: selectedReport.has_rssi != null || selectedReport.has_pssi != null, 
        rigueur: selectedReport.status === 'en_validation' || selectedReport.status === 'validé', 
        sources: annotations.filter(a => a.type === 'recommandation').length > 0, 
        qualite: annotations.filter(a => a.type === 'reserve').length > 0 
      };
    }, [annotations]);
    const effectiveChecks = (rId) => ({ ...autoChecks, ...(validationChecks[rId] || {}) });
    const critChecksOk = (rId) => VALIDATION_CRITERIA.filter(c => c.severity === 'critique').every(c => effectiveChecks(rId)[c.id]);
    const checksDone = (rId) => VALIDATION_CRITERIA.filter(c => effectiveChecks(rId)[c.id]).length;
    const toggleCheckResp = (rId, cId) => { if (validated[rId]) return; setValidationChecks(prev => ({ ...prev, [rId]: { ...prev[rId], [cId]: !effectiveChecks(rId)[cId] } })); };
    const annColors = { remarque: '#a78bfa', reserve: '#fbbf24', recommandation: '#34d399' };
    const annBg = { remarque: 'rgba(139,92,246,.08)', reserve: 'rgba(245,158,11,.08)', recommandation: 'rgba(16,185,129,.08)' };
    const annBorder = { remarque: '#7c3aed', reserve: '#d97706', recommandation: '#059669' };
    const sel = selectedReport;
    const sevStyle = (s) => ({ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99, letterSpacing: '.04em', background: s === 'critique' ? 'rgba(239,68,68,.15)' : s === 'majeur' ? 'rgba(245,158,11,.12)' : 'rgba(100,116,139,.12)', color: s === 'critique' ? '#f87171' : s === 'majeur' ? '#fbbf24' : '#94a3b8' });
    return (
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ width: 340, flexShrink: 0 }}><div className="rd-panel" style={{ overflow: 'hidden' }}><div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.06)' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ fontSize: 13, fontWeight: 700, color: '#dff8ee' }}>Validation finale</span><span style={{ fontSize: 11, background: 'rgba(16,185,129,.12)', color: '#34d399', padding: '2px 9px', borderRadius: 99, fontWeight: 700 }}>{enAttente.length}</span></div><p style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 4 }}>Rapports soumis par les chargés d'étude</p></div>{enAttente.length === 0 ? (<div style={{ padding: '40px 20px', textAlign: 'center' }}><div style={{ fontSize: 32, marginBottom: 8 }}>✅</div><div style={{ fontSize: 13, color: 'var(--txt3)' }}>Aucun rapport en attente</div></div>) : (<div style={{ maxHeight: 600, overflowY: 'auto' }}>{enAttente.map(r => { const done = checksDone(r.id); const isSelected = String(selectedId) === String(r.id); const pct = Math.round(done / VALIDATION_CRITERIA.length * 100); const isValide = validated[r.id] || r.status === 'validé'; const isCloture = r.status === 'clôturé'; const isRejete = r.status === 'rejeté'; return (<div key={r.id} onClick={() => setSelectedId(r.id)} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,.04)', cursor: 'pointer', background: isSelected ? 'rgba(16,185,129,.06)' : 'transparent', borderLeft: isSelected ? '3px solid #10b981' : '3px solid transparent', transition: 'all .15s' }}><div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}><div style={{ minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600, color: '#e8fff6', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.company_name}</div><div style={{ fontSize: 10, color: 'var(--txt3)' }}>#RPT-{String(r.id).padStart(4, '0')} · {r.sector}</div></div>{isCloture ? (<span style={{ fontSize: 10, color: '#6ee7b7', fontWeight: 700, whiteSpace: 'nowrap' }}>✓ Clôturé</span>) : isValide ? (<span style={{ fontSize: 10, color: '#34d399', fontWeight: 700, whiteSpace: 'nowrap' }}>✓ Validé</span>) : isRejete ? (<span style={{ fontSize: 10, color: '#f87171', fontWeight: 700 }}>✕ Rejeté</span>) : (<StatusBadge status={r.status} />)}</div><div style={{ marginTop: 10 }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontSize: 10, color: 'var(--txt3)' }}>Checklist</span><span style={{ fontSize: 10, color: done === 7 ? '#34d399' : 'var(--txt3)', fontWeight: 600 }}>{done}/{VALIDATION_CRITERIA.length}</span></div><div style={{ height: 3, background: 'rgba(255,255,255,.08)', borderRadius: 99 }}><div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: pct === 100 ? '#10b981' : pct >= 57 ? '#3b82f6' : '#f59e0b', transition: 'width .3s' }} /></div></div>{r.assigned_to && (<div style={{ marginTop: 8, fontSize: 10, color: 'var(--txt3)', display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(16,185,129,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: '#34d399' }}>{initials(r.assigned_to)}</div>{r.assigned_to}</div>)}</div>);})}</div>)}</div></div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>{!sel ? (<div className="rd-panel" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--txt3)', fontSize: 13 }}><div style={{ fontSize: 36, marginBottom: 12, opacity: .4 }}>←</div>Sélectionnez un rapport pour commencer la validation</div>) : (<><div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(139,92,246,.15)', borderRadius: 16, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}><div><div style={{ fontSize: 18, fontWeight: 800, color: '#e8fff6', fontFamily: "'Syne',sans-serif" }}>{sel.company_name}</div><div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 3 }}>#RPT-{String(sel.id).padStart(4, '0')} · {sel.sector}{sel.assigned_to && <> · <span style={{ color: '#a78bfa' }}>{sel.assigned_to}</span></>}</div></div><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: sel.compliance_score >= 75 ? '#4ade80' : sel.compliance_score >= 55 ? '#fbbf24' : '#f87171' }}>{sel.compliance_score}%</div><div style={{ fontSize: 10, color: 'var(--txt3)' }}>Conformité</div></div><div style={{ width: 1, height: 32, background: 'rgba(255,255,255,.08)' }} /><div style={{ textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: '#a78bfa' }}>{sel.maturity_level ?? '—'}<span style={{ fontSize: 13 }}>/5</span></div><div style={{ fontSize: 10, color: 'var(--txt3)' }}>Maturité</div></div><StatusBadge status={sel.status} /></div></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}><div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '16px 18px' }}><div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 14 }}>Indicateurs clés</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{[{ label: 'RSSI', val: sel.has_rssi, bool: true }, { label: 'PSSI', val: sel.has_pssi, bool: true }, { label: 'MFA', val: sel.mfa_enabled, bool: true }, { label: 'PCA testé', val: sel.pca_test_done, bool: true }, { label: 'Pare-feu', val: sel.has_firewall, bool: true }, { label: 'ISO 27001', val: sel.iso27001_certified, bool: true }, { label: 'Vulns critiques', val: sel.critical_vulns_open != null ? String(sel.critical_vulns_open) : '—', bool: false }, { label: 'Nb serveurs', val: sel.total_servers != null ? String(sel.total_servers) : '—', bool: false }].map(({ label, val, bool }) => (<div key={label} style={{ padding: '8px 10px', background: 'rgba(255,255,255,.03)', borderRadius: 9, border: '1px solid rgba(255,255,255,.05)' }}><div style={{ fontSize: 10, color: 'var(--txt3)', marginBottom: 4 }}>{label}</div><div style={{ fontSize: 13, fontWeight: 600, color: bool ? (val === true ? '#34d399' : val === false ? '#f87171' : '#64748b') : '#e2e8f0' }}>{bool ? (val === true ? '✓ Oui' : val === false ? '✕ Non' : '—') : val}</div></div>))}</div></div><div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Annotations du chargé</span>{isAuto && (<span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(99,102,241,.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,.25)' }}>AUTO-GÉNÉRÉES • Basées sur les données</span>)}{hasRealAnnotations && (<span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(16,185,129,.12)', color: '#34d399', border: '1px solid rgba(16,185,129,.2)' }}>RAPPORT CHARGE</span>)}</div><div style={{ display: 'flex', gap: 5 }}>{['remarque', 'reserve', 'recommandation'].map(t => { const n = annotations.filter(a => a.type === t).length; return (<span key={t} style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: annBg[t], color: annColors[t] }}>{n}</span>); })}</div></div><div style={{ flex: 1, overflowY: 'auto', maxHeight: 230, display: 'flex', flexDirection: 'column', gap: 7 }}>{annLoading ? (<div style={{ fontSize: 12, color: 'var(--txt3)', textAlign: 'center', padding: '20px 0' }}>Chargement…</div>) : annotations.length === 0 ? (<div style={{ fontSize: 12, color: 'var(--txt3)', textAlign: 'center', padding: '20px 0', fontStyle: 'italic' }}>Aucune annotation disponible.</div>) : annotations.map(a => (<div key={a.id} style={{ padding: '9px 11px', background: annBg[a.type], borderLeft: `2px solid ${annBorder[a.type]}`, borderRadius: '0 8px 8px 0' }}><div style={{ fontSize: 9, fontWeight: 700, color: annColors[a.type], textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>{a.type} · {a.target}</div><div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 }}>{a.text}</div><div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 4 }}>{a.author} · {formatDate(a.sent_at || a.created_at)}{a.isAuto && <span style={{ marginLeft: 6, fontStyle: 'italic' }}>(auto-généré)</span>}</div></div>))}</div></div></div><div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '18px 20px' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}><span style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Checklist de validation QA</span><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 12, color: checksDone(sel.id) === 7 ? '#34d399' : 'var(--txt3)' }}>{checksDone(sel.id)}/{VALIDATION_CRITERIA.length} critères</span><div style={{ width: 80, height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 99 }}><div style={{ height: '100%', borderRadius: 99, background: '#10b981', width: `${Math.round(checksDone(sel.id) / VALIDATION_CRITERIA.length * 100)}%`, transition: 'width .3s' }} /></div></div></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>{VALIDATION_CRITERIA.map(c => { const checks = effectiveChecks(sel.id); const checked = !!checks[c.id]; const isAuto = !!autoChecks[c.id]; const isDone = validated[sel.id]; return (<div key={c.id} onClick={() => toggleCheckResp(sel.id, c.id)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: checked ? 'rgba(16,185,129,.06)' : 'rgba(255,255,255,.02)', border: `1px solid ${checked ? 'rgba(16,185,129,.2)' : 'rgba(255,255,255,.06)'}`, borderRadius: 10, cursor: 'pointer', transition: 'all .15s' }}><div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1, background: checked ? '#10b981' : 'rgba(255,255,255,.06)', border: `1.5px solid ${checked ? '#10b981' : 'rgba(255,255,255,.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{checked && <CheckIcon />}</div><div style={{ minWidth: 0 }}><div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}><span style={{ fontSize: 12, fontWeight: 600, color: checked ? '#e2e8f0' : '#94a3b8' }}>{c.label}</span><span style={sevStyle(c.severity)}>{c.severity}</span>{isAuto && checked && (<span style={{ fontSize: 9, color: '#34d399', fontWeight: 700 }}>auto</span>)}</div><div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2, lineHeight: 1.4 }}>{c.desc}</div></div></div>); })}</div>{sel.status === 'rejeté' && (<div style={{ padding: '13px 16px', background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#f87171', marginBottom: 12 }}>✕ Rapport rejeté — retourné au chargé d'étude</div>)}<div style={{ display: 'flex', gap: 10 }}><button style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', cursor: critChecksOk(sel.id) ? 'pointer' : 'not-allowed', background: critChecksOk(sel.id) ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,.05)', color: critChecksOk(sel.id) ? '#f0fff8' : '#475569', fontSize: 13, fontWeight: 700, transition: 'all .15s' }} disabled={!critChecksOk(sel.id)} title={!critChecksOk(sel.id) ? 'Les critères CRITIQUE doivent être cochés' : ''} onClick={() => handleValidate(sel.id)}>{validated[sel.id] || sel.status === 'validé' ? '✓ Déjà validé' : sel.status === 'clôturé' ? '✓ Déjà clôturé' : '✓ Accepter (Valider)'}</button><button style={{ padding: '11px 20px', borderRadius: 10, cursor: 'pointer', background: 'rgba(239,68,68,.1)', color: '#f87171', border: '1px solid rgba(239,68,68,.25)', fontSize: 13, fontWeight: 700, transition: 'all .15s' }} onClick={() => { const reason = window.prompt('Motif de rejet (optionnel) :') ?? ''; if (reason !== null) handleReject(sel.id, reason); }}>✕ Rejeter</button></div>{!critChecksOk(sel.id) && !validated[sel.id] && sel.status !== 'rejeté' && (<div style={{ marginTop: 10, fontSize: 11, color: '#f87171', textAlign: 'center' }}>Cochez les critères <strong>CRITIQUE</strong> (intégrité + absence de biais) pour débloquer la validation</div>)}</div></>)}</div>
      </div>
    );
  };

  // ═════════════════════════════════════════════════════════════════
  //  ONGLET 3: VUE DÉCIDEUR
  // ═════════════════════════════════════════════════════════════════
  const TabDecideur = () => <ResponsableDecideurView reports={reports} />;



  // ═════════════════════════════════════════════════════════════════
  //  ONGLET 4: KPIs (Définition des indicateurs de sécurité)
  // ═════════════════════════════════════════════════════════════════
  const TabIndicateurs = () => (
    <div className="rd-grid-2eq">
      <div className="rd-panel">
        <div className="rd-panel-hd">
          <h2>KPIs de sécurité définis</h2>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <span style={{ fontSize:11, color:'var(--txt3)' }}>{kpis.length} locaux</span>
            {published.filter(p => p.type === 'kpi').length > 0 && (<span style={{ fontSize:10, padding:'2px 8px', borderRadius:99, background:'rgba(16,185,129,.15)', color:'#34d399', fontWeight:700 }}>{published.filter(p => p.type === 'kpi').length} publiés ✓</span>)}
          </div>
        </div>
        <div className="rd-panel-bd">
          {kpis.map(k => {
            const status = publishStatus[k.id];
            const isPublished = published.some(p => p.name === k.name && p.type === 'kpi');
            return (<div key={k.id} className="rd-kpi-card"><div className="rd-kpi-header"><span className="rd-kpi-name">{k.name}</span><div style={{ display:'flex', gap:6 }}><button title={isPublished ? 'Déjà publié vers le Décideur' : 'Publier vers le Décideur'} onClick={() => publishKpiToDecideur(k)} disabled={status === 'publishing'} style={{ background: isPublished ? 'rgba(16,185,129,.12)' : status === 'done' ? 'rgba(16,185,129,.18)' : 'rgba(59,130,246,.1)', border: `1px solid ${isPublished || status === 'done' ? 'rgba(16,185,129,.4)' : 'rgba(59,130,246,.3)'}`, borderRadius:7, padding:'3px 9px', fontSize:11, fontWeight:700, color: isPublished || status === 'done' ? '#34d399' : '#60a5fa', cursor: status === 'publishing' ? 'wait' : 'pointer', transition:'all .2s' }}>{status === 'publishing' ? '↑ Envoi…' : status === 'done' ? '✓ Publié' : isPublished ? '✓ Partagé' : '↑ Publier'}</button><button className="rd-kpi-del" onClick={() => setKpis(p => p.filter(x => x.id !== k.id))}>×</button></div></div><div className="rd-kpi-formula">{k.formula}</div><div className="rd-kpi-value">{evalKpi(k.formula)}{k.type === 'Taux (%)' ? '%' : ''}</div>{isPublished && (<div style={{ fontSize:10, color:'#34d399', marginTop:4 }}>✓ Visible par le Décideur</div>)}</div>);
          })}
          <div style={{ marginTop:16, paddingTop:16, borderTop:'1px solid rgba(255,255,255,.07)' }}>
            <p className="rd-label" style={{ marginBottom:8 }}>Nouveau KPI de sécurité</p>
            <input className="rd-input" style={{ marginBottom:8 }} placeholder="ex: Taux d'organismes avec RSSI" value={kpiForm.name} onChange={e => setKpiForm(p => ({ ...p, name: e.target.value }))} />
            <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:8 }}>{['total','validés','affectés','en_attente','+','−','×','÷','(',')','/','100'].map(tok => (<button key={tok} onClick={() => appendToken(tok)} style={{ padding:'3px 8px', background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.2)', borderRadius:6, color:'#7eefc6', fontSize:11, cursor:'pointer', fontFamily:'monospace' }}>{tok}</button>))}<button onClick={() => { setFormulaTokens([]); setKpiForm(p => ({ ...p, formula: '' })); }} style={{ padding:'3px 8px', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', borderRadius:6, color:'#f87171', fontSize:11, cursor:'pointer' }}>✕</button></div>
            <input className="rd-input" style={{ marginBottom:8 }} placeholder="Formule: (validés / total) × 100" value={kpiForm.formula} onChange={e => setKpiForm(p => ({ ...p, formula: e.target.value }))} />
            <select className="rd-select" style={{ marginBottom:10 }} value={kpiForm.type} onChange={e => setKpiForm(p => ({ ...p, type: e.target.value }))}>{KPI_TYPES.map(t => <option key={t}>{t}</option>)}</select>
            <button className="rd-btn primary" style={{ width:'100%' }} onClick={addKpi}>Ajouter l'indicateur</button>
          </div>
        </div>
      </div>
      <div className="rd-panel">
        <div className="rd-panel-hd"><h2>Pondération des critères QA</h2></div>
        <div className="rd-panel-bd">
          <div style={{ marginBottom:12, fontSize:12, color:'var(--txt3)' }}>Score qualité global : <strong style={{ color:'#a78bfa' }}>{weightedScore}%</strong></div>
          {weightItems.map(w => (<div key={w.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}><span style={{ flex:1, fontSize:12, color:'#c8eed8' }}>{w.label}</span><input type="number" min="0" max="100" value={w.weight} onChange={e => setWeightItems(p => p.map(x => x.id === w.id ? { ...x, weight: Number(e.target.value) } : x))} style={{ width:55, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'5px 8px', color:'var(--txt)', fontSize:12, outline:'none' }} /><span style={{ fontSize:11, color:'var(--txt3)', width:20 }}>%</span></div>))}
        </div>
      </div>
      <div className="rd-panel" style={{ marginTop:16, gridColumn:'1 / -1' }}>
        <div className="rd-panel-hd"><h2>📤 Indicateurs partagés avec le Décideur</h2><span style={{ fontSize:11, color:'var(--txt3)' }}>{published.length} élément{published.length !== 1 ? 's' : ''}</span></div>
        <div className="rd-panel-bd">{published.length === 0 ? (<div className="rd-empty">Aucun indicateur partagé. Utilisez le bouton "Publier" sur un KPI pour le rendre visible au Décideur.</div>) : (<div style={{ display:'flex', flexDirection:'column', gap:8 }}>{published.map(p => (<div key={p.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background: p.type === 'kpi' ? 'rgba(16,185,129,.05)' : 'rgba(59,130,246,.05)', border: `1px solid ${p.type === 'kpi' ? 'rgba(16,185,129,.15)' : 'rgba(59,130,246,.15)'}`, borderRadius:10 }}><div><span style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color: p.type === 'kpi' ? '#34d399' : '#60a5fa', marginRight:8 }}>{p.type === 'kpi' ? 'KPI' : 'Tableau de bord'}</span><span style={{ fontSize:13, fontWeight:600, color:'#c8eed8' }}>{p.name}</span><div style={{ fontSize:10, color:'var(--txt3)', marginTop:2 }}>Partagé par {p.created_by} · {new Date(p.created_at).toLocaleDateString('fr-FR')}</div></div><button onClick={() => unpublish(p.id)} style={{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:7, padding:'4px 10px', fontSize:11, fontWeight:700, color:'#f87171', cursor:'pointer' }}>Retirer</button></div>))}</div>)}</div>
      </div>
    </div>
  );

  // ═════════════════════════════════════════════════════════════════
  //  CONFIGURATION DES ONGLETS
  // ═════════════════════════════════════════════════════════════════
  const TABS = [
    { key:'rapports',     label:'Rapports',           icon:'≡', badge:total, badgeNew: unassignedCount > 0 },
    { key:'validation',   label:'Validation QA',      icon:'✓', badge:enAttenteCount },
    { key:'decideur',     label:'Vue Décideur',       icon:'📊' },
    
    { key:'indicateurs',  label:'KPIs Sécurité',      icon:'∿', badge:kpis.length },
  ];

  // ═════════════════════════════════════════════════════════════════
  //  RENDU PRINCIPAL
  // ═════════════════════════════════════════════════════════════════
  return (
    <div className="rd-root">
      <style>{CSS}</style>
      {showToast && <NewReportToast count={toastCount} onDismiss={() => setShowToast(false)} onView={() => { setSection('rapports'); setShowToast(false); }} />}
      <ModalAffectation rapport={modalRapport} chargesEtude={chargesEtude} isOpen={modalOpen} onClose={closeModal} onConfirm={handleConfirmAffectation} loading={assigning} />
      <div className="rd-wrap">
        {/* ── TOPBAR ── */}
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
            <button className="rd-btn ghost" style={{padding:'8px 14px',fontSize:12}} onClick={refresh}>↻ Actualiser</button>
            <button className="rd-logout-btn" onClick={handleLogout}>Déconnexion</button>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
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
            <div className="rd-stat-label">En validation</div>
            <div className="rd-stat-val">{enValidationCount}</div>
            <div className="rd-stat-note">soumis au resp.</div>
          </div>
          <div className="rd-stat purple">
            <div className="rd-stat-label">Clôturés</div>
            <div className="rd-stat-val">{validatedCount}</div>
            <div className="rd-stat-note">{validationRate}%</div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="rd-tabs">
          {TABS.map(t => (
            <button key={t.key} className={`rd-tab ${section === t.key ? 'active' : ''}`} onClick={() => setSection(t.key)}>
              <span>{t.icon}</span>{t.label}
              {t.badge != null && t.badge > 0 && <span className={`rd-tab-badge ${t.badgeNew ? 'new' : ''}`}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* ── SECTION RENDU ── */}
        {section === 'rapports'     && <TabRapports />}
        {section === 'validation'   && <TabValidation />}
        {section === 'decideur'     && <TabDecideur />}
        
        {section === 'indicateurs'  && <TabIndicateurs />}
      </div>
    </div>
  );
}