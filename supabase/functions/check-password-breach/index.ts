import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { log } from "../_shared/logger.ts";
import { safeFetch } from "../_shared/safeFetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Generate SHA-1 hash of password
async function sha1(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password } = await req.json();

    if (!password || typeof password !== "string") {
      return new Response(JSON.stringify({ error: "Password is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate SHA-1 hash of password
    const hash = await sha1(password);
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    log.info(`Checking password hash prefix: ${prefix}...`);

    // Query HIBP API using k-anonymity model
    // This only sends the first 5 characters of the hash, protecting the actual password
    const response = await safeFetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        headers: {
          "User-Agent": "LogiFlow-PasswordCheck",
        },
      },
    );

    if (!response.ok) {
      log.error(`HIBP API error: ${response.status}`);
      // If API fails, allow the password (fail open)
      return new Response(JSON.stringify({ pwned: false, count: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text = await response.text();
    const lines = text.split("\n");

    // Check if our suffix is in the returned list
    let pwnedCount = 0;
    for (const line of lines) {
      const [hashSuffix, count] = line.split(":");
      if (hashSuffix.trim() === suffix) {
        pwnedCount = parseInt(count.trim(), 10);
        break;
      }
    }

    const isPwned = pwnedCount > 0;

    log.info(
      `Password check result: ${isPwned ? `PWNED (${pwnedCount} times)` : "SAFE"}`,
    );

    return new Response(
      JSON.stringify({
        pwned: isPwned,
        count: pwnedCount,
        message: isPwned
          ? `Esta senha foi encontrada em ${pwnedCount.toLocaleString()} vazamentos de dados. Escolha outra senha.`
          : null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    log.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
