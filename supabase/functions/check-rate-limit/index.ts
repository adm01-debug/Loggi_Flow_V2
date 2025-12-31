import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RateLimitRequest {
  ip_address: string;
  endpoint: string;
  user_id?: string;
}

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // 100 requests per minute
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes block

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

    const { ip_address, endpoint, user_id }: RateLimitRequest = await req.json();

    if (!ip_address || !endpoint) {
      return new Response(
        JSON.stringify({ error: "ip_address and endpoint are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Rate limit check for IP: ${ip_address}, endpoint: ${endpoint}`);

    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

    // Check if IP is currently blocked
    const { data: existingBlock } = await supabaseAdmin
      .from("rate_limit_logs")
      .select("*")
      .eq("ip_address", ip_address)
      .eq("blocked", true)
      .gte("created_at", new Date(Date.now() - BLOCK_DURATION_MS).toISOString())
      .limit(1);

    if (existingBlock && existingBlock.length > 0) {
      // Log the blocked attempt
      await supabaseAdmin.from("rate_limit_logs").insert([{
        ip_address,
        endpoint,
        user_id: user_id || null,
        request_count: 1,
        blocked: true,
        window_start: windowStart,
      }]);

      // Log security event
      await supabaseAdmin.from("security_events").insert([{
        user_id: user_id || null,
        event_type: "rate_limit_blocked",
        severity: "warning",
        description: `IP ${ip_address} bloqueado por rate limiting em ${endpoint}`,
        ip_address,
        metadata: { endpoint, reason: "existing_block" },
      }]);

      return new Response(
        JSON.stringify({ 
          allowed: false, 
          blocked: true,
          message: "IP temporariamente bloqueado por excesso de requisições",
          retry_after: BLOCK_DURATION_MS / 1000
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Count requests in current window
    const { data: recentRequests, error: countError } = await supabaseAdmin
      .from("rate_limit_logs")
      .select("id", { count: "exact" })
      .eq("ip_address", ip_address)
      .eq("endpoint", endpoint)
      .gte("window_start", windowStart);

    if (countError) {
      console.error("Error counting requests:", countError);
      throw countError;
    }

    const requestCount = (recentRequests?.length || 0) + 1;
    const isBlocked = requestCount > MAX_REQUESTS_PER_WINDOW;

    // Log the request
    await supabaseAdmin.from("rate_limit_logs").insert([{
      ip_address,
      endpoint,
      user_id: user_id || null,
      request_count: requestCount,
      blocked: isBlocked,
      window_start: windowStart,
    }]);

    if (isBlocked) {
      // Log security event for new block
      await supabaseAdmin.from("security_events").insert([{
        user_id: user_id || null,
        event_type: "rate_limit_exceeded",
        severity: "warning",
        description: `IP ${ip_address} excedeu limite de ${MAX_REQUESTS_PER_WINDOW} req/min em ${endpoint}`,
        ip_address,
        metadata: { endpoint, request_count: requestCount, limit: MAX_REQUESTS_PER_WINDOW },
      }]);

      return new Response(
        JSON.stringify({ 
          allowed: false, 
          blocked: true,
          message: "Limite de requisições excedido",
          retry_after: BLOCK_DURATION_MS / 1000
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        allowed: true, 
        blocked: false,
        remaining: MAX_REQUESTS_PER_WINDOW - requestCount,
        reset_in: RATE_LIMIT_WINDOW_MS / 1000
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Rate limit error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
