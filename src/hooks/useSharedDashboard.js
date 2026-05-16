/**
 * useSharedDashboard.js — VERSION SUPABASE FUSIONNÉE
 * Lit les KPIs depuis shared_kpis ET shared_dashboards (type='kpi')
 * Crée decideur_decisions si besoin
 */

import { useState, useEffect, useCallback, useRef } from "react";
import supabase from "../lib/supabaseClient";

/* ─── Extract KPI value safely ─── */
export function extractKpiValue(kpi) {
  const candidates = [
    kpi?.value,
    kpi?.payload?.value,
    kpi?.payload?.score,
    kpi?.score,
  ];
  for (const v of candidates) {
    const n = parseFloat(v);
    if (!isNaN(n) && isFinite(n)) return n;
  }
  return 0;
}

/* ─── Normalise un enregistrement shared_dashboards (type='kpi') 
       vers le même format que shared_kpis ─── */
function normalizeDashboardKpi(row) {
  const p = row.payload || {};
  return {
    // préfixe "sd-" pour éviter les collisions d'id avec shared_kpis
    id:           `sd-${row.id}`,
    name:         p.name         || row.name         || "—",
    formula:      Array.isArray(p.formula)
                    ? p.formula.join(" ")
                    : (p.formula || ""),
    type:         p.type         || "Taux (%)",
    category:     p.category     || "pilotage",
    value:        parseFloat(p.value ?? p.score ?? 0) || 0,
    threshold:    parseFloat(p.threshold ?? 50)       || 50,
    unit:         p.unit         || (p.type === "Taux (%)" ? "%" : ""),
    created_by:   row.created_by || "Responsable",
    published_at: row.updated_at || row.created_at,
    // conserver le payload brut au cas où
    _source:      "shared_dashboards",
    _raw:         row,
  };
}

