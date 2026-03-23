import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

const SLOW_QUERY_THRESHOLD_MS = 3000;
const VERY_SLOW_QUERY_THRESHOLD_MS = 8000;

interface TelemetryMeta {
  operation: string;
  table?: string;
  rpcName?: string;
  limit?: number;
  offset?: number;
  countMode?: string;
  durationMs: number;
  recordCount?: number;
  status: "ok" | "error" | "slow" | "very_slow";
  error?: string;
  userId?: string | null;
}

function emitTelemetry(meta: TelemetryMeta) {
  const icon =
    meta.status === "very_slow" ? "🔴"
    : meta.status === "slow" ? "🟡"
    : meta.status === "error" ? "❌"
    : "✅";

  const target = meta.rpcName || meta.table || "unknown";
  const line =
    `${icon} [telemetry] ${meta.operation}:${target} ${meta.durationMs}ms` +
    ` | records=${meta.recordCount ?? "-"}` +
    ` limit=${meta.limit ?? "-"}` +
    ` offset=${meta.offset ?? "-"}` +
    ` count=${meta.countMode ?? "-"}`;

  if (meta.status === "very_slow") {
    console.warn(`⚠️ VERY SLOW QUERY: ${line}`);
  } else if (meta.status === "slow") {
    console.warn(`⚠️ SLOW QUERY: ${line}`);
  } else if (meta.status === "error") {
    console.error(line + ` error=${meta.error}`);
  } else {
    console.info(line);
  }

  // Persist to local DB (fire-and-forget) only if not ok
  if (meta.status !== "ok") {
    try {
      const localUrl = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (localUrl && serviceKey) {
        const localClient = createClient(localUrl, serviceKey);
        localClient
          .from("query_telemetry")
          .insert({
            operation: meta.operation,
            table_name: meta.table || null,
            rpc_name: meta.rpcName || null,
            duration_ms: meta.durationMs,
            record_count: meta.recordCount ?? null,
            query_limit: meta.limit ?? null,
            query_offset: meta.offset ?? null,
            count_mode: meta.countMode || null,
            severity: meta.status,
            error_message: meta.error || null,
            user_id: meta.userId || null,
          })
          .then(({ error: insertErr }) => {
            if (insertErr)
              console.warn("[telemetry-persist] Insert failed:", insertErr.message);
          });
      }
    } catch (_e) {
      // Fire-and-forget: NEVER block the main response
    }
  }
}

