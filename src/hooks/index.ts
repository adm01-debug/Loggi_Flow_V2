// Hooks - barrel export
export { usePagination } from './usePagination';
export { useFilters } from './useFilters';
export { useSorting } from './useSorting';
export { useRealtime } from './useRealtime';
export { useComments } from './useComments';
export { useImageUpload } from './useImageUpload';
export { useEntityHistory } from './useEntityHistory';
export { useGamification } from './useGamification';
export { useExport } from './useExport';
export { useAuth } from './useAuth';
export { useKeyboardShortcut, useGlobalShortcuts, useShortcutsDialog, shortcutsList, formatShortcut } from './useKeyboardShortcuts';
export { useDebounce } from './useDebounce';
export { useLocalStorage } from './useLocalStorage';
export { useNewDeviceDetection } from './useNewDeviceDetection';

// CRUD Improvements
export { useSavedFilters } from './useSavedFilters';
export { useVersions } from './useVersions';
export { useDuplicate } from './useDuplicate';
export { useInfiniteScroll } from './useInfiniteScroll';
export { useFulltextSearch, useGlobalSearch } from './useFulltextSearch';
export { useSoftDelete } from './useSoftDelete';

// CRUD Advanced Hooks
export { useBulkActions } from './useBulkActions';
export { useActivityLog, useRecentActivity } from './useActivityLog';

// Real Data Hooks (Production)
export { useAnalyticsReal } from './useAnalyticsReal';
export { useDashboardMetricsReal } from './useDashboardMetricsReal';
export { useSLAMetricsReal } from './useSLAMetricsReal';
export { useLogisticsCostsReal } from './useLogisticsCostsReal';
export { useGamificationReal } from './useGamificationReal';
export { useLalamoveTrackingReal, useLalamoveOrders } from './useLalamoveTrackingReal';
export { useBitrix24SPA, useBitrix24Lalamove, useBitrix24Expedicao, useBitrix24Sync } from './useBitrix24Real';

// Core Entity Hooks (Real)
export { useEntregasReal } from './useEntregasReal';
export { useColetasReal } from './useColetasReal';
export { useTransportadorasReal } from './useTransportadorasReal';

// Integration Hooks (Real)
export { useN8nWorkflows, useN8nTrigger, useN8nLogs } from './useN8nReal';
