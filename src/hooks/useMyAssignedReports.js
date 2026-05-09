import { useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabaseClient'; // adapter le chemin

export const useMyAssignedReports = (userId, onNewAssignment = null) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const fetchAssignedReports = useCallback(async () => {
  if (!userId) { setLoading(false); return; }

  console.log('🔍 Fetching reports pour userId:', userId);

  const { data, error: sbError } = await supabase
    .from('reports')
    .select('*')
    .eq('assigned_to', userId)          // ← integer, pas email
    .order('upload_date', { ascending: false });

  if (sbError) {
    console.error('❌ Supabase error:', sbError);
    setReports([]);
  } else {
    console.log('✅ Rapports:', data?.length, data);
    setReports(data || []);
  }
  setLoading(false);
}, [userId]);

  useEffect(() => {
    fetchAssignedReports();
    const interval = setInterval(fetchAssignedReports, 30000);
    return () => clearInterval(interval);
  }, [fetchAssignedReports]);

  // Realtime Supabase subscription
  useEffect(() => {
    const stored = localStorage.getItem('user');
    const email  = stored ? JSON.parse(stored)?.email : null;
    if (!email) return;

    const channel = supabase
      .channel('my-reports')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reports',
        filter: `assigned_to=eq.${email}`
      }, (payload) => {
        console.log('🔔 Realtime update:', payload);
        if (payload.eventType === 'UPDATE' && payload.new?.assigned_to === email) {
          onNewAssignment?.(payload.new);
        }
        fetchAssignedReports();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId, fetchAssignedReports, onNewAssignment]);

  const validateReport = useCallback(async (reportId) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'verified', validated_by: userId, validation_date: new Date().toISOString() })
        .eq('id', reportId);
      if (error) return { success: false, error: error.message };
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'verified' } : r));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [userId]);

  const rejectReport = useCallback(async (reportId, reason = '') => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'rejected' })
        .eq('id', reportId);
      if (error) return { success: false, error: error.message };
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'rejected' } : r));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [userId]);

  return { reports, loading, error, validateReport, rejectReport, refetch: fetchAssignedReports };
};

export default useMyAssignedReports;