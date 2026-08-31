import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

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

    if (!userId) throw new Error("User ID is required");

    // 1. Apagar dados PII
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) throw profileError;

    // 2. Anonimizar entregas vinculadas
    const { error: anonError } = await supabaseClient
      .from("entregas")
      .update({
        cliente_nome: "ANONIMIZADO",
        cliente_email: "anon@example.com",
        cliente_documento: "000.000.000-00",
      })
      .eq("user_id", userId);

    if (anonError) throw anonError;

    // 3. Delete the auth user so they can no longer sign in
    const { error: deleteAuthError } =
      await supabaseClient.auth.admin.deleteUser(userId);
    if (deleteAuthError) throw deleteAuthError;

    // 4. Registrar no log de auditoria
    await supabaseClient.from("audit_logs").insert({
      event: "lgpd_erase",
      user_id: userId,
      metadata: {
        timestamp: new Date().toISOString(),
        status: "success",
        erased_by: caller.id,
      },
    });

    return new Response(
      JSON.stringify({ message: "User data erased/anonymized successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
