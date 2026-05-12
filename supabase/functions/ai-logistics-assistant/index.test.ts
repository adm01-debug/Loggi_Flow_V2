import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { stub } from "https://deno.land/std@0.168.0/testing/mock.ts";
import { handler } from "./index.ts";

// Mock environment variables
Deno.env.set("LOVABLE_API_KEY", "test-ai-key");
Deno.env.set("SUPABASE_URL", "https://hgicfqjayrjurivtygqf.supabase.co");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");

Deno.test("AI Logistics Assistant - Missing Message - Returns 400", async () => {
  const req = new Request("https://localhost/ai-logistics-assistant", {
    method: "POST",
    body: JSON.stringify({ userId: 'user-123' }),
  });

  const res = await handler(req);
  const data = await res.json();

  assertEquals(res.status, 400);
  assertEquals(data.success, false);
  assertEquals(data.message, "Por favor, envie uma mensagem.");
});

Deno.test("AI Logistics Assistant - Success - Returns AI Insight", async () => {
  // Mock both Supabase calls and AI Gateway call
  const fetchStub = stub(globalThis, "fetch", (url: any) => {
    const urlStr = url.toString();
    
    // Mock Supabase RPC or Table Selects
    if (urlStr.includes("supabase.co")) {
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
    }
    
    // Mock AI Gateway
    if (urlStr.includes("ai.gateway.lovable.dev")) {
      return Promise.resolve(new Response(JSON.stringify({
        choices: [{ message: { content: "Insight: Reduza custos com a Rodonaves." } }]
      }), { status: 200 }));
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
});

Deno.test("AI Logistics Assistant - Missing API Key - Returns 500", async () => {
  const originalKey = Deno.env.get("LOVABLE_API_KEY");
  Deno.env.delete("LOVABLE_API_KEY");
  
  try {
    const req = new Request("https://localhost/ai-logistics-assistant", {
      method: "POST",
      body: JSON.stringify({ message: "Teste", userId: 'user-123' }),
    });

    const res = await handler(req);
    const data = await res.json();

    assertEquals(res.status, 500);
    assertEquals(data.success, false);
    assertEquals(data.message, "Erro de processamento na inteligência logística.");
  } finally {
    if (originalKey) Deno.env.set("LOVABLE_API_KEY", originalKey);
  }
});
