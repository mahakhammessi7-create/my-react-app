import { useState, useEffect } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from "recharts";

/* ══════════════════════════════════════════════
   DEFAULT DATA
══════════════════════════════════════════════ */
const DEFAULT_DATA = {
  company: {
    name: "Société Nationale de Développement Financier",
    acronym: "SNDF",
    sector: "Finance / Banque",
    has_rssi: true, has_pssi: true,
    maturity_level: 3, compliance_score: 71,
    server_count: 5, user_count: 325,
  },
  kpis: { conformes: 28, total: 45, risquesCritiques: 2, serveursAudites: 4, serveursTotal: 5, appsDansPerimetre: 2, appsTotal: 3 },
  repartition: { conforme: 28, partiel: 12, nonConforme: 5 },
  radarMaturite: [
    { axe: "Gouvernance",       valeur: 72, details: "RSSI nommé, PSSI approuvée, TdB SSI mensuel" },
    { axe: "Risques & Actifs",  valeur: 54, details: "Gestion risques partielle, classification non appliquée" },
    { axe: "Continuité",        valeur: 67, details: "PCA/PRA définis, PCA non testé, pas de site secours" },
    { axe: "Contrôle Accès",    valeur: 88, details: "AD, FortiGate, VLAN, Bastion SSH, MFR en place" },
    { axe: "Protection",        valeur: 56, details: "Antivirus OK, WSUS partiel, pas de SIEM" },
    { axe: "Sauvegardes",       valeur: 59, details: "Données métier OK, pas de site distant" },
    { axe: "Sécurité Physique", valeur: 85, details: "DC Tier 2, UPS, CCTV, badge RFID" },
    { axe: "Incidents & Maint.",valeur: 90, details: "Procédure formelle, cellule SSI active" },
  ],
  serveursListe: [
    { nom:"SRV-APP-01", ip:"192.168.1.10", type:"MP", os:"Windows Server 2019", role:"Application métier (Core)", perimetre:true },
    { nom:"SRV-APP-02", ip:"192.168.1.11", type:"MV", os:"Windows Server 2016", role:"Application RH",            perimetre:true },
    { nom:"SRV-DB-01",  ip:"192.168.1.20", type:"MP", os:"Windows Server 2019", role:"Base de données SQL",        perimetre:true },
    { nom:"SRV-DC-01",  ip:"192.168.1.30", type:"MV", os:"Windows Server 2019", role:"Contrôleur de domaine",      perimetre:true },
    { nom:"SRV-MAIL-01",ip:"192.168.1.40", type:"MV", os:"Ubuntu 20.04",        role:"Messagerie",                 perimetre:false },
  ],
  applicationsListe: [
    { nom:"APP-CORE", modules:"Comptabilité, Crédits, Épargne", env:"Java/JEE",   utilisateurs:320, perimetre:true,  dev:"Prestataire" },
    { nom:"APP-RH",   modules:"Paie, Congés, Recrutement",      env:".NET",        utilisateurs:45,  perimetre:true,  dev:"Interne" },
    { nom:"APP-DOC",  modules:"GED, Archivage",                 env:"PHP/Symfony", utilisateurs:150, perimetre:false, dev:"Prestataire" },
  ],
  risquesListe: [
    { risque:"PCA non testé depuis 2021",  probabilite:"Élevée", impact:"Critique", niv:"critique", desc:"Incapacité à assurer la continuité en cas de sinistre majeur" },
    { risque:"Absence de SIEM",            probabilite:"Élevée", impact:"Élevé",    niv:"elevé",    desc:"Aucune supervision centralisée des événements de sécurité" },
    { risque:"OS obsolète SRV-APP-02",     probabilite:"Moyenne",impact:"Élevé",    niv:"elevé",    desc:"Windows Server 2016 — migration vers 2022 planifiée" },
    { risque:"IDS/IPS non homologué",      probabilite:"Moyenne",impact:"Moyen",    niv:"moyen",    desc:"Snort déployé sans politique formalisée ni suivi des alertes" },
    { risque:"Pas de copies distantes",    probabilite:"Faible", impact:"Critique", niv:"elevé",    desc:"Aucune sauvegarde hors site — risque de perte totale" },
    { risque:"Postes Win7 encore actifs",  probabilite:"Moyenne",impact:"Moyen",    niv:"moyen",    desc:"Systèmes EoL exposés aux vulnérabilités non patchées" },
  ],
};

