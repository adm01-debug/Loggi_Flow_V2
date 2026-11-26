-- O ID do SPA de Ocorrencias no Bitrix24 era literal na edge function
-- (bitrix24-integration/index.ts); as outras duas SPAs ja estavam em
-- business_rules_config desde 2026-08-13. A funcao agora le as tres chaves e
-- usa o literal apenas como ultimo recurso, entao esta linha liga a terceira
-- ao painel de regras sem mudar o valor em uso.
INSERT INTO public.business_rules_config (key, value, description)
VALUES ('bitrix_spa_ocorrencias_id', '"1050"', 'ID SPA de Ocorrencias no Bitrix24')
ON CONFLICT (key) DO NOTHING;
