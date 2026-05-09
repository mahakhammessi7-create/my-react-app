import { useState, useEffect, useCallback } from 'react';
import API from '../services/api';

/**
 * Hook pour charger, ajouter et supprimer les annotations d'un rapport.
 * Chaque annotation a : { id, type, target, text, author, created_at }
 * type = "remarque" | "reserve" | "recommandation"
 */
export function useAnnotations(reportId) {
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  // ── Charger les annotations ────────────────────────────────────────────────
  const fetchAnnotations = useCallback(async () => {
    if (!reportId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(`/reports/${reportId}/annotations`);
      setAnnotations(res.data || []);
    } catch (err) {
      console.error('useAnnotations fetch error:', err);
      setError('Impossible de charger les annotations.');
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => { fetchAnnotations(); }, [fetchAnnotations]);

  // ── Ajouter une annotation ─────────────────────────────────────────────────
  const addAnnotation = useCallback(async ({ type, target, text }) => {
    if (!text?.trim()) return { success: false, error: 'Le texte est obligatoire.' };
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const res  = await API.post(`/reports/${reportId}/annotations`, {
        type,
        target,
        text: text.trim(),
        author: user.full_name || user.username || 'Chargé d\'Étude',
      });
      // Ajouter optimistiquement en tête de liste
      setAnnotations(prev => [res.data, ...prev]);
      return { success: true };
    } catch (err) {
      console.error('useAnnotations add error:', err);
      return { success: false, error: 'Erreur lors de l\'ajout.' };
    }
  }, [reportId]);

  // ── Supprimer une annotation ───────────────────────────────────────────────
  const deleteAnnotation = useCallback(async (annotationId) => {
    try {
      await API.delete(`/reports/${reportId}/annotations/${annotationId}`);
      setAnnotations(prev => prev.filter(a => a.id !== annotationId));
      return { success: true };
    } catch (err) {
      console.error('useAnnotations delete error:', err);
      return { success: false, error: 'Erreur lors de la suppression.' };
    }
  }, [reportId]);

  // ── Compteurs rapides ──────────────────────────────────────────────────────
  const counts = {
    remarque:       annotations.filter(a => a.type === 'remarque').length,
    reserve:        annotations.filter(a => a.type === 'reserve').length,
    recommandation: annotations.filter(a => a.type === 'recommandation').length,
    total:          annotations.length,
  };

  return { annotations, loading, error, counts, addAnnotation, deleteAnnotation, refetch: fetchAnnotations };
}