function classifyStatus(durationMs: number, hasError: boolean): TelemetryMeta["status"] {
  if (hasError) return "error";
  if (durationMs >= VERY_SLOW_QUERY_THRESHOLD_MS) return "very_slow";
  if (durationMs >= SLOW_QUERY_THRESHOLD_MS) return "slow";
  return "ok";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsResponse(req);

  const headers = {
    ...getCorsHeaders(req),
    "Content-Type": "application/json",
  };

  try {
    const externalUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
    const externalKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_KEY");

    if (!externalUrl || !externalKey) {
      return new Response(
        JSON.stringify({ error: "External database not configured" }),
        { status: 500, headers }
      );
    }

    const externalClient = createClient(externalUrl, externalKey);
    const body = await req.json();

    const {
      action,
      table,
      rpcName,
      selectColumns = "*",
      filters = [],
      data: payload,
      limit = 100,
      offset = 0,
      countMode = "none",
      orderBy,
      ascending = true,
    } = body;

    // Extract user ID from auth header
    let userId: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      try {
        const localUrl = Deno.env.get("SUPABASE_URL")!;
        const localAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const localClient = createClient(localUrl, localAnonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user } } = await localClient.auth.getUser();
        userId = user?.id || null;
      } catch (_e) {
        // Continue without user ID
      }
    }

    // Handle different operations
    if (action === "select") {
      const start = performance.now();
      let query = externalClient
        .from(table)
        .select(selectColumns, {
          count: countMode === "none" ? undefined : countMode as "exact" | "planned" | "estimated",
        });

      // Apply filters
      for (const f of filters) {
        if (f.operator === "eq") query = query.eq(f.column, f.value);
        else if (f.operator === "neq") query = query.neq(f.column, f.value);
        else if (f.operator === "gt") query = query.gt(f.column, f.value);
        else if (f.operator === "gte") query = query.gte(f.column, f.value);
        else if (f.operator === "lt") query = query.lt(f.column, f.value);
        else if (f.operator === "lte") query = query.lte(f.column, f.value);
        else if (f.operator === "like") query = query.like(f.column, f.value);
        else if (f.operator === "ilike") query = query.ilike(f.column, f.value);
        else if (f.operator === "in") query = query.in(f.column, f.value);
        else if (f.operator === "is") query = query.is(f.column, f.value);
      }

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy, { ascending });
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      const durationMs = Math.round(performance.now() - start);
      const status = classifyStatus(durationMs, !!error);

      emitTelemetry({
        operation: "select",
        table,
        limit,
        offset,
        countMode,
        durationMs,
        status,
        recordCount: data?.length ?? 0,
        error: error?.message,
        userId,
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers,
        });
      }

      return new Response(
        JSON.stringify({ data, count, duration_ms: durationMs }),
        { status: 200, headers }
      );
    }

    if (action === "insert") {
      const start = performance.now();
      const { data, error } = await externalClient.from(table).insert(payload).select();
      const durationMs = Math.round(performance.now() - start);
      const status = classifyStatus(durationMs, !!error);

      emitTelemetry({
        operation: "insert",
        table,
        durationMs,
        status,
        recordCount: data?.length ?? 0,
        error: error?.message,
        userId,
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers,
        });
      }

      return new Response(
        JSON.stringify({ data, duration_ms: durationMs }),
        { status: 201, headers }
      );
    }

    if (action === "update") {
      const start = performance.now();
      let query = externalClient.from(table).update(payload);
      for (const f of filters) {
        if (f.operator === "eq") query = query.eq(f.column, f.value);
      }
      const { data, error } = await query.select();
      const durationMs = Math.round(performance.now() - start);
      const status = classifyStatus(durationMs, !!error);

      emitTelemetry({
        operation: "update",
        table,
        durationMs,
        status,
        recordCount: data?.length ?? 0,
        error: error?.message,
        userId,
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers,
        });
      }

      return new Response(
        JSON.stringify({ data, duration_ms: durationMs }),
        { status: 200, headers }
      );
    }

    if (action === "delete") {
      const start = performance.now();
      let query = externalClient.from(table).delete();
      for (const f of filters) {
        if (f.operator === "eq") query = query.eq(f.column, f.value);
      }
      const { data, error } = await query.select();
      const durationMs = Math.round(performance.now() - start);
      const status = classifyStatus(durationMs, !!error);

      emitTelemetry({
        operation: "delete",
        table,
        durationMs,
        status,
        recordCount: data?.length ?? 0,
        error: error?.message,
        userId,
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers,
        });
      }

      return new Response(
        JSON.stringify({ data, duration_ms: durationMs }),
        { status: 200, headers }
      );
    }

    if (action === "rpc") {
      const start = performance.now();
      const { data, error } = await externalClient.rpc(rpcName, payload || {});
      const durationMs = Math.round(performance.now() - start);
      const status = classifyStatus(durationMs, !!error);

      emitTelemetry({
        operation: "rpc",
        rpcName,
        durationMs,
        status,
        recordCount: Array.isArray(data) ? data.length : data ? 1 : 0,
        error: error?.message,
        userId,
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers,
        });
      }

      return new Response(
        JSON.stringify({ data, duration_ms: durationMs }),
        { status: 200, headers }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers }
    );
  } catch (err) {
    console.error("[external-db-bridge] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
