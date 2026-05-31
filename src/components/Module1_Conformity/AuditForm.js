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
// NORMALIZE helper — strips accents, lowercases
// ══════════════════════════════════════════════
const norm = s =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

// ══════════════════════════════════════════════
// ALL 9 ANNEXES DEFINITION
// ══════════════════════════════════════════════
const ANNEXES = [
  {
    key: 'annexe1',
    label: "Annexe 1 — Identification de l'Organisme",
    minFields: 4,
  },
  {
    key: 'annexe2',
    label: 'Annexe 2 — Cartographie des Processus (DIC)',
    minRows: 1,
  },
  {
    key: 'annexe3',
    label: "Annexe 3 — Description du Système d'Information",
    minSections: 1,
  },
  {
    key: 'annexe4',
    label: "Annexe 4 — Planning d'Exécution Réel",
    minRows: 1,
  },
  {
    key: 'annexe5',
    label: "Annexe 5 — Évaluation du Plan d'Action Précédent",
    minRows: 1,
  },
  {
    key: 'annexe6',
    label: 'Annexe 6 — État de Maturité de la Sécurité du SI',
    minRows: 4,
  },
  {
    key: 'annexe7',
    label: 'Annexe 7 — Indicateurs de Sécurité',
    minRows: 5,
  },
  {
    key: 'annexe8',
    label: 'Annexe 8 — Vulnérabilités Très Critiques',
    minRows: 1,
    optional: true,
  },
  {
    key: 'annexe9',
    label: "Annexe 9 — Plan d'Action Proposé",
    minRows: 1,
  },
];

// ══════════════════════════════════════════════
// classifyValue — ANCS v2.1 scale 0-5
// ══════════════════════════════════════════════
function classifyValue(valeur) {
  if (!valeur || valeur.trim() === '') return 'vide';
  const v = valeur.trim().toLowerCase();
  if (/^(n\/a|na|non applicable|non-applicable)$/.test(v)) return 'positif';
  if (/^(0|inexistant|inexistante|aucun|aucune|jamais|néant|neant|—|-)$/.test(v)) return 'negatif';
  if (/^(1|2|partiel|en cours|prévu|prevu|informel|informelle|répétable|repetetable)$/.test(v)) return 'partiel';
  if (/^(3|4|5|oui|yes|existant|existante|formelle|formalisée|formalisee|déployé|deployee|deploye|totale|total|actif|active|en place|présent|présente|present|presente|conforme|dsi)$/.test(v)) return 'positif';
  const num = parseFloat(v);
  if (!isNaN(num)) {
    if (num === 0) return 'negatif';
    if (num < 3) return 'partiel';
    return 'positif';
  }
  if (/^(absence|absent)$/.test(v)) return 'negatif';
  if (/^(partielle?)$/.test(v)) return 'partiel';
  if (/^(totale?)$/.test(v)) return 'positif';
  return 'partiel';
}

// ══════════════════════════════════════════════
// FILE READERS
// ══════════════════════════════════════════════
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
    return { text: '', html: '' };
  } catch (e) {
    console.error('Erreur lecture:', e);
    return { text: '', html: '' };
  }
}

// ══════════════════════════════════════════════
// TABLE PARSER
// ══════════════════════════════════════════════
function parseHtmlTables(html) {
  const parser = new DOMParser();
  const doc    = parser.parseFromString(html, 'text/html');
  return Array.from(doc.querySelectorAll('table')).map(table =>
    Array.from(table.querySelectorAll('tr')).map(row =>
      Array.from(row.querySelectorAll('td, th')).map(c => c.textContent.trim())
    ).filter(r => r.some(c => c.length > 0))
  );
}

// ══════════════════════════════════════════════
// FLEXIBLE HEADER FINDER
// ══════════════════════════════════════════════
function findHeader(table, requiredKeywords) {
  for (let ri = 0; ri <= Math.min(2, table.length - 1); ri++) {
    const h = table[ri].map(c => norm(c));
    if (requiredKeywords.every(kw => h.some(c => c.includes(norm(kw))))) {
      return { header: h, dataStart: ri + 1 };
    }
  }
  return null;
}

// ══════════════════════════════════════════════
// ANNEXE 1 — Identification organisme
// ══════════════════════════════════════════════
function extractAnnexe1(tables, text) {
  const result = {};
  const lower  = (text || '').toLowerCase();

  tables.forEach(table => {
    table.forEach(row => {
      if (row.length < 2) return;
      const key = norm(row[0]);
      const val = row[1].trim();
      if (!val || val === '…' || val === '-') return;
      if (key.includes('nom') && key.includes('organisme')) result.companyName = val;
      else if (key === 'acronyme' || key.includes('acronyme')) result.acronym = val;
      else if (key.includes('statut')) result.statut = val;
      else if (key.includes('secteur')) result.sector = val;
      else if (key.includes('email') || key.includes('e-mail')) result.email = val;
      else if (key.includes('categorie') || key.includes('catégorie')) result.categorie = val;
      else if (key.includes('site web') || key.includes('website')) result.siteWeb = val;
    });
  });

  if (!result.companyName) {
    const m = lower.match(/nom\s+(?:de\s+l['']organisme)?\s*[:\-]\s*([^\n\r]+)/i);
    if (m) result.companyName = m[1].trim();
  }
  if (!result.acronym) {
    const m = lower.match(/acronyme\s*[:\-]\s*([^\n\r]+)/i);
    if (m) result.acronym = m[1].trim();
  }
  if (!result.sector) {
    const m = lower.match(/secteur(?:\s+d['']activit[eé])?\s*[:\-]\s*([^\n\r]+)/i);
    if (m) result.sector = m[1].trim();
  }
  if (!result.email) {
    const m = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    if (m) result.email = m[0];
  }

  return result;
}

// ══════════════════════════════════════════════
// ANNEXE 2 — Processus DIC
// ══════════════════════════════════════════════
function extractAnnexe2(tables) {
  const processes = [];
  tables.forEach(table => {
    if (table.length < 2) return;
    let headerIdx = -1;
    for (let ri = 0; ri <= Math.min(2, table.length - 1); ri++) {
      const h = table[ri].map(c => norm(c)).join(' ');
      if ((h.includes('confidential') || h.includes('integrit') || h.includes('disponibil')) && h.includes('processus')) {
        headerIdx = ri;
        break;
      }
    }
    if (headerIdx === -1) {
      for (let ri = 0; ri <= Math.min(2, table.length - 1); ri++) {
        const h = table[ri].map(c => norm(c)).join(' ');
        if (h.includes('confidential') && h.includes('integrit') && h.includes('disponibil')) {
          headerIdx = ri;
          break;
        }
      }
    }
    if (headerIdx === -1) return;

    const header = table[headerIdx].map(c => norm(c));
    const iName  = header.findIndex(h => h.includes('processus') || h.includes('designation') || h.includes('désignation') || h === 'nom');
    const iC     = header.findIndex(h => h.includes('confidential'));
    const iI     = header.findIndex(h => h.includes('integrit'));
    const iD     = header.findIndex(h => h.includes('disponibil'));

    table.slice(headerIdx + 1).forEach(row => {
      const name = iName >= 0 ? row[iName]?.trim() : row[0]?.trim();
      if (!name || name === '…' || norm(name).includes('processus')) return;
      processes.push({
        name,
        confidentialite: iC >= 0 ? (row[iC]?.trim() || '') : '',
        integrite:       iI >= 0 ? (row[iI]?.trim() || '') : '',
        disponibilite:   iD >= 0 ? (row[iD]?.trim() || '') : '',
      });
    });
  });
  return processes;
}

