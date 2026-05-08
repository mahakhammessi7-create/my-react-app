  import { useState, useEffect } from 'react';

  /* ══════════════════════════════════════════════
    GLOBAL STYLES
  ══════════════════════════════════════════════ */
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

    @keyframes cc-fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes cc-spin     { to{transform:rotate(360deg)} }
    @keyframes cc-pulse    { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
    @keyframes cc-glow     { 0%,100%{opacity:.3} 50%{opacity:.75} }
    @keyframes cc-barFill  { from{width:0%} }
    @keyframes cc-tickPop  { 0%{opacity:0;transform:scale(.4)} 70%{transform:scale(1.2)} 100%{opacity:1;transform:scale(1)} }
    @keyframes cc-scanLine {
      0%   { top:-4px; opacity:.8 }
      100% { top:100%; opacity:0 }
    }

    .cc-root { font-family:'DM Sans',sans-serif; }
    .cc-root * { box-sizing:border-box; margin:0; padding:0; }

    .cc-anim { animation:cc-fadeUp .5s ease both; }

    .cc-annexe-row {
      display:flex; align-items:center; justify-content:space-between;
      padding:12px 20px; border-bottom:1px solid rgba(255,255,255,.04);
      transition:background .2s, transform .2s;
    }
    .cc-annexe-row:hover { background:rgba(99,210,190,.04); transform:translateX(3px); }

    .cc-tick { animation:cc-tickPop .4s cubic-bezier(.22,1,.36,1) both; }
  `;

  function injectCcStyles() {
    if (document.getElementById('cc-styles')) return;
    const el = document.createElement('style');
    el.id = 'cc-styles';
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  /* ══════════════════════════════════════════════
    THEME
  ══════════════════════════════════════════════ */
  const BG     = "#07111e";
  const CARD   = "rgba(255,255,255,.028)";
  const BORDER = "rgba(255,255,255,.07)";
  const TEAL   = "#63d2be";
  const GREEN  = "#4ade80";
  const RED    = "#f87171";
  const AMBER  = "#fbbf24";
  const ORANGE = "#f97316";

  /* ══════════════════════════════════════════════
    ANNEXES CONFIG
  ══════════════════════════════════════════════ */
  const ANNEXES = [
    { id:1, name:"Annexe 1", desc:"Identification de l'organisme",          weight:25 },
    { id:2, name:"Annexe 3", desc:"Applications & systèmes dans le périmètre", weight:25 },
    { id:3, name:"Annexe 6", desc:"Résultats des KPIs de sécurité",          weight:25 },
    { id:4, name:"Annexe 7", desc:"Indicateurs de maturité SSI",             weight:25 },
  ];

  /* ══════════════════════════════════════════════
    HELPERS
  ══════════════════════════════════════════════ */
  function StatusBadge({ status }) {
    const cfg = {
      conforme:     { color:GREEN,  icon:'✓', label:'Conforme'     },
      non_conforme: { color:RED,    icon:'✗', label:'Non conforme' },
      checking:     { color:AMBER,  icon:'…', label:'Vérification' },
      pending:      { color:'#3d607a', icon:'–', label:'En attente' },
    }[status] || { color:'#3d607a', icon:'–', label:'—' };

    return (
      <span className={status === 'conforme' || status === 'non_conforme' ? 'cc-tick' : ''} style={{ display:'inline-flex', alignItems:'center', gap:5, background:`${cfg.color}14`, color:cfg.color, border:`1px solid ${cfg.color}28`, padding:'3px 11px', borderRadius:99, fontSize:11, fontWeight:700, letterSpacing:'.4px', textTransform:'uppercase', whiteSpace:'nowrap' }}>
        <span style={{ width:5, height:5, borderRadius:'50%', background:cfg.color, boxShadow:`0 0 6px ${cfg.color}` }} />
        {cfg.label}
      </span>
    );
  }

  function AnimatedBar({ value, color, delay = 0 }) {
    const [w, setW] = useState(0);
    useEffect(() => {
      const t = setTimeout(() => setW(value), delay + 200);
      return () => clearTimeout(t);
    }, [value, delay]);
    return (
      <div style={{ flex:1, height:6, background:'rgba(255,255,255,.06)', borderRadius:99, overflow:'hidden' }}>
        <div style={{ width:`${w}%`, height:'100%', background:`linear-gradient(90deg,${color}55,${color})`, borderRadius:99, transition:'width 1.2s cubic-bezier(.22,1,.36,1)', boxShadow:`0 0 8px ${color}44` }} />
      </div>
    );
  }

  /* ══════════════════════════════════════════════
    MAIN COMPONENT
  ══════════════════════════════════════════════ */
  export default function ComplianceChecker({ file, onComplianceResult }) {
    const [phase,      setPhase]      = useState('loading'); // loading | result
    const [progress,   setProgress]   = useState(0);
    const [stepIndex,  setStepIndex]  = useState(0);
    const [results,    setResults]    = useState([]);
    const [finalScore, setFinalScore] = useState(0);

    const STEPS = [
      "Lecture du fichier...",
      "Vérification de la structure...",
      "Analyse Annexe 1...",
      "Analyse Annexe 3...",
      "Analyse Annexe 6...",
      "Analyse Annexe 7...",
      "Calcul du score final...",
    ];

    useEffect(() => {
      injectCcStyles();
      return () => {
        const el = document.getElementById('cc-styles');
        if (el) el.remove();
      };
    }, []);

    useEffect(() => {
      // ✅ FIX : injection CSS déplacée dans useEffect avec cleanup
      // Avant : document.createElement exécuté au niveau module → fuites de <style>

      const interval = setInterval(() => {
        setProgress(prev => {
          const next = prev + 14;
          setStepIndex(Math.min(Math.floor(next / 15), STEPS.length - 1));

          if (next >= 100) {
            clearInterval(interval);

            // Résultats simulés basés sur le nom du fichier
            const fname   = file?.name?.toLowerCase() || '';
            const isGood  = !fname.includes('incomplet') && !fname.includes('erreur');
            const annexeResults = [
              { ...ANNEXES[0], status: isGood ? 'conforme'     : 'non_conforme' },
              { ...ANNEXES[1], status: isGood ? 'conforme'     : 'non_conforme' },
              { ...ANNEXES[2], status: isGood ? 'conforme'     : 'non_conforme' },
              { ...ANNEXES[3], status: isGood ? 'non_conforme' : 'non_conforme' },
            ];

            const score = annexeResults.reduce((acc, a) =>
              acc + (a.status === 'conforme' ? a.weight : 0), 0
            );

            setTimeout(() => {
              setResults(annexeResults);
              setFinalScore(score);
              setPhase('result');
              onComplianceResult({
                global:  { compliant: score >= 75, score, message: score >= 75 ? "RAPPORT CONFORME" : "RAPPORT NON CONFORME" },
                annexes: annexeResults,
              });
            }, 400);

            return 100;
          }
          return next;
        });
      }, 280);

      return () => clearInterval(interval);
    }, [file, onComplianceResult]);

    const isCompliant = finalScore >= 75;

    /* ── LOADING STATE ── */
    if (phase === 'loading') {
      return (
        <div className="cc-root cc-anim" style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:20, overflow:'hidden', marginTop:18 }}>

          {/* Scan animation header */}
          <div style={{ background:`linear-gradient(135deg,#0c1f3a,#0a2540)`, padding:'22px 24px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${TEAL},transparent)`, animation:'cc-scanLine 1.8s linear infinite' }} />
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', border:`2px solid rgba(99,210,190,.15)`, borderTop:`2px solid ${TEAL}`, animation:'cc-spin 1s linear infinite', flexShrink:0 }} />
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:800, color:'#d4e8ff', marginBottom:3 }}>Analyse du rapport en cours</div>
                <div style={{ fontSize:12, color:'#3d607a' }}>{STEPS[stepIndex]}</div>
              </div>
              <div style={{ marginLeft:'auto', fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:900, color:TEAL }}>{progress}%</div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ padding:'20px 24px' }}>
            <div style={{ height:8, background:'rgba(255,255,255,.06)', borderRadius:99, overflow:'hidden', marginBottom:20 }}>
              <div style={{ width:`${progress}%`, height:'100%', background:`linear-gradient(90deg,${TEAL}55,${TEAL})`, borderRadius:99, transition:'width .3s ease', boxShadow:`0 0 12px ${TEAL}55` }} />
            </div>

            {/* Steps */}
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {STEPS.map((s, i) => {
                const done    = i < stepIndex;
                const active  = i === stepIndex;
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, opacity: done||active ? 1 : 0.25, transition:'opacity .3s' }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0,
                      background: done ? `${GREEN}20` : active ? `${TEAL}20` : 'rgba(255,255,255,.04)',
                      border: `1px solid ${done ? GREEN : active ? TEAL : 'rgba(255,255,255,.08)'}`,
                      color: done ? GREEN : active ? TEAL : '#3d607a',
                    }}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize:12, color: done ? '#4a6a88' : active ? '#c8dff4' : '#2a4a62', fontWeight: active ? 600 : 400 }}>{s}</span>
                    {active && <div style={{ width:6, height:6, borderRadius:'50%', background:TEAL, animation:'cc-pulse 1s ease-in-out infinite', marginLeft:'auto' }} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    /* ── RESULT STATE ── */
    return (
      <div className="cc-root cc-anim" style={{ background:CARD, border:`1px solid ${isCompliant?'rgba(74,222,128,.2)':'rgba(248,113,113,.2)'}`, borderRadius:20, overflow:'hidden', marginTop:18 }}>

        {/* Result header */}
        <div style={{ background:`linear-gradient(135deg,#0c1f3a,#0a2540)`, padding:'22px 24px', display:'flex', alignItems:'center', gap:16, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%', background: isCompliant ? GREEN : RED, opacity:.08, filter:'blur(24px)', animation:'cc-glow 3s ease-in-out infinite' }} />
          <div className="cc-tick" style={{ width:50, height:50, borderRadius:'50%', background: isCompliant ? `${GREEN}18` : `${RED}18`, border:`2px solid ${isCompliant?GREEN:RED}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
            {isCompliant ? '✅' : '❌'}
          </div>
          <div style={{ flex:1, position:'relative' }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color: isCompliant ? GREEN : RED, marginBottom:3 }}>
              {isCompliant ? 'RAPPORT CONFORME' : 'RAPPORT NON CONFORME'}
            </div>
            <div style={{ fontSize:12, color:'#3d607a' }}>{file?.name}</div>
          </div>
          <div style={{ textAlign:'right', position:'relative' }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:32, fontWeight:900, color: isCompliant ? GREEN : RED, lineHeight:1 }}>{finalScore}%</div>
            <div style={{ fontSize:10, color:'#3d607a', marginTop:3, textTransform:'uppercase', letterSpacing:'.4px' }}>Score global</div>
          </div>
        </div>

        {/* Score bar */}
        <div style={{ padding:'18px 24px', borderBottom:`1px solid ${BORDER}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:11, color:'#3d607a', textTransform:'uppercase', letterSpacing:'.4px', fontWeight:600 }}>Conformité globale</span>
            <span style={{ fontSize:12, color: finalScore >= 75 ? GREEN : finalScore >= 50 ? AMBER : RED, fontWeight:700 }}>
              {finalScore >= 75 ? 'Seuil atteint (≥ 75%)' : `Seuil non atteint (${finalScore}% < 75%)`}
            </span>
          </div>
          <AnimatedBar value={finalScore} color={isCompliant ? GREEN : RED} />
        </div>

        {/* Annexes */}
        <div>
          <div style={{ padding:'12px 20px', fontSize:11, color:'#3d607a', textTransform:'uppercase', letterSpacing:'.5px', fontWeight:600, borderBottom:`1px solid ${BORDER}` }}>
            Détail par annexe
          </div>
          {results.map((a, i) => (
            <div key={a.id} className="cc-annexe-row" style={{ animationDelay:`${i * .08}s` }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:34, height:34, borderRadius:10, background: a.status === 'conforme' ? `${GREEN}14` : `${RED}14`, border:`1px solid ${a.status === 'conforme' ? GREEN : RED}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, fontFamily:"'Syne',sans-serif", color: a.status === 'conforme' ? GREEN : RED, flexShrink:0 }}>
                  {a.id}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#c8dff4', marginBottom:2 }}>{a.name}</div>
                  <div style={{ fontSize:11, color:'#3d607a' }}>{a.desc}</div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:11, color:'#2a4a62' }}>{a.weight}%</span>
                <StatusBadge status={a.status} />
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div style={{ padding:'14px 20px', background:'rgba(0,0,0,.15)', fontSize:11, color:'#2a4a62', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ color: isCompliant ? GREEN : AMBER }}>ℹ️</span>
          {isCompliant
            ? "Toutes les annexes obligatoires sont présentes. Vous pouvez procéder à l'analyse complète."
            : "Corrigez les annexes non conformes et re-soumettez le rapport avant de passer à l'analyse."}
        </div>
      </div>
    );
  }