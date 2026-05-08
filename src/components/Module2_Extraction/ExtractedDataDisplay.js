import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/* ══════════════════════════════════════════════
   GLOBAL STYLES
══════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  @keyframes ed-fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ed-glow    { 0%,100%{opacity:.3} 50%{opacity:.75} }
  @keyframes ed-barFill { from{width:0%} }
  @keyframes ed-rotateSlow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes ed-floatDot { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }

  .ed-root { font-family:'DM Sans',sans-serif; }
  .ed-root * { box-sizing:border-box; margin:0; padding:0; }

  .ed-anim { animation:ed-fadeUp .5s ease both; }
  .ed-anim:nth-child(1){animation-delay:.04s}
  .ed-anim:nth-child(2){animation-delay:.10s}
  .ed-anim:nth-child(3){animation-delay:.16s}
  .ed-anim:nth-child(4){animation-delay:.22s}
  .ed-anim:nth-child(5){animation-delay:.28s}
  .ed-anim:nth-child(6){animation-delay:.34s}

  .ed-stat-card { transition:transform .25s, box-shadow .25s; }
  .ed-stat-card:hover { transform:translateY(-5px); box-shadow:0 20px 48px rgba(0,0,0,.45) !important; }

  .ed-row { transition:background .2s, transform .2s; }
  .ed-row:hover { background:rgba(99,210,190,.04) !important; transform:translateX(3px); }

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

/* ══════════════════════════════════════════════
   THEME
══════════════════════════════════════════════ */
const BG     = "#07111e";
const CARD   = "rgba(255,255,255,.028)";
const BORDER = "rgba(255,255,255,.07)";
const TEAL   = "#63d2be";
const GREEN  = "#4ade80";
const AMBER  = "#fbbf24";
const RED    = "#f87171";
const PURPLE = "#818cf8";
const BLUE   = "#38bdf8";

