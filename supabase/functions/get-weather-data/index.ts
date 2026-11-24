import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { safeFetch } from "../_shared/safeFetch.ts";
import { log } from "../_shared/logger.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const headers = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const WEATHER_API_KEY = Deno.env.get("OPENWEATHER_API_KEY");
    if (!WEATHER_API_KEY) {
      throw new Error("Missing OPENWEATHER_API_KEY");
    }

    // Get coordinates from query params (defaults to SP)
    const url = new URL(req.url);
    const lat = url.searchParams.get("lat") || "-23.5505";
    const lon = url.searchParams.get("lon") || "-46.6333";

    const response = await safeFetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`,
      { timeout: 8000, allowedHosts: ["api.openweathermap.org"] },
    );
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    log.error("Weather lookup failed:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return new Response(JSON.stringify({ error: "INTERNAL_ERROR" }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
