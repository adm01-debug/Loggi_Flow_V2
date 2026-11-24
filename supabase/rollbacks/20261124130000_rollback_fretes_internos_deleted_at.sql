-- Rollback da migration 20261124130000_fretes_internos_deleted_at (etapa 055 do plano).
-- Aplicar somente depois de a etapa 057 sair do ar: com código ainda lendo/escrevendo
-- deleted_at, a coluna derrubada gera erro em toda leitura de fretes internos.

ALTER TABLE public.fretes_internos
  DROP COLUMN IF EXISTS deleted_at;