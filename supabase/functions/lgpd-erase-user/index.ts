import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { internalErrorResponse } from "../_shared/httpError.ts";
import { log } from "../_shared/logger.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Verify caller is authenticated and has admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const {
      data: { user: caller },
      error: authError,
    } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { data: callerRoles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);
    const isAdmin = callerRoles?.some(
      (r: { role: string }) => r.role === "admin",
    );
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden: admin role required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        },
      );
    }

    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // 1. Apagar dados PII
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      // O texto do PostgREST (tabela/chave estrangeira que guarda dado do titular) fica no log,
      // com o passo exato da rotina; a resposta não devolve nada disso.
      log.error("[lgpd-erase-user] Falha ao apagar perfil:", {
        step: "profiles.delete",
        code: profileError.code,
        message: profileError.message,
      });
      throw new Error("Falha ao apagar perfil");
    }

    // 2. Delete the auth user so they can no longer sign in.
    const { error: deleteAuthError } =
      await supabaseClient.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      log.error("[lgpd-erase-user] Falha ao apagar usuário de auth:", {
        step: "auth.users.delete",
        code: deleteAuthError.code,
        message: deleteAuthError.message,
      });
      throw new Error("Falha ao apagar usuário de auth");
    }

    // 3. Registrar no log de auditoria, conforme o schema real de `audit_logs`
    //    (action/table_name/record_id/...). O UPDATE antigo em `entregas` usava
    //    colunas inexistentes (cliente_nome/cliente_email/cliente_documento/
    //    user_id) e quebrava com 400 DEPOIS de apagar o perfil e ANTES de apagar
    //    o usuário de auth — o usuário ficava com o perfil sumido e o login vivo.
    //    Como `entregas` não tem vínculo real com o titular (só `cliente_id`),
    //    não há PII sua para anonimizar ali. Agora perfil e usuário de auth são
    //    apagados de verdade e a ação fica registrada no schema real.
    const { error: auditError } = await supabaseClient
      .from("audit_logs")
      .insert({
        action: "lgpd_erase",
        table_name: "auth.users",
        record_id: userId,
        user_id: caller.id,
        user_email: caller.email ?? null,
        new_data: {
          timestamp: new Date().toISOString(),
          status: "success",
          erased_by: caller.id,
        },
      });
    if (auditError) {
      log.error("[lgpd-erase-user] Falha ao registrar auditoria do apagamento:", {
        step: "audit_logs.insert",
        code: auditError.code,
        message: auditError.message,
      });
      throw new Error("Falha ao registrar auditoria do apagamento");
    }

    return new Response(
      JSON.stringify({ message: "User data erased/anonymized successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    // O erro do Postgres já foi registrado no passo correspondente; aqui só sai a resposta genérica.
    return internalErrorResponse(error, corsHeaders, "lgpd-erase-user");
  }
});
