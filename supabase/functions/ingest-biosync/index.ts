import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { log } from "../_shared/logger.ts";
import { invokeFunction } from "../_shared/invokeFunction.ts";
import { internalErrorResponse } from "../_shared/httpError.ts";
import {
  bodyHash,
  buildEventKey,
  claimIdempotencyKey,
} from "../_shared/idempotency.ts";
import { parseBioSyncInput } from "./parse.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireRole } from "../_shared/auth.ts";

serve(async (req) => {
  const headers = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  try {
    // Etapa 073: funcao sem chamador no repo e nunca publicada, mas escrita com
    // service role a partir do corpo do request. Sem guard, um deploy futuro a
    // tornaria um escritor de telemetria de biometria aberto para qualquer um.
    const auth = await requireRole(req, ["admin", "user"]);
    if (!auth.ok) {
      return new Response(
        JSON.stringify({ error: auth.status === 403 ? "Forbidden" : "Unauthorized" }),
        { status: auth.status, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = (await req.json()) as Record<string, unknown>;
    const { driver_id, vehicle_id, heart_rate, fatigue_index } =
      parseBioSyncInput(body);

    // Dedupe (etapa 199, achado B-08): o reenvio do mesmo batimento duplicava a
    // telemetria e repetia o alerta ao motorista. A chave usa identificadores
    // estaveis e o horario DO EVENTO quando o dispositivo manda; sem ele, o hash
    // canonico do corpo. O valor medido nao entra em texto claro (LGPD): so dentro
    // do hash. Relogio do servidor aqui anularia a dedupe (B-02).
    const eventTime =
      typeof body.event_time === "string" && body.event_time.trim()
        ? body.event_time.trim()
        : typeof body.timestamp === "string" && body.timestamp.trim()
        ? body.timestamp.trim()
        : null;
    // Sem horario de evento a identidade do batimento e o proprio conteudo: o
    // hash entra como PARTE da chave. Deixa-lo no fallback do helper nao serviria
    // - com veiculo e motorista sempre presentes, o fallback nunca seria usado e
    // toda leitura daquele motorista viraria duplicata da primeira.
    const identidade = eventTime ?? `sha256-${await bodyHash(body)}`;
    const eventKey = await buildEventKey("biosync", [
      vehicle_id,
      driver_id,
      identidade,
    ]);

    if (!eventKey) {
      log.error(
        "[ingest-biosync] Leitura sem identificador de dispositivo/veiculo",
      );
      return new Response(
        JSON.stringify({ error: "Event without stable identifier" }),
        {
          status: 400,
          headers: { ...headers, "Content-Type": "application/json" },
        },
      );
    }

    const idem = await claimIdempotencyKey(eventKey.provider, eventKey.id);
    if (idem.duplicate) {
      return new Response(
        JSON.stringify({
          success: true,
          duplicate: true,
          message: "already processed",
        }),
        {
          status: 200,
          headers: { ...headers, "Content-Type": "application/json" },
        },
      );
    }

    // 1. Fetch Alert Rules
    const { data: rules } = await supabaseClient
      .from("bio_sync_alert_rules")
      .select("*")
      .limit(1)
      .maybeSingle();

    const warningThreshold = rules?.bpm_warning_threshold || 100;
    const criticalThreshold = rules?.bpm_critical_threshold || 120;
    
    let severity = "info";
    if (heart_rate >= criticalThreshold) severity = "crit";
    else if (heart_rate >= warningThreshold) severity = "warn";

    // 2. Insert Telemetry
    const { data: telemetry, error } = await supabaseClient
      .from("bio_sync_telemetry")
      .insert({
        driver_id,
        vehicle_id,
        heart_rate, // validado: número na faixa fisiológica (20-300)
        fatigue_index, // validado: "LOW" quando ausente
        severity,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      // O detalhe do Postgres (tabela, coluna, restrição) fica no log; a resposta ao chamador é genérica.
      log.error("[ingest-biosync] Falha ao gravar telemetria:", {
        code: error.code,
        message: error.message,
      });
      throw new Error("Falha ao gravar telemetria");
    }

    // 3. Proactive Tactical Log
    if (severity !== "info") {
      await supabaseClient.from("nexus_tactical_logs").insert({
        message: `BIO_SYNC: ${severity.toUpperCase()} Alert - BPM: ${heart_rate} for Vehicle ${vehicle_id}`,
        type: severity,
        target_vehicle: vehicle_id,
        event_time: new Date().toISOString()
      });

      // 4. Proactive Bitrix24 Integration (only for critical)
      if (severity === "crit") {
        const aviso = await invokeFunction("bitrix24-integration", {
          action: "notify_alert",
          deal_data: {
            message: `CRITICAL HEART RATE DETECTED: ${heart_rate} BPM`,
            severity: "crit",
            vehicle_id,
            driver_id,
          },
        });

        if (!aviso.ok) {
          log.error("Failed to notify Bitrix24:", { reason: aviso.reason });
        }
      }
    }

    return new Response(JSON.stringify(telemetry), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return internalErrorResponse(error, headers, "ingest-biosync");
  }
});
