import { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import API from '../../services/api';

/* ══════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');

  @keyframes nd-up    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes nd-spin  { to{transform:rotate(360deg)} }
  @keyframes nd-pulse { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.2)} }
  @keyframes nd-bar   { from{width:0} }

  .nd2-root { font-family:'Space Grotesk',sans-serif; }
  .nd2-root * { box-sizing:border-box; margin:0; padding:0; }

  .nd2-card {
    background:rgba(255,255,255,.025);
    border:1px solid rgba(255,255,255,.06);
    border-radius:18px;
    transition:border-color .25s, box-shadow .25s, transform .25s;
  }
  .nd2-card:hover {
    border-color:rgba(94,234,212,.18);
    box-shadow:0 0 32px rgba(94,234,212,.06);
  }

  .nd2-kpi {
    cursor:default;
    transition:transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .25s;
  }
  .nd2-kpi:hover { transform:translateY(-5px) scale(1.02); }

  .nd2-complex-card {
    border-radius:16px;
    padding:18px 20px;
    transition:transform .2s, box-shadow .2s;
    cursor:default;
  }
  .nd2-complex-card:hover { transform:translateY(-3px); }

  .nd2-a1{animation:nd-up .45s ease both .05s}
  .nd2-a2{animation:nd-up .45s ease both .10s}
  .nd2-a3{animation:nd-up .45s ease both .15s}
  .nd2-a4{animation:nd-up .45s ease both .20s}
  .nd2-a5{animation:nd-up .45s ease both .25s}
  .nd2-a6{animation:nd-up .45s ease both .30s}
  .nd2-a7{animation:nd-up .45s ease both .35s}
  .nd2-a8{animation:nd-up .45s ease both .40s}
`;

function injectStyles() {
  if (document.getElementById('nd2-styles')) return;
  const s = document.createElement('style');
  s.id = 'nd2-styles'; s.textContent = CSS;
  document.head.appendChild(s);
}

/* ══════════════════════════════════════════════
   THEME
══════════════════════════════════════════════ */
const TEAL   = '#5eead4';
const GREEN  = '#4ade80';
const AMBER  = '#fbbf24';
const RED    = '#f87171';
const INDIGO = '#818cf8';
const BLUE   = '#38bdf8';
const ROSE   = '#fb7185';
const PURPLE = '#8B5CF6';


const scoreColor = s => +s >= 75 ? GREEN : +s >= 55 ? AMBER : RED;

/* ══════════════════════════════════════════════
   ANIMATED COUNT
══════════════════════════════════════════════ */
function AnimCount({ to, suffix = '', duration = 1000 }) {
  const [v, setV] = useState(0);
  const t0 = useRef(null);
  useEffect(() => {
    t0.current = null;
    const run = ts => {
      if (!t0.current) t0.current = ts;
      const p = Math.min((ts - t0.current) / duration, 1);
      setV(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  }, [to, duration]);
  return <>{v}{suffix}</>;
}

/* ══════════════════════════════════════════════
   ANIMATED PROGRESS BAR
══════════════════════════════════════════════ */
function ProgressBar({ value, color, delay = 0 }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(Math.min(value, 100)), 300 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div style={{ height:6, background:'rgba(255,255,255,.05)', borderRadius:99, overflow:'hidden' }}>
      <div style={{
        height:'100%', borderRadius:99,
        width:`${w}%`,
        background:`linear-gradient(90deg,${color}70,${color})`,
        boxShadow:`0 0 10px ${color}50`,
        transition:'width 1.2s cubic-bezier(.22,1,.36,1)',
      }} />
    </div>
  );
}

/* ══════════════════════════════════════════════
   SECTION LABEL
══════════════════════════════════════════════ */
function SectionLabel({ children, color = TEAL }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
      <div style={{ width:3, height:14, background:color, borderRadius:99, boxShadow:`0 0 8px ${color}` }} />
      <span style={{ fontSize:11, fontWeight:600, color:'#475569', letterSpacing:'.8px', textTransform:'uppercase' }}>{children}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════
   CUSTOM TOOLTIP
══════════════════════════════════════════════ */
const BarTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#0d1f35', border:'1px solid rgba(94,234,212,.2)', borderRadius:10, padding:'10px 14px', fontSize:12 }}>
      <div style={{ color:'#64748b', marginBottom:4, fontSize:11 }}>{label}</div>
      <div style={{ color:TEAL, fontWeight:700, fontSize:16, fontFamily:"'JetBrains Mono',monospace" }}>{payload[0].value} audits</div>
      {payload[1] && <div style={{ color:scoreColor(payload[1].value), fontSize:12, marginTop:2 }}>Score: {payload[1].value}%</div>}
    </div>
  );
};

/* ══════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════ */
export default function NationalDashboard({ endpoint = '/stats/national' }) {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiOk,   setApiOk]   = useState(null);

  useEffect(() => {
    injectStyles();
    load();
    return () => document.getElementById('nd2-styles')?.remove();
  }, []);

  const load = async () => {
  setLoading(true);
  try {
    const res = await API.get(endpoint);
    const raw = res.data;

    // Normalise les deux formats : /stats et /stats/national
    const normalized = raw?.global ? raw : {
      global: {
        total_reports:   raw?.total_reports   ?? raw?.total ?? 0,
        total_organisms: raw?.total_organisms ?? raw?.organismes ?? 0,
        with_rssi:       raw?.rssi_count      ?? raw?.avec_rssi  ?? 0,
        with_pssi:       raw?.pssi_count      ?? raw?.avec_pssi  ?? 0,
        pending_count:   raw?.pending_count   ?? 0,
        avg_score:       raw?.avg_score       ?? 0,
        validated_count: raw?.validated_count ?? 0,
      },
      sectors:           raw?.sectors          ?? [],
      auditsByYear:      raw?.auditsByYear      ?? [],
      complexIndicators: raw?.complexIndicators ?? {},
    };

    if (normalized.global) { setStats(normalized); setApiOk(true); }
    else { setApiOk(false); setStats(null); }
  } catch { setApiOk(false); setStats(null); }
  finally { setLoading(false); }
};

  if (loading) return (
    <div className="nd2-root" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', flexDirection:'column', gap:16 }}>
      <div style={{ width:40, height:40, border:`2px solid rgba(94,234,212,.1)`, borderTop:`2px solid ${TEAL}`, borderRadius:'50%', animation:'nd-spin 1s linear infinite' }} />
      <p style={{ color:'#334155', fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>Chargement...</p>
    </div>
  );

  if (!stats) return (
    <div className="nd2-root" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>📊</div>
        <p style={{ color:'#334155', fontSize:13, marginBottom:16 }}>Aucune donnée disponible</p>
        <button onClick={load} style={{ padding:'9px 22px', background:`${TEAL}18`, color:TEAL, border:`1px solid ${TEAL}28`, borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif" }}>🔄 Actualiser</button>
      </div>
    </div>
  );

  const g    = stats.global            || {};
  const sect = stats.sectors           || [];
  const yrs  = stats.auditsByYear      || [];
  const cx   = stats.complexIndicators || {};

  const total     = +g.total_reports   || 0;
  const pending   = +g.pending_count   || 0;
  const withRssi  = +g.with_rssi       || 0;
  const withPssi  = +g.with_pssi       || 0;
  const organisms = +g.total_organisms || 0;

  const rssiAndPssi     = +cx.rssi_and_pssi      || 0;
  const financeNoPssi   = +cx.finance_no_pssi     || 0;
  const rssiNotAudited  = +cx.rssi_not_audited_2y || 0;

  const categories = [
    { name: 'Gouvernance', score: cx.cat_gouvernance || 72, icon: '🏛️' },
    { name: 'Continuité', score: cx.cat_continuite || 65, icon: '🔄' },
    { name: 'Actifs', score: cx.cat_actifs || 58, icon: '📦' },
    { name: 'Sécurité Technique', score: cx.cat_technique || 82, icon: '🛡️' },
    { name: 'Sauvegarde', score: cx.cat_sauvegarde || 75, icon: '💾' },
    { name: 'Data Center', score: cx.cat_dc || 88, icon: '🏢' },
    { name: 'Conformité', score: cx.cat_conformite || 70, icon: '✅' },
  ];

  /* Donut data — RSSI vs PSSI */
  const donutData = [
    { name:'Avec RSSI',      value:withRssi,          fill:TEAL   },
    { name:'Sans RSSI',      value:total - withRssi,  fill:'rgba(94,234,212,.1)' },
  ];
  const donutDataPssi = [
    { name:'Avec PSSI',      value:withPssi,          fill:INDIGO },
    { name:'Sans PSSI',      value:total - withPssi,  fill:'rgba(129,140,248,.1)' },
  ];

  return (
    <div className="nd2-root" style={{ color:'#e2e8f0', paddingBottom:32 }}>

      {/* ── HEADER ── */}
      <div className="nd2-a1" style={{ marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
        <div>
          <div style={{ fontSize:10, color:'#334155', letterSpacing:'.8px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", marginBottom:5 }}>ANCS · Audit SSI 2026</div>
          <h1 style={{ fontSize:24, fontWeight:700, color:'#f1f5f9' }}>Tableau de bord national</h1>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, fontFamily:"'JetBrains Mono',monospace", color: apiOk ? GREEN : AMBER }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background: apiOk ? GREEN : AMBER, animation:'nd-pulse 2s ease-in-out infinite' }} />
          {apiOk ? 'API connectée' : 'Hors ligne'}
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { icon:'🏢', val:organisms, label:'Organismes',      color:TEAL,   cls:'nd2-a1' },
          { icon:'📄', val:total,     label:'Rapports total',  color:BLUE,   cls:'nd2-a2' },
          { icon:'🔐', val:withRssi,  label:'Avec RSSI',       color:GREEN,  cls:'nd2-a3' },
          { icon:'📋', val:withPssi,  label:'Avec PSSI',       color:INDIGO, cls:'nd2-a4' },
        ].map(({ icon, val, label, color, cls }) => (
          <div key={label} className={`nd2-card nd2-kpi ${cls}`} style={{ padding:'20px 18px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, background:`radial-gradient(circle at 75% 25%, ${color}0a 0%, transparent 55%)`, pointerEvents:'none' }} />
            <div style={{ fontSize:22, marginBottom:10 }}>{icon}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:30, fontWeight:700, color, lineHeight:1, marginBottom:5 }}>
              <AnimCount to={val} />
            </div>
            <div style={{ fontSize:11, color:'#475569', fontWeight:500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── INDICATEURS SIMPLES ── */}
      <div className="nd2-card nd2-a5" style={{ padding:'22px 24px', marginBottom:16 }}>
        <SectionLabel color={TEAL}>Indicateurs simples</SectionLabel>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>

          {/* RSSI rate */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:12, color:'#64748b' }}>Taux RSSI déployé</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:GREEN, fontSize:13 }}>
                {total ? Math.round((withRssi/total)*100) : 0}%
              </span>
            </div>
            <ProgressBar value={total ? (withRssi/total)*100 : 0} color={GREEN} delay={0} />
            <div style={{ fontSize:11, color:'#334155', marginTop:6 }}>{withRssi} sur {total} organismes</div>
          </div>

          {/* PSSI rate */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:12, color:'#64748b' }}>Taux PSSI adoptée</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:INDIGO, fontSize:13 }}>
                {total ? Math.round((withPssi/total)*100) : 0}%
              </span>
            </div>
            <ProgressBar value={total ? (withPssi/total)*100 : 0} color={INDIGO} delay={100} />
            <div style={{ fontSize:11, color:'#334155', marginTop:6 }}>{withPssi} sur {total} organismes</div>
          </div>

          {/* Pending rate */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:12, color:'#64748b' }}>Rapports en attente</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:AMBER, fontSize:13 }}>
                {total ? Math.round((pending/total)*100) : 0}%
              </span>
            </div>
            <ProgressBar value={total ? (pending/total)*100 : 0} color={AMBER} delay={200} />
            <div style={{ fontSize:11, color:'#334155', marginTop:6 }}>{pending} rapport{pending > 1 ? 's' : ''} à traiter</div>
          </div>
        </div>
      </div>

      {/* ── 7 CATÉGORIES DE SÉCURITÉ ── */}
      <div className="nd2-card nd2-a5" style={{ padding:'22px 24px', marginBottom:16 }}>
        <SectionLabel color={PURPLE}>7 Catégories d'Analyse SSI</SectionLabel>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:10 }}>
          {categories.map((cat, i) => (
            <div key={cat.name} style={{ textAlign:'center', padding:'12px 8px', background:'rgba(255,255,255,.02)', borderRadius:12, border:'1px solid rgba(255,255,255,.05)' }}>
              <div style={{ fontSize:20, marginBottom:8 }}>{cat.icon}</div>
              <div style={{ fontSize:9, color:'#475569', fontWeight:600, textTransform:'uppercase', marginBottom:6, height:24, display:'flex', alignItems:'center', justifyContent:'center' }}>{cat.name}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:16, fontWeight:700, color:scoreColor(cat.score), marginBottom:6 }}>{cat.score}%</div>
              <ProgressBar value={cat.score} color={scoreColor(cat.score)} delay={i*50} />
            </div>
          ))}
        </div>
      </div>

      {/* ── INDICATEURS COMPLEXES ── */}
      <div className="nd2-a6" style={{ marginBottom:16 }}>
        <div className="nd2-card" style={{ padding:'22px 24px' }}>
          <SectionLabel color={ROSE}>Indicateurs complexes</SectionLabel>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>

            {/* RSSI AND PSSI */}
            <div className="nd2-complex-card" style={{ background:`${GREEN}08`, border:`1px solid ${GREEN}18` }}>
              <div style={{ fontSize:22, marginBottom:10 }}>✅</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:32, fontWeight:700, color:GREEN, marginBottom:4 }}>
                <AnimCount to={rssiAndPssi} />
              </div>
              <div style={{ fontSize:12, color:'#64748b', lineHeight:1.5 }}>Organismes avec</div>
              <div style={{ fontSize:12, color:GREEN, fontWeight:600 }}>RSSI <span style={{ color:'#334155' }}>ET</span> PSSI</div>
              <div style={{ marginTop:10 }}>
                <ProgressBar value={total ? (rssiAndPssi/total)*100 : 0} color={GREEN} delay={300} />
                <div style={{ fontSize:10, color:'#334155', marginTop:4 }}>{total ? Math.round((rssiAndPssi/total)*100) : 0}% des organismes</div>
              </div>
            </div>

            {/* Finance WITHOUT PSSI */}
            <div className="nd2-complex-card" style={{ background:`${AMBER}08`, border:`1px solid ${AMBER}18` }}>
              <div style={{ fontSize:22, marginBottom:10 }}>⚠️</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:32, fontWeight:700, color:AMBER, marginBottom:4 }}>
                <AnimCount to={financeNoPssi} />
              </div>
              <div style={{ fontSize:12, color:'#64748b', lineHeight:1.5 }}>Organismes Finance</div>
              <div style={{ fontSize:12, color:AMBER, fontWeight:600 }}>SANS PSSI</div>
              <div style={{ marginTop:10 }}>
                <ProgressBar value={total ? (financeNoPssi/total)*100 : 0} color={AMBER} delay={400} />
                <div style={{ fontSize:10, color:'#334155', marginTop:4 }}>Secteur Finance à risque</div>
              </div>
            </div>

            {/* RSSI but not audited 2y */}
            <div className="nd2-complex-card" style={{ background:`${RED}08`, border:`1px solid ${RED}18` }}>
              <div style={{ fontSize:22, marginBottom:10 }}>🔴</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:32, fontWeight:700, color:RED, marginBottom:4 }}>
                <AnimCount to={rssiNotAudited} />
              </div>
              <div style={{ fontSize:12, color:'#64748b', lineHeight:1.5 }}>Avec RSSI mais</div>
              <div style={{ fontSize:12, color:RED, fontWeight:600 }}>NON AUDITÉS (+2 ans)</div>
              <div style={{ marginTop:10 }}>
                <ProgressBar value={total ? (rssiNotAudited/total)*100 : 0} color={RED} delay={500} />
                <div style={{ fontSize:10, color:'#334155', marginTop:4 }}>Nécessitent un audit urgent</div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── CHARTS ROW ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:16, marginBottom:16 }}>

        {/* Audits par année */}
        <div className="nd2-card nd2-a7" style={{ padding:'22px 24px' }}>
          <SectionLabel color={BLUE}>Évolution des audits par année</SectionLabel>
          {yrs.length === 0 ? (
            <div style={{ height:220, display:'flex', alignItems:'center', justifyContent:'center', color:'#334155', fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>Pas encore de données</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={yrs} margin={{ top:5, right:5, bottom:5, left:-20 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize:11, fill:'#475569', fontFamily:"'JetBrains Mono',monospace" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:10, fill:'#334155' }} axisLine={false} tickLine={false} />
                <Tooltip content={<BarTip />} cursor={{ fill:'rgba(255,255,255,.03)' }} />
                <Bar dataKey="total" radius={[6,6,0,0]}>
                  {yrs.map((_, i) => <Cell key={i} fill={TEAL} opacity={0.8} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Score par secteur */}
        <div className="nd2-card nd2-a7" style={{ padding:'22px 24px' }}>
          <SectionLabel color={INDIGO}>Score moyen par secteur</SectionLabel>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {sect.length === 0 ? (
              <p style={{ color:'#334155', fontSize:12 }}>Aucun secteur</p>
            ) : sect.map((s, i) => {
              const score = +s.avg_score || 0;
              const color = scoreColor(score);
              return (
                <div key={s.sector}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:color, boxShadow:`0 0 6px ${color}` }} />
                      <span style={{ fontSize:12, color:'#cbd5e1' }}>{s.sector}</span>
                      <span style={{ fontSize:10, color:'#334155', fontFamily:"'JetBrains Mono',monospace" }}>({s.total})</span>
                    </div>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color, fontSize:13 }}>{Math.round(score)}%</span>
                  </div>
                  <ProgressBar value={score} color={color} delay={i*80} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── DONUT ROW ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

        {/* RSSI donut */}
        <div className="nd2-card nd2-a8" style={{ padding:'22px 24px' }}>
          <SectionLabel color={TEAL}>Répartition RSSI</SectionLabel>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {donutData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v} organismes`]} contentStyle={{ background:'#0d1f35', border:'1px solid rgba(94,234,212,.2)', borderRadius:10, fontSize:12 }} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color:'#64748b', fontSize:11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* PSSI donut */}
        <div className="nd2-card nd2-a8" style={{ padding:'22px 24px' }}>
          <SectionLabel color={INDIGO}>Répartition PSSI</SectionLabel>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={donutDataPssi} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {donutDataPssi.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v} organismes`]} contentStyle={{ background:'#0d1f35', border:'1px solid rgba(129,140,248,.2)', borderRadius:10, fontSize:12 }} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color:'#64748b', fontSize:11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* Footer */}
      <div style={{ marginTop:28, textAlign:'center', fontSize:10, color:'#1e293b', letterSpacing:'.4px', fontFamily:"'JetBrains Mono',monospace" }}>
        ANCS · Agence Nationale de la Cybersécurité · Tunisie © 2026
      </div>
    </div>
  );
}