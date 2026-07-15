import { CircuitState, ResilienceConfig } from "@/features/incidents/types";
import { supabase } from "@/integrations/supabase/client";

class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures: number = 0;
  private lastFailureTime: number | null = null;
  private config: ResilienceConfig;

  constructor(config: ResilienceConfig) {
    this.config = config;
  }

  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - (this.lastFailureTime || 0) > this.config.circuitBreakerTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit Breaker is OPEN. Request rejected to prevent overload.');
      }
    }

    try {
      const result = await this.retry(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private async retry<T>(fn: () => Promise<T>, attempt: number = 0): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (attempt < this.config.maxRetries) {
        const delay = this.config.retryDelay * Math.pow(2, attempt); // Exponential backoff
        await new Promise(res => setTimeout(res, delay));
        return this.retry(fn, attempt + 1);
      }
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    // Log state change to database for visibility
    if (this.failures >= this.config.circuitBreakerThreshold && this.state !== 'OPEN') {
      this.state = 'OPEN';
      this.logCircuitEvent('OPEN');
    }
  }

  private async logCircuitEvent(newState: CircuitState) {
    try {
      await supabase.from('security_events').insert([{
        event_type: 'resilience_event',
        description: `Circuit Breaker alterado para: ${newState}`,
        severity: newState === 'OPEN' ? 'critical' : 'warning',
        metadata: {
          failures: this.failures,
          state: newState,
          config: { ...this.config },
          timestamp: new Date().toISOString()
        }
      }]);
    } catch (e) {
      console.error('CB logging failure:', e);
    }
  }

  public getState() {
    return this.state;
  }
}

// Singleton instances for different domains
export const logisticsBreaker = new CircuitBreaker({
  maxRetries: 3,
  retryDelay: 1000,
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 30000
});

export const authBreaker = new CircuitBreaker({
  maxRetries: 2,
  retryDelay: 500,
  circuitBreakerThreshold: 10,
  circuitBreakerTimeout: 10000
});
