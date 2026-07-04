import { useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabaseClient';

// ═══════════════════════════════════════════════════════════════════
// HOOK PRINCIPAL
// ═══════════════════════════════════════════════════════════════════
export function useSharedDashboard() {
  const [published, setPublished] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('shared_dashboard')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (mounted) setPublished(data || []);
      } catch (err) {
        console.warn('[useSharedDashboard] Table non trouvée ou hors ligne. Fallback localStorage.');
        if (mounted) {
          const local = JSON.parse(localStorage.getItem('shared_dashboard') || '[]');
          setPublished(local);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const publishKpi = useCallback(async (item) => {
    const payload = { ...item, created_at: new Date().toISOString() };
    try {
      const { data, error } = await supabase
        .from('shared_dashboard')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      setPublished(prev => [data, ...prev]);
      return { success: true, data };
    } catch (err) {
      console.warn('[publishKpi] Erreur Supabase. Sauvegarde locale.');
      const local = [...published, { ...payload, id: Date.now() }];
      localStorage.setItem('shared_dashboard', JSON.stringify(local));
      setPublished(local);
      return { success: true };
    }
  }, [published]);

  const unpublish = useCallback(async (id) => {
    try {
      await supabase.from('shared_dashboard').delete().eq('id', id);
      setPublished(prev => prev.filter(p => p.id !== id));
      return { success: true };
    } catch (err) {
      console.warn('[unpublish] Erreur Supabase. Suppression locale.');
      const local = published.filter(p => p.id !== id);
      localStorage.setItem('shared_dashboard', JSON.stringify(local));
      setPublished(local);
      return { success: true };
    }
  }, [published]);

  return { published, publishKpi, unpublish, loading };
}

// ═══════════════════════════════════════════════════════════════════
// ✅ EXPORT MANQUANT CORrigé
// ═══════════════════════════════════════════════════════════════════
export const extractKpiValue = (item) => {
  if (item == null) return 0;
  const val = Number(item.value);
  return Number.isFinite(val) ? val : 0;
};