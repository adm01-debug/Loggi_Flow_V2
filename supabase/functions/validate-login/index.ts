import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
      console.log(`Skipping geolocation for private/local IP: ${ip}`);
      return null;
    }

    // Use ip-api.com (free, no API key required, 45 req/min limit)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode,country`);
    
    if (!response.ok) {
      console.error(`Geolocation API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data.status === "success") {
      return {
        country_code: data.countryCode,
        country_name: data.country,
      };
    }

    console.log(`Geolocation failed for IP ${ip}: ${data.message || "Unknown error"}`);
    return null;
  } catch (error) {
    console.error(`Error getting geolocation for IP ${ip}:`, error);
    return null;
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    const { email, ip_address, user_agent }: ValidateLoginRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Validating login for: ${email} from IP: ${ip_address}`);

    // Check if IP is in blacklist
    if (ip_address) {
      const { data: blacklistRules, error: blacklistError } = await supabaseAdmin
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

            console.log(`IP ${ip_address} is blacklisted`);
            return new Response(
              JSON.stringify({ 
                allowed: false, 
                reason: "Acesso negado: IP bloqueado" 
              }),
              { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }

      // Check if whitelist is enabled and IP is in it
      const { data: whitelistRules, error: whitelistError } = await supabaseAdmin
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

          console.log(`IP ${ip_address} is not whitelisted`);
          return new Response(
            JSON.stringify({ 
              allowed: false, 
              reason: "Acesso negado: IP não autorizado" 
            }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
          const allowedCountries = geoRules.map(r => r.country_code);
          
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

            console.log(`Access denied for country ${geoLocation.country_name} (${geoLocation.country_code})`);
            return new Response(
              JSON.stringify({ 
                allowed: false, 
                reason: `Acesso negado: País não autorizado (${geoLocation.country_name})` 
              }),
              { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          console.log(`Country ${geoLocation.country_name} is allowed`);
        } else {
          console.log(`Could not determine country for IP ${ip_address}, allowing access`);
        }
      }
    }

    // Check for too many failed attempts from this IP in last 15 minutes
    if (ip_address) {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      
      const { data: recentFailures, error: failuresError } = await supabaseAdmin
        .from("login_attempts")
        .select("id")
        .eq("ip_address", ip_address)
        .eq("success", false)
        .gte("created_at", fifteenMinutesAgo);

      if (!failuresError && recentFailures && recentFailures.length >= 5) {
        // Log the blocked attempt
        await supabaseAdmin.from("login_attempts").insert({
          email,
          ip_address,
          user_agent,
          success: false,
          failure_reason: "Muitas tentativas falhas",
        });

        console.log(`Too many failed attempts from IP ${ip_address}`);
        return new Response(
          JSON.stringify({ 
            allowed: false, 
            reason: "Muitas tentativas falhas. Tente novamente em 15 minutos." 
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log(`Login validation passed for: ${email}`);
    return new Response(
      JSON.stringify({ allowed: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
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
    
    const ipBits = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    const networkBits = (networkParts[0] << 24) | (networkParts[1] << 16) | (networkParts[2] << 8) | networkParts[3];
    
    const maskBits = ~((1 << (32 - mask)) - 1);
    
    return (ipBits & maskBits) === (networkBits & maskBits);
  }
  
  return false;
}
