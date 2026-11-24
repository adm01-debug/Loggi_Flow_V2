import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const headers = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const token = Deno.env.get('MAPBOX_PUBLIC_TOKEN');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Mapbox token not configured' }),
        { status: 404, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ token }),
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  }
});
