import { useState, useEffect, useCallback, useRef } from 'react';
import supabase from '../lib/supabaseClient';

export function useReportsRealtime(chargeId = null) {
  const [reports,  setReports]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [newCount, setNewCount] = useState(0);
  const initialLoadDone = useRef(false);
  // ← store effectiveChargeId in a ref so the realtime handler
  //   always has the latest value without causing re-renders
  const chargeIdRef = useRef(null);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  })();

  const effectiveChargeId = chargeId ?? (
    String(user.role || '').toLowerCase().includes('charge') ? user.id : null
  );

  chargeIdRef.current = effectiveChargeId;

  const fetchReports = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('reports')
      .select('*')
      .order('upload_date', { ascending: false })
      .limit(5000);

    if (chargeIdRef.current) {
      query = query.eq('assigned_charge', Number(chargeIdRef.current));
    }

    const { data, error } = await query;
    if (!error && data) setReports(data);
    setLoading(false);
    initialLoadDone.current = true;
  }, []); // ← empty deps: fetchReports never changes identity

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
          const applicable = !chargeIdRef.current
            || String(payload.new.assigned_charge) === String(chargeIdRef.current);
          if (applicable) {
            // ← merge into state directly, NO refetch
            setReports(prev => {
              const exists = prev.some(r => r.id === payload.new.id);
              if (exists) return prev;
              return [payload.new, ...prev];
            });
            setNewCount(c => c + 1);
          }
        }

        if (payload.eventType === 'UPDATE') {
          setReports(prev =>
            prev.map(r => r.id === payload.new.id ? payload.new : r)
          );
        }

        if (payload.eventType === 'DELETE') {
          setReports(prev => prev.filter(r => r.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []); // ← empty deps: subscribe once only

  const refresh = useCallback(() => {
    setNewCount(0);
    fetchReports();
  }, [fetchReports]);

  return { reports, loading, newCount, refresh };
}