// ══════════════════════════════════════════════
// ANNEXE 3 — Servers
// ══════════════════════════════════════════════
function extractServersFromTable(tables) {
  const servers = [];
  tables.forEach(table => {
    if (table.length < 2) return;
    let headerIdx = -1;
    for (let ri = 0; ri <= Math.min(2, table.length - 1); ri++) {
      const h = table[ri].map(c => norm(c));
      const hasNom = h.some(c => c === 'nom' || c.includes('serveur'));
      const hasOs  = h.some(c => c.includes('exploitation') || c === 'os' || c.includes(' os') || c.startsWith('os '));
      const hasRole= h.some(c => c.includes('role') || c.includes('metier'));
      const hasIp  = h.some(c => c.includes('@ip') || c === 'ip');
      if (hasNom && (hasOs || hasRole || hasIp)) { headerIdx = ri; break; }
    }
    if (headerIdx === -1) return;

    const header = table[headerIdx].map(c => norm(c));
    const iNom  = header.findIndex(h => h === 'nom' || (h.includes('nom') && !h.includes('prenom')));
    const iIp   = header.findIndex(h => h.includes('@ip') || (h === 'ip'));
    const iType = header.findIndex(h => h === 'type' || h.includes('mv') || h.includes('mp'));
    const iOs   = header.findIndex(h =>
      h.includes('exploitation') || h === 'os' || h.endsWith(' os') || h.startsWith('os ')
    );
    const iRole = header.findIndex(h =>
      h.includes('role') || h.includes('metier') || h.includes('fonction')
    );
    const iPer  = header.findIndex(h => h.includes('perimetre') || h.includes('inclus'));

    if (iNom < 0) return;

    table.slice(headerIdx + 1).forEach(row => {
      const nom = row[iNom]?.trim();
      if (!nom || nom.length < 1) return;
      if (norm(nom) === 'nom' || norm(nom) === 'serveur') return;
      servers.push({
        nom,
        ip:        iIp   >= 0 ? (row[iIp]?.trim()   || '') : '',
        type:      iType >= 0 ? (row[iType]?.trim()  || '') : '',
        os:        iOs   >= 0 ? (row[iOs]?.trim()    || '') : '',
        role:      iRole >= 0 ? (row[iRole]?.trim()  || '') : '',
        perimetre: iPer  >= 0 ? !/^(non|hors|false|no)$/i.test(row[iPer]?.trim() || '') : true,
      });
    });
  });
  return servers.filter(s => s.nom).slice(0, 30);
}

// ══════════════════════════════════════════════
// ANNEXE 3 — Applications
// ══════════════════════════════════════════════
function extractAppsFromTable(tables) {
  const apps = [];
  tables.forEach(table => {
    if (table.length < 2) return;
    let headerIdx = -1;
    for (let ri = 0; ri <= Math.min(2, table.length - 1); ri++) {
      const h = table[ri].map(c => norm(c)).join(' ');
      if (h.includes('application') || h.includes('module') || h.includes('developpee') || h.includes('developpe')) {
        headerIdx = ri;
        break;
      }
    }
    if (headerIdx === -1) return;

    const header = table[headerIdx].map(c => norm(c));
    const iNom   = header.findIndex(h => h === 'nom' || h.includes('application'));
    const iMod   = header.findIndex(h => h.includes('module'));
    const iDesc  = header.findIndex(h => h.includes('description'));
    const iEnv   = header.findIndex(h => h.includes('environnement') || h.includes('developpement'));
    const iDev   = header.findIndex(h =>
      (h.includes('dev') || h.includes('developpee') || h.includes('developpe')) && !h.includes('environnement')
    );
    const iHost  = header.findIndex(h =>
      (h.includes('serveur') && h.includes('hebergement')) || h.includes('hosting')
    );
    const iUtil  = header.findIndex(h => h.includes('utilisateur') || h.includes('nombre'));
    const iPer   = header.findIndex(h => h.includes('perimetre') || h.includes('inclus'));

    if (iNom < 0) return;

    table.slice(headerIdx + 1).forEach(row => {
      const nom = row[iNom]?.trim();
      if (!nom || nom.length < 1 || norm(nom) === 'nom') return;
      const perVal = iPer >= 0 ? (row[iPer]?.trim() || 'Oui') : 'Oui';
      apps.push({
        nom,
        modules:      iMod  >= 0 ? (row[iMod]?.trim()  || '') : '',
        description:  iDesc >= 0 ? (row[iDesc]?.trim() || '') : '',
        env:          iEnv  >= 0 ? (row[iEnv]?.trim()  || '') : '',
        dev:          iDev  >= 0 ? (row[iDev]?.trim()  || '') : '',
        hosting:      iHost >= 0 ? (row[iHost]?.trim() || '') : '',
        utilisateurs: iUtil >= 0 ? (parseInt(row[iUtil]) || 0) : 0,
        perimetre:    !/^(non|hors|false|no)$/i.test(perVal),
      });
    });
  });
  return apps.filter(a => a.nom).slice(0, 20);
}

// ══════════════════════════════════════════════
// ANNEXE 3 — Network
// ══════════════════════════════════════════════
function extractNetworkFromTable(tables) {
  const network = [];
  tables.forEach(table => {
    if (table.length < 2) return;
    const found = findHeader(table, ['nature', 'marque']);
    if (!found) return;
    const { header, dataStart } = found;
    const iNature = header.findIndex(h => h.includes('nature'));
    const iMarque = header.findIndex(h => h.includes('marque'));
    const iNb     = header.findIndex(h => h === 'nb' || h === 'nombre' || h.includes('quantit'));
    const iAdmin  = header.findIndex(h => h.includes('administr') || h.includes('ger'));
    const iObs    = header.findIndex(h => h.includes('observation'));
    const iPer    = header.findIndex(h => h.includes('perimetre') || h.includes('inclus'));
    table.slice(dataStart).forEach(row => {
      const nature = row[iNature]?.trim();
      if (!nature || norm(nature) === 'nature') return;
      network.push({
        nature,
        marque:       iMarque >= 0 ? (row[iMarque]?.trim() || '') : '',
        nb:           iNb     >= 0 ? (parseInt(row[iNb]) || 1) : 1,
        admin:        iAdmin  >= 0 ? (row[iAdmin]?.trim()  || '') : '',
        observations: iObs    >= 0 ? (row[iObs]?.trim() || '') : '',
        perimetre:    iPer    >= 0 ? !/^(non|hors|false|no)$/i.test(row[iPer]?.trim() || '') : true,
      });
    });
  });
  return network.filter(n => n.nature).slice(0, 20);
}

