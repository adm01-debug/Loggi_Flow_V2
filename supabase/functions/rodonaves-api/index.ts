import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rodonaves API Gateways (v3)
const TRACKING_GATEWAY = "https://tracking-apigateway.rte.com.br";
const QUOTATION_GATEWAY = "https://quotation-apigateway.rte.com.br";
const DEADLINE_GATEWAY = "https://01wapi.rte.com.br";

// Token cache (in-memory per isolate)
const tokenCache: Record<string, { token: string; expiresAt: number }> = {};

/**
 * Authenticate with Rodonaves API.
 * Each service (tracking, quotation, etc.) has its own token endpoint.
 */
async function getToken(gateway: string): Promise<string> {
  const cacheKey = gateway;
  const cached = tokenCache[cacheKey];
  if (cached && Date.now() < cached.expiresAt) {
    return cached.token;
  }

  const username = Deno.env.get("RODONAVES_USERNAME");
  const password = Deno.env.get("RODONAVES_PASSWORD");

  if (!username || !password) {
    throw new Error("RODONAVES_USERNAME and RODONAVES_PASSWORD secrets are not configured");
  }

  const tokenUrl = `${gateway}/token`;
  const body = new URLSearchParams({
    auth_type: "DEV",
    grant_type: "password",
    username,
    password,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Rodonaves auth failed [${response.status}]: ${errorText}`);
  }

  const data = await response.json();
  const token = data.access_token;
  // Cache for 25 minutes (tokens typically last 30 min)
  tokenCache[cacheKey] = { token, expiresAt: Date.now() + 25 * 60 * 1000 };

  return token;
}

/**
 * Map Rodonaves tracking codes to our entrega_status enum.
 */
function mapTrackingCodeToStatus(code: number): string {
  switch (code) {
    case 0: return "em_transito";       // Processo de Transporte já Iniciado
    case 1: return "entregue";          // Entrega Realizada Normalmente
    case 2: return "entregue";          // Entrega Fora da Data Programada (still delivered)
    case 24: return "entregue";         // Mercadoria Reentregue ao Cliente Destino
    case 25: return "devolvido";        // Mercadoria Devolvida ao Cliente de Origem
    case 29: return "entregue";         // Cliente Retira Mercadoria na Transportadora
    case 31: return "entregue";         // Entrega com Indenização Efetuada
    case 37: return "saiu_entrega";     // Mercadoria em Trânsito para Redespacho
    case 38: return "em_transito";      // Mercadoria em Trânsito para Devolução
    case 39: return "em_transito";      // Mercadoria em Trânsito
    case 43: return "saiu_entrega";     // Mercadoria Saiu Para Entrega
    case 44: return "despachado";       // Mercadoria Recebida na Filial Destino
    case 45: return "despachado";       // Mercadoria em Transferência
    case 46: return "despachado";       // Mercadoria Despachada
    case 47: return "coletado";         // Mercadoria Coletada
    case 58: return "em_transito";      // CT-e Emitido
    // Refused/issues → keep current status or mark as issue
    case 3: case 4: case 5: case 6: case 7: case 8: case 9:
    case 10: case 11: case 12: case 13: case 14: case 15:
    case 16: case 17: case 18: case 19: case 20: case 21:
    case 22: case 23: case 26: case 27: case 28: case 30:
      return "ocorrencia";
    default: return "em_transito";
  }
}

/**
 * Track shipment by NF (Nota Fiscal) or CTRC.
 */
async function trackShipment(nfNumero: string, nfSerie: string, cnpjRemetente: string) {
  const token = await getToken(TRACKING_GATEWAY);

  const response = await fetch(`${TRACKING_GATEWAY}/api/v1/tracking`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nfNumero,
      nfSerie,
      cnpjRemetente,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tracking failed [${response.status}]: ${errorText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Track shipment in batch (multiple NFs).
 */
async function trackShipmentBatch(items: Array<{ nfNumero: string; nfSerie: string; cnpjRemetente: string }>) {
  const token = await getToken(TRACKING_GATEWAY);

  const response = await fetch(`${TRACKING_GATEWAY}/api/v1/tracking/batch`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(items),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Batch tracking failed [${response.status}]: ${errorText}`);
  }

  return await response.json();
}

/**
 * Get delivery proof (comprovante de entrega).
 */
