import { useState, useRef } from 'react';
import { useAnnotations } from '../../hooks/Useannotations';

// ─── Styles (injectés une seule fois dans le <head>) ──────────────────────────
const CSS = `
  .tri-wrap {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 20px;
    align-items: start;
  }

  /* ── Left panel: données extraites ── */
  .tri-data-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(139,92,246,0.1);
    border-radius: 14px;
    overflow: hidden;
  }

  .tri-tabs {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    padding: 10px 14px;
    background: rgba(0,0,0,0.2);
    border-bottom: 1px solid rgba(139,92,246,0.1);
  }

  .tri-tab {
    padding: 5px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    border: 1px solid rgba(139,92,246,0.2);
    background: transparent;
    color: #94a3b8;
    cursor: pointer;
    transition: all .15s;
  }

  .tri-tab:hover { background: rgba(139,92,246,0.1); color: #c4b5fd; }
  .tri-tab.active { background: rgba(139,92,246,0.25); border-color: rgba(139,92,246,0.5); color: #fff; }

  .tri-panel { padding: 18px; }

  .tri-kv { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

  .tri-kv-item {
    padding: 10px 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(139,92,246,0.08);
    border-radius: 10px;
  }

  .tri-kv-label { font-size: 11px; color: #64748b; margin-bottom: 3px; }
  .tri-kv-value { font-size: 13px; color: #e2e8f0; font-weight: 500; }
  .tri-kv-value.missing { color: #475569; font-style: italic; font-weight: 400; }

  .tri-score-bar { background: rgba(255,255,255,0.08); border-radius: 99px; height: 6px; margin-top: 6px; overflow: hidden; }
  .tri-score-fill { height: 100%; border-radius: 99px; }

  .tri-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .tri-table th { padding: 8px 10px; text-align: left; font-weight: 600; color: #64748b; border-bottom: 1px solid rgba(139,92,246,0.1); }
  .tri-table td { padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #cbd5e1; }
  .tri-table tr:last-child td { border-bottom: none; }

  .tri-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 600;
  }
  .tri-badge-ok  { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.25); }
  .tri-badge-mid { background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.25); }
  .tri-badge-err { background: rgba(239,68,68,0.15);  color: #f87171; border: 1px solid rgba(239,68,68,0.25); }

  .tri-phase-list { display: flex; flex-direction: column; gap: 6px; }
  .tri-phase-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px;
    background: rgba(255,255,255,0.04);
    border-radius: 8px;
    font-size: 13px; color: #cbd5e1;
  }
  .tri-phase-num {
    width: 22px; height: 22px; border-radius: 50%;
    background: rgba(139,92,246,0.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #c4b5fd; flex-shrink: 0;
  }

  .tri-vuln-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; margin-bottom: 6px;
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.15);
    border-radius: 8px;
    font-size: 12px; color: #fca5a5;
  }

  .tri-indicator-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
  .tri-indicator-box {
    padding: 12px 10px; text-align: center;
    background: rgba(255,255,255,0.04);
    border-radius: 10px; border: 1px solid rgba(139,92,246,0.1);
  }
  .tri-indicator-label { font-size: 12px; color: #94a3b8; margin-top: 6px; }

  /* ── Right panel: annotations ── */
  .tri-ann-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(139,92,246,0.1);
    border-radius: 14px;
    overflow: hidden;
  }

  .tri-ann-head {
    padding: 14px 16px;
    border-bottom: 1px solid rgba(139,92,246,0.1);
    display: flex; align-items: center; justify-content: space-between;
  }

  .tri-ann-head h3 { font-size: 15px; font-weight: 600; color: #fff; }

  .tri-counts { display: grid; grid-template-columns: repeat(3,1fr); gap: 6px; margin: 14px 16px 0; }
  .tri-count-box {
    padding: 8px 6px; text-align: center;
    background: rgba(255,255,255,0.04);
    border-radius: 8px;
  }
  .tri-count-n { font-size: 20px; font-weight: 700; }
  .tri-count-l { font-size: 10px; color: #64748b; margin-top: 1px; }
  .n-r { color: #a78bfa; }
  .n-v { color: #fbbf24; }
  .n-c { color: #34d399; }

  .tri-form { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }

  .tri-form-group { display: flex; flex-direction: column; gap: 4px; }
  .tri-form-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .4px; }

  .tri-form select,
  .tri-form textarea {
    width: 100%;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(139,92,246,0.2);
    border-radius: 8px;
    color: #e2e8f0;
    font-size: 13px;
    font-family: inherit;
    padding: 8px 10px;
    outline: none;
    transition: border-color .15s;
  }
  .tri-form select:focus,
  .tri-form textarea:focus { border-color: rgba(139,92,246,0.5); }
  .tri-form textarea { resize: vertical; min-height: 80px; line-height: 1.5; }

  .tri-btn-row { display: flex; gap: 8px; }

  .tri-btn-add {
    flex: 1; padding: 9px 14px;
    background: rgba(139,92,246,0.15);
    border: 1px solid rgba(139,92,246,0.3);
    border-radius: 8px;
    color: #c4b5fd; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all .15s;
  }
  .tri-btn-add:hover:not(:disabled) { background: rgba(139,92,246,0.25); }
  .tri-btn-add:disabled { opacity: .5; cursor: not-allowed; }

  .tri-btn-ai {
    flex: 1; padding: 9px 14px;
    background: rgba(99,102,241,0.1);
    border: 1px solid rgba(99,102,241,0.3);
    border-radius: 8px;
    color: #818cf8; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all .15s;
  }
  .tri-btn-ai:hover:not(:disabled) { background: rgba(99,102,241,0.2); }
  .tri-btn-ai:disabled { opacity: .5; cursor: not-allowed; }

  .tri-ai-box {
    padding: 10px 12px;
    background: rgba(99,102,241,0.08);
    border: 1px solid rgba(99,102,241,0.2);
    border-radius: 8px;
    font-size: 12px; color: #a5b4fc; line-height: 1.6;
  }

  .tri-ai-use {
    margin-top: 8px;
    padding: 5px 12px;
    background: rgba(99,102,241,0.2);
    border: 1px solid rgba(99,102,241,0.4);
    border-radius: 6px;
    color: #c7d2fe; font-size: 12px; font-weight: 600;
    cursor: pointer;
  }

  .tri-ann-divider {
    font-size: 10px; font-weight: 700; color: #475569;
    text-transform: uppercase; letter-spacing: .5px;
    padding: 4px 16px;
    border-top: 1px solid rgba(139,92,246,0.08);
    margin-top: 4px; padding-top: 12px;
  }

  .tri-ann-list {
    max-height: 340px; overflow-y: auto;
    display: flex; flex-direction: column; gap: 8px;
    padding: 0 16px 16px;
  }

  .tri-ann-item {
    padding: 10px 12px; border-radius: 10px;
    border-left: 3px solid transparent;
  }
  .ann-remarque       { background: rgba(139,92,246,0.08); border-left-color: #8b5cf6; }
  .ann-reserve        { background: rgba(245,158,11,0.08);  border-left-color: #f59e0b; }
  .ann-recommandation { background: rgba(16,185,129,0.08);  border-left-color: #10b981; }

  .tri-ann-type { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
  .type-r { color: #a78bfa; }
  .type-v { color: #fbbf24; }
  .type-c { color: #34d399; }

  .tri-ann-target {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px; border-radius: 99px;
    font-size: 10px; color: #94a3b8;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    margin-bottom: 4px;
  }

  .tri-ann-text { font-size: 12px; color: #cbd5e1; line-height: 1.5; }
  .tri-ann-meta { font-size: 10px; color: #475569; margin-top: 4px; }
  .tri-ann-del {
    font-size: 11px; color: #475569;
    background: none; border: none;
    cursor: pointer; padding: 3px 6px; border-radius: 4px;
    margin-top: 4px; transition: all .15s;
  }
  .tri-ann-del:hover { color: #f87171; background: rgba(239,68,68,0.1); }

  .tri-empty {
    text-align: center; padding: 24px 16px;
    color: #475569; font-size: 12px;
  }

  .tri-export {
    margin: 0 16px 16px;
    width: calc(100% - 32px);
    padding: 9px;
    background: rgba(16,185,129,0.1);
    border: 1px solid rgba(16,185,129,0.25);
    border-radius: 8px;
    color: #34d399; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all .15s;
  }
  .tri-export:hover { background: rgba(16,185,129,0.2); }

  .tri-error { padding: 10px 16px; font-size: 12px; color: #f87171; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Badge({ score }) {
  const cls = score >= 75 ? 'tri-badge-ok' : score >= 50 ? 'tri-badge-mid' : 'tri-badge-err';
  return <span className={`tri-badge ${cls}`}>{score}%</span>;
}

function CiaBadge({ v }) {
  if (v == null) return <span style={{ color: '#475569' }}>—</span>;
  const cls = v >= 3 ? 'tri-badge-err' : 'tri-badge-mid';
  return <span className={`tri-badge ${cls}`}>{v}/4</span>;
}

// ─── Panels par annexe ────────────────────────────────────────────────────────
function PanelA1({ data = {} }) {
  const fields = [
    ['Organisme',    data.nom_organisme],
    ['Acronyme',     data.acronyme],
    ['Statut',       data.statut],
    ['Secteur',      data.secteur_activite],
    ['Email',        data.adresse_email],
    ['Site web',     data.site_web],
  ];
  return (
    <div className="tri-kv">
      {fields.map(([label, val]) => (
        <div className="tri-kv-item" key={label}>
          <div className="tri-kv-label">{label}</div>
          <div className={`tri-kv-value ${val ? '' : 'missing'}`}>{val || 'Non renseigné'}</div>
        </div>
      ))}
    </div>
  );
}

function PanelA2({ data = {} }) {
  const processus = data.processus || [];
  if (!processus.length) return <p style={{ color: '#475569', fontSize: 13 }}>Aucun processus extrait.</p>;
  return (
    <table className="tri-table">
      <thead>
        <tr>
          <th>Processus</th>
          <th>Confidentialité</th>
          <th>Intégrité</th>
          <th>Disponibilité</th>
        </tr>
      </thead>
      <tbody>
        {processus.map((p, i) => (
          <tr key={i}>
            <td style={{ fontWeight: 500 }}>{p.processus || p.p}</td>
            <td><CiaBadge v={p.confidentialite ?? p.c} /></td>
            <td><CiaBadge v={p.integrite ?? p.i} /></td>
            <td><CiaBadge v={p.disponibilite ?? p.d} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PanelA3({ data = {} }) {
  const items = [
    ['Serveurs',          data.serveurs?.length ?? data.serveurs ?? 0],
    ['Applications',      data.applications?.length ?? data.applications ?? 0],
    ['Équipements réseau',data.infrastructure_reseau?.length ?? data.network ?? 0],
    ['Postes de travail', data.postes_travail?.length ?? data.postes ?? 0],
  ];
  return (
    <div className="tri-kv">
      {items.map(([label, val]) => (
        <div className="tri-kv-item" key={label}>
          <div className="tri-kv-label">{label}</div>
          <div className="tri-kv-value" style={{ fontSize: 22, color: '#a78bfa' }}>{val}</div>
        </div>
      ))}
    </div>
  );
}

function PanelA4({ data = {} }) {
  const phases = data.phases || [];
  if (!phases.length) {
    return <p style={{ color: '#475569', fontSize: 13 }}>{data.texte_brut || 'Aucune phase extraite.'}</p>;
  }
  return (
    <div className="tri-phase-list">
      {phases.map((ph, i) => (
        <div className="tri-phase-item" key={i}>
          <div className="tri-phase-num">{i + 1}</div>
          <span>{ph.phase || ph}</span>
          {ph.date_debut && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#475569' }}>{ph.date_debut}</span>}
        </div>
      ))}
    </div>
  );
}

function PanelA5({ data = {} }) {
  const actions = data.actions || [];
  if (!actions.length) return <p style={{ color: '#475569', fontSize: 13 }}>Aucune action extraite.</p>;
  return (
    <table className="tri-table">
      <thead><tr><th>Action</th><th>Responsable</th><th>Taux</th><th>Évaluation</th></tr></thead>
      <tbody>
        {actions.map((a, i) => (
          <tr key={i}>
            <td>{a.action}</td>
            <td style={{ color: '#94a3b8' }}>{a.responsable || '—'}</td>
            <td>
              {a.taux_realisation
                ? <span className={`tri-badge ${parseInt(a.taux_realisation) >= 80 ? 'tri-badge-ok' : 'tri-badge-mid'}`}>{a.taux_realisation}</span>
                : '—'}
            </td>
            <td style={{ color: '#94a3b8' }}>{a.evaluation || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PanelA6({ data = {} }) {
  const criteres = data.criteres || [];
  const maturite = data.maturite || 0;
  const pct      = (maturite / 5) * 100;
  const color    = pct >= 60 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color }}>{maturite}</span>
        <span style={{ color: '#64748b', fontSize: 13 }}>/5 — maturité globale</span>
      </div>
      <div className="tri-score-bar" style={{ height: 8, marginBottom: 16 }}>
        <div className="tri-score-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      {criteres.length > 0 && (
        <table className="tri-table">
          <thead><tr><th>Domaine</th><th>Critère</th><th>Score</th></tr></thead>
          <tbody>
            {criteres.map((c, i) => (
              <tr key={i}>
                <td style={{ color: '#64748b' }}>{c.domaine || '—'}</td>
                <td>{c.critere || c}</td>
                <td>
                  {c.score != null
                    ? <span className={`tri-badge ${c.score >= 4 ? 'tri-badge-ok' : c.score >= 2 ? 'tri-badge-mid' : 'tri-badge-err'}`}>{c.score}/5</span>
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function PanelA7({ data = {} }) {
  const indicators = data.indicateurs || [];
  const detail     = data.indicateurs_detail || [];
  return (
    <div>
      <div className="tri-indicator-grid" style={{ marginBottom: 16 }}>
        {indicators.map(ind => (
          <div className="tri-indicator-box" key={ind.nom}>
            <span className={`tri-badge ${ind.present ? 'tri-badge-ok' : 'tri-badge-err'}`}>
              {ind.present ? '✓ Oui' : '✕ Non'}
            </span>
            <div className="tri-indicator-label">{ind.nom}</div>
          </div>
        ))}
      </div>
      {detail.length > 0 && (
        <table className="tri-table">
          <thead><tr><th>Indicateur</th><th>Valeur attendue</th><th>Valeur constatée</th></tr></thead>
          <tbody>
            {detail.slice(0, 8).map((d, i) => (
              <tr key={i}>
                <td>{d.indicateur}</td>
                <td style={{ color: '#64748b' }}>{d.valeur_attendue || '—'}</td>
                <td>{d.valeur || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function PanelA8({ data = {} }) {
  const vulns = data.vulnerabilites || [];
  if (!vulns.length) return <p style={{ color: '#475569', fontSize: 13 }}>Aucune vulnérabilité extraite.</p>;
  return (
    <div>
      {vulns.map((v, i) => (
        <div className="tri-vuln-item" key={i}>
          <span style={{ fontSize: 16 }}>⚠</span>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>{v.nom}</div>
            {v.actifs_impactes && <div style={{ fontSize: 11, color: '#94a3b8' }}>Actifs: {v.actifs_impactes}</div>}
            {v.recommandation && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{v.recommandation}</div>}
          </div>
          {v.impact && (
            <span className="tri-badge tri-badge-err" style={{ marginLeft: 'auto', flexShrink: 0 }}>{v.impact}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function PanelA9({ data = {} }) {
  const projets = data.projets || [];
  const actions = projets.flatMap(p => p.actions || []);
  if (!actions.length) return <p style={{ color: '#475569', fontSize: 13 }}>Aucune action planifiée extraite.</p>;
  return (
    <table className="tri-table">
      <thead><tr><th>Action</th><th>Priorité</th><th>Responsable</th><th>Date prévue</th></tr></thead>
      <tbody>
        {actions.map((a, i) => (
          <tr key={i}>
            <td>{a.action}</td>
            <td>
              <span className={`tri-badge ${
                a.priorite === 'P1' || a.priorite?.toLowerCase() === 'haute'
                  ? 'tri-badge-err'
                  : a.priorite === 'P2' || a.priorite?.toLowerCase() === 'moyenne'
                  ? 'tri-badge-mid'
                  : 'tri-badge-ok'
              }`}>{a.priorite || '—'}</span>
            </td>
            <td style={{ color: '#94a3b8' }}>{a.responsable || '—'}</td>
            <td style={{ color: '#64748b' }}>{a.date_prevue || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Mapping onglets → panels ─────────────────────────────────────────────────
const ANNEX_TABS = [
  { n: 1,  label: 'A1',  title: 'Identification',      Component: PanelA1,  key: 'annexe1' },
  { n: 2,  label: 'A2',  title: 'Classification',      Component: PanelA2,  key: 'annexe2' },
  { n: 3,  label: 'A3',  title: 'SI',                  Component: PanelA3,  key: 'annexe3' },
  { n: 4,  label: 'A4',  title: 'Planning',             Component: PanelA4,  key: 'annexe4' },
  { n: 5,  label: 'A5',  title: 'Plan précédent',       Component: PanelA5,  key: 'annexe5' },
  { n: 6,  label: 'A6',  title: 'Maturité',             Component: PanelA6,  key: 'annexe6' },
  { n: 7,  label: 'A7',  title: 'Indicateurs',          Component: PanelA7,  key: 'annexe7' },
  { n: 8,  label: 'A8',  title: 'Vulnérabilités',       Component: PanelA8,  key: 'annexe8' },
  { n: 9,  label: 'A9',  title: "Plan d'action",        Component: PanelA9,  key: 'annexe9' },
];

// ─── Composant principal ──────────────────────────────────────────────────────
export default function TechnicalReviewInterface({ report, onValidate, onReject, onStartAnalysis }) {
  const [activeTab,  setActiveTab]  = useState(1);
  const [annType,    setAnnType]    = useState('remarque');
  const [annTarget,  setAnnTarget]  = useState('Annexe 1');
  const [annText,    setAnnText]    = useState('');
  const [aiText,     setAiText]     = useState('');
  const [aiLoading,  setAiLoading]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState(null);

  const { annotations, loading: annLoading, error: annError, counts, addAnnotation, deleteAnnotation } =
    useAnnotations(report?.id);

  // extracted_data vient du backend (résultat de ancs_extractor.py)
  const extracted = report?.extracted_data || report?.extractedData || {};

  // ── Injecter CSS une seule fois ──────────────────────────────────────────
  const styleRef = useRef(false);
  if (!styleRef.current) {
    const el = document.createElement('style');
    el.textContent = CSS;
    document.head.appendChild(el);
    styleRef.current = true;
  }

  // ── Trouver l'onglet actif ────────────────────────────────────────────────
  const currentTab = ANNEX_TABS.find(t => t.n === activeTab);

  // ── Ajouter une annotation ────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!annText.trim()) return;
    setSaving(true);
    const result = await addAnnotation({ type: annType, target: annTarget, text: annText });
    setSaving(false);
    if (result.success) {
      setAnnText('');
      setAiText('');
      showToast('Annotation ajoutée !');
    } else {
      showToast(result.error, true);
    }
  };

  // ── Supprimer une annotation ──────────────────────────────────────────────
  const handleDelete = async (id) => {
    const result = await deleteAnnotation(id);
    if (!result.success) showToast(result.error, true);
  };

  // ── Suggestion IA ─────────────────────────────────────────────────────────
  const handleAI = async () => {
    setAiLoading(true);
    setAiText('');
    const tabInfo  = currentTab?.title || '';
    const score    = extracted.compliance_score || report?.compliance_score || '?';
    const maturite = extracted.maturity_level   || report?.maturity_level   || '?';
    const risk     = extracted.risk_score       || report?.risk_score       || '?';
    const vulns    = (extracted.annexe8?.vulnerabilites || []).map(v => v.nom).join(', ') || 'non spécifiées';

    const prompt = `Tu es un auditeur sécurité SI expert (ANCS/ISO 27001).
