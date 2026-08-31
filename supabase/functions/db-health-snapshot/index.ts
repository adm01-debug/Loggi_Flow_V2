import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Coleta métricas REAIS via RPC internal.collect_db_health() e opcionalmente persiste.
// Persiste quando ?persist=true (cron horário) OU retorna somente snapshot atual (painel admin).
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

    if (persist) {
      const { data: id, error } = await admin.rpc('persist_db_health_snapshot');
      if (error) throw error;

      const { data: snap } = await admin
        .from('db_health_snapshots')
        .select('*')
        .eq('id', id as unknown as string)
        .maybeSingle();

      return new Response(JSON.stringify({ ok: true, id, snapshot: snap }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Modo leitura: retorna último snapshot (rápido, sem escrita)
    const { data: latest, error: rErr } = await admin
      .from('db_health_snapshots')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (rErr) throw rErr;

    return new Response(JSON.stringify({ ok: true, snapshot: latest }), {
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
