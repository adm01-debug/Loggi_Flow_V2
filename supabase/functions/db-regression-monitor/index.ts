import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Executado a cada 15min via pg_cron. Detecta regressões via get_query_regressions_fast
// e emite notifications + nexus_tactical_logs para admins quando threshold é ultrapassado.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verifica feature flag
    const { data: flag } = await admin
      .from('feature_flags')
      .select('is_enabled')
      .eq('key', 'db_regression_alerts_enabled')
      .maybeSingle();

    if (flag && flag.is_enabled === false) {
      return new Response(JSON.stringify({ ok: true, skipped: 'disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const threshold = 100; // %

    const { data: regressions, error } = await admin.rpc('get_query_regressions_fast');
    if (error) throw error;

    type Reg = { queryid: number; query_text: string; regression_pct: number };
    const critical = (regressions as Reg[] | null ?? []).filter(
      (r) => Number(r.regression_pct) >= threshold,
    );

    if (critical.length === 0) {
      return new Response(JSON.stringify({ ok: true, critical: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log tático
    await admin.from('nexus_tactical_logs').insert(
      critical.slice(0, 20).map((r) => ({
        module: 'DB_REGRESSION',
        level: 'crit',
        message: `Regressão ${Number(r.regression_pct).toFixed(1)}% em queryid=${r.queryid}: ${String(r.query_text).slice(0, 200)}`,
      })),
    );

    // Notifica admins
    const { data: admins } = await admin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      const rows = admins.flatMap((a) =>
        critical.slice(0, 5).map((r) => ({
          user_id: a.user_id,
          title: 'Regressão de Query Detectada 🚨',
          message: `Query ${r.queryid} está ${Number(r.regression_pct).toFixed(1)}% mais lenta que o baseline.`,
          type: 'error',
          action_url: '/admin/db-health',
          metadata: {
            queryid: r.queryid,
            regression_pct: r.regression_pct,
            event: 'db_regression',
          },
        })),
      );
      await admin.from('notifications').insert(rows);
    }

    return new Response(
      JSON.stringify({ ok: true, critical: critical.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
