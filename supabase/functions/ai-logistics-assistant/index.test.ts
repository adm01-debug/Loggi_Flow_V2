import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { stub } from "https://deno.land/std@0.168.0/testing/mock.ts";
import { handler } from "./index.ts";

// Mock environment variables
Deno.env.set("LOVABLE_API_KEY", "test-ai-key");
Deno.env.set("SUPABASE_URL", "https://localhost");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");

Deno.test({
  name: "AI Logistics Assistant - Missing Message - Returns 400",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const req = new Request("https://localhost/ai-logistics-assistant", {
      method: "POST",
      body: JSON.stringify({ userId: 'user-123' }),
    });

    const res = await handler(req);
    const data = await res.json();

    assertEquals(res.status, 400);
    assertEquals(data.success, false);
    assertEquals(data.message, "Por favor, envie uma mensagem.");
  }
});

Deno.test({
  name: "AI Logistics Assistant - Success - Returns AI Insight",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const fetchStub = stub(globalThis, "fetch", (url: any) => {
      const urlStr = url.toString();
      
      if (urlStr.includes("localhost")) {
        return Promise.resolve(new Response(JSON.stringify({ data: [], error: null }), { 
          status: 200,
          headers: { "Content-Type": "application/json" }
        }));
      }
      
      if (urlStr.includes("ai.gateway.lovable.dev")) {
        return Promise.resolve(new Response(JSON.stringify({
          choices: [{ message: { content: "Insight: Reduza custos com a Rodonaves." } }]
        }), { 
          status: 200,
          headers: { "Content-Type": "application/json" }
        }));
      }
      
      return Promise.resolve(new Response(null, { status: 404 }));
    });

    try {
      const req = new Request("https://localhost/ai-logistics-assistant", {
        method: "POST",
        body: JSON.stringify({ message: "Como posso reduzir custos?", userId: 'user-123' }),
      });

      const res = await handler(req);
      const data = await res.json();

      assertEquals(res.status, 200);
      assertEquals(data.success, true);
      assertEquals(data.message, "Insight: Reduza custos com a Rodonaves.");
    } finally {
      fetchStub.restore();
    }
  }
});
