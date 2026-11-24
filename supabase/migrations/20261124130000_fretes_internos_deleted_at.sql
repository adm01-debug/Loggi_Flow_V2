-- Migration: 20261124130000_fretes_internos_deleted_at
-- Etapa 055 do docs/qa/04-PLANO.md (achado D-02 em docs/qa/03-ACHADOS.md).
--
-- Contexto: src/pages/FretesInternos.tsx faz DELETE de verdade no frete, contra a política de
-- exclusão lógica documentada em docs/SOFT_DELETE_POLICY.md. A correção da tela (etapa 057)
-- depende desta coluna, que hoje existe apenas em clientes, coletas, entregas, fornecedores e
-- transportadoras. Conferido no banco ao vivo em 2026-11-24 (information_schema.columns):
-- public.fretes_internos tem 13 colunas e NÃO tem deleted_at.
--
-- Nulo = não excluído, por isso sem NOT NULL e sem DEFAULT. ADD COLUMN de coluna nula não
-- reescreve a tabela e não pede lock longo. Sem índice: a tabela tem 500 linhas no máximo por
-- consulta da tela e o plano não prevê índice nesta etapa.

ALTER TABLE public.fretes_internos
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;