// ══════════════════════════════════════════════
// ANNEXE 4 — Planning
// ══════════════════════════════════════════════
function extractAnnexe4(tables) {
  const phases = [];
  tables.forEach(table => {
    if (table.length < 2) return;
    let headerIdx = -1;
    for (let ri = 0; ri <= Math.min(2, table.length - 1); ri++) {
      const h = table[ri].map(c => norm(c)).join(' ');
      if ((h.includes('phase') || h.includes('composant')) &&
          (h.includes('duree') || h.includes('h/j') || h.includes('date') || h.includes('intervenant'))) {
        headerIdx = ri;
        break;
      }
    }
    if (headerIdx === -1) return;

    const header    = table[headerIdx].map(c => norm(c));
    const iPhase    = header.findIndex(h => h.includes('phase') || h.includes('composant') || h.includes('objet'));
    const iIntervn  = header.findIndex(h => h.includes('intervenant') || h.includes('equipe'));
    const iDuree    = header.findIndex(h => h.includes('duree') || h.includes('h/j') || h.includes('hommes'));
    const iDateDeb  = header.findIndex(h => h.includes('date') && (h.includes('debut') || h.includes('début') || h.includes('realisation')));
    const iDateFin  = header.findIndex(h => h.includes('date') && h.includes('fin'));

    if (iPhase < 0) return;

    table.slice(headerIdx + 1).forEach(row => {
      const phase = row[iPhase]?.trim();
      if (!phase || phase === '…' || phase.length < 2) return;
      phases.push({
        phase,
        intervenant: iIntervn >= 0 ? (row[iIntervn]?.trim() || '') : '',
        duree:       iDuree   >= 0 ? (row[iDuree]?.trim()   || '') : '',
        dateDeb:     iDateDeb >= 0 ? (row[iDateDeb]?.trim()  || '') : '',
        dateFin:     iDateFin >= 0 ? (row[iDateFin]?.trim()  || '') : '',
      });
    });
  });
  return phases.slice(0, 20);
}

// ══════════════════════════════════════════════
// ANNEXE 5 — Previous action plan evaluation
// ══════════════════════════════════════════════
function extractAnnexe5(tables) {
  const actions = [];
  tables.forEach(table => {
    if (table.length < 2) return;
    let headerIdx = -1;
    for (let ri = 0; ri <= Math.min(2, table.length - 1); ri++) {
      const h = table[ri].map(c => norm(c)).join(' ');
      if (h.includes('taux') || (h.includes('action') && h.includes('evaluation'))) {
        headerIdx = ri;
        break;
      }
    }
    if (headerIdx === -1) return;

    const header = table[headerIdx].map(c => norm(c));
    const iProj  = header.findIndex(h => h.includes('projet'));
    const iAction= header.findIndex(h => h.includes('action') && !h.includes('charge'));
    const iCrit  = header.findIndex(h => h.includes('criticite') || h.includes('criticité'));
    const iTaux  = header.findIndex(h => h.includes('taux'));
    const iEval  = header.findIndex(h => h.includes('evaluation') || h.includes('évaluation'));

    let currentProject = '';
    table.slice(headerIdx + 1).forEach(row => {
      const proj   = iProj >= 0 ? row[iProj]?.trim() : '';
      const action = iAction >= 0 ? row[iAction]?.trim() : row[1]?.trim();
      if (proj && proj !== '…') currentProject = proj;
      if (!action || action === '…') return;
      actions.push({
        projet:          currentProject,
        action,
        criticite:       iCrit >= 0 ? (row[iCrit]?.trim() || '') : '',
        tauxRealisation: iTaux >= 0 ? (row[iTaux]?.trim() || '') : '',
        evaluation:      iEval >= 0 ? (row[iEval]?.trim() || '') : '',
      });
    });
  });
  return actions.slice(0, 30);
}

// ══════════════════════════════════════════════
// ANNEXE 6 — Security maturity
// ══════════════════════════════════════════════
function extractAnnexe6(tables) {
  const domaines = [];
  tables.forEach(table => {
    if (table.length < 3) return;
    let headerIdx = -1;
    for (let ri = 0; ri <= Math.min(2, table.length - 1); ri++) {
      const h = table[ri].map(c => norm(c)).join(' ');
      if (h.includes('valeur') && (h.includes('mesure') || h.includes('domaine') || h.includes('critere'))) {
        headerIdx = ri;
        break;
      }
    }
    if (headerIdx === -1) return;

    const header   = table[headerIdx].map(c => norm(c));
    const iDomain  = header.findIndex(h => h.includes('domaine'));
    const iCritere = header.findIndex(h => h.includes('critere') || h.includes('mesure'));
    const iVal     = header.findIndex(h => h.includes('valeur'));
    const iComment = header.findIndex(h => h.includes('commentaire'));

    let currentDomain = '';
    table.slice(headerIdx + 1).forEach(row => {
      const domain  = iDomain  >= 0 ? row[iDomain]?.trim()  : '';
      const critere = iCritere >= 0 ? row[iCritere]?.trim() : row[0]?.trim();
      const valeur  = iVal     >= 0 ? row[iVal]?.trim()     : '';
      const comment = iComment >= 0 ? row[iComment]?.trim() : '';
      if (domain && domain !== '…') currentDomain = domain;
      if (!critere || critere === '…') return;
      domaines.push({ domaine: currentDomain, critere, valeur: valeur || '', commentaire: comment || '' });
    });
  });
  return domaines.slice(0, 60);
}

// ══════════════════════════════════════════════
// ANNEXE 7 — Security indicators
// ══════════════════════════════════════════════
function extractIndicateurs(tables) {
  const indicators = [];
  let currentClass = '';
  tables.forEach(table => {
    if (table.length < 2) return;
    let headerIdx = -1;
    for (let ri = 0; ri <= Math.min(2, table.length - 1); ri++) {
      const h = table[ri].map(c => norm(c));
      const hasVal = h.some(c => c.includes('valeur'));
      const hasInd = h.some(c => c.includes('indicateur') || c.includes('classe') || c.includes('mesure'));
      if (hasVal && hasInd) { headerIdx = ri; break; }
    }
    if (headerIdx === -1) return;

    const header       = table[headerIdx].map(c => norm(c));
    const iClasse      = header.findIndex(h => h.includes('classe'));
    const iInd         = header.findIndex(h => (h.includes('indicateur') && !h.includes('classe')) || h.includes('mesure'));
    const iVal         = header.findIndex(h => h.includes('valeur'));
    const iCom         = header.findIndex(h => h.includes('commentaire'));
    const iIndFinal    = iInd >= 0 ? iInd : 1;
    const iClasseFinal = iClasse >= 0 ? iClasse : 0;

    table.slice(headerIdx + 1).forEach(row => {
      const classeCell = row[iClasseFinal]?.trim() || '';
      const indicateur = row[iIndFinal]?.trim() || '';
      const valeur     = iVal >= 0 ? (row[iVal]?.trim() || '') : '';
      const commentaire= iCom >= 0 ? (row[iCom]?.trim() || '') : '';
      if (classeCell && classeCell !== indicateur && norm(classeCell) !== 'valeur') {
        currentClass = classeCell;
      }
      if (!indicateur || norm(indicateur) === 'indicateur' || indicateur === currentClass) return;
      if (indicateur === valeur && valeur.length > 3) return;
      indicators.push({ classe: currentClass, indicateur, valeur, commentaire });
    });
  });
  return indicators;
}

