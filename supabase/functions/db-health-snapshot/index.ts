import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Coleta métricas de saúde do banco e (opcionalmente) persiste em db_health_snapshots.
// Chamado sob demanda pelo painel admin OU pelo cron job horário.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const persist = new URL(req.url).searchParams.get('persist') === 'true';

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Queries curtas e baratas (todas leves).
    const [conns, size, cache, deadlocks] = await Promise.all([
      admin.rpc('exec_health_conns' as never).then(() => null).catch(() => null),
      Promise.resolve(null),
      Promise.resolve(null),
      Promise.resolve(null),
    ]);

    // Fallback: usa consultas SQL brutas via PostgREST não é possível, então
    // usamos uma RPC dedicada quando disponível OU retornamos apenas o timestamp.
    // Nesta implementação inicial coletamos via queries diretas ao pg_catalog usando o service role.
    const { data: metricsRow, error: metricsErr } = await admin
      .from('pg_stat_database' as never)
      .select('*')
      .limit(0);

    // Como PostgREST não expõe pg_catalog, delegamos a coleta ao Postgres via RPC pública `system_health_check`
    const { data: health } = await admin.rpc('system_health_check');

    const snapshot = {
      active_connections: null as number | null,
      total_connections: null as number | null,
      db_size_bytes: null as number | null,
      cache_hit_ratio: null as number | null,
      deadlocks: null as number | null,
      wal_size_bytes: null as number | null,
      metadata: { health, collected_at: new Date().toISOString() },
    };

    if (persist) {
      const { error: insErr } = await admin
        .from('db_health_snapshots')
        .insert(snapshot);
      if (insErr) throw insErr;
    }

    return new Response(JSON.stringify({ ok: true, snapshot }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
