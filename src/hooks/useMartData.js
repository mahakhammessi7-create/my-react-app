import { useState, useEffect, useRef, useCallback } from "react";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

async function fetchMart(name, signal) {
  const res = await fetch(`${API_BASE}/marts/${name}?limit=1000`, { signal });
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  const json = await res.json();
  return json.data || [];
}

export function useMartData() {
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const abortRef = useRef(null);

  const fetchAll = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    try {
      setLoading(true);
      setError(null);

      // Fetch all 4 sources in parallel
      const [compliance, governance, operations, staging] = await Promise.all([
        fetchMart("mart_compliance", signal),
        fetchMart("mart_governance", signal),
        fetchMart("mart_operations", signal),
        fetchMart("stg_reports",     signal),   // ← ADD THIS
      ]);

      const govMap = {};
      governance.forEach(r => { govMap[r.report_id] = r; });

      const opsMap = {};
      operations.forEach(r => { opsMap[r.report_id] = r; });

      const stgMap = {};
      staging.forEach(r => { stgMap[r.id] = r; });   // ← stg_reports uses "id" not "report_id"

      const merged = compliance.map(r => {
        const gov = govMap[r.report_id] || {};
        const ops = opsMap[r.report_id] || {};
        const stg = stgMap[r.report_id] || {};   // ← base layer with all raw fields

        return {
          ...stg,   // ← first: all raw fields (has_rssi, has_pca, maturity_level, status, etc.)
          ...ops,   // ← then: operational metrics
          ...gov,   // ← then: governance scores
          ...r,     // ← finally: compliance fields win (compliance_score, status, maturity_level)

          // Explicit unified mapping for computeStats
          id:               r.report_id,
          organism_name:    r.organism_name,
          organism_sector:  stg.organism_sector || r.sector,
          status:           r.status            || stg.status    || "déposé",
          compliance_score: r.compliance_score  || 0,
          maturity_level:   r.maturity_level    || stg.maturity_level || 0,

          // Governance booleans — now from stg since gov mart doesn't have them
          has_rssi: stg.has_rssi ?? gov.has_rssi ?? false,
          has_pssi: stg.has_pssi ?? gov.has_pssi ?? false,
          has_pca:  stg.has_pca  ?? gov.has_pca  ?? false,
          has_pra:  stg.has_pra  ?? gov.has_pra  ?? false,
          has_risk_analysis:     stg.has_risk_analysis     ?? false,
          security_committee:    stg.security_committee    ?? gov.security_committee ?? false,
          gdpr_dpo_appointed:    stg.gdpr_dpo_appointed    ?? gov.gdpr_dpo_appointed ?? false,
          staff_ssi_trained_pct: stg.staff_ssi_trained_pct ?? gov.staff_ssi_trained_pct ?? 0,

          // Operational metrics
          critical_vulns_open:  ops.critical_vulns_open  || 0,
          total_servers:        ops.total_servers        || stg.total_servers        || 0,
          eol_servers:          ops.eol_servers          || stg.eol_servers          || 0,
          eol_workstations:     ops.eol_workstations     || stg.eol_workstations     || 0,
          patch_compliance_pct: ops.patch_compliance_pct || stg.patch_compliance_pct || 0,
          dc_tier_level:        ops.dc_tier_level        || stg.dc_tier_level        || 0,

          // Assignment
          assigned_to:     stg.assigned_charge || r.assigned_charge || null,
          assigned_charge: stg.assigned_charge || r.assigned_charge || null,
        };
      });

      setReports(merged);
      setLastSync(new Date().toLocaleTimeString("fr-FR"));
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message);
      console.error("[useMartData]", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5 * 60 * 1000);
    return () => {
      clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [fetchAll]);

  return { reports, loading, error, lastSync, refresh: fetchAll };
}