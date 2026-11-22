import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { stub } from "https://deno.land/std@0.168.0/testing/mock.ts";
import { handler } from "./index.ts";

// Mock environment variables
Deno.env.set("SUPABASE_URL", "https://jvfhclubfpxrtrrazrgr.supabase.co");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "test-key");
Deno.env.set("RESEND_API_KEY", "re_test_123");

// Etapa 011: requireUser via Bearer do service role (short-circuit local).
const AUTH = { Authorization: "Bearer test-key" };

Deno.test({
  name: "Scheduled Reports - Action: create - Happy Path",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const fetchStub = stub(globalThis, "fetch", (_url: any) => {
      return Promise.resolve(new Response(JSON.stringify({ id: 'new-report-id', title: 'New Report' }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }));
    });

    try {
      const payload = {
        action: 'create',
        reportData: { title: 'New Report', report_type: 'entregas' }
      };

      const req = new Request("https://localhost/scheduled-reports", {
        method: "POST",
        headers: AUTH,
        body: JSON.stringify(payload),
      });

      const res = await handler(req);
      const data = await res.json();

      assertEquals(res.status, 200);
      assertEquals(data.success, true);
      assertEquals(data.report.id, 'new-report-id');
    } finally {
      fetchStub.restore();
    }
  }
});

Deno.test({
  name: "Scheduled Reports - Action: delete - Happy Path",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const fetchStub = stub(globalThis, "fetch", () => {
      return Promise.resolve(new Response(null, { status: 204 }));
    });

    try {
      const payload = {
        action: 'delete',
        reportId: 'report-123'
      };

      const req = new Request("https://localhost/scheduled-reports", {
        method: "POST",
        headers: AUTH,
        body: JSON.stringify(payload),
      });

      const res = await handler(req);
      const data = await res.json();

      assertEquals(res.status, 200);
      assertEquals(data.success, true);
    } finally {
      fetchStub.restore();
    }
  }
});

Deno.test({
  name: "Scheduled Reports - Unknown Action - 400 (not 500)",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const req = new Request("https://localhost/scheduled-reports", {
      method: "POST",
      headers: AUTH,
      body: JSON.stringify({ action: 'unknown' }),
    });

    const res = await handler(req);
    const data = await res.json();

    assertEquals(res.status, 400);
    assertEquals(data.success, false);
    assertEquals(data.error, "Unknown action: unknown");
  }
});

Deno.test({
  name: "Scheduled Reports - Missing auth - 401",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const req = new Request("https://localhost/scheduled-reports", {
      method: "POST",
      body: JSON.stringify({ action: 'list' }),
    });

    const res = await handler(req);
    assertEquals(res.status, 401);
  }
});
