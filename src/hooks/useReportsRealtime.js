// hooks/useReportsRealtime.js
// Pour le Responsable : écoute les nouveaux rapports en temps réel

import { useEffect, useState, useCallback } from "react";
 // adapte le chemin
import supabase from '../lib/supabaseClient';
/**
 * useReportsRealtime
 * - charge tous les rapports au statut "déposé" au montage
 * - se met à jour en temps réel via Supabase Realtime
 *
 * @param {string} statusFilter - statut à écouter, ex: "déposé"
 */
export function useReportsRealtime(statusFilter = "déposé") {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charge les rapports initiaux
  const fetchReports = useCallback(async () => {
  setLoading(true);
  
  let query = supabase
    .from("reports")
    .select(`
      *,
      client:users!reports_user_id_fkey(id, full_name, email, company_name),
      assigned:users!reports_assigned_to_fkey(id, full_name, email)
    `)
    .order("upload_date", { ascending: false });

  // Only filter by status if provided
  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    setError(error.message);
  } else {
    setReports(data || []);
  }
  setLoading(false);
}, [statusFilter]);
  useEffect(() => {
    console.log("=== useReportsRealtime: useEffect mounted ===");
    console.log("Initial statusFilter:", statusFilter);
    
    fetchReports();

    // Abonnement Realtime sur la table reports
    console.log("Setting up Supabase Realtime subscription...");
    const channel = supabase
      .channel("responsable-reports-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reports",
          filter: `status=eq.${statusFilter}`,
        },
        async (payload) => {
          console.log("=== Realtime INSERT event received ===");
          console.log("New report payload:", payload);
          
          // Un nouveau rapport vient d'être déposé
          // On recharge pour avoir les relations (client, assigned)
          const { data, error } = await supabase
            .from("reports")
            .select(`
              *,
              client:users!reports_user_id_fkey(id, full_name, email, company_name),
              assigned:users!reports_assigned_to_fkey(id, full_name, email)
            `)
            .eq("id", payload.new.id)
            .single();

          if (error) {
            console.error("Error fetching new report details:", error);
          } else if (data) {
            console.log("New report details fetched:", data);
            setReports((prev) => {
              const newReports = [data, ...prev];
              console.log(`Reports list updated: ${newReports.length} total reports`);
              return newReports;
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "reports",
        },
        (payload) => {
          console.log("=== Realtime UPDATE event received ===");
          console.log("Updated report payload:", payload);
          console.log("New status:", payload.new.status);
          console.log("Current status filter:", statusFilter);
          
          // Un rapport a changé de statut → on le retire de la liste si nécessaire
          setReports((prev) => {
            if (payload.new.status !== statusFilter) {
              console.log(`Removing report ${payload.new.id} from list (status changed to ${payload.new.status})`);
              return prev.filter((r) => r.id !== payload.new.id);
            }
            console.log(`Updating report ${payload.new.id} in list`);
            return prev.map((r) =>
              r.id === payload.new.id ? { ...r, ...payload.new } : r
            );
          });
        }
      )
      .subscribe((status) => {
        console.log("Supabase subscription status:", status);
      });

    return () => {
      console.log("Cleaning up Supabase subscription...");
      supabase.removeChannel(channel);
    };
  }, [statusFilter, fetchReports]);

  return { reports, loading, error, refetch: fetchReports };
}