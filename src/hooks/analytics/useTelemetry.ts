import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";

export type TelemetrySeverity = 'info' | 'warning' | 'error' | 'critical';

export interface TelemetryLog {
  severity: TelemetrySeverity;
  category: string;
  message: string;
  stack_trace?: string;
  metadata?: Record<string, unknown>;
  url?: string;
}

export function useTelemetry() {
  const { user } = useAuth();

  const logTelemetry = async (log: TelemetryLog) => {
    try {
      const requestId = crypto.randomUUID();
      const { error } = await supabase.from('telemetry_logs').insert({
        severity: log.severity,
        category: log.category,
        message: log.message,
        stack_trace: log.stack_trace,
        metadata: {
          ...log.metadata,
          requestId,
          timestamp: new Date().toISOString()
        },
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
        // Fallback to error_events if telemetry_logs fails
        await supabase.from('error_events').insert({
          user_id: user?.id,
          error_message: log.message,
          stack_trace: log.stack_trace,
          severity: log.severity,
          context: { ...log.metadata, requestId, source: 'telemetry_fallback' }
        });
      }
    } catch (err) {
      console.error('Telemetry critical failure:', err);
    }
  };

  const logError = (message: string, error?: unknown, category: string = 'frontend_error') => {
    const stack_trace = error instanceof Error ? error.stack : JSON.stringify(error);
    logTelemetry({
      severity: 'error',
      category,
      message,
      stack_trace,
      metadata: { error_details: error },
    });
  };

  return { logTelemetry, logError };
}
