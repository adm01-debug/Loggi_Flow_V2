import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { log } from "../_shared/logger.ts";
import { safeFetch } from "../_shared/safeFetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();

    if (!address) {
      return new Response(JSON.stringify({ error: "Address is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mapboxToken = Deno.env.get("MAPBOX_PUBLIC_TOKEN");

    if (!mapboxToken) {
      return new Response(
        JSON.stringify({ error: "Mapbox token not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Encode the address for URL
    const encodedAddress = encodeURIComponent(address);

    // Call Mapbox Geocoding API
    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&country=BR&limit=1&language=pt`;

    log.info(`Geocoding address: ${address}`);

    const response = await fetch(geocodeUrl);

    if (!response.ok) {
      log.error(
        "Mapbox API error:",
        response.status,
        await response.text(),
      );
      return new Response(JSON.stringify({ error: "Geocoding failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      log.info("No results found for address:", address);
      return new Response(
        JSON.stringify({ coordinates: null, message: "Address not found" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const [lng, lat] = data.features[0].center;
    const placeName = data.features[0].place_name;

    log.info(`Geocoded: ${address} -> ${lat}, ${lng}`);

    return new Response(
      JSON.stringify({
        coordinates: { lat, lng },
        placeName,
        confidence: data.features[0].relevance,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    log.error("Geocoding error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
