import { useState, useEffect, useCallback, useRef } from 'react';
import supabase from '../lib/supabaseClient';

export function useReportsRealtime(chargeId = null) {
  const [reports,  setReports]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [newCount, setNewCount] = useState(0);
  const initialLoadDone = useRef(false);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  })();

  const effectiveChargeId = chargeId ?? (
    String(user.role || '').toLowerCase().includes('charge') ? user.id : null
  );

  const fetchReports = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('reports')
      .select('*')
      .order('upload_date', { ascending: false });

    if (effectiveChargeId) {
      // assigned_charge est integer dans votre schema
      query = query.eq('assigned_charge', Number(effectiveChargeId));
    }

    const { data, error } = await query;
    if (!error) setReports(data || []);
    setLoading(false);
    initialLoadDone.current = true;
  }, [effectiveChargeId]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  /* ── Realtime ── */
  useEffect(() => {
    const channel = supabase
      .channel('reports_realtime')
      .on('postgres_changes', {
        event:  '*',
        schema: 'public',
        table:  'reports',
      }, (payload) => {
        if (!initialLoadDone.current) return;

        if (payload.eventType === 'INSERT') {
          const applicable = !effectiveChargeId
            || String(payload.new.assigned_charge) === String(effectiveChargeId);
          if (applicable) {
            setReports(prev => [payload.new, ...prev]);
            setNewCount(c => c + 1);
          }
        }
        if (payload.eventType === 'UPDATE') {
          setReports(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
        }
        if (payload.eventType === 'DELETE') {
          setReports(prev => prev.filter(r => r.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [effectiveChargeId]);

  const refresh = useCallback(() => {
    setNewCount(0);
    fetchReports();
  }, [fetchReports]);

  return { reports, loading, newCount, refresh };
}