import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { log, LogLevel } from '../_shared/logger.ts'

serve(async (req) => {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID()
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    log({ 
      level: LogLevel.INFO, 
      message: 'Health check initiated', 
      requestId 
    })

    // Check DB connection
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
    if (error) throw error

    log({ 
      level: LogLevel.INFO, 
      message: 'Health check successful', 
      requestId 
    })

    return new Response(
      JSON.stringify({
        status: 'UP',
        timestamp: new Date().toISOString(),
        database: 'connected',
        version: '1.1.0',
        requestId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    
    log({ 
      level: LogLevel.ERROR, 
      message: `Health check failed: ${errorMessage}`, 
      requestId,
      meta: { error: err }
    })

    return new Response(
      JSON.stringify({
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        error: errorMessage,
        requestId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 503,
      }
    )
  }
})
