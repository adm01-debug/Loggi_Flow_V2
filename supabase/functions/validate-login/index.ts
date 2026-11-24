import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { log, redact } from "../_shared/logger.ts";
import { safeFetch } from "../_shared/safeFetch.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

interface ValidateLoginRequest {
  email: string;
  ip_address?: string;
  user_agent?: string;
}

interface GeoLocation {
  country_code: string;
  country_name: string;
}

// Get country from IP using free API
async function getCountryFromIP(ip: string): Promise<GeoLocation | null> {
  try {
    // Skip geolocation for localhost/private IPs
    if (
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.") ||
      ip.startsWith("172.")
    ) {
      log.info(`Skipping geolocation for private/local IP: ${ip}`);
      return null;
    }

    // Use ip-api.com (free, no API key required, 45 req/min limit)
    const response = await safeFetch(
      `http://ip-api.com/json/${ip}?fields=status,countryCode,country`,
    );

    if (!response.ok) {
      log.error(`Geolocation API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.status === "success") {
      return {
        country_code: data.countryCode,
        country_name: data.country,
      };
    }

    log.info(
      `Geolocation failed for IP ${ip}: ${data.message || "Unknown error"}`,
    );
    return null;
  } catch (error) {
    log.error(`Error getting geolocation for IP ${ip}:`, error);
    return null;
  }
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

    const { email, ip_address, user_agent }: ValidateLoginRequest =
      await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    log.info(`Validating login for: ${redact(email)} from IP: ${ip_address}`);

    // Check if IP is in blacklist
    if (ip_address) {
      const { data: blacklistRules, error: blacklistError } =
        await supabaseAdmin
          .from("ip_access_rules")
          .select("*")
          .eq("rule_type", "blacklist")
          .eq("is_active", true);

      if (!blacklistError && blacklistRules) {
        for (const rule of blacklistRules) {
          if (matchIP(ip_address, rule.ip_pattern)) {
            // Log the blocked attempt
            await supabaseAdmin.from("login_attempts").insert({
              email,
              ip_address,
              user_agent,
              success: false,
              failure_reason: "IP bloqueado",
            });

            log.info(`IP ${ip_address} is blacklisted`);
            return new Response(
              JSON.stringify({
                allowed: false,
                reason: "Acesso negado: IP bloqueado",
              }),
              {
                status: 403,
                headers: { ...headers, "Content-Type": "application/json" },
              },
            );
          }
        }
      }

      // Check if whitelist is enabled and IP is in it
      const { data: whitelistRules, error: whitelistError } =
        await supabaseAdmin
          .from("ip_access_rules")
          .select("*")
          .eq("rule_type", "whitelist")
          .eq("is_active", true);

      if (!whitelistError && whitelistRules && whitelistRules.length > 0) {
        // Whitelist mode enabled - only allow whitelisted IPs
        let isWhitelisted = false;
        for (const rule of whitelistRules) {
          if (matchIP(ip_address, rule.ip_pattern)) {
            isWhitelisted = true;
            break;
          }
        }

        if (!isWhitelisted) {
          // Log the blocked attempt
          await supabaseAdmin.from("login_attempts").insert({
            email,
            ip_address,
            user_agent,
            success: false,
            failure_reason: "IP não autorizado",
          });

          log.info(`IP ${ip_address} is not whitelisted`);
          return new Response(
            JSON.stringify({
              allowed: false,
              reason: "Acesso negado: IP não autorizado",
            }),
            {
              status: 403,
              headers: { ...headers, "Content-Type": "application/json" },
            },
          );
        }
      }

      // Check geographic restrictions
      const { data: geoRules, error: geoError } = await supabaseAdmin
        .from("geo_access_rules")
        .select("country_code")
        .eq("is_active", true);

      if (!geoError && geoRules && geoRules.length > 0) {
        // Geo whitelist is enabled - check user's country
        const geoLocation = await getCountryFromIP(ip_address);

        if (geoLocation) {
          const allowedCountries = geoRules.map((r) => r.country_code);

          if (!allowedCountries.includes(geoLocation.country_code)) {
            // Log the blocked attempt to geo_blocked_attempts
            await supabaseAdmin.from("geo_blocked_attempts").insert({
              ip_address,
              country_code: geoLocation.country_code,
              country_name: geoLocation.country_name,
              email,
              user_agent,
            });

            // Also log to login_attempts
            await supabaseAdmin.from("login_attempts").insert({
              email,
              ip_address,
              user_agent,
              success: false,
              failure_reason: `País bloqueado: ${geoLocation.country_name}`,
            });

            log.info(
              `Access denied for country ${geoLocation.country_name} (${geoLocation.country_code})`,
            );
            return new Response(
              JSON.stringify({
                allowed: false,
                reason: `Acesso negado: País não autorizado (${geoLocation.country_name})`,
              }),
              {
                status: 403,
                headers: { ...headers, "Content-Type": "application/json" },
              },
            );
          }

          log.info(`Country ${geoLocation.country_name} is allowed`);
        } else {
          log.info(
            `Could not determine country for IP ${ip_address}, allowing access`,
          );
        }
      }
    }

    // Check for too many failed attempts with exponential backoff
    if (ip_address) {
      // Get all failed attempts from this IP in the last 24 hours
      const twentyFourHoursAgo = new Date(
        Date.now() - 24 * 60 * 60 * 1000,
      ).toISOString();

      const { data: recentFailures, error: failuresError } = await supabaseAdmin
        .from("login_attempts")
        .select("id, created_at")
        .eq("ip_address", ip_address)
        .eq("success", false)
        .gte("created_at", twentyFourHoursAgo)
        .order("created_at", { ascending: false });

      if (!failuresError && recentFailures && recentFailures.length >= 5) {
        // Calculate lockout duration based on number of failed attempts (exponential backoff)
        // 5 attempts: 1 min, 6: 2 min, 7: 4 min, 8: 8 min, 9: 16 min, 10+: 30 min max
        const failureCount = recentFailures.length;
        const baseMinutes = 1;
        const exponent = Math.min(failureCount - 5, 5); // Cap at 5 (32 minutes max)
        const lockoutMinutes = Math.min(
          baseMinutes * Math.pow(2, exponent),
          30,
        );

        // Check if the most recent failure is within the lockout period
        const lastFailure = new Date(recentFailures[0].created_at);
        const lockoutEndsAt = new Date(
          lastFailure.getTime() + lockoutMinutes * 60 * 1000,
        );
        const now = new Date();

        if (now < lockoutEndsAt) {
          const remainingSeconds = Math.ceil(
            (lockoutEndsAt.getTime() - now.getTime()) / 1000,
          );
          const remainingMinutes = Math.ceil(remainingSeconds / 60);

          // Log the blocked attempt
          await supabaseAdmin.from("login_attempts").insert({
            email,
            ip_address,
            user_agent,
            success: false,
            failure_reason: `Bloqueado temporariamente (${failureCount} tentativas falhas)`,
          });

          log.info(
            `IP ${ip_address} is temporarily blocked. ${failureCount} failures, ${remainingMinutes} min remaining`,
          );

          return new Response(
            JSON.stringify({
              allowed: false,
              reason: `Conta temporariamente bloqueada após ${failureCount} tentativas falhas. Tente novamente em ${remainingMinutes} minuto${remainingMinutes > 1 ? "s" : ""}.`,
              lockout_ends_at: lockoutEndsAt.toISOString(),
              remaining_seconds: remainingSeconds,
              failure_count: failureCount,
            }),
            {
              status: 429,
              headers: { ...headers, "Content-Type": "application/json" },
            },
          );
        } else {
          log.info(
            `Lockout period expired for IP ${ip_address}, allowing attempt`,
          );
        }
      }
    }

    log.info(`Login validation passed for: ${redact(email)}`);
    return new Response(JSON.stringify({ allowed: true }), {
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

// Helper function to match IP addresses with patterns
function matchIP(ip: string, pattern: string): boolean {
  if (pattern === "*") return true;

  // Exact match
  if (ip === pattern) return true;

  // CIDR notation (simplified check)
  if (pattern.includes("/")) {
    const [network, maskStr] = pattern.split("/");
    const mask = parseInt(maskStr);

    const ipParts = ip.split(".").map(Number);
    const networkParts = network.split(".").map(Number);

    const ipBits =
      (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    const networkBits =
      (networkParts[0] << 24) |
      (networkParts[1] << 16) |
      (networkParts[2] << 8) |
      networkParts[3];

    const maskBits = ~((1 << (32 - mask)) - 1);

    return (ipBits & maskBits) === (networkBits & maskBits);
  }

  return false;
}
