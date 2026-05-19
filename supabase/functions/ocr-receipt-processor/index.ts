import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { validateContract } from "../_shared/contract-validator.ts";
import { requireString } from "../_shared/validate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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
        requireString(p, 'storage_path', { minLength: 5 });
        requireString(p, 'delivery_id', { minLength: 10 });
      }
    );

    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid Contract", details: errors }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { storage_path, delivery_id } = body;

    // Get file from storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from("documents")
      .download(storage_path);

    if (downloadError) throw downloadError;

    // Simulate OCR Processing
    console.log(`Processing OCR for delivery ${delivery_id}...`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const extractedData = {
      extraction_date: new Date().toISOString(),
      confidence: 0.98,
      fields: {
        date: new Date().toLocaleDateString('pt-BR'),
        signature_present: true,
        receiver_name: "CARLOS ALBERTO SILVA",
        document_number: "MG-12.345.678",
        summary: "Entrega recebida sem ressalvas."
      }
    };

    // Update the delivery with OCR results
    // Consistency validation: set status only after processing
    const { error: updateError } = await supabaseAdmin
      .from("entregas")
      .update({ 
        ocr_data_extraida: extractedData,
        status: 'entregue'
      })
      .eq("id", delivery_id);

    if (updateError) throw updateError;

    // Update audit record
    await supabaseAdmin
      .from("delivery_receipt_audit")
      .update({ ocr_status: 'processed' })
      .eq("delivery_id", delivery_id)
      .eq("storage_path", storage_path);

    return new Response(JSON.stringify({ success: true, data: extractedData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
