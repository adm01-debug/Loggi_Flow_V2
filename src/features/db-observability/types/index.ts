export interface QueryRegression {
  queryid: number;
  query_text: string;
  baseline_mean_ms: number;
  current_mean_ms: number;
  regression_pct: number;
}

export interface TopQuery {
  queryid: number;
  query_text: string;
  calls: number;
  mean_exec_ms: number;
  total_exec_ms: number;
  max_exec_ms: number;
  rows_returned: number;
}

export interface CronJobStatus {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
  last_start: string | null;
  last_status: string | null;
  last_duration_ms: number | null;
}

export interface HealthSnapshot {
  id: string;
  created_at: string;
  active_connections: number | null;
  total_connections: number | null;
  db_size_bytes: number | null;
  cache_hit_ratio: number | null;
  deadlocks: number | null;
  wal_size_bytes: number | null;
  metadata: Record<string, unknown>;
}

export type RegressionSeverity = "critical" | "warning" | "ok";

export const severityOf = (pct: number): RegressionSeverity => {
  if (pct >= 100) return "critical";
  if (pct >= 50) return "warning";
  return "ok";
};
