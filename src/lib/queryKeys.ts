/**
 * QUERY KEYS FACTORY - Centralized query keys for precise cache invalidation.
 */
export const QUERY_KEYS = {
  auth: {
    session: ['auth', 'session'] as const,
    user: ['auth', 'user'] as const,
    profile: (userId: string) => ['auth', 'profile', userId] as const,
    roles: (userId: string) => ['auth', 'roles', userId] as const,
    permissions: (userId: string) => ['auth', 'permissions', userId] as const,
  },
  analytics: {
    dashboard: ['analytics', 'dashboard'] as const,
    metrics: (type: string) => ['analytics', 'metrics', type] as const,
    benchmark: (period: string) => ['analytics', 'benchmark', period] as const,
    telemetry: ['analytics', 'telemetry'] as const,
    kpi: (id: string) => ['analytics', 'kpi', id] as const,
  },
  logistics: {
    entregas: {
      list: (filters: any) => ['logistics', 'entregas', 'list', filters] as const,
      detail: (id: string) => ['logistics', 'entregas', 'detail', id] as const,
      history: (id: string) => ['logistics', 'entregas', 'history', id] as const,
    },
    coletas: {
      list: (filters: any) => ['logistics', 'coletas', 'list', filters] as const,
      detail: (id: string) => ['logistics', 'coletas', 'detail', id] as const,
    },
    transportadoras: {
      list: (filters: any) => ['logistics', 'transportadoras', 'list', filters] as const,
      detail: (id: string) => ['logistics', 'transportadoras', 'detail', id] as const,
      rotas: (id: string) => ['logistics', 'transportadoras', 'rotas', id] as const,
    },
    costs: {
      dashboard: ['logistics', 'costs', 'dashboard'] as const,
      alerts: ['logistics', 'costs', 'alerts'] as const,
    },
  },
  integrations: {
    lalamove: {
      orders: ['integrations', 'lalamove', 'orders'] as const,
      tracking: (id: string) => ['integrations', 'lalamove', 'tracking', id] as const,
    },
    rodonaves: {
      tracking: (id: string) => ['integrations', 'rodonaves', 'tracking', id] as const,
      quotations: ['integrations', 'rodonaves', 'quotations'] as const,
    },
    bitrix: {
      sync: ['integrations', 'bitrix', 'sync'] as const,
      deals: ['integrations', 'bitrix', 'deals'] as const,
    },
  },
  gamification: {
    stats: (userId: string) => ['gamification', 'stats', userId] as const,
    achievements: (userId: string) => ['gamification', 'achievements', userId] as const,
    ranking: ['gamification', 'ranking'] as const,
    rewards: ['gamification', 'rewards'] as const,
  },
  system: {
    settings: ['system', 'settings'] as const,
    webhooks: ['system', 'webhooks'] as const,
    audit: (filters: any) => ['system', 'audit', filters] as const,
    notifications: (userId: string) => ['system', 'notifications', userId] as const,
  },
} as const;
