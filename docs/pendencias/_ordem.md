# Ordem de execução — backlog pendencias Loggi Flow V2

Fonte: docs/audit/2026-11-20_funcionalidades_nao_implementadas.md (PR #206).
Estado do main auditado: 08d5a138 (após merges #206-#210, 2026-11-20).
Backlog completo (164 itens) consolidado na PR #225 (Fase 1 do GOAL).

## Fase A — Itens QUEBRADOS (seção 2) que alteram dado/mentem ao usuário

ENCERRADA. Feitos via #207/#208 (2.1-2.4), #211/#212 (2.5-2.10, 2.12, 2.14, 2.16), #215 (2.11, 2.13, 2.15). 02-05/02-06 atualizados como resolvidos com evidência.

## Fase B — Simulações exibidas como dado real (seção 3) — PRÓXIMA

Maior impacto ao usuário: a UI mostra como real algo que é simulado localmente.

1. 03-19 cotacao-api-simulada (CotacaoMultiCanal insert local)
2. 03-20 dashboard-cotacoes-simula (botao "Simular Resposta WA" + retentativa fake)
3. 03-13 cinematichud-telemetria-fixa (SAT_LOCK/HDOP/coords fixas)
4. 03-01 dora-metrics-literal / 03-02 postmortem-literal / 03-03 systempulse-fixo / 03-04 livestatusbar-ping / 03-05 logisticsmapwidget-kpis
5. 03-06 missiondetail-timeline / 03-07 biometric-scan / 03-08 alertspanel-latencia / 03-09 nexuscoverage-fixo / 03-10 negotiation-fixo
6. 03-11 a 03-18 e 03-21 a 03-30 (detalhe por arquivo)

Regra: nenhuma destas pode inserir linha em tabela real com dados simulados. Alternativas: medir de verdade, marcar UX como "demo", ou persistir parametro/config quando fizer sentido.

## Fase C — Botões/telas sem efeito (seção 4)

04-01 configuracoes-frete-estatico · 04-02 configuracoes-security · 04-03 profile-statico · 04-04 api-documentation · 04-05 botoes-sem-handler · 04-06 rotas-404 · 04-07 mapas-sem-markers · 04-08 deep-link · 04-09 estados-erro-ausentes. Registro geral: 04-SECAO4-geral.

## Fase D — Integrações parciais (seção 5)

05-01 a 05-14 (Bitrix24, Lalamove, Rodonaves, Melhor Envio, WhatsApp, push, e-mail, Mapbox, OpenWeather, external-db-bridge, carrier-webhook, ingestão, secrets, VITE_BITRIX24_WEBHOOK). Verificar o que existe e completar o fluxo real.

## Fase E — Automação (seção 6)

06-01 motor-regras · 06-02 webhooks-saida · 06-03 relatorios-agendados · 06-04 feature-flags · 06-05 alerta-regressao · 06-06 auto-cura · 06-07 preferencias-notificacao · 06-08 agendamento-cache · 06-09 contexto-ia.

## Fase F — Segurança (seção 7: MFA feito nº209, restante)

07-01 mfa-2fa (conferir efeito) · 07-02 passkeys · 07-03 matriz-permissoes · 07-05 gestao-sessoes · 07-06 functions-sem-auth · 07-07 hmac-opcional · 07-08 cors-prod · 07-09 rate-limiting · 07-10 timeout-circuit-breaker · 07-11 check-password-breach · 07-12 health-sem-auth · 07-13 heartbeat · 07-14 mcp-exec · 07-15 sec-definer · 07-16 user-ranks-anon · 07-17 validacao-payload · 07-18 env-versionado · 07-19 csp · 07-20 login-social.

## Fase G — Gamificação (seção 8)

08-01 streak · 08-02 conquistas-ranking · 08-04 loja-recompensas · 08-05 hook-duplicado · 08-06 componentes-gamificacao · 08-07 notificacao-conquista.

## Fase H — Banco (seção 9)

09-01 rpcs-sem-consumidor · 09-02 tabelas-sem-ref · 09-03 performance-metrics · 09-04 realtime-sem-publication · 09-05 maquina-estados · 09-06 soft-delete · 09-07 migrations-sem-rollback · 09-08 crons-duplicados · 09-09 carrier-performance · 09-10 freight-mappings · 09-11 zod-compartilhado · 09-12 query-keys · 09-13 seed · 09-14 dicionario-dados · 09-15 aplicacao-migration.

## Fase I — Observabilidade (seção 10)

10-01 slos · 10-02 sentry-webvitals · 10-03 error-events · 10-04 alerta-rollback · 10-05 runbooks-infra · 10-06 restore-drill · 10-07 staging · 10-08 functions-obs · 10-09 logging-estruturado · 10-10 densidade.

## Fase J — Qualidade/CI (seção 11)

11-01 testes-espelho · 11-02 teste-rls · 11-03 smoke-deno · 11-04 size-limit · 11-05 deps-circulares · 11-06 max-lines · 11-07 warning-budget · 11-08 e2e (specs preservados, workflow removido) · 11-09 codeowners · 11-10 config-morta · 11-11 functions-sem-teste · 11-12 magic-bytes.

## Fase K — Docs e contexto (seções 1, 12-16)

1.1-1.24 (AUSENTE — hooks/componentes/tabelas documentados e inexistentes; conferir antes de executar para separar doc-falsa de codigo-falta). 12-16 registrados em contexto (não geram backlog falso). 02-05/02-06 e _regras-de-negocio revisados.
