-- Rollback de 20261126190000_remove_camada_fast_metrics_sem_leitor.sql
-- Reconstroi o que a migration removeu, com os mesmos nomes de indice, grants e cron do
-- banco real (catalogo de producao medido em 26/11/2026 antes do DROP).

create schema if not exists internal;
revoke all on schema internal from public, anon, authenticated;
grant usage on schema internal to service_role;

create materialized view if not exists internal.mv_dashboard_metrics as
SELECT
  1 AS singleton,
  (SELECT count(*) FROM public.coletas) AS total_coletas,
  (SELECT count(*) FROM public.coletas WHERE status IN ('aguardando_liberacao','solicitada')) AS coletas_pendentes,
  (SELECT count(*) FROM public.coletas WHERE status = 'em_transito') AS coletas_em_transito,
  (SELECT count(*) FROM public.coletas WHERE status = 'finalizada') AS coletas_finalizadas,
  (SELECT count(*) FROM public.coletas WHERE divergencia_percentual > 5) AS coletas_com_divergencia,
  (SELECT COALESCE(sum(qtd_volumes),0) FROM public.coletas) AS total_volume,
  (SELECT count(*) FROM public.entregas) AS total_entregas,
  (SELECT count(*) FROM public.entregas WHERE status IN ('aguardando_producao','pronto_despacho','cotacao_frete','nf_emitida')) AS entregas_pendentes,
  (SELECT count(*) FROM public.entregas WHERE status IN ('despachado','em_transito','saiu_entrega')) AS entregas_em_transito,
  (SELECT count(*) FROM public.entregas WHERE status IN ('entregue','finalizado')) AS entregas_finalizadas,
  (SELECT count(*) FROM public.entregas WHERE status = 'ocorrencia') AS entregas_com_ocorrencia,
  (SELECT COALESCE(sum(valor_frete),0) FROM public.entregas) AS valor_total_frete,
  (SELECT CASE WHEN count(*) > 0
     THEN (count(*) FILTER (WHERE data_entrega_efetiva <= previsao_entrega AND status <> 'ocorrencia'))::numeric / count(*)::numeric * 100
     ELSE 100 END FROM public.entregas) AS otif_rate,
  now() AS last_refresh
WITH DATA;

create unique index if not exists mv_dashboard_metrics_singleton_idx
  on internal.mv_dashboard_metrics(singleton);

create materialized view if not exists internal.mv_carrier_performance as
SELECT
  t.id AS transportadora_id,
  t.nome_fantasia,
  count(e.id) AS total_entregas,
  count(e.id) FILTER (WHERE e.data_entrega_efetiva <= e.previsao_entrega) AS entregas_no_prazo,
  CASE WHEN count(e.id) > 0
    THEN (count(e.id) FILTER (WHERE e.data_entrega_efetiva <= e.previsao_entrega))::numeric / count(e.id)::numeric * 100
    ELSE 0 END AS otif_percent,
  COALESCE(sum(e.valor_frete),0) AS valor_total_frete,
  now() AS last_refresh
FROM public.transportadoras t
LEFT JOIN public.entregas e ON e.transportadora_id = t.id AND e.status IN ('entregue','finalizado')
GROUP BY t.id, t.nome_fantasia
WITH DATA;

create unique index if not exists mv_carrier_performance_transportadora_id_idx
  on internal.mv_carrier_performance(transportadora_id);
create index if not exists mv_carrier_performance_otif_percent_idx
  on internal.mv_carrier_performance(otif_percent DESC);

create or replace function public.refresh_dashboard_views()
returns jsonb
language plpgsql
security definer
set search_path = internal, public
as $$
declare
  v_start timestamptz := clock_timestamp();
begin
  refresh materialized view concurrently internal.mv_dashboard_metrics;
  refresh materialized view concurrently internal.mv_carrier_performance;
  return jsonb_build_object(
    'status','ok',
    'refreshed_at', now(),
    'duration_ms', extract(millisecond from (clock_timestamp() - v_start))
  );
end;
$$;

revoke all on function public.refresh_dashboard_views() from public, anon;
grant execute on function public.refresh_dashboard_views() to authenticated, service_role;

create or replace function public.get_dashboard_metrics_fast()
returns internal.mv_dashboard_metrics
language sql
stable security definer
set search_path = internal, public
as $$ select * from internal.mv_dashboard_metrics limit 1; $$;

revoke all on function public.get_dashboard_metrics_fast() from public, anon;
grant execute on function public.get_dashboard_metrics_fast() to authenticated, service_role;

create or replace function public.get_carrier_performance_fast()
returns setof internal.mv_carrier_performance
language sql
stable security definer
set search_path = internal, public
as $$ select * from internal.mv_carrier_performance order by otif_percent desc; $$;

revoke all on function public.get_carrier_performance_fast() from public, anon;
grant execute on function public.get_carrier_performance_fast() to authenticated, service_role;

create or replace function public.system_health_check()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return jsonb_build_object(
    'status', 'healthy',
    'timestamp', now(),
    'database', 'online',
    'env', 'production-grade',
    'audit_compliance', true
  );
end;
$$;

revoke all on function public.system_health_check() from public, anon, authenticated;
grant execute on function public.system_health_check() to service_role;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (select 1 from cron.job where jobname = 'refresh-dashboard-views-5m') then
      perform cron.schedule(
        'refresh-dashboard-views-5m',
        '*/5 * * * *',
        'SELECT public.refresh_dashboard_views();'
      );
    end if;
  end if;
end $$;

refresh materialized view internal.mv_dashboard_metrics;
refresh materialized view internal.mv_carrier_performance;
