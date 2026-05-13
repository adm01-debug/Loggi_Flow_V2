/**
 * Simple Circuit Breaker Implementation
 * States: CLOSED, OPEN, HALF_OPEN
 */

export enum CircuitState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

interface CircuitBreakerOptions {
  failureThreshold: number; // Number of failures before opening the circuit
  resetTimeout: number; // Time in ms before trying to close the circuit (HALF_OPEN)
  onStateChange?: (state: CircuitState) => void;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private lastFailureTime = 0;
  private options: CircuitBreakerOptions;

  constructor(options: CircuitBreakerOptions) {
    this.options = options;
  }

  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.evaluateState();

    if (this.state === CircuitState.OPEN) {
      throw new Error("Circuit breaker is OPEN");
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private evaluateState() {
    if (this.state === CircuitState.OPEN) {
      const now = Date.now();
      if (now - this.lastFailureTime > this.options.resetTimeout) {
        this.setState(CircuitState.HALF_OPEN);
      }
    }
  }

  private onSuccess() {
    if (this.state === CircuitState.HALF_OPEN) {
      this.setState(CircuitState.CLOSED);
      this.failures = 0;
    }
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.CLOSED && this.failures >= this.options.failureThreshold) {
      this.setState(CircuitState.OPEN);
    } else if (this.state === CircuitState.HALF_OPEN) {
      this.setState(CircuitState.OPEN);
    }
  }

  private setState(newState: CircuitState) {
    if (this.state !== newState) {
      this.state = newState;
      if (this.options.onStateChange) {
        this.options.onStateChange(newState);
      }
    }
  }

  public getState(): CircuitState {
    return this.state;
  }
}

// Map to store circuit breakers for different services
const breakers = new Map<string, CircuitBreaker>();

export const getCircuitBreaker = (serviceName: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker => {
  if (!breakers.has(serviceName)) {
    breakers.set(
      serviceName,
      new CircuitBreaker({
        failureThreshold: options?.failureThreshold ?? 5,
        resetTimeout: options?.resetTimeout ?? 30000, // 30 seconds
        onStateChange: (state) => {
          console.log(`[CircuitBreaker] ${serviceName} state changed to ${state}`);
        },
      })
    );
  }
  return breakers.get(serviceName)!;
};
