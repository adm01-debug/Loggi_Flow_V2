-- Etapa 234 (censo reconferido em 2026-11-25): quatro indices de entregas/coletas com
-- idx_scan = 0 em 3 meses de estatistica (postmaster de 2026-08-21, stats_reset nulo) cuja
-- funcao ja e coberta por outro indice mais usado na mesma tabela.
--
-- Regra: nenhum DROP acontece se o indice que cobre nao existir. Se o "cobridor" sumiu, o
-- redundante continua sendo a unica cobertura e fica.

begin;

do $$
declare
  alvo text;
  cobridor text;
begin
  for alvo, cobridor in
    select * from (values
      ('idx_entregas_cliente_status',    'idx_entregas_cliente_id'),
      ('idx_entregas_status_composite',  'idx_entregas_status_created_at'),
      ('idx_entregas_status_active',     'idx_entregas_status_created_at'),
      ('idx_coletas_status_active',      'idx_coletas_status_created_at')
    ) as t(alvo, cobridor)
  loop
    if to_regclass('public.' || alvo) is null then
      raise notice 'ja nao existe, pulando: %', alvo;
    elsif to_regclass('public.' || cobridor) is null then
      raise notice 'cobridor ausente, mantendo %: % nao existe', alvo, cobridor;
    else
      execute format('drop index public.%I', alvo);
      raise notice 'removido: % (coberto por %)', alvo, cobridor;
    end if;
  end loop;
end $$;

commit;

-- Conferencia (esperado: as 4 linhas abaixo ausentes e os 4 cobridores presentes)
--   select indexname from pg_indexes where schemaname = 'public'
--   and indexname in ('idx_entregas_cliente_status','idx_entregas_status_composite',
--                     'idx_entregas_status_active','idx_coletas_status_active');
