// Hooks - barrel export
// ============================================

// ============================================
// Core State Management (Common)
// ============================================
export { usePagination } from './common/usePagination';
export { useFilters } from './common/useFilters';
export { useSorting } from './common/useSorting';
export { useDebounce } from './common/useDebounce';
export { useLocalStorage } from './common/useLocalStorage';
export { useMediaQuery, useIsTablet, useIsDesktop, usePrefersDarkMode, usePrefersReducedMotion } from './common/useMediaQuery';
export { useSearch } from './common/useSearch';
export { useSelection } from './common/useSelection';
export { useBulkActions } from './common/useBulkActions';
export { useComments } from './common/useComments';
export { useExport } from './common/useExport';
export { useImportData } from './common/useImportData';
export { useKeyboardShortcut, useGlobalShortcuts, useShortcutsDialog, shortcutsList, formatShortcut } from './common/useKeyboardShortcuts';
export { useNavigationHistory } from './common/useNavigationHistory';
export { useConfirmExit } from './common/useConfirmExit';
export { useTimezone } from './common/useTimezone';
export { useDensity } from './common/useDensity';
export { useGlobalSearch } from './common/useGlobalSearch';

// ============================================
// Realtime & Sync (Data)
// ============================================
export { useRealtime } from './data/useRealtime';
export { useMemoizedQuery } from './data/useMemoizedQuery';
export { usePrefetch } from './data/usePrefetch';
export { useResilientMutation } from './data/useResilientMutation';
export { useSoftDelete } from './data/useSoftDelete';
export { useDocumentUpload } from './data/useDocumentUpload';
export { useImageUpload } from './data/useImageUpload';

// ============================================
// Authentication (Auth)
// ============================================
export { useAuth, AuthProvider } from './auth/useAuth';
export { useNewDeviceDetection } from './auth/useNewDeviceDetection';
export { useMFA } from './auth/useMFA';
export { useSessionTimeout } from './auth/useSessionTimeout';
export { usePermissions } from './auth/usePermissions';
export { useRole } from './auth/useRole';
export { useWebAuthn } from './auth/useWebAuthn';
export { useDeviceSessions } from './auth/useDeviceSessions';

// ============================================
// Security & Governance (Security)
// ============================================
export { useSecurityEvents } from './security/useSecurityEvents';
export { useRateLimitLogs } from './security/useRateLimitLogs';
export { useFeatureFlags, useFeatureFlag } from './security/useFeatureFlags';
export { useAuditLogs } from './security/useAuditLogs';
export { useEntityHistory } from './security/useEntityHistory';
export { useIntegrationValidation } from './security/useIntegrationValidation';

// ============================================
// Dashboard & Analytics (Analytics)
// ============================================
export { useDrillDown } from './analytics/useDrillDown';
export { useFavoriteMetrics, AVAILABLE_METRICS } from './analytics/useFavoriteMetrics';
export { useKPIBenchmark } from './analytics/useKPIBenchmark';
export { useDashboardWidgets } from './analytics/useDashboardWidgets';
export { useDashboardMetrics } from './analytics/useDashboardMetrics';
export { useAnalytics } from './analytics/useAnalytics';
export { useExecutiveMetrics } from './analytics/useExecutiveMetrics';
export { usePerformanceMonitor } from './analytics/usePerformanceMonitor';
export { useTelemetry } from './analytics/useTelemetry';
export { useScheduledReports } from './analytics/useScheduledReports';

// ============================================
// Gamification
// ============================================
export { useGamification } from './gamification/useGamification';
export { useAchievementNotifications } from './gamification/useAchievementNotifications';
export { useRewardPurchases } from './gamification/useRewardPurchases';

// ============================================
// Notifications
// ============================================
export { useNotifications } from './notifications/useNotifications';
export { useNotificationPreferences } from './notifications/useNotificationPreferences';
export { usePushNotifications } from './notifications/usePushNotifications';
export { useSecurityPushNotifications } from './notifications/useSecurityPushNotifications';
export { useWhatsAppNotification } from './notifications/useWhatsAppNotification';
export { useAudioFeedback } from './notifications/useAudioFeedback';

// ============================================
// Logistics & Business
// ============================================
export { useSLAMetrics } from './logistics/useSLAMetrics';
export { useSLANotifications } from './logistics/useSLANotifications';
export { useLogisticsCosts } from './logistics/useLogisticsCosts';
export { useLogisticsCalendar } from './logistics/useLogisticsCalendar';
export { useCostAlerts } from './logistics/useCostAlerts';
export { useDelayPrediction } from './logistics/useDelayPrediction';
export { useDeliveryRoutes } from './logistics/useDeliveryRoutes';
export { useFreightQuotation } from './logistics/useFreightQuotation';
export { useSmartCarrierSelection } from './logistics/useSmartCarrierSelection';
export { useQuotationFlow } from './logistics/useQuotationFlow';
export { useSmartAlerts } from './logistics/useSmartAlerts';
export { useBoxManagement } from './logistics/useBoxManagement';
export { useConciliacao } from './logistics/useConciliacao';
export { useBusinessRules } from './logistics/useBusinessRules';
export { useTransportadoraRotas } from './logistics/useTransportadoraRotas';
export { useRodonavesTracking, RODONAVES_STATUS_MAP } from './logistics/useRodonavesTracking';
export { useRodonavesWebhook } from './logistics/useRodonavesWebhook';
export { useMelhorEnvio } from './logistics/useMelhorEnvio';
export { useCotacoesFrete } from './logistics/useCotacoesFrete';
export { useCotacoesMulticanal } from './logistics/useCotacoesMulticanal';
export { useFreightIntelligence } from './logistics/useFreightIntelligence';
export { useLogisticaReversaReal } from './logistics/useLogisticaReversaReal';
export { useLogisticsIntelligence } from './logistics/useLogisticsIntelligence';
export { useSLAAlerts } from './logistics/useSLAAlerts';
export { useLalamoveTracking } from './logistics/useLalamoveTracking';
export { useLalamoveOrders } from './logistics/useLalamoveOrders';

// ============================================
// Integrations
// ============================================
export { useEvolutionWhatsApp } from './integrations/useEvolutionWhatsApp';
export { useBitrixEntregaSync } from './integrations/useBitrixEntregaSync';
export { useClientWebhooks } from './integrations/useClientWebhooks';
export { useExternalDbBridge } from './integrations/useExternalDbBridge';
export { useGeocoding } from './integrations/useGeocoding';

// ============================================
// UI & Utilities
// ============================================
export { useIsMobile } from './ui/use-mobile';
export { useToast, toast } from './ui/use-toast';
export { useOnboarding } from './ui/useOnboarding';
export { useQRScanner } from './ui/useQRScanner';
export { useVirtualTable } from './ui/useVirtualTable';
export { useOnlineStatus } from './common/useOnlineStatus';
