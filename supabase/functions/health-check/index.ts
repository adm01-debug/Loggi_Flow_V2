import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts"
import { withCircuitBreaker } from "../_shared/circuitBreaker.ts"
import { log } from "../_shared/logger.ts"
import { requireUser } from "../_shared/auth.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse(req)

  // Etapa 013: health-check expõe métricas internas; exige usuário autenticado
  const auth = await requireUser(req)
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const results = await withCircuitBreaker('system-health-check', async () => {
      // 1. DB Heartbeat
      const { error: dbError } = await supabase.from('profiles').select('id').limit(1).maybeSingle()
      
      // 2. Storage Check
      const { error: storageError } = await supabase.storage.listBuckets()

      // 3. Auth Service Check via /auth/v1/health (não usa admin API)
      const authHealthUrl = `${supabaseUrl}/auth/v1/health`
      let authOk = false
      try {
        const authRes = await fetch(authHealthUrl, {
          headers: { apikey: Deno.env.get('SUPABASE_ANON_KEY') ?? '' },
          signal: AbortSignal.timeout(5000),
        })
        authOk = authRes.ok
      } catch {
        authOk = false
      }

      return {
        database: !dbError,
        storage: !storageError,
        auth: authOk,
        timestamp: new Date().toISOString()
      }
    })

    const isHealthy = Object.values(results).every(v => v === true || typeof v === 'string')

    if (!isHealthy) {
      log({ level: 'WARN', message: 'System health check degraded', meta: results })
    }

    return new Response(
      JSON.stringify({
        status: isHealthy ? "healthy" : "degraded",
        checks: results,
        version: "1.2.0-nexus-shield"
      }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" }, status: isHealthy ? 200 : 500 }
    )
  } catch (error) {
    log({ level: 'ERROR', message: 'System health check critical failure', meta: { error: error.message } })
    return new Response(
      JSON.stringify({ status: "unhealthy", error: "INTERNAL_ERROR" }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" }, status: 503 }
    )
  }
})
