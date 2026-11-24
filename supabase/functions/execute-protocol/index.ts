import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { internalErrorResponse } from "../_shared/httpError.ts";
import { log } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Require authentication — protocol execution is a privileged action
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { vehicle_id, protocol_name } = await req.json();

    if (!vehicle_id || !protocol_name) {
      return new Response(
        JSON.stringify({ error: "vehicle_id and protocol_name are required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Call the DB function to record and "execute"
    const { data, error } = await supabase.rpc("execute_nexus_protocol", {
      vehicle_id,
      protocol_name,
    });

    if (error) {
      // O texto do PostgREST (tabela/coluna do schema interno) fica no log; a resposta e generica.
      log.error("[execute-protocol] Falha ao executar protocolo:", {
        protocol_name,
        code: error.code,
        message: error.message,
      });
      throw new Error("Falha ao executar protocolo");
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    // O erro do banco ja foi registrado no passo correspondente; aqui so sai a resposta generica.
    return internalErrorResponse(error, corsHeaders, "execute-protocol");
  }
});
