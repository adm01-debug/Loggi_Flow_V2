import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { stub } from "https://deno.land/std@0.168.0/testing/mock.ts";
import { handler } from "./index.ts";

// Mock environment variables
Deno.env.set("SUPABASE_URL", "https://localhost");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
Deno.env.set("SUPABASE_ANON_KEY", "test-anon-key");
Deno.env.set("GOOGLE_API_KEY", "test-ai-key");

// Bearer do service role (aceito pelo requireUser sem chamada de rede).
const AUTH = "Authorization: Bearer test-service-key";

Deno.test({
  name: "AI Logistics Assistant - Missing Message - Returns 400",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const req = new Request("https://localhost/ai-logistics-assistant", {
      method: "POST",
      headers: { [AUTH.split(":")[0]]: AUTH.split(":")[1].trim() },
      body: JSON.stringify({}),
    });

    const res = await handler(req);
    const data = await res.json();

    assertEquals(res.status, 400);
    assertEquals(data.success, false);
    assertEquals(data.message, "Por favor, envie uma mensagem.");
  },
});

Deno.test({
  name: "AI Logistics Assistant - Sem token - Returns 401",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const req = new Request("https://localhost/ai-logistics-assistant", {
      method: "POST",
      body: JSON.stringify({ message: "oi" }),
    });

    const res = await handler(req);
    assertEquals(res.status, 401);
  },
});

Deno.test({
  name: "AI Logistics Assistant - Success - Returns AI Insight",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const fetchStub = stub(globalThis, "fetch", (url: any) => {
      const urlStr = url.toString();

      if (urlStr.includes("/rpc/")) {
        // rpc() returns the raw body; an enveloped body would break the caller.
        return Promise.resolve(
          new Response(JSON.stringify([{ ok: true }]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      if (urlStr.includes("/rest/v1")) {
        // PostgREST returns the raw array as body. An enveloped
        // "{data:[], error:null}" body is parsed as an object and breaks
        // calls such as custosRecentes.reduce().
        return Promise.resolve(
          new Response(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      if (urlStr.includes("generativelanguage.googleapis.com")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: "Insight: Reduza custos com a Rodonaves.",
                  },
                },
              ],
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        );
      }

      return Promise.resolve(new Response(null, { status: 404 }));
    });

    try {
      const req = new Request("https://localhost/ai-logistics-assistant", {
        method: "POST",
        headers: { Authorization: "Bearer test-service-key" },
        body: JSON.stringify({ message: "Como posso reduzir custos?" }),
      });

      const res = await handler(req);
      const data = await res.json();

      assertEquals(res.status, 200);
      assertEquals(data.success, true);
      assertEquals(data.message, "Insight: Reduza custos com a Rodonaves.");
    } finally {
      fetchStub.restore();
    }
  },
});
