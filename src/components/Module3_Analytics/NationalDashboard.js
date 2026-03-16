import { useState, useEffect } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Cell,
} from 'recharts';
import API from '../../services/api';

/* ══════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  @keyframes nd-up   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes nd-spin { to{transform:rotate(360deg)} }
  @keyframes nd-glow { 0%,100%{opacity:.25} 50%{opacity:.7} }
  @keyframes nd-rotateSlow { from{transform:rotate(0)} to{transform:rotate(360deg)} }
  @keyframes nd-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }

  .nd-root { font-family:'DM Sans',sans-serif; }
  .nd-root * { box-sizing:border-box; margin:0; padding:0; }
  .nd-anim { animation:nd-up .5s ease both; }
  .nd-anim:nth-child(1){animation-delay:.04s}
  .nd-anim:nth-child(2){animation-delay:.09s}
  .nd-anim:nth-child(3){animation-delay:.14s}
  .nd-anim:nth-child(4){animation-delay:.19s}
  .nd-anim:nth-child(5){animation-delay:.24s}
  .nd-anim:nth-child(6){animation-delay:.29s}

  .nd-stat { transition:transform .25s, box-shadow .25s; }
  .nd-stat:hover { transform:translateY(-5px); box-shadow:0 20px 48px rgba(0,0,0,.45) !important; }

  .nd-sector-row { transition:background .2s, transform .2s; }
  .nd-sector-row:hover { background:rgba(99,210,190,.04) !important; transform:translateX(3px); }

  .nd-retry {
    display:inline-flex; align-items:center; gap:8px;
    background:linear-gradient(135deg,#63d2be,#2eb8a0);
    color:#071520; border:none; padding:11px 24px; border-radius:12px;
    font-size:13px; font-family:'DM Sans',sans-serif; font-weight:700;
    cursor:pointer; transition:filter .2s, transform .15s;
    margin-top:14px;
  }
  .nd-retry:hover { filter:brightness(1.1); transform:translateY(-2px); }
`;

function injectNdStyles() {
  if (document.getElementById('nd-styles')) return;
  const el = document.createElement('style');
  el.id = 'nd-styles'; el.textContent = CSS;
  document.head.appendChild(el);
}

/* ══════════════════════════════════════════════
   THEME
══════════════════════════════════════════════ */
const BG     = '#07111e';
const CARD   = 'rgba(255,255,255,.028)';
const BORDER = 'rgba(255,255,255,.07)';
const TEAL   = '#63d2be';
const GREEN  = '#4ade80';
const AMBER  = '#fbbf24';
const RED    = '#f87171';
const PURPLE = '#818cf8';
const BLUE   = '#38bdf8';

/* ══════════════════════════════════════════════
   MOCK DATA — affiché immédiatement, remplacé par l'API si dispo
══════════════════════════════════════════════ */
const MOCK = {
  global: {
    total_reports:   24,
    avg_score:       '73.4',
    pending_count:   5,
    with_rssi:       18,
    validated_count: 16,
  },
  sectors: [
    { sector:'Finance',        total:8, avg_score:'82' },
    { sector:'Santé',          total:5, avg_score:'67' },
    { sector:'Administration', total:4, avg_score:'74' },
    { sector:'Énergie',        total:3, avg_score:'58' },
    { sector:'Industrie',      total:2, avg_score:'71' },
    { sector:'Télécoms',       total:2, avg_score:'79' },
  ],
  maturity: [
    { axe:'Gouvernance',       valeur:72 },
    { axe:'Risques & Actifs',  valeur:54 },
    { axe:'Continuité',        valeur:67 },
    { axe:'Contrôle Accès',    valeur:88 },
    { axe:'Protection',        valeur:56 },
    { axe:'Sauvegardes',       valeur:59 },
    { axe:'Sécurité Physique', valeur:85 },
    { axe:'Incidents',         valeur:90 },
  ],
};

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */
const scoreColor = (s) => s >= 75 ? GREEN : s >= 55 ? AMBER : RED;

