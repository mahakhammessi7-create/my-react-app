// hooks/useSharedDashboard.js
// Re-export complet — corrige l'erreur "useSharedDashboard was not found"

export {
  useDecideurData       as useSharedDashboard,  // alias pour ResponsableDashboard.js
  useDecideurData,
  useSupabaseReports,
  useSupabaseKpis,
  useSupabaseDecisions,
  extractKpiValue,
} from "./useSupabaseReports";