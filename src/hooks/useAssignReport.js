// hooks/useAssignReport.js
import { useState } from "react";
import supabase from '../lib/supabaseClient';;

export function useAssignReport() {
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState(null);
  const [chargesEtude, setChargesEtude] = useState([]);

  const fetchChargesEtude = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email, role")
      .or("role.eq.charge-etude,role.eq.charge_etude,role.ilike.%charge%")
      .order("full_name");

    console.log("Charges étude found:", data, error);
    if (!error) setChargesEtude(data || []);
    else setError(error.message);
  };

  const assignReport = async (reportId, chargeEtudeId) => {
  setAssigning(true);
  setError(null);

  try {
    // assigned_to est un integer → stocker l'ID directement
    const { data: updatedReport, error: updateError } = await supabase
      .from('reports')
      .update({
        assigned_to: chargeEtudeId,   // ← integer ID, pas email
        status: 'assigné',
      })
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);

    console.log('✅ Rapport assigné à userId:', chargeEtudeId);

    // Notification
    await supabase.from("notifications").insert({
      user_id: chargeEtudeId,
      message: `Un nouveau rapport vous a été assigné (#${reportId})`,
      report_id: reportId,
      is_read: false,
      created_at: new Date().toISOString(),
    });

    return { success: true, data: updatedReport };

  } catch (err) {
    console.error('❌ assignReport error:', err.message);
    setError(err.message);
    return { success: false, error: err.message };
  } finally {
    setAssigning(false);
  }
};

  return {
    assignReport,
    fetchChargesEtude,
    chargesEtude,
    assigning,   // ← renommé pour correspondre à ResponsableDashboard qui utilise `assigning`
    error,
  };
}