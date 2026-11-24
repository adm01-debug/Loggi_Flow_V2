import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { log, redact } from "../_shared/logger.ts";
import { invokeFunction } from "../_shared/invokeFunction.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

// Curto de proposito: a tela do admin espera a resposta.
const SEND_EMAIL_TIMEOUT_MS = 5_000;

interface SendResetRequest {
  requestId: string;
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

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      log.error("No authorization header provided");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      log.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (rolesError || !roles || roles.length === 0) {
      log.error("User is not an admin");
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        {
          status: 403,
          headers: { ...headers, "Content-Type": "application/json" },
        },
      );
    }

    const { requestId }: SendResetRequest = await req.json();

    if (!requestId) {
      return new Response(JSON.stringify({ error: "Request ID is required" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    log.info(`Processing password reset request: ${requestId}`);

    // Get the request details
    const { data: resetRequest, error: fetchError } = await supabaseAdmin
      .from("password_reset_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !resetRequest) {
      log.error("Error fetching request:", fetchError);
      return new Response(
        JSON.stringify({ error: "Reset request not found" }),
        {
          status: 404,
          headers: { ...headers, "Content-Type": "application/json" },
        },
      );
    }

    if (resetRequest.status !== "pending") {
      return new Response(
        JSON.stringify({ error: "Request has already been processed" }),
        {
          status: 400,
          headers: { ...headers, "Content-Type": "application/json" },
        },
      );
    }

    // Get the origin from the request headers or use the production domain.
    // (AGENTS.md:88, docs/agentes/deploy.md:9)
    const origin =
      req.headers.get("origin") || "https://loggi-flow-v2.vercel.app";
    const redirectTo = `${origin}/reset-password`;

    log.info(`Generating password reset link for: ${redact(resetRequest.email)}`);
    log.info(`Redirect URL: ${redirectTo}`);

    // generateLink só gera o link de recuperação — NÃO envia e-mail. O envio
    // real é feito abaixo, via a function interna resend-email (mesmo padrão
    // de accuracy-weekly-digest/index.ts).
    const { data: linkData, error: resetError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: resetRequest.email,
        options: {
          redirectTo: redirectTo,
        },
      });

    if (resetError || !linkData?.properties?.action_link) {
      log.error("Error generating reset link:", resetError);
      return new Response(
        JSON.stringify({
          error: `Failed to generate reset link: ${resetError?.message ?? "no action_link returned"}`,
        }),
        {
          status: 500,
          headers: { ...headers, "Content-Type": "application/json" },
        },
      );
    }

    const actionLink = linkData.properties.action_link;

    log.info(`Sending password reset email to: ${redact(resetRequest.email)}`);
    const envio = await invokeFunction(
      "resend-email",
      {
        to: resetRequest.email,
        subject: "Redefinição de senha — LogiFlow",
        html: `<p>Você solicitou a redefinição de senha da sua conta LogiFlow.</p>
<p><a href="${actionLink}">Clique aqui para definir uma nova senha</a>.</p>
<p>Se você não solicitou isso, ignore este e-mail.</p>`,
      },
      { timeoutMs: SEND_EMAIL_TIMEOUT_MS },
    );

    // Falha no envio nao volta para a tela: seria oraculo de existencia de
    // conta e prenderia o admin. O motivo fica no log e o fluxo segue.
    if (!envio.ok) {
      log.error("Error sending reset email:", { reason: envio.reason });
    }

    // Update the request status
    const { error: updateError } = await supabaseAdmin
      .from("password_reset_requests")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq("id", requestId);

    if (updateError) {
      log.error("Error updating request status:", updateError);
    }

    log.info(
      `Password reset approved for request: ${requestId}`,
    );

    return new Response(
      JSON.stringify({ success: true, message: "Password reset email sent" }),
      {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
      },
    );
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
