import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { log } from "../_shared/logger.ts";

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
      log('WARN', 'ip_address and endpoint are required for rate limiting');
      return new Response(
        JSON.stringify({ error: "ip_address and endpoint are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log('INFO', `Rate limit check for IP: ${ip_address}, endpoint: ${endpoint}`);

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
      log('WARN', `IP ${ip_address} is already blocked`, { endpoint });
      
      // Log the blocked attempt
      await supabaseAdmin.from("rate_limit_logs").insert([{
        ip_address,
        endpoint,
        user_id: user_id || null,
        request_count: 1,
        blocked: true,
        window_start: windowStart,
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
      .select("id")
      .eq("ip_address", ip_address)
      .eq("endpoint", endpoint)
      .gte("window_start", windowStart);

    if (countError) {
      log('ERROR', 'Error counting requests', { error: countError.message });
      throw countError;
    }

    const requestCount = (recentRequests?.length || 0) + 1;

    if (requestCount > MAX_REQUESTS_PER_WINDOW) {
      log('ERROR', `Rate limit exceeded for IP: ${ip_address}`, { endpoint, count: requestCount });
      
      // Block the IP
      await supabaseAdmin.from("rate_limit_logs").insert([{
        ip_address,
        endpoint,
        user_id: user_id || null,
        request_count: requestCount,
        blocked: true,
        window_start: windowStart,
      }]);

      // Log security event
      await supabaseAdmin.from("security_events").insert([{
        user_id: user_id || null,
        event_type: "rate_limit_exceeded",
        severity: "critical",
        description: `IP ${ip_address} excedeu o limite de requisições em ${endpoint}`,
        ip_address,
        metadata: { endpoint, count: requestCount },
      }]);

      return new Response(
        JSON.stringify({ 
          allowed: false, 
          blocked: true,
          message: "Limite de requisições excedido. IP bloqueado temporariamente.",
          retry_after: BLOCK_DURATION_MS / 1000
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log successful attempt
    await supabaseAdmin.from("rate_limit_logs").insert([{
      ip_address,
      endpoint,
      user_id: user_id || null,
      request_count: requestCount,
      blocked: false,
      window_start: windowStart,
    }]);

    return new Response(
      JSON.stringify({ allowed: true, current_count: requestCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    log('ERROR', 'Rate limit function error', { error: error.message });
    return new Response(
      JSON.stringify({ error: "INTERNAL_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
