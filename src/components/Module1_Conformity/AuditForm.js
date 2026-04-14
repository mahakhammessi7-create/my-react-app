import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import API from '../../services/api';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

/* ══════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════
   MODÈLE OFFICIEL ANCS — template_audit_securite_SI.docx
   3 annexes obligatoires avec sous-sections vérifiées
══════════════════════════════════════════════ */
const ANNEXES = [
  {
    key:   'annexe1',
    label: 'Annexe 1 — Identification de l\'Organisme',
    // Champs obligatoires de la table Annexe 1
    subChecks: [
      { label:'Nom de l\'organisme',  keywords:['nom de l\'organisme', 'nom_organisme', '[nom de l\'organisme]'] },
      { label:'Acronyme',             keywords:['acronyme'] },
      { label:'Secteur d\'activité',  keywords:['secteur d\'activité', 'secteur d\'activite'] },
      { label:'Statut',               keywords:['statut'] },
      { label:'Adresse Email',        keywords:['adresse email', 'email', '@'] },
    ],
    minSubChecks: 3, // Au moins 3 champs sur 5 doivent être présents
  },
  {
    key:   'annexe3',
    label: 'Annexe 3 — Description du Système d\'Information',
    // 4 sous-sections obligatoires de l'Annexe 3
    subChecks: [
      { label:'Applications',                  keywords:['applications', 'application', 'modules', 'dév. par'] },
      { label:'Serveurs (par plateforme)',      keywords:['serveurs', 'serveur', 'système d\'exploitation', '@ip', 'rôle'] },
      { label:'Infrastructure Réseau & Sécurité', keywords:['infrastructure réseau', 'infrastructure réseau et sécurité', 'nature', 'marque', 'firewall', 'routeur', 'switch'] },
      { label:'Postes de travail',             keywords:['postes de travail', 'poste de travail', 'système d\'exploitation', 'nombre'] },
    ],
    minSubChecks: 3,
  },
  {
    key:   'annexe7',
    label: 'Annexe 7 — Indicateurs de Sécurité',
    // Classes obligatoires de l'Annexe 7
    subChecks: [
      { label:'Organisation & RSSI',            keywords:['nomination officielle rssi', 'rssi', 'cellule sécurité', 'comité sécurité'] },
      { label:'PSSI',                           keywords:['pssi', 'existence formelle pssi', 'maintien de la pssi'] },
      { label:'Gestion de la continuité (PCA/PRA)', keywords:['pca', 'pra', 'continuité', 'site secours', 'organisation de crise'] },
      { label:'Gestion des actifs',             keywords:['gestion des actifs', 'inventaire complet', 'classification'] },
      { label:'Gestion des risques SI',         keywords:['gestion des risques', 'risques si', 'risques si métier'] },
      { label:'Gestion des incidents',          keywords:['gestion des incidents', 'cellule de gestion des incidents'] },
      { label:'Gestion des sauvegardes',        keywords:['gestion des sauvegardes', 'politique formelle de sauvegarde', 'sauvegarde'] },
      { label:'Contrôle d\'accès logique',      keywords:['contrôle d\'accès', 'contrôleur de domaines', 'vlan', 'proxy'] },
      { label:'Protection antivirale',          keywords:['protection antivirale', 'antivirale', 'antivirus'] },
      { label:'Sécurité physique DC',           keywords:['data-center', 'datacenter', 'local data-center', 'climatisation', 'onduleurs'] },
    ],
    minSubChecks: 6, // Au moins 6 classes sur 10
  },
];

/* ══════════════════════════════════════════════
   LECTURE DU FICHIER
   DOCX → mammoth HTML (préserve la structure des tableaux)
   PDF  → pdfjs page par page
══════════════════════════════════════════════ */

// Lire DOCX en HTML pour préserver les tableaux
async function readDocxHtml(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return result.value; // HTML string
}

// Lire DOCX en texte brut (pour la validation des mots-clés)
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

// Retourne { text, html } — text pour validation, html pour extraction des tableaux
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

/* ══════════════════════════════════════════════
   PARSING HTML DES TABLEAUX DOCX
   Extrait les données structurées des tableaux Annexe 1, 3, 7
══════════════════════════════════════════════ */

