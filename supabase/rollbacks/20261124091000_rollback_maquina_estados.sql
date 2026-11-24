-- Rollback das etapas 028-031 (maquina de estados no banco), escrito ANTES da aplicacao.
-- Fica fora de supabase/migrations/ de proposito: la ele seria aplicado por engano em qualquer
-- db push. Para usar: copie para supabase/migrations/rollback_maquina_estados.sql e despache
-- .github/workflows/aplicar-migration.yml informando esse caminho e digitando APLICAR.
-- Efeito: remove os dois triggers de status e as quatro funcoes; nenhuma coluna ou dado e tocado.

DROP TRIGGER IF EXISTS a_valida_transicao_entregas ON public.entregas;
DROP TRIGGER IF EXISTS a_valida_transicao_coletas ON public.coletas;
DROP FUNCTION IF EXISTS public.fn_tr_valida_transicao_entrega();
DROP FUNCTION IF EXISTS public.fn_tr_valida_transicao_coleta();
DROP FUNCTION IF EXISTS public.fn_valida_transicao_entrega(public.entrega_status, public.entrega_status);
DROP FUNCTION IF EXISTS public.fn_valida_transicao_coleta(public.coleta_status, public.coleta_status);
