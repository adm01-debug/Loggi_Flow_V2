import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCircuitBreaker } from '../_shared/circuitBreaker.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { getRedisClient } from '../_shared/redis.ts'
import { log } from '../_shared/logger.ts'

const LALAMOVE_API_KEY = Deno.env.get('LALAMOVE_API_KEY') || ''
const LALAMOVE_API_SECRET = Deno.env.get('LALAMOVE_API_SECRET') || ''
const LALAMOVE_BASE_URL = Deno.env.get('LALAMOVE_BASE_URL') || 'https://rest.lalamove.com'

const lalamoveBreaker = getCircuitBreaker('lalamove', {
  failureThreshold: 5,
  resetTimeoutMs: 30000,
});

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
  return await lalamoveBreaker.execute(async () => {
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
      const errorText = await response.text()
      // Only trigger breaker on 5xx or connection issues, handled by the loop if we throw
      if (response.status >= 500) {
        throw new Error(`Lalamove Server Error: ${response.status}`);
      }
      return { error: true, status: response.status, details: errorText };
    }
    
    return response.json()
  })
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
      
      // Try cache first
      const redis = getRedisClient();
      const cacheKey = `lalamove_quote_${JSON.stringify(body.stops)}`;
      if (redis) {
        try {
          const cached = await redis.get(cacheKey);
          if (cached) {
            return new Response(JSON.stringify(cached), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
            });
          }
        } catch (e) {
          log({ level: 'WARN', message: 'Redis cache fail', meta: { error: e.message } });
        }
      }

      const result = await lalamoveRequest('POST', '/v3/quotations', {
        serviceType: body.vehicleType || 'MOTORCYCLE',
        language: 'pt_BR',
        stops: body.stops.map((stop: any) => ({
          coordinates: { lat: stop.lat.toString(), lng: stop.lng.toString() },
          address: stop.address,
        })),
      })
      
      if (result.error) {
        return new Response(JSON.stringify(result), {
          status: result.status || 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Store in cache
      if (redis) {
        try {
          await redis.set(cacheKey, result, { ex: 600 }); // 10 minutes
        } catch (e) {}
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
      });
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
    const isBreaker = error.message.includes('Circuit Breaker');
    log({ level: 'ERROR', message: `Lalamove function failure`, meta: { error: error.message } });
    
    return new Response(JSON.stringify({ error: error.message, circuitOpen: isBreaker }), {
      status: isBreaker ? 503 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
