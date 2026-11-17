-- Conferencia de coleta grava o peso aferido na recepcao, mas a coluna nunca
-- existiu no banco: todo UPDATE de PickupConference.tsx falhava com 42703.
ALTER TABLE public.coletas
  ADD COLUMN IF NOT EXISTS peso_efetivo numeric;

COMMENT ON COLUMN public.coletas.peso_efetivo IS 'Peso aferido na conferencia de recebimento (kg).';