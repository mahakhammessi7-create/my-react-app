import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import API from '../../services/api';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  @keyframes af-up    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes af-spin  { to{transform:rotate(360deg)} }
  @keyframes af-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes af-scan  { 0%{top:0;opacity:.7} 100%{top:100%;opacity:0} }
  @keyframes af-slow  { from{transform:rotate(0)} to{transform:rotate(360deg)} }

  .af-root * { box-sizing:border-box; margin:0; padding:0; }
  .af-root   { font-family:'DM Sans',sans-serif; }
  .af-anim   { animation:af-up .5s ease both; }

  .af-drop {
    border:2px dashed rgba(99,210,190,.22); border-radius:18px;
    padding:38px 24px; text-align:center; cursor:pointer;
    transition:border-color .3s,background .3s,transform .2s;
    background:rgba(99,210,190,.025); display:block;
  }
  .af-drop:hover,.af-drop.over {
    border-color:rgba(99,210,190,.55); background:rgba(99,210,190,.06); transform:scale(1.015);
  }

  .af-btn-verify {
    width:100%; padding:15px; margin-top:20px;
    background:linear-gradient(135deg,#63d2be,#2eb8a0);
    color:#071520; border:none; border-radius:14px;
    font-size:15px; font-family:'DM Sans',sans-serif; font-weight:700;
    cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px;
    transition:filter .2s,transform .15s,box-shadow .2s;
  }
  .af-btn-verify:hover:not(:disabled) { filter:brightness(1.1); transform:translateY(-2px); box-shadow:0 14px 36px rgba(99,210,190,.22); }
  .af-btn-verify:disabled { background:rgba(255,255,255,.07); color:#2a4a62; cursor:not-allowed; transform:none; }

  .af-btn-green {
    flex:1; padding:15px; background:linear-gradient(135deg,#4ade80,#22c55e);
    color:#071520; border:none; border-radius:14px; font-size:15px;
    font-family:'DM Sans',sans-serif; font-weight:700; cursor:pointer;
    display:flex; align-items:center; justify-content:center; gap:8px;
    transition:filter .2s,transform .15s; box-shadow:0 6px 24px rgba(74,222,128,.15);
  }
  .af-btn-green:hover { filter:brightness(1.1); transform:translateY(-2px); }

  .af-btn-ghost {
    flex:1; padding:15px; background:rgba(255,255,255,.05);
    color:#8ab0c8; border:1px solid rgba(255,255,255,.09); border-radius:14px;
    font-size:14px; font-family:'DM Sans',sans-serif; cursor:pointer;
    transition:background .2s; display:flex; align-items:center; justify-content:center; gap:8px;
  }
  .af-btn-ghost:hover { background:rgba(255,255,255,.09); }

  .af-check-row {
    display:flex; align-items:center; gap:10px; padding:8px 0;
    border-bottom:1px solid rgba(255,255,255,.04); font-size:12px;
  }
  .af-check-row:last-child { border-bottom:none; }
  .af-sub-check {
    display:flex; align-items:center; gap:8px; padding:5px 0 5px 28px;
    border-bottom:1px solid rgba(255,255,255,.03); font-size:11px; color:#4a6a88;
  }
  .af-sub-check:last-child { border-bottom:none; }

  .af-nav-link {
    display:flex; align-items:center; gap:6px;
    padding:7px 13px; border-radius:10px; text-decoration:none;
    font-size:13px; font-weight:500; transition:all .2s; white-space:nowrap;
  }
  .af-nav-link:hover { background:rgba(255,255,255,.06); color:#8ab0c8 !important; }
`;

function inject() {
  if (document.getElementById('af-styles')) return;
  const s = document.createElement('style');
  s.id = 'af-styles'; s.textContent = CSS;
  document.head.appendChild(s);
}

const BG   = '#07111e';
const CARD = 'rgba(255,255,255,.028)';
const BDR  = 'rgba(255,255,255,.07)';
const TEAL = '#63d2be';
const GREEN= '#4ade80';
const RED  = '#f87171';
const AMBER= '#fbbf24';

// ══════════════════════════════════════════════
//  ALL 9 ANNEXES DEFINITION
// ══════════════════════════════════════════════
const ANNEXES = [
  {
    key:   'annexe1',
    label: 'Annexe 1 — Identification de l\'Organisme',
    subChecks: [
      { label:'Nom de l\'organisme',  keywords:['nom de l\'organisme', 'nom_organisme', '[nom de l\'organisme]'] },
      { label:'Acronyme',             keywords:['acronyme'] },
      { label:'Secteur d\'activité',  keywords:['secteur d\'activité', 'secteur d\'activite'] },
      { label:'Statut',               keywords:['statut'] },
      { label:'Adresse Email',        keywords:['adresse email', 'email', '@'] },
    ],
    minSubChecks: 3,
  },
  {
    key:   'annexe2',
    label: 'Annexe 2 — Cartographie des Processus (DIC)',
    subChecks: [
      { label:'Désignation du processus', keywords:['désignation du processus', 'designation du processus', 'processus 1', 'processus métier'] },
      { label:'Confidentialité',          keywords:['confidentialité', 'confidentialite'] },
      { label:'Intégrité',                keywords:['intégrité', 'integrite'] },
      { label:'Disponibilité',            keywords:['disponibilité', 'disponibilite'] },
    ],
    minSubChecks: 2,
  },
  {
    key:   'annexe3',
    label: 'Annexe 3 — Description du Système d\'Information',
    subChecks: [
      { label:'Applications',                     keywords:['applications', 'application', 'modules', 'dév. par'] },
      { label:'Serveurs (par plateforme)',         keywords:['serveurs', 'serveur', 'système d\'exploitation', '@ip', 'rôle'] },
      { label:'Infrastructure Réseau & Sécurité', keywords:['infrastructure réseau', 'infrastructure réseau et sécurité', 'nature', 'marque', 'firewall', 'routeur', 'switch'] },
      { label:'Postes de travail',                keywords:['postes de travail', 'poste de travail', 'système d\'exploitation', 'nombre'] },
    ],
    minSubChecks: 3,
  },
  {
    key:   'annexe4',
    label: 'Annexe 4 — Planning d\'Exécution Réel',
    subChecks: [
      { label:'Composant / Phase',        keywords:['phase 1', 'phase 2', 'composant', 'objet de la sous phase'] },
      { label:'Équipe intervenante',      keywords:['équipe intervenante', 'equipe intervenante', 'nom:', 'intervenant'] },
      { label:'Durée en Hommes/jours',    keywords:['hommes/jours', 'homme/jour', 'h/j', 'durée totale'] },
      { label:'Dates de réalisation',     keywords:['date(s) de réalisation', 'date de realisation', 'sur site'] },
    ],
    minSubChecks: 2,
  },
  {
    key:   'annexe5',
    label: 'Annexe 5 — Évaluation du Plan d\'Action Précédent',
    subChecks: [
      { label:'Projet / Action',          keywords:['projet 1', 'action 1.1', 'action 1', 'projet 2'] },
      { label:'Criticité',                keywords:['criticité', 'criticite'] },
      { label:'Taux de réalisation',      keywords:['taux de réalisation', 'taux de realisation'] },
      { label:'Évaluation',               keywords:['évaluation', 'evaluation'] },
      { label:'Chargé de l\'action',      keywords:['chargé de l\'action', 'charge de l\'action'] },
    ],
    minSubChecks: 2,
  },
  {
    key:   'annexe6',
    label: 'Annexe 6 — État de Maturité de la Sécurité du SI',
    subChecks: [
      { label:'Mesures organisationnelles (dom. 5)', keywords:['mesures de sécurité organisationnelles', 'mesures organisationnelles', '5.1 politiques', '5.2 fonctions'] },
      { label:'Mesures liées aux personnes (dom. 6)', keywords:['mesures liées aux personnes', 'mesures de sécurité applicables aux personnes', '6.1', '6.2'] },
      { label:'Mesures de sécurité physique (dom. 7)', keywords:['mesures de sécurité physique', '7.1', '7.2', 'périmètres de sécurité physique'] },
      { label:'Mesures technologiques (dom. 8)',       keywords:['mesures de sécurité technologiques', 'mesures technologiques', '8.1', '8.2'] },
      { label:'Valeur attribuée / Score maturité',     keywords:['valeur attribuée', 'valeur attribuee', 'critère d\'évaluation', 'critere d\'evaluation'] },
    ],
    minSubChecks: 3,
  },
  {
    key:   'annexe7',
    label: 'Annexe 7 — Indicateurs de Sécurité',
    subChecks: [
      { label:'Organisation & RSSI',               keywords:['nomination officielle rssi', 'rssi', 'cellule sécurité', 'comité sécurité'] },
      { label:'PSSI',                              keywords:['pssi', 'existence formelle pssi', 'maintien de la pssi'] },
      { label:'Gestion de la continuité (PCA/PRA)',keywords:['pca', 'pra', 'continuité', 'site secours', 'organisation de crise'] },
      { label:'Gestion des actifs',                keywords:['gestion des actifs', 'inventaire complet', 'classification'] },
      { label:'Gestion des risques SI',            keywords:['gestion des risques', 'risques si', 'risques si métier'] },
      { label:'Gestion des incidents',             keywords:['gestion des incidents', 'cellule de gestion des incidents'] },
      { label:'Gestion des sauvegardes',           keywords:['gestion des sauvegardes', 'politique formelle de sauvegarde', 'sauvegarde'] },
      { label:'Contrôle d\'accès logique',         keywords:['contrôle d\'accès', 'contrôleur de domaines', 'vlan', 'proxy'] },
      { label:'Protection antivirale',             keywords:['protection antivirale', 'antivirale', 'antivirus'] },
      { label:'Sécurité physique DC',              keywords:['data-center', 'datacenter', 'local data-center', 'climatisation', 'onduleurs'] },
    ],
    minSubChecks: 6,
  },
  {
    key:   'annexe8',
    label: 'Annexe 8 — Vulnérabilités Très Critiques',
    subChecks: [
      { label:'Section Annexe 8 présente',            keywords:['annexe 8', 'annexe8', 'vulnérabilités très critiques', 'liste des vulnérabilités'] },
      { label:'Référence / Identifiant vulnérabilité', keywords:['vuln-tt', 'vuln-', 'référence de la vulnérabilité', 'reference de la vulnerabilite'] },
      { label:'Actifs / Composantes impactés',         keywords:['actifs impactés', 'actifs impactes', 'actifs impacté', 'composante'] },
      { label:'Impact ou Description',                 keywords:['impact d\'exploitation', 'impact/conséquence', 'impact'] },
      { label:'Recommandation',                        keywords:['recommandation', 'recommandations'] },
    ],
    minSubChecks: 2,
  },
  {
    key:   'annexe9',
    label: 'Annexe 9 — Plan d\'Action Proposé',
    subChecks: [
      { label:'Projet / Action',                  keywords:['plan d\'action', 'projet :', 'action :', 'action proposée', 'actions proposées'] },
      { label:'Criticité',                        keywords:['criticité', 'criticite'] },
      { label:'Charge (H/J)',                     keywords:['charge (h/j)', 'h/j', 'charge h/j', 'homme/jour'] },
      { label:'Chargé de l\'action',              keywords:['chargé de l\'action', 'charge de l\'action', 'responsable'] },
      { label:'Délai de mise en œuvre',           keywords:['délai', 'delai', 'mise en œuvre', 'mise en oeuvre', 'échéance'] },
    ],
    minSubChecks: 2,
  },
];

// ══════════════════════════════════════════════
// ANNEXE 7 — Expected indicators with their
// keywords. Each must have a NON-EMPTY valeur
// to count as "filled". If the row exists but
// valeur is blank/null → "partial/empty".
// ══════════════════════════════════════════════
const ANNEXE7_EXPECTED = [
  { key: 'rssi_nomination',   keywords: ['nomination officielle rssi', 'nomination rssi'],        label: 'Nomination officielle RSSI' },
  { key: 'rssi_fiche',        keywords: ['fiche de poste rssi', 'fiche de poste'],                label: 'Fiche de poste RSSI' },
  { key: 'cellule_secu',      keywords: ['cellule sécurité', 'cellule securite', 'cellule de sécurité'], label: 'Cellule sécurité SI' },
  { key: 'comite_ssi',        keywords: ['comité sécurité', 'comite securite', 'comité ssi'],     label: 'Comité SSI formalisé' },
  { key: 'pssi_existence',    keywords: ['existence formelle pssi', 'pssi'],                      label: 'Existence formelle PSSI' },
  { key: 'pssi_portee',       keywords: ['portée de la pssi', 'portee de la pssi'],               label: 'Portée de la PSSI' },
  { key: 'pssi_comm',         keywords: ['communication de la pssi', 'communication pssi'],       label: 'Communication PSSI' },
  { key: 'pssi_maintien',     keywords: ['maintien de la pssi', 'revision pssi', 'révision pssi'], label: 'Maintien / révision PSSI' },
  { key: 'pca',               keywords: ['pca', 'plan de continuité'],                            label: 'PCA existant' },
  { key: 'pra',               keywords: ['pra', 'plan de reprise'],                               label: 'PRA existant' },
  { key: 'site_secours',      keywords: ['site secours', 'site de secours'],                      label: 'Site de secours' },
  { key: 'org_crise',         keywords: ['organisation de crise', 'crise'],                       label: 'Organisation de crise' },
  { key: 'inventaire',        keywords: ['inventaire complet', 'inventaire des actifs'],          label: 'Inventaire complet des actifs' },
  { key: 'classification',    keywords: ['classification', 'classification des actifs'],          label: 'Classification des actifs' },
  { key: 'risques_si',        keywords: ['gestion des risques si', 'risques si'],                 label: 'Gestion des risques SI' },
  { key: 'incidents',         keywords: ['cellule de gestion des incidents', 'gestion des incidents'], label: 'Gestion des incidents' },
  { key: 'sauvegarde',        keywords: ['politique formelle de sauvegarde', 'gestion des sauvegardes', 'sauvegarde'], label: 'Politique de sauvegarde' },
  { key: 'sauvegarde_dist',   keywords: ['copies à un site distant', 'site distant', 'sauvegarde distante'], label: 'Sauvegardes distantes' },
  { key: 'patches',           keywords: ['patches', 'correctifs', 'déploiement automatique'],     label: 'Déploiement automatique des patches' },
  { key: 'acces_logique',     keywords: ['contrôle d\'accès', 'contrôleur de domaine', 'vlan', 'proxy'], label: 'Contrôle d\'accès logique' },
  { key: 'antivirus',         keywords: ['protection antivirale', 'antivirus', 'antivirale'],     label: 'Protection antivirale' },
  { key: 'siem',              keywords: ['siem', 'ids', 'ips', 'supervision'],                    label: 'SIEM / IDS / IPS' },
  { key: 'dc_physique',       keywords: ['data-center', 'datacenter', 'local data-center'],       label: 'Sécurité physique Data Center' },
  { key: 'climatisation',     keywords: ['climatisation'],                                         label: 'Climatisation DC' },
  { key: 'onduleurs',         keywords: ['onduleurs', 'onduleur'],                                label: 'Onduleurs / alimentation secourue' },
  { key: 'incendie',          keywords: ['incendie', 'détection incendie'],                       label: 'Protection incendie' },
  { key: 'foudre',            keywords: ['foudre', 'anti-foudre', 'parafoudre'],                  label: 'Protection anti-foudre' },
  { key: 'cablage',           keywords: ['câblage', 'cablage'],                                   label: 'Sécurité câblage réseau' },
  { key: 'dev_test_prod',     keywords: ['séparation', 'dev/test/prod', 'environnement'],         label: 'Séparation environnements dev/test/prod' },
  { key: 'maintenance',       keywords: ['contrats de maintenance', 'maintenance'],               label: 'Contrats de maintenance' },
];

// ══════════════════════════════════════════════
// KEY FIX: Check if an Annexe 7 indicator row
// has a meaningful (non-empty) value filled in.
// Returns: { found: bool, hasValue: bool, valeur: string }
// ══════════════════════════════════════════════
function checkIndicatorValue(indicators, keywords) {
  const normalize = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const row = indicators.find(ind =>
    keywords.some(kw => normalize(ind.indicateur).includes(normalize(kw)))
  );
  if (!row) return { found: false, hasValue: false, valeur: '' };

  const val = (row.valeur || '').trim();
  // Empty, placeholder, or null-like values are NOT considered filled
  const isEmpty = !val || val === '' || val === '-' || val === '—' || val === '…'
    || val.toLowerCase() === 'null' || val.toLowerCase() === 'n/a';

  return { found: true, hasValue: !isEmpty, valeur: val, commentaire: row.commentaire || '' };
}

async function readDocxHtml(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return result.value;
}

async function readDocxText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function readPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map(item => item.str).join(' ') + '\n';
  }
  return fullText;
}

async function readFileContent(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  try {
    if (ext === 'docx') {
      const [text, html] = await Promise.all([readDocxText(file), readDocxHtml(file)]);
      return { text, html };
    }
    if (ext === 'pdf') {
      const text = await readPdf(file);
      return { text, html: '' };
    }
    return { text:'', html:'' };
  } catch (e) {
    console.error('Erreur lecture:', e);
    return { text:'', html:'' };
  }
}

function parseHtmlTables(html) {
  const parser  = new DOMParser();
  const doc     = parser.parseFromString(html, 'text/html');
  const tables  = doc.querySelectorAll('table');
  return Array.from(tables).map(table => {
    const rows = Array.from(table.querySelectorAll('tr'));
    return rows.map(row => {
      const cells = Array.from(row.querySelectorAll('td, th'));
      return cells.map(c => c.textContent.trim());
    }).filter(r => r.some(c => c.length > 0));
  });
}

function extractAnnexe1(tables) {
  const result = {};
  tables.forEach(table => {
    if (table.length >= 2 && table[0]?.[0]?.toLowerCase().includes('champ')) {
      table.slice(1).forEach(row => {
        if (row.length >= 2) {
          const key = row[0].toLowerCase().trim();
          const val = row[1].trim();
          if (val) {
            if (key.includes('nom de l')) result.companyName = val;
            if (key.includes('acronyme')) result.acronym = val;
            if (key.includes('secteur')) result.sector = val;
            if (key.includes('statut'))  result.statut = val;
            if (key.includes('email'))   result.email = val;
          }
        }
      });
    }
  });
  return result;
}

function extractAnnexe2(tables) {
  const processes = [];
  tables.forEach(table => {
    if (table.length < 2) return;
    const header = (table[0] || []).map(c => c.toLowerCase());
    if (!header.some(h => h.includes('processus')) || !header.some(h => h.includes('confidentialit') || h.includes('disponibilit') || h.includes('intégrit'))) return;
    table.slice(1).forEach(row => {
      const name = row[0]?.trim();
      if (!name || name.toLowerCase().includes('processus') || name.trim() === '…') return;
      processes.push({
        name,
        confidentialite: row[1]?.trim() || '',
        integrite:       row[2]?.trim() || '',
        disponibilite:   row[3]?.trim() || '',
      });
    });
  });
  return processes;
}

function extractAnnexe4(tables) {
  const phases = [];
  tables.forEach(table => {
    if (table.length < 3) return;
    const flat = table.map(r => r.join(' ').toLowerCase()).join(' ');
    if (!flat.includes('phase') || !flat.includes('durée') && !flat.includes('h/j')) return;
    let current = null;
    table.slice(1).forEach(row => {
      const first = row[0]?.trim();
      if (!first) return;
      if (/^phase\s*\d/i.test(first)) {
        current = { phase: first, steps: [] };
        phases.push(current);
      } else if (current && first && first !== '…') {
        current.steps.push(first);
      }
    });
  });
  return phases;
}

function extractAnnexe5(tables) {
  const actions = [];
  tables.forEach(table => {
    if (table.length < 3) return;
    const flat = table.map(r => r.join(' ').toLowerCase()).join(' ');
    if (!flat.includes('projet') || !flat.includes('action') || !flat.includes('taux')) return;
    let currentProject = '';
    table.slice(1).forEach(row => {
      const proj   = row[0]?.trim();
      const action = row[1]?.trim();
      if (proj && proj !== '…') currentProject = proj;
      if (!action || action === '…') return;
      actions.push({
        projet:          currentProject,
        action,
        criticite:       row[2]?.trim() || '',
        charge:          row[3]?.trim() || '',
        tauxRealisation: row[5]?.trim() || '',
        evaluation:      row[6]?.trim() || '',
      });
    });
  });
  return actions.slice(0, 20);
}

function extractAnnexe6(tables) {
  const domaines = [];
  tables.forEach(table => {
    if (table.length < 4) return;
    const flat = table.map(r => r.join(' ').toLowerCase()).join(' ');
    if (!flat.includes('domaine') || !flat.includes('valeur') || !flat.includes('mesures')) return;
    let currentDomain = '';
    table.slice(1).forEach(row => {
      const domain   = row[0]?.trim();
      const critere  = row[1]?.trim();
      const valeur   = row[2]?.trim();
      const comment  = row[3]?.trim();
      if (domain && domain !== '…') currentDomain = domain;
      if (!critere || critere === '…') return;
      domaines.push({
        domaine:    currentDomain,
        critere,
        valeur:     valeur || '',
        commentaire: comment || '',
      });
    });
  });
  return domaines.slice(0, 40);
}

function extractAnnexe8(text, tables) {
  const vulns = [];

  const refMatches = [...text.matchAll(/r[eé]f[eé]rence de la vuln[eé]rabilit[eé]\s*:\s*([^\n]+)/gi)];
  refMatches.forEach(m => {
    const ref = m[1]?.trim();
    if (ref && ref.length > 1) {
      const snippet  = text.slice(m.index, m.index + 600);
      const desc     = snippet.match(/description\s*:\s*([^\n]+)/i)?.[1]?.trim() || '';
      const criticite= snippet.match(/criticit[eé]\s*:\s*([^\n]+)/i)?.[1]?.trim() || '';
      const reco     = snippet.match(/recommandation\s*:\s*([^\n]+)/i)?.[1]?.trim() || '';
      vulns.push({ ref, desc, criticite, reco, source: 'bloc' });
    }
  });

  if (tables) {
    tables.forEach(table => {
      if (table.length < 2) return;
      const header = (table[0] || []).map(c => c.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''));
      const hasRef    = header.some(h => h.includes('reference'));
      const hasImpact = header.some(h => h.includes('impact') || h.includes('actifs') || h.includes('recommandation'));
      if (!hasRef || !hasImpact) return;

      const iVuln  = header.findIndex(h => h.includes('vulnerabilite') || h.includes('vulnerabilit'));
      const iRef   = header.findIndex(h => h.includes('reference'));
      const iActif = header.findIndex(h => h.includes('actifs') || h.includes('composante'));
      const iImpact= header.findIndex(h => h.includes('impact'));
      const iProba = header.findIndex(h => h.includes('probabilit'));
      const iReco  = header.findIndex(h => h.includes('recommandation'));

      table.slice(1).forEach(row => {
        const ref  = iRef  >= 0 ? row[iRef]?.trim()  : '';
        const vuln = iVuln >= 0 ? row[iVuln]?.trim() : '';
        if (!ref && !vuln) return;
        const refLower = ref?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        if (refLower === 'reference') return;
        vulns.push({
          ref:       ref || vuln || 'N/A',
          desc:      iVuln   >= 0 ? (row[iVuln]?.trim()  || '') : '',
          criticite: iProba  >= 0 ? (row[iProba]?.trim() || '') : '',
          actifs:    iActif  >= 0 ? (row[iActif]?.trim() || '') : '',
          impact:    iImpact >= 0 ? (row[iImpact]?.trim()|| '') : '',
          reco:      iReco   >= 0 ? (row[iReco]?.trim()  || '') : '',
          source: 'tableau',
        });
      });
    });
  }

  return vulns.filter(v => v.ref).slice(0, 10);
}

function extractAnnexe9(tables) {
  const actions = [];
  tables.forEach(table => {
    if (table.length < 3) return;
    const flat = table.map(r => r.join(' ').toLowerCase()).join(' ');
    if (!flat.includes('projet') || !flat.includes('action') || (!flat.includes('délai') && !flat.includes('delai') && !flat.includes('h/j'))) return;
    let currentProject = '';
    table.slice(1).forEach(row => {
      const proj   = row[0]?.trim();
      const action = row[1]?.trim();
      if (proj && proj !== '…') currentProject = proj;
      if (!action || action === '…') return;
      actions.push({
        projet:    currentProject,
        action,
        criticite: row[2]?.trim() || '',
        charge:    row[3]?.trim() || '',
        charge_hj: row[4]?.trim() || '',
        delai:     row[5]?.trim() || row[6]?.trim() || '',
      });
    });
  });
  return actions.slice(0, 20);
}

function findHeader(table, requiredKeywords) {
  for (let ri = 0; ri <= Math.min(2, table.length - 1); ri++) {
    const h = table[ri].map(c => c.toLowerCase());
    if (requiredKeywords.every(kw => h.some(c => c.includes(kw)))) {
      return { header: h, dataStart: ri + 1 };
    }
  }
  return null;
}

function extractServersFromTable(tables) {
  const servers = [];
  tables.forEach(table => {
    if (table.length < 3) return;
    const found = findHeader(table, ['nom', '@ip']);
    if (!found) return;
    const { header, dataStart } = found;
    const iNom  = header.findIndex(h => h === 'nom');
    const iIp   = header.findIndex(h => h.includes('@ip') || (h.includes('ip') && !h.includes('type')));
    const iType = header.findIndex(h => h === 'type');
    const iOs   = header.findIndex(h => h.includes('système') || h.includes('exploitation'));
    const iRole = header.findIndex(h => h.includes('rôle') || h.includes('role') || h.includes('métier') || h.includes('metier'));
    const iPer  = header.findIndex(h => h.includes('périmètre') || h.includes('perimetre'));
    table.slice(dataStart).forEach(row => {
      const nom = row[iNom]?.trim();
      if (!nom || nom.length < 2 || nom === header[iNom]) return;
      servers.push({
        nom,
        ip:        iIp   >= 0 ? (row[iIp]?.trim()   || 'N/A') : 'N/A',
        type:      iType >= 0 ? (row[iType]?.trim()  || 'N/A') : 'N/A',
        os:        iOs   >= 0 ? (row[iOs]?.trim()    || 'N/A') : 'N/A',
        role:      iRole >= 0 ? (row[iRole]?.trim()  || 'N/A') : 'N/A',
        perimetre: iPer  >= 0 ? !/^(non|hors|false)$/i.test(row[iPer]?.trim() || '') : true,
      });
    });
  });
  return servers.filter(s => s.nom).slice(0, 20);
}

function extractAppsFromTable(tables) {
  const apps = [];
  tables.forEach(table => {
    if (table.length < 3) return;
    const found = findHeader(table, ['nom', 'module']);
    if (!found) return;
    const { header, dataStart } = found;
    const iNom  = header.findIndex(h => h === 'nom');
    const iMod  = header.findIndex(h => h.includes('module'));
    const iEnv  = header.findIndex(h => h.includes('env'));
    const iDev  = header.findIndex(h => h.includes('dév') || h.includes('dev'));
    const iUtil = header.findIndex(h => h.includes('util'));
    const iPer  = header.findIndex(h => h.includes('périmètre') || h.includes('perimetre'));
    table.slice(dataStart).forEach(row => {
      const nom = row[iNom]?.trim();
      if (!nom || nom.length < 2 || nom === 'nom') return;
      const perVal = iPer >= 0 ? (row[iPer]?.trim() || 'Oui') : 'Oui';
      apps.push({
        nom,
        modules:      iMod  >= 0 ? (row[iMod]?.trim()  || 'N/A') : 'N/A',
        env:          iEnv  >= 0 ? (row[iEnv]?.trim()  || 'N/A') : 'N/A',
        dev:          iDev  >= 0 ? (row[iDev]?.trim()  || 'N/A') : 'N/A',
        utilisateurs: iUtil >= 0 ? (parseInt(row[iUtil]) || 0) : 0,
        perimetre:    !/^(non|hors|false)$/i.test(perVal),
      });
    });
  });
  return apps.filter(a => a.nom).slice(0, 15);
}

function extractNetworkFromTable(tables) {
  const network = [];
  tables.forEach(table => {
    if (table.length < 3) return;
    const found = findHeader(table, ['nature', 'marque']);
    if (!found) return;
    const { header, dataStart } = found;
    const iNature = header.findIndex(h => h === 'nature');
    const iMarque = header.findIndex(h => h === 'marque');
    const iNb     = header.findIndex(h => h === 'nb');
    const iAdmin  = header.findIndex(h => h.includes('administré') || h.includes('administre'));
    const iPer    = header.findIndex(h => h.includes('périmètre') || h.includes('perimetre'));
    table.slice(dataStart).forEach(row => {
      const nature = row[iNature]?.trim();
      if (!nature || nature === 'nature') return;
      network.push({
        nature,
        marque:    iMarque >= 0 ? (row[iMarque]?.trim() || 'N/A') : 'N/A',
        nb:        iNb     >= 0 ? (parseInt(row[iNb]) || 1) : 1,
        admin:     iAdmin  >= 0 ? (row[iAdmin]?.trim()  || 'N/A') : 'N/A',
        perimetre: iPer    >= 0 ? !/^(non|hors)$/i.test(row[iPer]?.trim() || '') : true,
      });
    });
  });
  return network.filter(n => n.nature).slice(0, 15);
}

// ══════════════════════════════════════════════
// extractIndicateurs — IMPROVED header detection
// Now recognises "Classe / Indicateur | Indicateur | Valeur"
// AND alternate structures with "mesure", "classe", etc.
// ══════════════════════════════════════════════
function extractIndicateurs(tables) {
  const indicators = [];
  let currentClass = '';
  tables.forEach(table => {
    if (table.length < 3) return;
    let headerRow = null;
    let dataStart = 1;
    for (let ri = 0; ri <= 2; ri++) {
      const h = (table[ri] || []).map(c => c.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
      const hasIndicateur = h.some(c => c.includes('indicateur') || c.includes('classe'));
      const hasValeur     = h.some(c => c.includes('valeur'));
      const hasMesure     = h.some(c => c.includes('mesure'));
      if ((hasIndicateur && hasValeur) || (hasMesure && hasValeur)) {
        headerRow = h;
        dataStart = ri + 1;
        break;
      }
    }
    if (!headerRow) return;
    const iClasse = headerRow.findIndex(h => h.includes('classe'));
    const iInd    = headerRow.findIndex(h => (h.includes('indicateur') && !h.includes('classe')) || h.includes('mesure'));
    const iVal    = headerRow.findIndex(h => h.includes('valeur'));
    const iCom    = headerRow.findIndex(h => h.includes('commentaire'));
    const iIndFinal    = iInd >= 0 ? iInd : 1;
    const iClasseFinal = iClasse >= 0 ? iClasse : 0;
    table.slice(dataStart).forEach(row => {
      const classeCell = row[iClasseFinal]?.trim() || '';
      const indicateur = row[iIndFinal]?.trim() || '';
      const valeur     = iVal >= 0 ? (row[iVal]?.trim() || '') : '';
      const commentaire= iCom >= 0 ? (row[iCom]?.trim() || '') : '';
      if (classeCell && classeCell !== indicateur && classeCell.toLowerCase() !== 'valeur') {
        currentClass = classeCell;
      }
      if (!indicateur || indicateur.toLowerCase() === 'indicateur' || indicateur === currentClass) return;
      if (indicateur === valeur && valeur.length > 3) return;
      indicators.push({ classe: currentClass, indicateur, valeur, commentaire });
    });
  });
  return indicators;
}

function classifyValue(valeur) {
  if (!valeur || valeur.trim() === '') return 'vide';
  const v = valeur.trim().toLowerCase();
  if (/^(1|oui|yes|existant|existante|formelle|formalisee|deploye|deployee|totale|total|actif|active|en place|present|presente|homologue|conforme|dsi)$/.test(v))
    return 'positif';
  if (/^(0|non|no|absent|absente|inexistant|inexistante|aucun|aucune|jamais|neant|—|-)$/.test(v))
    return 'negatif';
  return 'partiel';
}

function isHeaderRow(ind) {
  if (!ind.valeur) return true;
  const v = ind.valeur.trim().toLowerCase();
  const i = ind.indicateur.trim().toLowerCase();
  const c = ind.classe.trim().toLowerCase();
  return v === i || v === c || v === '' || v === 'valeur';
}

function calcScoreFromIndicateurs(indicators) {
  const real = indicators.filter(ind => !isHeaderRow(ind));
  if (real.length === 0) return null;
  let pts = 0;
  real.forEach(ind => {
    const t = classifyValue(ind.valeur);
    if (t === 'positif') pts += 1;
    else if (t === 'partiel') pts += 0.5;
  });
  return Math.round((pts / real.length) * 100);
}

function buildRadarFromIndicateurs(indicators, fallbackScore) {
  const domaines = {
    'Gouvernance':       ['nomination', 'rssi', 'fiche de poste', 'comite securite', 'cellule securite', 'pssi', 'tableau de bord', 'audit interne'],
    'Risques & Actifs':  ['gestion des risques', 'inventaire', 'classification', 'conformite'],
    'Continuite':        ['pca', 'pra', 'site secours', 'crise'],
    'Controle Acces':    ['acces logique', 'controleur de domaine', 'iam', 'proxy', 'matrice de flux', 'vlan', 'admin'],
    'Protection':        ['antivirale', 'antivirus', 'patch', 'correctif', 'firmware', 'eol'],
    'Sauvegardes':       ['sauvegarde', 'restauration', 'clonage', 'site distant', 'codes sources'],
    'Securite Physique': ['data-center', 'onduleur', 'climatisation', 'cablage', 'incendie', 'video', 'foudre', 'badge'],
    'Incidents':         ['incident', 'siem', 'ids', 'ips', 'detection', 'alerte', 'maintenance'],
  };
  const labels = {
    'Gouvernance':'Gouvernance', 'Risques & Actifs':'Risques & Actifs',
    'Continuite':'Continuité', 'Controle Acces':'Contrôle Accès',
    'Protection':'Protection', 'Sauvegardes':'Sauvegardes',
    'Securite Physique':'Sécurité Physique', 'Incidents':'Incidents',
  };
  return Object.entries(domaines).map(([key, kws]) => {
    const rel = indicators.filter(ind =>
      !isHeaderRow(ind) &&
      kws.some(k => ind.indicateur.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(k) ||
                    ind.classe.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(k))
    );
    if (rel.length === 0) return { axe: labels[key], valeur: fallbackScore };
    let pts = 0;
    rel.forEach(ind => {
      const t = classifyValue(ind.valeur);
      if (t === 'positif') pts += 1;
      else if (t === 'partiel') pts += 0.5;
    });
    return { axe: labels[key], valeur: Math.round((pts / rel.length) * 100) };
  });
}

function buildRisquesFromIndicateurs(indicators, score) {
  const risques = [];
  const real = indicators.filter(ind => !isHeaderRow(ind));
  const isNeg = (kws) => {
    const f = real.find(ind => kws.some(k => ind.indicateur.toLowerCase().includes(k.toLowerCase())));
    if (!f) return true;
    return classifyValue(f.valeur) === 'negatif';
  };
  const isPartOrNeg = (kws) => {
    const f = real.find(ind => kws.some(k => ind.indicateur.toLowerCase().includes(k.toLowerCase())));
    if (!f) return true;
    const t = classifyValue(f.valeur);
    return t === 'negatif' || t === 'partiel';
  };
  const getComment = (kws) => {
    const f = real.find(ind => kws.some(k => ind.indicateur.toLowerCase().includes(k.toLowerCase())));
    return f?.commentaire || '';
  };
  if (isNeg(['Maintien du PCA']))
    risques.push({ risque:'PCA non testé', probabilite:'Élevée', impact:'Critique', niv:'critique',
      desc: getComment(['Maintien du PCA']) || 'PCA non testé depuis plus de 2 ans' });
  if (isNeg(['Site Secours']))
    risques.push({ risque:'Absence de site de secours', probabilite:'Moyenne', impact:'Critique', niv:'critique',
      desc: getComment(['Site Secours']) || 'Aucun site de secours disponible' });
  if (isNeg(['Existence', 'SIEM']))
    risques.push({ risque:'Absence de SIEM', probabilite:'Élevée', impact:'Élevé', niv:'elevé',
      desc: getComment(['Existence']) || 'Aucune supervision centralisée des événements' });
  if (isPartOrNeg(['politique', 'IDS', 'IPS']))
    risques.push({ risque:'IDS/IPS non configuré', probabilite:'Moyenne', impact:'Élevé', niv:'elevé',
      desc: getComment(['politique détection']) || 'Politique IDS/IPS non formalisée' });
  if (isNeg(['copies à un site distant']))
    risques.push({ risque:'Pas de sauvegardes distantes', probabilite:'Faible', impact:'Critique', niv:'elevé',
      desc: getComment(['copies à un site distant']) || 'Aucune copie hors site' });
  if (isNeg(['Couverture des données des PCs']))
    risques.push({ risque:'Postes utilisateurs non sauvegardés', probabilite:'Élevée', impact:'Moyen', niv:'moyen',
      desc: getComment(['Couverture des données des PCs']) || 'Aucune sauvegarde postes' });
  if (isPartOrNeg(['Remp OS PCs EoL']))
    risques.push({ risque:'Postes en fin de vie (EoL)', probabilite:'Moyenne', impact:'Moyen', niv:'moyen',
      desc: getComment(['Remp OS PCs EoL']) || 'Systèmes EoL exposés aux vulnérabilités' });
  return risques.slice(0, 7);
}

const STEPS = [
  "Lecture du fichier…",
  "Extraction du texte…",
  "Vérification Annexe 1 (Identification)…",
  "Vérification Annexe 2 (Processus DIC)…",
  "Vérification Annexe 3 (Système d'Information)…",
  "Vérification Annexes 4 & 5 (Planning & Plan préc.)…",
  "Vérification Annexe 6 (Maturité)…",
  "Vérification Annexe 7 (Indicateurs — valeurs)…",
  "Vérification Annexes 8 & 9 (Vulnérabilités & Plan action)…",
  "Calcul score final…",
];

// ══════════════════════════════════════════════
// CORE FIX: validateContent now checks Annexe 7
// by VALUE presence, not just keyword presence.
// ══════════════════════════════════════════════
function validateContent(text, indicators) {
  const lower     = text.toLowerCase();
  const wordCount = lower.split(/\s+/).filter(w => w.length > 3).length;
  if (wordCount < 50) {
    return { isEmpty:true, results:[], wordCount, errors:[`Document insuffisant — ${wordCount} mots. Minimum 50 requis.`], score:0, isValid:false };
  }

  const results = ANNEXES.map(annexe => {
    // ── Special case: Annexe 7 checks REAL extracted values ──
    if (annexe.key === 'annexe7') {
      const subResults = annexe.subChecks.map(sub => {
        // For each subCheck, see if a matching indicator row has a non-empty value
        const matchingIndicator = indicators.find(ind =>
          sub.keywords.some(kw =>
            ind.indicateur.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
              .includes(kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''))
          )
        );
        if (!matchingIndicator) {
          // Row not found at all — keyword not even in table
          return { ...sub, found: false, reason: 'non_trouvé' };
        }
        const val = (matchingIndicator.valeur || '').trim();
        const isEmpty = !val || val === '' || val === '-' || val === '—'
          || val === '…' || val.toLowerCase() === 'null' || val.toLowerCase() === 'n/a';
        return {
          ...sub,
          found: !isEmpty,
          valeur: val,
          reason: isEmpty ? 'valeur_vide' : 'ok',
        };
      });
      const foundCount = subResults.filter(s => s.found).length;
      return { ...annexe, found: foundCount >= annexe.minSubChecks, subResults, foundCount };
    }

    // ── All other annexes: keyword detection as before ──
    const subResults = annexe.subChecks.map(sub => ({
      ...sub,
      found: sub.keywords.some(kw => lower.includes(kw.toLowerCase())),
    }));
    const foundCount = subResults.filter(s => s.found).length;
    return { ...annexe, found: foundCount >= annexe.minSubChecks, subResults, foundCount };
  });

  const presentCount = results.filter(r => r.found).length;
  const score = Math.round((presentCount / ANNEXES.length) * 100);
  const errors = results.filter(r => !r.found).map(r => {
    const missing = r.subResults.filter(s => !s.found).map(s => {
      if (s.reason === 'valeur_vide') return `${s.label} (ligne présente mais valeur vide)`;
      if (s.reason === 'non_trouvé') return `${s.label} (non trouvé)`;
      return s.label;
    });
    return `${r.label} — ${r.foundCount}/${r.subChecks.length} sections (min ${r.minSubChecks}). Manquants: ${missing.join(', ')}`;
  });
  return { isEmpty:false, results, errors, score, isValid:errors.length===0, wordCount };
}

// ══════════════════════════════════════════════
// buildAnnexeStatus — Annexe 7 now uses
// checkIndicatorValue() to validate each expected
// indicator has an actual filled value.
// ══════════════════════════════════════════════
function buildAnnexeStatus(tables, text, indicators) {
  const lower = text.toLowerCase();
  const status = {};

  // Annexe 1
  const annexe1Data = extractAnnexe1(tables);
  const annexe1FilledCount = Object.values(annexe1Data).filter(v => v && v.trim().length > 0).length;
  status.annexe1 = {
    status: annexe1FilledCount >= 3 ? 'filled' : (annexe1FilledCount > 0 ? 'partial' : 'empty'),
    title: 'Identification de l\'Organisme',
    row_count: annexe1FilledCount,
  };

  // Annexe 2
  const processes = extractAnnexe2(tables);
  const dicFilled = processes.filter(p => p.confidentialite || p.integrite || p.disponibilite).length;
  status.annexe2 = {
    status: dicFilled >= 1 ? 'filled' : (processes.length > 0 ? 'partial' : 'empty'),
    title: 'Cartographie des Processus (DIC)',
    row_count: processes.length,
  };

  // Annexe 3
  const servers = extractServersFromTable(tables);
  const apps = extractAppsFromTable(tables);
  const network = extractNetworkFromTable(tables);
  const annexe3FilledCount = (servers.length > 0 ? 1 : 0) + (apps.length > 0 ? 1 : 0) + (network.length > 0 ? 1 : 0);
  status.annexe3 = {
    status: annexe3FilledCount >= 2 ? 'filled' : (annexe3FilledCount > 0 ? 'partial' : 'empty'),
    title: 'Description du Système d\'Information',
    row_count: servers.length + apps.length + network.length,
  };

  // Annexe 4
  const phases = extractAnnexe4(tables);
  const hasAnnexe4Text = lower.includes('phase 1') || lower.includes('planning') || lower.includes('h/j');
  status.annexe4 = {
    status: phases.length >= 2 ? 'filled' : (phases.length > 0 || hasAnnexe4Text ? 'partial' : 'empty'),
    title: 'Planning d\'Exécution Réel',
    row_count: phases.reduce((acc, p) => acc + p.steps.length, 0),
  };

  // Annexe 5
  const prevActions = extractAnnexe5(tables);
  const hasTaux = lower.includes('taux de réalisation') || lower.includes('taux de realisation');
  status.annexe5 = {
    status: prevActions.length >= 2 ? 'filled' : (prevActions.length > 0 || hasTaux ? 'partial' : 'empty'),
    title: 'Évaluation du Plan d\'Action Précédent',
    row_count: prevActions.length,
  };

  // Annexe 6
  const maturite = extractAnnexe6(tables);
  const maturiteFilled = maturite.filter(m => m.valeur && m.valeur.trim() !== '').length;
  status.annexe6 = {
    status: maturiteFilled >= 5 ? 'filled' : (maturite.length > 0 ? 'partial' : 'empty'),
    title: 'État de Maturité de la Sécurité du SI',
    row_count: maturite.length,
  };

  // ── ANNEXE 7: VALUE-BASED validation ──
  // Each expected indicator is checked for a non-empty valeur.
  const annexe7Results = ANNEXE7_EXPECTED.map(exp => {
    const result = checkIndicatorValue(indicators, exp.keywords);
    return {
      label:    exp.label,
      key:      exp.key,
      found:    result.found,
      hasValue: result.hasValue,
      valeur:   result.valeur,
      // Status: 'ok' | 'vide' | 'absent'
      status:   !result.found ? 'absent' : (!result.hasValue ? 'vide' : 'ok'),
    };
  });

  const filledCount   = annexe7Results.filter(r => r.status === 'ok').length;
  const emptyValCount = annexe7Results.filter(r => r.status === 'vide').length;
  const absentCount   = annexe7Results.filter(r => r.status === 'absent').length;
  const totalExpected = ANNEXE7_EXPECTED.length;

  const annexe7StatusLabel =
    filledCount >= Math.floor(totalExpected * 0.8)
      ? 'filled'
      : filledCount >= Math.floor(totalExpected * 0.4)
        ? 'partial'
        : 'empty';

  status.annexe7 = {
    status:         annexe7StatusLabel,
    title:          'Indicateurs de Sécurité',
    row_count:      filledCount,
    total_expected: totalExpected,
    filled_count:   filledCount,
    empty_val_count: emptyValCount,
    absent_count:   absentCount,
    // Detailed per-indicator results for the UI
    indicator_results: annexe7Results,
  };

  // Annexe 8
  const vulns = extractAnnexe8(text, tables);
  const hasVulnKeywords = lower.includes('vuln') && (lower.includes('recommandation') || lower.includes('impact') || lower.includes('référence'));
  status.annexe8 = {
    status: vulns.length >= 1 ? 'filled' : (hasVulnKeywords ? 'partial' : 'empty'),
    title: 'Vulnérabilités Très Critiques',
    row_count: vulns.length,
    optional: true,
  };

  // Annexe 9
  const actionPlan = extractAnnexe9(tables);
  const hasPlanKeywords = lower.includes('plan d\'action') && (lower.includes('délai') || lower.includes('h/j'));
  status.annexe9 = {
    status: actionPlan.length >= 2 ? 'filled' : (actionPlan.length > 0 || hasPlanKeywords ? 'partial' : 'empty'),
    title: 'Plan d\'Action Proposé',
    row_count: actionPlan.length,
  };

  return status;
}

function buildExtractedData(validation, user, text, html) {
  const { score } = validation;
  const tables        = html ? parseHtmlTables(html) : [];
  const annexe1Data   = extractAnnexe1(tables);
  const servers       = extractServersFromTable(tables);
  const apps          = extractAppsFromTable(tables);
  const network       = extractNetworkFromTable(tables);
  const indicators    = extractIndicateurs(tables);
  const processes     = extractAnnexe2(tables);
  const phases        = extractAnnexe4(tables);
  const prevActions   = extractAnnexe5(tables);
  const maturite      = extractAnnexe6(tables);
  const vulns         = extractAnnexe8(text, tables);
  const actionPlan    = extractAnnexe9(tables);
  const realScore     = calcScoreFromIndicateurs(indicators) ?? score;
  const radar         = buildRadarFromIndicateurs(indicators, realScore);
  const risques       = buildRisquesFromIndicateurs(indicators, realScore);
  const present       = validation.results.filter(r => r.found).length;
  const total         = ANNEXES.length;
  const hasRssi = indicators.some(i => i.indicateur.toLowerCase().includes('rssi') && /oui|existant|yes/i.test(i.valeur));
  const hasPssi = indicators.some(i => i.indicateur.toLowerCase().includes('pssi') && /oui|existant|yes/i.test(i.valeur));
  const hasPca  = indicators.some(i => i.indicateur.toLowerCase().includes('pca')  && /oui|existant|yes/i.test(i.valeur));
  const hasPra  = indicators.some(i => i.indicateur.toLowerCase().includes('pra')  && /oui|existant|yes/i.test(i.valeur));
  const positiveInd = indicators.filter(i => /^(oui|existant|formelle|déployé|yes|x|✓|1|actif|en place)/i.test(i.valeur)).length;
  const partielInd  = indicators.filter(i => /partiel|en cours|prévu/i.test(i.valeur)).length;
  const nonConfInd  = indicators.filter(i => /^(non|absent|inexistant|0)/i.test(i.valeur)).length;
  const totalInd    = indicators.length;

  const annexe_status = buildAnnexeStatus(tables, text, indicators);

  return {
    company: {
      name:             annexe1Data.companyName || user?.company_name || 'Non renseigné',
      acronym:          annexe1Data.acronym     || '',
      sector:           annexe1Data.sector      || user?.sector || 'Non renseigné',
      statut:           annexe1Data.statut      || '',
      email:            annexe1Data.email       || '',
      has_rssi:         hasRssi || /rssi/i.test(text),
      has_pssi:         hasPssi || /pssi/i.test(text),
      has_pca:          hasPca  || /pca/i.test(text),
      has_pra:          hasPra  || /pra/i.test(text),
      maturity_level:   realScore >= 90 ? 4 : realScore >= 70 ? 3 : realScore >= 50 ? 2 : 1,
      compliance_score: realScore,
      server_count:     servers.length,
      app_count:        apps.length,
    },
    kpis: {
      conformes:         present,
      total,
      risquesCritiques:  risques.filter(r => r.niv === 'critique').length,
      serveursAudites:   servers.filter(s => s.perimetre).length,
      serveursTotal:     servers.length,
      appsDansPerimetre: apps.filter(a => a.perimetre).length,
      appsTotal:         apps.length,
    },
    repartition: {
      conforme:    totalInd > 0 ? positiveInd : present,
      partiel:     totalInd > 0 ? partielInd  : Math.max(total-present-1, 0),
      nonConforme: totalInd > 0 ? nonConfInd  : total - present,
    },
    radarMaturite:      radar,
    serveursListe:      servers,
    applicationsListe:  apps,
    reseauListe:        network,
    risquesListe:       risques,
    indicators,
    processusListe:     processes,
    planningPhases:     phases,
    prevActionsListe:   prevActions,
    maturiteListe:      maturite,
    vulnsCritiques:     vulns,
    planActionListe:    actionPlan,
    annexe_status,
  };
}

/* ══════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════ */
export default function AuditForm() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [file,         setFile]         = useState(null);
  const [drag,         setDrag]         = useState(false);
  const [status,       setStatus]       = useState('idle');
  const [progress,     setProgress]     = useState(0);
  const [stepIdx,      setStepIdx]      = useState(0);
  const [errors,       setErrors]       = useState([]);
  const [checkResults, setCheckResults] = useState([]);
  const [score,        setScore]        = useState(null);
  const [wordCount,    setWordCount]    = useState(0);
  const [apiError,     setApiError]     = useState('');
  const [expanded,     setExpanded]     = useState(null);
  const [extracted,    setExtracted]    = useState(null);
  const [openAnnexe,   setOpenAnnexe]   = useState(null);

  useEffect(() => {
    inject();
    return () => document.getElementById('af-styles')?.remove();
  }, []);

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  const selectFile = (f) => {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['pdf','docx'].includes(ext)) { alert('Format non supporté. Utilisez PDF ou DOCX.'); return; }
    setFile(f); setStatus('idle'); setProgress(0);
    setErrors([]); setCheckResults([]); setScore(null); setApiError(''); setExpanded(null); setExtracted(null);
    setOpenAnnexe(null);
  };

  const handleVerify = async () => {
    if (!file || status === 'loading') return;
    setStatus('loading'); setProgress(0); setStepIdx(0); setApiError('');
    try {
      setStepIdx(0); setProgress(8);
      const { text, html } = await readFileContent(file);
      setStepIdx(1); setProgress(16);
      await new Promise(r => setTimeout(r, 200));
      if (!text || text.trim().length === 0) {
        setErrors(['Fichier vide — aucun texte extrait. Le fichier est peut-être corrompu ou scanné sans OCR.']);
        setStatus('fail'); return;
      }

      // Extract indicators BEFORE validation so Annexe 7 can use real values
      const tables     = html ? parseHtmlTables(html) : [];
      const indicators = extractIndicateurs(tables);

      for (let i = 2; i <= 8; i++) {
        setStepIdx(i); setProgress(16 + i * 10);
        await new Promise(r => setTimeout(r, 280));
      }
      setStepIdx(9); setProgress(96);
      await new Promise(r => setTimeout(r, 250));

      // Pass indicators to validateContent for Annexe 7 value-check
      const validation = validateContent(text, indicators);
      setCheckResults(validation.results);
      setScore(validation.score);
      setWordCount(validation.wordCount || 0);
      setProgress(100);
      if (validation.isEmpty || !validation.isValid) {
        setErrors(validation.errors);
        setStatus('fail'); return;
      }
      const extractedData = buildExtractedData(validation, user, text, html);
      setExtracted(extractedData);
      localStorage.setItem('extractedData', JSON.stringify(extractedData));
      const token = localStorage.getItem('token');
      if (token) {
        setStatus('saving');
        try {
          const formData = new FormData();
          formData.append('report', file);
          formData.append('compliance_score', validation.score);
          formData.append('organism_name',   extractedData.company?.name   || '');
          formData.append('organism_sector', extractedData.company?.sector || '');
          formData.append('is_compliant',    validation.score >= 75);
          formData.append('maturity_level',  extractedData.company?.maturity_level || 1);
          formData.append('has_rssi',        extractedData.company?.has_rssi || false);
          formData.append('has_pssi',        extractedData.company?.has_pssi || false);
          formData.append('has_pca',         extractedData.company?.has_pca  || false);
          formData.append('has_pra',         extractedData.company?.has_pra  || false);
          await API.post('/reports/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (apiErr) {
          const msg = apiErr.response?.data?.error || apiErr.message;
          setApiError(`Rapport analysé · Sauvegarde échouée : ${msg}`);
        }
      } else {
        setApiError('Non connecté — rapport analysé en local uniquement.');
      }
      setStatus('ok');
    } catch (err) {
      setErrors([`Erreur lecture : ${err.message}`]);
      setStatus('fail');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('extractedData');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const reset = () => {
    setFile(null); setStatus('idle'); setProgress(0);
    setErrors([]); setCheckResults([]); setScore(null); setApiError(''); setExpanded(null); setExtracted(null);
    setOpenAnnexe(null);
  };

  const onDragOver  = (e) => { e.preventDefault(); setDrag(true); };
  const onDragLeave = () => setDrag(false);
  const onDrop      = (e) => { e.preventDefault(); setDrag(false); selectFile(e.dataTransfer.files[0]); };

  const initials = user
    ? (user.username || user.company_name || 'U').charAt(0).toUpperCase()
    : 'U';

  const NAV_LINKS = [
    { to:'/client/dashboard',     label:'Déposer un rapport', icon:'📤' },
    { to:'/client/profile',       label:'Mon profil',         icon:'🏢' },
    { to:'/client/notifications', label:'Notifications',      icon:'🔔' },
    { to:'/client/guide',         label:'Guide de dépôt',     icon:'📖' },
    { to:'/client/contact',       label:'Contacter ANCS',     icon:'💬' },
  ];

  // ── Helper: missing / empty fields per annexe ──
  const getManquants = (key) => {
    if (!extracted) return [];

    if (key === 'annexe1') {
      const c = extracted?.company || {};
      const missing = [];
      if (!c.name || c.name === 'Non renseigné') missing.push('Nom de l\'organisme');
      if (!c.acronym) missing.push('Acronyme');
      if (!c.statut) missing.push('Statut juridique');
      if (!c.sector || c.sector === 'Non renseigné') missing.push('Secteur d\'activité');
      if (!c.email) missing.push('Adresse email');
      return missing.length ? missing : ['Aucun champ manquant (données partielles)'];
    }
    if (key === 'annexe2') {
      return [
        'Désignation des processus métier',
        'Niveaux de Confidentialité (1–4)',
        'Niveaux d\'Intégrité (1–4)',
        'Niveaux de Disponibilité (1–4)',
      ];
    }
    if (key === 'annexe3') {
      const missing = [];
      if (!extracted?.serveursListe?.length) missing.push('Serveurs');
      if (!extracted?.applicationsListe?.length) missing.push('Applications');
      if (!extracted?.reseauListe?.length) missing.push('Infrastructure réseau');
      return missing.length ? missing : ['Aucun champ manquant (données partielles)'];
    }
    if (key === 'annexe4') {
      return [
        'Phases de la mission (Phase 1, Phase 2…)',
        'Équipe intervenante (noms)',
        'Dates de réalisation',
        'Durée totale (Homme/jours)',
      ];
    }
    if (key === 'annexe5') {
      return [
        'Projets et actions du plan précédent',
        'Criticité de chaque action',
        'Taux de réalisation',
        'Évaluation des mesures adoptées',
      ];
    }
    if (key === 'annexe6') {
      return [
        'Domaine 5 — Mesures organisationnelles (valeurs 0–5)',
        'Domaine 6 — Mesures liées aux personnes (valeurs 0–5)',
        'Domaine 7 — Mesures de sécurité physique (valeurs 0–5)',
        'Domaine 8 — Mesures technologiques (valeurs 0–5)',
      ];
    }

    // ── ANNEXE 7: show per-indicator status from indicator_results ──
    if (key === 'annexe7') {
      const annexe7Status = extracted?.annexe_status?.annexe7;
      const indResults    = annexe7Status?.indicator_results || [];

      if (indResults.length === 0) {
        return ['Aucun indicateur extrait — tableau Annexe 7 non reconnu'];
      }

      return indResults
        .filter(r => r.status !== 'ok')
        .map(r => {
          if (r.status === 'absent') return `❌ Non trouvé : ${r.label}`;
          if (r.status === 'vide')   return `⚠️ Valeur vide : ${r.label}`;
          return r.label;
        });
    }

    if (key === 'annexe8') {
      return [
        'Référence de chaque vulnérabilité critique',
        'Description de la vulnérabilité',
        'Criticité (Très Critique / Critique)',
        'Composante(s) du SI impactée(s)',
        'Recommandation associée',
      ];
    }
    if (key === 'annexe9') {
      return [
        'Projets et actions proposés',
        'Criticité de chaque action',
        'Charge estimée (Homme/jours)',
        'Chargé de l\'action / Responsable',
        'Délai / Échéance de mise en œuvre',
      ];
    }
    return [];
  };

  // ── Annexe 7 badge shows filled/total ──
  const getAnnexe7Badge = () => {
    const a7 = extracted?.annexe_status?.annexe7;
    if (!a7) return null;
    return `${a7.filled_count}/${a7.total_expected} indicateurs renseignés`;
  };

  return (
    <div className="af-root" style={{ minHeight:'100vh', background:BG, color:'#e2f0ff' }}>

      {/* ══ NAVBAR ══ */}
      <nav style={{
        background:'rgba(8,20,36,.92)',
        backdropFilter:'blur(16px)',
        borderBottom:'1px solid rgba(255,255,255,.06)',
        padding:'0 28px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        height:60, position:'sticky', top:0, zIndex:100,
        boxShadow:'0 4px 24px rgba(0,0,0,.35)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, background:'linear-gradient(135deg,#0d5580,#1a7a6e)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🏢</div>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color:'#d4e8ff' }}>Espace Entreprise</span>
          </div>
          <div style={{ display:'flex', gap:4 }}>
            {NAV_LINKS.map(nl => {
              const isActive = location.pathname === nl.to;
              return (
                <Link key={nl.to} to={nl.to} className="af-nav-link" style={{
                  background: isActive ? 'rgba(99,210,190,.1)' : 'transparent',
                  color:      isActive ? '#63d2be' : '#3d607a',
                  border:     isActive ? '1px solid rgba(99,210,190,.2)' : '1px solid transparent',
                }}>
                  <span style={{ fontSize:13 }}>{nl.icon}</span>{nl.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {user && (
            <div style={{ display:'flex', alignItems:'center', gap:9, padding:'5px 12px', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:99 }}>
              <div style={{ width:26, height:26, background:'linear-gradient(135deg,#0d5580,#1a7a6e)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800 }}>{initials}</div>
              <span style={{ fontSize:12, color:'#4a6a88' }}>{user.company_name || user.username || user.email}</span>
            </div>
          )}
          <button onClick={handleLogout} style={{ padding:'8px 16px', borderRadius:10, background:'rgba(248,113,113,.1)', color:'#f87171', border:'1px solid rgba(248,113,113,.2)', fontSize:12, fontWeight:600, cursor:'pointer' }}>Déconnexion</button>
        </div>
      </nav>

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'32px 20px' }}>
        <div style={{ width:'100%', maxWidth:620 }}>

          {/* HEADER */}
          <div className="af-anim" style={{ background:'linear-gradient(135deg,#0c1f3a,#0a2540)', border:'1px solid rgba(99,210,190,.12)', borderRadius:22, padding:'22px 28px', marginBottom:20, position:'relative', overflow:'hidden', boxShadow:'0 10px 40px rgba(0,0,0,.4)' }}>
            {[170,115].map((s,i) => (
              <div key={i} style={{ position:'absolute', width:s, height:s, borderRadius:'50%', border:'1px solid rgba(99,210,190,.07)', right:-s/4, top:'50%', transform:'translateY(-50%)', animation:`af-slow ${20+i*8}s linear infinite` }} />
            ))}
            <div style={{ position:'absolute', left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,rgba(99,210,190,.28),transparent)', animation:'af-scan 3.5s linear infinite', pointerEvents:'none' }} />
            <div style={{ display:'flex', alignItems:'center', gap:16, position:'relative' }}>
              <div style={{ width:50, height:50, background:'linear-gradient(135deg,#0d5580,#1a7a6e)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0, boxShadow:'0 0 0 2px rgba(99,210,190,.22)' }}>📤</div>
              <div>
                <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:'#e4f2ff', marginBottom:4 }}>Upload de rapport d'audit</h1>
                <p style={{ fontSize:12, color:'#3d607a' }}>Modèle officiel ANCS · 9 Annexes vérifiées (Annexes 1 à 9)</p>
              </div>
            </div>
          </div>

          {/* CARD */}
          <div className="af-anim" style={{ background:CARD, border:`1px solid ${status==='ok'?'rgba(74,222,128,.18)':status==='fail'?'rgba(248,113,113,.18)':BDR}`, borderRadius:22, padding:24, marginBottom:14, transition:'border-color .4s' }}>
            <input id="af-fi" type="file" accept=".pdf,.docx" style={{ display:'none' }} onChange={e => selectFile(e.target.files[0])} />

            {/* Drop zone */}
            <label htmlFor="af-fi" className={`af-drop${drag?' over':''}`} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
              <div style={{ fontSize:46, display:'inline-block', marginBottom:12, animation:'af-float 3s ease-in-out infinite' }}>
                {status==='ok'?'✅':status==='fail'?'❌':file?'📄':'📂'}
              </div>
              {file ? (
                <>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color:TEAL, marginBottom:4 }}>{file.name}</div>
                  <div style={{ fontSize:11, color:'#3d607a' }}>{(file.size/1024).toFixed(1)} Ko · Cliquez pour changer</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize:14, fontWeight:600, color:'#4a6a88', marginBottom:6 }}>Glissez votre rapport ici</div>
                  <div style={{ fontSize:12, color:'#2a4a62', marginBottom:14 }}>ou cliquez pour sélectionner</div>
                  <div style={{ display:'inline-flex', gap:8 }}>
                    {['PDF','DOCX'].map(f => <span key={f} style={{ fontSize:10, fontWeight:700, color:'#3d607a', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', padding:'4px 12px', borderRadius:99 }}>{f}</span>)}
                  </div>
                </>
              )}
            </label>

            {/* PROGRESS */}
            {(status==='loading'||status==='saving') && (
              <div className="af-anim" style={{ marginTop:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontSize:12, color:'#3d607a' }}>{status==='saving'?'💾 Enregistrement...':STEPS[stepIdx]}</span>
                  <span style={{ fontSize:14, fontWeight:800, color:TEAL, fontFamily:"'Syne',sans-serif" }}>{progress}%</span>
                </div>
                <div style={{ height:7, background:'rgba(255,255,255,.07)', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ width:`${progress}%`, height:'100%', background:`linear-gradient(90deg,${TEAL}55,${TEAL})`, borderRadius:99, transition:'width .4s ease', boxShadow:`0 0 12px ${TEAL}55` }} />
                </div>
                <div style={{ display:'flex', gap:5, marginTop:14, justifyContent:'center' }}>
                  {STEPS.map((_,i) => (
                    <div key={i} style={{ width:i<stepIdx?18:i===stepIdx?10:6, height:6, borderRadius:99, background:i<stepIdx?GREEN:i===stepIdx?TEAL:'rgba(255,255,255,.08)', transition:'all .3s' }} />
                  ))}
                </div>
              </div>
            )}

            {/* SUCCESS */}
            {status==='ok' && (
              <div className="af-anim" style={{ marginTop:18, padding:'16px 20px', background:'rgba(74,222,128,.07)', border:'1px solid rgba(74,222,128,.2)', borderRadius:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background:'rgba(74,222,128,.15)', border:'1px solid rgba(74,222,128,.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>✅</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, color:GREEN, fontSize:15, marginBottom:3 }}>RAPPORT CONFORME</div>
                    <div style={{ fontSize:12, color:apiError?AMBER:'#3d607a' }}>
                      {apiError?`⚠️ ${apiError}`:`✅ Soumis à l'ANCS · ${wordCount} mots analysés`}
                    </div>
                  </div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, color:GREEN, fontSize:28, flexShrink:0 }}>{score}%</div>
                </div>
                <div style={{ borderTop:'1px solid rgba(74,222,128,.15)', paddingTop:12 }}>
                  {checkResults.map((r,i) => (
                    <div key={i}>
                      <div className="af-check-row" style={{ cursor:'pointer' }} onClick={() => setExpanded(expanded===i?null:i)}>
                        <span style={{ fontSize:14, flexShrink:0 }}>{r.found?'✅':'❌'}</span>
                        <span style={{ color:r.found?'#8ab0c8':RED, flex:1, fontWeight:600 }}>{r.label}</span>
                        <span style={{ fontSize:11, color:'#2a4a62' }}>{r.foundCount}/{r.subChecks.length}</span>
                        <span style={{ fontSize:10, color:'#2a4a62' }}>{expanded===i?'▲':'▼'}</span>
                      </div>
                      {expanded===i && r.subResults && (
                        <div style={{ marginBottom:4 }}>
                          {r.subResults.map((s,j) => (
                            <div key={j} className="af-sub-check">
                              <span style={{ fontSize:12 }}>{s.found?'✅':'❌'}</span>
                              <span style={{ color:s.found?'#4a6a88':RED }}>
                                {s.label}
                                {/* Show why it failed for Annexe 7 */}
                                {s.reason === 'valeur_vide' && (
                                  <span style={{ color:AMBER, fontSize:10, marginLeft:6 }}>
                                    (ligne présente · valeur non renseignée)
                                  </span>
                                )}
                                {s.reason === 'non_trouvé' && (
                                  <span style={{ color:RED, fontSize:10, marginLeft:6 }}>
                                    (indicateur absent du tableau)
                                  </span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* ANNEXE STATUS — ALL 9 */}
                {extracted && extracted.annexe_status && (
                  <div style={{ marginTop:16, borderTop:'1px solid rgba(255,255,255,.08)', paddingTop:14 }}>
                    <div style={{ fontSize:11, color:'#3d607a', textTransform:'uppercase', letterSpacing:'.5px', fontWeight:600, marginBottom:10 }}>
                      État des 9 annexes extraites
                    </div>
                    {Object.entries(extracted.annexe_status || {}).map(([key, val]) => {
                      const num       = key.replace('annexe', '');
                      const isEmpty   = val.status === 'empty';
                      const isPartial = val.status === 'partial';
                      const isOpen    = openAnnexe === key;
                      const color     = isEmpty ? RED : isPartial ? AMBER : GREEN;
                      const icon      = isEmpty ? '❌' : isPartial ? '⚠️' : '✅';
                      const label     = isEmpty ? 'Vide' : isPartial ? 'Partiel' : 'Rempli';
                      const canExpand = isEmpty || isPartial;
                      const manquants = getManquants(key);

                      // Special row count display for Annexe 7
                      const isAnnexe7 = key === 'annexe7';
                      const a7badge   = isAnnexe7 ? getAnnexe7Badge() : null;

                      return (
                        <div key={key}>
                          <div
                            style={{
                              display:'flex', alignItems:'center', gap:10,
                              padding:'7px 0',
                              borderBottom:'1px solid rgba(255,255,255,.04)',
                              fontSize:12,
                              cursor: canExpand ? 'pointer' : 'default',
                            }}
                            onClick={() => canExpand && setOpenAnnexe(isOpen ? null : key)}
                          >
                            <span style={{ fontSize:13, flexShrink:0 }}>{icon}</span>
                            <span style={{ color:'#8ab0c8', flex:1 }}>
                              Annexe {num}{val.title ? ` — ${val.title}` : ''}
                              {val.optional && <span style={{ fontSize:10, color:'#3d607a', marginLeft:6 }}>(optionnelle)</span>}
                            </span>
                            <span style={{
                              fontSize:10, fontWeight:700, color,
                              background:`${color}15`, border:`1px solid ${color}30`,
                              padding:'2px 8px', borderRadius:99,
                              textTransform:'uppercase', letterSpacing:'.4px',
                            }}>
                              {label}
                            </span>
                            {/* Annexe 7: show "X/30 indicateurs" instead of raw row count */}
                            {isAnnexe7 && a7badge ? (
                              <span style={{ fontSize:10, color: isEmpty || isPartial ? AMBER : '#2a4a62' }}>
                                {a7badge}
                              </span>
                            ) : (
                              val.row_count > 0 && (
                                <span style={{ fontSize:10, color:'#2a4a62' }}>{val.row_count} lignes</span>
                              )
                            )}
                            {canExpand && (
                              <span style={{ fontSize:10, color }}>{isOpen ? '▲' : '▼'}</span>
                            )}
                          </div>

                          {/* Detail panel */}
                          {canExpand && isOpen && manquants.length > 0 && (
                            <div style={{
                              margin:'4px 0 8px 24px',
                              padding:'12px 16px',
                              background: isEmpty ? 'rgba(248,113,113,.05)' : 'rgba(251,191,36,.05)',
                              border: `1px solid ${isEmpty ? 'rgba(248,113,113,.15)' : 'rgba(251,191,36,.15)'}`,
                              borderRadius:12,
                              fontSize:12,
                            }}>
                              <div style={{ color, fontWeight:600, marginBottom:8 }}>
                                {isEmpty ? 'Champs manquants :' : 'Champs à compléter :'}
                              </div>
                              {manquants.map((champ, ci) => {
                                const isAbsent   = champ.startsWith('❌');
                                const isEmptyVal = champ.startsWith('⚠️');
                                const itemColor  = isAbsent ? RED : isEmptyVal ? AMBER : color;
                                const cleanLabel = champ.replace(/^[❌⚠️]\s*/, '').replace(/^(Non trouvé|Valeur vide)\s*:\s*/, '');
                                return (
                                  <div key={ci} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'4px 0', color:'#8ab0c8', lineHeight:1.4 }}>
                                    <span style={{ color:itemColor, flexShrink:0, marginTop:1 }}>
                                      {isAbsent ? '❌' : isEmptyVal ? '⚠️' : isEmpty ? '❌' : '⚠️'}
                                    </span>
                                    <span style={{ color: isAbsent ? '#c87070' : isEmptyVal ? '#c8a040' : '#8ab0c8' }}>
                                      {isEmptyVal
                                        ? <><span style={{ color:AMBER, fontWeight:600 }}>Valeur vide :</span> {cleanLabel}</>
                                        : isAbsent
                                          ? <><span style={{ color:RED, fontWeight:600 }}>Non trouvé :</span> {cleanLabel}</>
                                          : champ
                                      }
                                    </span>
                                  </div>
                                );
                              })}

                              {/* Annexe 7 summary bar */}
                              {isAnnexe7 && extracted?.annexe_status?.annexe7 && (
                                <div style={{ marginTop:12, paddingTop:10, borderTop:'1px solid rgba(255,255,255,.06)' }}>
                                  {(() => {
                                    const a7 = extracted.annexe_status.annexe7;
                                    const pct = Math.round((a7.filled_count / a7.total_expected) * 100);
                                    return (
                                      <>
                                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#4a6a88', marginBottom:5 }}>
                                          <span>Indicateurs renseignés</span>
                                          <span style={{ color, fontWeight:700 }}>{a7.filled_count} / {a7.total_expected} ({pct}%)</span>
                                        </div>
                                        <div style={{ height:5, background:'rgba(255,255,255,.06)', borderRadius:99, overflow:'hidden' }}>
                                          <div style={{ width:`${pct}%`, height:'100%', background:`linear-gradient(90deg,${color}88,${color})`, borderRadius:99, transition:'width .4s' }} />
                                        </div>
                                        <div style={{ display:'flex', gap:16, marginTop:7, fontSize:10 }}>
                                          <span style={{ color:GREEN }}>✅ {a7.filled_count} renseignés</span>
                                          <span style={{ color:AMBER }}>⚠️ {a7.empty_val_count} valeurs vides</span>
                                          <span style={{ color:RED }}>❌ {a7.absent_count} absents</span>
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* FAIL */}
            {status==='fail' && (
              <div className="af-anim" style={{ marginTop:18, padding:'16px 20px', background:'rgba(248,113,113,.07)', border:'1px solid rgba(248,113,113,.2)', borderRadius:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <span style={{ fontSize:20 }}>❌</span>
                  <div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, color:RED, fontSize:15 }}>RAPPORT NON CONFORME</div>
                    {score!==null && <div style={{ fontSize:12, color:'#3d607a', marginTop:2 }}>Score : {score}% · {wordCount} mots · 100% requis</div>}
                  </div>
                </div>
                {checkResults.length > 0 && (
                  <div style={{ marginBottom:12 }}>
                    {checkResults.map((r,i) => (
                      <div key={i}>
                        <div className="af-check-row" style={{ cursor:'pointer' }} onClick={() => setExpanded(expanded===i?null:i)}>
                          <span style={{ fontSize:14, flexShrink:0 }}>{r.found?'✅':'❌'}</span>
                          <span style={{ color:r.found?'#4a6a88':RED, flex:1, fontWeight:600 }}>{r.label}</span>
                          <span style={{ fontSize:11, color:'#3d607a' }}>{r.foundCount}/{r.subChecks.length} sections</span>
                          <span style={{ fontSize:10, color:'#2a4a62' }}>{expanded===i?'▲':'▼'}</span>
                        </div>
                        {expanded===i && r.subResults && (
                          <div style={{ marginBottom:4 }}>
                            {r.subResults.map((s,j) => (
                              <div key={j} className="af-sub-check">
                                <span style={{ fontSize:12 }}>{s.found?'✅':'❌'}</span>
                                <span style={{ color:s.found?'#4a6a88':RED }}>
                                  {s.label}
                                  {s.reason === 'valeur_vide' && (
                                    <span style={{ color:AMBER, fontSize:10, marginLeft:6 }}>
                                      (ligne présente · valeur non renseignée)
                                    </span>
                                  )}
                                  {s.reason === 'non_trouvé' && (
                                    <span style={{ color:RED, fontSize:10, marginLeft:6 }}>
                                      (indicateur absent du tableau)
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {errors.map((e,i) => (
                  <div key={i} style={{ display:'flex', gap:8, padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,.04)', fontSize:12, color:'#8ab0c8', lineHeight:1.5 }}>
                    <span style={{ color:RED, flexShrink:0 }}>●</span><span>{e}</span>
                  </div>
                ))}
                <div style={{ fontSize:11, color:'#3d607a', marginTop:10 }}>
                  Complétez les sections manquantes en utilisant le modèle officiel ANCS (Annexes 1 à 9).
                </div>
              </div>
            )}

            {(status==='idle'||status==='loading') && (
              <button className="af-btn-verify" onClick={handleVerify} disabled={!file||status==='loading'}>
                {status==='loading'
                  ? <><span style={{ width:16, height:16, border:'2px solid rgba(7,17,30,.2)', borderTop:'2px solid #07111e', borderRadius:'50%', animation:'af-spin 1s linear infinite', flexShrink:0 }} />Analyse en cours...</>
                  : <>🔍 Vérifier la conformité (9 Annexes)</>}
              </button>
            )}
          </div>

          {/* ACTIONS */}
          {(status==='ok'||status==='fail') && (
            <div className="af-anim" style={{ display:'flex', gap:12 }}>
              <button className="af-btn-ghost" style={{ flex:1 }} onClick={reset}>🔄 Nouvel upload</button>
            </div>
          )}

          {/* INFO */}
          <div className="af-anim" style={{ marginTop:14, background:CARD, border:`1px solid ${BDR}`, borderRadius:16, padding:'13px 20px', display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
            {[{i:'📎',t:'PDF ou DOCX'},{i:'🔍',t:'Contenu réel analysé'},{i:'📋',t:'9 Annexes vérifiées'},{i:'📡',t:'Transmis à l\'ANCS'}].map(({i,t}) => (
              <div key={t} style={{ display:'flex', alignItems:'center', gap:7 }}>
                <span>{i}</span><span style={{ fontSize:12, color:'#3d607a' }}>{t}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop:18, textAlign:'center', fontSize:11, color:'#1a3248' }}>
            ANCS Platform · Audit de Sécurité des Systèmes d'Information © 2026
          </div>
        </div>
      </div>
    </div>
  );
}