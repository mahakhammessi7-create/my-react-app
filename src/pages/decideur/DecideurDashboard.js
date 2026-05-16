/* ═══════════════════════════════════════════════════════════════
   DecideurDashboard.jsx — VERSION SYNCHRONISÉE CORRIGÉE
   ✓ Miroir exact du tableau Responsable (sans charge d'étude)
   ✓ KPIs personnalisés en temps réel via window.storage
   ✓ Polling 5s
   ✓ Bouton déconnexion
   ✓ MIDDLE GRID :
       LEFT  → The Implementation Tracker (Roadmap)
       RIGHT → The Risk Heatmap (Prioritization)
   ✓ BOTTOM : The Maturity Radar (The "Big Picture")
   ✓ LOADING FIX : Affichage progressif dès qu'il y a des données
═══════════════════════════════════════════════════════════════ */

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip as ChartTooltip,
  Legend,
  DoughnutController,
  BarController,
} from "chart.js";
import { useDecideurData, extractKpiValue } from "../../hooks/useSharedDashboard";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  ChartTooltip,
  Legend,
  DoughnutController,
  BarController
);

/* ════════════════════════════════════════════════════════════
   STORAGE
════════════════════════════════════════════════════════════ */
const STORAGE_KEY_KPIS      = "responsable:published_kpis";
const STORAGE_KEY_REPORTS   = "responsable:reports_snapshot";
const STORAGE_KEY_DECISIONS = "decideur:decisions";

async function storageGet(key, shared = true) {
  try {
    const r = await window.storage?.get(key, shared);
    if (r?.value) return JSON.parse(r.value);
  } catch {}
  return null;
}
async function storageSet(key, data, shared = true) {
  try { await window.storage?.set(key, JSON.stringify(data), shared); return true; } catch {}
  return false;
}

/* ════════════════════════════════════════════════════════════
   THEME
════════════════════════════════════════════════════════════ */
export const T = {
  primary:"#10b981", secondary:"#3b82f6", warning:"#fbbf24",
  danger:"#f87171",  purple:"#8b5cf6",    cyan:"#06b6d4",
  textMain:"#e8fff6", textMuted:"#94a3b8",
  border:"rgba(255,255,255,0.07)",
};
export const CAT_LABELS = {
  maturite:"📊 Maturité & Conformité", gouvernance:"🏛️ Gouvernance",
  resilience:"🔄 Résilience & Continuité", risque:"🔴 Risques Techniques", pilotage:"📋 Pilotage",
};
export const CAT_COLORS = {
  maturite:"#10b981", gouvernance:"#3b82f6", resilience:"#fbbf24", risque:"#f87171", pilotage:"#8b5cf6",
};

/* ════════════════════════════════════════════════════════════
   COMPUTE STATS
════════════════════════════════════════════════════════════ */
export function computeStats(reports = []) {
  const total      = reports.length || 1;
  const validated  = reports.filter(r => r.status === "validé" || r.status === "clôturé").length;
  const assigned   = reports.filter(r => r.assigned_to || r.assigned_charge).length;
  const scores     = reports.map(r => r.compliance_score || 0).filter(s => s > 0);
  const avgScore   = scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : 0;
  const mats       = reports.map(r => r.maturity_level || 0).filter(m => m > 0);
  const avgMat     = mats.length ? mats.reduce((a,b)=>a+b,0)/mats.length : 0;
  const totalVulns = reports.reduce((s,r) => s+(r.critical_vulns_open||0), 0);
  const totalSrvs  = reports.reduce((s,r) => s+(r.total_servers||0), 0) || 1;
  const totalEol   = reports.reduce((s,r) => s+(r.eol_servers||0)+(r.eol_workstations||0), 0);
  const now        = new Date();
  const late       = reports.filter(r => r.deadline && new Date(r.deadline)<now && r.status!=="clôturé").length;
  const withRssi   = reports.filter(r=>r.has_rssi===true).length;
  const withPssi   = reports.filter(r=>r.has_pssi===true).length;
  const withMfa    = reports.filter(r=>r.mfa_enabled===true).length;
  const withBackup = reports.filter(r=>r.backup_tested===true).length;
  const withPca    = reports.filter(r=>r.has_pca===true).length;
  const staffVals  = reports.map(r=>r.staff_ssi_trained_pct||0).filter(v=>v>0);
  const avgStaff   = staffVals.length ? staffVals.reduce((a,b)=>a+b,0)/staffVals.length : 0;
  const tierVals   = reports.map(r=>r.dc_tier_level||0).filter(t=>t>0);
  const avgTier    = tierVals.length ? tierVals.reduce((a,b)=>a+b,0)/tierVals.length : 0;
  const patchVals  = reports.map(r=>r.patch_compliance_pct||0).filter(v=>v>0);
  const avgPatch   = patchVals.length ? patchVals.reduce((a,b)=>a+b,0)/patchVals.length : 0;
  const rejected   = reports.filter(r=>r.status==="rejeté").length;
  const compGap    = Math.max(0, 100 - avgScore);
  return {
    total, validés:validated, affectés:assigned, en_attente:total-assigned,
    score_moyen:parseFloat(avgScore.toFixed(1)), avg_score:parseFloat(avgScore.toFixed(1)),
    maturité_moyenne:parseFloat(avgMat.toFixed(1)), avg_maturity:parseFloat(avgMat.toFixed(1)),
    vulns_critiques:totalVulns, eol_assets:totalEol,
    retard:late, overdue_rate:parseFloat((late/total*100).toFixed(1)),
    assign_rate:Math.round(assigned/total*100), taux_avancement:Math.round(validated/total*100),
    compliance_gap:parseFloat(compGap.toFixed(1)), critical_ratio:parseFloat((totalVulns/totalSrvs).toFixed(2)),
    total_serveurs:totalSrvs,
    rssi_coverage:Math.round(withRssi/total*100), pssi_coverage:Math.round(withPssi/total*100),
    mfa_coverage:Math.round(withMfa/total*100),   backup_coverage:Math.round(withBackup/total*100),
    pca_coverage:Math.round(withPca/total*100),   staff_trained_pct:parseFloat(avgStaff.toFixed(1)),
    datacenter_tier_avg:parseFloat(avgTier.toFixed(1)), patch_compliance:parseFloat(avgPatch.toFixed(1)),
    rejection_rate:parseFloat((rejected/total*100).toFixed(1)),
  };
}

