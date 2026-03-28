import { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine,
} from 'recharts';
import API from '../../services/api';

/* ══════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');

  @keyframes nd-fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes nd-spin     { to{transform:rotate(360deg)} }
  @keyframes nd-pulse    { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.15)} }
  @keyframes nd-shimmer  { from{background-position:200% center} to{background-position:-200% center} }
  @keyframes nd-scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }

  .nd-root { font-family:'Space Grotesk',sans-serif; }
  .nd-root * { box-sizing:border-box; margin:0; padding:0; }

  .nd-card {
    background:rgba(255,255,255,.025);
    border:1px solid rgba(255,255,255,.06);
    border-radius:20px;
    transition:border-color .3s, box-shadow .3s;
  }
  .nd-card:hover { border-color:rgba(99,210,190,.15); box-shadow:0 0 40px rgba(99,210,190,.05); }

  .nd-kpi {
    cursor:default;
    transition:transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .25s;
  }
  .nd-kpi:hover { transform:translateY(-6px) scale(1.02); }

  .nd-anim-1 { animation:nd-fadeUp .5s ease both .05s }
  .nd-anim-2 { animation:nd-fadeUp .5s ease both .12s }
  .nd-anim-3 { animation:nd-fadeUp .5s ease both .19s }
  .nd-anim-4 { animation:nd-fadeUp .5s ease both .26s }
  .nd-anim-5 { animation:nd-fadeUp .5s ease both .33s }
  .nd-anim-6 { animation:nd-fadeUp .5s ease both .40s }

  .nd-bar-fill {
    height:100%; border-radius:99px;
    transition:width 1.4s cubic-bezier(.22,1,.36,1);
  }
`;

function injectStyles() {
  if (document.getElementById('nd-styles-v2')) return;
  const el = document.createElement('style');
  el.id = 'nd-styles-v2'; el.textContent = CSS;
  document.head.appendChild(el);
}

/* ══════════════════════════════════════════════
   THEME
══════════════════════════════════════════════ */
const BG     = '#070f1a';
const TEAL   = '#5eead4';
const GREEN  = '#4ade80';
const AMBER  = '#fbbf24';
const RED    = '#f87171';
const INDIGO = '#818cf8';
const BLUE   = '#38bdf8';

const scoreColor = s => s >= 75 ? GREEN : s >= 55 ? AMBER : RED;