/* ══════════════════════════════════════════════
   MOCK FALLBACK
══════════════════════════════════════════════ */
const MOCK = {
  organism_name: "Société de Démonstration", sector:"Finance",
  has_rssi:true, has_pssi:true, maturity_level:4,
  compliance_score:86, incidents_count:5, server_count:12, user_count:150,
};

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
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'16px 20px', borderBottom:`1px solid ${BORDER}` }}>
      <div style={{ width:32, height:32, borderRadius:10, background:`${iconBg}18`, border:`1px solid ${iconBg}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>{icon}</div>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:'#b0cce0', letterSpacing:'.5px', textTransform:'uppercase' }}>{title}</h2>
    </div>
  );
}

function DataRow({ label, value, accent }) {
  return (
    <div className="ed-row" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'11px 20px', borderBottom:`1px solid rgba(255,255,255,.03)` }}>
      <span style={{ fontSize:11, color:'#3d607a', textTransform:'uppercase', letterSpacing:'.5px', fontWeight:600, paddingTop:1 }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:600, color: accent || '#c8dff4', textAlign:'right', maxWidth:'55%' }}>{value}</span>
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

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export default function ExtractedDataDisplay() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    injectEdStyles();
    return () => { const el = document.getElementById('ed-styles'); if (el) el.remove(); };
  }, []);

  useEffect(() => {
  // Récupérer depuis l'API au lieu de localStorage
  const fetchExtractedData = async () => {
    try {
      const response = await fetch('/api/reports/latest-extracted', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setData(data);
      }
    } catch (err) {
      console.error('Erreur récupération données:', err);
    }
  };
  fetchExtractedData();
}, []);

  if (!data) {
    return (
      <div style={{ minHeight:'60vh', background:BG, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <p style={{ color:'#3d607a', fontFamily:"'DM Sans',sans-serif" }}>Chargement...</p>
      </div>
    );
  }

  const company = data.company || data;
  const name    = company.organism_name || company.name  || '—';
  const sector  = company.sector        || '—';
  const rssi    = company.has_rssi;
  const pssi    = company.has_pssi;
  const maturite = company.maturity_level || 0;
  const score   = company.compliance_score || 0;
  const scoreN  = getNiveau(score);
  const incidents  = company.incidents_count || 0;
  const servers    = company.server_count    || 0;
  const users      = company.user_count      || 0;
  const acronym    = company.acronym         || name.charAt(0);

  /* ── RENDER ── */
  return (
    <div className="ed-root" style={{ minHeight:'100vh', background:BG, color:'#e2f0ff', padding:'28px 24px' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>

        {/* ── HERO HEADER ── */}
        <div className="ed-anim" style={{ background:`linear-gradient(135deg,#0c1f3a,#0a2540)`, borderRadius:20, padding:'24px 28px', marginBottom:20, display:'flex', alignItems:'center', gap:18, position:'relative', overflow:'hidden', border:`1px solid rgba(99,210,190,.12)`, boxShadow:'0 8px 32px rgba(0,0,0,.4)' }}>
          {[180,120,70].map((s,i)=>(
            <div key={i} style={{ position:'absolute', width:s, height:s, borderRadius:'50%', border:'1px solid rgba(99,210,190,.07)', right:-s/4, top:'50%', transform:'translateY(-50%)', animation:`ed-rotateSlow ${18+i*6}s linear infinite` }} />
          ))}
          {[[18,60,0],[42,200,.6],[14,380,.3]].map(([t,l,d],i)=>(
            <div key={i} style={{ position:'absolute', top:t, left:l, width:3, height:3, borderRadius:'50%', background:'rgba(99,210,190,.3)', animation:`ed-floatDot ${3+i*.5}s ease-in-out infinite`, animationDelay:`${d}s` }} />
          ))}

          <div style={{ width:54, height:54, background:`linear-gradient(135deg,#0d5580,#1a7a6e)`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:20, fontWeight:900, fontFamily:"'Syne',sans-serif", boxShadow:'0 0 0 2px rgba(99,210,190,.25), 0 6px 20px rgba(0,0,0,.4)', flexShrink:0 }}>
            {acronym.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex:1, position:'relative' }}>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:'#e4f2ff', marginBottom:5, letterSpacing:'-.3px' }}>{name}</h1>
            <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
              <span style={{ fontSize:12, color:'#3d607a' }}>{sector}</span>
              <span style={{ color:'#1a3248' }}>·</span>
              <span style={{ fontSize:12, color:scoreN.color, fontWeight:700 }}>Score : {score}% — {scoreN.label}</span>
            </div>
          </div>
          <div style={{ fontSize:11, color:'#2a4a62', textAlign:'right', position:'relative' }}>
            <div style={{ letterSpacing:'.5px', textTransform:'uppercase' }}>Données extraites</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, color:TEAL, fontSize:14, marginTop:3 }}>Rapport 2024</div>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
          {[
            { icon:'📊', value:`${score}%`,   label:'Score conformité', color:scoreN.color },
            { icon:'⚠️', value:incidents,      label:'Incidents',         color:incidents>10?RED:AMBER },
            { icon:'🖥️', value:servers,        label:'Serveurs',          color:TEAL   },
            { icon:'👥', value:users,          label:'Utilisateurs',      color:BLUE   },
          ].map(({icon,value,label,color},i)=>(
            <div key={label} className="ed-stat-card ed-anim" style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:18, padding:'18px', position:'relative', overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,.25)' }}>
              <div style={{ position:'absolute', top:-10, right:-10, width:50, height:50, borderRadius:'50%', background:color, opacity:.12, filter:'blur(14px)', animation:'ed-glow 3s ease-in-out infinite' }} />
              <div style={{ width:36, height:36, borderRadius:12, background:`${color}18`, border:`1px solid ${color}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, marginBottom:10 }}>{icon}</div>
              <div style={{ fontSize:24, fontWeight:900, color, fontFamily:"'Syne',sans-serif", lineHeight:1, marginBottom:5 }}>{value}</div>
              <div style={{ fontSize:10, color:'#3d607a', textTransform:'uppercase', letterSpacing:'.4px', fontWeight:600 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── 2 COLUMNS ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>

          {/* Infos générales */}
          <SectionCard>
            <SectionHeader icon="🏢" title="Informations organisme" iconBg={TEAL} />
            <DataRow label="Nom"     value={name}   />
            <DataRow label="Secteur" value={sector} />
            {company.acronym   && <DataRow label="Acronyme"  value={company.acronym} accent={TEAL} />}
            {company.statut    && <DataRow label="Statut"    value={company.statut}  />}
            {company.email     && <DataRow label="Contact"   value={company.email}   accent={BLUE} />}
          </SectionCard>

          {/* Sécurité */}
          <SectionCard>
            <SectionHeader icon="🔐" title="Indicateurs de sécurité" iconBg={PURPLE} />
            <DataRow label="RSSI"    value={rssi ? '✓ Présent' : '✗ Absent'} accent={rssi ? GREEN : RED} />
            <DataRow label="PSSI"    value={pssi ? '✓ Approuvée' : '✗ Absente'} accent={pssi ? GREEN : RED} />
            <DataRow label="Maturité" value={`${maturite} / 5`} accent={TEAL} />
            <DataRow label="Incidents déclarés" value={incidents} accent={incidents > 10 ? RED : AMBER} />
            {/* Score bar */}
            <div style={{ padding:'14px 20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                <span style={{ fontSize:10, color:'#3d607a', textTransform:'uppercase', letterSpacing:'.5px', fontWeight:600 }}>Score de conformité</span>
                <span style={{ fontSize:16, fontWeight:800, color:scoreN.color, fontFamily:"'Syne',sans-serif" }}>{score}%</span>
              </div>
              <AnimatedBar value={score} color={scoreN.color} />
            </div>
          </SectionCard>
        </div>

        {/* ── INFRASTRUCTURE ── */}
        <SectionCard style={{ marginBottom:18 }}>
          <SectionHeader icon="🖥️" title="Infrastructure" iconBg={BLUE} />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:0 }}>
            {[
              { icon:'💻', value:users,   label:'Postes utilisateurs', color:BLUE   },
              { icon:'🖥️', value:servers, label:'Serveurs',             color:TEAL   },
              { icon:'⚡', value:`${maturite}/5`, label:'Niveau maturité', color:PURPLE },
            ].map(({icon,value,label,color},i)=>(
              <div key={label} style={{ padding:'18px 22px', borderRight: i < 2 ? `1px solid ${BORDER}` : undefined, textAlign:'center' }}>
                <div style={{ fontSize:22, marginBottom:8 }}>{icon}</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:900, color, marginBottom:5, lineHeight:1 }}>{value}</div>
                <div style={{ fontSize:10, color:'#3d607a', textTransform:'uppercase', letterSpacing:'.4px', fontWeight:600 }}>{label}</div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── BADGES SSI ── */}
        <SectionCard style={{ marginBottom:20 }}>
          <SectionHeader icon="🏆" title="Conformité SSI" iconBg={GREEN} />
          <div style={{ padding:'18px 20px', display:'flex', gap:14, flexWrap:'wrap' }}>
            <Badge text={rssi ? '✓ RSSI nommé' : '✗ RSSI absent'} color={rssi ? GREEN : RED} />
            <Badge text={pssi ? '✓ PSSI approuvée' : '✗ PSSI absente'} color={pssi ? GREEN : RED} />
            <Badge text={`Maturité ${maturite}/5`} color={maturite >= 3 ? TEAL : AMBER} />
            <Badge text={`${scoreN.label}`} color={scoreN.color} />
            <Badge text={incidents === 0 ? '✓ 0 incident' : `${incidents} incidents`} color={incidents > 10 ? RED : incidents > 0 ? AMBER : GREEN} />
          </div>
        </SectionCard>

        {/* ── CTA BUTTON ── */}
        <div className="ed-anim">
          <button className="ed-upload-btn" onClick={() => navigate('/client/dashboard?tab=upload')}>
            <span style={{ fontSize:18 }}>📤</span>
            Uploader un nouveau rapport
          </button>
        </div>

        {/* Footer */}
        <div style={{ marginTop:22, textAlign:'center', fontSize:11, color:'#1e3a52', letterSpacing:'.3px' }}>
          ANCS Platform · Audit de Sécurité des Systèmes d'Information © 2026
        </div>
      </div>
    </div>
  );
}