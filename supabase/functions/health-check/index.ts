import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabase = createClient(supabaseUrl, supabaseKey)

  const startTime = Date.now()
  let dbStatus = 'down'
  let dbLatency = 0

  try {
    const { data, error } = await supabase.from('audit_logs').select('count', { count: 'exact', head: true })
    if (!error) {
      dbStatus = 'up'
      dbLatency = Date.now() - startTime
    }
  } catch (err) {
    console.error('Health check error:', err)
  }

  const status = dbStatus === 'up' ? 200 : 503

  return new Response(
    JSON.stringify({
      status: dbStatus === 'up' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        latency_ms: dbLatency
      },
      environment: Deno.env.get('ENVIRONMENT') || 'production'
    }),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
})
