import { useState, useCallback } from 'react';
import supabase from '../lib/supabaseClient';

// ─── Central API caller ───────────────────────────────────────────────────────
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}

// ─────────────────────────────────────────────────────────────────────────────
export function useAssignReport() {
  const [assigning, setAssigning] = useState(false);
  const [chargesEtude, setChargesEtude] = useState([]);
  const [loadingCharges, setLoadingCharges] = useState(false);

  // ── Fetch chargés d'étude from Express backend ───────────────────────────
  const fetchChargesEtude = useCallback(async () => {
    setLoadingCharges(true);
    try {
      const rows = await apiFetch('/reports/charges-etude');
      const normalized = (rows || []).map(c => ({
        ...c,
        active_count: Number(c.rapports_assignes ?? 0),
      }));
      setChargesEtude(normalized);
    } catch (err) {
      console.error('fetchChargesEtude failed:', err.message);
    } finally {
      setLoadingCharges(false);
    }
  }, []);

  // ── Assign rapport → PATCH /api/reports/:id/assign ───────────────────────
  const assignReport = async (reportId, chargeId) => {
    setAssigning(true);
    try {
      const result = await apiFetch(`/reports/${reportId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ chargeEtudeId: chargeId }),
      });
      return { success: true, report: result.report || null };
    } catch (err) {
      console.error('[assignReport]', err.message);
      return { success: false, error: err.message };
    } finally {
      setAssigning(false);
    }
  };

  // ── Chargé d'étude submits for final review ──────────────────────────────
  const submitToResponsable = async (reportId) => {
    try {
      const result = await apiFetch(`/reports/${reportId}/valider-tech`, {
        method: 'PATCH',
      });
      return { success: true, report: result.report || null };
    } catch (err) {
      console.error('[submitToResponsable]', err.message);
      return { success: false, error: err.message };
    }
  };

  // ── Responsable rejects report ───────────────────────────────────────────
  const rejectReport = async (reportId, reason = '') => {
    try {
      const result = await apiFetch(`/reports/${reportId}/rejeter`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
      return { success: true, report: result.report || null };
    } catch (err) {
      console.error('[rejectReport]', err.message);
      return { success: false, error: err.message };
    }
  };

  // ── Responsable final validation ─────────────────────────────────────────
  const validateFinal = async (reportId, score = null) => {
    try {
      const result = await apiFetch(`/reports/${reportId}/valider-final`, {
        method: 'PATCH',
        body: JSON.stringify({ score }),
      });
      return { success: true, report: result.report || null };
    } catch (err) {
      console.error('[validateFinal]', err.message);
      return { success: false, error: err.message };
    }
  };

  return {
    assignReport,
    submitToResponsable,
    rejectReport,
    validateFinal,
    fetchChargesEtude,
    chargesEtude,
    loadingCharges,
    assigning,
  };
}