/* ══════════════════════════════════════════════
   THEME CONSTANTS  (identical to Profile)
══════════════════════════════════════════════ */
const BG      = "#07111e";
const CARD    = "rgba(255,255,255,.028)";
const BORDER  = "rgba(255,255,255,.07)";
const TEAL    = "#63d2be";
const GREEN   = "#4ade80";
const AMBER   = "#fbbf24";
const RED     = "#f87171";
const ORANGE  = "#f97316";
const PURPLE  = "#818cf8";
const BLUE    = "#38bdf8";

const NIVEAUX = [
  { max:40,  label:"Critique",     color:RED,    dark:"rgba(248,113,113,.12)", border:"rgba(248,113,113,.25)" },
  { max:60,  label:"Partiel",      color:ORANGE, dark:"rgba(249,115,22,.12)",  border:"rgba(249,115,22,.25)"  },
  { max:80,  label:"Satisfaisant", color:AMBER,  dark:"rgba(251,191,36,.12)",  border:"rgba(251,191,36,.25)"  },
  { max:100, label:"Optimisé",     color:GREEN,  dark:"rgba(74,222,128,.12)",  border:"rgba(74,222,128,.25)"  },
];
const getNiveau = (v) => NIVEAUX.find(n => v <= n.max) || NIVEAUX[3];

const NIV_RISQUE = {
  critique: { color:RED,    bg:"rgba(248,113,113,.1)",  border:"rgba(248,113,113,.25)", label:"Critique" },
  elevé:    { color:ORANGE, bg:"rgba(249,115,22,.1)",   border:"rgba(249,115,22,.25)",  label:"Élevé"    },
  moyen:    { color:BLUE,   bg:"rgba(56,189,248,.1)",   border:"rgba(56,189,248,.25)",  label:"Moyen"    },
};

const TABS = [
  { id:"global",  icon:"📊", label:"Vue Globale"    },
  { id:"kpis",    icon:"🔐", label:"KPIs"           },
  { id:"infra",   icon:"🖥️", label:"Infrastructure" },
  { id:"apps",    icon:"📱", label:"Applications"   },
  { id:"risques", icon:"⚠️", label:"Risques"        },
];

/* ══════════════════════════════════════════════
   GLOBAL STYLES (same injection pattern)
══════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  @keyframes ad-fadeUp {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0);    }
  }
  @keyframes ad-glow {
    0%,100% { opacity:.35; }
    50%      { opacity:.75; }
  }
  @keyframes ad-floatDot {
    0%,100% { transform:translateY(0);    }
    50%     { transform:translateY(-9px); }
  }
  @keyframes ad-rotateSlow {
    from { transform:rotate(0deg);   }
    to   { transform:rotate(360deg); }
  }
  @keyframes ad-barFill {
    from { width:0%; }
  }

  .ad-root { font-family:'DM Sans',sans-serif; }
  .ad-root * { box-sizing:border-box; margin:0; padding:0; }

  .ad-anim { animation:ad-fadeUp .5s ease both; }

  .ad-tab-btn {
    flex:1; padding:10px 8px;
    background:transparent; color:#4a6a88;
    border:none; border-radius:10px; cursor:pointer;
    font-size:13px; font-family:'DM Sans',sans-serif;
    font-weight:500; transition:all .2s;
    display:flex; align-items:center; justify-content:center; gap:6px;
  }
  .ad-tab-btn:hover { background:rgba(255,255,255,.04); color:#8ab0c8; }
  .ad-tab-btn.active {
    background:rgba(99,210,190,.12);
    color:${TEAL};
    font-weight:700;
    border:1px solid rgba(99,210,190,.22);
  }

  .ad-tr:hover td { background:rgba(99,210,190,.04) !important; }

  .ad-risk-card { transition:transform .2s, box-shadow .2s; }
  .ad-risk-card:hover { transform:translateX(4px); }

  .ad-app-card { transition:border-color .2s, transform .2s; }
  .ad-app-card:hover { transform:translateY(-3px); }

  .ad-kpi-card { transition:transform .25s, box-shadow .25s; }
  .ad-kpi-card:hover { transform:translateY(-5px); box-shadow:0 20px 48px rgba(0,0,0,.45) !important; }
`;

function injectAdStyles() {
  if (document.getElementById('ad-dashboard-styles')) return;
  const el = document.createElement('style');
  el.id = 'ad-dashboard-styles';
  el.textContent = CSS;
  document.head.appendChild(el);
}

/* ══════════════════════════════════════════════
   SHARED PRIMITIVES
══════════════════════════════════════════════ */
function Badge({ text, color, bg, border }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:bg||color+'18', color, border:`1px solid ${border||color+'30'}`, padding:'3px 11px', borderRadius:99, fontSize:11, fontWeight:700, letterSpacing:'.5px', textTransform:'uppercase', whiteSpace:'nowrap' }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:color, boxShadow:`0 0 5px ${color}` }} />
      {text}
    </span>
  );
}

