import React, { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { 
  T, S, computeStats, 
  ImplementationTracker, 
  TechnicalHealthMetrics, 
  MaturityRadar 
} from '../decideur/DecideurDashboard';

// Dummy trend data for KPI cards mini-charts
const trendData = [
  { day: 'L', score: 60, vulns: 12, clôturés: 2 },
  { day: 'M', score: 62, vulns: 10, clôturés: 4 },
  { day: 'M', score: 65, vulns: 9,  clôturés: 6 },
  { day: 'J', score: 64, vulns: 9,  clôturés: 6 },
  { day: 'V', score: 68, vulns: 7,  clôturés: 8 },
  { day: 'S', score: 71, vulns: 5,  clôturés: 10 },
  { day: 'D', score: 73, vulns: 3,  clôturés: 12 },
];

export const ResponsableOperationnelView = ({ reports = [], chargesEtude = [] }) => {
  const stats = useMemo(() => computeStats(reports), [reports]);

  // Operational stats specific to Responsable
  const totalReports = stats.total || 0;
  const enAttente = stats.en_attente || 0;
  const tauxAffectation = stats.assign_rate || 0;
  // stats.affectés holds assigned count, chargesEtude is the array of agents.
  const chargeMoyenne = chargesEtude.length ? (stats.affectés / chargesEtude.length).toFixed(1) : 0;
  const rejetes = stats.rejection_rate || 0;

  // Group by agent
  const agentWorkloads = useMemo(() => {
    return chargesEtude.map(agent => {
      const agentReports = reports.filter(r => r.assigned_to === agent);
      const total = agentReports.length;
      const closed = agentReports.filter(r => ['validé', 'clôturé'].includes(r.status)).length;
      const progress = total === 0 ? 0 : Math.round((closed / total) * 100);
      return { agent, total, closed, progress };
    }).sort((a, b) => b.total - a.total);
  }, [reports, chargesEtude]);

  // Group by compliance
  const complianceStats = useMemo(() => {
    const conformes = reports.filter(r => r.compliance_score >= 75).length;
    const moyens = reports.filter(r => r.compliance_score >= 55 && r.compliance_score < 75).length;
    const critiques = reports.filter(r => r.compliance_score < 55).length;
    const totalWithScore = conformes + moyens + critiques;
    return { conformes, moyens, critiques, total: totalWithScore || 1 };
  }, [reports]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── RESPONSABLE EXCLUSIVE ROW: Operational Management ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: -10, marginTop: 10 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.textMain, letterSpacing: ".05em", textTransform: "uppercase" }}>
          ⚙️ Suivi des rapports et charge d'étude
        </h3>
        <span style={{ fontSize: 11, background: "rgba(16,185,129,0.15)", color: "#34d399", padding: "4px 12px", borderRadius: 20, fontWeight: 700 }}>
          Vue Exclusive Responsable
        </span>
      </div>
      
      <div style={{ ...S.kpiRow, gridTemplateColumns: "repeat(5, 1fr)" }}>
        {[
          { label: "Total Rapports",    value: totalReports,           color: "#f8fafc", stroke: "#94a3b8" },
          { label: "En Attente QA",     value: enAttente,              color: enAttente>0?T.warning:T.primary, stroke: enAttente>0?T.warning:T.primary },
          { label: "Taux Affectation",  value: `${tauxAffectation}%`,  color: T.secondary, stroke: T.secondary },
          { label: "Charge Moyenne",    value: chargeMoyenne,          color: T.purple, stroke: T.purple },
          { label: "Taux de Rejet",     value: `${rejetes}%`,          color: rejetes>10?T.danger:T.primary, stroke: rejetes>10?T.danger:T.primary },
        ].map(({ label, value, color, stroke }) => (
          <div key={label} style={{...S.kpiCard, background: "rgba(16,185,129,0.03)", border: `1px solid ${stroke}40` }}>
            <div style={{marginBottom:8}}><span style={{...S.kpiLabel, color: stroke}}>{label}</span></div>
            <div style={{...S.kpiVal, color, fontSize: 26}}>{value}</div>
            <div style={{ height:3, marginTop:8, background: `linear-gradient(90deg, ${stroke}, transparent)`, borderRadius: 99 }} />
          </div>
        ))}
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* PANEL: Charge d'étude */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 20 }}>
          <h4 style={{ margin: "0 0 16px 0", fontSize: 13, fontWeight: 700, color: "var(--txt3)", textTransform: "uppercase", letterSpacing: ".1em" }}>
            👥 Répartition par Chargé d'Étude
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 300, overflowY: "auto" }}>
            {agentWorkloads.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--txt3)", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>Aucun chargé d'étude trouvé.</div>
            ) : agentWorkloads.map(w => (
              <div key={w.agent} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(59,130,246,0.15)", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                  {w.agent.substring(0,2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>{w.agent}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 99 }}>
                      <div style={{ width: `${w.progress}%`, height: "100%", background: w.progress === 100 ? "#10b981" : "#3b82f6", borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 11, color: "var(--txt3)", fontWeight: 600, width: 35 }}>{w.progress}%</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc" }}>{w.total}</div>
                  <div style={{ fontSize: 10, color: "var(--txt3)" }}>assignés</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PANEL: Conformité */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 20 }}>
          <h4 style={{ margin: "0 0 16px 0", fontSize: 13, fontWeight: 700, color: "var(--txt3)", textTransform: "uppercase", letterSpacing: ".1em" }}>
            🎯 Analyse de Conformité
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
              <div style={{ fontSize: 42, fontWeight: 800, color: "#10b981", lineHeight: 1 }}>{Math.round((complianceStats.conformes / complianceStats.total) * 100)}%</div>
              <div style={{ paddingBottom: 6, fontSize: 12, color: "var(--txt3)", lineHeight: 1.4 }}>des rapports sont considérés comme <strong style={{color:"#e2e8f0"}}>Conformes</strong> (score ≥ 75%).</div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Conformes (≥ 75)", count: complianceStats.conformes, color: "#10b981", bg: "rgba(16,185,129,0.15)" },
                { label: "À Surveiller (55-74)", count: complianceStats.moyens, color: "#fbbf24", bg: "rgba(245,158,11,0.15)" },
                { label: "Critiques (< 55)", count: complianceStats.critiques, color: "#f87171", bg: "rgba(239,68,68,0.15)" },
              ].map(c => (
                <div key={c.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.color }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{c.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: c.color }}>{c.count}</span>
                    <span style={{ fontSize: 11, color: "var(--txt3)", width: 40, textAlign: "right" }}>
                      {Math.round((c.count / complianceStats.total) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ResponsableDecideurView = ({ reports = [] }) => {
  const stats = useMemo(() => computeStats(reports), [reports]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: -10, marginTop: 10 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.textMain, letterSpacing: ".05em", textTransform: "uppercase" }}>
          📊 Tableau de Bord Décideur
        </h3>
        <span style={{ fontSize: 11, background: "rgba(59,130,246,0.15)", color: "#60a5fa", padding: "4px 12px", borderRadius: 20, fontWeight: 700 }}>
          Aperçu Décideur
        </span>
      </div>

      {/* ── DECIDEUR MAIN KPI ROW ── */}
      <div style={S.kpiRow}>
        {[
          {label:"Score Conformité",        value:`${stats.score_moyen}%`,      color:stats.score_moyen>=75?T.primary:stats.score_moyen>=55?T.warning:T.danger, dk:"score",    stroke:T.primary,   gid:"gP"},
          {label:"Maturité",                value:`${stats.maturité_moyenne}/5`,color:T.purple,                                                                                dk:"score",    stroke:T.purple,    gid:"gPu"},
          {label:"Vulnérabilités Critiques",value:stats.vulns_critiques,        color:stats.vulns_critiques>0?T.danger:T.primary,                                              dk:"vulns",    stroke:T.danger,    gid:"gD"},
          {label:"Taux d'Avancement",       value:`${stats.taux_avancement}%`,  color:T.secondary,                                                                             dk:"clôturés", stroke:T.secondary, gid:"gB"},
        ].map(({label,value,color,dk,stroke,gid})=>(
          <div key={label} style={S.kpiCard}>
            <div style={{marginBottom:8}}><span style={S.kpiLabel}>{label}</span></div>
            <div style={{...S.kpiVal,color}}>{value}</div>
            <div style={{height:50,marginTop:8,overflow:"hidden",minWidth:0,minHeight:0}}>
              <ResponsiveContainer width="100%" height={50}>
                <AreaChart data={trendData} margin={{top:2,right:0,left:0,bottom:2}}>
                  <defs><linearGradient id={`r-${gid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={stroke} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={stroke} stopOpacity={0}/>
                  </linearGradient></defs>
                  <Area type="monotone" dataKey={dk} stroke={stroke} fill={`url(#r-${gid})`} strokeWidth={2} dot={false} isAnimationActive={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* ── DECIDEUR MIDDLE GRID ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <ImplementationTracker stats={stats} reports={reports} />
        <TechnicalHealthMetrics stats={stats} reports={reports} />
      </div>

      {/* ── DECIDEUR RADAR ── */}
      <MaturityRadar stats={stats} reports={reports} />
    </div>
  );
};