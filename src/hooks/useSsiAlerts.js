

import { useState, useEffect, useCallback } from "react";
import supabase from "../lib/supabaseClient";
import { T, S } from "../theme";
export function useSsiAlerts({ onlyUnacknowledged = true } = {}) {
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false); // ETL en cours

  // ── Lecture des alertes ──────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    try {
      let q = supabase
        .from("ssi_alerts")
        .select("*")
        .order("alert_date", { ascending: false })
        .order("severity",   { ascending: true  }) // critical d'abord
        .limit(100);

      if (onlyUnacknowledged) q = q.eq("acknowledged", false);

      const { data, error } = await q;
      if (error) throw error;
      setAlerts(data || []);
    } catch (err) {
      console.warn("[useSsiAlerts]", err.message);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [onlyUnacknowledged]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  // Realtime : nouvelles alertes en direct
  useEffect(() => {
  const channel = supabase
    .channel(`ssi-alerts-${Date.now()}`)  // nom unique à chaque fois
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "ssi_alerts" },
      fetchAlerts
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [fetchAlerts]);

  // ── Acquittement ─────────────────────────────────────────
  const acknowledge = useCallback(async (id) => {
    await supabase
      .from("ssi_alerts")
      .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
      .eq("id", id);
    await fetchAlerts();
  }, [fetchAlerts]);

  const acknowledgeAll = useCallback(async () => {
    await supabase
      .from("ssi_alerts")
      .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
      .eq("acknowledged", false);
    await fetchAlerts();
  }, [fetchAlerts]);

  // ── Déclencheur ETL manuel ────────────────────────────────
  const triggerEtl = useCallback(async (date = null) => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("etl-snapshot", {
        body: date ? { date } : {},
      });
      if (error) throw error;
      await fetchAlerts();
      return data;
    } catch (err) {
      console.error("[useSsiAlerts] triggerEtl:", err.message);
      return { success: false, error: err.message };
    } finally {
      setRunning(false);
    }
  }, [fetchAlerts]);

  // ── Compteurs par sévérité ────────────────────────────────
  const counts = {
    critical: alerts.filter(a => a.severity === "critical").length,
    warning:  alerts.filter(a => a.severity === "warning").length,
    info:     alerts.filter(a => a.severity === "info").length,
    total:    alerts.length,
  };

  return {
    alerts,
    counts,
    loading,
    running,
    acknowledge,
    acknowledgeAll,
    triggerEtl,
    refresh: fetchAlerts,
  };
}

// ═══════════════════════════════════════════════════════════════
//  COMPOSANT AlertsPanel
//  À intégrer dans DecideurDashboard — onglet ou section dédiée
//
//  Import :
//    import { AlertsPanel } from "../../hooks/useSsiAlerts";
//  Usage :
//    <AlertsPanel />
// ═══════════════════════════════════════════════════════════════



const SEVERITY_CONFIG = {
  critical: { color: T.danger,   bg: "rgba(248,113,113,0.08)", icon: "🔴", label: "Critique" },
  warning:  { color: T.warning,  bg: "rgba(251,191,36,0.08)",  icon: "🟡", label: "Attention" },
  info:     { color: T.secondary,bg: "rgba(59,130,246,0.08)",  icon: "🔵", label: "Info"      },
};

const CAT_ICONS = {
  conformite:  "📊",
  gouvernance: "🏛️",
  technique:   "⚙️",
  resilience:  "🔄",
  pilotage:    "📋",
};

