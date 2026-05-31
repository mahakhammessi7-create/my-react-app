// hooks/useSupabaseReports.js

import { useState, useEffect, useCallback, useRef } from "react";
import supabase from '../lib/supabaseClient'; // chemin corrigé depuis src/hooks/

const REPORTS_COLUMNS = `
  id, upload_date, status,
  organism_name, organism_sector,
  compliance_score, is_compliant, maturity_level, risk_score,
  assigned_charge, assigned_charge_name, assigned_at, assigned_by,
  validated_by, validated_at, validator_name,
  rejected_by, rejection_reason, rejected_at,
  cloture_at, cloture_by, cloture_name,
  has_rssi, has_pssi, has_pca, has_pra,
  has_risk_analysis, security_committee,
  security_budget, security_budget_pct,
  staff_ssi_trained_pct,
  pca_test_done, restore_test_success_pct, rto_hours, rpo_hours,
  critical_systems_covered,
  total_workstations, eol_workstations,
  total_servers, eol_servers,
  patch_compliance_pct, antivirus_coverage_pct,
  vuln_scan_done, critical_vulns_open,
  has_firewall, has_ids_ips, siem_coverage_pct,
  mfa_enabled, encryption_at_rest, encryption_in_transit,
  network_segmentation, pentest_done,
  incidents_count, incidents_resolved_pct,
  backup_policy_exists, backup_tested, backup_offsite,
  backup_encrypted, backup_coverage_pct,
  has_datacenter, dc_tier_level,
  dc_access_control, dc_fire_suppression, dc_ups_redundancy,
  dc_cooling_redundancy, dc_cctv,
  iso27001_certified, regulatory_compliant,
  data_classification, gdpr_dpo_appointed,
  audit_internal_done, last_audit_date, next_audit_date,
  maturity_state, security_indicators, compliance_details,
  user_count, file_name, file_path
`;

function mapStatus(s) {
  const map = {
    "déposé":       "déposé",
    "assigné":      "affecté",
    "valide_tech":  "validé",
    "valide_final": "validé",
    "validé":       "validé",
    "rejete":       "rejeté",
    "clôturé":      "clôturé",
  };
  return map[s] ?? s;
}

function normalizeReport(r) {
  return {
    ...r,
    sector:               r.organism_sector,
    company_name:         r.organism_name,
    assigned_to:          r.assigned_charge_name,
    status:               mapStatus(r.status),
    compliance_score:     r.compliance_score     ?? 0,
    maturity_level:       r.maturity_level        ?? 0,
    critical_vulns_open:  r.critical_vulns_open   ?? 0,
    total_servers:        r.total_servers          ?? 0,
    eol_servers:          r.eol_servers            ?? 0,
    eol_workstations:     r.eol_workstations       ?? 0,
    patch_compliance_pct: r.patch_compliance_pct   ?? 0,
    staff_ssi_trained_pct:r.staff_ssi_trained_pct  ?? 0,
    dc_tier_level:        r.dc_tier_level           ?? 0,
    has_rssi:             r.has_rssi  ?? false,
    has_pssi:             r.has_pssi  ?? false,
    has_pca:              r.has_pca   ?? false,
    has_pra:              r.has_pra   ?? false,
  };
}

/* ── useSupabaseReports ── */
export function useSupabaseReports({
  pollingInterval = 30000,
  filterStatus    = "all",
  filterSector    = "all",
  filterAssigned  = "",
} = {}) {
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const intervalRef             = useRef(null);

  const fetchReports = useCallback(async () => {
    try {
      let query = supabase
        .from("reports")
        .select(REPORTS_COLUMNS)
        .order("upload_date", { ascending: false });

      if (filterStatus   && filterStatus   !== "all") query = query.eq("status",               filterStatus);
      if (filterSector   && filterSector   !== "all") query = query.eq("organism_sector",       filterSector);
      if (filterAssigned && filterAssigned !== "")    query = query.eq("assigned_charge_name",  filterAssigned);

      const { data, error: sbError } = await query;
      if (sbError) throw sbError;

      setReports((data || []).map(normalizeReport));
      setLastSync(new Date().toLocaleTimeString("fr-FR"));
      setError(null);
    } catch (err) {
      console.error("[useSupabaseReports]", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterSector, filterAssigned]); // dépendances explicites — plus de warning

  useEffect(() => { setLoading(true); fetchReports(); }, [fetchReports]);

  useEffect(() => {
    intervalRef.current = setInterval(fetchReports, pollingInterval);
    return () => clearInterval(intervalRef.current);
  }, [fetchReports, pollingInterval]);

  useEffect(() => {
    const channel = supabase
      .channel("reports-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, fetchReports)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchReports]);

  return { reports, loading, error, lastSync, refresh: fetchReports };
}

/* ── useSupabaseKpis ── */
export function useSupabaseKpis() {
  const [kpis, setKpis]       = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchKpis = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("kpis")
        .select("*")
        .order("published_at", { ascending: false });
      if (error) throw error;
      setKpis(data || []);
    } catch (err) {
      console.warn("[useSupabaseKpis]", err.message);
      setKpis([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKpis(); }, [fetchKpis]);

  useEffect(() => {
    const channel = supabase
      .channel("kpis-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "kpis" }, fetchKpis)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchKpis]);

  return { kpis, loading, refresh: fetchKpis };
}

/* ── useSupabaseDecisions ── */
export function useSupabaseDecisions() {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading]     = useState(true);

  const fetchDecisions = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("decisions")
        .select("*")
        .order("created_at", { ascending: false });
      setDecisions(data || []);
    } catch (err) {
      console.warn("[useSupabaseDecisions]", err.message);
      setDecisions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDecisions(); }, [fetchDecisions]);

  const saveDecision = async (form) => {
    const { data, error } = await supabase
      .from("decisions")
      .insert([{ ...form, status: "Brouillon", created_at: new Date().toISOString() }])
      .select().single();
    if (!error) { await fetchDecisions(); return data; }
    console.error("[saveDecision]", error.message);
    return null;
  };

  const updateDecisionStatus = async (id, status) => {
    await supabase.from("decisions").update({ status }).eq("id", id);
    await fetchDecisions();
  };

  const deleteDecision = async (id) => {
    await supabase.from("decisions").delete().eq("id", id);
    await fetchDecisions();
  };

  return { decisions, loading, saveDecision, updateDecisionStatus, deleteDecision, refresh: fetchDecisions };
}

/* ── useDecideurData (remplace useSharedDashboard) ── */
export function useDecideurData() {
  const { reports, loading: lR, lastSync, refresh: rR } = useSupabaseReports();
  const { kpis: sharedKpis, loading: lK, refresh: rK }  = useSupabaseKpis();
  const {
    decisions, loading: lD,
    saveDecision, updateDecisionStatus, deleteDecision, refresh: rD,
  } = useSupabaseDecisions();

  const refresh = useCallback(() => { rR(); rK(); rD(); }, [rR, rK, rD]);

  return {
    sharedReports: reports,
    sharedKpis,
    decisions,
    loading: lR || lK || lD,
    lastSync,
    saveDecision,
    updateDecisionStatus,
    deleteDecision,
    refresh,
  };
}

/* ── extractKpiValue ── */
export function extractKpiValue(kpi) {
  if (!kpi) return 0;
  return parseFloat(kpi.value ?? kpi.current_value ?? kpi.computed_value ?? 0) || 0;
}