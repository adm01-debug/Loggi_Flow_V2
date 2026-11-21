# 3.9 — NexusCoverageMap usa SAMPLE_DATA fixo

- **Origem**: seção 3 (SIMULADO) da auditoria 2026-11-20.
- **O que é falso**: `src/components/freight/NexusCoverageMap.tsx` exibia mapa de cobertura com SAMPLE_DATA fixo (4 praças inventadas e transportadoras fictícias).
- **Estado real**: havia dados reais em `transportadora_rotas` (rotas ativas, RLS pública) com join `transportadoras (nome_fantasia)`, não usados.
- **Camadas**: front (componente de cotação).
- **Aceite**: malha de praças derivada das rotas ativas do banco, com loading/erro/vazio honestos; zero warnings novos.
- **Status**: CONCLUÍDO em 2026-11-21 via PR #233 (commit `a1e670f7`).
- **Resolução**: o mapa consulta `transportadora_rotas` (filtro `ativo = true`) com embedding `transportadora:transportadoras (nome_fantasia)`, agrega praças por UF com cidades e transportadoras únicas (via função pura `collectPracas`), e renderiza somente UFs com rota ativa. Estados de loading (spinner), erro (alerta) e vazio (nenhuma rota ativa) são explícitos; mapa vazio não exibe UFs fantasmas.
- **Evidência**: `npx tsc --noEmit` limpo; eslint dos 2 arquivos com 0 erros/0 warnings; `node scripts/check-warning-budget.mjs` OK (104/105); CI completa verde; deploy de produção confirmado em `a1e670f7` ("Deployment has completed").
