import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SecurityEventRequest {
  user_id?: string;
  event_type: string;
  severity?: "info" | "warning" | "critical";
  description: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
}

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

    const event: SecurityEventRequest = await req.json();

    if (!event.event_type || !event.description) {
      return new Response(
        JSON.stringify({ error: "event_type and description are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get IP from request headers if not provided
    const ipAddress = event.ip_address || 
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    const userAgent = event.user_agent || req.headers.get("user-agent") || null;

    console.log(`Logging security event: ${event.event_type} - ${event.description}`);

    const { data, error } = await supabaseAdmin.from("security_events").insert([{
      user_id: event.user_id || null,
      event_type: event.event_type,
      severity: event.severity || "info",
      description: event.description,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: event.metadata || {},
    }]).select().single();

    if (error) {
      console.error("Error logging security event:", error);
      throw error;
    }

    // For critical events, we could send alerts (email, Slack, etc.)
    if (event.severity === "critical") {
      console.warn("CRITICAL SECURITY EVENT:", event.description);
      // TODO: Implement alert notifications (email, Slack webhook, etc.)
    }

    return new Response(
      JSON.stringify({ success: true, event_id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Security event logging error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