function SectionHeader({ icon, title, iconBg = TEAL }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'16px 22px', borderBottom:`1px solid ${BORDER}` }}>
      <div style={{ width:34, height:34, borderRadius:10, background:`${iconBg}18`, border:`1px solid ${iconBg}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>{icon}</div>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:'#b0cce0', letterSpacing:'.4px', textTransform:'uppercase' }}>{title}</h2>
    </div>
  );
}

function MiniBar({ value, color }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), 500); return () => clearTimeout(t); }, [value]);
  return (
    <div style={{ flex:1, height:6, background:'rgba(255,255,255,.06)', borderRadius:99, overflow:'hidden' }}>
      <div style={{ width:`${w}%`, height:'100%', background:`linear-gradient(90deg,${color}55,${color})`, borderRadius:99, transition:'width 1.2s cubic-bezier(.22,1,.36,1)', boxShadow:`0 0 8px ${color}44` }} />
    </div>
  );
}

const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const score = payload[0].value;
  const c = scoreColor(score);
  return (
    <div style={{ background:'#0c1e34', border:`1px solid rgba(99,210,190,.2)`, borderRadius:10, padding:'10px 14px', fontSize:12, color:'#d4e8ff' }}>
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:TEAL, marginBottom:4 }}>{label}</div>
      <div style={{ fontWeight:800, fontSize:18, color:c, fontFamily:"'Syne',sans-serif" }}>{score}%</div>
    </div>
  );
};

const RadarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const c = scoreColor(d.valeur);
  return (
    <div style={{ background:'#0c1e34', border:`1px solid ${c}44`, borderRadius:10, padding:'10px 14px', fontSize:12, color:'#d4e8ff' }}>
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:c, marginBottom:3 }}>{d.axe}</div>
      <div style={{ fontWeight:800, fontSize:18, color:c, fontFamily:"'Syne',sans-serif" }}>{d.valeur}%</div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export default function NationalDashboard() {
  // ✅ FIX : initialiser avec MOCK directement — page jamais vide
  const [stats,   setStats]   = useState(MOCK);
  const [apiOk,   setApiOk]   = useState(null);  // null=loading, true=ok, false=error
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    injectNdStyles();
    loadStats();
    return () => document.getElementById('nd-styles')?.remove();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await API.get('/stats/national');
      if (res.data && res.data.global) {
        setStats(prev => ({ ...MOCK, ...res.data }));
        setApiOk(true);
      } else {
        // Réponse vide → garder mock
        setApiOk(false);
      }
    } catch {
      // API indisponible → garder mock, afficher banner
      setApiOk(false);
    } finally {
      setLoading(false);
    }
  };

  const g       = stats.global || {};
  const sectors = stats.sectors || [];
  const maturity = stats.maturity || MOCK.maturity;
  const total   = parseInt(g.total_reports)   || 0;
  const avg     = parseFloat(g.avg_score)     || 0;
  const pending = parseInt(g.pending_count)   || 0;
  const rssi    = parseInt(g.with_rssi)       || 0;
  const valid   = parseInt(g.validated_count) || 0;

  /* ── RENDER ── */
  return (
    <div className="nd-root" style={{ color:'#e2f0ff' }}>

      {/* ── PAGE HEADER ── */}
      <div className="nd-anim" style={{ background:'linear-gradient(135deg,#0c1f3a,#0a2540)', borderRadius:20, padding:'22px 28px', marginBottom:20, display:'flex', alignItems:'center', gap:18, position:'relative', overflow:'hidden', border:'1px solid rgba(99,210,190,.12)', boxShadow:'0 8px 32px rgba(0,0,0,.4)' }}>
        {[180,120].map((s,i) => (
          <div key={i} style={{ position:'absolute', width:s, height:s, borderRadius:'50%', border:'1px solid rgba(99,210,190,.08)', right:-s/4, top:'50%', transform:'translateY(-50%)', animation:`nd-rotateSlow ${20+i*6}s linear infinite` }} />
        ))}
        <div style={{ width:50, height:50, background:'linear-gradient(135deg,#0d5580,#1a7a6e)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, boxShadow:'0 0 0 2px rgba(99,210,190,.25)', flexShrink:0, position:'relative' }}>📊</div>
        <div style={{ flex:1, position:'relative' }}>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:19, fontWeight:800, color:'#e4f2ff', marginBottom:4 }}>Tableau de bord national</h1>
          <p style={{ fontSize:12, color:'#3d607a' }}>Vue agrégée de tous les audits de sécurité · ANCS 2026</p>
        </div>
        {/* API status indicator */}
        <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:11, color: apiOk === true ? GREEN : apiOk === false ? AMBER : '#3d607a', position:'relative' }}>
          {loading
            ? <span style={{ width:12, height:12, border:`2px solid rgba(99,210,190,.2)`, borderTop:`2px solid ${TEAL}`, borderRadius:'50%', animation:'nd-spin 1s linear infinite', display:'inline-block' }} />
            : <span style={{ width:7, height:7, borderRadius:'50%', background: apiOk ? GREEN : AMBER, boxShadow:`0 0 8px ${apiOk ? GREEN : AMBER}`, display:'inline-block' }} />
          }
          {loading ? 'Synchro...' : apiOk ? 'API connectée' : 'Données de démonstration'}
        </div>
      </div>

      {/* ── API ERROR BANNER ── */}
      {apiOk === false && !loading && (
        <div className="nd-anim" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(251,191,36,.07)', border:'1px solid rgba(251,191,36,.2)', borderRadius:14, padding:'12px 20px', marginBottom:18, gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:AMBER }}>
            <span style={{ fontSize:18 }}>⚠️</span>
            <span>API indisponible — données de démonstration affichées. Vérifiez que la table <code style={{ fontFamily:'monospace', background:'rgba(251,191,36,.1)', padding:'1px 6px', borderRadius:4 }}>reports</code> existe en base.</span>
          </div>
          <button className="nd-retry" onClick={loadStats} style={{ flexShrink:0, marginTop:0, padding:'8px 16px', fontSize:12 }}>
            🔄 Réessayer
          </button>
        </div>
      )}

      {/* ── KPI CARDS ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, marginBottom:20 }}>
        {[
          { icon:'📄', value:total,  label:'Rapports soumis',  color:TEAL   },
          { icon:'✅', value:valid,  label:'Rapports validés', color:GREEN  },
          { icon:'⏳', value:pending,label:'En attente',       color:AMBER  },
          { icon:'🔐', value:rssi,   label:'Avec RSSI',        color:BLUE   },
          { icon:'📊', value:`${Math.round(avg)}%`, label:'Score moyen SSI', color:PURPLE },
        ].map(({icon,value,label,color},i) => (
          <div key={label} className="nd-stat nd-anim" style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:18, padding:'20px 18px', position:'relative', overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,.25)' }}>
            <div style={{ position:'absolute', top:-12, right:-12, width:56, height:56, borderRadius:'50%', background:color, opacity:.13, filter:'blur(16px)', animation:'nd-glow 3s ease-in-out infinite' }} />
            <div style={{ width:38, height:38, borderRadius:12, background:`${color}18`, border:`1px solid ${color}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, marginBottom:12 }}>{icon}</div>
            <div style={{ fontSize:26, fontWeight:900, color, fontFamily:"'Syne',sans-serif", lineHeight:1, marginBottom:5 }}>{value}</div>
            <div style={{ fontSize:10, color:'#3d607a', fontWeight:600, letterSpacing:'.4px', textTransform:'uppercase' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── CHARTS ROW ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>

        {/* Bar chart — score par secteur */}
        <div className="nd-anim" style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:20, overflow:'hidden' }}>
          <SectionHeader icon="📈" title="Score moyen par secteur" iconBg={BLUE} />
          <div style={{ padding:'20px' }}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={sectors} margin={{ top:5, right:10, bottom:5, left:-10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                <XAxis dataKey="sector" tick={{ fontSize:10, fill:'#3d607a', fontFamily:"'DM Sans',sans-serif" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0,100]} tick={{ fontSize:10, fill:'#3d607a' }} axisLine={false} tickLine={false} />
                <Tooltip content={<BarTooltip />} cursor={{ fill:'rgba(99,210,190,.05)' }} />
                <Bar dataKey="avg_score" radius={[6,6,0,0]}>
                  {sectors.map((s,i) => (
                    <Cell key={i} fill={scoreColor(parseFloat(s.avg_score))} fillOpacity={.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar maturité */}
        <div className="nd-anim" style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:20, overflow:'hidden' }}>
          <SectionHeader icon="📡" title="Radar de maturité national" iconBg={TEAL} />
          <div style={{ padding:'20px' }}>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={maturity} margin={{ top:10, right:30, bottom:10, left:30 }}>
                <PolarGrid stroke="rgba(255,255,255,.08)" />
                <PolarAngleAxis dataKey="axe" tick={{ fontSize:9, fill:'#4a6a88', fontWeight:600 }} />
                <PolarRadiusAxis angle={90} domain={[0,100]} tick={{ fontSize:8, fill:'#2a4a62' }} tickCount={5} />
                <Radar dataKey="valeur" stroke={TEAL} fill={TEAL} fillOpacity={0.12} strokeWidth={2} dot={{ fill:TEAL, r:3, stroke:'#07111e', strokeWidth:2 }} />
                <Tooltip content={<RadarTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── SECTOR TABLE ── */}
      <div className="nd-anim" style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:20, overflow:'hidden', marginBottom:18 }}>
        <SectionHeader icon="🏭" title="Détail par secteur d'activité" iconBg={PURPLE} />
        <div style={{ padding:'8px 0' }}>
          {sectors.map((s) => {
            const score = parseFloat(s.avg_score) || 0;
            const color = scoreColor(score);
            return (
              <div key={s.sector} className="nd-sector-row" style={{ padding:'12px 22px', borderBottom:`1px solid rgba(255,255,255,.03)` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:color, boxShadow:`0 0 6px ${color}` }} />
                    <span style={{ fontSize:13, fontWeight:600, color:'#c8dff4' }}>{s.sector}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <span style={{ fontSize:11, color:'#3d607a' }}>{s.total} rapport{s.total > 1 ? 's' : ''}</span>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, color, fontSize:15 }}>{Math.round(score)}%</span>
                  </div>
                </div>
                <MiniBar value={score} color={color} />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── GLOBAL SUMMARY ── */}
      <div className="nd-anim" style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:18, overflow:'hidden' }}>
        <SectionHeader icon="🌍" title="Indicateurs globaux" iconBg={GREEN} />
        <div style={{ padding:'18px 22px', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
          {[
            { label:'Taux de validation',    value: total ? Math.round((valid/total)*100)  : 0, color:GREEN  },
            { label:'Taux RSSI déployé',      value: total ? Math.round((rssi/total)*100)   : 0, color:TEAL   },
            { label:'Score conformité moyen', value: Math.round(avg),                            color:PURPLE },
          ].map(({label,value,color}) => (
            <div key={label}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                <span style={{ fontSize:11, color:'#3d607a', fontWeight:600, textTransform:'uppercase', letterSpacing:'.4px' }}>{label}</span>
                <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, color, fontSize:15 }}>{value}%</span>
              </div>
              <MiniBar value={value} color={color} />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop:22, textAlign:'center', fontSize:11, color:'#1e3a52', letterSpacing:'.3px' }}>
        ANCS Platform · Audit de Sécurité des Systèmes d'Information © 2026
      </div>
    </div>
  );
}