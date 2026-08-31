import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { withCircuitBreaker } from "./circuitBreaker.ts";

Deno.test({
  name: "Circuit Breaker Pattern - Success Case",
  async fn() {
    const fn = () => Promise.resolve('success');
    const result = await withCircuitBreaker('test-service', fn);
    
    assertEquals(result, 'success');
  }
});

Deno.test({
  name: "Circuit Breaker Pattern - Transition to OPEN",
  async fn() {
    let callCount = 0;
    const fn = () => {
      callCount++;
      return Promise.reject(new Error('service down'));
    };
    
    const options = { failureThreshold: 2, resetTimeoutMs: 1000 };

    // Failure 1
    try {
      await withCircuitBreaker('fail-service', fn, options);
    } catch (e) {
      assertEquals(e.message, 'service down');
    }
    
    // Failure 2 -> Should transition to OPEN
    try {
      await withCircuitBreaker('fail-service', fn, options);
    } catch (e) {
      assertEquals(e.message, 'service down');
    }

    // Call 3 -> Should be blocked immediately without calling fn
    try {
      await withCircuitBreaker('fail-service', fn, options);
      throw new Error('Should have failed');
    } catch (e) {
      assertEquals(e.message.includes('is OPEN'), true);
    }
    
    assertEquals(callCount, 2);
  }
});
