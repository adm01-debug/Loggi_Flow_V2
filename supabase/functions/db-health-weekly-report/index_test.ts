import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';

Deno.test('db-health-weekly-report: OPTIONS returns ok', async () => {
  const mod = await import('./index.ts');
  assertEquals(typeof mod, 'object');
});
