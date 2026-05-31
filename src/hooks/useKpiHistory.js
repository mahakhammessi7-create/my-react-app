// hooks/useKpiHistory.js
// ═══════════════════════════════════════════════════════════════
//  ETL côté client : snapshot quotidien + lecture de l'historique.
//
//  PRINCIPE :
//    1. Au chargement, lit les N derniers snapshots depuis Supabase.
//    2. Si aucun snapshot n'existe pour aujourd'hui ET que les données
//       sont prêtes, insère (upsert) un nouveau snapshot.
//    3. Expose `trendData` formaté pour Recharts + `weeklyDelta` pour
//       les badges de variation.
//
//  UTILISATION dans DecideurDashboard / ResponsableDashboard :
//    const { trendData, weeklyDelta, loading } = useKpiHistory({ stats, reports });
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from "react";
import supabase from "../lib/supabaseClient";

/* ── Configuration ───────────────────────────────────────── */
const HISTORY_DAYS  = 90;   // fenêtre de lecture (jours)
const MIN_REPORTS   = 1;    // nb minimum de rapports pour déclencher un snapshot
const TABLE         = "kpi_snapshots";

/* ── Helpers ─────────────────────────────────────────────── */

/** Transforme stats + reports → objet prêt pour l'UPSERT */
function buildSnapshot(stats, reports) {
  const today = new Date().toISOString().split("T")[0];

  // Ventilation sectorielle
  const bySector = {};
  reports.forEach((r) => {
    const sector = r.sector || r.organism_sector || "Autre";
    if (!bySector[sector]) bySector[sector] = { count: 0, totalScore: 0 };
    bySector[sector].count++;
    bySector[sector].totalScore += r.compliance_score || 0;
  });
  const by_sector = {};
  Object.entries(bySector).forEach(([s, d]) => {
    by_sector[s] = {
      count:     d.count,
      avg_score: Math.round(d.totalScore / d.count),
    };
  });

  return {
    snapshot_date:        today,
    total_reports:        stats.total,
    avg_compliance_score: stats.score_moyen,
    avg_maturity_level:   stats.maturité_moyenne,
    total_critical_vulns: stats.vulns_critiques,
    eol_assets:           stats.eol_assets,
    validated_count:      stats.validés,
    assigned_count:       stats.affectés,
    rejected_count:       Math.round((stats.rejection_rate * stats.total) / 100),
    taux_avancement:      stats.taux_avancement,
    assign_rate:          stats.assign_rate,
    rejection_rate:       stats.rejection_rate,
    rssi_coverage:        stats.rssi_coverage,
    pssi_coverage:        stats.pssi_coverage,
    pca_coverage:         stats.pca_coverage,
    pra_coverage:         stats.pra_coverage,
    patch_compliance:     stats.patch_compliance,
    staff_trained_pct:    stats.staff_trained_pct,
    by_sector,
  };
}

/** Formate une date ISO → label court "14 jan." */
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

/** Calcule le delta entre la valeur la plus récente et celle d'il y a N jours */
function computeDelta(history, field, daysAgo = 7) {
  if (history.length < 2) return null;
  const latest = history[history.length - 1][field] ?? null;
  const cutoff  = new Date();
  cutoff.setDate(cutoff.getDate() - daysAgo);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  const ref = [...history]
    .reverse()
    .find((s) => s.snapshot_date <= cutoffStr);
  const refVal = ref?.[field] ?? null;
  if (latest === null || refVal === null) return null;
  return parseFloat((latest - refVal).toFixed(2));
}

