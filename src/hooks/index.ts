// Hooks Index - Export all custom hooks from a single file

// Authentication & User
export { useAuth } from "./useAuth";
export { useGamification, xpForLevel, calculateLevel, calculateLevelProgress } from "./useGamification";

// Data fetching
export { useDashboardMetrics, useRecentAlerts, useTransportadoraPerformance } from "./useDashboardMetrics";
export { useSLAMetrics } from "./useSLAMetrics";
export { useLogisticsCosts } from "./useLogisticsCosts";
export { useCostAlerts } from "./useCostAlerts";
export { useBoxManagement } from "./useBoxManagement";
export { useLogisticsCalendar } from "./useLogisticsCalendar";
export { useFreightQuotation } from "./useFreightQuotation";
export { useDeliveryRoutes } from "./useDeliveryRoutes";
export { useAuditLogs } from "./useAuditLogs";

// Notifications
export { useNotifications, useNotificationBadge } from "./useNotifications";
export { useSLANotifications } from "./useSLANotifications";
export { useAchievementNotifications } from "./useAchievementNotifications";
export { useSmartAlerts } from "./useSmartAlerts";

// Tracking & Maps
export { useLalamoveTracking } from "./useLalamoveTracking";
export { useGeocoding } from "./useGeocoding";
export { useTrackingAnalytics } from "./useTrackingAnalytics";

// UI & UX
export { useDebounce, useDebouncedCallback, useThrottle, useLazyLoad, useLocalPagination } from "./useDebounce";
export { useLocalStorage, useSessionStorage, useSearchHistory, useUserPreferences, useFavorites } from "./useLocalStorage";
export { useClipboard, useClipboardRead, copyToClipboard, CopyButton, CopyableText } from "./useClipboard";
export { useKeyboardShortcut, useGlobalShortcuts, useShortcutsDialog, shortcutsList, formatShortcut } from "./useKeyboardShortcuts";
export { useOnlineStatus, useApiStatus, useOfflineSync, OnlineStatusIndicator } from "./useOnlineStatus";
export { useExport, exportConfigs } from "./useExport";

// Utilities
export { useMobile } from "./use-mobile";
export { useToast } from "./use-toast";

// Types
export type { Notification } from "./useNotifications";
export type { UserLevel, Achievement, UserAchievement } from "./useGamification";
