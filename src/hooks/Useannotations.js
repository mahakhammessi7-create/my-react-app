import { useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabaseClient';

export function useAnnotations(reportId) {
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  })();

  /* ── Fetch ── */
  const fetchAnnotations = useCallback(async () => {
    if (!reportId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('report_annotations')          // ← table réelle
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: false });

    if (error) setError(error.message);
    else setAnnotations(data || []);
    setLoading(false);
  }, [reportId]);

  useEffect(() => { fetchAnnotations(); }, [fetchAnnotations]);

  /* ── Realtime ── */
  useEffect(() => {
    if (!reportId) return;
    const channel = supabase
      .channel(`report_annotations_${reportId}`)
      .on('postgres_changes', {
        event:  '*',
        schema: 'public',
        table:  'report_annotations',
        filter: `report_id=eq.${reportId}`,
      }, () => fetchAnnotations())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [reportId, fetchAnnotations]);

  /* ── Counts ── */
  const counts = {
    total:          annotations.length,
    remarque:       annotations.filter(a => a.type === 'remarque').length,
    reserve:        annotations.filter(a => a.type === 'reserve').length,
    recommandation: annotations.filter(a => a.type === 'recommandation').length,
    draft:          annotations.filter(a => a.status === 'draft').length,
    sent:           annotations.filter(a => a.status === 'sent').length,
  };

  /* ── Add ── */
  const addAnnotation = async ({ type, target, text, fieldPath }) => {
    if (!reportId || !text?.trim()) return { success: false, error: 'Données invalides' };

    const { data, error } = await supabase
      .from('report_annotations')
      .insert({
        report_id:  Number(reportId),
        type,
        target:     target || 'Général',       // not null
        field_path: fieldPath || null,
        text:       text.trim(),
        author:     user.full_name || user.email || 'Chargé d\'étude',
        author_id:  user.id ? Number(user.id) : null,  // integer
        status:     'draft',
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    setAnnotations(prev => [data, ...prev]);
    return { success: true, data };
  };

  /* ── Delete ── */
  const deleteAnnotation = async (annotationId) => {
    const { error } = await supabase
      .from('report_annotations')
      .delete()
      .eq('id', annotationId);               // id est uuid

    if (!error) setAnnotations(prev => prev.filter(a => a.id !== annotationId));
    return { success: !error, error: error?.message };
  };

  /* ── Send to responsable ──
     1. Marque les annotations draft → sent  (+ sent_at)
     2. Passe le rapport en 'en_validation'
     3. Notifie le responsable via notifications
  */
  const sendToResponsable = async (reportId) => {
    if (!reportId) return { success: false, error: 'Report ID manquant' };

    const drafts   = annotations.filter(a => a.status === 'draft');
    const draftIds = drafts.map(a => a.id);

    if (draftIds.length === 0) return { success: false, error: 'Aucune annotation à envoyer' };

    // 1. Marquer les annotations comme envoyées
    const { error: annError } = await supabase
      .from('report_annotations')
      .update({
        status:  'sent',
        sent_at: new Date().toISOString(),
      })
      .in('id', draftIds);

    if (annError) return { success: false, error: annError.message };

    // 2. Mettre à jour le statut du rapport
    const { error: reportError } = await supabase
      .from('reports')
      .update({
        status:          'en_validation',
        sent_to_resp_at: new Date().toISOString(),
        sent_to_resp_by: user.id ? Number(user.id) : null,
        charge_name:     user.full_name || user.email || null,
      })
      .eq('id', Number(reportId));

    if (reportError) return { success: false, error: reportError.message };

    // 3. Notifier le responsable
    //    On cherche le responsable (role contient 'responsable')
    const { data: responsables } = await supabase
      .from('users')
      .select('id')
      .ilike('role', '%responsable%')
      .limit(1);

    const responsableId = responsables?.[0]?.id;
    if (responsableId) {
      await supabase.from('notifications').insert({
        user_id:           Number(responsableId),        // destinataire
        type:              'rapport_en_validation',
        title:             'Rapport envoyé pour validation',
        message:           `${user.full_name || 'Un chargé d\'étude'} a soumis ${draftIds.length} annotation(s) pour le rapport #${reportId}.`,
        related_report_id: Number(reportId),
        is_read:           false,
      });
    }

    // 4. Sync state local
    setAnnotations(prev =>
      prev.map(a => draftIds.includes(a.id) ? { ...a, status: 'sent', sent_at: new Date().toISOString() } : a)
    );

    return { success: true };
  };

  return {
    annotations,
    loading,
    error,
    counts,
    addAnnotation,
    deleteAnnotation,
    sendToResponsable,
    refresh: fetchAnnotations,
  };
}