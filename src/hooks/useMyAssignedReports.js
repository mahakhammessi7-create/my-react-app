// hooks/useMyAssignedReports.js
// Pour le Chargé d'étude : voit en temps réel les rapports qui lui sont assignés

import { useEffect, useState, useCallback } from "react";

import supabase from '../lib/supabaseClient';

/**
 * useMyAssignedReports
 * @param {number} currentUserId - l'ID du chargé d'étude connecté
 */
export function useMyAssignedReports(currentUserId) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMyReports = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("reports")
      .select(`
        *,
        client:users!reports_user_id_fkey(id, full_name, email, company_name)
      `)
      .eq("assigned_to", currentUserId)
      .eq("status", "assigné")
      .order("upload_date", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setReports(data || []);
    }
    setLoading(false);
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    fetchMyReports();

    // Écoute uniquement les rapports assignés à CET utilisateur
    const channel = supabase
      .channel(`charge-etude-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "reports",
          filter: `assigned_to=eq.${currentUserId}`,
        },
        async (payload) => {
          if (payload.new.status === "assigné") {
            // Nouveau rapport assigné → l'ajouter à la liste
            const { data } = await supabase
              .from("reports")
              .select(`
                *,
                client:users!reports_user_id_fkey(id, full_name, email, company_name)
              `)
              .eq("id", payload.new.id)
              .single();

            if (data) {
              setReports((prev) => {
                const exists = prev.some((r) => r.id === data.id);
                if (exists) return prev.map((r) => (r.id === data.id ? data : r));
                return [data, ...prev];
              });
            }
          } else {
            // Le statut a changé (validé, clôturé...) → le retirer de la liste
            setReports((prev) => prev.filter((r) => r.id !== payload.new.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, fetchMyReports]);

  /**
   * Le chargé d'étude valide un rapport
   * @param {number} reportId
   */
  const validateReport = async (reportId) => {
    const { error } = await supabase
      .from("reports")
      .update({
        status: "validé",
        validated_by: currentUserId,
        validation_date: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (!error) {
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    }
    return { success: !error, error: error?.message };
  };

  return { reports, loading, error, validateReport, refetch: fetchMyReports };
}