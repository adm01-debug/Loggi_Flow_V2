-- Etapa 070 - remove a RPC de demonstracao public.reconcile_pending_freights (achado A-08)
-- Ela faz UPDATE em public.freights, tabela que nenhuma migration cria (to_regclass devolve NULL),
-- e o proprio corpo admite "Simula uma logica de reconciliacao real".
-- O EXECUTE ja foi revogado de authenticated em tres migrations e nao existe chamador no codigo.
-- Destino levantado e registrado em docs/qa/05-PROGRESSO.md (etapa 070): a recomendacao e remover e a
-- aplicacao em producao espera o dono (Regra 8).
DROP FUNCTION IF EXISTS public.reconcile_pending_freights();