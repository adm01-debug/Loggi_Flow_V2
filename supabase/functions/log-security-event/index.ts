import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { log } from "../_shared/logger.ts";

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

    log.info(`Logging security event: ${event.event_type} - ${event.description}`);

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
      log.error("Error logging security event:", error);
      throw error;
    }

    // P24: send real alert on critical events via Resend + Slack webhook
    if (event.severity === "critical") {
      log.warn("CRITICAL SECURITY EVENT:", { description: event.description });
      const resendKey = Deno.env.get("RESEND_API_KEY");
      const alertEmail = Deno.env.get("SECURITY_ALERT_EMAIL");
      const slackWebhook = Deno.env.get("SECURITY_SLACK_WEBHOOK_URL");

      const alertPayload = {
        subject: `🚨 [${event.event_type}] Security Alert`,
        body: `${event.description}\nIP: ${ipAddress ?? "n/a"}\nUser: ${event.user_id ?? "anon"}\nUA: ${userAgent ?? "n/a"}`,
      };

      const tasks: Promise<Response>[] = [];
      if (resendKey && alertEmail) {
        tasks.push(fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "security@logiflow.app",
            to: [alertEmail],
            subject: alertPayload.subject,
            text: alertPayload.body,
          }),
        }));
      }
      if (slackWebhook) {
        tasks.push(fetch(slackWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: `${alertPayload.subject}\n\`\`\`${alertPayload.body}\`\`\`` }),
        }));
      }
      if (tasks.length) {
        const results = await Promise.allSettled(tasks);
        results.forEach((r) => {
          if (r.status === "rejected") log.error("Alert dispatch failed", { reason: String(r.reason) });
          else void r.value.text();
        });
      }
    }


    return new Response(
      JSON.stringify({ success: true, event_id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    log.error("Security event logging error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