/* ══════════════════════════════════════════════
   CUSTOM TOOLTIPS
══════════════════════════════════════════════ */
const EvoTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const score = payload[0]?.value;
  const count = payload[1]?.value;
  const c = scoreColor(score);
  return (
    <div style={{ background:'#0d1f35', border:`1px solid ${c}30`, borderRadius:12, padding:'12px 16px', fontSize:12 }}>
      <div style={{ color:'#64748b', marginBottom:6, fontSize:11, fontFamily:"'JetBrains Mono',monospace" }}>Semaine du {label}</div>
      <div style={{ color:c, fontWeight:700, fontSize:20, fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>{score}%</div>
      <div style={{ color:'#475569', fontSize:11, marginTop:4 }}>{count} rapport{count > 1 ? 's' : ''}</div>
    </div>
  );
};

const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const score = parseFloat(payload[0]?.value);
  const c = scoreColor(score);
  return (
    <div style={{ background:'#0d1f35', border:`1px solid ${c}30`, borderRadius:12, padding:'12px 16px', fontSize:12 }}>
      <div style={{ color:'#64748b', marginBottom:4, fontSize:11 }}>{label}</div>
      <div style={{ color:c, fontWeight:700, fontSize:18, fontFamily:"'JetBrains Mono',monospace" }}>{score}%</div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   ANIMATED COUNT
══════════════════════════════════════════════ */
function AnimCount({ target, suffix = '', duration = 1200 }) {
  const [val, setVal] = useState(0);
  const start = useRef(null);
  useEffect(() => {
    start.current = null;
    const step = (ts) => {
      if (!start.current) start.current = ts;
      const p = Math.min((ts - start.current) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return <>{val}{suffix}</>;
}

/* ══════════════════════════════════════════════
   ANIMATED BAR
══════════════════════════════════════════════ */
function AnimBar({ value, color, delay = 0 }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(value), 400 + delay);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div style={{ flex:1, height:5, background:'rgba(255,255,255,.05)', borderRadius:99, overflow:'hidden' }}>
      <div className="nd-bar-fill" style={{ width:`${w}%`, background:`linear-gradient(90deg,${color}60,${color})`, boxShadow:`0 0 10px ${color}40` }} />
    </div>
  );
}

/* ══════════════════════════════════════════════
   SECTION LABEL
══════════════════════════════════════════════ */
function Label({ children, color = TEAL }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
      <div style={{ width:3, height:16, background:color, borderRadius:99, boxShadow:`0 0 8px ${color}` }} />
      <span style={{ fontSize:11, fontWeight:600, color:'#475569', letterSpacing:'.8px', textTransform:'uppercase' }}>{children}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════ */
export default function NationalDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiOk,   setApiOk]   = useState(null);

  useEffect(() => {
    injectStyles();
    load();
    return () => document.getElementById('nd-styles-v2')?.remove();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get('/stats/national');
      if (res.data?.global) { setStats(res.data); setApiOk(true); }
      else { setApiOk(false); setStats(null); }
    } catch { setApiOk(false); setStats(null); }
    finally { setLoading(false); }
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="nd-root" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', flexDirection:'column', gap:16 }}>
      <div style={{ width:44, height:44, border:`2px solid rgba(94,234,212,.1)`, borderTop:`2px solid ${TEAL}`, borderRadius:'50%', animation:'nd-spin 1s linear infinite' }} />
      <p style={{ color:'#334155', fontSize:13, fontFamily:"'JetBrains Mono',monospace" }}>Chargement des données...</p>
    </div>
  );

  /* ── No data ── */
  if (!stats) return (
    <div className="nd-root" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ textAlign:'center', maxWidth:420 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>📊</div>
        <h2 style={{ fontWeight:700, color:'#e2e8f0', marginBottom:8, fontSize:18 }}>Aucune donnée disponible</h2>
        <p style={{ color:'#334155', fontSize:13, lineHeight:1.8, marginBottom:24 }}>Le dashboard se remplit lorsque des entreprises soumettent leurs rapports d'audit.</p>
        <button onClick={load} style={{ padding:'10px 24px', background:`${TEAL}18`, color:TEAL, border:`1px solid ${TEAL}28`, borderRadius:12, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif" }}>
          🔄 Actualiser
        </button>
      </div>
    </div>
  );

  const g         = stats.global    || {};
  const sectors   = stats.sectors   || [];
  const evolution = stats.evolution || [];

  const total   = parseInt(g.total_reports)   || 0;
  const avg     = parseFloat(g.avg_score)     || 0;
  const pending = parseInt(g.pending_count)   || 0;
  const rssi    = parseInt(g.with_rssi)       || 0;
  const valid   = parseInt(g.validated_count) || 0;
  const avgColor = scoreColor(avg);

  /* Trend: compare last two evolution points */
  const trend = evolution.length >= 2
    ? parseFloat(evolution[evolution.length-1].avg_score) - parseFloat(evolution[evolution.length-2].avg_score)
    : null;

  return (
    <div className="nd-root" style={{ color:'#e2e8f0', paddingBottom:32 }}>

      {/* ── HEADER ── */}
      <div className="nd-anim-1" style={{ marginBottom:28, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
        <div>
          <div style={{ fontSize:11, color:'#334155', letterSpacing:'.8px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:6 }}>ANCS · Audit SSI 2026</div>
          <h1 style={{ fontSize:26, fontWeight:700, color:'#f1f5f9', lineHeight:1 }}>Tableau de bord national</h1>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:11, fontFamily:"'JetBrains Mono',monospace", color: apiOk ? GREEN : AMBER }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background: apiOk ? GREEN : AMBER, boxShadow:`0 0 8px ${apiOk ? GREEN : AMBER}`, animation:'nd-pulse 2s ease-in-out infinite' }} />
          {apiOk ? 'API connectée' : 'Hors ligne'}
        </div>
      </div>

      {/* ── KPI ROW ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
        {[
          { icon:'📄', val:total,                 suf:'',  label:'Rapports total',  color:TEAL,   anim:'nd-anim-1' },
          { icon:'✅', val:valid,                 suf:'',  label:'Validés',         color:GREEN,  anim:'nd-anim-2' },
          { icon:'⏳', val:pending,               suf:'',  label:'En attente',      color:AMBER,  anim:'nd-anim-3' },
          { icon:'🔐', val:rssi,                  suf:'',  label:'Avec RSSI',       color:BLUE,   anim:'nd-anim-4' },
          { icon:'📊', val:Math.round(avg),       suf:'%', label:'Score SSI moyen', color:avgColor, anim:'nd-anim-5' },
        ].map(({ icon, val, suf, label, color, anim }) => (
          <div key={label} className={`nd-card nd-kpi ${anim}`} style={{ padding:'20px 18px', position:'relative', overflow:'hidden' }}>
            {/* Glow */}
            <div style={{ position:'absolute', inset:0, background:`radial-gradient(circle at 80% 20%, ${color}08 0%, transparent 60%)`, pointerEvents:'none' }} />
            <div style={{ fontSize:20, marginBottom:12 }}>{icon}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:28, fontWeight:700, color, lineHeight:1, marginBottom:6 }}>
              <AnimCount target={val} suffix={suf} />
            </div>
            <div style={{ fontSize:11, color:'#334155', fontWeight:500, letterSpacing:'.3px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── EVOLUTION CHART (full width) ── */}
      <div className="nd-card nd-anim-3" style={{ padding:'24px 24px 16px', marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div>
            <Label color={TEAL}>Évolution du score de conformité</Label>
            <p style={{ fontSize:12, color:'#334155', marginTop:-10 }}>Score moyen hebdomadaire · 3 derniers mois</p>
          </div>
          {trend !== null && (
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:11, color:'#334155', marginBottom:4 }}>Tendance</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:18, fontWeight:700, color: trend >= 0 ? GREEN : RED }}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
              </div>
            </div>
          )}
        </div>

        {evolution.length === 0 ? (
          <div style={{ height:240, display:'flex', alignItems:'center', justifyContent:'center', color:'#334155', fontSize:13, fontFamily:"'JetBrains Mono',monospace" }}>
            Pas encore de données temporelles
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={evolution} margin={{ top:10, right:10, bottom:0, left:-20 }}>
              <defs>
                <linearGradient id="evoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={TEAL} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={TEAL} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fontSize:10, fill:'#334155', fontFamily:"'JetBrains Mono',monospace" }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize:10, fill:'#334155', fontFamily:"'JetBrains Mono',monospace" }}
                axisLine={false} tickLine={false}
              />
              <ReferenceLine y={75} stroke={`${GREEN}40`} strokeDasharray="4 4" label={{ value:'Seuil 75%', fill:`${GREEN}60`, fontSize:10, fontFamily:"'JetBrains Mono',monospace" }} />
              <ReferenceLine y={55} stroke={`${AMBER}30`} strokeDasharray="4 4" />
              <Tooltip content={<EvoTooltip />} cursor={{ stroke:`${TEAL}30`, strokeWidth:1 }} />
              <Area
                type="monotone"
                dataKey="avg_score"
                stroke={TEAL}
                strokeWidth={2.5}
                fill="url(#evoGrad)"
                dot={{ fill:TEAL, r:4, stroke:BG, strokeWidth:2 }}
                activeDot={{ r:6, fill:TEAL, stroke:BG, strokeWidth:2 }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="transparent"
                fill="transparent"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* Legend */}
        <div style={{ display:'flex', gap:20, marginTop:12, paddingTop:12, borderTop:'1px solid rgba(255,255,255,.04)' }}>
          {[
            { color:GREEN, label:'≥ 75% Conforme' },
            { color:AMBER, label:'55–74% Partiel' },
            { color:RED,   label:'< 55% Non conforme' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#475569' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── BOTTOM ROW : Bar chart + Sector table ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

        {/* Bar chart — score par secteur */}
        <div className="nd-card nd-anim-4" style={{ padding:'24px' }}>
          <Label color={BLUE}>Score moyen par secteur</Label>
          {sectors.length === 0 ? (
            <div style={{ height:220, display:'flex', alignItems:'center', justifyContent:'center', color:'#334155', fontSize:13 }}>Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sectors} margin={{ top:5, right:5, bottom:5, left:-20 }} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false} />
                <XAxis
                  dataKey="sector"
                  tick={{ fontSize:9, fill:'#334155', fontFamily:"'Space Grotesk',sans-serif" }}
                  axisLine={false} tickLine={false}
                />
                <YAxis domain={[0,100]} tick={{ fontSize:9, fill:'#334155' }} axisLine={false} tickLine={false} />
                <Tooltip content={<BarTooltip />} cursor={{ fill:'rgba(255,255,255,.03)' }} />
                <Bar dataKey="avg_score" radius={[6,6,0,0]}>
                  {sectors.map((s, i) => (
                    <Cell key={i} fill={scoreColor(parseFloat(s.avg_score))} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Sector table */}
        <div className="nd-card nd-anim-5" style={{ padding:'24px' }}>
          <Label color={INDIGO}>Détail par secteur</Label>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {sectors.length === 0 ? (
              <p style={{ color:'#334155', fontSize:13 }}>Aucun secteur disponible</p>
            ) : sectors.map((s, i) => {
              const score = parseFloat(s.avg_score) || 0;
              const color = scoreColor(score);
              return (
                <div key={s.sector}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:color, boxShadow:`0 0 6px ${color}` }} />
                      <span style={{ fontSize:13, fontWeight:500, color:'#cbd5e1' }}>{s.sector}</span>
                      <span style={{ fontSize:10, color:'#334155', fontFamily:"'JetBrains Mono',monospace" }}>{s.total}</span>
                    </div>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color, fontSize:14 }}>{Math.round(score)}%</span>
                  </div>
                  <AnimBar value={score} color={color} delay={i * 80} />
                </div>
              );
            })}
          </div>

          {/* Global indicators */}
          <div style={{ marginTop:22, paddingTop:16, borderTop:'1px solid rgba(255,255,255,.05)', display:'flex', flexDirection:'column', gap:12 }}>
            <Label color={GREEN}>Indicateurs globaux</Label>
            {[
              { label:'Taux de validation', value: total ? Math.round((valid/total)*100) : 0, color:GREEN  },
              { label:'Taux RSSI déployé',  value: total ? Math.round((rssi/total)*100)  : 0, color:TEAL   },
            ].map(({ label, value, color }, i) => (
              <div key={label}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ fontSize:11, color:'#334155' }}>{label}</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color, fontSize:12 }}>{value}%</span>
                </div>
                <AnimBar value={value} color={color} delay={i * 100} />
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={{ marginTop:28, textAlign:'center', fontSize:10, color:'#1e293b', letterSpacing:'.4px', fontFamily:"'JetBrains Mono',monospace" }}>
        ANCS · Agence Nationale de la Cybersécurité · Tunisie © 2026
      </div>

    </div>
  );
}