import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { validateContract } from "../_shared/contract-validator.ts";
import { ValidationError, validationErrorResponse } from "../_shared/validate.ts";
import { parseReceiptRequest } from "./parse.ts";
import { log } from "../_shared/logger.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const headers = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();

    // Contract Validation
    const { isValid, errors } = await validateContract(
      supabaseAdmin,
      'ocr-receipt-processor',
      body,
      (p) => {
        parseReceiptRequest(p);
      }
    );

    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid Contract", details: errors }), {
        headers: { ...headers, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Valores validados: o corpo bruto não é usado em `download` nem nos filtros.
    const { storagePath, deliveryId } = parseReceiptRequest(body);

    // Get file from storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from("documents")
      .download(storagePath);

    if (downloadError) throw downloadError;

    // OCR real ainda não foi implementado nesta function. Antes, este bloco
    // fabricava um resultado (confidence/receiver_name fixos) e aplicava dois
    // efeitos reais a partir dele: marcava a entrega como 'entregue' e o
    // registro de auditoria como 'processed' — ambos falsos. Corrige a causa
    // raiz: não fabricar dado nem aplicar efeito colateral sem extração real.
    log.info(`OCR não implementado para entrega ${deliveryId}; upload fica para revisão manual.`);

    const extractedData = {
      extraction_date: new Date().toISOString(),
      implemented: false,
      note: "OCR automático não implementado nesta function — revisão manual necessária.",
    };

    // Update audit record apenas — não altera o status da entrega a partir
    // de um resultado de OCR que não existe.
    await supabaseAdmin
      .from("delivery_receipt_audit")
      .update({
        ocr_status: 'not_implemented',
        error_message: 'OCR automático não implementado nesta function.',
      })
      .eq("delivery_id", deliveryId)
      .eq("storage_path", storagePath);

    return new Response(JSON.stringify({ success: true, data: extractedData }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    if (error instanceof ValidationError) {
      return validationErrorResponse(error, headers);
    }
    log.error("OCR processing failed:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return new Response(JSON.stringify({ error: "INTERNAL_ERROR" }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
