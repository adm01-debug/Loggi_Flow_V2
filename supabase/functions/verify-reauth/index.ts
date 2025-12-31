import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReauthRequest {
  action: "change_password" | "change_email" | "configure_mfa" | "admin_action" | "delete_account";
  current_password: string;
}

// Actions that require re-authentication
const SENSITIVE_ACTIONS = [
  "change_password",
  "change_email", 
  "configure_mfa",
  "admin_action",
  "delete_account",
];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify the current user
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, current_password }: ReauthRequest = await req.json();

    if (!action || !SENSITIVE_ACTIONS.includes(action)) {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!current_password) {
      return new Response(
        JSON.stringify({ error: "Current password is required for re-authentication" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Re-authentication attempt for user ${user.id}, action: ${action}`);

    // Verify password by attempting sign in
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email!,
      password: current_password,
    });

    if (signInError) {
      // Log failed re-authentication
      await supabaseAdmin.from("security_events").insert([{
        user_id: user.id,
        event_type: "reauth_failed",
        severity: "warning",
        description: `Falha na re-autenticação para ação: ${action}`,
        ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
        user_agent: req.headers.get("user-agent") || null,
        metadata: { action },
      }]);

      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: "Senha incorreta" 
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log successful re-authentication
    await supabaseAdmin.from("security_events").insert([{
      user_id: user.id,
      event_type: "reauth_success",
      severity: "info",
      description: `Re-autenticação bem-sucedida para ação: ${action}`,
      ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      user_agent: req.headers.get("user-agent") || null,
      metadata: { action },
    }]);

    // Generate a short-lived token for the sensitive action
    const reauthToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    return new Response(
      JSON.stringify({ 
        verified: true,
        reauth_token: reauthToken,
        expires_at: expiresAt.toISOString(),
        message: "Re-autenticação bem-sucedida. Você pode prosseguir com a ação."
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Re-authentication error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
