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
export { useRealtimeNotifications } from './useRealtimeNotifications';

// ============================================
// Authentication & Security
// ============================================
export { useAuth } from './useAuth';
export { useNewDeviceDetection } from './useNewDeviceDetection';
export { useMFA } from './useMFA';
export { useReauth } from './useReauth';
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
export { useCRUD } from './useCRUD';
export { useSavedFilters } from './useSavedFilters';
export { useVersions } from './useVersions';
export { useDuplicate } from './useDuplicate';
export { useInfiniteScroll } from './useInfiniteScroll';
export { useFulltextSearch, useGlobalSearch } from './useFulltextSearch';
export { useSoftDelete } from './useSoftDelete';
export { useBulkActions } from './useBulkActions';
export { useActivityLog, useRecentActivity } from './useActivityLog';
export { useComments } from './useComments';
export { useImageUpload } from './useImageUpload';
export { useEntityHistory } from './useEntityHistory';
export { useExport } from './useExport';
export { useExportData } from './useExportData';
export { useImportData } from './useImportData';
export { useAuditLogs } from './useAuditLogs';

// ============================================
// Premium UX Hooks
// ============================================
export { useKeyboardShortcut, useGlobalShortcuts, useShortcutsDialog, shortcutsList, formatShortcut } from './useKeyboardShortcuts';
export { useUndoRedo, useUndoManager } from './useUndoRedo';
export { useOptimisticMutation, createOptimisticListHelpers, useOptimisticCounter } from './useOptimisticUpdates';

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
export { useN8n } from './useN8n';
export { useBitrix24 } from './useBitrix24';
export { useLalamoveTracking } from './useLalamoveTracking';
export { useTimezone } from './useTimezone';
export { usePushNotifications } from './usePushNotifications';
export { useNotifications } from './useNotifications';
export { useNotificationPreferences } from './useNotificationPreferences';
export { useIntegrationValidation } from './useIntegrationValidation';

// ============================================
// Form & Auto-Save
// ============================================
export { useAutoSave } from './useAutoSave';
export { useForm } from './useForm';

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
// Mentions
// ============================================
export { useMentions } from './useMentions';

// ============================================
// Re-exports for compatibility
// ============================================
export { useIsMobile } from './use-mobile';
export { useToast, toast } from './use-toast';
