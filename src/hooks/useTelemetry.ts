import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type TelemetrySeverity = 'info' | 'warning' | 'error' | 'critical';

export interface TelemetryLog {
  severity: TelemetrySeverity;
  category: string;
  message: string;
  stack_trace?: string;
  metadata?: Record<string, any>;
  url?: string;
}

export function useTelemetry() {
  const { user } = useAuth();

  const logTelemetry = async (log: TelemetryLog) => {
    try {
      const { error } = await supabase.from('telemetry_logs').insert({
        severity: log.severity,
        category: log.category,
        message: log.message,
        stack_trace: log.stack_trace,
        metadata: log.metadata || {},
        user_id: user?.id,
        url: log.url || window.location.href,
        device_info: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          screen: `${window.screen.width}x${window.screen.height}`,
        }
      });

      if (error) {
        console.error('Failed to send telemetry:', error);
      }
    } catch (err) {
      console.error('Telemetry error:', err);
    }
  };

  const logError = (message: string, error?: any, category: string = 'frontend_error') => {
    logTelemetry({
      severity: 'error',
      category,
      message,
      stack_trace: error instanceof Error ? error.stack : JSON.stringify(error),
      metadata: { error_details: error },
    });
  };

  return { logTelemetry, logError };
}
