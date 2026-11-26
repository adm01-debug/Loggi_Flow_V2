-- Fecha o EXECUTE publico de 7 funcoes SECURITY DEFINER que nao sao API publica.
-- Achado do censo de grants em 26/11: nenhuma tabela do schema public tem policy para o papel
-- anon (0 policies), mas estas funcoes estavam alcancaveis por PUBLIC/anon em POST /rest/v1/rpc/
-- e, por serem SECURITY DEFINER, consultam tabelas ignorando RLS.
--
-- Precedente no proprio banco: alert_slow_queries(integer) ja estava sem PUBLIC/authenticated.
--
-- Mantido para 'authenticated' apenas o que o front chama:
--   count_prediction_breach_days(_target, _carrier)  -> useAccuracyMetaCycle
--   count_prediction_breach_days_bulk(_pairs)        -> useAccuracyMetaCycle
-- As 4 funcoes de transicao rodam como trigger (contexto do dono da tabela), nao por RPC.
-- get_public_tracking(p_code) fica como esta: e a API publica de rastreio, com policy propria.

REVOKE EXECUTE ON FUNCTION public.alert_slow_queries(numeric) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.count_prediction_breach_days(numeric, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.count_prediction_breach_days_bulk(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fn_tr_valida_transicao_coleta() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_tr_valida_transicao_entrega() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_valida_transicao_coleta(coleta_status, coleta_status) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_valida_transicao_entrega(entrega_status, entrega_status) FROM PUBLIC, anon, authenticated;
