# 3.10 — NegotiationAssistant '12% abaixo' fixo

- **Origem**: seção 3 (SIMULADO) da auditoria 2026-11-20.
- **O que é falso**: `src/components/freight/NegotiationAssistant.tsx` exibia '12% abaixo da média mensal' fixo, sem referência real; botão 'Argumentos' sem efeito.
- **Estado real**: NÃO havia média mensal persistida; o '12%' era inventado. Havia valores reais de cotações respondidas na consulta atual (`respondidas`), não utilizados.
- **Camadas**: front (componente de cotação).
- **Aceite**: comparar apenas com referência real ou mostrar estado honesto; sem percentual fixo; zero warnings novos.
- **Status**: CONCLUÍDO em 2026-11-21 via PR #235 (commit `e7cd1b44`).
- **Resolução**: o componente recebe nova prop `averageValue` (média real dos valores das cotações respondidas da consulta atual, calculada em `CotacaoMultiCanal`). `percentBelow` calcula a economia real; quando o melhor valor não fica abaixo da média, o texto diz "é a melhor oferta desta consulta"; sem respondidas, "é a melhor oferta disponível neste momento". Nenhum percentual é fabricado.
- **Evidência**: `npx tsc --noEmit` limpo; eslint dos 3 arquivos com 0 erros/0 warnings; `node scripts/check-warning-budget.mjs` OK (104/105); CI completa verde; deploy de produção confirmado em `e7cd1b44` ("Deployment has completed").
