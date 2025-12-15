import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-lalamove-signature',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Verify Lalamove webhook signature using HMAC-SHA256
async function verifySignature(payload: string, signature: string): Promise<boolean> {
  const secret = Deno.env.get('LALAMOVE_API_SECRET');
  if (!secret) {
    console.warn('LALAMOVE_API_SECRET not configured, skipping signature verification');
    return true; // Allow in development/sandbox
  }

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(payload);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return computedSignature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Map Lalamove status to our internal status
function mapLalamoveStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'ASSIGNING_DRIVER': 'aguardando_motorista',
    'ON_GOING': 'em_transito',
    'PICKED_UP': 'coletado',
    'COMPLETED': 'entregue',
    'CANCELED': 'cancelado',
    'REJECTED': 'rejeitado',
    'EXPIRED': 'expirado',
  };
  return statusMap[status] || status.toLowerCase();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload = await req.text();
    const signature = req.headers.get('x-lalamove-signature') || '';
    
    console.log('Received Lalamove webhook:', payload);

    // Verify webhook signature (optional in sandbox)
    const isValid = await verifySignature(payload, signature);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const webhookData = JSON.parse(payload);
    const { eventType, data } = webhookData;

    console.log(`Processing webhook event: ${eventType}`, data);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (eventType) {
      case 'ORDER_STATUS_CHANGED': {
        const { orderId, status, timestamp } = data;
        
        // Update tracking history with status change
        const { error: historyError } = await supabase
          .from('rastreamento_historico')
          .insert({
            lalamove_order_id: orderId,
            order_status: mapLalamoveStatus(status),
            latitude: data.location?.lat || 0,
            longitude: data.location?.lng || 0,
            recorded_at: timestamp || new Date().toISOString(),
          });

        if (historyError) {
          console.error('Error saving status history:', historyError);
        }

        // Update coleta status if linked
        if (status === 'COMPLETED') {
          const { error: coletaError } = await supabase
            .from('coletas')
            .update({ status: 'chegou_expedicao' })
            .eq('codigo_rastreamento', orderId);

          if (coletaError) {
            console.error('Error updating coleta:', coletaError);
          }
        }

        console.log(`Order ${orderId} status updated to: ${status}`);
        break;
      }

      case 'DRIVER_LOCATION_UPDATED': {
        const { orderId, driverId, location, timestamp } = data;
        
        // Save driver location to history
        const { error: locationError } = await supabase
          .from('rastreamento_historico')
          .insert({
            lalamove_order_id: orderId,
            driver_id: driverId,
            latitude: location.lat,
            longitude: location.lng,
            recorded_at: timestamp || new Date().toISOString(),
          });

        if (locationError) {
          console.error('Error saving location:', locationError);
        }

        console.log(`Driver ${driverId} location updated for order ${orderId}`);
        break;
      }

      case 'DRIVER_ASSIGNED': {
        const { orderId, driver } = data;
        
        // Save driver assignment to history
        const { error: driverError } = await supabase
          .from('rastreamento_historico')
          .insert({
            lalamove_order_id: orderId,
            driver_id: driver.driverId,
            driver_name: driver.name,
            driver_phone: driver.phone,
            driver_plate: driver.plateNumber,
            latitude: driver.location?.lat || 0,
            longitude: driver.location?.lng || 0,
            order_status: 'motorista_alocado',
            recorded_at: new Date().toISOString(),
          });

        if (driverError) {
          console.error('Error saving driver assignment:', driverError);
        }

        console.log(`Driver ${driver.name} assigned to order ${orderId}`);
        break;
      }

      case 'ORDER_CANCELED':
      case 'ORDER_EXPIRED': {
        const { orderId, reason } = data;
        
        // Create alert for canceled/expired order
        const { error: alertError } = await supabase
          .from('rastreamento_alertas')
          .insert({
            lalamove_order_id: orderId,
            alert_type: eventType === 'ORDER_CANCELED' ? 'order_canceled' : 'order_expired',
            severity: 'high',
            message: `Pedido ${eventType === 'ORDER_CANCELED' ? 'cancelado' : 'expirado'}: ${reason || 'Sem motivo informado'}`,
          });

        if (alertError) {
          console.error('Error creating alert:', alertError);
        }

        console.log(`Order ${orderId} ${eventType.toLowerCase()}: ${reason}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return new Response(JSON.stringify({ success: true, eventType }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Webhook processing error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