/* ════════════════════════════════════════════════════════════
   STYLES
════════════════════════════════════════════════════════════ */
export const S = {
  wrap:{color:T.textMain,fontFamily:"'DM Sans',system-ui,sans-serif",padding:"24px",background:"#0b1120",minHeight:"100vh"},
  cont:{display:"flex",flexDirection:"column",gap:20,maxWidth:1400,margin:"0 auto"},
  topBar:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,padding:"14px 20px",background:"rgba(16,185,129,0.05)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:14,maxWidth:1400,margin:"0 auto 20px"},
  kpiRow:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,minWidth:0},
  kpiCard:{background:"linear-gradient(145deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))",border:`1px solid ${T.border}`,borderRadius:16,padding:"20px",minWidth:0,overflow:"hidden"},
  kpiLabel:{fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",color:T.textMuted,fontWeight:600},
  kpiVal:{fontSize:32,fontWeight:800,fontFamily:"Syne,sans-serif",marginBottom:4},
  mid:{display:"grid",gridTemplateColumns:"260px 1fr 280px",gap:20,minHeight:420,minWidth:0},
  side:{background:"linear-gradient(145deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))",border:`1px solid ${T.border}`,borderRadius:20,padding:"22px",display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden"},
  center:{background:"linear-gradient(145deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))",border:`1px solid ${T.border}`,borderRadius:20,padding:"22px",minWidth:0,overflow:"hidden"},
  statRow:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${T.border}`},
  divider:{height:8,borderBottom:`1px solid ${T.border}`,marginBottom:8},
  botGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,minWidth:0},
  panel:{background:"linear-gradient(145deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))",border:`1px solid ${T.border}`,borderRadius:20,padding:"22px",overflow:"hidden",minWidth:0},
  ph:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10},
  pt:{margin:0,fontSize:14,fontWeight:700,color:T.textMain},
  pb:{fontSize:11,color:T.textMuted,background:"rgba(255,255,255,0.05)",padding:"4px 10px",borderRadius:20},
  list:{display:"flex",flexDirection:"column",gap:8,overflowY:"auto"},
  item:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:"rgba(255,255,255,0.03)",borderRadius:10,border:"1px solid rgba(255,255,255,0.05)"},
  catFilter:{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14,paddingBottom:12,borderBottom:`1px solid ${T.border}`},
  catBtn:{background:"rgba(255,255,255,0.04)",border:`1px solid ${T.border}`,borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:600,color:T.textMuted,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"},
  catBtnA:{background:"rgba(16,185,129,0.12)",borderColor:"rgba(16,185,129,0.4)",color:"#34d399"},
  logout:{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:10,color:"#f87171",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,padding:"8px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:6},
  syncBadge:{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:8,padding:"4px 10px",fontSize:10,fontWeight:700,color:"#22c55e"},
  tabRow:{display:"flex",gap:4,background:"rgba(255,255,255,0.04)",borderRadius:10,padding:4},
  tab:(active)=>({background:active?"rgba(16,185,129,0.15)":"none",border:active?"1px solid rgba(16,185,129,0.3)":"1px solid transparent",borderRadius:8,padding:"6px 14px",color:active?T.primary:T.textMuted,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}),
  input:{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,borderRadius:12,padding:"11px 16px",color:"#fff",fontSize:14,outline:"none",fontFamily:"'DM Sans',sans-serif"},
  textarea:{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,borderRadius:12,padding:"11px 16px",color:"#fff",fontSize:14,outline:"none",fontFamily:"'DM Sans',sans-serif",resize:"vertical",minHeight:140,lineHeight:1.6},
  select:{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,borderRadius:12,padding:"11px 16px",color:"#fff",fontSize:14,outline:"none",fontFamily:"'DM Sans',sans-serif"},
  label:{display:"block",fontSize:11,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8},
  btnPrimary:{background:`linear-gradient(135deg,${T.primary},${T.purple})`,border:"none",borderRadius:12,padding:"10px 24px",fontSize:13,fontWeight:700,color:"#f0fff8",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"},
  btnSecondary:{background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,borderRadius:12,padding:"10px 22px",fontSize:13,fontWeight:600,color:T.textMuted,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"},
  btnDanger:{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,color:"#f87171",fontSize:12,fontWeight:600,padding:"7px 14px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"},
};

/* ════════════════════════════════════════════════════════════
   SUB-COMPONENTS
════════════════════════════════════════════════════════════ */

/* ── The Implementation Tracker (Roadmap) ── */
export function ImplementationTracker({ stats, reports }) {
  const total = stats.total || 1;

  const phases = [
    {
      id: "p1",
      label: "Phase 1",
      title: "Fondations SSI",
      color: T.primary,
      icon: "🏗️",
      items: [
        { label: "Désignation RSSI",       done: stats.rssi_coverage,   target: 100 },
        { label: "PSSI formalisée",         done: stats.pssi_coverage,   target: 100 },
        { label: "MFA déployé",             done: stats.mfa_coverage,    target: 100 },
        { label: "Pare-feu opérationnel",   done: Math.round(reports.filter(r=>r.has_firewall).length/total*100), target: 100 },
        { label: "Antivirus couverture",    done: Math.round(reports.map(r=>r.antivirus_coverage_pct||0).reduce((a,b)=>a+b,0)/total), target: 100 },
      ],
    },
    {
      id: "p2",
      label: "Phase 2",
      title: "Renforcement",
      color: T.secondary,
      icon: "🔐",
      items: [
        { label: "Sauvegardes testées",     done: stats.backup_coverage,     target: 100 },
        { label: "PCA/PRA en place",        done: stats.pca_coverage,        target: 100 },
        { label: "Patch compliance",        done: stats.patch_compliance,    target: 100 },
        { label: "Pentest réalisé",         done: Math.round(reports.filter(r=>r.pentest_done).length/total*100), target: 100 },
        { label: "Segmentation réseau",     done: Math.round(reports.filter(r=>r.network_segmentation).length/total*100), target: 100 },
      ],
    },
    {
      id: "p3",
      label: "Phase 3",
      title: "Optimisation",
      color: T.purple,
      icon: "🚀",
      items: [
        { label: "ISO 27001 certifié",      done: Math.round(reports.filter(r=>r.iso27001_certified).length/total*100), target: 100 },
        { label: "SIEM déployé",            done: Math.round(reports.map(r=>r.siem_coverage_pct||0).reduce((a,b)=>a+b,0)/total), target: 100 },
        { label: "Personnel formé SSI",     done: stats.staff_trained_pct,   target: 100 },
        { label: "Audit interne",           done: Math.round(reports.filter(r=>r.audit_internal_done).length/total*100), target: 100 },
        { label: "Classification données",  done: Math.round(reports.filter(r=>r.data_classification).length/total*100), target: 100 },
      ],
    },
  ];

  const statusOf = (done) =>
    done >= 80 ? { label: "✓ Fait",        color: T.primary }
  : done >= 50 ? { label: "◑ En cours",   color: T.warning }
  :              { label: "○ Planifié",    color: "#64748b" };

  return (
    <div style={{ ...S.side, gap: 0 }}>
      <div style={S.ph}>
        <h3 style={S.pt}>🗺️ Implementation Tracker</h3>
        <span style={S.pb}>Roadmap SSI</span>
      </div>

      {/* Global progress bar */}
      {(() => {
        const allItems = phases.flatMap(p => p.items);
        const globalPct = Math.round(allItems.reduce((a,i) => a + i.done, 0) / allItems.length);
        const gc = globalPct >= 75 ? T.primary : globalPct >= 50 ? T.warning : T.danger;
        return (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:10, fontWeight:800, color:T.textMuted, textTransform:"uppercase", letterSpacing:".08em" }}>Avancement global</span>
              <span style={{ fontSize:14, fontWeight:900, color:gc, fontFamily:"Syne,sans-serif" }}>{globalPct}%</span>
            </div>
            <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:99, height:8, overflow:"hidden", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.3)" }}>
              <div style={{ height:"100%", width:`${globalPct}%`, background:`linear-gradient(90deg,${gc},${T.purple})`, borderRadius:99, transition:"width 1s", boxShadow: `0 0 10px ${gc}80` }} />
            </div>
          </div>
        );
      })()}

      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:14 }}>
        {phases.map(({ id, label, title, color, icon, items }) => {
          const phPct = Math.round(items.reduce((a,i) => a + i.done, 0) / items.length);
          const done  = items.filter(i => i.done >= 80).length;
          return (
            <div key={id} style={{ background:`linear-gradient(145deg, ${color}10, transparent)`, border:`1px solid ${color}22`, borderRadius:16, padding:"16px" }}>
              {/* Phase header */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:18, background:`${color}20`, padding:"8px", borderRadius:12 }}>{icon}</span>
                  <div>
                    <span style={{ fontSize:10, fontWeight:900, color, textTransform:"uppercase", letterSpacing:".1em" }}>{label}</span>
                    <div style={{ fontSize:14, fontWeight:800, color:T.textMain }}>{title}</div>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:22, fontWeight:900, color, fontFamily:"Syne,sans-serif", lineHeight:1 }}>{phPct}%</div>
                  <div style={{ fontSize:10, color:T.textMuted, marginTop:2, fontWeight: 600 }}>{done}/{items.length} faits</div>
                </div>
              </div>

              {/* Phase progress bar */}
              <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:99, height:4, marginBottom:14, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${phPct}%`, background:color, borderRadius:99, transition:"width 1s", boxShadow: `0 0 8px ${color}` }} />
              </div>

              {/* Items */}
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {items.map(({ label: lbl, done: val }) => {
                  const st = statusOf(val);
                  const valColor = val>=80 ? T.primary : val>=50 ? T.warning : T.danger;
                  return (
                    <div key={lbl} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px dashed rgba(255,255,255,0.05)` }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, flex: 1 }}>
                        <span style={{ fontSize:9, padding:"3px 8px", borderRadius:99, background:`${st.color}15`, color:st.color, fontWeight:800, textTransform:"uppercase", letterSpacing:".05em", minWidth:65, textAlign:"center" }}>{st.label}</span>
                        <span style={{ fontSize:12, color:T.textMain, fontWeight:500 }}>{lbl}</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:10, width: 100 }}>
                        <div style={{ flex: 1, background:"rgba(255,255,255,0.06)", height:4, borderRadius:99, overflow:"hidden" }}>
                           <div style={{ height:"100%", width:`${val}%`, background:valColor, borderRadius:99 }} />
                        </div>
                        <span style={{ fontSize:11, fontWeight:800, color:valColor, fontFamily:"Syne,sans-serif", width:32, textAlign:"right" }}>{val}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


/* ── Technical Health Metrics (SOC View) ── */
export function TechnicalHealthMetrics({ stats, reports }) {
  const total = stats.total || 1;

  /* ── Compute endpoint data from reports ── */
  const endpointData = useMemo(() => {
    const totalEndpoints = reports.reduce((s, r) => s + (r.total_endpoints || r.total_servers || 0), 0) || 1010;
    const avgAv = Math.round(reports.map(r => r.antivirus_coverage_pct || 0).reduce((a, b) => a + b, 0) / total);
    const protected_ = Math.round(totalEndpoints * avgAv / 100);
    const nonCompliant = totalEndpoints - protected_;
    return { total: totalEndpoints, protected: protected_, nonCompliant, pct: avgAv };
  }, [reports, total]);

  /* ── OS distribution from reports ── */
  const osData = useMemo(() => {
    const dist = {};
    reports.forEach(r => {
      if (r.os_distribution && typeof r.os_distribution === "object") {
        Object.entries(r.os_distribution).forEach(([os, cnt]) => {
          dist[os] = (dist[os] || 0) + cnt;
        });
      }
    });
    const hasReal = Object.keys(dist).length > 0;
    return hasReal
      ? Object.entries(dist).map(([label, count]) => ({
          label, count,
          eol: /rhel\s*[456]|centos\s*[678]|win.*2008|win.*2012/i.test(label),
          color: /rhel\s*[456]|centos\s*[678]|eol/i.test(label) ? T.danger
               : /ubuntu/i.test(label) ? T.secondary
               : /windows/i.test(label) ? T.purple
               : /rhel\s*8/i.test(label) ? T.primary
               : "#639922",
        })).sort((a, b) => b.count - a.count)
      : [
          { label:"RHEL 9",          count:42, color:T.primary, eol:false },
          { label:"RHEL 8",          count:28, color:T.primary, eol:false },
          { label:"Ubuntu 22 LTS",   count:18, color:T.secondary, eol:false },
          { label:"Win Server 2022", count:14, color:T.purple, eol:false },
          { label:"RHEL 6 (EOL)",    count: 3, color:T.danger, eol:true  },
        ];
  }, [reports]);

  const eolCount = osData.filter(d => d.eol).reduce((s, d) => s + d.count, 0);

  const pieData = [
    { name: "Protégés", value: endpointData.protected, color: T.primary },
    { name: "Non conformes", value: endpointData.nonCompliant, color: T.danger }
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20, height:"100%" }}>

      {/* ── Donut: Endpoint Compliance ── */}
      <div style={S.panel}>
        <div style={S.ph}>
          <h3 style={S.pt}>Endpoint compliance</h3>
          <span style={{ fontSize:11, padding:"3px 9px", borderRadius:99,
            background: endpointData.pct >= 95 ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
            color:       endpointData.pct >= 95 ? T.primary : T.danger, fontWeight:700 }}>
            {endpointData.pct}% OK
          </span>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:30 }}>
          {/* Donut */}
          <div style={{ position:"relative", width:160, height:160, flexShrink:0 }}>
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={58}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={6}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background:"#0f172a", border:`1px solid ${T.border}`, borderRadius:8 }} 
                  itemStyle={{ color:T.textMain }} 
                  formatter={(value) => [`${value} endpoints`]} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
                          alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
              <span style={{ fontSize:22, fontWeight:800, color:T.textMain, fontFamily:"Syne,sans-serif", lineHeight:1 }}>
                {endpointData.pct}%
              </span>
              <span style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:".07em" }}>compliant</span>
            </div>
          </div>

          {/* Stats */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:14 }}>
            {[
              { label:"Protégés",      val:endpointData.protected,   color:T.primary },
              { label:"Non conformes", val:endpointData.nonCompliant, color:T.danger  },
            ].map(({ label, val, color }) => (
              <div key={label}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:12, color:T.textMuted, display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ width:8, height:8, borderRadius:2, background:color, display:"inline-block", boxShadow:`0 0 8px ${color}80` }}/>
                    {label}
                  </span>
                  <span style={{ fontSize:12, fontWeight:700, color, fontFamily:"Syne,sans-serif" }}>{val}</span>
                </div>
                <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:99, height:4 }}>
                  <div style={{ width:`${Math.round(val/endpointData.total*100)}%`, height:"100%", background:color, borderRadius:99, boxShadow:`0 0 8px ${color}80` }}/>
                </div>
              </div>
            ))}
            {endpointData.nonCompliant > 0 && (
              <div style={{ padding:"7px 10px", background:"rgba(239,68,68,0.08)",
                border:"1px solid rgba(239,68,68,0.2)", borderRadius:8, display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:13, color:T.danger }}>⚠</span>
                <p style={{ margin:0, fontSize:11, color:T.danger, fontWeight:600 }}>
                  {endpointData.nonCompliant} endpoints sans protection — action requise
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bar: Server OS Lifecycle ── */}
      <div style={S.panel}>
        <div style={S.ph}>
          <h3 style={S.pt}>Server OS lifecycle</h3>
          {eolCount > 0 && (
            <span style={{ fontSize:11, padding:"3px 9px", borderRadius:99,
              background:"rgba(239,68,68,0.12)", color:T.danger, fontWeight:700 }}>
              {eolCount} obsolète{eolCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div style={{ position:"relative", width:"100%", height:220, minWidth:0, minHeight:0 }}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={osData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} tick={{ fill: T.textMuted, fontSize: 12 }} width={120} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                contentStyle={{ background:"#0f172a", border:`1px solid ${T.border}`, borderRadius:8 }} 
                formatter={(value, name, props) => {
                  const d = props.payload;
                  return [`${value} serveurs${d.eol ? " (EOL)" : ""}`, "Total"];
                }} 
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                {osData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {eolCount > 0 && (
          <div style={{ marginTop:10, padding:"8px 10px", background:"rgba(239,68,68,0.08)",
            border:"1px solid rgba(239,68,68,0.2)", borderRadius:8,
            display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:13, color:T.danger }}>⚠</span>
            <p style={{ margin:0, fontSize:11, color:T.danger, fontWeight:600 }}>
              {eolCount} serveur{eolCount>1?"s":""} en fin de support — migration immédiate requise
            </p>
          </div>
        )}
      </div>

    </div>
  );
}

/* ── The Maturity Radar (The "Big Picture") ── */
export function MaturityRadar({ stats, reports }) {
  const total = stats.total || 1;

  /* Rich 12-axis radar */
  const radarData = [
    { subject:"RSSI",          A:stats.rssi_coverage,              fullMark:100 },
    { subject:"PSSI",          A:stats.pssi_coverage,              fullMark:100 },
    { subject:"MFA",           A:stats.mfa_coverage,               fullMark:100 },
    { subject:"PCA/PRA",       A:stats.pca_coverage,               fullMark:100 },
    { subject:"Sauvegardes",   A:stats.backup_coverage,            fullMark:100 },
    { subject:"Patch",         A:stats.patch_compliance,           fullMark:100 },
    { subject:"Personnel",     A:stats.staff_trained_pct,          fullMark:100 },
    { subject:"Maturité",      A:(stats.avg_maturity/5)*100,       fullMark:100 },
    { subject:"Conformité",    A:stats.score_moyen,                fullMark:100 },
    { subject:"Pentest",       A:Math.round(reports.filter(r=>r.pentest_done).length/total*100),  fullMark:100 },
    { subject:"ISO 27001",     A:Math.round(reports.filter(r=>r.iso27001_certified).length/total*100), fullMark:100 },
    { subject:"SIEM",          A:Math.round(reports.map(r=>r.siem_coverage_pct||0).reduce((a,b)=>a+b,0)/total), fullMark:100 },
  ];

  /* Maturity band comparison (target vs actual) */
  const bandData = radarData.map(d => ({ ...d, Target:80 }));

  /* Per-domain scores for summary cards */
  const domains = [
    { label:"Gouvernance",    icon:"🏛️", color:T.secondary,
      score:Math.round([stats.rssi_coverage, stats.pssi_coverage,
        Math.round(reports.filter(r=>r.security_committee).length/total*100),
        Math.round(reports.filter(r=>r.gdpr_dpo_appointed).length/total*100),
      ].reduce((a,b)=>a+b,0)/4) },
    { label:"Technique",      icon:"🔐", color:T.danger,
      score:Math.round([stats.mfa_coverage, stats.patch_compliance,
        Math.round(reports.filter(r=>r.has_firewall).length/total*100),
        Math.round(reports.filter(r=>r.network_segmentation).length/total*100),
      ].reduce((a,b)=>a+b,0)/4) },
    { label:"Résilience",     icon:"🔄", color:T.warning,
      score:Math.round([stats.backup_coverage, stats.pca_coverage,
        Math.round(reports.filter(r=>r.vuln_scan_done).length/total*100),
        Math.round(reports.filter(r=>r.pentest_done).length/total*100),
      ].reduce((a,b)=>a+b,0)/4) },
    { label:"Humain",         icon:"👥", color:T.purple,
      score:Math.round([stats.staff_trained_pct,
        Math.round(reports.filter(r=>r.audit_internal_done).length/total*100),
        Math.round(reports.filter(r=>r.data_classification).length/total*100),
        Math.round(reports.filter(r=>r.iso27001_certified).length/total*100),
      ].reduce((a,b)=>a+b,0)/4) },
    { label:"Score global",   icon:"📊", color:T.primary,
      score:Math.round([stats.score_moyen, (stats.avg_maturity/5)*100,
        stats.taux_avancement, stats.assign_rate,
      ].reduce((a,b)=>a+b,0)/4) },
  ];

  /* Custom tooltip */
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    const c = d.A >= 75 ? T.primary : d.A >= 55 ? T.warning : T.danger;
    return (
      <div style={{ background:"#0f172a", border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 14px" }}>
        <div style={{ fontSize:12, fontWeight:700, color:T.textMain, marginBottom:4 }}>{d.subject}</div>
        <div style={{ fontSize:20, fontWeight:900, color:c, fontFamily:"Syne,sans-serif" }}>{d.A}%</div>
        <div style={{ fontSize:10, color:T.textMuted }}>Cible : 80%</div>
      </div>
    );
  };

  return (
    <div style={S.panel}>
      <div style={S.ph}>
        <h3 style={S.pt}>🌐 Maturity Radar — The Big Picture</h3>
        <span style={S.pb}>12 axes · {stats.total} organismes</span>
      </div>

      {/* Domain summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:20 }}>
        {domains.map(({ label, icon, color, score }) => {
          const sc = score >= 75 ? T.primary : score >= 55 ? T.warning : T.danger;
          return (
            <div key={label} style={{
              background:`${color}08`, border:`1px solid ${color}22`,
              borderRadius:12, padding:"12px 14px", textAlign:"center",
            }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
              <div style={{ fontSize:10, color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", marginBottom:4 }}>{label}</div>
              <div style={{ fontSize:26, fontWeight:900, color:sc, fontFamily:"Syne,sans-serif", lineHeight:1 }}>{score}<span style={{ fontSize:14 }}>%</span></div>
              {/* mini bar */}
              <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:99, height:4, marginTop:8, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${score}%`, background:sc, borderRadius:99 }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Radar + right panel */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 260px", gap:24, alignItems:"start" }}>
        {/* Radar */}
        <div style={{ height:380 }}>
          <ResponsiveContainer width="100%" height={380}>
            <RadarChart cx="50%" cy="50%" outerRadius="72%" data={bandData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill:T.textMuted, fontSize:11, fontWeight:600 }} />
              <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fill:T.textMuted, fontSize:9 }} tickCount={5} />
              {/* Target band */}
              <Radar name="Cible 80%" dataKey="Target" stroke="rgba(255,255,255,0.12)" fill="rgba(255,255,255,0.04)" strokeWidth={1} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
              {/* Actual */}
              <Radar name="Score réel" dataKey="A" stroke={T.primary} fill={T.primary} fillOpacity={0.22} strokeWidth={2.5} dot={{ r:3, fill:T.primary }} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Right: axis breakdown */}
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ fontSize:11, fontWeight:800, color:T.textMuted, textTransform:"uppercase", letterSpacing:".1em", marginBottom:4 }}>Détail des axes</div>
          {radarData.map(({ subject, A }) => {
            const val = Math.round(A);
            const c = val >= 80 ? T.primary : val >= 60 ? T.warning : T.danger;
            return (
              <div key={subject} style={{ display:"grid", gridTemplateColumns:"80px 1fr 40px", gap:10, alignItems:"center" }}>
                <span style={{ fontSize:10, color:T.textMuted, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{subject}</span>
                <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:99, height:5, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${val}%`, background:c, borderRadius:99 }} />
                </div>
                <span style={{ fontSize:11, fontWeight:800, color:c, textAlign:"right", fontFamily:"Syne,sans-serif" }}>{val}%</span>
              </div>
            );
          })}

          {/* Overall maturity level */}
          {(() => {
            const overall = Math.round(radarData.reduce((a,d)=>a+d.A,0)/radarData.length);
            const matLabel =
              overall >= 80 ? "Avancé"
            : overall >= 65 ? "Intermédiaire"
            : overall >= 45 ? "Basique"
            :                 "Initial";
            const mc = overall >= 80 ? T.primary : overall >= 65 ? T.warning : T.danger;
            return (
              <div style={{
                marginTop:8, padding:"12px 14px", background:`${mc}10`,
                border:`1px solid ${mc}30`, borderRadius:12, textAlign:"center",
              }}>
                <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:".1em", fontWeight:700, marginBottom:4 }}>Niveau de maturité</div>
                <div style={{ fontSize:22, fontWeight:900, color:mc, fontFamily:"Syne,sans-serif" }}>{overall}%</div>
                <div style={{ fontSize:11, color:mc, fontWeight:700, marginTop:2 }}>{matLabel}</div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════ */

export default function DecideurDashboard() {
  const navigate = useNavigate();

  const {
    sharedKpis,
    sharedReports,
    decisions,
    loading,
    saveDecision:    saveDecisionHook,
    updateDecisionStatus,
    deleteDecision:  deleteDecisionHook,
    refresh,
  } = useDecideurData();

  const [lastSync, setLastSync] = useState(null);
  const [selCat,   setSelCat]   = useState("all");
  const [tab,      setTab]      = useState("dashboard");
  const [decView,  setDecView]  = useState("list");
  const [decForm,  setDecForm]  = useState({
    title: "", type: "Décision", content: "", priority: "Normale", kpi_ref: ""
  });
  const [toast, setToast] = useState(null);

  const reports = useMemo(() =>
    sharedReports.map(r => ({
      ...r,
      status:           r.status || "déposé",
      compliance_score: r.compliance_score || 0,
      company_name:     r.company_name || r.organism_name || "—",
      sector:           r.sector || r.organism_sector || "—",
    })),
    [sharedReports]
  );

  useEffect(() => {
    if (!loading) setLastSync(new Date().toLocaleTimeString("fr-FR"));
  }, [loading, sharedKpis, sharedReports]);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(null),3000); };

  const stats = useMemo(() => computeStats(reports), [reports]);

  const trendData = useMemo(() => ["Jan","Fév","Mar","Avr","Mai","Juin"].map((m,i)=>({
    month:m,
    clôturés:Math.round(stats.validés*(i+1)/6),
    affectés:Math.round(stats.affectés*(i+1)/6),
    score:Math.max(40, Math.round(stats.score_moyen-10+i*3)),
    vulns:Math.max(0, Math.round(stats.vulns_critiques-i*2)),
  })), [stats]);

  const filteredKpis = selCat==="all" ? sharedKpis : sharedKpis.filter(k=>k.category===selCat);

  /* Decisions */
  const saveDecision = async () => {
    if (!decForm.title.trim() || !decForm.content.trim()) return;
    const saved = await saveDecisionHook(decForm);
    if (saved) {
      setDecForm({ title: "", type: "Décision", content: "", priority: "Normale", kpi_ref: "" });
      setDecView("list");
      showToast("Décision enregistrée !");
    }
  };

  const publishDec = async (id) => {
    await updateDecisionStatus(id, "Publié");
    showToast("Décision publiée !");
  };
  const deleteDec = async (id) => {
    await deleteDecisionHook(id);
  };

  const handleLogout = useCallback(() => {
    try { localStorage.clear(); } catch {}
    navigate("/decideur-login");
  }, [navigate]);

  if(loading && sharedReports.length === 0 && sharedKpis.length === 0 && decisions.length === 0) return (
    <div style={{...S.wrap,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <p style={{color:T.textMuted}}>Chargement des données…</p>
    </div>
  );

  const tt = (key) => ({...S.tab(tab===key), onClick:()=>setTab(key)});

  return (
    <div style={S.wrap}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(1.3)}}
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        select option{background:#0f172a;color:#fff;}
        @media (max-width: 1024px) {
          [data-middle-grid] { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ─── TOP BAR ─── */}
      <div style={S.topBar}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 8px #22c55e",animation:"pulse 2s ease-in-out infinite",flexShrink:0}}/>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:T.textMain}}>Tableau de Bord Décideur · Intelligence Nationale SSI</div>
            <div style={{fontSize:11,color:T.textMuted}}>{reports.length} rapports synchronisés · MAJ {lastSync||"—"}</div>
          </div>
          <span style={S.syncBadge}>● TEMPS RÉEL</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={S.tabRow}>
            <button style={tt("dashboard")} onClick={() => setTab("dashboard")}>📊 Tableau de bord</button>
            <button style={tt("kpis")} onClick={() => setTab("kpis")}>📤 KPIs publiés ({sharedKpis.length})</button>
            <button style={tt("decisions")} onClick={() => setTab("decisions")}>📜 Décisions ({decisions.length})</button>
          </div>
          <button style={S.logout} onClick={handleLogout}>🔌 Déconnexion</button>
        </div>
      </div>

      <div style={S.cont}>

        {/* ══════════════════════════════════════════
            TAB DASHBOARD
        ══════════════════════════════════════════ */}
        {tab==="dashboard" && <>

          {/* KPI cards */}
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
                      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={stroke} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={stroke} stopOpacity={0}/>
                      </linearGradient></defs>
                      <Area type="monotone" dataKey={dk} stroke={stroke} fill={`url(#${gid})`} strokeWidth={2} dot={false} isAnimationActive={false}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>

          {/* ════════════════════════════════════════════════════════
              MIDDLE GRID
              LEFT  → Implementation Tracker (Roadmap)
              RIGHT → Risk Heatmap (Prioritization)
          ════════════════════════════════════════════════════════ */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }} data-middle-grid>
            <ImplementationTracker stats={stats} reports={reports} />
            <TechnicalHealthMetrics stats={stats} reports={reports} />
          </div>

          {/* Bottom panels */}
          <div style={S.botGrid}>
            {/* Maturity Radar (The "Big Picture") — full width */}
          </div>

          {/* ════════════════════════════════════════════════════════
              BOTTOM : The Maturity Radar (The "Big Picture")
          ════════════════════════════════════════════════════════ */}
          <MaturityRadar stats={stats} reports={reports} />


        </>}

        {/* ══════════════════════════════════════════
            TAB KPIs
        ══════════════════════════════════════════ */}
        {tab==="kpis" && (
          <div style={S.panel}>
            <div style={S.ph}>
              <h3 style={S.pt}>📤 Indicateurs publiés par le Responsable</h3>
              <div style={{display:"flex",gap:8}}>
                <button onClick={refresh} style={{...S.catBtn, cursor:"pointer"}}>↻ Actualiser</button>
                <span style={S.pb}>{sharedKpis.length} indicateurs</span>
              </div>
            </div>
            <div style={S.catFilter}>
              <button onClick={()=>setSelCat("all")} style={{...S.catBtn,...(selCat==="all"?S.catBtnA:{})}}>Tous</button>
              {Object.entries(CAT_LABELS).map(([k,l])=>(
                <button key={k} onClick={()=>setSelCat(k)} style={{...S.catBtn,...(selCat===k?S.catBtnA:{})}}>{l}</button>
              ))}
            </div>
            {filteredKpis.length===0
              ? <div style={{textAlign:"center",padding:"60px 20px",color:T.textMuted}}>Aucun indicateur{selCat!=="all"?" dans cette catégorie":""} publié.</div>
              : <>
                  {(()=>{
                    const vals=filteredKpis.map(k=>extractKpiValue(k)).filter(v=>v>0);
                    const s=vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):0;
                    const c=s>=75?T.primary:s>=55?T.warning:T.danger;
                    return (
                      <div style={{textAlign:"center",padding:"24px",marginBottom:20,background:`${c}10`,border:`2px solid ${c}`,borderRadius:16}}>
                        <div style={{fontSize:11,color:T.textMuted,textTransform:"uppercase",letterSpacing:".15em",marginBottom:8}}>Score synthétique</div>
                        <div style={{fontSize:56,fontWeight:900,color:c,fontFamily:"Syne,sans-serif",lineHeight:1}}>{s}%</div>
                        <div style={{fontSize:13,color:T.textMuted,marginTop:8}}>{s>=75?"Performance excellente":s>=55?"Performance satisfaisante":"Performance à améliorer"}</div>
                      </div>
                    );
                  })()}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
                    {filteredKpis.map((kpi,i)=>{
                      const val=extractKpiValue(kpi);
                      const thr=parseFloat(kpi.threshold??50);
                      const cc=CAT_COLORS[kpi.category]||T.primary;
                      const bc=val>=thr?T.primary:val>=thr*0.7?T.warning:T.danger;
                      return (
                        <div key={kpi.id||i} style={{background:`${cc}08`,border:`1px solid ${cc}25`,borderRadius:14,padding:"18px 20px"}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                            <span style={{fontSize:10,textTransform:"uppercase",color:cc,fontWeight:700,background:`${cc}15`,padding:"3px 8px",borderRadius:6}}>{CAT_LABELS[kpi.category]?.split(" ")[0]} · {kpi.type||"Indicateur"}</span>
                            <span style={{fontSize:10,color:T.textMuted}}>{kpi.published_at?new Date(kpi.published_at).toLocaleDateString("fr-FR"):"—"}</span>
                          </div>
                          <div style={{fontSize:13,fontWeight:600,color:T.textMain,marginBottom:10,lineHeight:1.4}}>{kpi.name}</div>
                          <div style={{fontSize:38,fontWeight:900,color:bc,fontFamily:"Syne,sans-serif",lineHeight:1,marginBottom:10}}>
                            {val.toFixed(1)}<span style={{fontSize:16,color:T.textMuted,marginLeft:4}}>{kpi.unit||(kpi.type==="Taux (%)"?"%":"")}</span>
                          </div>
                          <div style={{background:"rgba(255,255,255,0.06)",borderRadius:99,height:6,marginBottom:8}}>
                            <div style={{height:"100%",width:`${Math.min(val,100)}%`,background:bc,borderRadius:99,transition:"width .8s"}}/>
                          </div>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.textMuted}}>
                            <span>Seuil : {thr}%</span>
                            <span style={{color:bc,fontWeight:700}}>{val>=thr?"✓ Atteint":"⚠ En dessous"}</span>
                          </div>
                          {kpi.formula&&<p style={{fontSize:10,color:T.textMuted,fontFamily:"monospace",marginTop:8,opacity:.7}}>{kpi.formula}</p>}
                        </div>
                      );
                    })}
                  </div>
                </>
            }
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB DECISIONS
        ══════════════════════════════════════════ */}
        {tab==="decisions" && (
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            {toast&&(
              <div style={{position:"fixed",bottom:32,right:32,zIndex:999,background:"#0f172a",border:"1px solid rgba(34,197,94,.4)",borderRadius:16,padding:"14px 20px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 12px 40px rgba(0,0,0,.5)"}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:T.primary}}/>
                <span style={{fontSize:13,fontWeight:600,color:T.textMain}}>{toast}</span>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <h2 style={{margin:0,fontSize:20,fontWeight:800,color:T.textMain,fontFamily:"Syne,sans-serif"}}>Décisions & Lois</h2>
                <p style={{margin:"4px 0 0",fontSize:13,color:T.textMuted}}>Rédigez des décisions stratégiques basées sur les indicateurs SSI.</p>
              </div>
              <button style={S.btnPrimary} onClick={()=>setDecView(decView==="new"?"list":"new")}>
                {decView==="new"?"← Retour":"+ Nouvelle décision"}
              </button>
            </div>

            {decView==="new"&&(
              <div style={S.panel}>
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  <div>
                    <label style={S.label}>Titre *</label>
                    <input style={S.input} placeholder="Ex: Obligation de désigner un RSSI..." value={decForm.title} onChange={e=>setDecForm(f=>({...f,title:e.target.value}))}/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
                    <div>
                      <label style={S.label}>Type</label>
                      <select style={S.select} value={decForm.type} onChange={e=>setDecForm(f=>({...f,type:e.target.value}))}>
                        {["Décision","Loi","Circulaire","Directive"].map(o=><option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={S.label}>Priorité</label>
                      <select style={S.select} value={decForm.priority} onChange={e=>setDecForm(f=>({...f,priority:e.target.value}))}>
                        {["Urgente","Haute","Normale"].map(o=><option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={S.label}>Indicateur lié</label>
                      <select style={S.select} value={decForm.kpi_ref} onChange={e=>setDecForm(f=>({...f,kpi_ref:e.target.value}))}>
                        <option value="">— Aucun —</option>
                        {sharedKpis.map(k=><option key={k.id} value={k.id}>{k.name} — {extractKpiValue(k).toFixed(1)}%</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={S.label}>Contenu *</label>
                    <textarea style={S.textarea} placeholder="Rédigez ici le texte officiel…" value={decForm.content} onChange={e=>setDecForm(f=>({...f,content:e.target.value}))}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"flex-end",gap:12}}>
                    <button style={S.btnSecondary} onClick={()=>setDecView("list")}>Annuler</button>
                    <button style={S.btnPrimary} onClick={saveDecision}>💾 Enregistrer</button>
                  </div>
                </div>
              </div>
            )}

            {decView==="list"&&(
              decisions.length===0
                ? <div style={{textAlign:"center",padding:"60px 20px",background:"rgba(255,255,255,.02)",border:`1px dashed ${T.border}`,borderRadius:16}}>
                    <div style={{fontSize:40,marginBottom:12,opacity:.4}}>📜</div>
                    <div style={{fontSize:14,color:T.textMuted}}>Aucune décision rédigée</div>
                  </div>
                : <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    {decisions.map(dec=>{
                      const kpi=sharedKpis.find(k=>k.id===dec.kpi_ref);
                      const pc={Urgente:T.danger,Haute:T.warning,Normale:T.secondary}[dec.priority]||T.secondary;
                      return (
                        <div key={dec.id} style={{background:"rgba(255,255,255,.02)",border:`1px solid ${T.border}`,borderLeft:`3px solid ${pc}`,borderRadius:16,padding:"20px 24px"}}>
                          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
                            {[dec.type,dec.priority,dec.status].map((b,i)=>(
                              <span key={i} style={{fontSize:10,padding:"3px 9px",borderRadius:99,background:"rgba(255,255,255,.06)",color:T.textMuted,fontWeight:700}}>{b}</span>
                            ))}
                            <span style={{marginLeft:"auto",fontSize:11,color:T.textMuted}}>
                              {dec.created_at?new Date(dec.created_at).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}):""}
                            </span>
                          </div>
                          <h3 style={{fontSize:15,fontWeight:700,color:T.textMain,marginBottom:8,lineHeight:1.4}}>{dec.title}</h3>
                          {kpi&&(
                            <div style={{display:"inline-flex",alignItems:"center",gap:8,background:`${T.secondary}10`,border:`1px solid ${T.secondary}25`,borderRadius:8,padding:"5px 12px",marginBottom:10}}>
                              <span style={{fontSize:11,color:T.textMuted}}>Indicateur lié :</span>
                              <span style={{fontSize:12,fontWeight:700,color:T.secondary}}>{kpi.name}</span>
                              <span style={{fontSize:12,fontWeight:800,color:T.primary,fontFamily:"monospace"}}>{extractKpiValue(kpi).toFixed(1)}%</span>
                            </div>
                          )}
                          <p style={{fontSize:13,color:T.textMuted,lineHeight:1.7,marginBottom:14}}>
                            {dec.content?.length>300?dec.content.slice(0,300)+"…":dec.content}
                          </p>
                          <div style={{display:"flex",gap:10}}>
                            {dec.status==="Brouillon"&&<button style={S.btnPrimary} onClick={()=>publishDec(dec.id)}>📢 Publier</button>}
                            <button style={S.btnDanger} onClick={()=>deleteDec(dec.id)}>× Supprimer</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}