import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { log } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendResetRequest {
  requestId: string;
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

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      log.error("No authorization header provided");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { requestId }: SendResetRequest = await req.json();

    if (!requestId) {
      return new Response(JSON.stringify({ error: "Request ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (resetRequest.status !== "pending") {
      return new Response(
        JSON.stringify({ error: "Request has already been processed" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get the origin from the request headers or use a default
    const origin =
      req.headers.get("origin") ||
      "https://uwbpzfcysppwikfpnzok.lovableproject.com";
    const redirectTo = `${origin}/reset-password`;

    log.info(`Sending password reset email to: ${resetRequest.email}`);
    log.info(`Redirect URL: ${redirectTo}`);

    // Send the password reset email using admin API
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: resetRequest.email,
      options: {
        redirectTo: redirectTo,
      },
    });

    if (resetError) {
      log.error("Error generating reset link:", resetError);
      return new Response(
        JSON.stringify({
          error: `Failed to send reset email: ${resetError.message}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
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
      `Password reset approved and email sent for request: ${requestId}`,
    );

    return new Response(
      JSON.stringify({ success: true, message: "Password reset email sent" }),
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
