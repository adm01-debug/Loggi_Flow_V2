import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts"
import { withCircuitBreaker } from "../_shared/circuitBreaker.ts"
import { log } from "../_shared/logger.ts"
import { sanitizeInput } from "../_shared/security.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse(req)

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const results = await withCircuitBreaker('system-health-check', async () => {
      // 1. DB Heartbeat
      const { data: dbCheck, error: dbError } = await supabase.from('profiles').select('id').limit(1).maybeSingle()
      
      // 2. Storage Check
      const { data: storageCheck, error: storageError } = await supabase.storage.listBuckets()

      // 3. Auth Service Check (MFA as proxy)
      const { error: authError } = await supabase.auth.admin.listUsers({ perPage: 1 })

      return {
        database: !dbError,
        storage: !storageError,
        auth: !authError,
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
      JSON.stringify({ status: "unhealthy", error: error.message }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" }, status: 503 }
    )
  }
})
