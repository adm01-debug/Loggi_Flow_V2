import { supabase } from "@/integrations/supabase/client";

type LogSeverity = 'info' | 'warning' | 'error' | 'critical';

interface LogOptions {
  severity?: LogSeverity;
  category?: string;
  metadata?: Record<string, any>;
  userId?: string;
  stackTrace?: string;
}

class Logger {
  async log(message: string, options: LogOptions = {}) {
    const { 
      severity = 'info', 
      category = 'general', 
      metadata = {}, 
      userId,
      stackTrace 
    } = options;
    
    if (import.meta.env.DEV) {
      console.log(`[${severity.toUpperCase()}] ${message}`, { category, metadata });
    }

    try {
      await supabase.from('telemetry_logs').insert({
        message,
        severity,
        category,
        metadata,
        user_id: userId,
        stack_trace: stackTrace,
        url: window.location.href,
        device_info: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        }
      });
    } catch (err) {
      console.error('Failed to send telemetry log:', err);
    }
  }

  async error(error: Error | string, category = 'error') {
    const message = typeof error === 'string' ? error : error.message;
    const stackTrace = error instanceof Error ? error.stack : undefined;
    
    await this.log(message, {
      severity: 'error',
      category,
      stackTrace,
    });
  }

  async info(message: string, category = 'info', metadata = {}) {
    await this.log(message, { severity: 'info', category, metadata });
  }

  async warn(message: string, category = 'warning', metadata = {}) {
    await this.log(message, { severity: 'warning', category, metadata });
  }
}

export const logger = new Logger();
