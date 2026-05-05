// hooks/useAssignReport.js
// Permet au Responsable d'assigner un rapport à un Chargé d'étude

import { useState } from "react";
import supabase from '../lib/supabaseClient';

/**
 * useAssignReport
 * Retourne :
 *  - assignReport(reportId, chargeEtudeId) → assigne le rapport
 *  - chargesEtude → liste des utilisateurs avec rôle "charge_etude"
 *  - fetchChargesEtude() → recharge la liste
 *  - loading, error
 */
export function useAssignReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chargesEtude, setChargesEtude] = useState([]);

  // Charge tous les utilisateurs "charge_etude" disponibles
  const fetchChargesEtude = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email, role")
      .or("role.eq.charge-etude,role.eq.charge_etude,role.ilike.%charge%")
      .order("full_name");

    console.log("Charges étude found:", data, error); // debug

    if (!error) {
      setChargesEtude(data || []);
    } else {
      setError(error.message);
    }
    setLoading(false);
  };

  /**
   * Assigne un rapport à un chargé d'étude
   * @param {number} reportId - l'ID du rapport à assigner
   * @param {number} chargeEtudeId - l'ID du chargé d'étude
   * @returns {{ success: boolean, data?: object, error?: string }}
   */
  const assignReport = async (reportId, chargeEtudeId) => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("reports")
      .update({
        assigned_to: chargeEtudeId,
        status: "assigned", // Change this to match your DB status value
        assigned_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .select()
      .single();

    setLoading(false);

    if (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }

    // Créer une notification pour le chargé d'étude
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: chargeEtudeId,
      message: `Un nouveau rapport vous a été assigné (#${reportId})`,
      report_id: reportId,
      is_read: false,
      created_at: new Date().toISOString(),
    });

    if (notifError) {
      console.warn("Notification non créée:", notifError);
    }

    return { success: true, data };
  };

  return {
    assignReport,
    fetchChargesEtude,
    chargesEtude,
    loading,
    error,
  };
}