Génère une ${annType} courte (2-3 phrases max, en français, sans introduction) 
pour l'annexe "${tabInfo}" du rapport d'audit de l'organisme "${report?.organism_name || 'N/A'}"
(score conformité: ${score}%, maturité: ${maturite}/5, risque: ${risk}).
Vulnérabilités identifiées: ${vulns}.
Retourne UNIQUEMENT le texte de la ${annType}.`;

    try {
      const res  = await fetch('https://api.anthropic.com/v1/messages', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages:   [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();
      const text = (data.content || [])
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join(' ')
        .trim();
      setAiText(text);
    } catch (e) {
      setAiText('Erreur lors de la génération IA. Veuillez réessayer.');
    } finally {
      setAiLoading(false);
    }
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const lines = [
      `RAPPORT D'AUDIT — ANNOTATIONS`,
      `Organisme : ${report?.organism_name || 'N/A'}`,
      `Rapport   : #${report?.id}`,
      `Export    : ${new Date().toLocaleDateString('fr-FR')}`,
      '', '---', '',
    ];
    annotations.forEach(a => {
      lines.push(`[${a.type.toUpperCase()}] ${a.target}`);
      lines.push(a.text);
      lines.push(`— ${a.author}, ${a.created_at?.split('T')[0] || ''}`);
      lines.push('');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const lnk  = document.createElement('a');
    lnk.href   = url;
    lnk.download = `annotations_${report?.id}_${report?.organism_name?.replace(/\s+/g, '_')}.txt`;
    lnk.click();
    URL.revokeObjectURL(url);
  };

  const showToast = (msg, err = false) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Type → css class ──────────────────────────────────────────────────────
  const typeClass  = t => t === 'remarque' ? 'type-r' : t === 'reserve' ? 'type-v' : 'type-c';
  const typeLabel  = t => t === 'remarque' ? 'Remarque' : t === 'reserve' ? 'Réserve' : 'Recommandation';
  const annClass   = t => `tri-ann-item ann-${t}`;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="tri-wrap">
      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          padding: '12px 20px', borderRadius: 8,
          background: toast.err ? '#ef4444' : '#10b981',
          color: '#fff', fontSize: 14, fontWeight: 500,
          zIndex: 1200,
          animation: 'slideIn 0.3s ease',
        }}>
          {toast.msg}
        </div>
      )}

      {/* ══════════════════════════════════════════
          LEFT — données extraites
      ══════════════════════════════════════════ */}
      <div className="tri-data-card">
        <div className="tri-tabs">
          {ANNEX_TABS.map(t => (
            <button
              key={t.n}
              className={`tri-tab ${activeTab === t.n ? 'active' : ''}`}
              onClick={() => { setActiveTab(t.n); setAnnTarget(`Annexe ${t.n}`); }}
              title={t.title}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="tri-panel">
          {currentTab && (() => {
            const Panel  = currentTab.Component;
            const data   = extracted[currentTab.key] || {};
            const status = extracted.annexe_status?.[`annexe${currentTab.n}`];
            return (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                    A{currentTab.n} — {currentTab.title}
                  </span>
                  {status && (
                    <span className={`tri-badge ${status.status === 'filled' ? 'tri-badge-ok' : status.status === 'partial' ? 'tri-badge-mid' : 'tri-badge-err'}`}>
                      {status.status === 'filled' ? 'Complet' : status.status === 'partial' ? 'Partiel' : 'Vide'}
                    </span>
                  )}
                  {extracted.compliance_score != null && (
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>
                      Score : <Badge score={extracted.compliance_score} />
                    </span>
                  )}
                </div>
                <Panel data={data} extracted={extracted} />
              </>
            );
          })()}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT — annotations
      ══════════════════════════════════════════ */}
      <div className="tri-ann-card">
        <div className="tri-ann-head">
          <h3>Annotations</h3>
          <span style={{ fontSize: 12, color: '#64748b' }}>{counts.total} au total</span>
        </div>

        {/* Compteurs */}
        <div className="tri-counts">
          <div className="tri-count-box">
            <div className={`tri-count-n n-r`}>{counts.remarque}</div>
            <div className="tri-count-l">Remarques</div>
          </div>
          <div className="tri-count-box">
            <div className={`tri-count-n n-v`}>{counts.reserve}</div>
            <div className="tri-count-l">Réserves</div>
          </div>
          <div className="tri-count-box">
            <div className={`tri-count-n n-c`}>{counts.recommandation}</div>
            <div className="tri-count-l">Recommand.</div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="tri-form">
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
              {ANNEX_TABS.map(t => (
                <option key={t.n} value={`Annexe ${t.n}`}>A{t.n} — {t.title}</option>
              ))}
              <option value="Général">Général</option>
            </select>
          </div>

          <div className="tri-form-group">
            <label className="tri-form-label">Texte</label>
            <textarea
              value={annText}
              onChange={e => setAnnText(e.target.value)}
              placeholder="Saisissez votre annotation…"
              rows={4}
            />
          </div>

          <div className="tri-btn-row">
            <button className="tri-btn-add" onClick={handleAdd} disabled={saving || !annText.trim()}>
              {saving ? '…' : '+ Ajouter'}
            </button>
            <button className="tri-btn-ai" onClick={handleAI} disabled={aiLoading}>
              {aiLoading ? '⏳' : '✦ IA'}
            </button>
          </div>

          {/* Suggestion IA */}
          {aiText && !aiLoading && (
            <div className="tri-ai-box">
              {aiText}
              <div>
                <button className="tri-ai-use" onClick={() => { setAnnText(aiText); setAiText(''); }}>
                  Utiliser cette suggestion
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Liste annotations */}
        <div className="tri-ann-divider">Annotations ({counts.total})</div>

        {annError && <div className="tri-error">{annError}</div>}

        {annLoading ? (
          <div className="tri-empty">Chargement…</div>
        ) : annotations.length === 0 ? (
          <div className="tri-empty">Aucune annotation pour ce rapport.</div>
        ) : (
          <div className="tri-ann-list">
            {annotations.map(a => (
              <div key={a.id} className={annClass(a.type)}>
                <div className={`tri-ann-type ${typeClass(a.type)}`}>{typeLabel(a.type)}</div>
                <div className="tri-ann-target">📌 {a.target}</div>
                <div className="tri-ann-text">{a.text}</div>
                <div className="tri-ann-meta">
                  {a.created_at?.split('T')[0] || ''} · {a.author}
                </div>
                <button className="tri-ann-del" onClick={() => handleDelete(a.id)}>
                  🗑 Supprimer
                </button>
              </div>
            ))}
          </div>
        )}

        <button className="tri-export" onClick={handleExport}>
          ↓ Exporter les annotations
        </button>
      </div>
    </div>
  );
}