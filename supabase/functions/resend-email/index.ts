import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireInternalSecret, requireUser } from "../_shared/auth.ts";
import { safeFetch } from "../_shared/safeFetch.ts";
import { ValidationError, validationErrorResponse } from "../_shared/validate.ts";
import { log } from "../_shared/logger.ts";
import { internalErrorResponse } from "../_shared/httpError.ts";
import { parseEmailRequest } from "./parse.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const headers = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    // Só functions internas: exige Bearer service_role ou x-internal-secret.
    if (!requireInternalSecret(req)) {
      const auth = await requireUser(req);
      if (!auth.ok || auth.claims.role !== "service_role") {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized" }),
          {
            status: 401,
            headers: { ...headers, "Content-Type": "application/json" },
          },
        );
      }
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const { to, subject, html, from } = parseEmailRequest(
      (await req.json()) as Record<string, unknown>,
    );

    const response = await safeFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: from || "LogiFlow <notificacoes@promobrindes.com.br>",
        to,
        subject,
        html,
      }),
    });

    const data = await response.json();
    if (data.error) {
      // A resposta do Resend carrega destino, dominio e id da chave: fica no log.
      log.error("[resend-email] Provedor recusou o envio:", {
        status: response.status,
        body: JSON.stringify(data).slice(0, 500),
      });
      throw new Error("Falha ao enviar o e-mail pelo provedor");
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return validationErrorResponse(error, headers);
    }

    return internalErrorResponse(error, headers, "resend-email");
  }
});
