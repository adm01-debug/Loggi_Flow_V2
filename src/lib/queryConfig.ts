// ============================================
// QUERY CONFIGURATION - Centralized staleTime
// ============================================

/**
 * Standardized staleTime values by data category.
 * Use these constants in all useQuery hooks for consistency.
 */
export const QUERY_STALE_TIME = {
  /** Static/reference data: transportadoras, achievements, permissions (5 min) */
  STATIC: 5 * 60 * 1000,
  
  /** Semi-static data: freight tables, cost alerts, business rules (3 min) */
  SEMI_STATIC: 3 * 60 * 1000,
  
  /** Dashboard/analytics data: metrics, charts, KPIs (1 min) */
  DASHBOARD: 60 * 1000,
  
  /** Dynamic operational data: entregas, coletas, notifications (30s) */
  DYNAMIC: 30 * 1000,
  
  /** Real-time data: tracking, live stats (10s) */
  REALTIME: 10 * 1000,
  
  /** Search results (30s) */
  SEARCH: 30 * 1000,
  
  /** User profile/session data (2 min) */
  USER: 2 * 60 * 1000,
  
  /** Audit/log data (1 min) */
  LOGS: 60 * 1000,
} as const;

export const QUERY_REFETCH_INTERVAL = {
  /** Dashboard auto-refresh (2 min) */
  DASHBOARD: 2 * 60 * 1000,
  
  /** Notifications polling (30s) */
  NOTIFICATIONS: 30 * 1000,
  
  /** SLA metrics (5 min) */
  SLA: 5 * 60 * 1000,
} as const;
