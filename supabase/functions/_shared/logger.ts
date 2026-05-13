export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  level: LogLevel;
  msg: string;
  requestId?: string;
  correlationId?: string;
  userId?: string;
  meta?: Record<string, any>;
  timestamp: string;
}

/**
 * Standard structured logger for Edge Functions.
 * Supports correlation IDs for distributed tracing (Dimension 9 & 10).
 */
export const log = (level: LogLevel, msg: string, meta?: Record<string, any>, req?: Request) => {
  const correlationId = req?.headers.get('x-correlation-id') || req?.headers.get('x-request-id');
  
  const entry: LogEntry = {
    level,
    msg,
    correlationId: correlationId || undefined,
    meta,
    timestamp: new Date().toISOString(),
  };
  
  if (level === 'ERROR') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
};

