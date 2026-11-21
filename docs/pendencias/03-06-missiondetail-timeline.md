# 3.6 — MissionDetail mockTimeline

- **Origem**: seção 3 (SIMULADO) da auditoria 2026-11-20.
- **O que é falso**: `src/components/dashboard/MissionDetail.tsx` exibia timeline sintética por status (mockTimeline), além de dados fabricados ("Agente Nexus Alpha", "Agora mesmo", "Status: Ativo").
- **Estado real**: QUANDO HAVIA eventos reais em `shipment.events`, a timeline não os usava; o campo já existia mas o hook sempre o preenchia como `[]`.
- **Camadas**: front (componente de dashboard).
- **Aceite**: exibir apenas dados reais (eventos do rastreio) ou estado honesto; sem datas/eventos fabricados; zero warnings novos.
- **Status**: CONCLUÍDO em 2026-11-21 via PR #231 (commit `24dbf919`).
- **Resolução**: a timeline agora é derivada dos eventos reais de `shipment.events` (quando existirem), ordenados por data. Sem eventos, exibe snapshot honesto do estado real (Status Atual via `statusLabel`, Entrega Efetivada via `dataEfetiva`, Previsão via `previsao`) com legenda clara de que o histórico em tempo real aparecerá quando eventos estiverem disponíveis. Dados fabricados do bloco Bitrix ("Agente Nexus Alpha", "Agora mesmo", "Status: Ativo") foram substituídos por estado honesto (—/Sync: Manual), pois não havia fonte.
- **Evidência**: `npx tsc --noEmit` limpo; eslint dos 2 arquivos com 0 erros/0 warnings novos; `npm run lint:budget` OK (104/105); CI completa verde; deploy de produção confirmado em `24dbf919` ("Deployment has completed").