// Parse toutes les tables HTML → tableau de tableaux de lignes
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

// Extraire Annexe 1 (table key-value : Nom organisme, Acronyme, Secteur...)
function extractAnnexe1(tables) {
  const result = {};
  tables.forEach(table => {
    // La table Annexe 1 a 2 colonnes : [Champ, Données]
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

/* ══════════════════════════════════════════════
   HELPER : trouver la vraie ligne d'entête
   Le rapport SNDF a une ligne titre fusionnée en row[0]
   et la vraie entête en row[1] (ex: "Serveurs (par plateforme)" répété)
══════════════════════════════════════════════ */
function findHeader(table, requiredKeywords) {
  // Essaie row[0] d'abord, puis row[1] si row[0] ne matche pas
  for (let ri = 0; ri <= Math.min(2, table.length - 1); ri++) {
    const h = table[ri].map(c => c.toLowerCase());
    if (requiredKeywords.every(kw => h.some(c => c.includes(kw)))) {
      return { header: h, dataStart: ri + 1 };
    }
  }
  return null;
}

// Extraire Annexe 3 — table Serveurs
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

// Extraire Annexe 3 — table Applications
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

// Extraire Annexe 3 — Infrastructure réseau
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

// Extraire Annexe 7 — Indicateurs
// ✅ FIX : header = "Classe / Indicateur" (pas "Classe") dans le rapport SNDF
function extractIndicateurs(tables) {
  const indicators = [];
  let currentClass = '';

  tables.forEach(table => {
    if (table.length < 5) return;

    // ✅ Cherche la table Annexe 7 : header contient "indicateur" ET "valeur"
    // Peut être en row[0] ou row[1] (row[0] peut être un titre fusionné)
    let headerRow = null;
    let dataStart = 1;
    for (let ri = 0; ri <= 1; ri++) {
      const h = (table[ri] || []).map(c => c.toLowerCase());
      if (h.some(c => c.includes('indicateur')) && h.some(c => c.includes('valeur'))) {
        headerRow = h;
        dataStart = ri + 1;
        break;
      }
    }
    if (!headerRow) return;

    // ✅ FIX : "Classe / Indicateur" → iClasse cherche "classe" dans la cellule
    const iClasse = headerRow.findIndex(h => h.includes('classe'));
    const iInd    = headerRow.findIndex(h => h.includes('indicateur') && !h.includes('classe'));
    const iVal    = headerRow.findIndex(h => h.includes('valeur'));
    const iCom    = headerRow.findIndex(h => h.includes('commentaire'));

    // Si iInd = -1 (cas "Classe / Indicateur" dans une seule colonne → col 0 = classe+indicateur, col 1 = vrai indicateur)
    const iIndFinal = iInd >= 0 ? iInd : 1;
    const iClasseFinal = iClasse >= 0 ? iClasse : 0;

    table.slice(dataStart).forEach(row => {
      const classeCell = row[iClasseFinal]?.trim() || '';
      const indicateur = row[iIndFinal]?.trim() || '';
      const valeur     = iVal >= 0 ? (row[iVal]?.trim() || '') : '';
      const commentaire= iCom >= 0 ? (row[iCom]?.trim() || '') : '';

      // Mettre à jour la classe courante si la cellule classe est remplie et différente
      if (classeCell && classeCell !== indicateur && classeCell.toLowerCase() !== 'valeur') {
        currentClass = classeCell;
      }

      // Ignorer les lignes vides ou d'en-tête
      if (!indicateur || indicateur.toLowerCase() === 'indicateur' || indicateur === currentClass) return;
      // Ignorer les lignes où l'indicateur = valeur = classe (ligne section)
      if (indicateur === valeur && valeur.length > 3) return;

      indicators.push({ classe: currentClass, indicateur, valeur, commentaire });
    });
  });

  return indicators;
}


/* ══════════════════════════════════════════════
   CLASSIFICATION DES VALEURS ANNEXE 7
   Formats : 1/0, Oui/Non, Totale/Partielle/Absence, texte libre
══════════════════════════════════════════════ */
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
  "Vérification Annexe 3 (Système d'Information)…",
  "Vérification Annexe 7 (Indicateurs)…",
  "Extraction des données…",
  "Calcul score final…",
];

/* ══════════════════════════════════════════════
   VALIDATION — basée sur les tableaux HTML
══════════════════════════════════════════════ */
function validateContent(text) {
  const lower     = text.toLowerCase();
  const wordCount = lower.split(/\s+/).filter(w => w.length > 3).length;
  if (wordCount < 50) {
    return { isEmpty:true, results:[], wordCount, errors:[`Document insuffisant — ${wordCount} mots. Minimum 50 requis.`], score:0, isValid:false };
  }
  const results = ANNEXES.map(annexe => {
    const subResults = annexe.subChecks.map(sub => ({ ...sub, found: sub.keywords.some(kw => lower.includes(kw.toLowerCase())) }));
    const foundCount = subResults.filter(s => s.found).length;
    return { ...annexe, found: foundCount >= annexe.minSubChecks, subResults, foundCount };
  });
  const presentCount = results.filter(r => r.found).length;
  const score = Math.round((presentCount / ANNEXES.length) * 100);
  const errors = results.filter(r => !r.found).map(r => {
    const missing = r.subResults.filter(s => !s.found).map(s => s.label);
    return `${r.label} — ${r.foundCount}/${r.subChecks.length} sections (min ${r.minSubChecks}). Manquants: ${missing.join(', ')}`;
  });
  return { isEmpty:false, results, errors, score, isValid:errors.length===0, wordCount };
}

/* ══════════════════════════════════════════════
   CONSTRUCTION DES DONNÉES EXTRAITES
   Priorité : tableaux HTML (DOCX) > regex text
══════════════════════════════════════════════ */
function buildExtractedData(validation, user, text, html) {
  const { score } = validation;
  const tables       = html ? parseHtmlTables(html) : [];
  const annexe1Data  = extractAnnexe1(tables);
  const servers      = extractServersFromTable(tables);
  const apps         = extractAppsFromTable(tables);
  const network      = extractNetworkFromTable(tables);
  const indicators   = extractIndicateurs(tables);
  const realScore    = calcScoreFromIndicateurs(indicators) ?? score;
  const radar        = buildRadarFromIndicateurs(indicators, realScore);
  const risques      = buildRisquesFromIndicateurs(indicators, realScore);
  const present      = validation.results.filter(r => r.found).length;
  const total        = ANNEXES.length;
  const hasRssi = indicators.some(i => i.indicateur.toLowerCase().includes('rssi') && /oui|existant|yes/i.test(i.valeur));
  const hasPssi = indicators.some(i => i.indicateur.toLowerCase().includes('pssi') && /oui|existant|yes/i.test(i.valeur));
  const hasPca  = indicators.some(i => i.indicateur.toLowerCase().includes('pca')  && /oui|existant|yes/i.test(i.valeur));
  const hasPra  = indicators.some(i => i.indicateur.toLowerCase().includes('pra')  && /oui|existant|yes/i.test(i.valeur));
  const positiveInd = indicators.filter(i => /^(oui|existant|formelle|déployé|yes|x|✓|1|actif|en place)/i.test(i.valeur)).length;
  const partielInd  = indicators.filter(i => /partiel|en cours|prévu/i.test(i.valeur)).length;
  const nonConfInd  = indicators.filter(i => /^(non|absent|inexistant|0)/i.test(i.valeur)).length;
  const totalInd    = indicators.length;
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
    radarMaturite:     radar,
    serveursListe:     servers,
    applicationsListe: apps,
    reseauListe:       network,
    risquesListe:      risques,
    indicators,
  };
}

/* ══════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════ */
export default function AuditForm() {
  const navigate = useNavigate();

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
    setErrors([]); setCheckResults([]); setScore(null); setApiError(''); setExpanded(null);
  };

  const handleVerify = async () => {
    if (!file || status === 'loading') return;
    setStatus('loading'); setProgress(0); setStepIdx(0); setApiError('');

    try {
      // Lecture
      setStepIdx(0); setProgress(10);
      const { text, html } = await readFileContent(file);

      setStepIdx(1); setProgress(22);
      await new Promise(r => setTimeout(r, 200));

      if (!text || text.trim().length === 0) {
        setErrors(['Fichier vide — aucun texte extrait. Le fichier est peut-être corrompu ou scanné sans OCR.']);
        setStatus('fail'); return;
      }

      // Vérification des 3 annexes
      for (let i = 2; i <= 5; i++) {
        setStepIdx(i); setProgress(22 + i * 15);
        await new Promise(r => setTimeout(r, 350));
      }

      setStepIdx(6); setProgress(97);
      await new Promise(r => setTimeout(r, 250));

      const validation = validateContent(text);
      setCheckResults(validation.results);
      setScore(validation.score);
      setWordCount(validation.wordCount || 0);
      setProgress(100);

      if (validation.isEmpty || !validation.isValid) {
        setErrors(validation.errors);
        setStatus('fail'); return;
      }

      // Conforme — extraire et sauvegarder
      const extracted = buildExtractedData(validation, user, text, html);
      localStorage.setItem('extractedData', JSON.stringify(extracted));

      // ✅ Sauvegarder en base si token disponible
      const token = localStorage.getItem('token');
      if (token) {
        setStatus('saving');
        try {
          await API.post('/reports/upload', {
            filename:         file.name,
            compliance_score: validation.score,
            extracted_data:   extracted,
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

  // ✅ FIX navigation : window.location.href force le rechargement du tab
  // navigate() depuis un composant enfant ne met pas toujours à jour
  // useSearchParams() du parent ClientDashboard
  const handleLogout = () => {
    localStorage.removeItem('extractedData');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };
  const reset = () => {
    setFile(null); setStatus('idle'); setProgress(0);
    setErrors([]); setCheckResults([]); setScore(null); setApiError(''); setExpanded(null);
  };

  const onDragOver  = (e) => { e.preventDefault(); setDrag(true); };
  const onDragLeave = () => setDrag(false);
  const onDrop      = (e) => { e.preventDefault(); setDrag(false); selectFile(e.dataTransfer.files[0]); };

  const initials = user
    ? (user.username || user.company_name || 'U').charAt(0).toUpperCase()
    : 'U';

  /* ══ RENDER ══ */
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
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, background:'linear-gradient(135deg,#0d5580,#1a7a6e)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🏢</div>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color:'#d4e8ff' }}>Espace Entreprise</span>
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
              <p style={{ fontSize:12, color:'#3d607a' }}>Modèle officiel ANCS · Annexes 1, 3 et 7 vérifiées</p>
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
              {/* Résultats par annexe avec expand */}
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
                            <span style={{ color:s.found?'#4a6a88':RED }}>{s.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
              {/* Résultats par annexe */}
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
                              <span style={{ color:s.found?'#4a6a88':RED }}>{s.label}</span>
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
                Complétez les sections manquantes en utilisant le modèle officiel ANCS (Annexes 1, 3 et 7).
              </div>
            </div>
          )}

          {(status==='idle'||status==='loading') && (
            <button className="af-btn-verify" onClick={handleVerify} disabled={!file||status==='loading'}>
              {status==='loading'
                ? <><span style={{ width:16, height:16, border:'2px solid rgba(7,17,30,.2)', borderTop:'2px solid #07111e', borderRadius:'50%', animation:'af-spin 1s linear infinite', flexShrink:0 }} />Analyse en cours...</>
                : <>🔍 Vérifier la conformité</>}
            </button>
          )}
        </div>

        {/* ACTIONS */}
        {(status==='ok'||status==='fail') && (
          <div className="af-anim" style={{ display:'flex', gap:12 }}>
            <button className="af-btn-ghost" style={{ flex: 1 }} onClick={reset}>🔄 Nouvel upload</button>
          </div>
        )}

        {/* INFO */}
        <div className="af-anim" style={{ marginTop:14, background:CARD, border:`1px solid ${BDR}`, borderRadius:16, padding:'13px 20px', display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
          {[{i:'📎',t:'PDF ou DOCX'},{i:'🔍',t:'Contenu réel analysé'},{i:'📋',t:'Annexes 1, 3 & 7'},{i:'📡',t:'Transmis à l\'ANCS'}].map(({i,t}) => (
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