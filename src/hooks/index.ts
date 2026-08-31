// Hooks - barrel export
// ============================================

// ============================================
// Core State Management (Common)
// ============================================
export * from './common/usePagination';
export * from './common/useFilters';
export * from './common/useSorting';
export * from './common/useDebounce';
export * from './common/useLocalStorage';
export * from './common/useMediaQuery';
export * from './common/useSearch';
export * from './common/useSelection';
export * from './common/useBulkActions';
export * from './common/useComments';
export * from './common/useExport';
export * from './common/useImportData';
export * from './common/useKeyboardShortcuts';
export * from './common/useNavigationHistory';
export * from './common/useConfirmExit';
export * from './common/useTimezone';
export * from './common/useDensity';
export * from './common/useGlobalSearch';
export * from './common/useOnlineStatus';

// ============================================
// Realtime & Sync (Data)
// ============================================
export * from './data/useRealtime';
export * from './data/useMemoizedQuery';
export * from './data/usePrefetch';
export * from './data/useResilientMutation';
export * from './data/useSoftDelete';
export * from './data/useDocumentUpload';
export * from './data/useImageUpload';

// ============================================
// Authentication (Auth)
// ============================================
export * from './auth/useAuth';
export * from './auth/useNewDeviceDetection';
export * from './auth/useMFA';
export * from './auth/useSessionTimeout';
export * from './auth/usePermissions';
export * from './auth/useRole';
export * from './auth/useWebAuthn';
export * from './auth/useDeviceSessions';

// ============================================
// Security & Governance (Security)
// ============================================
export * from './security/useSecurityEvents';
export * from './security/useRateLimitLogs';
export * from './security/useFeatureFlags';
export * from './security/useAuditLogs';
export * from './security/useEntityHistory';
export { useIntegrationValidation } from './security/useIntegrationValidation';
// Intentionally omitting getStatusColor/getStatusLabel from useIntegrationValidation if they conflict

// ============================================
// Dashboard & Analytics (Analytics)
// ============================================
export * from './analytics/useDrillDown';
export * from './analytics/useFavoriteMetrics';
export * from './analytics/useKPIBenchmark';
export * from './analytics/useDashboardWidgets';
export * from './analytics/useDashboardMetrics';
export * from './analytics/useAnalytics';
export * from './analytics/useDashboardData';

export * from './analytics/useExecutiveMetrics';
export * from './analytics/usePerformanceMonitor';
export * from './analytics/useTelemetry';
export * from './analytics/useScheduledReports';

// ============================================
// Gamification
// ============================================
export * from './gamification/useGamification';
export { useAchievementNotifications, AchievementProvider } from './gamification/useAchievementNotifications';
// Manually export what we need from useAchievementNotifications to avoid Achievement conflict
export * from './gamification/useRewardPurchases';

// ============================================
// Notifications
// ============================================
export * from './notifications/useNotifications';
export * from './notifications/useNotificationPreferences';
export * from './notifications/usePushNotifications';
export * from './notifications/useSecurityPushNotifications';
export * from './notifications/useWhatsAppNotification';
export * from './notifications/useAudioFeedback';

// ============================================
// Logistics & Business
// ============================================
export * from './logistics/useSLAMetrics';
export * from './logistics/useSLANotifications';
export * from './logistics/useLogisticsCosts';
export * from './logistics/useLogisticsCalendar';
export * from './logistics/useCostAlerts';
export * from './logistics/useDelayPrediction';
export * from './logistics/useDeliveryRoutes';
export * from './logistics/useFreightQuotation';
export * from './logistics/useSmartCarrierSelection';
export * from './logistics/useQuotationFlow';
export * from './logistics/useSmartAlerts';
export * from './logistics/useBoxManagement';
export * from './logistics/useConciliacao';
export * from './logistics/useBusinessRules';
export * from './logistics/useTransportadoraRotas';
export * from './logistics/useRodonavesTracking';
export * from './logistics/useRodonavesWebhook';
export * from './logistics/useMelhorEnvio';
export * from './logistics/useCotacoesFrete';
export * from './logistics/useCotacoesMulticanal';
export * from './logistics/useFreightIntelligence';
export * from './logistics/useLogisticaReversaReal';
export * from './logistics/useLogisticsIntelligence';
export * from './logistics/useSLAAlerts';
export * from './logistics/useLalamoveTracking';
export * from './logistics/useLalamoveOrders';
export * from './logistics/useBusinessRuleEngine';
export * from './logistics/useTrackingAnalytics';
export * from './logistics/useUnifiedTracking';
export * from './logistics/useBiometricAnomalies';
export * from './logistics/useMapWeatherSync';


// ============================================
// Integrations
// ============================================
export * from './integrations/useEvolutionWhatsApp';
export * from './integrations/useBitrixEntregaSync';
export * from './integrations/useClientWebhooks';
export * from './integrations/useExternalDbBridge';
export * from './integrations/useGeocoding';

// ============================================
// UI & Utilities
// ============================================
export { useIsMobile } from './ui/use-mobile';
export { useToast, toast } from './ui/use-toast';
export * from './ui/useOnboarding';
export * from './ui/useQRScanner';
export * from './ui/useVirtualTable';
export * from './ui/useTouchGestures';