// ══════════════════════════════════════════════
// ANNEXE 8 — Critical vulnerabilities
// ══════════════════════════════════════════════
function extractAnnexe8(text, tables) {
  const vulns = [];

  if (tables) {
    tables.forEach(table => {
      if (table.length < 2) return;
      let headerIdx = -1;
      for (let ri = 0; ri <= Math.min(3, table.length - 1); ri++) {
        const h = table[ri].map(c => norm(c)).join(' ');
        if (
          h.includes('vulnerabilit') ||
          h.includes('reference') ||
          h.includes('vuln') ||
          (h.includes('actif') && h.includes('impact')) ||
          h.includes('recommandation')
        ) {
          headerIdx = ri;
          break;
        }
      }
      if (headerIdx === -1) return;

      const header = table[headerIdx].map(c => norm(c));
      const findCol = (...candidates) =>
        header.findIndex(h => candidates.some(c => h.includes(norm(c))));

      const iRef    = findCol('reference', 'réference', 'ref vuln', 'identifiant', 'id');
      const iVuln   = findCol('vulnerabilit', 'intitule', 'intitulé', 'designation', 'titre', 'description');
      const iActifs = findCol('actif', 'composante', 'impacte', 'impact');
      const iImpact = findCol('impact d\'exploitation', 'impact/consequence', 'consequence', 'gravite');
      const iProba  = findCol('probabilit');
      const iReco   = findCol('recommandation');

      if (iRef < 0 && iVuln < 0 && iReco < 0) return;

      table.slice(headerIdx + 1).forEach(row => {
        const ref  = iRef  >= 0 ? (row[iRef]?.trim()    || '') : '';
        const vuln = iVuln >= 0 ? (row[iVuln]?.trim()   || '') : '';
        const reco = iReco >= 0 ? (row[iReco]?.trim()   || '') : '';

        if (!ref && !vuln && !reco) return;
        if (norm(ref) === 'reference' || norm(ref) === 'réference') return;
        if (norm(vuln) === 'vulnerabilite' || norm(vuln) === 'intitule') return;

        vulns.push({
          ref:         ref || vuln || `VULN-${vulns.length + 1}`,
          vuln:        vuln,
          actifs:      iActifs >= 0 ? (row[iActifs]?.trim()  || '') : '',
          impact:      iImpact >= 0 ? (row[iImpact]?.trim()  || '') : '',
          probabilite: iProba  >= 0 ? (row[iProba]?.trim()   || '') : '',
          reco:        reco,
          source:      'tableau',
        });
      });
    });
  }

  if (vulns.length === 0 && text) {
    const refMatches = [...text.matchAll(/r[eé]f[eé]rence\s*(?:de la vuln[eé]rabilit[eé])?\s*[:：]\s*([^\n]+)/gi)];
    refMatches.forEach(m => {
      const ref = m[1]?.trim();
      if (!ref || ref.length <= 1) return;
      const snippet = text.slice(m.index, m.index + 800);
      vulns.push({
        ref,
        vuln:    snippet.match(/(?:intitul[eé]|description|titre)\s*[:：]\s*([^\n]+)/i)?.[1]?.trim() || '',
        actifs:  snippet.match(/(?:composante|actifs\s+impact[eé]s?)\s*[:：]\s*([^\n]+)/i)?.[1]?.trim() || '',
        impact:  snippet.match(/impact\s*(?:d['']exploitation)?\s*[:：]\s*([^\n]+)/i)?.[1]?.trim() || '',
        reco:    snippet.match(/recommandation\s*[:：]\s*([^\n]+)/i)?.[1]?.trim() || '',
        source:  'texte',
      });
    });

    if (vulns.length === 0) {
      const idMatches = [...text.matchAll(/\b(VULN[-_]?\w+)\b/gi)];
      const seen = new Set();
      idMatches.forEach(m => {
        const ref = m[1].trim();
        if (seen.has(ref)) return;
        seen.add(ref);
        const snippet = text.slice(m.index, m.index + 500);
        vulns.push({
          ref,
          vuln:   '',
          actifs: '',
          impact: '',
          reco:   snippet.match(/recommandation\s*[:：]\s*([^\n]+)/i)?.[1]?.trim() || '',
          source: 'texte-id',
        });
      });
    }
  }

  return vulns.filter(v => v.ref && v.ref.length > 0).slice(0, 30);
}

// ══════════════════════════════════════════════
// ANNEXE 9 — Proposed action plan
// ══════════════════════════════════════════════
function extractAnnexe9(tables) {
  const actions = [];
  tables.forEach(table => {
    if (table.length < 2) return;
    let headerIdx = -1;
    for (let ri = 0; ri <= Math.min(2, table.length - 1); ri++) {
      const h = table[ri].map(c => norm(c)).join(' ');
      if (h.includes('action') && (h.includes('delai') || h.includes('h/j') || h.includes('planification') || h.includes('echeance'))) {
        headerIdx = ri;
        break;
      }
    }
    if (headerIdx === -1) return;

    const header  = table[headerIdx].map(c => norm(c));
    const iProj   = header.findIndex(h => h.includes('projet'));
    const iAction = header.findIndex(h => h.includes('action') && !h.includes('charge'));
    const iCrit   = header.findIndex(h => h.includes('criticite') || h.includes('priorite'));
    const iCharge = header.findIndex(h => h.includes('charge') || h.includes('h/j'));
    const iResp   = header.findIndex(h => h.includes('charge de') || h.includes('responsable'));
    const iDelai  = header.findIndex(h => h.includes('delai') || h.includes('planification') || h.includes('echeance') || h.includes('mise en oeuvre'));

    let currentProject = '';
    table.slice(headerIdx + 1).forEach(row => {
      const proj   = iProj >= 0 ? row[iProj]?.trim() : '';
      const action = iAction >= 0 ? row[iAction]?.trim() : row[1]?.trim();
      if (proj && proj !== '…') currentProject = proj;
      if (!action || action === '…') return;
      actions.push({
        projet:    currentProject,
        action,
        criticite: iCrit   >= 0 ? (row[iCrit]?.trim()   || '') : '',
        charge:    iCharge >= 0 ? (row[iCharge]?.trim()  || '') : '',
        responsable: iResp >= 0 ? (row[iResp]?.trim()   || '') : '',
        delai:     iDelai  >= 0 ? (row[iDelai]?.trim()   || '') : '',
      });
    });
  });
  return actions.slice(0, 30);
}

