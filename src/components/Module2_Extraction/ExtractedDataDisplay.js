  import { useState, useEffect } from 'react';
  import { useNavigate } from 'react-router-dom';

  /* ══════════════════════════════════════════════
    GLOBAL STYLES
  ══════════════════════════════════════════════ */
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

    @keyframes ed-fadeUp    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ed-glow      { 0%,100%{opacity:.3} 50%{opacity:.75} }
    @keyframes ed-barFill   { from{width:0%} }
    @keyframes ed-rotateSlow{ from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes ed-floatDot  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }

    .ed-root { font-family:'DM Sans',sans-serif; }
    .ed-root * { box-sizing:border-box; margin:0; padding:0; }

    .ed-anim { animation:ed-fadeUp .5s ease both; }
    .ed-anim:nth-child(1){animation-delay:.04s}
    .ed-anim:nth-child(2){animation-delay:.10s}
    .ed-anim:nth-child(3){animation-delay:.16s}
    .ed-anim:nth-child(4){animation-delay:.22s}
    .ed-anim:nth-child(5){animation-delay:.28s}
    .ed-anim:nth-child(6){animation-delay:.34s}
    .ed-anim:nth-child(7){animation-delay:.40s}
    .ed-anim:nth-child(8){animation-delay:.46s}

    .ed-stat-card { transition:transform .25s, box-shadow .25s; }
    .ed-stat-card:hover { transform:translateY(-5px); box-shadow:0 20px 48px rgba(0,0,0,.45) !important; }

    .ed-row { transition:background .2s, transform .2s; }
    .ed-row:hover { background:rgba(99,210,190,.04) !important; transform:translateX(3px); }

    .ed-table-row { transition:background .15s; }
    .ed-table-row:hover { background:rgba(99,210,190,.05) !important; }

    .ed-upload-btn {
      display:flex; align-items:center; justify-content:center; gap:9px;
      width:100%; padding:14px;
      background:linear-gradient(135deg,#63d2be,#2eb8a0);
      color:#071520; border:none; border-radius:12px;
      font-size:14px; font-family:'DM Sans',sans-serif; font-weight:700;
      cursor:pointer; transition:filter .2s, transform .15s;
    }
    .ed-upload-btn:hover { filter:brightness(1.1); transform:translateY(-2px); }
  `;

  function injectEdStyles() {
    if (document.getElementById('ed-styles')) return;
    const el = document.createElement('style');
    el.id = 'ed-styles';
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  const BG     = "#07111e";
  const CARD   = "rgba(255,255,255,.028)";
  const BORDER = "rgba(255,255,255,.07)";
  const TEAL   = "#63d2be";
  const GREEN  = "#4ade80";
  const AMBER  = "#fbbf24";
  const RED    = "#f87171";
  const PURPLE = "#818cf8";
  const BLUE   = "#38bdf8";

  const NIVEAUX = [
    { max:40,  label:"Critique",     color:RED    },
    { max:60,  label:"Partiel",      color:AMBER  },
    { max:80,  label:"Satisfaisant", color:AMBER  },
    { max:100, label:"Optimisé",     color:GREEN  },
  ];
  const getNiveau = (v) => NIVEAUX.find(n => v <= n.max) || NIVEAUX[3];

  /* ══════════════════════════════════════════════
    PRIMITIVES
  ══════════════════════════════════════════════ */
  function SectionCard({ children, style }) {
    return (
      <div className="ed-anim" style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:20, overflow:'hidden', backdropFilter:'blur(10px)', ...style }}>
        {children}
      </div>
    );
  }

  function SectionHeader({ icon, title, iconBg = TEAL }) {
    return (
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 20px', borderBottom:`1px solid ${BORDER}` }}>
        <div style={{ width:30, height:30, borderRadius:9, background:`${iconBg}18`, border:`1px solid ${iconBg}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>{icon}</div>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:700, color:'#b0cce0', letterSpacing:'.6px', textTransform:'uppercase' }}>{title}</h2>
      </div>
    );
  }

  function DataRow({ label, value, accent }) {
    return (
      <div className="ed-row" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'10px 20px', borderBottom:`1px solid rgba(255,255,255,.03)` }}>
        <span style={{ fontSize:11, color:'#3d607a', textTransform:'uppercase', letterSpacing:'.5px', fontWeight:600, paddingTop:1 }}>{label}</span>
        <span style={{ fontSize:13, fontWeight:600, color: accent || '#c8dff4', textAlign:'right', maxWidth:'58%' }}>{value || '—'}</span>
      </div>
    );
  }

  function AnimatedBar({ value, color }) {
    const [w, setW] = useState(0);
    useEffect(() => { const t = setTimeout(() => setW(value), 500); return () => clearTimeout(t); }, [value]);
    return (
      <div style={{ flex:1, height:7, background:'rgba(255,255,255,.06)', borderRadius:99, overflow:'hidden' }}>
        <div style={{ width:`${w}%`, height:'100%', background:`linear-gradient(90deg,${color}55,${color})`, borderRadius:99, transition:'width 1.3s cubic-bezier(.22,1,.36,1)', boxShadow:`0 0 10px ${color}44` }} />
      </div>
    );
  }

  function Badge({ text, color }) {
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:`${color}14`, color, border:`1px solid ${color}28`, padding:'3px 11px', borderRadius:99, fontSize:11, fontWeight:700, letterSpacing:'.4px', textTransform:'uppercase', whiteSpace:'nowrap' }}>
        <span style={{ width:5, height:5, borderRadius:'50%', background:color, boxShadow:`0 0 5px ${color}` }} />
        {text}
      </span>
    );
  }

  function ScoreDot({ val }) {
    const color = val >= 4 ? GREEN : val >= 3 ? TEAL : val >= 2 ? AMBER : RED;
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:5, color, fontWeight:700, fontSize:13 }}>
        <span style={{ width:8, height:8, borderRadius:'50%', background:color, boxShadow:`0 0 6px ${color}` }} />
        {val}/5
      </span>
    );
  }

  /* ══════════════════════════════════════════════
    HELPER : parse les données du backend
    Le backend /api/reports/latest-extracted retourne
    un objet PLAT. Le détail complet vient de /full.
    On appelle les deux et on fusionne.
  ══════════════════════════════════════════════ */
  async function fetchFullData(token) {
    // 1. Récupérer le dernier rapport (infos de base)
    const r1 = await fetch('/api/reports/latest-extracted', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r1.ok) throw new Error('latest-extracted failed');
    const base = await r1.json();

    // 2. Récupérer la liste pour avoir l'id du dernier
    const r2 = await fetch('/api/reports/my?limit=1', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r2.ok) return { base, annexes: null };
    const list = await r2.json();
    const lastId = list.data?.[0]?.id;
    if (!lastId) return { base, annexes: null };

    // 3. Récupérer toutes les annexes via /full
    const r3 = await fetch(`/api/reports/${lastId}/full`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r3.ok) return { base, annexes: null };
    const full = await r3.json();

    return { base, annexes: full.annexes, reportId: lastId };
  }

  /* ══════════════════════════════════════════════
    MAIN COMPONENT
  ══════════════════════════════════════════════ */
  export default function ExtractedDataDisplay() {
    const [base,    setBase]    = useState(null);
    const [annexes, setAnnexes] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
      injectEdStyles();
      return () => { const el = document.getElementById('ed-styles'); if (el) el.remove(); };
    }, []);

    useEffect(() => {
      const token = localStorage.getItem('token');
      fetchFullData(token)
        .then(({ base, annexes }) => { setBase(base); setAnnexes(annexes); })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }, []);

    if (loading) {
      return (
        <div style={{ minHeight:'60vh', background:BG, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <p style={{ color:'#3d607a', fontFamily:"'DM Sans',sans-serif" }}>Chargement des données extraites…</p>
        </div>
      );
    }

    if (error || !base) {
      return (
        <div style={{ minHeight:'60vh', background:BG, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
          <p style={{ color:RED, fontFamily:"'DM Sans',sans-serif" }}>Impossible de charger les données.</p>
          <button className="ed-upload-btn" style={{ width:'auto', padding:'10px 24px' }} onClick={() => navigate('/client/dashboard?tab=upload')}>
            Uploader un rapport
          </button>
        </div>
      );
    }

    /* ── Données Annexe 1 : Présentation de l'organisme ── */
    const a1 = annexes?.annexe1 || {};
    const name    = a1.nom_organisme || base.organism_name || base.name || '—';
    const acronym = a1.acronyme      || base.acronym        || name.charAt(0);
    const sector  = a1.secteur_activite || base.sector       || '—';
    const statut  = a1.statut        || base.statut          || '—';
    const email   = a1.adresse_email || base.email           || '—';
    const siteWeb = a1.site_web      || '—';

    /* ── Données Annexe 3 : Description du SI ── */
    const a3        = annexes?.annexe3  || {};
    const serveurs  = Array.isArray(a3.serveurs)              ? a3.serveurs              : [];
    const apps      = Array.isArray(a3.applications)          ? a3.applications          : [];
    const reseau    = Array.isArray(a3.infrastructure_reseau) ? a3.infrastructure_reseau : [];
    const postes    = Array.isArray(a3.postes_travail)        ? a3.postes_travail        : [];

    /* ── Données Annexe 6 : Maturité ── */
    const a6        = annexes?.annexe6  || {};
    const a6global  = a6.global         || {};
    const a6crit    = Array.isArray(a6.criteres) ? a6.criteres : [];
    const maturite  = a6global.score_moyen ?? base.maturity_level ?? 0;

    /* ── Données Annexe 7 : Indicateurs ── */
    const a7       = annexes?.annexe7 || {};
    const a7global = a7.global        || {};
    const a7detail = Array.isArray(a7.detail) ? a7.detail : [];
    const rssi     = a7global.rssi_nomme ?? base.has_rssi ?? false;
    const pssi     = a7global.pssi_existe ?? base.has_pssi ?? false;
    const pca      = a7global.pca_existe  ?? base.has_pca  ?? false;
    const pra      = a7global.pra_existe  ?? base.has_pra  ?? false;
    const siem     = a7global.siem_existe ?? false;
    const comite   = a7global.comite_ssi  ?? false;

    /* ── Score conformité ── */
    const score  = base.compliance_score ?? 0;
    const scoreN = getNiveau(score);

    /* ══════════════════════════════════════════════
      RENDER
    ══════════════════════════════════════════════ */
    return (
      <div className="ed-root" style={{ minHeight:'100vh', background:BG, color:'#e2f0ff', padding:'28px 24px' }}>
        <div style={{ maxWidth:960, margin:'0 auto' }}>

          {/* ── HERO ── */}
          <div className="ed-anim" style={{ background:`linear-gradient(135deg,#0c1f3a,#0a2540)`, borderRadius:20, padding:'24px 28px', marginBottom:20, display:'flex', alignItems:'center', gap:18, position:'relative', overflow:'hidden', border:`1px solid rgba(99,210,190,.12)`, boxShadow:'0 8px 32px rgba(0,0,0,.4)' }}>
            {[180,120,70].map((s,i)=>(
              <div key={i} style={{ position:'absolute', width:s, height:s, borderRadius:'50%', border:'1px solid rgba(99,210,190,.07)', right:-s/4, top:'50%', transform:'translateY(-50%)', animation:`ed-rotateSlow ${18+i*6}s linear infinite` }} />
            ))}
            <div style={{ width:54, height:54, background:`linear-gradient(135deg,#0d5580,#1a7a6e)`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:20, fontWeight:900, fontFamily:"'Syne',sans-serif", boxShadow:'0 0 0 2px rgba(99,210,190,.25), 0 6px 20px rgba(0,0,0,.4)', flexShrink:0 }}>
              {acronym.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:'#e4f2ff', marginBottom:5 }}>{name}</h1>
              <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                {acronym !== name.charAt(0) && <span style={{ fontSize:12, color:TEAL, fontWeight:700 }}>{acronym}</span>}
                {acronym !== name.charAt(0) && <span style={{ color:'#1a3248' }}>·</span>}
                <span style={{ fontSize:12, color:'#3d607a' }}>{sector}</span>
                <span style={{ color:'#1a3248' }}>·</span>
                <span style={{ fontSize:12, color:scoreN.color, fontWeight:700 }}>Score : {score}% — {scoreN.label}</span>
              </div>
            </div>
            <Badge text={statut} color={TEAL} />
          </div>

          {/* ── STAT CARDS ── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
            {[
              { icon:'📊', value:`${score}%`,           label:'Score conformité',   color:scoreN.color },
              { icon:'🖥️', value:serveurs.length || '—', label:'Serveurs',           color:TEAL   },
              { icon:'💻', value:apps.length     || '—', label:'Applications',       color:BLUE   },
              { icon:'🔗', value:reseau.length   || '—', label:'Équip. réseau',      color:PURPLE },
            ].map(({icon,value,label,color})=>(
              <div key={label} className="ed-stat-card ed-anim" style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:18, padding:'18px', position:'relative', overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,.25)' }}>
                <div style={{ position:'absolute', top:-10, right:-10, width:50, height:50, borderRadius:'50%', background:color, opacity:.12, filter:'blur(14px)', animation:'ed-glow 3s ease-in-out infinite' }} />
                <div style={{ width:34, height:34, borderRadius:10, background:`${color}18`, border:`1px solid ${color}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, marginBottom:10 }}>{icon}</div>
                <div style={{ fontSize:24, fontWeight:900, color, fontFamily:"'Syne',sans-serif", lineHeight:1, marginBottom:5 }}>{value}</div>
                <div style={{ fontSize:10, color:'#3d607a', textTransform:'uppercase', letterSpacing:'.4px', fontWeight:600 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* ── LIGNE 1 : Annexe 1 + Annexe 7 ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>

            {/* ANNEXE 1 — Présentation de l'organisme */}
            <SectionCard>
              <SectionHeader icon="🏢" title="A1 — Présentation de l'organisme" iconBg={TEAL} />
              <DataRow label="Nom complet"  value={name}   />
              <DataRow label="Acronyme"     value={a1.acronyme || '—'} accent={TEAL} />
              <DataRow label="Secteur"      value={sector} />
              <DataRow label="Statut juridique" value={statut} />
              <DataRow label="Email"        value={email}  accent={BLUE} />
              <DataRow label="Site web"     value={siteWeb} accent={BLUE} />
              {a1.responsable && <DataRow label="Responsable" value={a1.responsable} />}
              {a1.telephone   && <DataRow label="Téléphone"   value={a1.telephone}   />}
              {a1.adresse     && <DataRow label="Adresse"     value={a1.adresse}     />}
            </SectionCard>

            {/* ANNEXE 7 — Indicateurs de sécurité */}
            <SectionCard>
              <SectionHeader icon="🔐" title="A7 — Indicateurs de sécurité" iconBg={PURPLE} />
              <DataRow label="RSSI nommé"     value={rssi   ? '✓ Oui' : '✗ Non'} accent={rssi   ? GREEN : RED} />
              <DataRow label="PSSI approuvée" value={pssi   ? '✓ Oui' : '✗ Non'} accent={pssi   ? GREEN : RED} />
              <DataRow label="PCA en place"   value={pca    ? '✓ Oui' : '✗ Non'} accent={pca    ? GREEN : RED} />
              <DataRow label="PRA en place"   value={pra    ? '✓ Oui' : '✗ Non'} accent={pra    ? GREEN : RED} />
              <DataRow label="SIEM/IDS"       value={siem   ? '✓ Oui' : '✗ Non'} accent={siem   ? GREEN : RED} />
              <DataRow label="Comité SSI"     value={comite ? '✓ Oui' : '✗ Non'} accent={comite ? GREEN : RED} />
              {/* Indicateurs détaillés */}
              {a7detail.length > 0 && (
                <div style={{ padding:'8px 20px 12px' }}>
                  <div style={{ fontSize:10, color:'#3d607a', textTransform:'uppercase', letterSpacing:'.5px', fontWeight:600, marginBottom:8 }}>Détail indicateurs</div>
                  {a7detail.slice(0, 5).map((ind, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'4px 0', borderBottom:`1px solid rgba(255,255,255,.03)` }}>
                      <span style={{ color:'#64748b' }}>{ind.indicateur}</span>
                      <span style={{ color: ind.valeur === ind.valeur_attendue ? GREEN : AMBER, fontWeight:600 }}>{ind.valeur || '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* ── ANNEXE 6 — Maturité de la sécurité ── */}
          <SectionCard style={{ marginBottom:18 }}>
            <SectionHeader icon="📈" title="A6 — État de maturité de la sécurité du SI" iconBg={GREEN} />
            <div style={{ padding:'16px 20px', borderBottom:`1px solid ${BORDER}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <span style={{ fontSize:11, color:'#3d607a', textTransform:'uppercase', letterSpacing:'.5px', fontWeight:600 }}>Score de maturité global</span>
                <span style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:900, color: maturite >= 3 ? GREEN : maturite >= 2 ? AMBER : RED }}>{maturite} <span style={{ fontSize:14, color:'#3d607a' }}>/ 5</span></span>
              </div>
              <AnimatedBar value={(maturite / 5) * 100} color={maturite >= 3 ? GREEN : maturite >= 2 ? AMBER : RED} />
            </div>
            {a6crit.length > 0 ? (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ background:'rgba(255,255,255,.03)' }}>
                      {['Domaine','Critère','Score','Commentaire'].map(h => (
                        <th key={h} style={{ padding:'9px 16px', textAlign:'left', color:'#3d607a', fontWeight:700, fontSize:10, textTransform:'uppercase', letterSpacing:'.5px', borderBottom:`1px solid ${BORDER}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {a6crit.map((c, i) => (
                      <tr key={i} className="ed-table-row" style={{ borderBottom:`1px solid rgba(255,255,255,.03)` }}>
                        <td style={{ padding:'9px 16px', color:'#64748b', fontWeight:600 }}>{c.domaine || '—'}</td>
                        <td style={{ padding:'9px 16px', color:'#c8dff4' }}>{c.critere || '—'}</td>
                        <td style={{ padding:'9px 16px' }}><ScoreDot val={c.score ?? 0} /></td>
                        <td style={{ padding:'9px 16px', color:'#64748b', fontSize:11 }}>{c.commentaire || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding:'20px', textAlign:'center', color:'#3d607a', fontSize:13 }}>Aucun critère de maturité extrait.</div>
            )}
          </SectionCard>

          {/* ── ANNEXE 3 — Description du SI ── */}
          <SectionCard style={{ marginBottom:18 }}>
            <SectionHeader icon="🖥️" title="A3 — Description du système d'information" iconBg={BLUE} />

            {/* Résumé */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderBottom:`1px solid ${BORDER}` }}>
              {[
                { icon:'🖥️', val:serveurs.length, label:'Serveurs',     color:TEAL   },
                { icon:'📦', val:apps.length,     label:'Applications', color:BLUE   },
                { icon:'🔗', val:reseau.length,   label:'Équip. réseau',color:PURPLE },
                { icon:'💻', val:postes.length,   label:'Types postes', color:AMBER  },
              ].map(({icon,val,label,color}) => (
                <div key={label} style={{ padding:'16px', textAlign:'center', borderRight:`1px solid ${BORDER}` }}>
                  <div style={{ fontSize:18, marginBottom:6 }}>{icon}</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:900, color, marginBottom:4 }}>{val || 0}</div>
                  <div style={{ fontSize:10, color:'#3d607a', textTransform:'uppercase', letterSpacing:'.4px', fontWeight:600 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Serveurs */}
            {serveurs.length > 0 && (
              <div style={{ borderBottom:`1px solid ${BORDER}` }}>
                <div style={{ padding:'10px 16px 6px', fontSize:10, color:'#3d607a', textTransform:'uppercase', letterSpacing:'.5px', fontWeight:700 }}>Serveurs</div>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ background:'rgba(255,255,255,.02)' }}>
                      {['Nom','IP','OS','Rôle','Dans périmètre'].map(h=>(
                        <th key={h} style={{ padding:'7px 14px', textAlign:'left', color:'#3d607a', fontWeight:700, fontSize:10, letterSpacing:'.4px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {serveurs.map((s,i)=>(
                      <tr key={i} className="ed-table-row" style={{ borderTop:`1px solid rgba(255,255,255,.03)` }}>
                        <td style={{ padding:'8px 14px', color:TEAL, fontWeight:600 }}>{s.nom || s.name || '—'}</td>
                        <td style={{ padding:'8px 14px', color:'#64748b', fontFamily:'monospace' }}>{s.adresse_ip || s.ip || '—'}</td>
                        <td style={{ padding:'8px 14px', color:'#c8dff4' }}>{s.systeme_exploitation || s.os || '—'}</td>
                        <td style={{ padding:'8px 14px', color:'#94a3b8' }}>{s.role || '—'}</td>
                        <td style={{ padding:'8px 14px' }}>
                          <span style={{ color: s.dans_perimetre ? GREEN : '#475569', fontWeight:600, fontSize:11 }}>
                            {s.dans_perimetre ? '✓ Oui' : '✗ Non'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Applications */}
            {apps.length > 0 && (
              <div style={{ borderBottom:`1px solid ${BORDER}` }}>
                <div style={{ padding:'10px 16px 6px', fontSize:10, color:'#3d607a', textTransform:'uppercase', letterSpacing:'.5px', fontWeight:700 }}>Applications</div>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ background:'rgba(255,255,255,.02)' }}>
                      {['Nom','Développé par','Nb utilisateurs','Dans périmètre'].map(h=>(
                        <th key={h} style={{ padding:'7px 14px', textAlign:'left', color:'#3d607a', fontWeight:700, fontSize:10, letterSpacing:'.4px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map((a,i)=>(
                      <tr key={i} className="ed-table-row" style={{ borderTop:`1px solid rgba(255,255,255,.03)` }}>
                        <td style={{ padding:'8px 14px', color:BLUE, fontWeight:600 }}>{a.nom || '—'}</td>
                        <td style={{ padding:'8px 14px', color:'#94a3b8' }}>{a.developpe_par || '—'}</td>
                        <td style={{ padding:'8px 14px', color:'#c8dff4' }}>{a.nb_utilisateurs || a.user_count || '—'}</td>
                        <td style={{ padding:'8px 14px' }}>
                          <span style={{ color: a.dans_perimetre ? GREEN : '#475569', fontWeight:600, fontSize:11 }}>
                            {a.dans_perimetre ? '✓ Oui' : '✗ Non'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Réseau */}
            {reseau.length > 0 && (
              <div>
                <div style={{ padding:'10px 16px 6px', fontSize:10, color:'#3d607a', textTransform:'uppercase', letterSpacing:'.5px', fontWeight:700 }}>Infrastructure réseau</div>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ background:'rgba(255,255,255,.02)' }}>
                      {['Nature','Marque/Modèle','Quantité','Géré par','Dans périmètre'].map(h=>(
                        <th key={h} style={{ padding:'7px 14px', textAlign:'left', color:'#3d607a', fontWeight:700, fontSize:10, letterSpacing:'.4px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reseau.map((r,i)=>(
                      <tr key={i} className="ed-table-row" style={{ borderTop:`1px solid rgba(255,255,255,.03)` }}>
                        <td style={{ padding:'8px 14px', color:PURPLE, fontWeight:600 }}>{r.nature || '—'}</td>
                        <td style={{ padding:'8px 14px', color:'#c8dff4' }}>{r.marque_modele || r.brand || '—'}</td>
                        <td style={{ padding:'8px 14px', color:'#94a3b8' }}>{r.quantite || r.count || '—'}</td>
                        <td style={{ padding:'8px 14px', color:'#64748b' }}>{r.gere_par || r.managed_by || '—'}</td>
                        <td style={{ padding:'8px 14px' }}>
                          <span style={{ color: r.dans_perimetre ? GREEN : '#475569', fontWeight:600, fontSize:11 }}>
                            {r.dans_perimetre ? '✓ Oui' : '✗ Non'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {serveurs.length === 0 && apps.length === 0 && reseau.length === 0 && (
              <div style={{ padding:'24px', textAlign:'center', color:'#3d607a', fontSize:13 }}>Aucune donnée infrastructure extraite.</div>
            )}
          </SectionCard>

          {/* ── BADGES SSI ── */}
          <SectionCard style={{ marginBottom:20 }}>
            <SectionHeader icon="🏆" title="Synthèse conformité SSI" iconBg={GREEN} />
            <div style={{ padding:'16px 20px', display:'flex', gap:10, flexWrap:'wrap' }}>
              <Badge text={rssi  ? '✓ RSSI nommé'      : '✗ RSSI absent'}    color={rssi  ? GREEN : RED} />
              <Badge text={pssi  ? '✓ PSSI approuvée'  : '✗ PSSI absente'}   color={pssi  ? GREEN : RED} />
              <Badge text={pca   ? '✓ PCA en place'     : '✗ PCA absent'}     color={pca   ? GREEN : RED} />
              <Badge text={pra   ? '✓ PRA en place'     : '✗ PRA absent'}     color={pra   ? GREEN : RED} />
              <Badge text={siem  ? '✓ SIEM actif'       : '✗ SIEM absent'}    color={siem  ? GREEN : RED} />
              <Badge text={comite? '✓ Comité SSI'       : '✗ Comité absent'}  color={comite? GREEN : RED} />
              <Badge text={`Maturité ${maturite}/5`}    color={maturite >= 3  ? TEAL  : AMBER} />
              <Badge text={`${scoreN.label} (${score}%)`} color={scoreN.color} />
            </div>
          </SectionCard>

          {/* ── CTA ── */}
          <div className="ed-anim">
            <button className="ed-upload-btn" onClick={() => navigate('/client/dashboard?tab=upload')}>
              <span style={{ fontSize:18 }}>📤</span>
              Uploader un nouveau rapport
            </button>
          </div>

          <div style={{ marginTop:22, textAlign:'center', fontSize:11, color:'#1e3a52', letterSpacing:'.3px' }}>
            ANCS Platform · Audit de Sécurité des Systèmes d'Information © 2026
          </div>
        </div>
      </div>
    );
  }