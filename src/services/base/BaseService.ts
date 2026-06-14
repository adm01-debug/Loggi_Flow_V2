import { logisticsBreaker } from "../resilience/CircuitBreaker";

export class BaseService {
  protected static async call<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    metadata: { category: string; message: string },
  ): Promise<T> {
    return await logisticsBreaker.execute(async () => {
      const startTime = Date.now();
      const { data, error } = await operation();
      const duration = Date.now() - startTime;

      if (error) {
        // Telemetry would be logged here via a global singleton or similar
        console.error(`[Service Error] ${metadata.category}:`, error);
        throw error;
      }

      // Optional: Log slow queries
      if (duration > 1000) {
        console.warn(`[Slow Query] ${metadata.category} took ${duration}ms`);
      }

      return data as T;
    });
  }
}