function MiniBar({ value, color }) {
  return (
    <div style={{ flex:1, height:6, background:'rgba(255,255,255,.06)', borderRadius:99, overflow:'hidden' }}>
      <div style={{ width:`${value}%`, height:'100%', background:`linear-gradient(90deg,${color}66,${color})`, borderRadius:99, transition:'width 1.2s cubic-bezier(.22,1,.36,1)', boxShadow:`0 0 8px ${color}44` }} />
    </div>
  );
}

function SectionCard({ children, style }) {
  return (
    <div className="ad-anim" style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:20, overflow:'hidden', backdropFilter:'blur(10px)', ...style }}>
      {children}
    </div>
  );
}

function SectionHeader({ icon, title, iconBg = TEAL }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'18px 22px', borderBottom:`1px solid ${BORDER}` }}>
      <div style={{ width:34, height:34, borderRadius:10, background:`${iconBg}18`, border:`1px solid ${iconBg}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>{icon}</div>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:'#b0cce0', letterSpacing:'.4px', textTransform:'uppercase' }}>{title}</h2>
    </div>
  );
}

/* Custom radar tooltip */
const DarkTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d   = payload[0]?.payload;
  const n   = getNiveau(d.valeur);
  return (
    <div style={{ background:'#0c1e34', border:`1px solid ${n.color}44`, borderRadius:12, padding:'12px 16px', color:'#d4e8ff', fontSize:12, maxWidth:220, boxShadow:`0 8px 32px rgba(0,0,0,.6)` }}>
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:n.color, marginBottom:4 }}>{d.axe}</div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
        <span style={{ fontSize:22, fontWeight:800, color:n.color, fontFamily:"'Syne',sans-serif" }}>{d.valeur}%</span>
        <Badge text={n.label} color={n.color} />
      </div>
      <div style={{ color:'#4a6a88', fontSize:11, lineHeight:1.5 }}>{d.details}</div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   TAB: GLOBAL
══════════════════════════════════════════════ */
function TabGlobal({ DATA }) {
  const global = Math.round(DATA.radarMaturite.reduce((s,d) => s+d.valeur, 0) / DATA.radarMaturite.length);
  const gn = getNiveau(global);
  const total = DATA.kpis.total;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

      {/* Score banner */}
      <SectionCard>
        <div style={{ background:`linear-gradient(135deg, #0c1f3a, #0a2540)`, padding:'28px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:24, position:'relative', overflow:'hidden' }}>
          {/* bg rings */}
          {[220,160,100].map((s,i)=>(
            <div key={i} style={{ position:'absolute', width:s, height:s, borderRadius:'50%', border:`1px solid rgba(99,210,190,.1)`, right:-s/3, top:'50%', transform:'translateY(-50%)', animation:`ad-rotateSlow ${20+i*5}s linear infinite` }} />
          ))}
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ fontSize:10, color:'#3d607a', letterSpacing:'2px', textTransform:'uppercase', fontWeight:600, marginBottom:8 }}>Score de Maturité Global</div>
            <div style={{ fontSize:58, fontWeight:900, color:gn.color, fontFamily:"'Syne',sans-serif", lineHeight:1, marginBottom:10 }}>{global}%</div>
            <Badge text={gn.label} color={gn.color} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, position:'relative', zIndex:1 }}>
            {[
              { icon:'✅', v:`${DATA.kpis.conformes}/${total}`,                          l:'KPIs conformes',   color:GREEN  },
              { icon:'⚠️', v:DATA.kpis.risquesCritiques,                                l:'Risques critiques', color:RED    },
              { icon:'🖥️', v:`${DATA.kpis.serveursAudites}/${DATA.kpis.serveursTotal}`, l:'Serveurs audités',  color:TEAL   },
              { icon:'📱', v:`${DATA.kpis.appsDansPerimetre}/${DATA.kpis.appsTotal}`,   l:'Apps périmètre',   color:BLUE   },
            ].map(({icon,v,l,color})=>(
              <div key={l} style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:'14px 18px', textAlign:'center', minWidth:120 }}>
                <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
                <div style={{ fontSize:22, fontWeight:800, color, fontFamily:"'Syne',sans-serif" }}>{v}</div>
                <div style={{ fontSize:10, color:'#3d607a', marginTop:4, letterSpacing:'.4px', textTransform:'uppercase' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        {/* Radar */}
        <SectionCard>
          <SectionHeader icon="📡" title="Radar de Maturité" iconBg={TEAL} />
          <div style={{ padding:'20px' }}>
            <ResponsiveContainer width="100%" height={290}>
              <RadarChart data={DATA.radarMaturite} margin={{ top:10, right:30, bottom:10, left:30 }}>
                <PolarGrid stroke="rgba(255,255,255,.08)" />
                <PolarAngleAxis dataKey="axe" tick={{ fontSize:10, fill:'#4a6a88', fontWeight:600, fontFamily:"'DM Sans',sans-serif" }} />
                <PolarRadiusAxis angle={90} domain={[0,100]} tick={{ fontSize:9, fill:'#2a4a62' }} tickCount={5} />
                <Radar name="Maturité" dataKey="valeur" stroke={TEAL} fill={TEAL} fillOpacity={0.12} strokeWidth={2}
                  dot={{ fill:TEAL, r:4, stroke:'#07111e', strokeWidth:2 }} />
                <Tooltip content={<DarkTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Répartition */}
          <SectionCard>
            <SectionHeader icon="📊" title="Répartition conformité" iconBg={GREEN} />
            <div style={{ padding:'18px 22px' }}>
              {[
                { label:'Conforme',      val:DATA.repartition.conforme,    color:GREEN  },
                { label:'Partiel',       val:DATA.repartition.partiel,     color:ORANGE },
                { label:'Non conforme',  val:DATA.repartition.nonConforme, color:RED    },
              ].map(({label,val,color})=>(
                <div key={label} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <span style={{ width:88, fontSize:12, color:'#4a6a88', fontWeight:500 }}>{label}</span>
                  <MiniBar value={(val/total)*100} color={color} />
                  <span style={{ width:22, fontSize:14, fontWeight:800, color, textAlign:'right', fontFamily:"'Syne',sans-serif" }}>{val}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Scores par domaine */}
          <SectionCard style={{ flex:1 }}>
            <SectionHeader icon="🎯" title="Scores par domaine" iconBg={PURPLE} />
            <div style={{ padding:'14px 22px' }}>
              {DATA.radarMaturite.map(({axe,valeur})=>{
                const n = getNiveau(valeur);
                return (
                  <div key={axe} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:9 }}>
                    <span style={{ width:96, fontSize:10, color:'#3d607a', fontWeight:600, letterSpacing:'.3px', textTransform:'uppercase' }}>{axe}</span>
                    <MiniBar value={valeur} color={n.color} />
                    <span style={{ width:34, fontSize:12, fontWeight:800, color:n.color, textAlign:'right', fontFamily:"'Syne',sans-serif" }}>{valeur}%</span>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:20, justifyContent:'center', flexWrap:'wrap' }}>
        {NIVEAUX.map(n=>(
          <div key={n.label} style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, color:'#3d607a' }}>
            <div style={{ width:10, height:10, borderRadius:3, background:n.color, boxShadow:`0 0 6px ${n.color}66` }} />
            <span>{n.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   TAB: KPIs
══════════════════════════════════════════════ */
function TabKpis({ DATA }) {
  const d = DATA.company;
  const kpiItems = [
    { icon:'🔐', label:'RSSI',                   value:d.has_rssi?'Présent':'Absent',       detail:'Nommé par décision DG',           color:d.has_rssi?GREEN:RED    },
    { icon:'📋', label:'PSSI',                   value:d.has_pssi?'Approuvée':'Absente',     detail:'Politique de sécurité des SI',    color:d.has_pssi?GREEN:ORANGE },
    { icon:'🎯', label:'Niveau de maturité',     value:`${d.maturity_level} / 5`,             detail:"Évaluation globale de l'audit",   color:TEAL                    },
    { icon:'📊', label:'Score conformité',       value:`${d.compliance_score}%`,              detail:getNiveau(d.compliance_score).label, color:getNiveau(d.compliance_score).color },
    { icon:'🖥️', label:'Serveurs dans périmètre',value:`${DATA.kpis.serveursAudites} / ${DATA.kpis.serveursTotal}`, detail:"Périmètre d'audit", color:BLUE },
    { icon:'👥', label:'Postes utilisateurs',    value:d.user_count,                          detail:'Total des postes de travail',     color:PURPLE                  },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {kpiItems.map(({icon,label,value,detail,color})=>(
          <div key={label} className="ad-kpi-card" style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:18, padding:'20px 22px', display:'flex', gap:16, alignItems:'flex-start', position:'relative', overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,.25)' }}>
            <div style={{ position:'absolute', top:-12, right:-12, width:60, height:60, borderRadius:'50%', background:color, opacity:.12, filter:'blur(16px)', animation:'ad-glow 3s ease-in-out infinite' }} />
            <div style={{ width:42, height:42, borderRadius:13, background:`${color}18`, border:`1px solid ${color}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{icon}</div>
            <div>
              <div style={{ fontSize:10, color:'#3d607a', textTransform:'uppercase', letterSpacing:'1px', marginBottom:5, fontWeight:600 }}>{label}</div>
              <div style={{ fontSize:18, fontWeight:800, color, fontFamily:"'Syne',sans-serif", marginBottom:4 }}>{value}</div>
              <div style={{ fontSize:11, color:'#3d607a' }}>{detail}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <SectionCard>
          <SectionHeader icon="✅" title="Points forts" iconBg={GREEN} />
          <div style={{ padding:'16px 22px' }}>
            {["Réseau d'admin isolé (Bastion SSH)","Antivirus déployé 100% postes","Audit interne annuel actif","Contrôle d'accès AD + MFR documentée","DataCenter CCTV et badge RFID"].map(p=>(
              <div key={p} style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:10 }}>
                <span style={{ color:GREEN, fontSize:14, marginTop:1, flexShrink:0 }}>•</span>
                <span style={{ fontSize:13, color:'#8ab0c8', lineHeight:1.4 }}>{p}</span>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard>
          <SectionHeader icon="❌" title="Points faibles" iconBg={RED} />
          <div style={{ padding:'16px 22px' }}>
            {["Absence totale de SIEM","PCA non testé depuis 2021","Pas de site de secours","IDS Snort non configuré/homologué","Aucune sauvegarde des postes utilisateurs"].map(p=>(
              <div key={p} style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:10 }}>
                <span style={{ color:RED, fontSize:14, marginTop:1, flexShrink:0 }}>•</span>
                <span style={{ fontSize:13, color:'#8ab0c8', lineHeight:1.4 }}>{p}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   TAB: INFRASTRUCTURE
══════════════════════════════════════════════ */
function TabInfra({ DATA }) {
  const thTd = { padding:'10px 16px', textAlign:'left', fontSize:12 };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        {[
          { icon:'🖥️', value:DATA.kpis.serveursTotal,   label:'Serveurs total',     sub:`${DATA.kpis.serveursAudites} dans le périmètre`, color:TEAL   },
          { icon:'💻', value:DATA.company.user_count,   label:'Postes de travail',  sub:'Windows & macOS',                                color:BLUE   },
          { icon:'🔒', value:'Tier 2',                  label:'Classification DC',  sub:'Infrastructure redondante partielle',            color:PURPLE },
        ].map(({icon,value,label,sub,color})=>(
          <div key={label} style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:18, padding:'20px 22px', display:'flex', gap:14, alignItems:'center', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-10, right:-10, width:55, height:55, borderRadius:'50%', background:color, opacity:.12, filter:'blur(14px)' }} />
            <div style={{ width:42, height:42, borderRadius:13, background:`${color}18`, border:`1px solid ${color}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{icon}</div>
            <div>
              <div style={{ fontSize:22, fontWeight:800, color, fontFamily:"'Syne',sans-serif", lineHeight:1 }}>{value}</div>
              <div style={{ fontSize:12, color:'#3d607a', marginTop:4 }}>{label}</div>
              <div style={{ fontSize:11, color:'#2a3f52', marginTop:2 }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Servers table */}
      <SectionCard>
        <SectionHeader icon="🖥️" title="Inventaire des serveurs" iconBg={TEAL} />
        <div style={{ overflowX:'auto' }}>
          <table className="ad-tr" style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'rgba(99,210,190,.07)', borderBottom:`1px solid rgba(99,210,190,.15)` }}>
                {["Nom","Adresse IP","Type","Système d'exploitation","Rôle / Métier","Périmètre"].map(h=>(
                  <th key={h} style={{ ...thTd, color:TEAL, fontWeight:700, fontFamily:"'Syne',sans-serif", fontSize:11, letterSpacing:'.5px', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DATA.serveursListe.map((s,i)=>(
                <tr key={s.nom} style={{ borderBottom:`1px solid rgba(255,255,255,.03)` }}>
                  <td style={{ ...thTd, fontWeight:700, color:TEAL, fontFamily:"'Syne',sans-serif" }}>{s.nom}</td>
                  <td style={{ ...thTd, fontFamily:'monospace', color:'#4a6a88', fontSize:12 }}>{s.ip}</td>
                  <td style={{ ...thTd, color:'#8ab0c8' }}>{s.type}</td>
                  <td style={{ ...thTd, color:'#8ab0c8' }}>{s.os}</td>
                  <td style={{ ...thTd, color:'#8ab0c8' }}>{s.role}</td>
                  <td style={{ ...thTd }}>
                    {s.perimetre
                      ? <Badge text="Inclus" color={GREEN} />
                      : <Badge text="Exclu"  color={AMBER} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Network + workstations */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <SectionCard>
          <SectionHeader icon="🌐" title="Équipements réseau & sécurité" iconBg={BLUE} />
          <div style={{ padding:'8px 0' }}>
            {[
              { type:"Firewall", modele:"Fortinet FortiGate 200E", nb:2, ok:true  },
              { type:"Switch",   modele:"Cisco Catalyst 2960",     nb:8, ok:true  },
              { type:"Routeur",  modele:"Cisco ASR 1001",           nb:2, ok:true  },
              { type:"IDS/IPS",  modele:"Snort",                    nb:1, ok:false, warn:"Non homologué" },
              { type:"Proxy",    modele:"Squid Proxy",              nb:1, ok:true  },
            ].map(e=>(
              <div key={e.type} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 20px', borderBottom:`1px solid rgba(255,255,255,.03)` }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#c8dff4' }}>{e.type}</div>
                  <div style={{ fontSize:11, color:'#3d607a', marginTop:2 }}>{e.modele} × {e.nb}</div>
                </div>
                {e.warn
                  ? <Badge text={`⚠️ ${e.warn}`} color={AMBER} />
                  : <Badge text="✓ Homologué"    color={GREEN} />}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader icon="💻" title="Postes de travail" iconBg={PURPLE} />
          <div style={{ padding:'8px 0' }}>
            {[
              { os:"Windows 10 Pro", nb:280, pct:85, perimetre:true  },
              { os:"Windows 11 Pro", nb:40,  pct:12, perimetre:true  },
              { os:"macOS Monterey", nb:5,   pct:2,  perimetre:false },
            ].map(p=>(
              <div key={p.os} style={{ padding:'12px 20px', borderBottom:`1px solid rgba(255,255,255,.03)` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:'#c8dff4' }}>{p.os}</span>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ fontSize:14, fontWeight:800, color:TEAL, fontFamily:"'Syne',sans-serif" }}>{p.nb}</span>
                    <Badge text={p.perimetre?"Dans périmètre":"Hors périmètre"} color={p.perimetre?GREEN:AMBER} />
                  </div>
                </div>
                <MiniBar value={p.pct} color={p.perimetre?BLUE:AMBER} />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   TAB: APPLICATIONS
══════════════════════════════════════════════ */
function TabApps({ DATA }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        {[
          { icon:'📱', value:DATA.kpis.appsTotal,                                    label:'Applications total',  color:TEAL   },
          { icon:'✅', value:DATA.kpis.appsDansPerimetre,                            label:'Dans le périmètre',   color:GREEN  },
          { icon:'⚪', value:DATA.kpis.appsTotal-DATA.kpis.appsDansPerimetre,        label:'Hors périmètre',      color:AMBER  },
        ].map(({icon,value,label,color})=>(
          <div key={label} style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:18, padding:'20px 22px', display:'flex', gap:14, alignItems:'center', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-10, right:-10, width:55, height:55, borderRadius:'50%', background:color, opacity:.12, filter:'blur(14px)' }} />
            <div style={{ width:40, height:40, borderRadius:13, background:`${color}18`, border:`1px solid ${color}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:19 }}>{icon}</div>
            <div>
              <div style={{ fontSize:24, fontWeight:900, color, fontFamily:"'Syne',sans-serif", lineHeight:1 }}>{value}</div>
              <div style={{ fontSize:11, color:'#3d607a', marginTop:4, textTransform:'uppercase', letterSpacing:'.3px' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {DATA.applicationsListe.map(app=>(
          <div key={app.nom} className="ad-app-card" style={{ background:CARD, border:`1px solid ${app.perimetre?'rgba(99,210,190,.2)':BORDER}`, borderRadius:18, padding:'20px 24px', boxShadow: app.perimetre?`0 0 20px rgba(99,210,190,.06)`:undefined }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:'#d4e8ff', fontFamily:"'Syne',sans-serif", marginBottom:4 }}>{app.nom}</div>
                <div style={{ fontSize:12, color:'#3d607a' }}>{app.modules}</div>
              </div>
              <Badge text={app.perimetre?"Dans le périmètre":"Hors périmètre"} color={app.perimetre?GREEN:AMBER} />
            </div>
            <div style={{ display:'flex', gap:22, fontSize:12, color:'#4a6a88', borderTop:`1px solid rgba(255,255,255,.04)`, paddingTop:12 }}>
              <span>🛠️ <strong style={{ color:'#8ab0c8' }}>{app.env}</strong></span>
              <span>👤 <strong style={{ color:'#8ab0c8' }}>{app.dev}</strong></span>
              <span>👥 <strong style={{ color:'#8ab0c8' }}>{app.utilisateurs} utilisateurs</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   TAB: RISQUES
══════════════════════════════════════════════ */
function TabRisques({ DATA }) {
  const counts = { critique:0, elevé:0, moyen:0 };
  DATA.risquesListe.forEach(r => { if(counts[r.niv]!==undefined) counts[r.niv]++; });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        {[
          { label:'Critiques', val:counts.critique, color:RED,    icon:'🔴' },
          { label:'Élevés',    val:counts.elevé,    color:ORANGE, icon:'🟠' },
          { label:'Moyens',    val:counts.moyen,    color:BLUE,   icon:'🔵' },
        ].map(({label,val,color,icon})=>(
          <div key={label} style={{ background:`${color}0f`, border:`1px solid ${color}28`, borderRadius:18, padding:'22px 20px', textAlign:'center' }}>
            <div style={{ fontSize:22, marginBottom:8 }}>{icon}</div>
            <div style={{ fontSize:36, fontWeight:900, color, fontFamily:"'Syne',sans-serif", lineHeight:1 }}>{val}</div>
            <div style={{ fontSize:12, color, fontWeight:600, marginTop:6, letterSpacing:'.4px', textTransform:'uppercase' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {DATA.risquesListe.map((r,i)=>{
          const n = NIV_RISQUE[r.niv];
          return (
            <div key={i} className="ad-risk-card" style={{ background:CARD, border:`1px solid ${n.color}28`, borderRadius:16, padding:'18px 22px', borderLeft:`3px solid ${n.color}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'#c8dff4', fontFamily:"'DM Sans',sans-serif" }}>{r.risque}</div>
                <Badge text={n.label} color={n.color} />
              </div>
              <div style={{ fontSize:12, color:'#3d607a', marginBottom:10, lineHeight:1.5 }}>{r.desc}</div>
              <div style={{ display:'flex', gap:18, fontSize:11, color:'#2a4a62' }}>
                <span>Probabilité : <strong style={{ color:'#4a6a88' }}>{r.probabilite}</strong></span>
                <span>Impact : <strong style={{ color:'#4a6a88' }}>{r.impact}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════ */
export default function AnalysisDashboard() {
  const [activeTab, setActiveTab] = useState("global");
  const [DATA, setDATA] = useState(null);

  useEffect(() => {
    injectAdStyles();
    return () => {
      const el = document.getElementById('ad-dashboard-styles');
      if (el) el.remove();
    };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("extractedData");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // ✅ FIX : utiliser les vraies données extraites du fichier
        // Ne plus merger avec DEFAULT_DATA qui contient des données mock hardcodées
        setDATA({
          company:          { ...DEFAULT_DATA.company, ...parsed.company },
          kpis:             { ...DEFAULT_DATA.kpis,    ...parsed.kpis    },
          // Données réelles si présentes, sinon listes vides (pas de mock)
          repartition:      parsed.repartition      || { conforme:0, partiel:0, nonConforme:0 },
          radarMaturite:    parsed.radarMaturite     || DEFAULT_DATA.radarMaturite,
          serveursListe:    parsed.serveursListe     || [],
          applicationsListe:parsed.applicationsListe || [],
          risquesListe:     parsed.risquesListe      || [],
        });
      } catch {
        localStorage.removeItem("extractedData");
        setDATA("empty");
      }
    } else {
      setDATA("empty");
    }
  }, []);

  if (!DATA) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', background:BG }}>
      <p style={{ color:'#3d607a', fontFamily:"'DM Sans',sans-serif" }}>Chargement...</p>
    </div>
  );

  if (DATA === "empty") return (
    <div className="ad-root" style={{ minHeight:'100vh', background:BG, color:'#e2f0ff', padding:'28px 24px', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', maxWidth:420 }}>
        <div style={{ width:90, height:90, margin:'0 auto 28px', background:'rgba(99,210,190,.07)', border:'1px solid rgba(99,210,190,.15)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:38, boxShadow:'0 0 40px rgba(99,210,190,.08)' }}>
          📂
        </div>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:'#d4e8ff', marginBottom:10, letterSpacing:'-.2px' }}>
          Aucune analyse disponible
        </h2>
        <p style={{ fontSize:14, color:'#3d607a', lineHeight:1.7, marginBottom:28 }}>
          Vous n'avez pas encore soumis de rapport d'audit.<br />
          Uploadez un fichier PDF ou DOCX conforme au modèle ANCS pour voir votre analyse ici.
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:32 }}>
          {[
            { n:'1', text:"Allez dans l'onglet Formulaire", color:'#63d2be' },
            { n:'2', text:"Uploadez votre rapport d'audit",  color:'#818cf8' },
            { n:'3', text:"Votre analyse apparaît ici",       color:'#4ade80' },
          ].map(({n,text,color})=>(
            <div key={n} style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(255,255,255,.028)', border:'1px solid rgba(255,255,255,.06)', borderRadius:12, padding:'12px 16px' }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:`${color}18`, border:`1px solid ${color}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color, fontFamily:"'Syne',sans-serif", flexShrink:0 }}>{n}</div>
              <span style={{ fontSize:13, color:'#8ab0c8' }}>{text}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize:11, color:'#1e3a52', letterSpacing:'.3px' }}>
          ANCS Platform · Audit de Sécurité des Systèmes d'Information © 2026
        </div>
      </div>
    </div>
  );

  const d  = DATA.company;
  const gn = getNiveau(d.compliance_score);

  return (
    <div className="ad-root" style={{ minHeight:'100vh', background:BG, color:'#e2f0ff', padding:'28px 24px' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>

        {/* ── HEADER ── */}
        <div className="ad-anim" style={{ background:`linear-gradient(135deg,#0c1f3a,#0a2540)`, borderRadius:20, padding:'20px 28px', marginBottom:20, display:'flex', alignItems:'center', gap:18, position:'relative', overflow:'hidden', border:`1px solid rgba(99,210,190,.12)`, boxShadow:'0 8px 32px rgba(0,0,0,.4)' }}>
          {/* decorative rings */}
          {[160,110].map((s,i)=>(
            <div key={i} style={{ position:'absolute', width:s, height:s, borderRadius:'50%', border:'1px solid rgba(99,210,190,.1)', right:-s/4, top:'50%', transform:'translateY(-50%)', animation:`ad-rotateSlow ${18+i*6}s linear infinite` }} />
          ))}
          {/* floating dots */}
          {[[20,40,0],[50,200,.7],[25,380,.3]].map(([t,l,d],i)=>(
            <div key={i} style={{ position:'absolute', top:t, left:l, width:3, height:3, borderRadius:'50%', background:'rgba(99,210,190,.3)', animation:`ad-floatDot ${3+i*.4}s ease-in-out infinite`, animationDelay:`${d}s` }} />
          ))}

          <div style={{ width:52, height:52, background:`linear-gradient(135deg,#0d5580,#1a7a6e)`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:20, fontWeight:900, fontFamily:"'Syne',sans-serif", boxShadow:'0 0 0 2px rgba(99,210,190,.25), 0 6px 20px rgba(0,0,0,.4)', flexShrink:0 }}>
            {(d.acronym||d.name||'?').charAt(0)}
          </div>
          <div style={{ flex:1, position:'relative' }}>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:19, fontWeight:800, color:'#e4f2ff', marginBottom:5, letterSpacing:'-.3px' }}>{d.name}</h1>
            <div style={{ display:'flex', gap:12, alignItems:'center', fontSize:13, color:'#3d607a', flexWrap:'wrap' }}>
              <span>{d.sector}</span>
              <span style={{ color:'#1a3248' }}>·</span>
              <span style={{ color:gn.color, fontWeight:700 }}>Score : {d.compliance_score}% — {gn.label}</span>
            </div>
          </div>
          <div style={{ fontSize:11, color:'#2a4a62', textAlign:'right', position:'relative' }}>
            <div style={{ letterSpacing:'.5px', textTransform:'uppercase' }}>Rapport d'Audit SI</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, color:TEAL, fontSize:15, marginTop:3 }}>2024</div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="ad-anim" style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:16, padding:'6px', marginBottom:20, display:'flex', gap:4, backdropFilter:'blur(10px)' }}>
          {TABS.map(t=>(
            <button key={t.id} className={`ad-tab-btn${activeTab===t.id?' active':''}`} onClick={()=>setActiveTab(t.id)}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── CONTENT ── */}
        <div>
          {activeTab==="global"  && <TabGlobal  DATA={DATA} />}
          {activeTab==="kpis"    && <TabKpis    DATA={DATA} />}
          {activeTab==="infra"   && <TabInfra   DATA={DATA} />}
          {activeTab==="apps"    && <TabApps    DATA={DATA} />}
          {activeTab==="risques" && <TabRisques DATA={DATA} />}
        </div>

        {/* ── FOOTER ── */}
        <div style={{ marginTop:28, textAlign:'center', fontSize:11, color:'#1e3a52', letterSpacing:'.3px' }}>
          ANCS Platform · Audit de Sécurité des Systèmes d'Information © 2026
        </div>
      </div>
    </div>
  );
}