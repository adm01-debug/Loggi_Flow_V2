import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    console.log("Starting cleanup of old rate limit logs...");

    // Delete rate limit logs older than 7 days
    const rateLimitCutoff = new Date();
    rateLimitCutoff.setDate(rateLimitCutoff.getDate() - 7);

    const { error: rateLimitError } = await supabaseAdmin
      .from("rate_limit_logs")
      .delete()
      .lt("created_at", rateLimitCutoff.toISOString());

    if (rateLimitError) {
      console.error("Error deleting rate limit logs:", rateLimitError);
    } else {
      console.log("Deleted old rate limit logs");
    }

    // Delete login attempts older than 30 days
    const loginAttemptsCutoff = new Date();
    loginAttemptsCutoff.setDate(loginAttemptsCutoff.getDate() - 30);

    const { error: loginError } = await supabaseAdmin
      .from("login_attempts")
      .delete()
      .lt("created_at", loginAttemptsCutoff.toISOString());

    if (loginError) {
      console.error("Error deleting login attempts:", loginError);
    } else {
      console.log("Deleted old login attempts");
    }

    // Delete security events older than 90 days
    const securityEventsCutoff = new Date();
    securityEventsCutoff.setDate(securityEventsCutoff.getDate() - 90);

    const { error: securityError } = await supabaseAdmin
      .from("security_events")
      .delete()
      .lt("created_at", securityEventsCutoff.toISOString());

    if (securityError) {
      console.error("Error deleting security events:", securityError);
    } else {
      console.log("Deleted old security events");
    }

    // Delete expired account lockouts
    const { error: lockoutError } = await supabaseAdmin
      .from("account_lockouts")
      .delete()
      .lt("locked_until", new Date().toISOString());

    if (lockoutError) {
      console.error("Error deleting expired lockouts:", lockoutError);
    } else {
      console.log("Deleted expired lockouts");
    }

    // Delete expired user sessions
    const { error: sessionError } = await supabaseAdmin
      .from("user_sessions")
      .delete()
      .lt("expires_at", new Date().toISOString());

    if (sessionError) {
      console.error("Error deleting expired sessions:", sessionError);
    } else {
      console.log("Deleted expired sessions");
    }

    // Delete expired email verification tokens
    const { error: tokenError } = await supabaseAdmin
      .from("email_verification_tokens")
      .delete()
      .lt("expires_at", new Date().toISOString());

    if (tokenError) {
      console.error("Error deleting expired tokens:", tokenError);
    } else {
      console.log("Deleted expired verification tokens");
    }

    const summary = {
      cleaned_at: new Date().toISOString(),
      status: "completed"
    };

    console.log("Cleanup completed:", summary);

    return new Response(
      JSON.stringify({ success: true, summary }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Cleanup error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
