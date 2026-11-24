import { safeFetch } from "../_shared/safeFetch.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCircuitBreaker } from '../_shared/circuitBreaker.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { getRedisClient } from '../_shared/redis.ts'
import { log } from '../_shared/logger.ts'
import { ValidationError, validationErrorResponse } from '../_shared/validate.ts'
import { parseLalamoveRoute } from './parse.ts'

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
    
    const response = await safeFetch(`${LALAMOVE_BASE_URL}${path}`, {
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
      // O corpo de erro do parceiro nao e controlado por este repositorio (pode ecoar cabecalho,
      // URL ou credencial): fica so no log, e a resposta devolve o status traduzido.
      log.error('Lalamove upstream error', {
        status: response.status,
        errorText: errorText.slice(0, 500),
      })
      // Only trigger breaker on 5xx or connection issues, handled by the loop if we throw
      if (response.status >= 500) {
        throw new Error(`Lalamove Server Error: ${response.status}`);
      }
      return {
        error: true,
        status: response.status,
        message: 'Transportadora recusou a solicitacao',
      };
    }
    
    return response.json()
  })
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Read the body once at the top — the client always sends a JSON body
    // containing `path` and `method` plus the route-specific fields.
    // supabase.functions.invoke() sempre faz a requisição HTTP real como
    // POST (o `method` do corpo é só a intenção de rota do chamador), então
    // o roteamento abaixo usa body.method, não req.method — do contrário
    // GET e PUT nunca casam e toda chamada cai no ramo de criar pedido.
    const body = await req.json().catch(() => ({} as Record<string, any>))
    // `path`/`method` do corpo são roteamento: passam por lista fechada e o
    // caminho da Lalamove é montado aqui, nunca concatenado do que veio de fora.
    const { route, upstreamPath } = parseLalamoveRoute(body)

    // POST /quotations - Criar cotação
    if (route === 'quotation') {
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
    if (route === 'create_order') {
      const { path: _path, method: _method, ...orderPayload } = body
      const result = await lalamoveRequest('POST', '/v3/orders', orderPayload)

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // GET /orders/:id - Buscar pedido
    if (route === 'get_order') {
      const result = await lalamoveRequest('GET', upstreamPath)

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // PUT /orders/:id/cancel - Cancelar pedido
    if (route === 'cancel_order') {
      const result = await lalamoveRequest('PUT', upstreamPath)

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Route not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
    
  } catch (error) {
    if (error instanceof ValidationError) {
      return validationErrorResponse(error, corsHeaders)
    }

    const isBreaker = error.message.includes('Circuit Breaker');
    log({ level: 'ERROR', message: `Lalamove function failure`, meta: { error: error.message } });

    return new Response(
      JSON.stringify({
        error: isBreaker
          ? 'Transportadora indisponivel'
          : 'Falha ao chamar a transportadora',
        circuitOpen: isBreaker,
      }),
      {
        status: isBreaker ? 503 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
