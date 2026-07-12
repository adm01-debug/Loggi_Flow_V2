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

export interface HealthAnomaly {
  metric: string;
  current_value: number;
  mean_value: number;
  stddev_value: number;
  z_score: number;
  severity: "critical" | "warning" | "ok";
  detected_at: string;
}

export interface SloDaily {
  id: string;
  day: string;
  samples: number;
  connection_slo_pct: number;
  cache_slo_pct: number;
  deadlock_free_pct: number;
  overall_slo_pct: number;
  computed_at: string;
}

export interface CapacityForecast {
  metric: string;
  current_value: number;
  slope_per_hour: number;
  forecast_value: number;
  hours_ahead: number;
  threshold: number;
  hours_until_threshold: number | null;
  severity: "critical" | "warning" | "ok";
}