export function AlertsPanel() {
  const {
    alerts, counts, loading, running,
    acknowledge, acknowledgeAll, triggerEtl,
  } = useSsiAlerts();

  const [filter, setFilter] = useState("all");

  const displayed = filter === "all"
    ? alerts
    : alerts.filter(a => a.severity === filter);

  if (loading) {
    return (
      <div style={{ ...S.panel, textAlign: "center", padding: "40px" }}>
        <div style={{ color: T.textMuted, fontSize: 13 }}>Chargement des alertes…</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.textMain, fontFamily: "Syne, sans-serif" }}>
            🔔 Alertes SSI
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: T.textMuted }}>
            Seuils franchis · Détection automatique chaque nuit à 00h05
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {counts.total > 0 && (
            <button
              style={{ ...S.btnSecondary, fontSize: 12 }}
              onClick={acknowledgeAll}
            >
              ✓ Tout acquitter ({counts.total})
            </button>
          )}
          <button
            style={{ ...S.btnPrimary, fontSize: 12, opacity: running ? 0.7 : 1 }}
            onClick={() => triggerEtl()}
            disabled={running}
          >
            {running ? "⏳ Calcul en cours…" : "▶ Recalculer maintenant"}
          </button>
        </div>
      </div>

      {/* ── Compteurs sévérité ───────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {["critical", "warning", "info"].map(sev => {
          const cfg = SEVERITY_CONFIG[sev];
          const n   = counts[sev];
          return (
            <button
              key={sev}
              onClick={() => setFilter(filter === sev ? "all" : sev)}
              style={{
                background: filter === sev ? cfg.bg : "rgba(255,255,255,0.02)",
                border:     `1px solid ${filter === sev ? cfg.color : T.border}`,
                borderRadius: 14, padding: "16px 20px",
                cursor: "pointer", textAlign: "left",
                transition: "all .2s",
              }}
            >
              <div style={{ fontSize: 11, color: cfg.color, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
                {cfg.icon} {cfg.label}
              </div>
              <div style={{ fontSize: 34, fontWeight: 900, color: n > 0 ? cfg.color : T.textMuted, fontFamily: "Syne, sans-serif", lineHeight: 1 }}>
                {n}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Liste des alertes ────────────────────────────────── */}
      {displayed.length === 0 ? (
        <div style={{
          ...S.panel, textAlign: "center", padding: "60px 20px",
          border: `1px dashed ${T.border}`,
        }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>✅</div>
          <div style={{ fontSize: 14, color: T.textMuted }}>
            {counts.total === 0
              ? "Aucune alerte active — tous les indicateurs sont dans les seuils."
              : `Aucune alerte de type « ${SEVERITY_CONFIG[filter].label} ».`}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {displayed.map(alert => {
            const cfg = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.info;
            return (
              <div
                key={alert.id}
                style={{
                  background: cfg.bg,
                  border:     `1px solid ${cfg.color}30`,
                  borderLeft: `4px solid ${cfg.color}`,
                  borderRadius: 14, padding: "16px 20px",
                  display: "flex", alignItems: "flex-start", gap: 16,
                }}
              >
                {/* Icône catégorie */}
                <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>
                  {CAT_ICONS[alert.category] ?? "📌"}
                </span>

                {/* Contenu */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800, color: cfg.color,
                      background: `${cfg.color}15`, padding: "2px 8px", borderRadius: 6,
                      textTransform: "uppercase", letterSpacing: ".06em",
                    }}>
                      {cfg.label}
                    </span>
                    <span style={{ fontSize: 10, color: T.textMuted }}>
                      {alert.category}
                    </span>
                    {alert.organism_name && (
                      <span style={{
                        fontSize: 10, color: T.secondary,
                        background: "rgba(59,130,246,0.1)", padding: "2px 8px", borderRadius: 6,
                      }}>
                        {alert.organism_name}
                      </span>
                    )}
                    <span style={{ fontSize: 10, color: T.textMuted, marginLeft: "auto" }}>
                      {new Date(alert.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </span>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 700, color: T.textMain, marginBottom: 4 }}>
                    {alert.title}
                  </div>
                  <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
                    {alert.description}
                  </div>

                  {/* Métrique + seuil */}
                  {alert.metric_value !== null && (
                    <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
                      <div style={{ fontSize: 11, color: T.textMuted }}>
                        Valeur actuelle :
                        <span style={{ color: cfg.color, fontWeight: 800, marginLeft: 4, fontFamily: "Syne, sans-serif" }}>
                          {alert.metric_value}
                          {String(alert.metric_name).includes("pct") || String(alert.metric_name).includes("coverage") || String(alert.metric_name).includes("score") || String(alert.metric_name).includes("taux") || String(alert.metric_name).includes("rate") ? "%" : ""}
                        </span>
                      </div>
                      {alert.threshold !== null && (
                        <div style={{ fontSize: 11, color: T.textMuted }}>
                          Seuil :
                          <span style={{ color: T.textMain, fontWeight: 600, marginLeft: 4 }}>
                            {alert.threshold}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bouton acquitter */}
                <button
                  onClick={() => acknowledge(alert.id)}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${T.border}`,
                    borderRadius: 8, padding: "6px 12px",
                    color: T.textMuted, fontSize: 11, fontWeight: 600,
                    cursor: "pointer", flexShrink: 0, fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  ✓ Acquitter
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
