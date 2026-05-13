export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  level: LogLevel;
  msg: string;
  requestId?: string;
  userId?: string;
  meta?: Record<string, any>;
  timestamp: string;
}

export const log = (level: LogLevel, msg: string, meta?: Record<string, any>) => {
  const entry: LogEntry = {
    level,
    msg,
    meta,
    timestamp: new Date().toISOString(),
  };
  
  if (level === 'ERROR') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
};
