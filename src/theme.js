// src/theme.js
// ─────────────────────────────────────────────────────────────
//  Thème et styles partagés entre tous les dashboards.
//  Importez depuis ici plutôt que depuis DecideurDashboard.
// ─────────────────────────────────────────────────────────────

export const T = {
  primary:   "#10b981",
  secondary: "#3b82f6",
  warning:   "#fbbf24",
  danger:    "#f87171",
  purple:    "#8b5cf6",
  cyan:      "#06b6d4",
  textMain:  "#e8fff6",
  textMuted: "#94a3b8",
  border:    "rgba(255,255,255,0.07)",
};

export const CAT_LABELS = {
  maturite:    "📊 Maturité & Conformité",
  gouvernance: "🏛️ Gouvernance",
  resilience:  "🔄 Résilience & Continuité",
  risque:      "🔴 Risques Techniques",
  pilotage:    "📋 Pilotage",
};

export const CAT_COLORS = {
  maturite:    "#10b981",
  gouvernance: "#3b82f6",
  resilience:  "#fbbf24",
  risque:      "#f87171",
  pilotage:    "#8b5cf6",
};

export const S = {
  wrap:      { color: T.textMain, fontFamily: "'DM Sans',system-ui,sans-serif", padding: "24px", background: "#0b1120", minHeight: "100vh" },
  cont:      { display: "flex", flexDirection: "column", gap: 20, maxWidth: 1400, margin: "0 auto" },
  topBar:    { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, padding: "14px 20px", background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 14, maxWidth: 1400, margin: "0 auto 20px" },
  kpiRow:    { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, minWidth: 0 },
  kpiCard:   { background: "linear-gradient(145deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))", border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px", minWidth: 0, overflow: "hidden" },
  kpiLabel:  { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: T.textMuted, fontWeight: 600 },
  kpiVal:    { fontSize: 32, fontWeight: 800, fontFamily: "Syne,sans-serif", marginBottom: 4 },
  mid:       { display: "grid", gridTemplateColumns: "260px 1fr 280px", gap: 20, minHeight: 420, minWidth: 0 },
  side:      { background: "linear-gradient(145deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))", border: `1px solid ${T.border}`, borderRadius: 20, padding: "22px", display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" },
  center:    { background: "linear-gradient(145deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))", border: `1px solid ${T.border}`, borderRadius: 20, padding: "22px", minWidth: 0, overflow: "hidden" },
  statRow:   { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.border}` },
  botGrid:   { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, minWidth: 0 },
  panel:     { background: "linear-gradient(145deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))", border: `1px solid ${T.border}`, borderRadius: 20, padding: "22px", overflow: "hidden", minWidth: 0 },
  ph:        { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 },
  pt:        { margin: 0, fontSize: 14, fontWeight: 700, color: T.textMain },
  pb:        { fontSize: 11, color: T.textMuted, background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: 20 },
  list:      { display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" },
  item:      { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" },
  catFilter: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${T.border}` },
  catBtn:    { background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, borderRadius: 20, padding: "5px 12px", fontSize: 11, fontWeight: 600, color: T.textMuted, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
  catBtnA:   { background: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.4)", color: "#34d399" },
  logout:    { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, color: "#f87171", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700, padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
  syncBadge: { display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, padding: "4px 10px", fontSize: 10, fontWeight: 700, color: "#22c55e" },
  tabRow:    { display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4 },
  tab:       (active) => ({ background: active ? "rgba(16,185,129,0.15)" : "none", border: active ? "1px solid rgba(16,185,129,0.3)" : "1px solid transparent", borderRadius: 8, padding: "6px 14px", color: active ? T.primary : T.textMuted, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }),
  input:     { width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, borderRadius: 12, padding: "11px 16px", color: "#fff", fontSize: 14, outline: "none", fontFamily: "'DM Sans',sans-serif" },
  textarea:  { width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, borderRadius: 12, padding: "11px 16px", color: "#fff", fontSize: 14, outline: "none", fontFamily: "'DM Sans',sans-serif", resize: "vertical", minHeight: 140, lineHeight: 1.6 },
  select:    { width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, borderRadius: 12, padding: "11px 16px", color: "#fff", fontSize: 14, outline: "none", fontFamily: "'DM Sans',sans-serif" },
  label:     { display: "block", fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 },
  btnPrimary:   { background: `linear-gradient(135deg,${T.primary},${T.purple})`, border: "none", borderRadius: 12, padding: "10px 24px", fontSize: 13, fontWeight: 700, color: "#f0fff8", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
  btnSecondary: { background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, borderRadius: 12, padding: "10px 22px", fontSize: 13, fontWeight: 600, color: T.textMuted, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
  btnDanger:    { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, color: "#f87171", fontSize: 12, fontWeight: 600, padding: "7px 14px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
};