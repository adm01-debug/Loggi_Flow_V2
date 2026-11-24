import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { log } from "../_shared/logger.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const headers = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    log.info("Starting Nexus Auto-Healing Protocol...");
    const start = Date.now();
    const repairs = [];

    // 1. Repair: Entregas 'entregue' with no delivery date
    const { data: missingDates, error: err1 } = await supabaseAdmin
      .from("entregas")
      .select("id, status, updated_at")
      .eq("status", "entregue")
      .is("data_entrega_efetiva", null);

    if (missingDates && missingDates.length > 0) {
      for (const item of missingDates) {
        await supabaseAdmin
          .from("entregas")
          .update({ data_entrega_efetiva: item.updated_at })
          .eq("id", item.id);

        repairs.push({
          type: "data_repair",
          entity: "entregas",
          id: item.id,
          fix: "Set data_entrega_efetiva from updated_at",
        });
      }
    }

    // 2. Repair: Collections 'coletada' with no receipt date
    const { data: missingColDates, error: err2 } = await supabaseAdmin
      .from("coletas")
      .select("id, status, updated_at")
      .eq("status", "coletada")
      .is("data_efetiva_coleta", null);

    if (missingColDates && missingColDates.length > 0) {
      for (const item of missingColDates) {
        await supabaseAdmin
          .from("coletas")
          .update({ data_efetiva_coleta: item.updated_at })
          .eq("id", item.id);

        repairs.push({
          type: "data_repair",
          entity: "coletas",
          id: item.id,
          fix: "Set data_efetiva_coleta from updated_at",
        });
      }
    }

    // 3. System Heartbeat Update
    const latency = Date.now() - start;
    await supabaseAdmin.from("system_heartbeat").upsert({
      service_name: "database",
      status: "operational",
      latency_ms: latency,
      last_check: new Date().toISOString(),
    });

    // 4. Log repairs if any
    if (repairs.length > 0) {
      await supabaseAdmin.from("system_integrity_logs").insert(
        repairs.map((r) => ({
          action_type: r.type,
          description: `Auto-reparo Nexus: ${r.fix}`,
          entity_affected: r.entity,
          severity: "low",
          metadata: { entity_id: r.id },
        })),
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        repairs_executed: repairs.length,
        latency_ms: latency,
        message:
          repairs.length > 0
            ? `${repairs.length} inconsistências reparadas.`
            : "Sistema 10/10: Nenhuma inconsistência detectada.",
      }),
      {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    log.error("Auto-healing request failed:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return new Response(JSON.stringify({ error: "INTERNAL_ERROR" }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
