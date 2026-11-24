import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { log, redact } from "../_shared/logger.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

interface LogAttemptRequest {
  email: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  failure_reason?: string;
}

serve(async (req: Request) => {
  const headers = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const {
      email,
      ip_address,
      user_agent,
      success,
      failure_reason,
    }: LogAttemptRequest = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    log.info(`Logging login attempt for: ${redact(email)}, success: ${success}`);

    const { error } = await supabaseAdmin.from("login_attempts").insert({
      email,
      ip_address,
      user_agent,
      success,
      failure_reason: failure_reason || null,
    });

    if (error) {
      log.error("Error logging attempt:", error);
      throw error;
    }

    return new Response(JSON.stringify({ logged: true }), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    log.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});
