import { safeFetch } from "../_shared/safeFetch.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withCircuitBreaker } from "../_shared/circuitBreaker.ts";
import { log } from "../_shared/logger.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { ValidationError, validationErrorResponse } from "../_shared/validate.ts";
import { parseDriverId, parseOrderId } from "./parse.ts";

const LALAMOVE_SANDBOX_URL = "https://rest.sandbox.lalamove.com";
const LALAMOVE_PRODUCTION_URL = "https://rest.lalamove.com";

// Generate HMAC-SHA256 signature for Lalamove API using Web Crypto API
async function generateSignature(
  secret: string,
  timestamp: string,
  method: string,
  path: string,
  body: string = "",
): Promise<string> {
  const rawSignature = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${body}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(rawSignature);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, messageData);

  // Convert to hex string
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Make authenticated request to Lalamove API
async function lalamoveRequest(
  method: string,
  path: string,
  body?: object,
  useSandbox = true,
): Promise<Response> {
  const apiKey = Deno.env.get("LALAMOVE_API_KEY");
  const apiSecret = Deno.env.get("LALAMOVE_API_SECRET");

  if (!apiKey || !apiSecret) {
    throw new Error("Lalamove API credentials not configured");
  }

  const timestamp = Date.now().toString();
  const baseUrl = useSandbox ? LALAMOVE_SANDBOX_URL : LALAMOVE_PRODUCTION_URL;
  const bodyStr = body ? JSON.stringify(body) : "";

  const signature = await generateSignature(
    apiSecret,
    timestamp,
    method,
    path,
    bodyStr,
  );
  const token = `${apiKey}:${timestamp}:${signature}`;

  log.info(`Making Lalamove request: ${method} ${path}`);

  const response = await safeFetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `hmac ${token}`,
      "Content-Type": "application/json",
      Market: "BR", // Brazil market
      "Request-ID": crypto.randomUUID(),
    },
    body: body ? bodyStr : undefined,
  });

  return response;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let action: string | undefined;
  try {
    const body = await req.json();
    action = body.action;
    const { useSandbox = true } = body;

    log.info(`Lalamove tracking action: ${action}`);

    switch (action) {
      case "test":
        return new Response(JSON.stringify({ status: "ok" }), {
          headers: corsHeaders,
        });

      case "getOrderDetails": {
        const orderId = parseOrderId(body);

        const result = await withCircuitBreaker("lalamove-api", async () => {
          const response = await lalamoveRequest(
            "GET",
            `/v3/orders/${orderId}`,
            undefined,
            useSandbox,
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to get order details");
          }

          return await response.json();
        });

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "getDriverLocation": {
        const orderId = parseOrderId(body);
        const driverId = parseDriverId(body);

        const result = await withCircuitBreaker("lalamove-api", async () => {
          const response = await lalamoveRequest(
            "GET",
            `/v3/orders/${orderId}/drivers/${driverId}`,
            undefined,
            useSandbox,
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.message || "Failed to get driver location",
            );
          }

          return await response.json();
        });

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return validationErrorResponse(error, corsHeaders);
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    const isCircuitOpen = message.includes("Circuit Breaker");

    log("ERROR", "Lalamove tracking error", { error: message, action });

    return new Response(
      JSON.stringify({
        error: message,
        circuitOpen: isCircuitOpen,
      }),
      {
        status: isCircuitOpen ? 503 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