/* ════════════════════════════════════════════════════════════
   useSharedDashboard — côté RESPONSABLE
════════════════════════════════════════════════════════════ */
export function useSharedDashboard() {
  const [published, setPublished] = useState([]);
  const [saving, setSaving]       = useState(false);

  const _load = useCallback(async () => {
    // 1. shared_kpis
    const { data: kpisData, error: kpisError } = await supabase
      .from("shared_kpis")
      .select("*")
      .order("published_at", { ascending: false });

    // 2. shared_dashboards type='kpi'
    const { data: dashData, error: dashError } = await supabase
      .from("shared_dashboards")
      .select("*")
      .eq("type", "kpi")
      .order("created_at", { ascending: false });

    if (kpisError) console.error("loadKpis (shared_kpis) error:", kpisError);
    if (dashError) console.error("loadKpis (shared_dashboards) error:", dashError);

    const fromKpis = kpisData || [];
    const fromDash = (dashData || []).map(normalizeDashboardKpi);

    // Dédoublonnage par nom (shared_kpis prioritaire)
    const kpisNames = new Set(fromKpis.map(k => k.name));
    const merged = [
      ...fromKpis,
      ...fromDash.filter(k => !kpisNames.has(k.name)),
    ];

    setPublished(merged);
  }, []);

  useEffect(() => { _load(); }, [_load]);

  const publishKpi = useCallback(async (kpi, value) => {
    setSaving(true);
    try {
      const payload = {
        id:           String(kpi.id),
        name:         kpi.name,
        formula:      Array.isArray(kpi.formula)
                        ? kpi.formula.join(" ")
                        : (kpi.formula || ""),
        type:         kpi.type     || "Nombre",
        category:     kpi.category || "pilotage",
        value:        typeof value === "number" && isFinite(value)
                        ? value
                        : extractKpiValue(kpi),
        threshold:    typeof kpi.threshold === "number" ? kpi.threshold : 50,
        unit:         kpi.unit || (kpi.type === "Taux (%)" ? "%" : ""),
        created_by:   "Responsable",
        published_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("shared_kpis")
        .upsert(payload, { onConflict: "id" });

      if (error) throw error;
      await _load();
      return { success: true };
    } catch (e) {
      console.error("publishKpi error:", e);
      return { success: false };
    } finally {
      setSaving(false);
    }
  }, [_load]);

  const unpublish = useCallback(async (kpiId) => {
    setSaving(true);
    try {
      // Supprime de shared_kpis (les shared_dashboards sont gérés séparément)
      const { error } = await supabase
        .from("shared_kpis")
        .delete()
        .eq("id", String(kpiId));
      if (error) throw error;
      await _load();
    } catch (e) {
      console.error("unpublish error:", e);
    } finally {
      setSaving(false);
    }
  }, [_load]);

  const publishReportsSnapshot  = useCallback(async () => {}, []);
  const publishDashboardConfig  = useCallback(async () => {}, []);

  return {
    published,
    saving,
    publishKpi,
    unpublish,
    publishReportsSnapshot,
    publishDashboardConfig,
    refresh: _load,
  };
}

/* ════════════════════════════════════════════════════════════
   useDecideurData — côté DÉCIDEUR
════════════════════════════════════════════════════════════ */
export function useDecideurData() {
  const [sharedKpis,    setSharedKpis]    = useState([]);
  const [sharedReports, setSharedReports] = useState([]);
  const [decisions,     setDecisions]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [newKpiCount,   setNewKpiCount]   = useState(0);
  const prevCount = useRef(0);

  /* ── KPIs : fusion shared_kpis + shared_dashboards ── */
  const loadKpis = useCallback(async () => {
    const [
      { data: kpisData,  error: kpisError  },
      { data: dashData,  error: dashError  },
    ] = await Promise.all([
      supabase.from("shared_kpis").select("*").order("published_at", { ascending: false }),
      supabase.from("shared_dashboards").select("*").eq("type", "kpi").order("created_at", { ascending: false }),
    ]);

    if (kpisError) console.error("loadKpis error:", kpisError);
    if (dashError) console.error("loadDashKpis error:", dashError);

    const fromKpis = kpisData || [];
    const fromDash = (dashData || []).map(normalizeDashboardKpi);

    // Dédoublonnage : shared_kpis est prioritaire
    const kpisNames = new Set(fromKpis.map(k => k.name));
    const merged = [
      ...fromKpis,
      ...fromDash.filter(k => !kpisNames.has(k.name)),
    ];

    if (prevCount.current > 0 && merged.length > prevCount.current) {
      setNewKpiCount(merged.length - prevCount.current);
    }
    prevCount.current = merged.length;
    setSharedKpis(merged);
  }, []);

  /* ── Rapports ── */
  const loadReports = useCallback(async () => {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.error("loadReports error:", error); return; }
    setSharedReports(data || []);
  }, []);

  /* ── Décisions ── */
  const loadDecisions = useCallback(async () => {
    const { data, error } = await supabase
      .from("decideur_decisions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.error("loadDecisions error:", error); return; }
    setDecisions(data || []);
  }, []);

  /* ── Chargement global ── */
  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadKpis(), loadReports(), loadDecisions()]);
    setLoading(false);
  }, [loadKpis, loadReports, loadDecisions]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 10_000);
    return () => clearInterval(interval);
  }, [loadAll]);

  /* ── CRUD Décisions ── */
  const saveDecision = useCallback(async (decision) => {
    const payload = {
      title:      decision.title,
      type:       decision.type,
      content:    decision.content,
      priority:   decision.priority,
      kpi_ref:    decision.kpi_ref || null,
      status:     "Brouillon",
      created_by: "Décideur",
    };
    const { data, error } = await supabase
      .from("decideur_decisions")
      .insert([payload])
      .select()
      .single();
    if (error) { console.error("saveDecision error:", error); return null; }
    setDecisions(prev => [data, ...prev]);
    return data;
  }, []);

  const updateDecisionStatus = useCallback(async (id, status) => {
    const { error } = await supabase
      .from("decideur_decisions")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { console.error("updateDecision error:", error); return; }
    setDecisions(prev =>
      prev.map(d => d.id === id ? { ...d, status } : d)
    );
  }, []);

  const deleteDecision = useCallback(async (id) => {
    const { error } = await supabase
      .from("decideur_decisions")
      .delete()
      .eq("id", id);
    if (error) { console.error("deleteDecision error:", error); return; }
    setDecisions(prev => prev.filter(d => d.id !== id));
  }, []);

  const dismissNewKpis = useCallback(() => setNewKpiCount(0), []);

  return {
    sharedKpis,
    sharedReports,
    sharedStats: null,
    decisions,
    loading,
    newKpiCount,
    dismissNewKpis,
    saveDecision,
    updateDecisionStatus,
    deleteDecision,
    refresh: loadAll,
  };
}