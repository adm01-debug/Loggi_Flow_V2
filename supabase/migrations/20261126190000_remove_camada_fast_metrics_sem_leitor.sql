-- Fecha os ultimos vereditos REMOVER de funcao do censo docs/qa/08-AUDITORIA-COBERTURA-UI.md.
--
-- Reconferido no catalogo de producao em 26/11/2026, antes deste DROP:
--   - 0 mencao em src/, supabase/functions/, tests/ e scripts/
--   - 0 cron.job citando as funcoes, 0 corpo de outra funcao, 0 policy, 0 trigger
--   - as 2 MVs internas tinham como unico leitor os wrappers removidos aqui
-- Sem CASCADE: dependencia nova faz a migration falhar em vez de levar objeto junto.

-- 1) Saude falsa: devolvia status 'healthy'/'production-grade' fixos, sem medir nada.
--    A tela /admin/db-health le persist_global_health_score + get_health_score_history_fast.
drop function if exists public.system_health_check();

-- 2) Wrappers SECURITY DEFINER sobre as MVs internas, com EXECUTE para authenticated
--    e nenhum chamador no app, nas edge functions, nos testes ou em outro objeto do banco.
drop function if exists public.get_carrier_performance_fast();
drop function if exists public.get_dashboard_metrics_fast();

-- 3) O cron de 5 minutos (job 54, 288 execucoes/dia) so existia para atualizar as 2 MVs abaixo.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if exists (select 1 from cron.job where jobname = 'refresh-dashboard-views-5m') then
      perform cron.unschedule('refresh-dashboard-views-5m');
    end if;
    if exists (select 1 from cron.job where jobname = 'refresh-dashboard-views-5m') then
      raise exception 'cron job refresh-dashboard-views-5m nao foi removido (permissao)';
    end if;
  end if;
end $$;

drop function if exists public.refresh_dashboard_views();

-- 4) As MVs agregavam coletas/entregas/transportadoras de TODAS as organizacoes, sem filtro
--    de RLS: ligar isso na UI vazaria numero de outro tenant. O dashboard segue calculando
--    ao vivo nas tabelas, com RLS aplicada.
drop materialized view if exists internal.mv_dashboard_metrics;
drop materialized view if exists internal.mv_carrier_performance;