/* ════════════════════════════════════════════════════════════
   HOOK PRINCIPAL
════════════════════════════════════════════════════════════ */
export function useKpiHistory({
  stats          = null,
  reports        = [],
  autoSnapshot   = true,   // false → désactive l'écriture automatique
  historyDays    = HISTORY_DAYS,
} = {}) {
  const [history,          setHistory]          = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [lastSnapshotDate, setLastSnapshotDate] = useState(null);
  const snapshotInFlight   = useRef(false);

  /* ── Lecture des snapshots ─────────────────────────────── */
  const fetchHistory = useCallback(async () => {
    try {
      const since = new Date();
      since.setDate(since.getDate() - historyDays);

      const { data, error: sbErr } = await supabase
        .from(TABLE)
        .select("*")
        .gte("snapshot_date", since.toISOString().split("T")[0])
        .order("snapshot_date", { ascending: true });

      if (sbErr) throw sbErr;
      setHistory(data || []);
      if (data?.length) {
        setLastSnapshotDate(data[data.length - 1].snapshot_date);
      }
      setError(null);
    } catch (err) {
      console.warn("[useKpiHistory] fetchHistory:", err.message);
      setError(err.message);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [historyDays]);

  /* ── Sauvegarde / mise à jour du snapshot du jour ──────── */
  const saveSnapshot = useCallback(
    async (statsData, reportsData) => {
      if (!statsData || !reportsData?.length < MIN_REPORTS) return;
      if (snapshotInFlight.current) return;
      snapshotInFlight.current = true;

      try {
        const snapshot = buildSnapshot(statsData, reportsData);
        const { error: sbErr } = await supabase
          .from(TABLE)
          .upsert(snapshot, { onConflict: "snapshot_date" });

        if (sbErr) throw sbErr;
        await fetchHistory();
        console.info("[useKpiHistory] Snapshot upserted for", snapshot.snapshot_date);
      } catch (err) {
        console.warn("[useKpiHistory] saveSnapshot:", err.message);
      } finally {
        snapshotInFlight.current = false;
      }
    },
    [fetchHistory]
  );

  /* ── Chargement initial ────────────────────────────────── */
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  /* ── Auto-snapshot : une fois par jour, si données prêtes */
  useEffect(() => {
    if (!autoSnapshot)            return;
    if (!stats)                   return;
    if (!reports?.length)         return;
    if (loading)                  return;

    const today = new Date().toISOString().split("T")[0];
    if (lastSnapshotDate === today) return;   // snapshot du jour déjà présent

    saveSnapshot(stats, reports);
  }, [autoSnapshot, stats, reports, loading, lastSnapshotDate, saveSnapshot]);

  /* ── trendData : tableau formaté pour Recharts ─────────── */
  const trendData = history.map((snap) => ({
    // axes
    date:       snap.snapshot_date,
    label:      fmtDate(snap.snapshot_date),
    // KPIs principaux
    score:      snap.avg_compliance_score     ?? 0,
    maturité:   parseFloat(((snap.avg_maturity_level ?? 0) / 5 * 100).toFixed(1)),
    vulns:      snap.total_critical_vulns     ?? 0,
    avancement: snap.taux_avancement          ?? 0,
    affectation:snap.assign_rate              ?? 0,
    rejets:     snap.rejection_rate           ?? 0,
    // Gouvernance
    rssi:       snap.rssi_coverage            ?? 0,
    pssi:       snap.pssi_coverage            ?? 0,
    pca:        snap.pca_coverage             ?? 0,
    pra:        snap.pra_coverage             ?? 0,
    // Technique
    patch:      snap.patch_compliance         ?? 0,
    staff:      snap.staff_trained_pct        ?? 0,
    // Volumétrie
    total:      snap.total_reports            ?? 0,
    // Secteurs (objet brut)
    by_sector:  snap.by_sector               ?? {},
  }));

  /* ── weeklyDelta : variations J vs J-7 ─────────────────── */
  const weeklyDelta = {
    score:      computeDelta(history, "avg_compliance_score"),
    vulns:      computeDelta(history, "total_critical_vulns"),
    avancement: computeDelta(history, "taux_avancement"),
    maturité:   computeDelta(history, "avg_maturity_level"),
    rssi:       computeDelta(history, "rssi_coverage"),
  };

  /* ── Données sectorielles agrégées (dernier snapshot) ───── */
  const latestBySector = history.length
    ? history[history.length - 1].by_sector ?? {}
    : {};

  return {
    history,           // raw snapshots (array of DB rows)
    trendData,         // formatted for Recharts
    weeklyDelta,       // { score, vulns, avancement, … } — null si pas assez de données
    latestBySector,    // { "Finance": { count, avg_score }, … }
    loading,
    error,
    lastSnapshotDate,
    saveSnapshot,      // appel manuel si autoSnapshot=false
    refresh: fetchHistory,
  };
}

/* ── Hook simplifié pour composants non-critiques ────────── */
export function useSimpleTrend(field = "score", days = 30) {
  const { trendData, loading } = useKpiHistory({ historyDays: days, autoSnapshot: false });
  return {
    data:    trendData.map((d) => ({ label: d.label, value: d[field] ?? 0 })),
    loading,
  };
}