// ══════════════════════════════════════════════
// SCORE HELPERS
// ══════════════════════════════════════════════
function isHeaderRow(ind) {
  const v = (ind.valeur || '').trim().toLowerCase();
  const i = (ind.indicateur || '').trim().toLowerCase();
  return !v || v === i || v === 'valeur';
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
    'Gouvernance':       ['rssi','fiche de poste','comite','cellule','pssi','tableau de bord','audit interne'],
    'Risques & Actifs':  ['risque','inventaire','classification','conformite'],
    'Continuite':        ['pca','pra','site secours','crise'],
    'Controle Acces':    ['acces','controleur de domaine','iam','proxy','matrice de flux','vlan','admin'],
    'Protection':        ['antivirale','antivirus','patch','correctif','firmware','eol'],
    'Sauvegardes':       ['sauvegarde','restauration','clonage','site distant','codes sources'],
    'Securite Physique': ['data-center','datacenter','onduleur','climatisation','cablage','incendie','video','foudre'],
    'Incidents':         ['incident','siem','ids','ips','detection','alerte','maintenance'],
  };
  const labels = {
    'Gouvernance':'Gouvernance','Risques & Actifs':'Risques & Actifs',
    'Continuite':'Continuité','Controle Acces':'Contrôle Accès',
    'Protection':'Protection','Sauvegardes':'Sauvegardes',
    'Securite Physique':'Sécurité Physique','Incidents':'Incidents',
  };
  return Object.entries(domaines).map(([key, kws]) => {
    const rel = indicators.filter(ind =>
      !isHeaderRow(ind) &&
      kws.some(k => norm(ind.indicateur).includes(k) || norm(ind.classe).includes(k))
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
  const classifyInd = (kws) => {
    const f = real.find(ind => kws.some(k => norm(ind.indicateur).includes(norm(k))));
    return f ? classifyValue(f.valeur) : 'absent';
  };
  const getComment = (kws) => {
    const f = real.find(ind => kws.some(k => norm(ind.indicateur).includes(norm(k))));
    return f?.commentaire || '';
  };
  if (classifyInd(['pca']) === 'negatif' || classifyInd(['maintien du pca']) === 'negatif')
    risques.push({ risque:'PCA non testé', probabilite:'Élevée', impact:'Critique', niv:'critique', desc: getComment(['pca']) || 'PCA non testé' });
  if (classifyInd(['site secours', 'site de secours']) === 'negatif')
    risques.push({ risque:'Absence de site de secours', probabilite:'Moyenne', impact:'Critique', niv:'critique', desc: 'Aucun site de secours' });
  if (classifyInd(['siem']) === 'negatif')
    risques.push({ risque:'Absence de SIEM', probabilite:'Élevée', impact:'Élevé', niv:'elevé', desc: 'Pas de supervision centralisée' });
  if (classifyInd(['ids', 'ips']) === 'negatif' || classifyInd(['ids', 'ips']) === 'partiel')
    risques.push({ risque:'IDS/IPS non configuré', probabilite:'Moyenne', impact:'Élevé', niv:'elevé', desc: 'Politique IDS/IPS non formalisée' });
  if (classifyInd(['site distant']) === 'negatif')
    risques.push({ risque:'Pas de sauvegardes distantes', probabilite:'Faible', impact:'Critique', niv:'elevé', desc: 'Aucune copie hors site' });
  return risques.slice(0, 7);
}

// ══════════════════════════════════════════════
// CORE VALIDATION — STRICT MODE (ANCS v2.1)
// Returns per-annexe pass/fail with reasons
// ══════════════════════════════════════════════
function validateContent(tables, text, indicators) {
  const lower     = (text || '').toLowerCase();
  const wordCount = lower.split(/\s+/).filter(w => w.length > 2).length;

  if (wordCount < 50) {
    return {
      isEmpty: true, results: [], wordCount,
      errors: [`Document insuffisant — ${wordCount} mots. Minimum 50 requis.`],
      score: 0, isValid: false,
    };
  }

  // Extract all data once
  const annexe1Data = extractAnnexe1(tables, text);
  const processes   = extractAnnexe2(tables);
  const servers     = extractServersFromTable(tables);
  const apps        = extractAppsFromTable(tables);
  const network     = extractNetworkFromTable(tables);
  const phases      = extractAnnexe4(tables);
  const prevActions = extractAnnexe5(tables);
  const maturite    = extractAnnexe6(tables);
  const vulns       = extractAnnexe8(text, tables);
  const actionPlan  = extractAnnexe9(tables);

  // Count filled indicators
  const filledIndicators = indicators.filter(ind => !isHeaderRow(ind) && ind.valeur && ind.valeur.trim() !== '');

  // Per-annexe checks — STRICT MODE: table data only, no text fallbacks
  const checks = [
    // ── Annexe 1 — STRICT: require real table data ──
    (() => {
      const fields = Object.values(annexe1Data).filter(v => v && v.trim().length > 1);
      return {
        key: 'annexe1',
        label: "Annexe 1 — Identification de l'Organisme",
        found: fields.length >= 3,
        detail: `${fields.length} champ(s) renseigné(s)`,
        warnings: fields.length < 4 ? [`Seulement ${fields.length}/7 champs renseignés (recommandé : 4+)`] : [],
      };
    })(),

    // ── Annexe 2 — STRICT: require processes WITH DIC values ──
    (() => {
      const dicFilled = processes.filter(p =>
        (p.confidentialite && p.confidentialite.trim() !== '') ||
        (p.integrite       && p.integrite.trim()       !== '') ||
        (p.disponibilite   && p.disponibilite.trim()   !== '')
      ).length;
      return {
        key: 'annexe2',
        label: 'Annexe 2 — Cartographie des Processus (DIC)',
        found: dicFilled >= 1,
        detail: `${processes.length} processus, ${dicFilled} avec valeurs DIC`,
        warnings: dicFilled === 0 && processes.length > 0
          ? ['Processus présents mais valeurs DIC (C/I/D) manquantes'] : [],
      };
    })(),

    // ── Annexe 3 — STRICT: require real extracted SI data ──
    (() => {
      const total = servers.length + apps.length + network.length;
      return {
        key: 'annexe3',
        label: "Annexe 3 — Description du Système d'Information",
        found: total >= 1,
        detail: `${servers.length} serveurs, ${apps.length} applis, ${network.length} équip. réseau`,
        warnings: total === 0 ? ['Aucune donnée SI extraite des tableaux (vérifier format)'] : [],
      };
    })(),

    // ── Annexe 4 — STRICT: require real phases ──
    (() => {
      return {
        key: 'annexe4',
        label: "Annexe 4 — Planning d'Exécution Réel",
        found: phases.length >= 1,
        detail: `${phases.length} phase(s)`,
        warnings: [],
      };
    })(),

    // ── Annexe 5 — STRICT: require evaluated actions ──
    (() => {
      return {
        key: 'annexe5',
        label: "Annexe 5 — Évaluation du Plan d'Action Précédent",
        found: prevActions.length >= 1,
        detail: `${prevActions.length} action(s) évaluée(s)`,
        warnings: [],
      };
    })(),

    // ── Annexe 6 — STRICT: require filled maturity values ──
    (() => {
      const filledMat = maturite.filter(m => m.valeur && m.valeur.trim() !== '').length;
      return {
        key: 'annexe6',
        label: 'Annexe 6 — État de Maturité de la Sécurité du SI',
        found: filledMat >= 4,
        detail: `${filledMat} critère(s) renseigné(s)`,
        warnings: filledMat < 10 ? [`Seulement ${filledMat} critères renseignés`] : [],
      };
    })(),

    // ── Annexe 7 — STRICT: require real indicator values ──
    (() => {
      return {
        key: 'annexe7',
        label: 'Annexe 7 — Indicateurs de Sécurité',
        found: filledIndicators.length >= 5,
        detail: `${filledIndicators.length} indicateur(s) renseigné(s)`,
        warnings: filledIndicators.length < 10
          ? [`Seulement ${filledIndicators.length} indicateurs renseignés sur les ~120 attendus`] : [],
      };
    })(),

    // ── Annexe 8 — OPTIONAL (unchanged) ──
    (() => {
      const hasInText = lower.includes('vuln') && (lower.includes('recommandation') || lower.includes('impact') || lower.includes('critique'));
      const isPresent = vulns.length >= 1 || hasInText;
      return {
        key: 'annexe8',
        label: 'Annexe 8 — Vulnérabilités Très Critiques',
        found: true,
        optional: true,
        detail: vulns.length > 0 ? `${vulns.length} vulnérabilité(s)` : (hasInText ? 'Section présente' : 'Absente (optionnelle)'),
        warnings: isPresent && vulns.length === 0 ? ['Section présente mais données non extraites'] : [],
      };
    })(),

    // ── Annexe 9 — STRICT: require proposed actions ──
    (() => {
      return {
        key: 'annexe9',
        label: "Annexe 9 — Plan d'Action Proposé",
        found: actionPlan.length >= 1,
        detail: `${actionPlan.length} action(s) proposée(s)`,
        warnings: [],
      };
    })(),
  ];

  const failed   = checks.filter(c => !c.found && !c.optional);
  const warnings = checks.flatMap(c => (c.warnings || []).map(w => `${c.label}: ${w}`));
  const score    = Math.round((checks.filter(c => c.found).length / checks.length) * 100);
  
  // ── STRICT: require both no failures AND minimum score ──
  const isValid  = failed.length === 0 && score >= 60;

  return {
    isEmpty: false,
    results: checks,
    errors:  failed.map(c => `❌ ${c.label} — ${c.detail}`),
    warnings,
    score,
    isValid,
    wordCount,
    extractedData: { annexe1Data, processes, servers, apps, network, phases, prevActions, maturite, vulns, actionPlan },
  };
}

// ══════════════════════════════════════════════
// BUILD EXTRACTED DATA for dashboard
// ══════════════════════════════════════════════
function buildExtractedData(validation, user) {
  const { score, extractedData } = validation;
  const { annexe1Data, processes, servers, apps, network, phases, prevActions, maturite, vulns, actionPlan } = extractedData;
  const indicators = validation.indicators || [];
  const realScore  = calcScoreFromIndicateurs(indicators) ?? score;
  const radar      = buildRadarFromIndicateurs(indicators, realScore);
  const risques    = buildRisquesFromIndicateurs(indicators, realScore);
  const present    = validation.results.filter(r => r.found).length;
  const total      = ANNEXES.length;

  const hasRssi = indicators.some(i => norm(i.indicateur).includes('rssi') && /oui|existant|yes|1/i.test(i.valeur));
  const hasPssi = indicators.some(i => norm(i.indicateur).includes('pssi') && /oui|existant|yes|1/i.test(i.valeur));
  const hasPca  = indicators.some(i => norm(i.indicateur).includes('pca')  && /oui|existant|yes|1/i.test(i.valeur));
  const hasPra  = indicators.some(i => norm(i.indicateur).includes('pra')  && /oui|existant|yes|1/i.test(i.valeur));

  const positiveInd = indicators.filter(i => classifyValue(i.valeur) === 'positif').length;
  const partielInd  = indicators.filter(i => classifyValue(i.valeur) === 'partiel').length;
  const nonConfInd  = indicators.filter(i => classifyValue(i.valeur) === 'negatif').length;

  return {
    company: {
      name:             annexe1Data.companyName || user?.company_name || 'Non renseigné',
      acronym:          annexe1Data.acronym     || '',
      sector:           annexe1Data.sector      || user?.sector || 'Non renseigné',
      statut:           annexe1Data.statut      || '',
      email:            annexe1Data.email       || '',
      categorie:        annexe1Data.categorie   || '',
      siteWeb:          annexe1Data.siteWeb     || '',
      has_rssi:         hasRssi,
      has_pssi:         hasPssi,
      has_pca:          hasPca,
      has_pra:          hasPra,
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
      conforme:    positiveInd || present,
      partiel:     partielInd || 0,
      nonConforme: nonConfInd || (total - present),
    },
    radarMaturite:     radar,
    serveursListe:     servers,
    applicationsListe: apps,
    reseauListe:       network,
    risquesListe:      risques,
    indicators,
    processusListe:    processes,
    planningPhases:    phases,
    prevActionsListe:  prevActions,
    maturiteListe:     maturite,
    vulnsCritiques:    vulns,
    planActionListe:   actionPlan,
  };
}

const STEPS = [
  "Lecture du fichier…",
  "Extraction du texte et des tableaux…",
  "Vérification Annexe 1 (Identification)…",
  "Vérification Annexe 2 (Processus DIC)…",
  "Vérification Annexe 3 (Système d'Information)…",
  "Vérification Annexes 4 & 5 (Planning & Plan préc.)…",
  "Vérification Annexe 6 (Maturité)…",
  "Vérification Annexe 7 (Indicateurs)…",
  "Vérification Annexes 8 & 9 (Vulnérabilités & Plan)…",
  "Calcul score final…",
];

/* ══════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════ */
export default function AuditForm() {
  const navigate = useNavigate();
  const location = useLocation();

  const [file,         setFile]         = useState(null);
  const [drag,         setDrag]         = useState(false);
  const [status,       setStatus]       = useState('idle');
  const [progress,     setProgress]     = useState(0);
  const [stepIdx,      setStepIdx]      = useState(0);
  const [errors,       setErrors]       = useState([]);
  const [warnings,     setWarnings]     = useState([]);
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
    if (!['pdf', 'docx'].includes(ext)) { alert('Format non supporté. Utilisez PDF ou DOCX.'); return; }
    // File size limit check
    if (f.size > 10 * 1024 * 1024) {
      alert('Fichier trop volumineux (>10 Mo). Veuillez compresser ou diviser votre rapport.');
      return;
    }
    setFile(f); setStatus('idle'); setProgress(0);
    setErrors([]); setWarnings([]); setCheckResults([]); setScore(null); setApiError(''); setExpanded(null);
  };

  const handleVerify = async () => {
    if (status === 'loading' || status === 'saving' || !file) return;
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

      const tables     = html ? parseHtmlTables(html) : [];
      const indicators = extractIndicateurs(tables);

      for (let i = 2; i <= 8; i++) {
        setStepIdx(i); setProgress(16 + i * 10);
        await new Promise(r => setTimeout(r, 260));
      }
      setStepIdx(9); setProgress(96);
      await new Promise(r => setTimeout(r, 200));

      const validation = validateContent(tables, text, indicators);
      validation.indicators = indicators;

      setCheckResults(validation.results);
      setScore(validation.score);
      setWordCount(validation.wordCount || 0);
      setWarnings(validation.warnings || []);
      setProgress(100);

      if (validation.isEmpty || !validation.isValid) {
        setErrors(validation.errors);
        setStatus('fail'); return;
      }

      // ─── VALID — build extracted data ───
      const extractedData = buildExtractedData(validation, user);
      localStorage.setItem('extractedData', JSON.stringify(extractedData));

      // ─── API UPLOAD — failures are non-blocking ───
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

          const apiResponse = await API.post('/reports/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          const serverWarnings = apiResponse.data?.warnings || [];
          if (serverWarnings.length > 0) {
            setApiError(`⚠️ Rapport importé avec ${serverWarnings.length} avertissement(s) serveur sur des champs recommandés.`);
          }

        } catch (apiErr) {
          const statusCode = apiErr.response?.status;
          const data       = apiErr.response?.data;

          if (statusCode === 422) {
            const backendWarnings = (data?.annexeValidation || [])
              .flatMap(a => (a.missingFields || []).map(f => `${a.title} → ${f.reason}`));
            const warnMsg = backendWarnings.length > 0
              ? `Rapport soumis avec ${backendWarnings.length} avertissement(s) serveur (champs facultatifs manquants).`
              : data?.error || 'Rapport soumis avec des avertissements serveur.';
            setApiError(`⚠️ ${warnMsg}`);
          } else {
            const msg = data?.error || apiErr.message;
            setApiError(`Rapport analysé localement · Sauvegarde échouée : ${msg}`);
          }
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
    setErrors([]); setWarnings([]); setCheckResults([]); setScore(null); setApiError(''); setExpanded(null);
  };

  const onDragOver  = (e) => { e.preventDefault(); setDrag(true); };
  const onDragLeave = () => setDrag(false);
  const onDrop      = (e) => { e.preventDefault(); setDrag(false); selectFile(e.dataTransfer.files[0]); };

  const initials = user ? (user.username || user.company_name || 'U').charAt(0).toUpperCase() : 'U';

  const NAV_LINKS = [
    { to: '/client/dashboard',     label: 'Déposer un rapport', icon: '📤' },
    { to: '/client/profile',       label: 'Mon profil',         icon: '🏢' },
    { to: '/client/notifications', label: 'Notifications',      icon: '🔔' },
    { to: '/client/guide',         label: 'Guide de dépôt',     icon: '📖' },
    { to: '/client/contact',       label: 'Contacter ANCS',     icon: '💬' },
  ];

  return (
    <div className="af-root" style={{ minHeight: '100vh', background: BG, color: '#e2f0ff' }}>

      {/* ══ NAVBAR ══ */}
      <nav style={{
        background: 'rgba(8,20,36,.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,.06)', padding: '0 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 60, position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 4px 24px rgba(0,0,0,.35)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#0d5580,#1a7a6e)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏢</div>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, color: '#d4e8ff' }}>Espace Entreprise</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {NAV_LINKS.map(nl => {
              const isActive = location.pathname === nl.to;
              return (
                <Link key={nl.to} to={nl.to} className="af-nav-link" style={{
                  background: isActive ? 'rgba(99,210,190,.1)' : 'transparent',
                  color:      isActive ? '#63d2be' : '#3d607a',
                  border:     isActive ? '1px solid rgba(99,210,190,.2)' : '1px solid transparent',
                }}>
                  <span style={{ fontSize: 13 }}>{nl.icon}</span>{nl.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '5px 12px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 99 }}>
              <div style={{ width: 26, height: 26, background: 'linear-gradient(135deg,#0d5580,#1a7a6e)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{initials}</div>
              <span style={{ fontSize: 12, color: '#4a6a88' }}>{user.company_name || user.username || user.email}</span>
            </div>
          )}
          <button onClick={handleLogout} style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(248,113,113,.1)', color: '#f87171', border: '1px solid rgba(248,113,113,.2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Déconnexion</button>
        </div>
      </nav>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 20px' }}>
        <div style={{ width: '100%', maxWidth: 620 }}>

          {/* HEADER */}
          <div className="af-anim" style={{ background: 'linear-gradient(135deg,#0c1f3a,#0a2540)', border: '1px solid rgba(99,210,190,.12)', borderRadius: 22, padding: '22px 28px', marginBottom: 20, position: 'relative', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,.4)' }}>
            {[170, 115].map((s, i) => (
              <div key={i} style={{ position: 'absolute', width: s, height: s, borderRadius: '50%', border: '1px solid rgba(99,210,190,.07)', right: -s / 4, top: '50%', transform: 'translateY(-50%)', animation: `af-slow ${20 + i * 8}s linear infinite` }} />
            ))}
            <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,rgba(99,210,190,.28),transparent)', animation: 'af-scan 3.5s linear infinite', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
              <div style={{ width: 50, height: 50, background: 'linear-gradient(135deg,#0d5580,#1a7a6e)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, boxShadow: '0 0 0 2px rgba(99,210,190,.22)' }}>📤</div>
              <div>
                <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: '#e4f2ff', marginBottom: 4 }}>Upload de rapport d'audit</h1>
                <p style={{ fontSize: 12, color: '#3d607a' }}>Modèle officiel ANCS v2.1 · 9 Annexes vérifiées</p>
              </div>
            </div>
          </div>

          {/* CARD */}
          <div className="af-anim" style={{ background: CARD, border: `1px solid ${status === 'ok' ? 'rgba(74,222,128,.18)' : status === 'fail' ? 'rgba(248,113,113,.18)' : BDR}`, borderRadius: 22, padding: 24, marginBottom: 14, transition: 'border-color .4s' }}>
            <input id="af-fi" type="file" accept=".pdf,.docx" style={{ display: 'none' }} onChange={e => selectFile(e.target.files[0])} />

            {/* Drop zone */}
            <label htmlFor="af-fi" className={`af-drop${drag ? ' over' : ''}`} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
              <div style={{ fontSize: 46, display: 'inline-block', marginBottom: 12, animation: 'af-float 3s ease-in-out infinite' }}>
                {status === 'ok' ? '✅' : status === 'fail' ? '❌' : file ? '📄' : '📂'}
              </div>
              {file ? (
                <>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, color: TEAL, marginBottom: 4 }}>{file.name}</div>
                  <div style={{ fontSize: 11, color: '#3d607a' }}>{(file.size / 1024).toFixed(1)} Ko · Cliquez pour changer</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#4a6a88', marginBottom: 6 }}>Glissez votre rapport ici</div>
                  <div style={{ fontSize: 12, color: '#2a4a62', marginBottom: 14 }}>ou cliquez pour sélectionner</div>
                  <div style={{ display: 'inline-flex', gap: 8 }}>
                    {['PDF', 'DOCX'].map(f => <span key={f} style={{ fontSize: 10, fontWeight: 700, color: '#3d607a', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', padding: '4px 12px', borderRadius: 99 }}>{f}</span>)}
                  </div>
                </>
              )}
            </label>

            {/* PROGRESS */}
            {(status === 'loading' || status === 'saving') && (
              <div className="af-anim" style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#3d607a' }}>{status === 'saving' ? '💾 Enregistrement...' : STEPS[stepIdx]}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: TEAL, fontFamily: "'Syne',sans-serif" }}>{progress}%</span>
                </div>
                <div style={{ height: 7, background: 'rgba(255,255,255,.07)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg,${TEAL}55,${TEAL})`, borderRadius: 99, transition: 'width .4s ease', boxShadow: `0 0 12px ${TEAL}55` }} />
                </div>
                <div style={{ display: 'flex', gap: 5, marginTop: 14, justifyContent: 'center' }}>
                  {STEPS.map((_, i) => (
                    <div key={i} style={{ width: i < stepIdx ? 18 : i === stepIdx ? 10 : 6, height: 6, borderRadius: 99, background: i < stepIdx ? GREEN : i === stepIdx ? TEAL : 'rgba(255,255,255,.08)', transition: 'all .3s' }} />
                  ))}
                </div>
              </div>
            )}

            {/* SUCCESS */}
            {status === 'ok' && (
              <div className="af-anim" style={{ marginTop: 18, padding: '16px 20px', background: 'rgba(74,222,128,.07)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(74,222,128,.15)', border: '1px solid rgba(74,222,128,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✅</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, color: GREEN, fontSize: 15, marginBottom: 3 }}>RAPPORT CONFORME</div>
                    <div style={{ fontSize: 12, color: apiError ? AMBER : '#3d607a' }}>
                      {apiError ? apiError : `✅ Soumis à l'ANCS · ${wordCount} mots analysés`}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, color: GREEN, fontSize: 28, flexShrink: 0 }}>{score}%</div>
                </div>

                {/* Warnings (non-blocking) */}
                {warnings.length > 0 && (
                  <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(251,191,36,.06)', border: '1px solid rgba(251,191,36,.15)', borderRadius: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: AMBER, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.4px' }}>Avertissements non bloquants</div>
                    {warnings.map((w, i) => (
                      <div key={i} style={{ fontSize: 11, color: '#c8a040', padding: '2px 0', display: 'flex', gap: 6 }}>
                        <span>⚠️</span><span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Per-annexe results */}
                <div style={{ borderTop: '1px solid rgba(74,222,128,.15)', paddingTop: 12 }}>
                  {checkResults.map((r, i) => (
                    <div key={i}>
                      <div className="af-check-row" style={{ cursor: r.warnings?.length ? 'pointer' : 'default' }}
                        onClick={() => r.warnings?.length && setExpanded(expanded === i ? null : i)}>
                        <span style={{ fontSize: 14, flexShrink: 0 }}>{r.found ? (r.warnings?.length ? '⚠️' : '✅') : '❌'}</span>
                        <span style={{ color: r.found ? '#8ab0c8' : RED, flex: 1, fontWeight: 600 }}>{r.label}</span>
                        <span style={{ fontSize: 11, color: '#2a4a62' }}>{r.detail}</span>
                        {r.optional && <span style={{ fontSize: 10, color: '#2a4a62' }}>(opt.)</span>}
                        {r.warnings?.length > 0 && <span style={{ fontSize: 10, color: AMBER }}>{expanded === i ? '▲' : '▼'}</span>}
                      </div>
                      {expanded === i && r.warnings?.map((w, j) => (
                        <div key={j} className="af-sub-check">
                          <span style={{ fontSize: 12 }}>⚠️</span>
                          <span style={{ color: AMBER }}>{w}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAIL */}
            {status === 'fail' && (
              <div className="af-anim" style={{ marginTop: 18, padding: '16px 20px', background: 'rgba(248,113,113,.07)', border: '1px solid rgba(248,113,113,.2)', borderRadius: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 20 }}>❌</span>
                  <div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, color: RED, fontSize: 15 }}>RAPPORT NON CONFORME</div>
                    {score !== null && <div style={{ fontSize: 12, color: '#3d607a', marginTop: 2 }}>Score : {score}% · {wordCount} mots</div>}
                  </div>
                </div>

                {checkResults.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    {checkResults.map((r, i) => (
                      <div key={i}>
                        <div className="af-check-row" style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === i ? null : i)}>
                          <span style={{ fontSize: 14, flexShrink: 0 }}>{r.found ? '✅' : '❌'}</span>
                          <span style={{ color: r.found ? '#4a6a88' : RED, flex: 1, fontWeight: 600 }}>{r.label}</span>
                          <span style={{ fontSize: 11, color: '#3d607a' }}>{r.detail}</span>
                          {r.warnings?.length > 0 && <span style={{ fontSize: 10, color: AMBER }}>{expanded === i ? '▲' : '▼'}</span>}
                        </div>
                        {expanded === i && r.warnings?.map((w, j) => (
                          <div key={j} className="af-sub-check">
                            <span style={{ fontSize: 12 }}>⚠️</span>
                            <span style={{ color: AMBER }}>{w}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {errors.map((e, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.04)', fontSize: 12, color: RED, lineHeight: 1.5 }}>
                    <span style={{ flexShrink: 0 }}>●</span><span>{e}</span>
                  </div>
                ))}

                <div style={{ fontSize: 11, color: '#3d607a', marginTop: 10 }}>
                  Complétez les sections manquantes en utilisant le modèle officiel ANCS v2.1 (Annexes 1 à 9).
                </div>
              </div>
            )}

            {(status === 'idle' || status === 'loading') && (
              <button
                className="af-btn-verify"
                onClick={handleVerify}
                disabled={!file || status === 'loading' || status === 'saving'}
              >
                {status === 'loading'
                  ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(7,17,30,.2)', borderTop: '2px solid #07111e', borderRadius: '50%', animation: 'af-spin 1s linear infinite', flexShrink: 0 }} />Analyse en cours...</>
                  : <>🔍 Vérifier la conformité (9 Annexes ANCS v2.1)</>}
              </button>
            )}
          </div>

          {/* ACTIONS */}
          {(status === 'ok' || status === 'fail') && (
            <div className="af-anim" style={{ display: 'flex', gap: 12 }}>
              <button className="af-btn-ghost" style={{ flex: 1 }} onClick={reset}>🔄 Nouvel upload</button>
            </div>
          )}

          {/* INFO */}
          <div className="af-anim" style={{ marginTop: 14, background: CARD, border: `1px solid ${BDR}`, borderRadius: 16, padding: '13px 20px', display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[{ i: '📎', t: 'PDF ou DOCX' }, { i: '🔍', t: 'Contenu réel analysé' }, { i: '📋', t: '9 Annexes vérifiées' }, { i: '📡', t: "Transmis à l'ANCS" }].map(({ i, t }) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span>{i}</span><span style={{ fontSize: 12, color: '#3d607a' }}>{t}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 18, textAlign: 'center', fontSize: 11, color: '#1a3248' }}>
            ANCS Platform · Audit de Sécurité des Systèmes d'Information © 2026
          </div>
        </div>
      </div>
    </div>
  );
}