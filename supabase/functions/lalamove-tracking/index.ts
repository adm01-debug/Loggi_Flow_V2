import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LALAMOVE_SANDBOX_URL = 'https://rest.sandbox.lalamove.com';
const LALAMOVE_PRODUCTION_URL = 'https://rest.lalamove.com';

// Generate HMAC-SHA256 signature for Lalamove API using Web Crypto API
async function generateSignature(
  secret: string,
  timestamp: string,
  method: string,
  path: string,
  body: string = ''
): Promise<string> {
  const rawSignature = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${body}`;
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(rawSignature);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  
  // Convert to hex string
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Make authenticated request to Lalamove API
async function lalamoveRequest(
  method: string,
  path: string,
  body?: object,
  useSandbox = true
): Promise<Response> {
  const apiKey = Deno.env.get('LALAMOVE_API_KEY');
  const apiSecret = Deno.env.get('LALAMOVE_API_SECRET');

  if (!apiKey || !apiSecret) {
    throw new Error('Lalamove API credentials not configured');
  }

  const timestamp = Date.now().toString();
  const baseUrl = useSandbox ? LALAMOVE_SANDBOX_URL : LALAMOVE_PRODUCTION_URL;
  const bodyStr = body ? JSON.stringify(body) : '';
  
  const signature = await generateSignature(apiSecret, timestamp, method, path, bodyStr);
  const token = `${apiKey}:${timestamp}:${signature}`;

  console.log(`Making Lalamove request: ${method} ${path}`);

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Authorization': `hmac ${token}`,
      'Content-Type': 'application/json',
      'Market': 'BR', // Brazil market
      'Request-ID': crypto.randomUUID(),
    },
    body: body ? bodyStr : undefined,
  });

  return response;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, orderId, driverId, useSandbox = true } = await req.json();

    console.log(`Lalamove tracking action: ${action}, orderId: ${orderId}`);

    switch (action) {
      case 'getOrderDetails': {
        const response = await lalamoveRequest('GET', `/v3/orders/${orderId}`, undefined, useSandbox);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Lalamove order error:', errorData);
          return new Response(JSON.stringify({ error: errorData.message || 'Failed to get order details' }), {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const orderData = await response.json();
        console.log('Order details retrieved:', orderData.data?.orderId);
        
        return new Response(JSON.stringify(orderData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'getDriverLocation': {
        if (!driverId) {
          return new Response(JSON.stringify({ error: 'driverId is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const response = await lalamoveRequest(
          'GET', 
          `/v3/orders/${orderId}/drivers/${driverId}`, 
          undefined, 
          useSandbox
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Lalamove driver error:', errorData);
          return new Response(JSON.stringify({ error: errorData.message || 'Failed to get driver location' }), {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const driverData = await response.json();
        console.log('Driver location retrieved:', driverData.data?.driverId);
        
        return new Response(JSON.stringify(driverData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: unknown) {
    console.error('Lalamove tracking error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
