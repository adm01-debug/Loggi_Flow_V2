import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { log, redact } from "../_shared/logger.ts";
import { safeFetch } from "../_shared/safeFetch.ts";
import { requireUser } from "../_shared/auth.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

interface NewDeviceAlertRequest {
  user_id: string;
  user_email: string;
  device_info: {
    browser: string;
    os: string;
    device_type: string;
    ip_address: string;
    location?: string;
  };
  login_time: string;
}

const handler = async (req: Request): Promise<Response> => {
  const headers = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  const auth = await requireUser(req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...headers },
    });
  }
  const userId = auth.claims.sub ?? "";
  const userEmail = String(auth.claims.email ?? "");

  try {
    const {
      device_info,
      login_time,
    }: NewDeviceAlertRequest = await req.json();

    log.info(`Sending new device alert to ${redact(userEmail)}`);

    const formattedDate = new Date(login_time).toLocaleString("pt-BR", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    });

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Send email using Resend REST API
    const emailResponse = await safeFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Segurança <seguranca@promobrindes.com.br>",
        to: [userEmail],
        subject: "🔔 Novo login detectado em sua conta",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 12px 12px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                          🔐 Alerta de Segurança
                        </h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 30px 40px;">
                        <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                          Detectamos um novo login em sua conta a partir de um dispositivo que não reconhecemos.
                        </p>
                        
                        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0;">
                          <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 500;">
                            ⚠️ Se você não reconhece esta atividade, recomendamos que altere sua senha imediatamente.
                          </p>
                        </div>
                        
                        <h2 style="margin: 30px 0 15px; color: #1f2937; font-size: 18px; font-weight: 600;">
                          Detalhes do Acesso
                        </h2>
                        
                        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px;">
                          <tr>
                            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                              <span style="color: #6b7280; font-size: 14px;">📅 Data/Hora:</span>
                            </td>
                            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                              <span style="color: #1f2937; font-size: 14px; font-weight: 500;">${formattedDate}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                              <span style="color: #6b7280; font-size: 14px;">🌐 Navegador:</span>
                            </td>
                            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                              <span style="color: #1f2937; font-size: 14px; font-weight: 500;">${device_info.browser}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                              <span style="color: #6b7280; font-size: 14px;">💻 Sistema:</span>
                            </td>
                            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                              <span style="color: #1f2937; font-size: 14px; font-weight: 500;">${device_info.os}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                              <span style="color: #6b7280; font-size: 14px;">📱 Dispositivo:</span>
                            </td>
                            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                              <span style="color: #1f2937; font-size: 14px; font-weight: 500;">${device_info.device_type}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 16px;">
                              <span style="color: #6b7280; font-size: 14px;">🔗 Endereço IP:</span>
                            </td>
                            <td style="padding: 12px 16px;">
                              <span style="color: #1f2937; font-size: 14px; font-weight: 500;">${device_info.ip_address}</span>
                            </td>
                          </tr>
                        </table>
                        
                        <div style="margin-top: 30px; text-align: center;">
                          <p style="margin: 0 0 15px; color: #6b7280; font-size: 14px;">
                            Se foi você, pode ignorar este email.
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 20px 40px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                          Este é um email automático de segurança. Por favor, não responda.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      }),
    });

    const emailResult = await emailResponse.json();
    log.info("Email sent successfully:", emailResult);

    // Log security event
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from("security_events").insert({
      user_id: userId,
      event_type: "new_device_login",
      severity: "warning",
      description: `Novo dispositivo detectado: ${device_info.browser} em ${device_info.os}`,
      ip_address: device_info.ip_address,
      metadata: { device_info, email_sent: true },
    });

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...headers },
    });
  } catch (error: any) {
    log.error("Error in new-device-alert function:", error);
    return new Response(JSON.stringify({ error: "INTERNAL_ERROR" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...headers },
    });
  }
};

serve(handler);
