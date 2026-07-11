import { log } from "../_shared/logger.ts";
/**
 * Circuit Breaker pattern implementation for Edge Functions.
 * Prevents cascading failures when external services are down.
 */

export enum CircuitState {
  CLOSED = "CLOSED",     // Normal operation
  OPEN = "OPEN",         // Service is failing, stop requests
  HALF_OPEN = "HALF_OPEN" // Service might be back, try one request
}

export interface CircuitOptions {
  failureThreshold: number; // Max failures before opening
  resetTimeoutMs: number;    // Time to stay OPEN before trying HALF_OPEN
}

const DEFAULT_OPTIONS: CircuitOptions = {
  failureThreshold: 3,
  resetTimeoutMs: 30000, // 30 seconds
};

// Map to store state in-memory across Edge Function executions (transient)
const registries = new Map<string, {
  state: CircuitState;
  failures: number;
  lastFailureTime: number;
}>();

export async function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  options: CircuitOptions = DEFAULT_OPTIONS
): Promise<T> {
  const registry = registries.get(name) || {
    state: CircuitState.CLOSED,
    failures: 0,
    lastFailureTime: 0
  };

  const now = Date.now();

  // If OPEN, check if we can move to HALF_OPEN
  if (registry.state === CircuitState.OPEN) {
    if (now - registry.lastFailureTime > options.resetTimeoutMs) {
      registry.state = CircuitState.HALF_OPEN;
    } else {
      throw new Error(`Circuit Breaker [${name}] is OPEN. Refusing request.`);
    }
  }

  try {
    const result = await fn();

    // Success - reset circuit if not closed
    if (registry.state !== CircuitState.CLOSED) {
      registry.state = CircuitState.CLOSED;
      registry.failures = 0;
    }
    
    registries.set(name, registry);
    return result;
  } catch (error) {
    registry.failures++;
    registry.lastFailureTime = Date.now();

    if (registry.failures >= options.failureThreshold || registry.state === CircuitState.HALF_OPEN) {
      registry.state = CircuitState.OPEN;
      log.error(`Circuit Breaker [${name}] transition to OPEN. Failure count: ${registry.failures}`);
    }

    registries.set(name, registry);
    throw error;
  }
}

/**
 * Functional interface to match some older uses
 */
export function getCircuitBreaker(name: string, options: CircuitOptions = DEFAULT_OPTIONS) {
  return {
    execute: <T>(fn: () => Promise<T>) => withCircuitBreaker(name, fn, options)
  };
}
