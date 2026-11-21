# 3.25 — predict-delays fator clima é rótulo

- **Origem**: seção 3 (SIMULADO) da auditoria 2026-11-20.
- **O que era falso**: supabase/functions/predict-delays/index.ts:188 fator "clima" era só rótulo pedido ao LLM, sem dados reais.
- **Correção (PR #251)**: o select de entregas agora inclui latitude/longitude; antes do prompt, getWeatherForRoutes agrega clima real por coordenada e injeta clima real nos DADOS do LLM; fallback honesto "Clima não avaliado" quando sem coords, secret ausente ou request falha.
- **Verificação**: deno check do index.ts com mesma contagem de erros pré-existentes que o HEAD (7); nenhum introduzido; npm run lint 0 errors 103 warnings budget 105.
- **Status**: CONCLUÍDO (2026-11-21)
