export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

interface LogEntry {
  level: LogLevel;
  message: string;
  requestId?: string;
  userId?: string;
  meta?: Record<string, any>;
  timestamp: string;
}

export const log = (level: LogLevel | Omit<LogEntry, 'timestamp'>, message?: string, meta?: Record<string, any>) => {
  let entry: LogEntry;

  if (typeof level === 'string') {
    entry = {
      level: level as LogLevel,
      message: message || '',
      meta,
      timestamp: new Date().toISOString()
    };
  } else {
    entry = {
      ...(level as Omit<LogEntry, 'timestamp'>),
      timestamp: new Date().toISOString()
    };
  }
  
  const logStr = JSON.stringify(entry);
  
  if (entry.level === LogLevel.ERROR) {
    console.error(logStr);
  } else if (entry.level === LogLevel.WARN) {
    console.warn(logStr);
  } else {
    console.info(logStr);
  }
};

// Add convenience methods
log.info = (message: string, meta?: Record<string, any>) => log(LogLevel.INFO, message, meta);
log.warn = (message: string, meta?: Record<string, any>) => log(LogLevel.WARN, message, meta);
log.error = (message: string, meta?: Record<string, any>) => log(LogLevel.ERROR, message, meta);
log.debug = (message: string, meta?: Record<string, any>) => log(LogLevel.DEBUG, message, meta);
