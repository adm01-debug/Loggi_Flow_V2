// Hooks - barrel export
// ============================================
// Core State Management
// ============================================
export { usePagination } from './usePagination';
export { useFilters } from './useFilters';
export { useSorting } from './useSorting';
export { useDebounce } from './useDebounce';
export { useLocalStorage } from './useLocalStorage';
export { useMediaQuery } from './useMediaQuery';

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
export { useReauth } from './useReauth';
export { useSessionTimeout } from './useSessionTimeout';
export { usePermissions } from './usePermissions';
export { useRole } from './useRole';

// ============================================
// CRUD Operations
// ============================================
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

// ============================================
// Premium UX Hooks
// ============================================
export { useKeyboardShortcut, useGlobalShortcuts, useShortcutsDialog, shortcutsList, formatShortcut } from './useKeyboardShortcuts';
export { useHapticFeedback } from './useHapticFeedback';
export { useUndoRedo, useUndoManager } from './useUndoRedo';
export { useOptimisticMutation, createOptimisticListHelpers, useOptimisticCounter } from './useOptimisticUpdates';
export { useLongPress, useDoubleTap, useTripleTap, usePinchZoom } from './useGestureHandlers';

// ============================================
// Dashboard & Analytics
// ============================================
export { useDrillDown } from './useDrillDown';
export { useFavoriteMetrics, AVAILABLE_METRICS } from './useFavoriteMetrics';
export { useKPIBenchmark } from './useKPIBenchmark';
export { useDashboardWidgets } from './useDashboardWidgets';

// ============================================
// Gamification
// ============================================
export { useGamification } from './useGamification';
export { useGamificationReal } from './useGamificationReal';
export { useOnboarding } from './useOnboarding';

// ============================================
// Real Data Hooks (Production)
// ============================================
export { useAnalyticsReal } from './useAnalyticsReal';
export { useDashboardMetricsReal } from './useDashboardMetricsReal';
export { useSLAMetricsReal } from './useSLAMetricsReal';
export { useLogisticsCostsReal } from './useLogisticsCostsReal';
export { useLalamoveTrackingReal, useLalamoveOrders } from './useLalamoveTrackingReal';
export { useBitrix24SPA, useBitrix24Lalamove, useBitrix24Expedicao, useBitrix24Sync } from './useBitrix24Real';

// ============================================
// Core Entity Hooks (Real)
// ============================================
export { useEntregasReal } from './useEntregasReal';
export { useColetasReal } from './useColetasReal';
export { useTransportadorasReal } from './useTransportadorasReal';

// ============================================
// Integration Hooks
// ============================================
export { useN8nWorkflows, useN8nTrigger, useN8nLogs } from './useN8nReal';
export { useTimezone } from './useTimezone';
export { usePushNotifications } from './usePushNotifications';
export { useNotifications } from './useNotifications';

// ============================================
// Form & Auto-Save
// ============================================
export { useAutoSave } from './useAutoSave';
export { 
  useNotificationSounds, 
  SoundSettingsProvider, 
  useSoundSettings 
} from './useNotificationSounds';
