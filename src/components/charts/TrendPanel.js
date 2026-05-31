// components/charts/TrendPanel.jsx
// ═══════════════════════════════════════════════════════════════
//  TrendPanel — Visualisation complète des tendances historiques
//
//  Props :
//    trendData    : array from useKpiHistory().trendData
//    weeklyDelta  : object from useKpiHistory().weeklyDelta
//    latestBySector : object from useKpiHistory().latestBySector
//    loading      : bool
//
//  Intégration dans DecideurDashboard :
//    import { TrendPanel } from "../../components/charts/TrendPanel";
//    import { useKpiHistory } from "../../hooks/useKpiHistory";
//
//    // Dans le composant :
//    const { trendData, weeklyDelta, latestBySector, loading: histLoading }
//      = useKpiHistory({ stats, reports });
//
//    // Dans le JSX (après <MaturityRadar>) :
//    <TrendPanel
//      trendData={trendData}
//      weeklyDelta={weeklyDelta}
//      latestBySector={latestBySector}
//      loading={histLoading}
//    />
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { T, S } from "../../theme";

/* ── Palette ─────────────────────────────────────────────── */
const COLORS = {
  score:      T.primary,
  maturité:   T.purple,
  vulns:      T.danger,
  avancement: T.secondary,
  rssi:       "#06b6d4",
  pssi:       "#8b5cf6",
  pca:        "#fbbf24",
  pra:        "#f97316",
};

/* ── Tooltip personnalisé ────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0f172a",
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      padding: "10px 14px",
      minWidth: 160,
    }}>
      <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8, fontWeight: 700 }}>
        {label}
      </div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{
          display: "flex", justifyContent: "space-between", gap: 20,
          marginBottom: 4,
        }}>
          <span style={{ fontSize: 12, color: p.color, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 2, background: p.color, display: "inline-block" }} />
            {p.name}
          </span>
          <span style={{ fontSize: 12, fontWeight: 800, color: p.color, fontFamily: "Syne, sans-serif" }}>
            {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
            {["score","maturité","avancement","rssi","pssi","pca","pra"].includes(p.dataKey) ? "%" : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── DeltaBadge : variation semaine ─────────────────────── */
function DeltaBadge({ value, unit = "%" }) {
  if (value === null || value === undefined) {
    return <span style={{ fontSize: 11, color: T.textMuted }}>—</span>;
  }
  const positive = value >= 0;
  const isVulns  = unit === ""; // vulns : moins = mieux
  const good     = isVulns ? !positive : positive;
  const color    = good ? T.primary : T.danger;
  const arrow    = positive ? "↑" : "↓";
  return (
    <span style={{
      fontSize: 11, fontWeight: 800, color,
      background: `${color}15`,
      border: `1px solid ${color}30`,
      borderRadius: 6, padding: "2px 7px",
    }}>
      {arrow} {Math.abs(value).toFixed(1)}{unit} /7j
    </span>
  );
}

/* ── TABS config ────────────────────────────────────────── */
const TABS = [
  { id: "conformite", label: "Conformité & Maturité" },
  { id: "gouvernance", label: "Gouvernance SSI" },
  { id: "operations", label: "Opérations" },
  { id: "secteurs", label: "Secteurs" },
];

