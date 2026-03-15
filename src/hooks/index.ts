// Hooks - barrel export
// ============================================

// ============================================
// Core State Management
// ============================================
export { usePagination } from './usePagination';
export { useFilters } from './useFilters';
export { useSorting } from './useSorting';
export { useDebounce } from './useDebounce';
export { useLocalStorage } from './useLocalStorage';
export { useMediaQuery, useIsTablet, useIsDesktop, usePrefersDarkMode, usePrefersReducedMotion } from './useMediaQuery';
export { useSearch } from './useSearch';

// ============================================
// Realtime & Sync
// ============================================
export { useRealtime } from './useRealtime';
export { useOnlineStatus } from './useOnlineStatus';

// ============================================
// Authentication & Security
// ============================================
export { useAuth } from './useAuth';
export { useNewDeviceDetection } from './useNewDeviceDetection';
export { useMFA } from './useMFA';
export { useSessionTimeout } from './useSessionTimeout';
export { usePermissions } from './usePermissions';
export { useRole } from './useRole';
export { useWebAuthn } from './useWebAuthn';
export { useDeviceSessions } from './useDeviceSessions';
export { useSecurityEvents } from './useSecurityEvents';
export { useSecurityPushNotifications } from './useSecurityPushNotifications';
export { useRateLimitLogs } from './useRateLimitLogs';

// ============================================
// CRUD Operations
// ============================================
export { useGlobalSearch } from './useGlobalSearch';
export { useBulkActions } from './useBulkActions';
export { useComments } from './useComments';
export { useImageUpload } from './useImageUpload';
export { useEntityHistory } from './useEntityHistory';
export { useExport } from './useExport';
export { useImportData } from './useImportData';
export { useAuditLogs } from './useAuditLogs';
export { useDocumentUpload } from './useDocumentUpload';

// ============================================
// Premium UX Hooks
// ============================================
export { useKeyboardShortcut, useGlobalShortcuts, useShortcutsDialog, shortcutsList, formatShortcut } from './useKeyboardShortcuts';

// ============================================
// Dashboard & Analytics
// ============================================
export { useDrillDown } from './useDrillDown';
export { useFavoriteMetrics, AVAILABLE_METRICS } from './useFavoriteMetrics';
export { useKPIBenchmark } from './useKPIBenchmark';
export { useDashboardWidgets } from './useDashboardWidgets';
export { useDashboardMetrics } from './useDashboardMetrics';
export { useAnalytics } from './useAnalytics';
export { useTrackingAnalytics } from './useTrackingAnalytics';

// ============================================
// Gamification
// ============================================
export { useGamification } from './useGamification';
export { useOnboarding } from './useOnboarding';
export { useAchievementNotifications } from './useAchievementNotifications';

// ============================================
// Core Entity Hooks
// ============================================
export { useTransportadoraRotas } from './useTransportadoraRotas';
export { useRodonavesTracking, RODONAVES_STATUS_MAP } from './useRodonavesTracking';

// ============================================
// Integration Hooks
// ============================================
export { useLalamoveTracking } from './useLalamoveTracking';
export { useTimezone } from './useTimezone';
export { usePushNotifications } from './usePushNotifications';
export { useNotifications } from './useNotifications';
export { useNotificationPreferences } from './useNotificationPreferences';
export { useIntegrationValidation } from './useIntegrationValidation';
export { useWhatsAppNotification } from './useWhatsAppNotification';
export { useMelhorEnvio } from './useMelhorEnvio';

// ============================================
// Logistics & Business
// ============================================
export { useSLAMetrics } from './useSLAMetrics';
export { useSLANotifications } from './useSLANotifications';
export { useLogisticsCosts } from './useLogisticsCosts';
export { useLogisticsCalendar } from './useLogisticsCalendar';
export { useCostAlerts } from './useCostAlerts';
export { useDelayPrediction } from './useDelayPrediction';
export { useDeliveryRoutes } from './useDeliveryRoutes';
export { useFreightQuotation } from './useFreightQuotation';
export { useSmartCarrierSelection } from './useSmartCarrierSelection';
export { useSmartAlerts } from './useSmartAlerts';
export { useBoxManagement } from './useBoxManagement';
export { useConciliacao } from './useConciliacao';
export { useScheduledReports } from './useScheduledReports';
export { useBusinessRules } from './useBusinessRules';
export { useGeocoding } from './useGeocoding';

// ============================================
// Scanner & QR
// ============================================
export { useQRScanner } from './useQRScanner';

// ============================================
// Prefetch
// ============================================
export { usePrefetch } from './usePrefetch';

// ============================================
// Re-exports for compatibility
// ============================================
export { useIsMobile } from './use-mobile';
export { useToast, toast } from './use-toast';
