import { useState, useEffect, useCallback } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export function useDuckDbDecideur() {
  const [sharedKpis, setSharedKpis]   = useState([]);
  const [decisions,  setDecisions]    = useState([]);
  const [loading,    setLoading]      = useState(true);
  const [error,      setError]        = useState(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [kpiRes, decRes] = await Promise.all([
        fetch(`${API}/marts/mart_kpis?limit=500`),
        fetch(`${API}/marts/mart_decisions?limit=500`),
      ]);

      if (!kpiRes.ok) throw new Error(`KPIs: HTTP ${kpiRes.status}`);
      if (!decRes.ok) throw new Error(`Decisions: HTTP ${decRes.status}`);

      const [kpiJson, decJson] = await Promise.all([
        kpiRes.json(), decRes.json()
      ]);

      setSharedKpis(kpiJson.data || []);
      setDecisions(decJson.data  || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const saveDecision = async (form) => {
    const res = await fetch(`${API}/decisions`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(form),
    });
    if (!res.ok) return null;
    await refresh();
    return await res.json();
  };

  const updateDecisionStatus = async (id, status) => {
    await fetch(`${API}/decisions/${id}/status`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status }),
    });
    await refresh();
  };

  const deleteDecision = async (id) => {
    await fetch(`${API}/decisions/${id}`, { method: "DELETE" });
    await refresh();
  };

  return {
    sharedKpis, decisions, loading, error, refresh,
    saveDecision, updateDecisionStatus, deleteDecision,
  };
}