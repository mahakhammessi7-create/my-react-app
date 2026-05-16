import { useState, useCallback } from 'react';
import supabase from '../lib/supabaseClient';

export function useAssignReport() {
  const [assigning,    setAssigning]    = useState(false);
  const [chargesEtude, setChargesEtude] = useState([]);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  })();

  /* ── Helper : insérer une notification ── */
  const insertNotification = async ({ toUserId, type, title, message, reportId }) => {
    if (!toUserId) return;
    await supabase.from('notifications').insert({
      user_id:           Number(toUserId),     // integer — destinataire
      type:              String(type).slice(0, 50),
      title:             String(title).slice(0, 255),
      message,
      related_report_id: reportId ? Number(reportId) : null,
      is_read:           false,
    });
  };

  /* ── Fetch chargés d'étude ── */
  const fetchChargesEtude = useCallback(async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, role')
      .ilike('role', '%charge%')
      .order('full_name');

    if (error) { console.error('fetchChargesEtude:', error.message); return; }

    // Compter les rapports actifs par chargé
    const enriched = await Promise.all((data || []).map(async (c) => {
      const { count } = await supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_charge', c.id)
        .not('status', 'in', '("validé","clôturé","rejeté")');
      return { ...c, active_count: count || 0 };
    }));

    setChargesEtude(enriched);
  }, []);

  /* ── Assigner un rapport → status: 'assigné' ── */
  const assignReport = async (reportId, chargeId) => {
    setAssigning(true);
    const charge = chargesEtude.find(c => String(c.id) === String(chargeId));

    const { data, error } = await supabase
      .from('reports')
      .update({
        assigned_charge:      Number(chargeId),
        assigned_charge_name: charge?.full_name || null,
        assigned_to:          charge?.full_name || null,
        assigned_at:          new Date().toISOString(),
        assigned_by:          user.id ? Number(user.id) : null,
        status:               'assigné',
      })
      .eq('id', Number(reportId));
      
    if (!error) {
      await insertNotification({
        toUserId: chargeId,
        type:     'rapport_assigné',
        title:    'Nouveau rapport assigné',
        message:  `Le rapport #${reportId} vous a été assigné par ${user.full_name || 'le responsable'}.`,
        reportId,
      });
    }

    setAssigning(false);
    return { success: !error, error: error?.message };
  };

  /* ── Soumettre un rapport pour validation → status: 'en_validation' ── */
  const submitToResponsable = async (reportId) => {
    const { error } = await supabase
      .from('reports')
      .update({
        status:         'en_validation', 
        validated_at:   new Date().toISOString(),
        validated_by:   user.id ? Number(user.id) : null,
        validator_name: user.full_name || null,
      })
      .eq('id', Number(reportId));

    if (!error) {
      // Récupérer l'id du chargé pour notifier
      const { data: report } = await supabase
        .from('reports')
        .select('assigned_charge, company_name')
        .eq('id', Number(reportId))
        .single();

      if (report?.assigned_charge) {
        await insertNotification({
          toUserId: report.assigned_charge,
          type:     'rapport_validé',
          title:    'Rapport validé',
          message:  `Le rapport "${report.company_name || `#${reportId}`}" a été validé par ${user.full_name || 'le responsable'}.`,
          reportId,
        });
      }
    }

    return { success: !error, error: error?.message };
  };

  /* ── Rejeter un rapport → status: 'rejeté' ── */
  const rejectReport = async (reportId, reason = '') => {
    const { error } = await supabase
      .from('reports')
      .update({
        status:           'rejeté',
        rejected_at:      new Date().toISOString(),
        rejected_by:      user.id ? Number(user.id) : null,
        rejection_reason: reason || null,
      })
      .eq('id', Number(reportId));

    if (!error) {
      const { data: report } = await supabase
        .from('reports')
        .select('assigned_charge, company_name')
        .eq('id', Number(reportId))
        .single();

      if (report?.assigned_charge) {
        await insertNotification({
          toUserId: report.assigned_charge,
          type:     'rapport_rejeté',
          title:    'Rapport rejeté',
          message:  `Le rapport "${report.company_name || `#${reportId}`}" a été rejeté${reason ? ` : ${reason}` : ''}.`,
          reportId,
        });
      }
    }

    return { success: !error, error: error?.message };
  };

  return {
    assignReport,
    submitToResponsable,
    rejectReport,
    fetchChargesEtude,
    chargesEtude,
    assigning,
  };
}