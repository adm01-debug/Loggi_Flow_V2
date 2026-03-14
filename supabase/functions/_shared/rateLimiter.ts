import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RateLimitConfig {
  windowMs?: number;
  maxRequests?: number;
  blockDurationMs?: number;
}

const DEFAULT_CONFIG: Required<RateLimitConfig> = {
  windowMs: 60_000,       // 1 minute
  maxRequests: 60,         // 60 req/min
  blockDurationMs: 15 * 60_000, // 15 min block
};

/**
 * Lightweight inline rate limiter that checks the rate_limit_logs table.
 * Returns { allowed, remaining } or throws on block.
 */
export async function checkRateLimit(
  req: Request,
  endpoint: string,
  config?: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number }> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const windowStart = new Date(Date.now() - cfg.windowMs).toISOString();

  // Check existing block
  const { data: blocked } = await supabase
    .from("rate_limit_logs")
    .select("id")
    .eq("ip_address", ip)
    .eq("blocked", true)
    .gte("created_at", new Date(Date.now() - cfg.blockDurationMs).toISOString())
    .limit(1);

  if (blocked && blocked.length > 0) {
    return { allowed: false, remaining: 0 };
  }

  // Count recent requests
  const { count } = await supabase
    .from("rate_limit_logs")
    .select("id", { count: "exact", head: true })
    .eq("ip_address", ip)
    .eq("endpoint", endpoint)
    .gte("window_start", windowStart);

  const requestCount = (count || 0) + 1;
  const isBlocked = requestCount > cfg.maxRequests;

  // Log
  await supabase.from("rate_limit_logs").insert([{
    ip_address: ip,
    endpoint,
    request_count: requestCount,
    blocked: isBlocked,
    window_start: windowStart,
  }]);

  return {
    allowed: !isBlocked,
    remaining: Math.max(0, cfg.maxRequests - requestCount),
  };
}
