export const STATUS_MAP = {
  // Deposited / Initial state
  'déposé': 'déposé',
  'depose': 'déposé',
  
  // Assigned to Charge d'etude
  'assigné': 'assigné',
  'assigne': 'assigné',
  'assigned': 'assigné',
  'affecte': 'assigné',
  'in_progress': 'assigné',
  
  // Technically verified, awaiting QA Validation
  'valide_tech': 'en_validation',
  'validé_tech': 'en_validation',
  'en_validation': 'en_validation',
  'en validation': 'en_validation',
  'envalidation': 'en_validation',
  
  // Finally validated by Responsable QA
  'validé': 'validé',
  'valide': 'validé',
  'validated': 'validé',
  'valide_final': 'validé',
  'validé_final': 'validé',
  
  // Closed / Rejected
  'rejeté': 'clôturé',
  'rejete': 'clôturé',
  'rejected': 'clôturé',
  'clôturé': 'clôturé',
  'cloturé': 'clôturé',
  'cloture': 'clôturé',
};

export const normalizeStatus = (status) => {
  const raw = String(status || 'déposé').toLowerCase().trim();
  return STATUS_MAP[raw] || raw;
};