async function getDeliveryProof(nfNumero: string, nfSerie: string, cnpjRemetente: string) {
  const token = await getToken(TRACKING_GATEWAY);

  const response = await fetch(`${TRACKING_GATEWAY}/api/v1/delivery-receipt`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nfNumero, nfSerie, cnpjRemetente }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Delivery proof failed [${response.status}]: ${errorText}`);
  }

  return await response.json();
}

/**
 * Simulate freight quotation.
 */
async function simulateQuotation(params: {
  cepOrigem: string;
  cepDestino: string;
  peso: number;
  volumes: number;
  valorMercadoria: number;
  cnpjRemetente: string;
}) {
  const token = await getToken(QUOTATION_GATEWAY);

  const response = await fetch(`${QUOTATION_GATEWAY}/api/v1/simula-cotacao`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      CepOrigem: params.cepOrigem,
      CepDestino: params.cepDestino,
      Peso: params.peso,
      Volumes: params.volumes,
      ValorMercadoria: params.valorMercadoria,
      CnpjRemetente: params.cnpjRemetente,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Quotation failed [${response.status}]: ${errorText}`);
  }

  return await response.json();
}

/**
 * Get delivery deadline (prazo de entrega).
 */
async function getDeadline(cepOrigem: string, cepDestino: string) {
  const token = await getToken(DEADLINE_GATEWAY);

  const response = await fetch(`${DEADLINE_GATEWAY}/api/v1/busca-prazo`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ CepOrigem: cepOrigem, CepDestino: cepDestino }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Deadline failed [${response.status}]: ${errorText}`);
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();

    let result: unknown;

    switch (action) {
      case "track":
        result = await trackShipment(params.nfNumero, params.nfSerie, params.cnpjRemetente);
        break;

      case "track-batch":
        result = await trackShipmentBatch(params.items);
        break;

      case "delivery-proof":
        result = await getDeliveryProof(params.nfNumero, params.nfSerie, params.cnpjRemetente);
        break;

      case "quotation":
        result = await simulateQuotation(params);
        break;

      case "deadline":
        result = await getDeadline(params.cepOrigem, params.cepDestino);
        break;

      case "sync-tracking": {
        // Sync tracking data with our database
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get all entregas with Rodonaves (by transportadora name or ID)
        const { data: entregas, error: fetchError } = await supabase
          .from("entregas")
          .select("id, nf_remessa, codigo_rastreamento, status, transportadora_id, transportadoras!inner(nome_fantasia)")
          .or("nome_fantasia.ilike.%rodonaves%,nome_fantasia.ilike.%rte%", { referencedTable: "transportadoras" })
          .not("status", "in", '("entregue","cancelado","devolvido")')
          .not("nf_remessa", "is", null);

        if (fetchError) throw fetchError;

        const cnpjRemetente = params.cnpjRemetente || Deno.env.get("RODONAVES_CNPJ_REMETENTE") || "";
        const updates: Array<{ id: string; status: string; lastEvent: string }> = [];

        // Track each entrega
        for (const entrega of entregas || []) {
          try {
            const trackingData = await trackShipment(
              entrega.nf_remessa || "",
              "1", // default NF serie
              cnpjRemetente
            );

            if (trackingData?.Tracking?.length > 0) {
              const latestEvent = trackingData.Tracking[0];
              const newStatus = mapTrackingCodeToStatus(latestEvent.CodigoOcorrencia);

              if (newStatus !== "ocorrencia" && newStatus !== entrega.status) {
                await supabase
                  .from("entregas")
                  .update({
                    status: newStatus,
                    ...(newStatus === "entregue"
                      ? { data_entrega_efetiva: new Date().toISOString() }
                      : {}),
                  })
                  .eq("id", entrega.id);

                updates.push({
                  id: entrega.id,
                  status: newStatus,
                  lastEvent: latestEvent.DescricaoOcorrencia,
                });
              }

              // If it's an ocorrencia, register it
              if (newStatus === "ocorrencia") {
                await supabase.from("ocorrencias").insert({
                  entrega_id: entrega.id,
                  tipo_ocorrencia: `RTE-${latestEvent.CodigoOcorrencia}`,
                  descricao: latestEvent.DescricaoOcorrencia,
                });
              }
            }
          } catch (trackErr) {
            console.error(`[rodonaves-api] Error tracking entrega ${entrega.id}:`, trackErr);
          }
        }

        result = { synced: updates.length, updates };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[rodonaves-api] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

