import { useState, useEffect, useCallback } from 'react';
import { getAuthToken } from '../lib/auth';

const API_BASE = 'http://localhost:5000/api/reports';

export function useAnnotations(reportId) {
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  const token = getAuthToken();

  /* ── Fetch ── */
  const fetchAnnotations = useCallback(async () => {
    if (!reportId) return;
    if (!token) {
      setError('Non autorisé. Veuillez vous connecter.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${reportId}/annotations/detailed`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erreur de chargement');
      const data = await res.json();
      setAnnotations(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [reportId, token]);

  useEffect(() => { fetchAnnotations(); }, [fetchAnnotations]);

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
    try {
      const res = await fetch(`${API_BASE}/${reportId}/annotations/create`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, target: target || 'Général', text: text.trim(), field_path: fieldPath })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Erreur lors de la création');
      }
      const data = await res.json();
      setAnnotations(prev => [data.annotation, ...prev]);
      return { success: true, data: data.annotation };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /* ── Delete ── */
  const deleteAnnotation = async (annotationId) => {
    try {
      const res = await fetch(`${API_BASE}/${reportId}/annotations/delete/${annotationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Erreur suppression');
      }
      setAnnotations(prev => prev.filter(a => a.id !== annotationId));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /* ── Send to responsable ── */
  const sendToResponsable = async (reportIdParam) => {
    const rId = reportIdParam || reportId;
    if (!rId) return { success: false, error: 'Report ID manquant' };
    
    const draftIds = annotations.filter(a => a.status === 'draft').map(a => a.id);
    if (draftIds.length === 0) return { success: false, error: 'Aucune annotation à envoyer' };

    try {
      const res = await fetch(`${API_BASE}/${rId}/annotations/send`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: draftIds })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Erreur envoi');
      }
      
      setAnnotations(prev =>
        prev.map(a => draftIds.includes(a.id) ? { ...a, status: 'sent', sent_at: new Date().toISOString() } : a)
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return {
    annotations,
    loading,
    error,
    counts,
    addAnnotation,
    deleteAnnotation,
    sendToResponsable,
    refresh: fetchAnnotations
  };
}