// hooks/useMyAssignedReports.js
// Status values match DB constraint: 'déposé' | 'assigné' | 'validé' | 'clôturé'

import { useState, useEffect, useCallback, useRef } from 'react';
import supabase from '../lib/supabaseClient';
import { normalizeStatus } from '../lib/statusHelper';

export const useMyAssignedReports = (userId, onNewAssignment = null) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const onNewAssignmentRef = useRef(onNewAssignment);
  useEffect(() => { onNewAssignmentRef.current = onNewAssignment; }, [onNewAssignment]);

  const prevIdsRef = useRef(new Set());
  const pollingRef = useRef(null);

  const fetchAssignedReports = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const { data, error: sbError } = await supabase
        .from('reports')
        .select('*')
        .eq('assigned_charge', userId)
        .order('upload_date', { ascending: false });

      if (sbError) throw new Error(sbError.message);

      const incoming = (data || []).map(r => ({
        ...r,
        status: normalizeStatus(r.status),
      }));
      const incomingIds = new Set(incoming.map(r => r.id));
      if (prevIdsRef.current.size > 0) {
        incoming
          .filter(r => !prevIdsRef.current.has(r.id))
          .forEach(r => onNewAssignmentRef.current?.(r));
      }
      prevIdsRef.current = incomingIds;
      setReports(incoming);
      setError(null);
    } catch (err) {
      console.error('useMyAssignedReports:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAssignedReports();
    pollingRef.current = setInterval(fetchAssignedReports, 15_000);
    return () => clearInterval(pollingRef.current);
  }, [fetchAssignedReports]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`my-reports-user-${userId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'reports', filter: `assigned_charge=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') onNewAssignmentRef.current?.(payload.new);
          fetchAssignedReports();
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [userId, fetchAssignedReports]);

  // ── Validate → 'valide_tech' (Appelle le backend pour les notifications) ──
  const validateReport = useCallback(async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      
      const res = await fetch(`${API_BASE}/reports/${reportId}/valider-tech`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur lors de la validation technique');
      }

      const now = new Date().toISOString();
      setReports(prev => prev.map(r =>
        r.id === reportId ? { ...r, status: 'en_validation', reviewed_at: now } : r
      ));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [userId]);

  // ── Reject → 'clôturé' ───────────────────────────────────────────────────
  const rejectReport = useCallback(async (reportId) => {
    try {
      const now = new Date().toISOString();
      const { error: e } = await supabase
        .from('reports')
        .update({ status: 'clôturé', reviewed_at: now })
        .eq('id', reportId);
      if (e) throw new Error(e.message);

      await supabase.from('notifications').insert({
        type: 'report_closed', report_id: reportId, created_by: userId,
        message: `Le rapport #${reportId} a été clôturé.`, read: false,
      }).throwOnError().catch(() => {});

      setReports(prev => prev.map(r =>
        r.id === reportId ? { ...r, status: 'clôturé', reviewed_at: now } : r
      ));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [userId]);

  return { reports, loading, error, validateReport, rejectReport, refetch: fetchAssignedReports };
};

export default useMyAssignedReports;