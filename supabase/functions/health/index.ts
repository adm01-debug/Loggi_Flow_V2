import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { getCorsHeaders } from "../_shared/cors.ts";

/**
 * Global Health Check Edge Function
 * Performs deep health inspection of database, auth and external connectivity.
 */
serve(async (req) => {
  const headers = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  const startTime = Date.now();
  const checks: Record<string, any> = {};

  try {
    // Etapa 012: health é pública (verify_jwt=false); usar anon_key para não expor service_role
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // 1. Database Check
    const { data: dbCheck, error: dbError } = await supabaseClient
      .from('profiles')
      .select('id')
      .limit(1)
      .maybeSingle();
      
    // Etapa 014: health e publica; devolve estado, nunca a mensagem crua do banco
    checks.database = {
      status: dbError ? 'unhealthy' : 'healthy',
      latency_ms: Date.now() - startTime
    };

    // 2. Auth Service Check
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      checks.auth = { status: 'healthy' };
    } catch (e) {
      checks.auth = { status: 'unhealthy', error: (e as Error).message };
    }

    // 3. Storage Check
    const { data: buckets, error: storageError } = await supabaseClient.storage.listBuckets();
    checks.storage = { 
      status: storageError ? 'unhealthy' : 'healthy',
      buckets_count: buckets?.length || 0
    };

    // Overall Status
    const isHealthy = checks.database.status === 'healthy' && checks.auth.status === 'healthy';
    const statusCode = isHealthy ? 200 : 503;

    return new Response(
      JSON.stringify({
        status: isHealthy ? 'healthy' : 'unhealthy',
        version: '1.0.0-enterprise',
        timestamp: new Date().toISOString(),
        total_latency_ms: Date.now() - startTime,
        services: checks
      }),
      { 
        headers: { ...headers, 'Content-Type': 'application/json' }, 
        status: statusCode 
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ 
        status: 'critical_failure', 
        timestamp: new Date().toISOString() 
      }),
      { headers: { ...headers, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
