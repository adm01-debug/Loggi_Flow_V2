-- Migration: 20261124133000_count_prediction_breach_days_bulk
-- Etapa 218 do docs/qa/04-PLANO.md (achado P-03).
--
-- Problema: count_prediction_breach_days responde para UMA transportadora, e o hook
-- src/hooks/logistics/useAccuracyMetaCycle.ts chamava a RPC uma vez por transportadora configurada
-- dentro de um Promise.all -- N idas ao banco para montar uma tela.
--
-- Esta migration apenas ACRESCENTA a variante em lote. A funcao antiga nao e alterada nem removida:
-- supabase/functions/accuracy-meta-monitor/index.ts e src/hooks/logistics/usePredictionAccuracySettings.ts
-- continuam chamando a versao de um par. Definicao lida do banco ao vivo em 2026-11-24 com
-- pg_get_functiondef: STABLE, SECURITY DEFINER, SET search_path TO 'public', RETURNS integer, sem
-- clausula de GRANT -- os privilegios vem do default do Postgres (EXECUTE para PUBLIC, herdado por
-- authenticated e service_role), conferido em information_schema.routine_privileges. A variante nova
-- repete os tres atributos e nasce com o mesmo conjunto.
--
-- Semantica: uma linha por par (carrier, target), na ordem de entrada. carrier nulo = todas as
-- transportadoras (equivalente ao _carrier nulo da funcao antiga) e par sem historico devolve 0, como a
-- funcao antiga. A consulta foi comparada com a transcricao exata da funcao antiga sobre um conjunto
-- sintetico de 12 pares -- incluindo carrier nulo, transportadora nula no dado, linha com was_accurate
-- nulo, linha fora da janela de 30 dias, meta nula e par repetido -- sem divergencia (evidencia na PR).
--
-- Uma varredura: a agregacao por (dia, transportadora) e a agregacao por dia usada pelo par de carrier
-- nulo saem do mesmo GROUPING SETS. Ordem obrigatoria (docs/agentes/banco.md): arquivo -> PR -> merge ->
-- deploy do codigo -> apply. O hook cai na chamada antiga enquanto esta funcao nao existir, entao nao ha
-- janela de tela quebrada.

CREATE OR REPLACE FUNCTION public.count_prediction_breach_days_bulk(_pairs jsonb)
 RETURNS TABLE(carrier text, target numeric, breach_days integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH pares AS (
    SELECT
      NULLIF(p.value->>'carrier', '') AS carrier,
      (p.value->>'target')::numeric AS target,
      p.ord
    FROM jsonb_array_elements(COALESCE(_pairs, '[]'::jsonb)) WITH ORDINALITY AS p(value, ord)
  ), diario AS (
    SELECT
      date_trunc('day', h.created_at)::date AS d,
      h.transportadora AS carrier,
      AVG(CASE WHEN h.was_accurate THEN 100.0 ELSE 0.0 END) AS acc_pct,
      GROUPING(h.transportadora) AS grupo_todos
    FROM public.delay_predictions_history h
    WHERE h.was_accurate IS NOT NULL
      AND h.created_at >= now() - INTERVAL '30 days'
    GROUP BY GROUPING SETS (
      (date_trunc('day', h.created_at)::date, h.transportadora),
      (date_trunc('day', h.created_at)::date)
    )
  ), serie AS (
    SELECT
      pr.ord,
      dd.d,
      dd.acc_pct,
      ROW_NUMBER() OVER (PARTITION BY pr.ord ORDER BY dd.d DESC) AS rn,
      (dd.acc_pct < pr.target) AS is_breach
    FROM pares pr
    JOIN diario dd
      ON (pr.carrier IS NULL AND dd.grupo_todos = 1)
      OR (pr.carrier IS NOT NULL AND dd.grupo_todos = 0 AND dd.carrier = pr.carrier)
  )
  SELECT
    pr.carrier,
    pr.target,
    COALESCE(
      (SELECT MIN(s.rn) - 1 FROM serie s WHERE s.ord = pr.ord AND NOT s.is_breach),
      (SELECT COUNT(*)::int FROM serie s WHERE s.ord = pr.ord)
    ) AS breach_days
  FROM pares pr
  ORDER BY pr.ord;
$function$;

COMMENT ON FUNCTION public.count_prediction_breach_days_bulk(jsonb)
  IS 'Etapa 218/P-03: count_prediction_breach_days para varios pares (carrier, target) numa chamada. carrier nulo = todas as transportadoras; par sem historico = 0.';
