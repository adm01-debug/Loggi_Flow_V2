import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handler } from "./index.ts";

Deno.test("accuracy-meta-monitor responds to OPTIONS", async () => {
  const res = await handler(new Request("http://localhost", { method: "OPTIONS" }));
  assertEquals(res.status, 200);
  await res.text();
});