/* ════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
════════════════════════════════════════════════════════════ */
export function TrendPanel({ trendData = [], weeklyDelta = {}, latestBySector = {}, loading = false }) {
  const [activeTab, setActiveTab] = useState("conformite");

  /* Prépare les données sectorielles pour le BarChart */
  const sectorData = useMemo(() =>
    Object.entries(latestBySector)
      .map(([name, d]) => ({ name, score: d.avg_score, count: d.count }))
      .sort((a, b) => b.score - a.score),
    [latestBySector]
  );

  /* Skeleton loader */
  if (loading) {
    return (
      <div style={{ ...S.panel, minHeight: 420, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.4 }}>📈</div>
          <div style={{ fontSize: 13, color: T.textMuted }}>Chargement de l'historique…</div>
        </div>
      </div>
    );
  }

  /* Empty state */
  if (!trendData.length) {
    return (
      <div style={{ ...S.panel, minHeight: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>📊</div>
          <div style={{ fontSize: 14, color: T.textMuted, marginBottom: 6 }}>Aucun historique disponible</div>
          <div style={{ fontSize: 12, color: "#475569" }}>
            Le premier snapshot sera créé automatiquement au prochain chargement.
          </div>
        </div>
      </div>
    );
  }

  const axisProps = {
    axisLine: false,
    tickLine: false,
    tick: { fill: T.textMuted, fontSize: 11 },
  };

  const gridProps = {
    strokeDasharray: "3 3",
    stroke: "rgba(255,255,255,0.06)",
  };

  return (
    <div style={S.panel}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ ...S.ph, marginBottom: 0 }}>
        <div>
          <h3 style={S.pt}>📈 Tendances historiques</h3>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>
            {trendData.length} points · {trendData[0]?.label} → {trendData[trendData.length - 1]?.label}
          </div>
        </div>

        {/* Badges variation semaine */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: T.textMuted }}>Score</span>
            <DeltaBadge value={weeklyDelta.score} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: T.textMuted }}>Vulns</span>
            <DeltaBadge value={weeklyDelta.vulns} unit="" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: T.textMuted }}>Avancement</span>
            <DeltaBadge value={weeklyDelta.avancement} />
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <div style={{ ...S.tabRow, marginTop: 20, marginBottom: 24 }}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            style={S.tab(activeTab === id)}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB 1 — Conformité & Maturité
      ══════════════════════════════════════════════════════ */}
      {activeTab === "conformite" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          {/* Score de conformité — Area avec ligne de seuil */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: ".08em" }}>
              Score moyen de conformité (%)
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={COLORS.score} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={COLORS.score} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" />
                <YAxis {...axisProps} domain={[0, 100]} />
                <ReferenceLine
                  y={75}
                  stroke="rgba(16,185,129,0.4)"
                  strokeDasharray="6 3"
                  label={{ value: "Seuil 75%", position: "insideTopRight", fill: T.primary, fontSize: 10 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="score"
                  name="Conformité"
                  stroke={COLORS.score}
                  fill="url(#gScore)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, fill: COLORS.score }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Score vs Maturité — comparaison */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: ".08em" }}>
              Conformité vs Maturité (%)
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" />
                <YAxis {...axisProps} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: T.textMuted, paddingTop: 8 }}
                  iconType="circle"
                />
                <Line type="monotone" dataKey="score"    name="Conformité" stroke={COLORS.score}    strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="maturité" name="Maturité"   stroke={COLORS.maturité} strokeWidth={2}   dot={false} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 2 — Gouvernance SSI
      ══════════════════════════════════════════════════════ */}
      {activeTab === "gouvernance" && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: ".08em" }}>
            Couverture des dispositifs SSI (% des organismes)
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" />
              <YAxis {...axisProps} domain={[0, 100]} />
              <ReferenceLine
                y={80}
                stroke="rgba(255,255,255,0.12)"
                strokeDasharray="4 4"
                label={{ value: "Cible 80%", position: "insideTopRight", fill: "#475569", fontSize: 10 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: T.textMuted, paddingTop: 8 }} iconType="circle" />
              {[
                { key: "rssi", name: "RSSI" },
                { key: "pssi", name: "PSSI" },
                { key: "pca",  name: "PCA" },
                { key: "pra",  name: "PRA" },
              ].map(({ key, name }) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={name}
                  stroke={COLORS[key]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          {/* Badges actuels */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 20 }}>
            {[
              { key: "rssi", label: "RSSI" },
              { key: "pssi", label: "PSSI" },
              { key: "pca",  label: "PCA" },
              { key: "pra",  label: "PRA" },
            ].map(({ key, label }) => {
              const latest = trendData[trendData.length - 1]?.[key] ?? 0;
              const c = latest >= 80 ? T.primary : latest >= 55 ? T.warning : T.danger;
              return (
                <div key={key} style={{
                  background: `${c}10`, border: `1px solid ${c}25`,
                  borderRadius: 12, padding: "14px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4, fontWeight: 700 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: c, fontFamily: "Syne, sans-serif", lineHeight: 1 }}>
                    {latest.toFixed(0)}<span style={{ fontSize: 14 }}>%</span>
                  </div>
                  <DeltaBadge value={weeklyDelta[key] ?? null} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 3 — Opérations
      ══════════════════════════════════════════════════════ */}
      {activeTab === "operations" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          {/* Avancement & Affectation */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: ".08em" }}>
              Taux d'avancement & d'affectation (%)
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gAv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={COLORS.avancement} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.avancement} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" />
                <YAxis {...axisProps} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: T.textMuted, paddingTop: 8 }} iconType="circle" />
                <Area type="monotone" dataKey="avancement"  name="Avancement"  stroke={COLORS.avancement} fill="url(#gAv)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="affectation" name="Affectation" stroke={T.purple}           strokeWidth={2} dot={false} strokeDasharray="5 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Vulnérabilités critiques */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: ".08em" }}>
              Vulnérabilités critiques ouvertes
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gVulns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={COLORS.vulns} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={COLORS.vulns} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" />
                <YAxis {...axisProps} />
                <ReferenceLine y={0} stroke={T.primary} strokeDasharray="4 4" label={{ value: "Cible : 0", position: "insideTopRight", fill: T.primary, fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="vulns" name="Vulnérabilités" stroke={COLORS.vulns} fill="url(#gVulns)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 4 — Secteurs
      ══════════════════════════════════════════════════════ */}
      {activeTab === "secteurs" && (
        <div>
          {sectorData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: T.textMuted }}>
              Données sectorielles disponibles après le premier snapshot.
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: ".08em" }}>
                Score moyen de conformité par secteur (dernier snapshot)
              </div>
              <ResponsiveContainer width="100%" height={Math.max(220, sectorData.length * 48)}>
                <BarChart
                  data={sectorData}
                  layout="vertical"
                  margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
                >
                  <XAxis type="number" domain={[0, 100]} {...axisProps} />
                  <YAxis type="category" dataKey="name" {...axisProps} width={130} />
                  <CartesianGrid {...gridProps} horizontal={false} />
                  <ReferenceLine x={75} stroke={T.primary} strokeDasharray="4 4" label={{ value: "75%", position: "insideTopRight", fill: T.primary, fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: `1px solid ${T.border}`, borderRadius: 8 }}
                    formatter={(v, _, props) => [`${v}% (${props.payload.count} org.)`, "Score moyen"]}
                  />
                  <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={24}>
                    {sectorData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.score >= 75 ? T.primary : entry.score >= 55 ? T.warning : T.danger}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Table synthèse */}
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                {sectorData.map((s) => {
                  const c = s.score >= 75 ? T.primary : s.score >= 55 ? T.warning : T.danger;
                  return (
                    <div key={s.name} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 14px", background: `${c}08`,
                      border: `1px solid ${c}20`, borderRadius: 10,
                    }}>
                      <span style={{ fontSize: 13, color: T.textMain, fontWeight: 600 }}>{s.name}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <span style={{ fontSize: 11, color: T.textMuted }}>{s.count} organisme{s.count > 1 ? "s" : ""}</span>
                        <span style={{ fontSize: 18, fontWeight: 900, color: c, fontFamily: "Syne, sans-serif" }}>
                          {s.score}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}