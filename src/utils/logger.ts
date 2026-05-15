import { supabase } from "@/integrations/supabase/client";

type LogSeverity = 'info' | 'warning' | 'error' | 'critical';

interface LogOptions {
  severity?: LogSeverity;
  context?: Record<string, any>;
  userId?: string;
}

class Logger {
  async log(message: string, options: LogOptions = {}) {
    const { severity = 'info', context = {}, userId } = options;
    
    // In development, log to console
    if (import.meta.env.DEV) {
      const colors = {
        info: '\x1b[32m',
        warning: '\x1b[33m',
        error: '\x1b[31m',
        critical: '\x1b[41m\x1b[37m',
      };
      console.log(`${colors[severity]}[${severity.toUpperCase()}]\x1b[0m ${message}`, context);
    }

    try {
      await supabase.from('telemetry_logs').insert({
        message,
        severity,
        context,
        user_id: userId,
        source: 'frontend',
      });
    } catch (err) {
      console.error('Failed to send telemetry log:', err);
    }
  }

  async error(error: Error | string, context: Record<string, any> = {}) {
    const message = typeof error === 'string' ? error : error.message;
    const stack = error instanceof Error ? error.stack : undefined;
    
    await this.log(message, {
      severity: 'error',
      context: { ...context, stack },
    });
  }

  async info(message: string, context: Record<string, any> = {}) {
    await this.log(message, { severity: 'info', context });
  }

  async warn(message: string, context: Record<string, any> = {}) {
    await this.log(message, { severity: 'warning', context });
  }
}

export const logger = new Logger();
