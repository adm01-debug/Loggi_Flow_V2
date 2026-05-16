export interface SummaryMetrics {
  totalEntregas: number;
  onTimeRate: number;
  avgDeliveryTime: number;
  avgCost: number;
  entregasGrowth: number;
}

export interface BenchmarkPeriod {
  periodLabel: string;
  slaRate: number;
}

export interface TrackingMetrics {
  totalDeliveries: number;
  avgDeliveryTimeMinutes: number;
  totalDistanceKm: number;
}
