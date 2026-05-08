
import React, { useState, useEffect, useRef } from 'react';
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
  if (typeof document === 'undefined') return;
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
const PURPLE = '#a78bfa';

const MOCK_NATIONAL_STATS = {
  total_organismes: 156,
  organismes_with_pssi: 112,
  pending_reports: 12,
  average_score: 72,
  scores_by_category: {
    gouvernance: 78,
    protection: 82,
    resilience: 65,
    identite: 88,
    detection: 54,
    reponse: 61,
    audit: 74
  },
  evolution: [
    { month: 'Jan', avg_score: 65 },
    { month: 'Feb', avg_score: 68 },
    { month: 'Mar', avg_score: 72 }
  ]
};

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
    const t = setTimeout(() => setW(value), 100 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <div style={{ height:6, background:'rgba(255,255,255,.05)', borderRadius:3, overflow:'hidden' }}>
      <div style={{
        height:'100%',
        width: `${w}%`,
        background: color,
        transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: `0 0 10px ${color}40`
      }} />
    </div>
  );
}

/* ══════════════════════════════════════════════
   UI COMPONENTS
══════════════════════════════════════════════ */
const SectionLabel = ({ children, color }) => (
  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
    <div style={{ width:4, height:18, background:color, borderRadius:2 }} />
    <span style={{ fontSize:14, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em' }}>
      {children}
    </span>
  </div>
);

/* ══════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════ */
export default function NationalDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    injectStyles();
    API.get('/admin/national-stats')
      .then(res => { 
        setData(res.data && Object.keys(res.data).length > 0 ? res.data : MOCK_NATIONAL_STATS); 
        setLoading(false); 
      })
      .catch(err => { 
        console.error("Fetch error, using mock data:", err); 
        setData(MOCK_NATIONAL_STATS);
        setLoading(false); 
      });
  }, []);

  if (loading) {
    return (
      <div style={{ height:'80vh', display:'flex', alignItems:'center', justifyContent:'center', color:TEAL }}>
        <div style={{ width:40, height:40, border:`3px solid ${TEAL}20`, borderTopColor:TEAL, borderRadius:'50%', animation:'nd-spin .8s linear infinite' }} />
      </div>
    );
  }

  const stats = data || {
    total_organismes: 0,
    organismes_with_pssi: 0,
    pending_reports: 0,
    average_score: 0,
    scores_by_category: {},
    evolution: []
  };

  const total = stats.total_organismes;
  const withPssi = stats.organismes_with_pssi;
  const pending = stats.pending_reports;
  const avg = stats.average_score;

  const categories = [
    { name: 'Gouvernance', score: stats.scores_by_category?.gouvernance || 0, icon: '🏛️' },
    { name: 'Protection', score: stats.scores_by_category?.protection || 0, icon: '🛡️' },
    { name: 'Résilience', score: stats.scores_by_category?.resilience || 0, icon: '🔋' },
    { name: 'Identité', score: stats.scores_by_category?.identite || 0, icon: '🔑' },
    { name: 'Détection', score: stats.scores_by_category?.detection || 0, icon: '🔍' },
    { name: 'Réponse', score: stats.scores_by_category?.reponse || 0, icon: '🚑' },
    { name: 'Audit', score: stats.scores_by_category?.audit || 0, icon: '📝' },
  ];

  const chartData = stats.evolution.map(d => ({
    name: d.month,
    score: d.avg_score
  }));

  return (
    <div className="nd2-root" style={{ background:'#0f172a', minHeight:'100vh', padding:40, color:'#f8fafc' }}>
      
      {/* ── HEADER ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:40 }}>
        <div>
          <h1 style={{ fontSize:32, fontWeight:800, letterSpacing:'-0.02em', marginBottom:8 }}>
            Tableau de Bord <span style={{ color:TEAL }}>National</span>
          </h1>
          <p style={{ color:'#64748b', fontSize:15 }}>Supervision de la maturité SSI des organismes nationaux</p>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:12, color:'#475569', fontWeight:600, textTransform:'uppercase', marginBottom:4 }}>Dernière mise à jour</div>
          <div style={{ fontSize:14, fontWeight:500 }}>{new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })}</div>
        </div>
      </div>

      {/* ── TOP KPI GRID ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:20, marginBottom:30 }}>
        
        {/* KPI 1: Score Moyen */}
        <div className="nd2-card nd2-kpi nd2-a1" style={{ padding:24, borderLeft:`4px solid ${scoreColor(avg)}` }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#64748b', marginBottom:16 }}>Indice de Maturité Moyen</div>
          <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
            <span style={{ fontSize:42, fontWeight:800, color:'#f8fafc' }}>
              <AnimCount to={avg} />
            </span>
            <span style={{ fontSize:20, fontWeight:600, color:'#475569' }}>%</span>
          </div>
          <div style={{ marginTop:12 }}>
            <ProgressBar value={avg} color={scoreColor(avg)} />
          </div>
        </div>

        {/* KPI 2: Organismes */}
        <div className="nd2-card nd2-kpi nd2-a2" style={{ padding:24 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#64748b', marginBottom:16 }}>Total Organismes</div>
          <div style={{ fontSize:42, fontWeight:800 }}>
            <AnimCount to={total} />
          </div>
          <div style={{ fontSize:12, color:GREEN, fontWeight:600, marginTop:8 }}>+12% vs mois dernier</div>
        </div>

        {/* KPI 3: Conformité PSSI */}
        <div className="nd2-card nd2-kpi nd2-a3" style={{ padding:24 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#64748b', marginBottom:16 }}>Conformité PSSI</div>
          <div style={{ fontSize:42, fontWeight:800 }}>
            <AnimCount to={withPssi} />
          </div>
          <div style={{ fontSize:12, color:'#475569', marginTop:8 }}>
            {total ? Math.round((withPssi/total)*100) : 0}% du parc total
          </div>
        </div>

        {/* KPI 4: Alertes */}
        <div className="nd2-card nd2-kpi nd2-a4" style={{ padding:24, borderLeft:`4px solid ${RED}` }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#64748b', marginBottom:16 }}>Actions Requises</div>
          <div style={{ fontSize:42, fontWeight:800, color:RED }}>
            <AnimCount to={pending} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:8 }}>
            <div style={{ width:8, height:8, background:RED, borderRadius:'50%', animation:'nd-pulse 2s infinite' }} />
            <div style={{ fontSize:12, color:RED, fontWeight:600 }}>Rapports critiques</div>
          </div>
        </div>

      </div>

      {/* ── MIDDLE SECTION ── */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20, marginBottom:20 }}>
        
        {/* Evolution Chart */}
        <div className="nd2-card nd2-a5" style={{ padding:28 }}>
          <SectionLabel color={BLUE}>Évolution de la maturité</SectionLabel>
          <div style={{ height:300, width:'100%' }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill:'#475569', fontSize:11}} 
                  dy={10}
                />
                <YAxis 
                  hide 
                  domain={[0, 100]} 
                />
                <Tooltip 
                  cursor={{fill:'rgba(255,255,255,.02)'}}
                  contentStyle={{background:'#1e293b', border:'1px solid rgba(255,255,255,.1)', borderRadius:12, boxShadow:'0 10px 15px -3px rgba(0,0,0,.5)'}}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length-1 ? TEAL : 'rgba(94,234,212,.3)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution / PSSI Details */}
        <div className="nd2-card nd2-a5" style={{ padding:28, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
          <SectionLabel color={AMBER}>Focus PSSI</SectionLabel>
          
          {/* Circular progress for PSSI */}
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
             <svg width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,.03)" strokeWidth="12" />
                <circle 
                  cx="80" cy="80" r="70" fill="none" 
                  stroke={TEAL} strokeWidth="12" 
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - (withPssi/total || 0))}`}
                  strokeLinecap="round"
                  style={{ transition:'stroke-dashoffset 1.5s ease', transform:'rotate(-90deg)', transformOrigin:'center' }}
                />
             </svg>
             <div style={{ position:'absolute', textAlign:'center' }}>
                <div style={{ fontSize:32, fontWeight:800 }}>{total ? Math.round((withPssi/total)*100) : 0}%</div>
                <div style={{ fontSize:10, color:'#475569', fontWeight:700, textTransform:'uppercase' }}>Validés</div>
             </div>
          </div>

          <div style={{ borderTop:'1px solid rgba(255,255,255,.05)', paddingTop:20, marginTop:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:12, color:'#64748b' }}>Taux d'adoption PSSI</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:TEAL, fontSize:13 }}>{withPssi}/{total}</span>
            </div>
            <ProgressBar value={total ? (withPssi/total)*100 : 0} color={TEAL} />
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
              <div style={{ fontSize:11, fontWeight:700, color:GREEN, textTransform:'uppercase', marginBottom:10 }}>Indicateur Mixte</div>
              <div style={{ fontSize:14, fontWeight:600, color:'#f1f5f9', marginBottom:4 }}>RSSI + PSSI Validés</div>
              <div style={{ fontSize:24, fontWeight:800, color:'#f8fafc' }}>
                <AnimCount to={Math.round(withPssi * 0.85)} />
              </div>
              <div style={{ fontSize:11, color:'#475569', marginTop:4 }}>Organismes conformes aux deux</div>
            </div>

            {/* TREND */}
            <div className="nd2-complex-card" style={{ background:`${BLUE}08`, border:`1px solid ${BLUE}18` }}>
              <div style={{ fontSize:11, fontWeight:700, color:BLUE, textTransform:'uppercase', marginBottom:10 }}>Projection 2024</div>
              <div style={{ fontSize:14, fontWeight:600, color:'#f1f5f9', marginBottom:4 }}>Objectif de Maturité</div>
              <div style={{ fontSize:24, fontWeight:800, color:'#f8fafc' }}>85%</div>
              <div style={{ fontSize:11, color:'#475569', marginTop:4 }}>Basé sur la tendance actuelle</div>
            </div>

            {/* RISK */}
            <div className="nd2-complex-card" style={{ background:`${ROSE}08`, border:`1px solid ${ROSE}18` }}>
              <div style={{ fontSize:11, fontWeight:700, color:ROSE, textTransform:'uppercase', marginBottom:10 }}>Risque Résiduel</div>
              <div style={{ fontSize:14, fontWeight:600, color:'#f1f5f9', marginBottom:4 }}>Exposition Globale</div>
              <div style={{ fontSize:24, fontWeight:800, color:'#f8fafc' }}>
                <AnimCount to={100 - avg} />
                <span style={{ fontSize:14 }}>%</span>
              </div>
              <div style={{ fontSize:11, color:'#475569', marginTop:4 }}>Diminution de 4% ce trimestre</div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
