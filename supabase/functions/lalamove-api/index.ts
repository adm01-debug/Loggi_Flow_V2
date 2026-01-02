import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LALAMOVE_API_KEY = Deno.env.get('LALAMOVE_API_KEY') || ''
const LALAMOVE_API_SECRET = Deno.env.get('LALAMOVE_API_SECRET') || ''
const LALAMOVE_BASE_URL = Deno.env.get('LALAMOVE_BASE_URL') || 'https://rest.lalamove.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Gerar assinatura HMAC para Lalamove
async function generateSignature(method: string, path: string, timestamp: string, body: string = ''): Promise<string> {
  const rawSignature = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${body}`
  
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(LALAMOVE_API_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(rawSignature))
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}

// Fazer requisição para API Lalamove
async function lalamoveRequest(method: string, path: string, body?: object) {
  const timestamp = Date.now().toString()
  const bodyStr = body ? JSON.stringify(body) : ''
  const signature = await generateSignature(method, path, timestamp, bodyStr)
  
  const response = await fetch(`${LALAMOVE_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `hmac ${LALAMOVE_API_KEY}:${timestamp}:${signature}`,
      'X-LLM-Country': 'BR',
      'X-LLM-Market': 'BR_SAO',
    },
    body: body ? bodyStr : undefined,
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Lalamove API error: ${response.status} - ${error}`)
  }
  
  return response.json()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    
    // POST /quotations - Criar cotação
    if (req.method === 'POST' && pathParts.includes('quotations')) {
      const body = await req.json()
      const result = await lalamoveRequest('POST', '/v3/quotations', {
        serviceType: body.vehicleType || 'MOTORCYCLE',
        language: 'pt_BR',
        stops: body.stops.map((stop: any, i: number) => ({
          coordinates: { lat: stop.lat.toString(), lng: stop.lng.toString() },
          address: stop.address,
        })),
      })
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // POST /orders - Criar pedido
    if (req.method === 'POST' && pathParts.includes('orders') && !pathParts.includes('cancel')) {
      const body = await req.json()
      const result = await lalamoveRequest('POST', '/v3/orders', body)
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // GET /orders/:id - Buscar pedido
    if (req.method === 'GET' && pathParts.includes('orders')) {
      const orderId = pathParts[pathParts.indexOf('orders') + 1]
      const result = await lalamoveRequest('GET', `/v3/orders/${orderId}`)
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // PUT /orders/:id/cancel - Cancelar pedido
    if (req.method === 'PUT' && pathParts.includes('cancel')) {
      const orderId = pathParts[pathParts.indexOf('orders') + 1]
      const result = await lalamoveRequest('PUT', `/v3/orders/${orderId}/cancel`)
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    return new Response(JSON.stringify({ error: 'Route not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
