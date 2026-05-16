export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface ResilienceConfig {
  maxRetries: number;
  retryDelay: number; // ms
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number; // ms
}

export interface IncidentReport {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  rootCause?: string;
  actionItems: string[];
  startTime: string;
  resolvedAt?: string;
  relatedTelemetryIds: string[];
}
